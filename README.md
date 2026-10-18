# Wyszukiwarka szkół podstawowych

Statyczna wyszukiwarka szkół podstawowych w Krakowie i Warszawie (Vite + vanilla JS, bez backendu).

- wyszukiwanie po nazwie i adresie (bez względu na polskie znaki),
- filtry: miasto, dzielnica, status, pedagogika, profil językowy, integracja / kształcenie specjalne, wyznaniowa,
- stan filtrów w URL — link otwiera te same wyniki.

## Uruchomienie

```bash
npm install
npm run dev
```

`npm run dev` i `npm run build` najpierw konwertują `data/szkoly.csv` do `public/szkoly.json` (`scripts/csv-to-json.mjs`). Aby zaktualizować dane, podmień CSV i przebuduj.

Każdy push na `main` publikuje stronę na GitHub Pages (`.github/workflows/deploy.yml`).

Dane: Rejestr Szkół i Placówek Oświatowych (RSPO), stan na 18.10.2026. Pedagogika na podstawie nazwy szkoły.
