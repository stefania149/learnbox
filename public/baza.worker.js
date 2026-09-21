// Firul pe care trăiește baza de date.
//
// Fișier static, neatins de împachetător (vezi scripts/vendor-pglite.mjs).
// `worker()` alege un singur fir „lider" între filele deschise, așa că două
// file nu scriu peste aceeași bază IndexedDB.
import { PGlite } from "./vendor/pglite/index.js";
import { worker } from "./vendor/pglite/worker/index.js";

worker({
  async init() {
    return new PGlite("idb://tutore");
  },
});
