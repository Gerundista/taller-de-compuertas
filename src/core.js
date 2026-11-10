/* ================= NÚCLEO LÓGICO (sin DOM) ================= */
const VARS = ['A', 'B', 'C', 'D'];

const GATES = [
  { id: 'AND',  label: 'AND',      kind: 'and', bubble: false, ic: { 2: '74LS08', 3: '74LS11', 4: '74LS21' }, f: b => b.every(x => x === 1) },
  { id: 'NAND', label: 'NAND',     kind: 'and', bubble: true,  ic: { 2: '74LS00', 3: '74LS10', 4: '74LS20' }, f: b => !b.every(x => x === 1) },
  { id: 'OR',   label: 'OR',       kind: 'or',  bubble: false, ic: { 2: '74LS32', 3: 'CD4075', 4: 'CD4072' }, f: b => b.some(x => x === 1) },
  { id: 'NOR',  label: 'NOR',      kind: 'or',  bubble: true,  ic: { 2: '74LS02', 3: '74LS27', 4: 'CD4002' }, f: b => !b.some(x => x === 1) },
  { id: 'XOR',  label: 'XOR',      kind: 'xor', bubble: false, ic: { 2: '74LS86', 3: '74LS280', 4: '74LS280' }, f: b => b.reduce((a, x) => a ^ x, 0) === 1 },
  { id: 'XNOR', label: 'XNOR',     kind: 'xor', bubble: true,  ic: { 2: '74LS266', 3: '74LS280', 4: '74LS280' }, f: b => b.reduce((a, x) => a ^ x, 0) === 0 },
  { id: 'NOTA', label: 'NOT A',    kind: 'buf', bubble: true,  use: 0, ic: { 2: '74LS04', 3: '74LS04', 4: '74LS04' }, f: b => b[0] === 0 },
  { id: 'NOTB', label: 'NOT B',    kind: 'buf', bubble: true,  use: 1, ic: { 2: '74LS04', 3: '74LS04', 4: '74LS04' }, f: b => b[1] === 0 },
  { id: 'BUFA', label: 'Buffer A', kind: 'buf', bubble: false, use: 0, ic: { 2: '74LS07', 3: '74LS07', 4: '74LS07' }, f: b => b[0] === 1 },
  { id: 'BUFB', label: 'Buffer B', kind: 'buf', bubble: false, use: 1, ic: { 2: '74LS07', 3: '74LS07', 4: '74LS07' }, f: b => b[1] === 1 },
];
const GATE = Object.fromEntries(GATES.map(g => [g.id, g]));
const icOf = (g, n) => g.ic[n];

const rnd = k => Math.floor(Math.random() * k);
const pick = a => a[rnd(a.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function bitsOf(m, n) { const b = []; for (let i = 0; i < n; i++) b.push((m >> (n - 1 - i)) & 1); return b; }
const mstr = (m, n) => m.toString(2).padStart(n, '0');
const truthOfGate = (g, n) => Array.from({ length: 1 << n }, (_, m) => g.f(bitsOf(m, n)) ? 1 : 0);

function gateAST(g, n) {
  const vs = Array.from({ length: n }, (_, i) => ({ t: 'var', i }));
  switch (g.id) {
    case 'AND': return { t: 'and', xs: vs };
    case 'NAND': return { t: 'not', a: { t: 'and', xs: vs } };
    case 'OR': return { t: 'or', xs: vs };
    case 'NOR': return { t: 'not', a: { t: 'or', xs: vs } };
    case 'XOR': return { t: 'xor', xs: vs };
    case 'XNOR': return { t: 'not', a: { t: 'xor', xs: vs } };
    case 'NOTA': return { t: 'not', a: vs[0] };
    case 'NOTB': return { t: 'not', a: vs[1] };
    case 'BUFA': return vs[0];
    case 'BUFB': return vs[1];
  }
}

function evalAST(a, m, n) {
  switch (a.t) {
    case 'var': return (m >> (n - 1 - a.i)) & 1;
    case 'const': return a.v;
    case 'not': return 1 - evalAST(a.a, m, n);
    case 'and': return a.xs.every(x => evalAST(x, m, n) === 1) ? 1 : 0;
    case 'or': return a.xs.some(x => evalAST(x, m, n) === 1) ? 1 : 0;
    case 'xor': return a.xs.reduce((s, x) => s ^ evalAST(x, m, n), 0);
  }
}
const truthOfAST = (a, n) => Array.from({ length: 1 << n }, (_, m) => evalAST(a, m, n));

function flat(a) {
  if (a.t === 'and' || a.t === 'or' || a.t === 'xor') {
    const xs = [];
    for (const x of a.xs) { const f = flat(x); if (f.t === a.t) xs.push(...f.xs); else xs.push(f); }
    return { t: a.t, xs };
  }
  if (a.t === 'not') return { t: 'not', a: flat(a.a) };
  return a;
}
function usedVars(a, s = new Set()) {
  if (a.t === 'var') s.add(a.i); else if (a.t === 'not') usedVars(a.a, s); else if (a.xs) a.xs.forEach(x => usedVars(x, s));
  return s;
}
function countLeaves(a) { if (a.t === 'var' || a.t === 'const') return 1; if (a.t === 'not') return countLeaves(a.a); return a.xs.reduce((s, x) => s + countLeaves(x), 0); }

/* ---------- cubos (implicantes) ---------- */
function cubeMins(c) { let r = [0]; for (const ch of c) { if (ch === '-') r = r.flatMap(v => [v * 2, v * 2 + 1]); else r = r.map(v => v * 2 + (ch === '1' ? 1 : 0)); } return r; }
function lits(c) { let k = 0; for (const ch of c) if (ch !== '-') k++; return k; }
function contains(p, c) { for (let i = 0; i < p.length; i++) if (p[i] !== '-' && p[i] !== c[i]) return false; return true; }
function allCubes(n) { let r = ['']; for (let i = 0; i < n; i++) r = r.flatMap(s => [s + '0', s + '1', s + '-']); return r; }
function primeImplicants(S, n) {
  const imps = allCubes(n).filter(c => cubeMins(c).every(m => S.has(m)));
  const set = new Set(imps);
  return imps.filter(c => { for (let i = 0; i < n; i++) if (c[i] !== '-' && set.has(c.slice(0, i) + '-' + c.slice(i + 1))) return false; return true; });
}
const cubeKey = c => c.replace(/-/g, '2');
const byCube = (a, b) => { const x = cubeKey(a), y = cubeKey(b); return x < y ? -1 : x > y ? 1 : 0; };
function cubeFromSet(ms, n) {
  if (!ms.length) return null;
  let c = '';
  for (let i = 0; i < n; i++) { const s = new Set(ms.map(m => (m >> (n - 1 - i)) & 1)); c += s.size === 2 ? '-' : String([...s][0]); }
  const mins = cubeMins(c);
  if (mins.length !== ms.length) return null;
  const S = new Set(ms);
  return mins.every(m => S.has(m)) ? c : null;
}

/* Minimización exacta (Quine–McCluskey + búsqueda de cobertura mínima).
   target 'sop' agrupa los 1; 'pos' agrupa los 0 (implicantes de F negada). */
const _minCache = new Map();
function minimize(truth, n, target = 'sop') {
  const key = target + n + truth.join('');
  if (_minCache.has(key)) return _minCache.get(key);
  const want = target === 'pos' ? 0 : 1;
  const set = []; truth.forEach((v, m) => { if (v === want) set.push(m); });
  const P = primeImplicants(new Set(set), n).map(c => ({ c, mins: cubeMins(c), l: lits(c) }));
  let best = [], bestCost = set.length ? Infinity : 0;
  const rec = (sel, cov, cost) => {
    let tm = -1, opts = null;
    for (const m of set) if (!cov.has(m)) { const o = P.filter(p => p.mins.includes(m)); if (!opts || o.length < opts.length) { opts = o; tm = m; } }
    if (tm < 0) { if (cost < bestCost) { bestCost = cost; best = sel.slice(); } return; }
    if (cost + 100 >= bestCost) return;
    for (const p of opts) { const nc = new Set(cov); p.mins.forEach(x => nc.add(x)); sel.push(p); rec(sel, nc, cost + 100 + p.l); sel.pop(); }
  };
  if (set.length) rec([], new Set(), 0);
  const res = { target: target === 'pos' ? 'pos' : 'sop', set, primes: P.map(p => p.c), cover: best.map(p => p.c).sort(byCube), cost: bestCost };
  _minCache.set(key, res);
  return res;
}

/* ---------- presentación de expresiones ---------- */
function negHTML(x, nt, compound) { return nt === 'bar' ? `<span class="ov">${x}</span>` : (compound ? `(${x})'` : `${x}'`); }
function litHTML(i, neg, nt) { return neg ? negHTML(VARS[i], nt, false) : VARS[i]; }
function cubeProdHTML(c, nt) { let s = ''; for (let i = 0; i < c.length; i++) if (c[i] !== '-') s += litHTML(i, c[i] === '0', nt); return s || '1'; }
/* factor suma a partir de un cubo de F negada: bit 1 -> variable negada, bit 0 -> variable directa */
function cubeSumHTML(c, nt, paren = true) {
  const ls = []; for (let i = 0; i < c.length; i++) if (c[i] !== '-') ls.push(litHTML(i, c[i] === '1', nt));
  if (!ls.length) return '0';
  return ls.length > 1 && paren ? '(' + ls.join(' + ') + ')' : ls.join(' + ');
}
const T = s => `<span class="t">${s}</span>`;
const joinTerms = arr => arr.map(T).join(' + ');
function sopFromCover(cover, nt, wrap) { if (!cover.length) return '0'; return cover.map((c, i) => (wrap || T)(cubeProdHTML(c, nt), i)).join(' + '); }
function posFromCover(cover, nt, wrap) { if (!cover.length) return '1'; return cover.map((c, i) => (wrap || T)(cubeSumHTML(c, nt, cover.length > 1), i)).join(''); }
const stripTags = s => s.replace(/<[^>]+>/g, '');

const PREC = { or: 1, xor: 2, and: 3, not: 4, var: 5, const: 5 };
function astHTML(a, nt, pp = 0) {
  let s;
  switch (a.t) {
    case 'var': return VARS[a.i];
    case 'const': return String(a.v);
    case 'not': {
      if (nt === 'bar') return `<span class="ov">${astHTML(a.a, nt, 0)}</span>`;
      const simple = a.a.t === 'var' || a.a.t === 'const' || a.a.t === 'not';
      return simple ? astHTML(a.a, nt, 4) + "'" : '(' + astHTML(a.a, nt, 0) + ")'";
    }
    case 'and': s = a.xs.map(x => astHTML(x, nt, 3)).join(''); break;
    case 'or': s = a.xs.map(x => x.t === 'xor' ? '(' + astHTML(x, nt, 0) + ')' : astHTML(x, nt, 1)).join(' + '); break;
    case 'xor': s = a.xs.map(x => astHTML(x, nt, 2)).join(' ⊕ '); break;
  }
  return PREC[a.t] < pp ? '(' + s + ')' : s;
}

/* ---------- lector de expresiones del alumno ---------- */
function perr(msg) { const e = new Error(msg); e.user = true; return e; }
function tokenize(src, n) {
  const s = src.replace(/^\s*[fF]\s*(\([^)]*\))?\s*=\s*/, '');
  const out = [];
  for (const ch of s) {
    if (/\s/.test(ch)) continue;
    const vi = VARS.indexOf(ch.toUpperCase());
    if (vi >= 0) {
      if (vi >= n) throw perr(`Con ${n} entradas solo se usan las variables ${VARS.slice(0, n).join(', ')}.`);
      out.push({ t: 'var', i: vi, s: ch }); continue;
    }
    if (ch === '0' || ch === '1') { out.push({ t: 'const', v: +ch, s: ch }); continue; }
    if ('(['.includes(ch)) { out.push({ t: 'lp', s: ch }); continue; }
    if (')]'.includes(ch)) { out.push({ t: 'rp', s: ch }); continue; }
    if ("'’‘´`′̅̄".includes(ch)) { out.push({ t: 'post', s: "'" }); continue; }
    if ('!~¬'.includes(ch)) { out.push({ t: 'not', s: ch }); continue; }
    if ('+|∨'.includes(ch)) { out.push({ t: 'or', s: ch }); continue; }
    if ('*·•&∧.×'.includes(ch)) { out.push({ t: 'and', s: ch }); continue; }
    if ('^⊕'.includes(ch)) { out.push({ t: 'xor', s: ch }); continue; }
    throw perr(`No reconozco el símbolo “${ch}”.`);
  }
  return out;
}
function parse(src, n) {
  const tk = tokenize(src, n);
  if (!tk.length) throw perr('Escribe una expresión.');
  let i = 0;
  const peek = () => tk[i];
  const startsAtom = t => t && (t.t === 'var' || t.t === 'const' || t.t === 'lp' || t.t === 'not');
  function pOr() { const xs = [pXor()]; while (peek() && peek().t === 'or') { i++; xs.push(pXor()); } return xs.length > 1 ? { t: 'or', xs } : xs[0]; }
  function pXor() { const xs = [pAnd()]; while (peek() && peek().t === 'xor') { i++; xs.push(pAnd()); } return xs.length > 1 ? { t: 'xor', xs } : xs[0]; }
  function pAnd() { const xs = [pUn()]; while (peek() && (peek().t === 'and' || startsAtom(peek()))) { if (peek().t === 'and') i++; xs.push(pUn()); } return xs.length > 1 ? { t: 'and', xs } : xs[0]; }
  function pUn() { if (peek() && peek().t === 'not') { i++; return { t: 'not', a: pUn() }; } let a = pAtom(); while (peek() && peek().t === 'post') { i++; a = { t: 'not', a }; } return a; }
  function pAtom() {
    const t = tk[i++];
    if (!t) throw perr('La expresión termina antes de tiempo: falta una variable después del último operador.');
    if (t.t === 'var') return { t: 'var', i: t.i };
    if (t.t === 'const') return { t: 'const', v: t.v };
    if (t.t === 'lp') { const e = pOr(); const r = tk[i++]; if (!r || r.t !== 'rp') throw perr('Falta cerrar un paréntesis.'); return e; }
    if (t.t === 'rp') throw perr('Hay un paréntesis de cierre de más o un paréntesis vacío.');
    if (t.t === 'post') throw perr("El apóstrofo va después de una variable o de un paréntesis, por ejemplo A' o (AB)'.");
    throw perr(`Falta una variable antes de “${t.s}”.`);
  }
  const e = pOr();
  if (i < tk.length) { const t = tk[i]; throw perr(t.t === 'rp' ? 'Sobra un paréntesis de cierre.' : `No esperaba “${t.s}” en esa posición.`); }
  return flat(e);
}

function litOf(x) { if (x.t === 'var') return { i: x.i, neg: false }; if (x.t === 'not' && x.a.t === 'var') return { i: x.a.i, neg: true }; return null; }
/* Lee una expresión de dos niveles: SOP (outer or / inner and) o POS (outer and / inner or) */
function twoLevel(ast, outer, inner) {
  const a = flat(ast);
  if (a.t === 'const') {
    const neutral = outer === 'or' ? 0 : 1;              // 0 = suma vacía, 1 = producto vacío
    return a.v === neutral ? [] : [[]];
  }
  const groups = a.t === outer ? a.xs : [a];
  const out = [];
  for (const g of groups) {
    const fs = g.t === inner ? g.xs : [g];
    const ls = [];
    for (const f of fs) { const l = litOf(f); if (!l) return null; ls.push(l); }
    out.push(ls);
  }
  return out;
}
function cubeFromLits(ls, n, kind) {
  const c = Array(n).fill('-'); let contra = false, dup = false;
  for (const { i, neg } of ls) {
    const want = kind === 'prod' ? (neg ? '0' : '1') : (neg ? '1' : '0');
    if (c[i] === '-') c[i] = want; else if (c[i] === want) dup = true; else contra = true;
  }
  return { c: c.join(''), contra, dup, nl: ls.length };
}

/* Revisa la respuesta escrita: equivalencia, forma pedida y si es mínima */
function analyze(src, n, truth, target) {
  let ast;
  try { ast = parse(src, n); } catch (e) { if (e.user) return { level: 'error', msg: e.message }; throw e; }
  const ut = truthOfAST(ast, n);
  const opt = minimize(truth, n, target);
  const missing = [], extra = [];
  ut.forEach((v, m) => { if (truth[m] === 1 && v === 0) missing.push(m); else if (truth[m] === 0 && v === 1) extra.push(m); });
  if (missing.length || extra.length) return { level: 'wrong', ast, missing, extra, opt };
  const kind = target === 'sop' ? 'prod' : 'sum';
  const tl = target === 'sop' ? twoLevel(ast, 'or', 'and') : twoLevel(ast, 'and', 'or');
  if (!tl) return { level: 'form', ast, opt };
  const cubes = tl.map(ls => cubeFromLits(ls, n, kind));
  const cost = cubes.length * 100 + cubes.reduce((a, c) => a + c.nl, 0);
  if (cost <= opt.cost) {
    const same = cubes.map(c => c.c).sort(byCube).join() === opt.cover.join();
    return { level: 'ok', ast, opt, cubes, same };
  }
  const hints = [];
  const count = {}; cubes.forEach(c => { count[c.c] = (count[c.c] || 0) + 1; });
  const told = new Set();
  cubes.forEach(cb => {
    if (cb.contra) { hints.push({ type: 'contra' }); return; }
    if (cb.dup) hints.push({ type: 'dup', c: cb.c });
    if (count[cb.c] > 1) { if (!told.has(cb.c)) { told.add(cb.c); hints.push({ type: 'repeat', c: cb.c }); } return; }
    const bigger = opt.primes.filter(p => p !== cb.c && contains(p, cb.c)).sort((a, b) => lits(a) - lits(b));
    if (bigger.length) hints.push({ type: 'grow', c: cb.c, to: bigger[0] });
  });
  cubes.forEach((cb, idx) => {
    if (cb.contra || count[cb.c] > 1) return;
    const others = new Set();
    cubes.forEach((o, j) => { if (j !== idx && !o.contra) cubeMins(o.c).forEach(m => others.add(m)); });
    if (cubeMins(cb.c).every(m => others.has(m))) hints.push({ type: 'redundant', c: cb.c });
  });
  return { level: 'notmin', ast, opt, cubes, cost, hints };
}

/* Revisa grupos dibujados en el mapa (cada grupo = lista de minterms) */
function analyzeGroups(groups, n, truth, target) {
  const opt = minimize(truth, n, target);
  const T = new Set(opt.set);
  const items = groups.map(g => {
    const c = cubeFromSet(g, n);
    const it = { c, issues: [] };
    if (!c) { it.issues.push('shape'); return it; }
    if (g.some(m => !T.has(m))) { it.issues.push('bad'); return it; }
    const bigger = opt.primes.filter(p => p !== c && contains(p, c)).sort((a, b) => lits(a) - lits(b));
    if (bigger.length) { it.issues.push('grow'); it.to = bigger[0]; }
    return it;
  });
  const usable = it => it.c && !it.issues.includes('bad') && !it.issues.includes('shape');
  const cov = new Set(); items.forEach(it => { if (usable(it)) cubeMins(it.c).forEach(m => cov.add(m)); });
  const uncovered = opt.set.filter(m => !cov.has(m));
  items.forEach((it, idx) => {
    if (!usable(it)) return;
    const others = new Set();
    items.forEach((o, j) => { if (j !== idx && usable(o)) cubeMins(o.c).forEach(m => others.add(m)); });
    if (cubeMins(it.c).every(m => others.has(m))) it.issues.push('redundant');
  });
  const allClean = items.every(it => it.c && !it.issues.length) && !uncovered.length;
  const litsUser = items.reduce((a, it) => a + (it.c ? lits(it.c) : 0), 0);
  const litsOpt = opt.cover.reduce((a, c) => a + lits(c), 0);
  return { items, uncovered, opt, allClean, ok: allClean && groups.length === opt.cover.length && litsUser === litsOpt };
}

/* Simplificación algebraica paso a paso a partir de la cobertura mínima */
function derivation(truth, n, target, nt) {
  const opt = minimize(truth, n, target);
  const Fl = target === 'sop' ? 'F' : negHTML('F', nt, false);
  const mt = m => cubeProdHTML(mstr(m, n), nt);
  const ov = x => negHTML(x, nt, false);
  const pre = [];
  if (target === 'pos') {
    pre.push({ eq: `${Fl} = Σm(${opt.set.join(', ')})`, law: `Para la POS se agrupan los 0 de F. Esos 0 son los 1 de ${Fl} (F negada), así que primero simplificamos ${Fl}.` });
  } else {
    pre.push({ eq: `F = Σm(${opt.set.join(', ')})`, law: 'Suma canónica: un minterm por cada fila de la tabla donde F = 1.' });
  }
  pre.push({ eq: `${Fl} = ${joinTerms(opt.set.map(mt))}`, law: '' });
  const uses = {}; opt.cover.forEach(c => cubeMins(c).forEach(m => { uses[m] = (uses[m] || 0) + 1; }));
  const groups = opt.cover.map(c => {
    const mins = cubeMins(c).sort((a, b) => a - b);
    const free = []; for (let i = 0; i < n; i++) if (c[i] === '-') free.push(i);
    const term = cubeProdHTML(c, nt);
    const common = term === '1' ? '' : term;
    const lines = [];
    if (!free.length) {
      lines.push({ eq: T(term), law: 'Celda sola: no tiene vecinos con el mismo valor, así que el término se queda completo.' });
    } else {
      const combos = mins.map(m => { const full = mstr(m, n); return cubeProdHTML([...full].map((ch, i) => c[i] === '-' ? ch : '-').join(''), nt); });
      const pairs = free.map(i => `(${litHTML(i, true, nt)} + ${litHTML(i, false, nt)})`).join('');
      lines.push({ eq: joinTerms(mins.map(mt)), law: '' });
      if (free.length === 1) {
        lines.push({ eq: `= ${common}${pairs}`, law: `Factor común (distributiva): XY + X${ov('Y')} = X(${ov('Y')} + Y).` });
      } else {
        lines.push({ eq: `= ${common}(${joinTerms(combos)})`, law: 'Factor común (distributiva): se saca lo que se repite en todos los términos.' });
        lines.push({ eq: `= ${common}${pairs}`, law: `Lo que queda adentro son todas las combinaciones de ${free.map(i => VARS[i]).join(', ')}; por distributiva es un producto de sumas.` });
      }
      lines.push({ eq: common ? `= ${common}·1 = ${T(term)}` : '= 1', law: `Complemento: ${ov('X')} + X = 1. Identidad: X·1 = X.` });
    }
    return { c, mins, term, lines };
  });
  const shared = Object.keys(uses).filter(m => uses[m] > 1).map(Number).sort((a, b) => a - b);
  const post = [];
  if (shared.length) post.push({ eq: '', law: `${shared.length === 1 ? 'La celda' : 'Las celdas'} ${shared.map(m => 'm' + m).join(', ')} ${shared.length === 1 ? 'se usa' : 'se usan'} en más de un grupo. Es válido: por idempotencia X + X = X, repetir un minterm no cambia F.` });
  const sop = sopFromCover(opt.cover, nt);
  post.push({ eq: `${Fl} = ${sop}`, law: target === 'sop' ? 'Se suman los términos de todos los grupos: esta es la SOP mínima.' : `Esta es la forma mínima de ${Fl}.` });
  if (target === 'pos') {
    post.push({ eq: `F = ${negHTML(sop, nt, true)}`, law: 'Se niegan ambos lados para regresar a F.' });
    post.push({ eq: `F = ${posFromCover(opt.cover, nt)}`, law: 'De Morgan: la negación de una suma es el producto de las negaciones, y la de un producto es la suma de las negaciones.' });
  }
  return { opt, pre, groups, post };
}

/* ---------- geometría del mapa de Karnaugh (código Gray) ---------- */
function kLayout(n) {
  const g2 = [0, 1], g4 = [0, 1, 3, 2];
  if (n === 2) return { rows: 2, cols: 2, rowVars: 'A', colVars: 'B', rowCodes: g2, colCodes: g2, rb: 1, cb: 1 };
  if (n === 3) return { rows: 2, cols: 4, rowVars: 'A', colVars: 'BC', rowCodes: g2, colCodes: g4, rb: 1, cb: 2 };
  return { rows: 4, cols: 4, rowVars: 'AB', colVars: 'CD', rowCodes: g4, colCodes: g4, rb: 2, cb: 2 };
}
const cellMin = (L, r, c) => (L.rowCodes[r] << L.cb) | L.colCodes[c];
function runs(idx) { const r = []; for (const i of idx) { if (r.length && r[r.length - 1][1] === i - 1) r[r.length - 1][1] = i; else r.push([i, i]); } return r; }
function groupPieces(c, n) {
  const L = kLayout(n);
  const rp = c.slice(0, L.rb), cp = c.slice(L.rb);
  const match = (code, bits, pat) => [...mstr(code, bits)].every((ch, i) => pat[i] === '-' || pat[i] === ch);
  const rows = [...Array(L.rows).keys()].filter(r => match(L.rowCodes[r], L.rb, rp));
  const cols = [...Array(L.cols).keys()].filter(k => match(L.colCodes[k], L.cb, cp));
  const rr = runs(rows), cr = runs(cols);
  const rw = rr.length === 2, cw = cr.length === 2;
  const ps = [];
  for (const [r0, r1] of rr) for (const [c0, c1] of cr)
    ps.push({ r0, r1, c0, c1, oT: rw && r0 === 0, oB: rw && r1 === L.rows - 1, oL: cw && c0 === 0, oR: cw && c1 === L.cols - 1 });
  return ps;
}

/* ---------- ejercicios aleatorios ---------- */
function randomTruth(n) {
  const N = 1 << n;
  for (;;) {
    const t = Array.from({ length: N }, () => Math.random() < 0.5 ? 1 : 0);
    const s = t.reduce((a, b) => a + b, 0);
    if (s >= (n > 2 ? 2 : 1) && s <= N - (n > 2 ? 2 : 1)) return t;
  }
}
function randLeaf(n) { const v = { t: 'var', i: rnd(n) }; return Math.random() < 0.35 ? { t: 'not', a: v } : v; }
function randNode(n, d) {
  if (d <= 0) return randLeaf(n);
  const op = pick(['and', 'or', 'and', 'or', 'xor', 'nand', 'nor']);
  const k = Math.random() < 0.2 && n >= 3 ? 3 : 2;
  const vs = shuffle([...Array(n).keys()]);
  let xs = Array.from({ length: k }, (_, j) => {
    if (Math.random() < 0.35 || d === 1 && Math.random() < 0.5) { const v = { t: 'var', i: vs[j % n] }; return Math.random() < 0.35 ? { t: 'not', a: v } : v; }
    return randNode(n, d - 1);
  });
  const isLeaf = x => x.t === 'var' || x.t === 'not' && x.a.t === 'var';
  const vi = x => x.t === 'var' ? x.i : x.a.i;
  xs = [...xs.filter(isLeaf).sort((a, b) => vi(a) - vi(b)), ...xs.filter(x => !isLeaf(x))];
  if (op === 'nand') return { t: 'not', a: { t: 'and', xs } };
  if (op === 'nor') return { t: 'not', a: { t: 'or', xs } };
  return { t: op, xs };
}
/* ordena las hojas de cada nodo por variable (A antes que B…) para que se lea natural */
function tidy(a) {
  if (a.t === 'not') return { t: 'not', a: tidy(a.a) };
  if (!a.xs) return a;
  const xs = a.xs.map(tidy);
  const isLeaf = x => x.t === 'var' || x.t === 'not' && x.a.t === 'var';
  const vi = x => x.t === 'var' ? x.i : x.a.i;
  return { t: a.t, xs: [...xs.filter(isLeaf).sort((p, q) => vi(p) - vi(q)), ...xs.filter(x => !isLeaf(x))] };
}
/* descarta subexpresiones constantes o hermanos repetidos (p. ej. BB' o A + A) */
function degenerate(a, n) {
  if (a.t === 'var' || a.t === 'const') return false;
  if (a.t === 'not') return degenerate(a.a, n);
  const tts = a.xs.map(x => truthOfAST(x, n).join(''));
  if (new Set(tts).size < tts.length) return true;
  const own = truthOfAST(a, n); const s = own.reduce((x, y) => x + y, 0);
  if (s === 0 || s === own.length) return true;
  return a.xs.some(x => degenerate(x, n));
}
function randomExpr(n, simplify = false) {
  const needVars = n === 2 ? 2 : 3;
  for (let tries = 0; tries < 600; tries++) {
    const a = tidy(flat(randNode(n, n === 4 ? 3 : 2)));
    if (a.t === 'var' || a.t === 'not' && a.a.t === 'var') continue;
    const leaves = countLeaves(a);
    if (leaves < 3 || leaves > 7) continue;
    if (usedVars(a).size < needVars) continue;
    if (degenerate(a, n)) continue;
    const t = truthOfAST(a, n), s = t.reduce((x, y) => x + y, 0);
    if (s === 0 || s === t.length) continue;
    if (simplify) {
      const o = minimize(t, n, 'sop'); const tl = twoLevel(a, 'or', 'and');
      if (tl && tl.length * 100 + tl.reduce((x, l) => x + l.length, 0) <= o.cost) continue;
    }
    return a;
  }
  return { t: 'or', xs: [{ t: 'and', xs: [{ t: 'var', i: 0 }, { t: 'not', a: { t: 'var', i: 1 } }] }, { t: 'and', xs: [{ t: 'var', i: 0 }, { t: 'var', i: n - 1 }] }] };
}
