/* ================= INTERFAZ ================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pl = (k, a, b) => k === 1 ? a : b;
const store = {
  get(k, d) { try { const v = localStorage.getItem('taller-compuertas.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('taller-compuertas.' + k, JSON.stringify(v)); } catch (e) { } }
};
const TABS = ['aprender', 'tabla', 'mapa', 'algebra', 'examen'];
const SRC_OK = { mapa: ['gate', 'rgate', 'func', 'expr'], algebra: ['gate', 'rgate', 'sum', 'expr'] };
const STATE_KEY = { mapa: 'km', algebra: 'alg' };
function loadStats() {
  const out = { tabla: { ok: 0, tot: 0, racha: 0 }, mapa: { ok: 0, tot: 0, racha: 0 }, algebra: { ok: 0, tot: 0, racha: 0 }, examen: { mejor: null, veces: 0 }, rapida: {}, modos: {} };
  const s = store.get('stats', null);
  if (s && typeof s === 'object') for (const k in out) if (s[k] && typeof s[k] === 'object') Object.assign(out[k], s[k]);
  return out;
}
const S = {
  tab: 'aprender', gate: 'NAND', n: 3, nt: 'bar', inputs: [1, 0, 1, 1], lTgt: 'sop',
  src: { mapa: 'gate', algebra: 'gate' }, tgt: { mapa: 'sop', algebra: 'sop' },
  ttMode: 'llenar', ttSrc: { llenar: 'gate', errores: 'gate' }, tm: {}, ttShuffle: false, circNames: false, rpDur: 60, rpTimer: null,
  stats: loadStats(), km: null, alg: null,
  quiz: { phase: 'start', count: 10, mix: false }, lastRand: null
};
(() => {
  const g = store.get('gate', 'NAND'); if (GATE[g]) S.gate = g;
  const n = store.get('n', 3); if ([2, 3, 4].includes(n)) S.n = n;
  if (store.get('nt', 'bar') === 'prime') S.nt = 'prime';
  const src = store.get('src', null);
  if (src) for (const k in S.src) if (SRC_OK[k].includes(src[k])) S.src[k] = src[k];
  const tm = store.get('ttMode', 'llenar'); if (TT_IDS.includes(tm)) S.ttMode = tm;
  const ts = store.get('ttSrc', null);
  if (ts) for (const k in S.ttSrc) if (TT_SRC[k].some(o => o[0] === ts[k])) S.ttSrc[k] = ts[k];
  S.ttShuffle = store.get('ttShuffle', false) === true;
  S.circNames = store.get('circNames', false) === true;
  const d = store.get('rpDur', 60); if ([30, 60, 120].includes(d)) S.rpDur = d;
})();

/* ---------- piezas gráficas ---------- */
function gateBody(g) {
  let body, outX, inX;
  if (g.kind === 'and') { body = '<path d="M120 40H170A50 50 0 0 1 170 140H120Z"/>'; outX = 220; inX = () => 120; }
  else if (g.kind === 'or') { body = '<path d="M115 40Q165 40 220 90Q165 140 115 140Q140 90 115 40Z"/>'; outX = 220; inX = y => { const t = (y - 40) / 100; return 115 + 50 * t * (1 - t); }; }
  else if (g.kind === 'xor') { body = '<path d="M125 40Q172 40 222 90Q172 140 125 140Q150 90 125 40Z"/><path class="nf" d="M113 40Q138 90 113 140"/>'; outX = 222; inX = y => { const t = (y - 40) / 100; return 113 + 50 * t * (1 - t); }; }
  else { body = '<path d="M132 52L204 90L132 128Z"/>'; outX = 204; inX = () => 132; }
  return { body, outX, inX };
}
function gateMini(g) {
  let { body, outX, inX } = gateBody(g);
  if (g.bubble) { body += `<circle cx="${outX + 9}" cy="90" r="9"/>`; outX += 18; }
  const ins = g.kind === 'buf' ? '<path class="w" d="M98 90H132"/>' : `<path class="w" d="M98 65H${inX(65).toFixed(1)}M98 115H${inX(115).toFixed(1)}"/>`;
  return `<svg class="mini" viewBox="94 34 152 112" aria-hidden="true">${ins}<path class="w o" d="M${outX} 90H244"/>${body}</svg>`;
}
/* símbolo completo: interruptores, cables con nivel lógico y LED de salida */
function gateSVG(g, n, o = {}) {
  const { inputs = null, interactive = false, out = 'show', ic = true } = o;
  const ys = Array.from({ length: n }, (_, i) => 45 + (i + 0.5) * 90 / n);
  let { body, outX, inX } = gateBody(g);
  if (g.bubble) { body += `<circle cx="${outX + 6}" cy="90" r="6"/>`; outX += 12; }
  const val = inputs ? (g.f(inputs.slice(0, n)) ? 1 : 0) : null;
  const W = v => v == null ? 'var(--ink)' : (v ? 'var(--hi)' : 'var(--muted)');
  let wires = '', sw = '';
  ys.forEach((y, i) => {
    const v = inputs ? inputs[i] : null;
    const used = g.kind !== 'buf' || g.use === i;
    if (interactive) {
      sw += `<g class="sw${v ? ' on' : ''}" data-var="${i}" tabindex="0" role="switch" aria-checked="${v ? 'true' : 'false'}" aria-label="Entrada ${VARS[i]}"><rect class="sw-hit" x="1" y="${y - 12}" width="60" height="24" rx="4"/><text class="lbl" x="11" y="${y + 5}" text-anchor="middle">${VARS[i]}</text><rect class="sw-track" x="23" y="${y - 8}" width="30" height="16" rx="8"/><circle class="sw-knob" cx="${v ? 45 : 31}" cy="${y}" r="5.5"/></g>`;
    } else if (inputs) {
      sw += `<text class="lbl" x="14" y="${y + 5}" text-anchor="middle">${VARS[i]}</text><text class="val" x="40" y="${y + 5}" text-anchor="middle">${v}</text>`;
    } else {
      sw += `<text class="lbl" x="38" y="${y + 5}" text-anchor="middle">${VARS[i]}</text>`;
    }
    if (used) {
      const d = g.kind === 'buf' ? `M56 ${y}H100V90H132` : `M56 ${y}H${inX(y).toFixed(1)}`;
      wires += `<path class="w" style="stroke:${W(v)}" d="${d}"/>`;
    } else {
      wires += `<path class="w nc" d="M56 ${y}H84"/><circle class="ncdot" cx="88" cy="${y}" r="3.5"/>`;
    }
  });
  const ov = inputs && out === 'show' ? val : null;
  wires += `<path class="w" style="stroke:${W(ov)}" d="M${outX} 90H283"/>`;
  let led;
  if (out === 'hide') led = '<circle class="led q" cx="296" cy="90" r="13"/><text class="ledt" x="296" y="95" text-anchor="middle">?</text>';
  else if (inputs) led = `<circle class="led${val ? ' on' : ''}" cx="296" cy="90" r="13"/><text class="ledt${val ? ' on' : ''}" x="296" y="95" text-anchor="middle">${val}</text>`;
  else led = '<circle class="led" cx="290" cy="90" r="5"/>';
  const lab = `<text class="lbl" x="${inputs || out === 'hide' ? 296 : 290}" y="${inputs || out === 'hide' ? 67 : 76}" text-anchor="middle">F</text>`;
  const icT = ic ? `<text class="ic" x="168" y="168" text-anchor="middle">${icOf(g, n)}</text>` : '';
  return `<svg class="gate" viewBox="0 0 320 180" role="img" aria-label="Símbolo de la compuerta ${g.label} con ${n} entradas">${wires}<g class="body">${body}</g>${sw}${led}${lab}${icT}</svg>`;
}

function ttView(n, truth, o = {}) {
  const { current = -1, clickable = false, small = false } = o;
  let h = `<table class="tt${small ? ' sm' : ''}"><thead><tr><th class="mi" scope="col">m</th>${VARS.slice(0, n).map(v => `<th scope="col">${v}</th>`).join('')}<th class="fcol" scope="col">F</th></tr></thead><tbody>`;
  for (let m = 0; m < (1 << n); m++) {
    h += `<tr class="${m === current ? 'cur' : ''}${clickable ? ' click' : ''}" data-m="${m}"><td class="mi">${m}</td>${bitsOf(m, n).map(x => `<td>${x}</td>`).join('')}<td class="fcol${truth[m] ? ' on' : ''}">${truth[m]}</td></tr>`;
  }
  return h + '</tbody></table>';
}
function ttEdit(n, user, marks) {
  let h = `<table class="tt"><thead><tr><th class="mi" scope="col">m</th>${VARS.slice(0, n).map(v => `<th scope="col">${v}</th>`).join('')}<th class="fcol" scope="col">F</th></tr></thead><tbody>`;
  for (let m = 0; m < (1 << n); m++) {
    const u = user[m], mk = marks ? marks[m] || '' : '';
    h += `<tr><td class="mi">${m}</td>${bitsOf(m, n).map(x => `<td>${x}</td>`).join('')}<td class="fcol edit"><button type="button" class="fbtn ${u == null ? 'q' : 'v' + u} ${mk}" data-m="${m}" aria-label="F en la fila ${m}: ${u == null ? 'vacía' : u}">${u == null ? '?' : u}</button></td></tr>`;
  }
  return h + '</tbody></table>';
}

function kmapHTML(n, vals, o = {}) {
  const { mode = 'view', groups = [], sel = null, marks = null, cur = -1, small = false, hideIdx = false } = o;
  const L = kLayout(n);
  let cells = '';
  for (let r = 0; r < L.rows; r++) for (let k = 0; k < L.cols; k++) {
    const m = cellMin(L, r, k), v = vals[m];
    const cls = ['kc'];
    if (v === 1) cls.push('on'); if (v == null) cls.push('q');
    if (sel && sel.has(m)) cls.push('sel'); if (marks && marks[m]) cls.push(marks[m]); if (m === cur) cls.push('cur');
    const inner = `${hideIdx || small ? '' : `<span class="ki">${m}</span>`}<span class="kv">${v == null ? '?' : v}</span>`;
    cells += mode === 'view'
      ? `<div class="${cls.join(' ')}" data-m="${m}">${inner}</div>`
      : `<button type="button" class="${cls.join(' ')}" data-m="${m}" aria-label="Celda m${m}, ${v == null ? 'sin llenar' : 'vale ' + v}${sel && sel.has(m) ? ', seleccionada' : ''}">${inner}</button>`;
  }
  let gs = '';
  groups.forEach(g => {
    const inset = small ? 2 + (g.ci % 3) * 2 : 3 + (g.ci % 3) * 4;
    groupPieces(g.c, n).forEach(p => {
      const iL = p.oL ? -7 : inset, iR = p.oR ? -7 : inset, iT = p.oT ? -7 : inset, iB = p.oB ? -7 : inset;
      const st = `--gcol:var(--g${g.ci % 8});left:calc(${p.c0 / L.cols * 100}% + ${iL}px);width:calc(${(p.c1 - p.c0 + 1) / L.cols * 100}% - ${iL + iR}px);top:calc(${p.r0 / L.rows * 100}% + ${iT}px);height:calc(${(p.r1 - p.r0 + 1) / L.rows * 100}% - ${iT + iB}px)`;
      gs += `<div class="kg${p.oL ? ' oL' : ''}${p.oR ? ' oR' : ''}${p.oT ? ' oT' : ''}${p.oB ? ' oB' : ''}" data-gi="${g.ci}" style="${st}"></div>`;
    });
  });
  const corner = `<div class="kcorner"><span class="kcv">${L.colVars}</span><span class="krv">${L.rowVars}</span></div>`;
  const ch = `<div class="kch">${L.colCodes.map(c => `<span>${mstr(c, L.cb)}</span>`).join('')}</div>`;
  const rh = `<div class="krh">${L.rowCodes.map(c => `<span>${mstr(c, L.rb)}</span>`).join('')}</div>`;
  return `<div class="kmap${small ? ' sm' : ''}" style="--rows:${L.rows};--cols:${L.cols}" role="group" aria-label="Mapa de Karnaugh de ${n} variables">${corner}${ch}${rh}<div class="kcells">${cells}<div class="kgroups" aria-hidden="true">${gs}</div></div></div>`;
}

const colorTerm = (s, i) => `<span class="t term c" style="--gcol:var(--g${i % 8})">${s}</span>`;
const formOf = (cover, target, nt, wrap) => target === 'sop' ? sopFromCover(cover, nt, wrap) : posFromCover(cover, nt, wrap);
const termOf = (c, target, nt) => target === 'sop' ? cubeProdHTML(c, nt) : cubeSumHTML(c, nt, false);
const plainForm = (cover, target) => stripTags(formOf(cover, target, 'prime'));

function gateRule(g) {
  return {
    AND: 'Da 1 solo cuando todas las entradas valen 1.',
    NAND: 'Da 0 solo cuando todas las entradas valen 1.',
    OR: 'Da 0 solo cuando todas las entradas valen 0.',
    NOR: 'Da 1 solo cuando todas las entradas valen 0.',
    XOR: 'Da 1 cuando el número de entradas en 1 es impar.',
    XNOR: 'Da 1 cuando el número de entradas en 1 es par (incluido cero).',
    NOTA: 'Entrega A invertida; las demás entradas no importan.',
    NOTB: 'Entrega B invertida; las demás entradas no importan.',
    BUFA: 'Entrega A tal cual; las demás entradas no importan.',
    BUFB: 'Entrega B tal cual; las demás entradas no importan.'
  }[g.id];
}
function shapeRule(g) {
  const base = { and: 'cuerpo en forma de D, como AND', or: 'cuerpo curvo que termina en punta, como OR', xor: 'forma de OR con una curva extra en las entradas, como XOR', buf: 'forma de triángulo' }[g.kind];
  return `tiene ${base}${g.bubble ? ' y una burbuja de negación en la salida' : ''}${g.kind === 'buf' ? `, conectado solo a la entrada ${VARS[g.use]}` : ''}.`;
}
function listY(a) { return a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]; }
function gateNotes(g, n, nt) {
  const vs = VARS.slice(0, n), N = 1 << n, h = N >> 1;
  const L = (i, ng) => litHTML(i, ng, nt), NEG = x => negHTML(x, nt, true);
  const prod = vs.join(''), sum = vs.join(' + ');
  const prodN = vs.map((_, i) => L(i, true)).join(''), sumN = vs.map((_, i) => L(i, true)).join(' + ');
  const xr = vs.join(' ⊕ ');
  switch (g.id) {
    case 'AND': return `<p>F vale 1 solo cuando <b>todas</b> las entradas valen 1. En la tabla hay un único 1 (m${N - 1}); en el mapa esa celda no tiene vecinos con 1, así que el grupo es de una sola celda y la expresión ya es mínima.</p><div class="eq">F = ${prod}</div><p>En POS se agrupan los ${N - 1} ceros con ${n} grupos de ${h} celdas (uno por variable) y sale lo mismo: F = ${prod}.</p>`;
    case 'NAND': return `<p>Es AND con la salida negada. Por De Morgan, la negación de un producto es la suma de las negaciones:</p><div class="eq">F = ${NEG(prod)} = ${sumN}</div><p>Hay ${N - 1} unos y un solo 0 (m${N - 1}). Cada literal negado cubre la mitad del mapa (${h} celdas); con ${n} grupos se cubren todos los unos.</p>`;
    case 'OR': return `<p>F vale 0 solo cuando todas las entradas valen 0 (m0). Cada variable sin negar cubre la mitad del mapa (${h} celdas), así que la SOP mínima tiene ${n} términos de una sola letra:</p><div class="eq">F = ${sum}</div><p>Esa misma expresión es un solo maxterm (M0), por eso también es la POS mínima.</p>`;
    case 'NOR': return `<p>Es OR con la salida negada. Por De Morgan, la negación de una suma es el producto de las negaciones:</p><div class="eq">F = ${NEG(sum)} = ${prodN}</div><p>Solo m0 vale 1, así que el mapa tiene un único 1 sin vecinos.</p>`;
    case 'XOR': return `<p>F vale 1 cuando el número de entradas en 1 es <b>impar</b> (${h} de ${N} filas).</p><div class="eq">F = ${xr}</div><p>En el mapa los unos forman un tablero de ajedrez: dos celdas vecinas difieren en una sola entrada, y eso cambia la paridad. Ningún 1 tiene un 1 al lado, así que no se puede agrupar nada y la SOP mínima tiene ${h} términos de ${n} letras. Por eso XOR tiene su propio símbolo ⊕.</p>${n === 2 ? `<div class="eq">A ⊕ B = ${L(0, true)}B + A${L(1, true)}</div>` : ''}`;
    case 'XNOR': return `<p>Es XOR negada: F vale 1 cuando el número de entradas en 1 es <b>par</b>, incluido el caso de todas en 0.</p><div class="eq">F = ${NEG(xr)}</div><p>Igual que XOR, el mapa es un tablero de ajedrez sin unos vecinos: la SOP mínima tiene ${h} términos de ${n} letras.</p>${n === 2 ? `<p>Con 2 entradas también se le llama compuerta de <b>igualdad</b>: F = 1 cuando A = B.</p><div class="eq">F = ${L(0, true)}${L(1, true)} + AB</div>` : ''}`;
    default: {
      const u = g.use, ng = g.id.startsWith('NOT'), oth = vs.filter((_, i) => i !== u);
      return `<p>${ng ? `La salida es ${VARS[u]} invertida` : `La salida copia ${VARS[u]} sin cambios`}; ${listY(oth)} ${oth.length === 1 ? 'no se conecta y no influye' : 'no se conectan y no influyen'}.</p><div class="eq">F = ${L(u, ng)}</div><p>En el mapa los ${h} unos son justo la mitad donde ${VARS[u]} = ${ng ? 0 : 1} y forman un solo grupo. Dentro de ese grupo ${listY(oth)} ${oth.length === 1 ? 'toma' : 'toman'} todos sus valores, por eso se ${oth.length === 1 ? 'elimina' : 'eliminan'}.</p>`;
    }
  }
}
function stepsHTML(truth, n, target, nt, gateId) {
  const d = derivation(truth, n, target, nt);
  let h = '';
  if (gateId) h += `<div class="route"><h3>Ruta directa</h3>${gateNotes(GATE[gateId], n, nt)}</div>`;
  h += `<div class="route"><h3>Desde el mapa · ${target === 'sop' ? 'SOP, grupos de 1' : 'POS, grupos de 0'}</h3><ol class="steps">`;
  d.pre.forEach(s => { h += `<li><div class="eq">${s.eq}</div>${s.law ? `<div class="law">${s.law}</div>` : ''}</li>`; });
  d.groups.forEach((g, i) => {
    h += `<li class="g" style="--gcol:var(--g${i % 8})"><div class="gtag">Grupo ${i + 1} · m(${g.mins.join(', ')}) · ${g.mins.length} ${pl(g.mins.length, 'celda', 'celdas')}</div>${g.lines.map(l => `<div class="eq">${l.eq}</div>${l.law ? `<div class="law">${l.law}</div>` : ''}`).join('')}</li>`;
  });
  d.post.forEach(s => { h += `<li>${s.eq ? `<div class="eq">${s.eq}</div>` : ''}${s.law ? `<div class="law">${s.law}</div>` : ''}</li>`; });
  return h + '</ol></div>';
}

/* ---------- utilidades de interfaz ---------- */
function setFb(el, f) { el.className = 'fb' + (f ? ' ' + f.kind : ''); el.innerHTML = f ? f.html : ''; }
function segSet(sel, attr, val) { $$(sel + ' button').forEach(b => b.setAttribute('aria-checked', String(b.dataset[attr] === String(val)))); }
function focusSel(sel) { const el = $(sel); if (el) el.focus({ preventScroll: true }); }
function scoreHTML(k) { const s = S.stats[k]; return `Racha <b>${s.racha}</b> · Resueltos <b>${s.ok}</b>/${s.tot}`; }
function scoreEvent(k, ok, mode) {
  const s = S.stats[k]; s.tot++; if (ok) { s.ok++; s.racha++; } else s.racha = 0;
  if (ok && mode) S.stats.modos[mode] = (S.stats.modos[mode] || 0) + 1;
  store.set('stats', S.stats);
}
async function copyText(text, btn) {
  const done = msg => { const o = btn.textContent; btn.textContent = msg; setTimeout(() => { btn.textContent = o; }, 1400); };
  try { await navigator.clipboard.writeText(text); done('Copiado'); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) { }
    ta.remove(); done(ok ? 'Copiado' : 'No se pudo');
  }
}
function randGateId() { let id; do { id = pick(GATES).id; } while (id === S.lastRand); S.lastRand = id; return id; }
function makeProblem(src, n, simplify) {
  if (src === 'gate' || src === 'rgate') { const id = src === 'gate' ? S.gate : randGateId(); const g = GATE[id]; return { src, n, gate: id, ast: gateAST(g, n), truth: truthOfGate(g, n) }; }
  if (src === 'expr') { const ast = randomExpr(n, simplify); return { src, n, gate: null, ast, truth: truthOfAST(ast, n) }; }
  return { src, n, gate: null, ast: null, truth: randomTruth(n) };
}
function onesOf(t) { const r = []; t.forEach((v, m) => { if (v) r.push(m); }); return r; }
function promptHTML(p, mode) {
  const nt = S.nt;
  if (p.gate) {
    const g = GATE[p.gate];
    return `<div class="kicker">Compuerta</div><h2 class="ptitle">${g.label}<small>${p.n} entradas</small></h2>${gateSVG(g, p.n, {})}<div class="ex big center">F = ${astHTML(p.ast, nt)}</div>`;
  }
  if (p.src === 'expr') {
    const tip = mode === 'tabla' ? 'Evalúa fila por fila. Conviene resolver primero lo que está dentro de los paréntesis y las negaciones de grupos.'
      : mode === 'algebra' ? 'Aplica De Morgan para quitar negaciones de grupos, distribuye y luego agrupa. Si te atoras, llena el mapa en una hoja.'
        : 'Primero evalúa la expresión en cada celda del mapa.';
    return `<div class="kicker">${mode === 'algebra' ? 'Simplifica' : 'Expresión'} · ${p.n} variables</div><div class="ex big">F = ${astHTML(p.ast, nt)}</div><p class="hint">${tip}</p>`;
  }
  const ones = onesOf(p.truth);
  if (p.src === 'prod') {
    const zeros = p.truth.map((v, m) => v ? -1 : m).filter(m => m >= 0);
    return `<div class="kicker">Función de ${p.n} variables</div><div class="ex big">F = ΠM(${zeros.join(', ')})</div><p class="hint">ΠM lista los maxterms: las filas de la tabla donde F = 0. En todas las demás F vale 1.</p>`;
  }
  return `<div class="kicker">Función de ${p.n} variables</div><div class="ex big">F = Σm(${ones.join(', ')})</div>${p.src === 'sum' ? `<div class="ex sm">= ${joinTerms(ones.map(m => cubeProdHTML(mstr(m, p.n), nt)))}</div>` : ''}<p class="hint">Σm lista las filas de la tabla donde F = 1; las demás valen 0.${mode === 'algebra' ? ' Busca pares de términos que solo difieren en una variable.' : ''}</p>`;
}
function needNew(tab) {
  const st = S[STATE_KEY[tab]];
  if (!st) return true;
  if (st.p.n !== S.n || st.p.src !== S.src[tab]) return true;
  if (S.src[tab] === 'gate' && st.p.gate !== S.gate) return true;
  return false;
}
function answerFeedback(res, n, target) {
  const nt = S.nt, form = target === 'sop' ? 'suma de productos (SOP)' : 'producto de sumas (POS)';
  const W = target === 'sop' ? 'El término' : 'El factor', w = target === 'sop' ? 'término' : 'factor';
  const tH = c => `<span class="ex inl">${termOf(c, target, nt)}</span>`;
  if (res.level === 'error') return { kind: 'bad', html: `<b>No pude leer la expresión.</b> ${esc(res.msg)}` };
  if (res.level === 'wrong') {
    const rows = [...res.missing.map(m => ({ m, want: 1 })), ...res.extra.map(m => ({ m, want: 0 }))].sort((a, b) => a.m - b.m);
    const k = rows.length;
    return { kind: 'bad', html: `<b>No es equivalente.</b> Falla en ${k} ${pl(k, 'fila', 'filas')} de la tabla:<ul>${rows.slice(0, 4).map(r => `<li><span class="mono">${bitsOf(r.m, n).map((b, i) => VARS[i] + '=' + b).join(' ')}</span> (m${r.m}): tu expresión da ${1 - r.want} y debe dar ${r.want}.</li>`).join('')}</ul>${k > 4 ? `<p>…y ${k - 4} más.</p>` : ''}` };
  }
  if (res.level === 'form') return { kind: 'warn', html: `<b>Es equivalente</b>, pero no está escrita como ${form}. ${target === 'sop' ? "Usa solo sumas de términos producto, por ejemplo <span class=\"mono\">AB' + C</span>." : "Usa solo productos de factores suma, por ejemplo <span class=\"mono\">(A + B)(A' + C)</span>."}` };
  if (res.level === 'notmin') {
    const tl = res.cubes.length, ll = res.cubes.reduce((a, c) => a + c.nl, 0), ot = res.opt.cover.length, ol = res.opt.cover.reduce((a, c) => a + lits(c), 0);
    const items = res.hints.map(h => {
      if (h.type === 'contra') return `Un ${w} tiene una variable junto con su complemento: ${target === 'sop' ? 'siempre vale 0' : 'siempre vale 1'} y sobra.`;
      if (h.type === 'dup') return `${W} ${tH(h.c)} repite una variable (X·X = X).`;
      if (h.type === 'repeat') return `${W} ${tH(h.c)} está repetido (X + X = X).`;
      if (h.type === 'grow') return `${W} ${tH(h.c)} se puede reducir a ${tH(h.to)}: su grupo en el mapa puede crecer.`;
      if (h.type === 'redundant') return `${W} ${tH(h.c)} sobra: sus celdas ya las cubren los demás.`;
      return '';
    }).filter(Boolean);
    if (!items.length) items.push(`Todos tus ${w}s son válidos, pero hay una combinación con menos ${w}s o menos letras.`);
    return { kind: 'warn', html: `<b>Es equivalente, pero todavía se puede simplificar.</b> La tuya tiene ${tl} ${pl(tl, w, w + 's')} y ${ll} ${pl(ll, 'literal', 'literales')}; la mínima tiene ${ot} y ${ol}.<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>` };
  }
  const best = formOf(res.opt.cover, target, nt);
  return { kind: 'ok', html: `<b>¡Correcto y mínimo!</b> ${res.same ? '' : `Otra forma mínima igual de válida: <span class="ex inl">F = ${best}</span>`}` };
}
function exprBox(p, n, value) {
  const keys = [...VARS.slice(0, n).map(v => [v, v]), ["'", "x'", 'Negar (apóstrofo)'], ['+', '+', 'OR'], ['·', '·', 'AND'], ['⊕', '⊕', 'XOR'], ['(', '('], [')', ')']];
  return `<label class="xin-l" for="${p}In">Tu respuesta</label>
  <div class="xin"><span class="xin-f">F =</span><input id="${p}In" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" placeholder="ej. A'B + AC" value="${esc(value)}"></div>
  <div class="prev" id="${p}Prev">${previewHTML(value, n)}</div>
  <div class="keys">${keys.map(k => `<button type="button" data-key="${esc(k[0])}" ${k[2] ? `aria-label="${k[2]}"` : ''}>${k[1]}</button>`).join('')}<button type="button" class="wide" data-key="BS" aria-label="Borrar un carácter">⌫</button><button type="button" class="wide" data-key="CLR">Borrar</button></div>
  <p class="syntax">Escribe <code>A'</code> o <code>!A</code> para negar, <code>AB</code> para AND, <code>+</code> para OR. Ejemplos: <code>A'B + AC</code> · <code>(A + B)(B' + C)</code></p>`;
}
function previewHTML(v, n) {
  if (!v.trim()) return '';
  try { return `<span class="pl">Se lee</span>F = ${astHTML(parse(v, n), S.nt)}`; }
  catch (e) { return `<span class="err">${esc(e.user ? e.message : 'Expresión incompleta.')}</span>`; }
}
function keyPress(p, key, n) {
  const inp = $('#' + p + 'In'); if (!inp) return;
  const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a;
  let v = inp.value, pos = a;
  if (key === 'CLR') { v = ''; pos = 0; }
  else if (key === 'BS') { if (a !== b) { v = v.slice(0, a) + v.slice(b); pos = a; } else if (a > 0) { v = v.slice(0, a - 1) + v.slice(a); pos = a - 1; } }
  else { const ins = key === '+' ? ' + ' : key === '⊕' ? ' ⊕ ' : key; v = v.slice(0, a) + ins + v.slice(b); pos = a + ins.length; }
  inp.value = v; try { inp.setSelectionRange(pos, pos); } catch (e) { }
  inp.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ---------- APRENDER ---------- */
function renderLearn() {
  const g = GATE[S.gate], n = S.n, nt = S.nt, truth = truthOfGate(g, n);
  const inp = S.inputs.slice(0, n), m = inp.reduce((a, b) => a * 2 + b, 0);
  $('#lName').innerHTML = `${g.label}<small>${n} entradas</small>`;
  $('#lIC').textContent = icOf(g, n);
  $('#lSym').innerHTML = gateSVG(g, n, { inputs: inp, interactive: true, ic: false });
  $('#lRead').innerHTML = `<span>${inp.map((b, i) => `${VARS[i]} = <b>${b}</b>`).join(' · ')}</span><span>→ fila m${m} → <b class="${truth[m] ? 'fo' : ''}">F = ${truth[m]}</b></span>`;
  $('#lDirect').innerHTML = `F = ${astHTML(gateAST(g, n), nt)}`;
  const ones = onesOf(truth), zeros = truth.map((v, k) => v ? -1 : k).filter(k => k >= 0);
  $('#lTTmeta').textContent = `${1 << n} filas · ${ones.length} ${pl(ones.length, 'uno', 'unos')} · ${zeros.length} ${pl(zeros.length, 'cero', 'ceros')}`;
  $('#lTT').innerHTML = ttView(n, truth, { current: m, clickable: true });
  segSet('#lTgt', 't', S.lTgt);
  const opt = minimize(truth, n, S.lTgt);
  $('#lKmap').innerHTML = kmapHTML(n, truth, { groups: opt.cover.map((c, i) => ({ c, ci: i })), cur: m });
  $('#lLegend').innerHTML = opt.cover.map((c, i) => `<li data-gi="${i}" tabindex="0" style="--gcol:var(--g${i % 8})"><span class="lt">${termOf(c, S.lTgt, nt)}</span><span class="lm">m(${cubeMins(c).sort((a, b) => a - b).join(', ')}) · ${cubeMins(c).length} ${pl(cubeMins(c).length, 'celda', 'celdas')}</span></li>`).join('');
  const sop = minimize(truth, n, 'sop'), pos = minimize(truth, n, 'pos');
  const wrapS = S.lTgt === 'sop' ? colorTerm : null, wrapP = S.lTgt === 'pos' ? colorTerm : null;
  $('#lExprs').innerHTML = `
    <div class="xr"><dt>Expresión de la compuerta</dt><dd><span class="ex">F = ${astHTML(gateAST(g, n), nt)}</span></dd></div>
    <div class="xr"><dt>Suma canónica (minterms)</dt><dd><div><div class="ex">F = Σm(${ones.join(', ')})</div><div class="ex sm">= ${joinTerms(ones.map(k => cubeProdHTML(mstr(k, n), nt)))}</div></div></dd></div>
    <div class="xr"><dt>Producto canónico (maxterms)</dt><dd><div><div class="ex">F = ΠM(${zeros.join(', ')})</div><div class="ex sm">= ${zeros.map(k => T(cubeSumHTML(mstr(k, n), nt, zeros.length > 1))).join('')}</div></div></dd></div>
    <div class="xr key"><dt>SOP mínima</dt><dd><span class="ex big">F = ${sopFromCover(sop.cover, nt, wrapS)}</span><button type="button" class="copy" data-copy="${esc(plainForm(sop.cover, 'sop'))}">Copiar</button></dd></div>
    <div class="xr key"><dt>POS mínima</dt><dd><span class="ex big">F = ${posFromCover(pos.cover, nt, wrapP)}</span><button type="button" class="copy" data-copy="${esc(plainForm(pos.cover, 'pos'))}">Copiar</button></dd></div>`;
  $('#lSteps').innerHTML = stepsHTML(truth, n, S.lTgt, nt, g.id);
}
function setInputsFromM(m) { bitsOf(m, S.n).forEach((b, i) => { S.inputs[i] = b; }); }

/* ---------- MAPA K ---------- */
function newMapa() {
  const p = makeProblem(S.src.mapa, S.n, false);
  S.km = { p, target: S.tgt.mapa, user: Array(1 << p.n).fill(null), marks: null, step: 1, filled: false, groups: [], sel: new Set(), expr: '', fb: null, counted: false, revealed: false, groupsOk: false, exprOk: false, sol: false };
}
function renderMapa() {
  if (needNew('mapa')) newMapa();
  const st = S.km, p = st.p, n = p.n, nt = S.nt, want = st.target === 'sop' ? 1 : 0;
  $('#kmSrc').value = S.src.mapa; segSet('#kmTgt', 't', st.target);
  $('#kmPrompt').innerHTML = promptHTML(p, 'mapa');
  $('#kmScore').innerHTML = scoreHTML('mapa');
  const ug = st.groups.map((g, i) => ({ c: g.c, ci: i }));
  let hint, map, extra = '', acts;
  if (st.step === 1) {
    hint = 'Toca cada celda para ponerle 1 o 0. El número chico es el minterm (la fila de la tabla). Filas y columnas van en código Gray: entre vecinas solo cambia una variable, por eso el orden es 00, 01, 11, 10.';
    map = kmapHTML(n, st.user, { mode: 'fill', marks: st.marks });
    acts = '<button class="btn primary" type="button" data-act="check1">Revisar mapa</button><button class="btn" type="button" data-act="fill">Llénalo por mí</button>';
  } else if (st.step === 2) {
    hint = `Toca celdas con <b>${want}</b> para seleccionarlas y pulsa <b>Agregar grupo</b>. Un grupo es un rectángulo de 1, 2, 4, 8 o 16 celdas. Los bordes se conectan: la primera columna es vecina de la última y la primera fila de la última. Haz los grupos lo más grandes posible y usa los menos que puedas.`;
    map = kmapHTML(n, p.truth, { mode: 'group', sel: st.sel, groups: ug });
    extra = st.groups.length ? `<ul class="glist">${st.groups.map((g, i) => `<li class="${g.issue || ''}" style="--gcol:var(--g${i % 8})"><span>Grupo ${i + 1}</span><span class="lm">m(${g.mins.slice().sort((a, b) => a - b).join(', ')})</span><button type="button" data-delg="${i}" aria-label="Quitar grupo ${i + 1}">×</button></li>`).join('')}</ul>` : '<p class="hint" style="margin-top:12px">Todavía no hay grupos.</p>';
    acts = `<button class="btn primary" type="button" data-act="addg" ${st.sel.size ? '' : 'disabled'}>Agregar grupo${st.sel.size ? ` (${st.sel.size})` : ''}</button><button class="btn" type="button" data-act="clearsel" ${st.sel.size ? '' : 'disabled'}>Quitar selección</button><button class="btn" type="button" data-act="checkg" ${st.groups.length ? '' : 'disabled'}>Revisar grupos</button><button class="btn ghost" type="button" data-act="solg">Ver grupos de la solución</button>`;
  } else {
    hint = st.target === 'sop'
      ? 'Escribe la suma de productos mínima. Cada grupo de 1 da un término: se quedan las variables que no cambian dentro del grupo (con barra si valen 0) y se eliminan las que cambian.'
      : 'Escribe el producto de sumas mínimo. Cada grupo de 0 da un factor suma: se quedan las variables que no cambian, sin barra si valen 0 y con barra si valen 1.';
    map = kmapHTML(n, p.truth, { groups: ug });
    extra = exprBox('km', n, st.expr);
    acts = '<button class="btn primary" type="button" data-act="checke">Revisar expresión</button><button class="btn ghost" type="button" data-act="sole">Ver solución</button>';
  }
  const steps = [['1', 'Llenar el mapa'], ['2', 'Formar grupos'], ['3', 'Escribir expresión']].map(([s, l]) => {
    const k = +s, done = (k === 1 && st.filled) || (k === 2 && st.groupsOk) || (k === 3 && st.exprOk);
    return `<li><button type="button" data-step="${s}" ${k === st.step ? 'aria-current="step"' : ''} class="${done ? 'done' : ''}" ${k > 1 && !st.filled ? 'disabled' : ''}>${l}</button></li>`;
  }).join('');
  let sol = '';
  if (st.sol) {
    const opt = minimize(p.truth, n, st.target);
    sol = `<details class="more" open><summary>Solución paso a paso</summary><div class="ex big">F = ${formOf(opt.cover, st.target, nt, colorTerm)}</div>${stepsHTML(p.truth, n, st.target, nt, p.gate)}</details>`;
  }
  $('#kmWork').innerHTML = `<ol class="stepper" aria-label="Pasos">${steps}</ol><p class="hint">${hint}</p><div class="kbox" id="kmMap">${map}</div>${extra}<div class="actions">${acts}</div><div class="fb ${st.fb ? st.fb.kind : ''}" role="status" aria-live="polite">${st.fb ? st.fb.html : ''}</div>${sol}`;
}
const KM = {
  check1() {
    const st = S.km, t = st.p.truth; let bad = 0, empty = 0;
    st.marks = st.user.map((v, m) => { if (v == null) { empty++; return ''; } if (v !== t[m]) { bad++; return 'bad'; } return 'ok'; });
    if (empty) st.fb = { kind: 'warn', html: `Te ${pl(empty, 'falta', 'faltan')} ${empty} ${pl(empty, 'celda', 'celdas')} por llenar.${bad ? ` Y hay ${bad} ${pl(bad, 'equivocada', 'equivocadas')}.` : ''}` };
    else if (bad) st.fb = { kind: 'bad', html: `Hay ${bad} ${pl(bad, 'celda equivocada', 'celdas equivocadas')}. Recuerda que el orden de las columnas es Gray (00, 01, 11, 10): el número chico de cada celda te dice qué fila de la tabla es.` };
    else { st.filled = true; st.marks = null; st.step = 2; st.fb = { kind: 'ok', html: '<b>Mapa correcto.</b> Ahora forma los grupos.' }; }
  },
  fill() { const st = S.km; st.user = st.p.truth.slice(); st.marks = null; st.filled = true; st.step = 2; st.fb = null; },
  addg() {
    const st = S.km, n = st.p.n, want = st.target === 'sop' ? 1 : 0, ms = [...st.sel];
    const c = cubeFromSet(ms, n);
    if (!c) { st.fb = { kind: 'bad', html: `<b>Ese grupo no es válido.</b> Debe ser un rectángulo de 1, 2, 4, 8 o 16 celdas (con ${ms.length} celdas ${[1, 2, 4, 8, 16].includes(ms.length) ? 'la forma no es un rectángulo o no son vecinas' : 'no se puede: el tamaño tiene que ser potencia de 2'}).` }; return; }
    const badc = ms.filter(m => st.p.truth[m] !== want);
    if (badc.length) { st.fb = { kind: 'bad', html: `<b>El grupo incluye ${pl(badc.length, 'una celda', 'celdas')} con ${1 - want}:</b> ${badc.sort((a, b) => a - b).map(m => 'm' + m).join(', ')}. ${st.target === 'sop' ? 'En SOP solo se agrupan unos.' : 'En POS solo se agrupan ceros.'}` }; return; }
    if (st.groups.some(g => g.c === c)) { st.fb = { kind: 'warn', html: 'Ese grupo ya existe.' }; return; }
    st.groups.push({ c, mins: ms }); st.groups.forEach(g => { g.issue = ''; }); st.sel.clear(); st.fb = null; st.groupsOk = false;
  },
  clearsel() { S.km.sel.clear(); },
  checkg() {
    const st = S.km, r = analyzeGroups(st.groups.map(g => g.mins), st.p.n, st.p.truth, st.target);
    st.groups.forEach((g, i) => { const is = r.items[i].issues; g.issue = is.includes('bad') || is.includes('shape') ? 'bad' : is.length ? 'warn' : ''; });
    if (r.ok) { st.groupsOk = true; st.fb = { kind: 'ok', html: `<b>¡Agrupación mínima!</b> ${r.opt.cover.length} ${pl(r.opt.cover.length, 'grupo', 'grupos')}. Pasa al paso 3 y escribe la expresión.` }; return; }
    const li = [];
    if (r.uncovered.length) li.push(`Faltan por cubrir: ${r.uncovered.map(m => 'm' + m).join(', ')}.`);
    r.items.forEach((it, i) => {
      if (it.issues.includes('grow')) li.push(`El grupo ${i + 1} puede crecer a ${cubeMins(it.to).length} celdas.`);
      if (it.issues.includes('redundant')) li.push(`El grupo ${i + 1} sobra: todas sus celdas ya están en otros grupos.`);
    });
    if (!li.length && r.allClean) li.push(`Cubriste todo con grupos válidos, pero se puede con ${r.opt.cover.length} ${pl(r.opt.cover.length, 'grupo', 'grupos')} o con grupos más grandes.`);
    st.fb = { kind: 'warn', html: `<b>Todavía no es la agrupación mínima.</b><ul>${li.map(x => `<li>${x}</li>`).join('')}</ul>` };
  },
  solg() {
    const st = S.km, opt = minimize(st.p.truth, st.p.n, st.target);
    st.groups = opt.cover.map(c => ({ c, mins: cubeMins(c), issue: '' })); st.sel.clear(); st.revealed = true; st.groupsOk = true;
    st.fb = { kind: 'warn', html: `Estos son los ${opt.cover.length} grupos de la solución. Fíjate en que cada uno es lo más grande posible.` };
  },
  checke() {
    const st = S.km, res = analyze(st.expr, st.p.n, st.p.truth, st.target);
    st.fb = answerFeedback(res, st.p.n, st.target);
    if (res.level === 'ok') { st.exprOk = true; if (!st.counted) { st.counted = true; scoreEvent('mapa', !st.revealed); } }
  },
  sole() {
    const st = S.km, opt = minimize(st.p.truth, st.p.n, st.target);
    st.groups = opt.cover.map(c => ({ c, mins: cubeMins(c), issue: '' })); st.sol = true; st.revealed = true; st.fb = null;
    if (!st.counted) { st.counted = true; scoreEvent('mapa', false); }
  }
};

/* ---------- ÁLGEBRA ---------- */
function newAlgebra() { const p = makeProblem(S.src.algebra, S.n, true); S.alg = { p, target: S.tgt.algebra, expr: '', fb: null, counted: false, revealed: false, sol: false }; }
function renderAlgebra() {
  if (needNew('algebra')) newAlgebra();
  const st = S.alg, p = st.p, n = p.n, nt = S.nt;
  $('#alSrc').value = S.src.algebra; segSet('#alTgt', 't', st.target);
  $('#alPrompt').innerHTML = promptHTML(p, 'algebra');
  $('#alScore').innerHTML = scoreHTML('algebra');
  let sol = '';
  if (st.sol) {
    const opt = minimize(p.truth, n, st.target);
    sol = `<details class="more" open><summary>Solución paso a paso</summary><div class="ex big">F = ${formOf(opt.cover, st.target, nt, colorTerm)}</div><div class="solmap">${kmapHTML(n, p.truth, { groups: opt.cover.map((c, i) => ({ c, ci: i })) })}</div>${stepsHTML(p.truth, n, st.target, nt, p.gate)}</details>`;
  }
  $('#alWork').innerHTML = `<div class="ph"><h2>Escribe la ${st.target === 'sop' ? 'SOP' : 'POS'} mínima</h2></div>
    <p class="hint">${st.target === 'sop' ? 'Suma de productos con la menor cantidad de términos y, después, de letras.' : 'Producto de sumas con la menor cantidad de factores y, después, de letras.'} Se revisa que sea equivalente fila por fila y que no se pueda simplificar más.</p>
    ${exprBox('al', n, st.expr)}
    <div class="actions"><button class="btn primary" type="button" data-act="check">Revisar</button><button class="btn ghost" type="button" data-act="sol">Ver solución</button></div>
    <div class="fb ${st.fb ? st.fb.kind : ''}" role="status" aria-live="polite">${st.fb ? st.fb.html : ''}</div>${sol}`;
}

/* ---------- EXAMEN ---------- */
const QTYPES = ['tabla', 'simbolo', 'salida', 'sop', 'pos', 'unos', 'mapa', 'grupos'];
function qGen(type, n) {
  const g = pick(GATES), N = 1 << n, truth = truthOfGate(g, n), nt = S.nt, tt = truth.join('');
  const gateOpts = () => shuffle([g, ...shuffle(GATES.filter(x => x.id !== g.id && truthOfGate(x, n).join('') !== tt)).slice(0, 3)]).map(x => ({ html: x.label, ok: x.id === g.id }));
  const nums = (c, cands) => shuffle([c, ...shuffle([...new Set(cands.filter(v => v !== c && v > 0 && v <= N))]).slice(0, 3)]).map(v => ({ html: String(v), ok: v === c }));
  switch (type) {
    case 'tabla': return { key: type + g.id + n, prompt: `¿Qué compuerta de ${n} entradas tiene esta tabla de verdad?`, fig: ttView(n, truth, { small: true }), opts: gateOpts(), explain: `Es <b>${g.label}</b>. ${gateRule(g)}` };
    case 'simbolo': return { key: type + g.id + n, prompt: '¿Qué compuerta representa este símbolo?', fig: gateSVG(g, n, { ic: false }), opts: gateOpts(), explain: `Es <b>${g.label}</b>: ${shapeRule(g)}` };
    case 'mapa': return { key: type + g.id + n, prompt: `¿Qué compuerta de ${n} entradas tiene este mapa de Karnaugh?`, fig: kmapHTML(n, truth, { small: true }), opts: gateOpts(), explain: `Es <b>${g.label}</b>. ${gateRule(g)}` };
    case 'salida': {
      const m = rnd(N), b = bitsOf(m, n);
      return { key: type + g.id + n + m, prompt: `Una compuerta <b>${g.label}</b> recibe ${b.map((x, i) => `${VARS[i]} = ${x}`).join(', ')}. ¿Cuánto vale F?`, fig: gateSVG(g, n, { inputs: b, out: 'hide', ic: false }), opts: [0, 1].map(v => ({ html: 'F = ' + v, ok: v === truth[m] })), explain: `${gateRule(g)} Con esas entradas, F = ${truth[m]}.` };
    }
    case 'sop': case 'pos': {
      const f = x => formOf(minimize(truthOfGate(x, n), n, type).cover, type, nt);
      const correct = f(g), seen = new Set([stripTags(correct)]), dist = [];
      for (const x of shuffle(GATES.filter(x => x.id !== g.id))) { const s = f(x), k = stripTags(s); if (!seen.has(k)) { seen.add(k); dist.push(s); } if (dist.length === 3) break; }
      return { key: type + g.id + n, mono: true, prompt: `¿Cuál es la forma mínima ${type === 'sop' ? 'SOP (suma de productos)' : 'POS (producto de sumas)'} de <b>${g.label}</b> con ${n} entradas?`, fig: '', opts: shuffle([{ html: correct, ok: true }, ...dist.map(s => ({ html: s, ok: false }))]), explain: `F = <span class="ex inl">${correct}</span>. ${gateRule(g)}` };
    }
    case 'unos': {
      const k = onesOf(truth).length;
      return { key: type + g.id + n, prompt: `¿En cuántas filas de la tabla de verdad de <b>${g.label}</b> con ${n} entradas vale F = 1?`, fig: '', opts: nums(k, [1, N - 1, N / 2, N / 4, 2, N - 2, 3, N]), explain: `En ${k} de ${N} filas. ${gateRule(g)}` };
    }
    case 'grupos': {
      const o = minimize(truth, n, 'sop'), k = o.cover.length;
      return { key: type + g.id + n, prompt: `¿Cuántos grupos (términos) tiene la SOP mínima de <b>${g.label}</b> con ${n} entradas?`, fig: '', opts: nums(k, [1, 2, n, N / 2, N / 4, 3, 4, N - 1]), explain: `F = <span class="ex inl">${sopFromCover(o.cover, nt)}</span>: ${k} ${pl(k, 'término', 'términos')}.${g.kind === 'xor' ? ' Los unos forman un tablero de ajedrez y ninguno tiene vecino, así que cada uno es su propio grupo.' : ''}` };
    }
  }
}
function startQuiz() {
  const q = S.quiz, seen = new Set(); q.items = [];
  let guard = 0;
  while (q.items.length < q.count && guard++ < 800) {
    const n = q.mix ? pick([2, 3, 4]) : S.n, it = qGen(pick(QTYPES), n);
    if (seen.has(it.key)) continue; seen.add(it.key); it.n = n; q.items.push(it);
  }
  q.i = 0; q.score = 0; q.answered = null; q.phase = 'run';
}
function renderExamen() {
  const q = S.quiz;
  $('#qStart').hidden = q.phase !== 'start'; $('#qRun').hidden = q.phase !== 'run'; $('#qEnd').hidden = q.phase !== 'end';
  if (q.phase === 'start') {
    segSet('#qCount', 'c', q.count); segSet('#qMix', 'x', q.mix ? '1' : '0');
    $('#qMixN').textContent = `Solo ${S.n}`;
    const b = S.stats.examen;
    $('#qBest').textContent = b.veces ? `Mejor resultado: ${b.mejor} % · exámenes hechos: ${b.veces}` : '';
    return;
  }
  if (q.phase === 'run') {
    const it = q.items[q.i], ans = q.answered;
    const opts = it.opts.map((o, k) => {
      let cls = 'qopt' + (it.mono ? ' mono' : '');
      if (ans != null) { if (o.ok) cls += ' ok'; else if (k === ans) cls += ' bad'; else cls += ' dimmed'; }
      return `<button type="button" class="${cls}" data-k="${k}" ${ans != null ? 'disabled' : ''}><span class="qk">${k + 1}</span><span class="qv">${o.html}</span></button>`;
    }).join('');
    const okAns = ans != null && it.opts[ans].ok;
    $('#qRun').innerHTML = `<div class="qhead"><span>Pregunta <b>${q.i + 1}</b> de ${q.items.length}</span><span>Aciertos <b>${q.score}</b></span></div>
      <div class="qbar"><span style="width:${(q.i + (ans != null ? 1 : 0)) / q.items.length * 100}%"></span></div>
      <p class="qprompt">${it.prompt}</p>${it.fig ? `<div class="qfig">${it.fig}</div>` : ''}<div class="qopts">${opts}</div>
      ${ans != null ? `<div class="fb ${okAns ? 'ok' : 'bad'}"><b>${okAns ? '¡Correcto!' : 'Incorrecto.'}</b> ${it.explain}</div><div class="actions"><button class="btn primary" type="button" data-q="next">${q.i + 1 < q.items.length ? 'Siguiente' : 'Ver resultado'}</button></div>` : '<p class="hint" style="margin-top:12px">Atajo: teclas 1 a 4 para responder, Enter para seguir.</p>'}`;
    return;
  }
  const tot = q.items.length, pct = Math.round(q.score / tot * 100), miss = q.items.filter(it => !it.opts[it.chosen].ok);
  const msg = pct === 100 ? 'Perfecto. Prueba mezclando 2, 3 y 4 entradas o con 15 preguntas.' : pct >= 80 ? 'Muy bien. Repasa las que fallaste abajo.' : pct >= 60 ? 'Vas bien. Repasa en Aprender las compuertas que fallaste.' : 'Repasa en Aprender cada compuerta: su tabla, su mapa y su forma mínima.';
  $('#qEnd').innerHTML = `<h2>Resultado</h2><div class="bigscore">${q.score}<small>/${tot}</small></div><p class="hint" style="margin-top:8px">${pct} % · ${msg}</p>
    ${miss.length ? `<ul class="review">${miss.map(it => `<li><div class="rq">${it.prompt}</div><div class="ra">Respuesta correcta: <span class="${it.mono ? 'ex inl' : ''}">${it.opts.find(o => o.ok).html}</span>. ${it.explain}</div></li>`).join('')}</ul>` : ''}
    <div class="actions"><button class="btn primary" type="button" data-q="again">Otro examen</button><button class="btn" type="button" data-q="settings">Cambiar ajustes</button></div>`;
}
function answerQuiz(k) {
  const q = S.quiz; if (q.phase !== 'run' || q.answered != null) return;
  const it = q.items[q.i]; if (!it.opts[k]) return;
  q.answered = k; it.chosen = k; if (it.opts[k].ok) q.score++;
  renderExamen();
}
function nextQuiz() {
  const q = S.quiz; if (q.answered == null) return;
  if (q.i + 1 < q.items.length) { q.i++; q.answered = null; }
  else {
    q.phase = 'end';
    const pct = Math.round(q.score / q.items.length * 100), b = S.stats.examen;
    b.veces++; b.mejor = b.mejor == null ? pct : Math.max(b.mejor, pct); store.set('stats', S.stats);
  }
  renderExamen();
  const t = $('#qRun:not([hidden]) .qopt, #qEnd:not([hidden]) .btn'); if (t) t.focus({ preventScroll: true });
}

/* ---------- navegación y estado global ---------- */
function syncStrip() {
  $$('#chips .chip').forEach(b => b.setAttribute('aria-checked', String(b.dataset.g === S.gate)));
  segSet('#segN', 'n', S.n); segSet('#segNt', 'nt', S.nt);
  const OTHER = 'Este ejercicio no usa la compuerta seleccionada. Toca una para practicar con ella.';
  let note = '';
  if (S.tab === 'examen') note = 'El examen elige las compuertas al azar.';
  else if (S.tab === 'tabla') { if (!ttUsesGate()) note = ['llenar', 'errores'].includes(S.ttMode) ? OTHER : 'Este modo arma sus propios ejercicios. Toca una compuerta para llenar su tabla.'; }
  else if ((S.tab === 'mapa' || S.tab === 'algebra') && S.src[S.tab] !== 'gate') note = OTHER;
  $('#fGate').classList.toggle('dim', !!note);
  $('#dimNote').textContent = note;
}
function render() {
  if (S.rpTimer && !(S.tab === 'tabla' && S.ttMode === 'rapida')) stopRapida(true);
  $$('.tabs [role=tab]').forEach(b => { const on = b.dataset.tab === S.tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  TABS.forEach(t => { $('#v-' + t).hidden = t !== S.tab; });
  syncStrip();
  ({ aprender: renderLearn, tabla: renderTablaTab, mapa: renderMapa, algebra: renderAlgebra, examen: renderExamen })[S.tab]();
}
function setTab(t, fromHash) {
  if (!TABS.includes(t)) t = 'aprender';
  S.tab = t;
  if (!fromHash && location.hash !== '#' + t) { try { location.hash = t; } catch (e) { } }
  render();
}

function init() {
  $('#brandMark').innerHTML = gateMini(GATE.NAND);
  $('#chips').innerHTML = GATES.map(g => `<button type="button" class="chip" role="radio" data-g="${g.id}" aria-checked="false">${gateMini(g)}<span>${g.label}</span></button>`).join('');

  $('.tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
  $('.tabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.indexOf(S.tab), j = (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[j]); focusSel(`#tab-${TABS[j]}`);
  });
  window.addEventListener('hashchange', () => { const t = location.hash.slice(1); if (TABS.includes(t) && t !== S.tab) setTab(t, true); });

  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    S.gate = b.dataset.g; store.set('gate', S.gate);
    if (S.tab === 'tabla') {
      if (!['llenar', 'errores'].includes(S.ttMode)) { S.ttMode = 'llenar'; store.set('ttMode', S.ttMode); }
      if (S.ttSrc[S.ttMode] !== 'gate') { S.ttSrc[S.ttMode] = 'gate'; store.set('ttSrc', S.ttSrc); }
    } else if (['mapa', 'algebra'].includes(S.tab) && S.src[S.tab] !== 'gate') { S.src[S.tab] = 'gate'; store.set('src', S.src); }
    render();
  });
  $('#segN').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; S.n = +b.dataset.n; store.set('n', S.n); render(); });
  $('#segNt').addEventListener('click', e => { const b = e.target.closest('[data-nt]'); if (!b) return; S.nt = b.dataset.nt; store.set('nt', S.nt); render(); });

  // Aprender
  const toggleVar = i => { S.inputs[i] = 1 - S.inputs[i]; renderLearn(); focusSel(`#lSym .sw[data-var="${i}"]`); };
  $('#lSym').addEventListener('click', e => { const s = e.target.closest('.sw'); if (s) toggleVar(+s.dataset.var); });
  $('#lSym').addEventListener('keydown', e => { const s = e.target.closest('.sw'); if (s && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleVar(+s.dataset.var); } });
  $('#lTT').addEventListener('click', e => { const r = e.target.closest('tr[data-m]'); if (r) { setInputsFromM(+r.dataset.m); renderLearn(); } });
  $('#lKmap').addEventListener('click', e => { const c = e.target.closest('.kc[data-m]'); if (c) { setInputsFromM(+c.dataset.m); renderLearn(); } });
  $('#lTgt').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { S.lTgt = b.dataset.t; renderLearn(); } });
  const hl = gi => { const gs = $('#lKmap .kgroups'); if (!gs) return; gs.classList.toggle('focus', gi != null); gs.querySelectorAll('.kg').forEach(k => k.classList.toggle('hl', k.dataset.gi === String(gi))); };
  $('#lLegend').addEventListener('mouseover', e => { const li = e.target.closest('li[data-gi]'); hl(li ? li.dataset.gi : null); });
  $('#lLegend').addEventListener('mouseleave', () => hl(null));
  $('#lLegend').addEventListener('focusin', e => { const li = e.target.closest('li[data-gi]'); hl(li ? li.dataset.gi : null); });
  $('#lLegend').addEventListener('focusout', () => hl(null));
  document.addEventListener('click', e => { const c = e.target.closest('.copy[data-copy]'); if (c) copyText(c.dataset.copy, c); });

  initTabla();

  // Mapa K
  $('#kmSrc').addEventListener('change', e => { S.src.mapa = e.target.value; store.set('src', S.src); render(); });
  $('#kmNew').addEventListener('click', () => { newMapa(); renderMapa(); });
  $('#kmTgt').addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return; S.tgt.mapa = b.dataset.t;
    if (S.km) { const st = S.km; st.target = b.dataset.t; st.groups = []; st.sel.clear(); st.expr = ''; st.fb = null; st.groupsOk = false; st.exprOk = false; st.sol = false; if (st.step > 1) st.step = 2; }
    renderMapa();
  });
  $('#kmWork').addEventListener('click', e => {
    const st = S.km; if (!st) return;
    const stp = e.target.closest('[data-step]'); if (stp && !stp.disabled) { st.step = +stp.dataset.step; st.fb = null; renderMapa(); return; }
    const cell = e.target.closest('button.kc[data-m]');
    if (cell) {
      const m = +cell.dataset.m;
      if (st.step === 1) { st.user[m] = st.user[m] === 1 ? 0 : 1; if (st.marks) st.marks[m] = ''; st.fb = null; }
      else if (st.step === 2) { if (st.sel.has(m)) st.sel.delete(m); else st.sel.add(m); st.fb = null; }
      renderMapa(); focusSel(`#kmMap .kc[data-m="${m}"]`); return;
    }
    const del = e.target.closest('[data-delg]'); if (del) { st.groups.splice(+del.dataset.delg, 1); st.groups.forEach(g => { g.issue = ''; }); st.groupsOk = false; st.fb = null; renderMapa(); return; }
    const k = e.target.closest('[data-key]'); if (k) { keyPress('km', k.dataset.key, st.p.n); return; }
    const a = e.target.closest('[data-act]'); if (a && KM[a.dataset.act]) { KM[a.dataset.act](); renderMapa(); }
  });
  $('#kmWork').addEventListener('input', e => { if (e.target.id === 'kmIn') { S.km.expr = e.target.value; $('#kmPrev').innerHTML = previewHTML(e.target.value, S.km.p.n); } });
  $('#kmWork').addEventListener('keydown', e => { if (e.target.id === 'kmIn' && e.key === 'Enter') { e.preventDefault(); KM.checke(); renderMapa(); focusSel('#kmIn'); } });

  // Álgebra
  $('#alSrc').addEventListener('change', e => { S.src.algebra = e.target.value; store.set('src', S.src); render(); });
  $('#alNew').addEventListener('click', () => { newAlgebra(); renderAlgebra(); });
  $('#alTgt').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; S.tgt.algebra = b.dataset.t; if (S.alg) { S.alg.target = b.dataset.t; S.alg.fb = null; S.alg.sol = false; } renderAlgebra(); });
  const alCheck = () => {
    const st = S.alg, res = analyze(st.expr, st.p.n, st.p.truth, st.target);
    st.fb = answerFeedback(res, st.p.n, st.target);
    if (res.level === 'ok' && !st.counted) { st.counted = true; scoreEvent('algebra', !st.revealed); }
    renderAlgebra();
  };
  $('#alWork').addEventListener('click', e => {
    const st = S.alg; if (!st) return;
    const k = e.target.closest('[data-key]'); if (k) { keyPress('al', k.dataset.key, st.p.n); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'check') alCheck();
    else if (a.dataset.act === 'sol') { st.sol = true; st.revealed = true; if (!st.counted) { st.counted = true; scoreEvent('algebra', false); } renderAlgebra(); }
  });
  $('#alWork').addEventListener('input', e => { if (e.target.id === 'alIn') { S.alg.expr = e.target.value; $('#alPrev').innerHTML = previewHTML(e.target.value, S.alg.p.n); } });
  $('#alWork').addEventListener('keydown', e => { if (e.target.id === 'alIn' && e.key === 'Enter') { e.preventDefault(); alCheck(); focusSel('#alIn'); } });

  // Examen
  $('#qCount').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { S.quiz.count = +b.dataset.c; renderExamen(); } });
  $('#qMix').addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) { S.quiz.mix = b.dataset.x === '1'; renderExamen(); } });
  $('#v-examen').addEventListener('click', e => {
    const o = e.target.closest('.qopt[data-k]'); if (o) { answerQuiz(+o.dataset.k); return; }
    const b = e.target.closest('[data-q]'); if (!b) return;
    const act = b.dataset.q;
    if (act === 'start' || act === 'again') { startQuiz(); renderExamen(); focusSel('#qRun .qopt'); }
    else if (act === 'next') nextQuiz();
    else if (act === 'settings') { S.quiz.phase = 'start'; renderExamen(); }
  });
  document.addEventListener('keydown', e => {
    if (S.tab !== 'examen' || S.quiz.phase !== 'run' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^[1-4]$/.test(e.key)) answerQuiz(+e.key - 1);
    else if (e.key === 'Enter' && S.quiz.answered != null && !e.target.closest('button')) nextQuiz();
  });

  const h = location.hash.slice(1);
  S.tab = TABS.includes(h) ? h : 'aprender';
  render();
}
init();
