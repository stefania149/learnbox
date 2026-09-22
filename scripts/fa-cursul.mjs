/**
 * Unealta de generare a cursurilor livrate — pasul 12. Rulează la autor,
 * niciodată în browser.
 *
 * Un curs livrat se scrie o dată, cu un model puternic, se verifică de om și
 * se comite în repo (`PLAN.md` §6). Unealta asta e drumul dintre „vreau un
 * capitol despre X" și un fișier din `public/cursuri/` despre care se știe că
 * se ține.
 *
 *   node --experimental-strip-types scripts/fa-cursul.mjs cerere python
 *   node --experimental-strip-types scripts/fa-cursul.mjs primeste python
 *   npm run continut:verifica python
 *
 * `cerere` adună briefingul autorului (`cursuri-sursa/<cheie>.md`) cu regulile
 * casei (`scripts/curs/cerere.md`) și scrie cererea de dus la model.
 * `primeste` ia răspunsul, îi calculează cheile, îl trece prin validatorul
 * aplicației și îl așază în `public/cursuri/`. Python adevărat rulează abia la
 * `continut:verifica` — altfel unealta ar porni Pyodide și pentru o virgulă.
 *
 * **Modelul nu e chemat de aici.** Cererea se duce de mână, răspunsul se aduce
 * de mână. Costă zero, nu cere nicio cheie în repo, și lasă autorul să vadă ce
 * a ieșit înainte să atingă ceva. Vezi `PLAN.md` Î-19.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  citesteCurs,
  EroareFormat,
  FORMAT,
  LIMBAJ_IMPLICIT,
  LIMBAJE,
  VERSIUNE,
} from "../lib/continut/format.ts";

const radacina = join(dirname(fileURLToPath(import.meta.url)), "..");
const SURSE = join(radacina, "cursuri-sursa");
const LIVRATE = join(radacina, "public", "cursuri");
const SABLON = join(radacina, "scripts", "curs", "cerere.md");

/**
 * Motorul se scrie în brief, pe un rând al lui: `Motor: sql`. Fără rândul
 * ăsta e Python, ca toate briefingurile scrise înainte să existe al doilea.
 */
function motorulDinBrief(brief) {
  const gasit = brief.match(/^Motor:\s*([a-z]+)\s*$/mu);
  const limbaj = gasit ? gasit[1] : LIMBAJ_IMPLICIT;
  if (!LIMBAJE.includes(limbaj)) {
    throw new Oprire(
      `„${limbaj}" nu e un motor cunoscut (${LIMBAJE.join(", ")})`,
    );
  }
  return limbaj;
}

/** Câte cuvinte din enunț intră în cheia unui exercițiu. */
const CUVINTE_IN_CHEIE = 6;

class Oprire extends Error {}

/**
 * Text → bucată de cheie: fără diacritice, litere mici, cratime.
 * Aceleași reguli ca `CHEIE` din `lib/continut/format.ts`.
 */
function slug(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cheia unui exercițiu: tipul, plus primele cuvinte ale enunțului. */
function cheieExercitiu(tip, enunt) {
  const inceput = String(enunt).trim().split(/\s+/).slice(0, CUVINTE_IN_CHEIE);
  return slug(`${tip} ${inceput.join(" ")}`);
}

/** Aceeași cheie de două ori într-un părinte primește un număr la coadă. */
function unicizatorul() {
  const vazute = new Set();
  return (propusa, unde) => {
    if (propusa === "") throw new Oprire(`${unde}: n-am din ce face o cheie`);
    let c = propusa;
    for (let n = 2; vazute.has(c); n++) c = `${propusa}-${n}`;
    vazute.add(c);
    return c;
  };
}

/** Codul din editor se termină cu linie nouă; briefingul, nu. */
function cod(text) {
  const t = String(text).replace(/\r\n/g, "\n");
  return t === "" || t.endsWith("\n") ? t : `${t}\n`;
}

function text(v) {
  return typeof v === "string" ? v.replace(/\r\n/g, "\n") : v;
}

/**
 * Răspunsul modelului, adus la forma din `format.ts`: cheile calculate unde
 * lipsesc, câmpurile în ordine fixă, ca diferențele dintre două generări să se
 * poată citi. Ce nu înțelege trece mai departe neatins — validatorul se plânge
 * el, cu locul scris.
 */
/** Testul unei lecții sau al unui capitol, cu cheile calculate unde lipsesc. */
function testul(brut, slugTitlu, unde) {
  if (brut === undefined) return {};
  if (typeof brut !== "object" || brut === null) {
    throw new Oprire(`${unde}: testul nu e un obiect`);
  }

  const chei = unicizatorul();
  return {
    test: {
      cheie: brut.cheie ?? `test-${slugTitlu}`,
      titlu: text(brut.titlu),
      intrebari: (brut.intrebari ?? []).map((i, k) => ({
        cheie:
          i.cheie ??
          chei(slug(String(i.intrebare ?? "")), `${unde}, întrebarea ${k + 1}`),
        intrebare: text(i.intrebare),
        variante: (i.variante ?? []).map(text),
        corect: i.corect,
        explicatie: text(i.explicatie),
      })),
    },
  };
}

function normalizeaza(brut) {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) {
    throw new Oprire("răspunsul nu e un obiect JSON");
  }

  const cheiCapitole = unicizatorul();

  return {
    format: brut.format ?? FORMAT,
    versiune: brut.versiune ?? VERSIUNE,
    materie: text(brut.materie),
    limbaj: brut.limbaj ?? LIMBAJ_IMPLICIT,
    capitole: (brut.capitole ?? []).map((cap, i) => {
      const undeCap = `capitolul ${i + 1}`;
      const cheiNiveluri = unicizatorul();
      const cheieCap =
        cap.cheie ?? cheiCapitole(slug(String(cap.nume ?? "")), undeCap);
      return {
        cheie: cheieCap,
        nume: text(cap.nume),
        ...testul(cap.test, cheieCap, undeCap),
        niveluri: (cap.niveluri ?? []).map((niv, j) => {
          const undeNiv = `${undeCap}, lecția ${j + 1}`;
          const cheiExercitii = unicizatorul();
          const cheieNiv =
            niv.cheie ?? cheiNiveluri(slug(String(niv.nume ?? "")), undeNiv);
          return {
            cheie: cheieNiv,
            nume: text(niv.nume),
            ...testul(niv.test, cheieNiv, undeNiv),
            briefing: (niv.briefing ?? []).map((ec) => ({
              titlu: text(ec.titlu),
              text: text(ec.text),
              ...(ec.cod === undefined ? {} : { cod: text(ec.cod) }),
            })),
            exercitii: (niv.exercitii ?? []).map((ex, k) => ({
              cheie:
                ex.cheie ??
                cheiExercitii(
                  cheieExercitiu(ex.tip ?? "", ex.enunt ?? ""),
                  `${undeNiv}, exercițiul ${k + 1}`,
                ),
              tip: ex.tip,
              enunt: text(ex.enunt),
              codInitial: cod(ex.codInitial ?? ""),
              solutie: cod(ex.solutie ?? ""),
              cazuriTest: (ex.cazuriTest ?? []).map((c) => ({
                apel: text(c.apel),
                ...(c.pregatire === undefined
                  ? {}
                  : { pregatire: text(c.pregatire) }),
                ...(c.verificare === undefined
                  ? {}
                  : { verificare: text(c.verificare) }),
                asteptat: text(c.asteptat),
              })),
              explicatiePredefinita: text(ex.explicatiePredefinita),
            })),
          };
        }),
      };
    }),
  };
}

/**
 * Ce cere `CLAUDE.md` și `PLAN.md` peste ce cere formatul. Formatul spune că
 * un exercițiu are cazuri de test; aici se cere să aibă trei. Se strâng toate
 * plângerile, nu se cade la prima: autorul vrea lista întreagă dintr-un drum.
 */
function plangeri(curs) {
  const gasite = [];
  for (const cap of curs.capitole) {
    gasite.push(...plangeriTest(cap.test, `${cap.nume} → testul capitolului`));
    for (const niv of cap.niveluri) {
      const undeNiv = `${cap.nume} → ${niv.nume}`;
      gasite.push(...plangeriTest(niv.test, `${undeNiv} → testul lecției`));
      if (niv.briefing.length === 0) {
        gasite.push(`${undeNiv}: n-are niciun ecran de briefing.`);
      }
      for (const ex of niv.exercitii) {
        const unde = `${undeNiv} → ${ex.enunt.slice(0, 50)}…`;
        if (ex.cazuriTest.length < 3) {
          gasite.push(`${unde}: are doar ${ex.cazuriTest.length} cazuri.`);
        }
        if (ex.codInitial.trim() === ex.solutie.trim()) {
          gasite.push(`${unde}: codul de pornire e chiar soluția.`);
        }
        if (ex.tip === "completeaza" && !ex.codInitial.includes("___")) {
          gasite.push(`${unde}: e „completeaza", dar n-are niciun gol „___".`);
        }
        // La SQL, `asteptat` e o listă de rânduri scrisă ca JSON. Dacă nu e,
        // niciun caz n-ar avea cum să treacă, oricât de bună ar fi soluția.
        if (curs.limbaj === "sql") {
          for (const caz of ex.cazuriTest) {
            if (!esteListaDeRanduri(caz.asteptat)) {
              gasite.push(
                `${unde}\n    cazul „${caz.apel}": „${caz.asteptat}" nu e o listă de rânduri.`,
              );
            }
          }
        }
      }
    }
  }
  return gasite;
}

/** Ce se cere unui test peste ce cere formatul. */
function plangeriTest(t, unde) {
  const gasite = [];
  if (!t) return gasite;

  if (t.intrebari.length < 2) {
    gasite.push(`${unde}: are o singură întrebare.`);
  }
  for (const i of t.intrebari) {
    const scurt = `${unde} → ${i.intrebare.slice(0, 40)}…`;
    if (new Set(i.variante).size !== i.variante.length) {
      gasite.push(`${scurt}: are două variante identice.`);
    }
    // O explicație care doar repetă varianta corectă nu învață pe nimeni.
    if (i.explicatie.trim() === i.variante[i.corect].trim()) {
      gasite.push(`${scurt}: explicația e chiar varianta corectă.`);
    }
  }
  return gasite;
}

/** `[["Ana",5000],["Ion",2500]]` — o listă de liste, nimic altceva. */
function esteListaDeRanduri(text) {
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) && v.every((r) => Array.isArray(r));
  } catch {
    return false;
  }
}

/** Toate cheile cursului, ca să se vadă care s-au pierdut între două generări. */
function cheile(curs) {
  const chei = new Set();
  for (const cap of curs.capitole) {
    chei.add(cap.cheie);
    for (const niv of cap.niveluri) {
      chei.add(`${cap.cheie}/${niv.cheie}`);
      for (const ex of niv.exercitii) {
        chei.add(`${cap.cheie}/${niv.cheie}/${ex.cheie}`);
      }
    }
  }
  return chei;
}

async function faCererea(cheie) {
  const briefing = join(SURSE, `${cheie}.md`);
  if (!existsSync(briefing)) {
    throw new Oprire(
      `n-am găsit briefingul \`cursuri-sursa/${cheie}.md\`. ` +
        "Scrie-l întâi: ce materie, ce capitol, ce lecții, pentru cine.",
    );
  }

  const brief = (await readFile(briefing, "utf8")).trim();
  const limbaj = motorulDinBrief(brief);

  // Regulile de format sunt altele la fiecare motor: `repr` și cazuri cu
  // `apel` la Python, rânduri și `pregatire` la SQL. Partea comună e una
  // singură, ca să nu se despartă în tăcere.
  const cerere = (await readFile(SABLON, "utf8"))
    .replace("__LIMBAJ__", limbaj)
    .replace(
      "__FORMAT__",
      (await readFile(join(dirname(SABLON), `format-${limbaj}.md`), "utf8")).trim(),
    )
    .replace("__BRIEF__", brief);

  const ramas = cerere.match(/__(?:LIMBAJ|FORMAT|BRIEF)__/)?.[0];
  if (ramas) {
    throw new Oprire(`șablonul: marcajul ${ramas} n-a fost înlocuit`);
  }

  const iesire = join(SURSE, `${cheie}.cerere.txt`);
  await writeFile(iesire, cerere, "utf8");

  const kb = (Buffer.byteLength(cerere, "utf8") / 1024).toFixed(1);
  console.log(`cerere: cursuri-sursa/${cheie}.cerere.txt, ${limbaj}, ${kb} KB.`);
  console.log(
    "Du-o la un model puternic, pune răspunsul în " +
      `cursuri-sursa/${cheie}.raspuns.json, apoi:\n` +
      `  npm run curs:primeste ${cheie}`,
  );
}

/** Modelele îmbracă JSON-ul în garduri sau în vorbe. Se ia de la prima acoladă. */
function desfaJson(brut) {
  const inceput = brut.indexOf("{");
  const sfarsit = brut.lastIndexOf("}");
  if (inceput === -1 || sfarsit < inceput) {
    throw new Oprire("n-am găsit niciun obiect JSON în răspuns");
  }
  try {
    return JSON.parse(brut.slice(inceput, sfarsit + 1));
  } catch (e) {
    throw new Oprire(`răspunsul nu e JSON valid: ${e.message}`);
  }
}

async function primesteRaspunsul(cheie, argumente) {
  const dinLinie = argumente.find((a) => !a.startsWith("--"));
  const sursa = dinLinie
    ? resolve(radacina, dinLinie)
    : join(SURSE, `${cheie}.raspuns.json`);
  if (!existsSync(sursa)) {
    throw new Oprire(
      `n-am găsit răspunsul \`${dinLinie ?? `cursuri-sursa/${cheie}.raspuns.json`}\``,
    );
  }

  const curs = normalizeaza(desfaJson(await readFile(sursa, "utf8")));

  // Poarta e validatorul aplicației, nu o copie a lui: dacă trece aici, trece
  // și în browser.
  let verificat;
  try {
    verificat = citesteCurs(curs);
  } catch (e) {
    if (e instanceof EroareFormat) throw new Oprire(e.message);
    throw e;
  }

  const gasite = plangeri(verificat);
  if (gasite.length > 0) {
    console.error(`\n${gasite.length} lucruri de reparat în răspuns:\n`);
    for (const p of gasite) console.error(`  - ${p}`);
    throw new Oprire("cursul n-a fost scris. Cere modelul din nou, cu lista de mai sus.");
  }

  // Cheile sunt promisiunea pasului 11: un exercițiu rescris rămâne același
  // exercițiu. O cheie care dispare înseamnă încercări orfane în bazele
  // oamenilor, deci se oprește aici până se spune anume că e în regulă.
  const tinta = join(LIVRATE, `${cheie}.json`);
  if (existsSync(tinta) && !argumente.includes("--accepta-chei-pierdute")) {
    const vechi = cheile(citesteCurs(JSON.parse(await readFile(tinta, "utf8"))));
    const acum = cheile(verificat);
    const pierdute = [...vechi].filter((c) => !acum.has(c));
    if (pierdute.length > 0) {
      console.error(
        `\n${pierdute.length} chei din cursul de acum nu mai există în răspuns:\n`,
      );
      for (const c of pierdute.slice(0, 20)) console.error(`  - ${c}`);
      if (pierdute.length > 20) console.error(`  … și încă ${pierdute.length - 20}`);
      throw new Oprire(
        "cine a jucat exercițiile alea și-ar pierde încercările. Dacă asta e " +
          "intenția, repetă cu `--accepta-chei-pierdute`.",
      );
    }
  }

  await mkdir(LIVRATE, { recursive: true });
  await writeFile(tinta, `${JSON.stringify(curs, null, 2)}\n`, "utf8");

  const lectii = verificat.capitole.reduce((s, c) => s + c.niveluri.length, 0);
  const exercitii = verificat.capitole.reduce(
    (s, c) => s + c.niveluri.reduce((t, n) => t + n.exercitii.length, 0),
    0,
  );
  const ecrane = verificat.capitole.reduce(
    (s, c) => s + c.niveluri.reduce((t, n) => t + n.briefing.length, 0),
    0,
  );
  console.log(
    `curs: public/cursuri/${cheie}.json — ${verificat.materie}, ` +
      `${verificat.capitole.length} capitole, ${lectii} lecții, ` +
      `${ecrane} ecrane de briefing, ${exercitii} exerciții.`,
  );
  console.log(
    `Formatul se ține. ${verificat.limbaj === "sql" ? "Postgres" : "Python"} ` +
      "adevărat încă n-a rulat peste el:\n" +
      `  npm run continut:verifica ${cheie}`,
  );
}

const [comanda, cheie, ...argumente] = process.argv.slice(2);

try {
  if (comanda === "cerere" && cheie) {
    await faCererea(cheie);
  } else if (comanda === "primeste" && cheie) {
    await primesteRaspunsul(cheie, argumente);
  } else {
    console.error(
      "Unealta de curs livrat:\n" +
        "  fa-cursul.mjs cerere <cheie>              scrie cererea pentru model\n" +
        "  fa-cursul.mjs primeste <cheie> [fișier]   așază răspunsul în public/cursuri/",
    );
    process.exit(2);
  }
} catch (e) {
  if (e instanceof Oprire) {
    console.error(`\n${e.message}`);
    process.exit(1);
  }
  throw e;
}
