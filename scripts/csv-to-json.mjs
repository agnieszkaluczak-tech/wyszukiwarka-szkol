// Konwertuje data/szkoly.csv -> public/szkoly.json (uruchamiane przed dev i build).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = new URL('../data/szkoly.csv', import.meta.url);
const OUT = new URL('../public/szkoly.json', import.meta.url);

// Parser CSV zgodny z RFC 4180: pola w cudzysłowach, "" jako escape, przecinki i nowe linie w polach.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

const list = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);
const yes = (v) => v.trim().toLowerCase() === 'tak';
const url = (v) => {
  const s = v.trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

const text = readFileSync(SRC, 'utf8').replace(/^﻿/, '');
const [header, ...data] = parseCsv(text);
const col = (name) => {
  const i = header.indexOf(name);
  if (i === -1) throw new Error(`Brak kolumny "${name}" w CSV`);
  return i;
};

const C = {
  nazwa: col('Nazwa'),
  miasto: col('Miasto'),
  dzielnica: col('Dzielnica'),
  adres: col('Adres'),
  kod: col('Kod pocztowy'),
  status: col('Status'),
  pedagogika: col('Pedagogika'),
  jezykowy: col('Profil językowy'),
  specjalne: col('Integracja / kształcenie specjalne'),
  wyznaniowa: col('Wyznaniowa'),
  inne: col('Inne profile'),
  jezyki: col('Języki nauczane'),
  psycholog: col('Psycholog'),
  pedagog: col('Pedagog'),
  logopeda: col('Logopeda'),
  www: col('WWW'),
  rspo: col('Numer RSPO'),
};

const schools = data.map((r) => ({
  id: r[C.rspo].trim(),
  nazwa: r[C.nazwa].trim(),
  miasto: r[C.miasto].trim(),
  dzielnica: r[C.dzielnica].trim(),
  adres: r[C.adres].trim(),
  kod: r[C.kod].trim(),
  status: r[C.status].trim(),
  pedagogika: list(r[C.pedagogika]),
  jezykowy: list(r[C.jezykowy]),
  specjalne: list(r[C.specjalne]),
  wyznaniowa: list(r[C.wyznaniowa]),
  inne: list(r[C.inne]),
  jezyki: list(r[C.jezyki]),
  psycholog: yes(r[C.psycholog]),
  pedagog: yes(r[C.pedagog]),
  logopeda: yes(r[C.logopeda]),
  www: url(r[C.www]),
}));

mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(OUT, JSON.stringify(schools));
console.log(`szkoly.json: ${schools.length} szkół`);
