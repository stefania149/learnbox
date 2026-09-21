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

const pyodide = await loadPyodide({
  indexURL: new URL("./vendor/pyodide/", self.location.href).href,
  stdout: (linie) => iesire.push({ flux: "stdout", text: linie }),
  stderr: (linie) => iesire.push({ flux: "stderr", text: linie }),
});

self.postMessage({ tip: "pornit", versiune: pyodide.version });

self.onmessage = async (ev) => {
  const { id, cod } = ev.data;
  iesire = [];

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
