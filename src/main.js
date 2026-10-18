import './style.css';

// Filtry: klucz w URL = nazwa pola formularza. `multi` = pole w danych jest tablicą.
const FILTERS = [
  { key: 'miasto', all: 'Wszystkie miasta' },
  { key: 'dzielnica', all: 'Wszystkie dzielnice' },
  { key: 'status', all: 'Dowolny' },
  { key: 'pedagogika', all: 'Dowolna', multi: true },
  { key: 'jezykowy', all: 'Dowolny', multi: true },
  { key: 'specjalne', all: 'Dowolna', multi: true },
  { key: 'wyznaniowa', all: 'Dowolna', multi: true },
];

const form = document.getElementById('filters');
const qInput = document.getElementById('q');
const countEl = document.getElementById('count');
const resultsEl = document.getElementById('results');
const clearBtn = document.getElementById('clear');
const activeBadge = document.getElementById('active-count');
const select = (key) => form.elements[key];

let schools = [];

const norm = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');

const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const collator = new Intl.Collator('pl');
const uniq = (values) => [...new Set(values)].sort(collator.compare);

function fillSelect(key, values, current) {
  const def = FILTERS.find((f) => f.key === key);
  const el = select(key);
  el.innerHTML =
    `<option value="">${def.all}</option>` +
    values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  el.value = values.includes(current) ? current : '';
}

function districtsFor(city) {
  return uniq(schools.filter((s) => !city || s.miasto === city).map((s) => s.dzielnica).filter(Boolean));
}

function readState() {
  const p = new URLSearchParams(location.search);
  const state = { q: p.get('q') || '' };
  for (const f of FILTERS) state[f.key] = p.get(f.key) || '';
  return state;
}

function currentState() {
  const state = { q: qInput.value.trim() };
  for (const f of FILTERS) state[f.key] = select(f.key).value;
  return state;
}

function writeUrl(state) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) if (v) p.set(k, v);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function matches(s, state, tokens) {
  for (const f of FILTERS) {
    const v = state[f.key];
    if (!v) continue;
    if (f.multi ? !s[f.key].includes(v) : s[f.key] !== v) return false;
  }
  return tokens.every((t) => s._search.includes(t));
}

const tag = (text, mod = '') => `<li class="tag${mod ? ` tag--${mod}` : ''}">${esc(text)}</li>`;
const staff = (label, has) =>
  `<li class="staff ${has ? 'staff--yes' : 'staff--no'}"><span aria-hidden="true">${has ? '✓' : '✗'}</span> ${label}<span class="sr-only">: ${has ? 'jest' : 'brak'}</span></li>`;

function card(s) {
  const tags = [
    tag(s.status, s.status === 'Publiczna' ? 'public' : 'private'),
    ...s.pedagogika.map((t) => tag(t, 'accent')),
    ...s.jezykowy.map((t) => tag(t)),
    ...s.specjalne.map((t) => tag(t, 'green')),
    ...s.wyznaniowa.map((t) => tag(t)),
    ...s.inne.map((t) => tag(t)),
  ].join('');
  const address = [s.adres, [s.kod, s.miasto].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const link = s.www
    ? `<a class="card__link" href="${esc(s.www)}" target="_blank" rel="noopener">Strona szkoły<span class="sr-only"> ${esc(s.nazwa)}</span> →</a>`
    : `<span class="card__nolink">Brak strony WWW</span>`;
  return `<li class="card">
    <h2 class="card__title">${esc(s.nazwa)}</h2>
    <p class="card__addr">${esc(address)}${s.dzielnica ? ` · <span class="card__district">${esc(s.dzielnica)}</span>` : ''}</p>
    <ul class="tags" aria-label="Cechy szkoły">${tags}</ul>
    <ul class="staffs" aria-label="Specjaliści">${staff('Psycholog', s.psycholog)}${staff('Pedagog', s.pedagog)}${staff('Logopeda', s.logopeda)}</ul>
    ${link}
  </li>`;
}

function plural(n) {
  if (n === 1) return 'szkoła';
  const d = n % 10, h = n % 100;
  return d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'szkoły' : 'szkół';
}

function render() {
  const state = currentState();
  writeUrl(state);
  const tokens = norm(state.q).split(/\s+/).filter(Boolean);
  const found = schools.filter((s) => matches(s, state, tokens));

  countEl.textContent = `Znaleziono ${found.length} ${plural(found.length)}`;
  const active = FILTERS.filter((f) => state[f.key]).length + (state.q ? 1 : 0);
  clearBtn.disabled = active === 0;
  activeBadge.hidden = active === 0;
  activeBadge.textContent = active;

  resultsEl.innerHTML = found.length
    ? found.map(card).join('')
    : `<li class="empty">Brak szkół spełniających kryteria. Spróbuj poluzować filtry.</li>`;
}

function applyState(state) {
  qInput.value = state.q;
  for (const f of FILTERS) {
    if (f.key === 'dzielnica') continue;
    const values = uniq(schools.flatMap((s) => (f.multi ? s[f.key] : [s[f.key]])).filter(Boolean));
    fillSelect(f.key, values, state[f.key]);
  }
  fillSelect('dzielnica', districtsFor(select('miasto').value), state.dzielnica);
}

async function init() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}szkoly.json`);
    if (!res.ok) throw new Error(res.statusText);
    schools = await res.json();
  } catch (e) {
    countEl.textContent = 'Nie udało się wczytać danych.';
    return;
  }
  schools.sort((a, b) => collator.compare(a.nazwa, b.nazwa));
  for (const s of schools) s._search = norm([s.nazwa, s.adres, s.kod, s.miasto, s.dzielnica].join(' '));

  // Na małych ekranach filtry zwinięte, chyba że link zawiera aktywne filtry.
  const state = readState();
  if (window.matchMedia('(max-width: 639px)').matches && !FILTERS.some((f) => state[f.key])) {
    document.getElementById('more').open = false;
  }
  applyState(state);
  render();

  let t;
  qInput.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(render, 150);
  });
  form.addEventListener('change', (e) => {
    if (e.target.name === 'miasto') fillSelect('dzielnica', districtsFor(e.target.value), select('dzielnica').value);
    if (e.target.name !== 'q') render();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    render();
  });
  clearBtn.addEventListener('click', () => {
    applyState({ q: '', ...Object.fromEntries(FILTERS.map((f) => [f.key, ''])) });
    render();
    qInput.focus();
  });
}

init();
