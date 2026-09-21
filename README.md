# Tutore

Un joc de învățat, care rulează întreg în browser. Fără server, fără cont, fără
costuri.

- `PLAN.md` — ce construim și de ce.
- `STADIU.md` — unde suntem.
- `CLAUDE.md` — regulile de lucru.

## Dezvoltare

```
npm install
npm run dev     # http://localhost:3000
npm run build   # export static în out/
```

## Publicare

Fiecare push pe `main` construiește exportul static și îl publică pe GitHub
Pages, prin `.github/workflows/publicare.yml`. Calea de bază se ia automat din
numele repo-ului.
