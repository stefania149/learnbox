// Firul pe care rulează Python.
//
// Pyodide nu atinge niciodată firul principal — nici „temporar, ca să văd dacă
// merge". Cine scrie `while True:` blochează firul ăsta, care se omoară și
// repornește; interfața nu simte nimic.
//
// Fișier static, neatins de împachetător (vezi scripts/copiaza-vendor.mjs).
import { loadPyodide } from "./vendor/pyodide/pyodide.mjs";

/** Se umple la fiecare rulare și se golește la începutul următoarei. */
let iesire = [];

/** Rularea în curs. Progresul pe cazuri trebuie să știe cui îi aparține. */
let idCurent = null;

const pyodide = await loadPyodide({
  indexURL: new URL("./vendor/pyodide/", self.location.href).href,
  stdout: (linie) => iesire.push({ flux: "stdout", text: linie }),
  stderr: (linie) => iesire.push({ flux: "stderr", text: linie }),
});

// Motorul de exerciții anunță fiecare caz în momentul în care îl termină, nu la
// final: dacă un caz intră în buclă, cele dinaintea lui sunt deja raportate și
// nu se pierd când firul e omorât.
pyodide.globals.set("raporteaza_caz", (indice, stare, primit) => {
  self.postMessage({
    id: idCurent,
    tip: "progres",
    caz: { indice, stare, primit },
  });
});

self.postMessage({ tip: "pornit", versiune: pyodide.version });

self.onmessage = async (ev) => {
  const { id, cod } = ev.data;
  iesire = [];
  idCurent = id;

  try {
    const rezultat = await pyodide.runPythonAsync(cod);
    self.postMessage({
      id,
      tip: "rezultat",
      iesire,
      // Ultima expresie, dacă a returnat ceva. `repr` ca în consola Python.
      valoare: rezultat === undefined ? null : String(rezultat),
    });
  } catch (e) {
    self.postMessage({
      id,
      tip: "eroare",
      iesire,
      // Mesajul real al Python-ului, cu traceback — nu un rezumat al nostru.
      eroare: e instanceof Error ? e.message : String(e),
    });
  }
};
