/* ================= TABLAS DE VERDAD · modos de práctica ================= */
const TT_MODES = [
  { id: 'llenar', name: 'Llenar F', desc: 'Compuerta, expresión, Σm o ΠM' },
  { id: 'partes', name: 'Por columnas', desc: 'Expresión paso a paso' },
  { id: 'circuito', name: 'Circuito', desc: 'Compuertas conectadas' },
  { id: 'equiv', name: 'Equivalencia', desc: 'Comprueba leyes con la tabla' },
  { id: 'errores', name: 'Encuentra errores', desc: 'Marca los valores mal' },
  { id: 'cual', name: '¿Qué compuerta?', desc: 'Reconócela por su tabla' },
  { id: 'rapida', name: 'Ronda rápida', desc: 'Contra reloj' }
];
const TT_IDS = TT_MODES.map(m => m.id);
const TT_SRC = {
  llenar: [['gate', 'Compuerta seleccionada'], ['rgate', 'Compuerta al azar'], ['expr', 'Expresión al azar'], ['sum', 'Función Σm (minterms)'], ['prod', 'Función ΠM (maxterms)']],
  errores: [['gate', 'Compuerta seleccionada'], ['rgate', 'Compuerta al azar'], ['expr', 'Expresión al azar'], ['sum', 'Función Σm (minterms)']]
};
const CIRC = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
const OPNAME = { and: 'AND', or: 'OR', xor: 'XOR', not: 'NOT' };
const G2IDS = ['AND', 'NAND', 'OR', 'NOR', 'XOR', 'XNOR'];

/* Plantillas de leyes: p, q, r, s se cambian por variables reales. [[…]] en el texto se dibuja como expresión. */
const LEYES = [
  { v: 2, a: "(pq)'", b: "p' + q'", eq: true, law: 'Ley de De Morgan', why: 'La negación de un producto es la suma de las negaciones.' },
  { v: 2, a: "(p + q)'", b: "p'q'", eq: true, law: 'Ley de De Morgan', why: 'La negación de una suma es el producto de las negaciones.' },
  { v: 3, a: "(pqr)'", b: "p' + q' + r'", eq: true, law: 'De Morgan con 3 variables', why: 'Es la NAND de 3 entradas escrita como OR de las entradas negadas.' },
  { v: 3, a: "(p + q + r)'", b: "p'q'r'", eq: true, law: 'De Morgan con 3 variables', why: 'Es la NOR de 3 entradas escrita como AND de las entradas negadas.' },
  { v: 4, a: "(pqrs)'", b: "p' + q' + r' + s'", eq: true, law: 'De Morgan con 4 variables', why: 'NAND de 4 entradas = OR de las 4 entradas negadas.' },
  { v: 2, a: "p + pq", b: "p", eq: true, law: 'Absorción', why: 'Si [[p]] = 1 los dos lados valen 1 y si [[p]] = 0 los dos valen 0. [[q]] no influye.' },
  { v: 2, a: "p(p + q)", b: "p", eq: true, law: 'Absorción', why: 'Si [[p]] = 0 los dos lados valen 0 y si [[p]] = 1 los dos valen 1.' },
  { v: 2, a: "p + p'q", b: "p + q", eq: true, law: 'Absorción del complemento', why: "Cuando [[p]] = 0, el término [[p'q]] se vuelve [[q]]; cuando [[p]] = 1 todo vale 1." },
  { v: 2, a: "p(p' + q)", b: "pq", eq: true, law: 'Absorción del complemento', why: "Al distribuir, [[pp']] vale 0 y solo queda [[pq]]." },
  { v: 3, a: "p(q + r)", b: "pq + pr", eq: true, law: 'Distributiva', why: 'El AND se distribuye sobre el OR, igual que la multiplicación sobre la suma.' },
  { v: 3, a: "p + qr", b: "(p + q)(p + r)", eq: true, law: 'Distributiva del OR sobre el AND', why: 'En álgebra booleana la suma también se distribuye sobre el producto. Con números normales eso no pasa.' },
  { v: 4, a: "(p + q)(r + s)", b: "pr + ps + qr + qs", eq: true, law: 'Distributiva aplicada dos veces', why: 'Cada término del primer paréntesis multiplica a cada término del segundo.' },
  { v: 2, a: "p ^ q", b: "p'q + pq'", eq: true, law: 'Definición de XOR', why: "XOR vale 1 cuando las entradas son distintas: [[p'q]] o [[pq']]." },
  { v: 2, a: "(p ^ q)'", b: "pq + p'q'", eq: true, law: 'Definición de XNOR', why: 'XNOR vale 1 cuando las entradas son iguales: las dos en 1 o las dos en 0.' },
  { v: 2, a: "p ^ q", b: "(p + q)(p' + q')", eq: true, law: 'XOR como producto de sumas', why: 'Pide que al menos una valga 1 y al menos una valga 0, o sea, que sean distintas.' },
  { v: 2, a: "p' ^ q", b: "(p ^ q)'", eq: true, law: 'Negar una entrada de XOR', why: 'Invertir una sola entrada de una XOR invierte su salida.' },
  { v: 3, a: "(p ^ q) ^ r", b: "p ^ (q ^ r)", eq: true, law: 'Asociativa de XOR', why: 'XOR revisa si el número de unos es impar, sin importar cómo se agrupe.' },
  { v: 3, a: "pq + p'r + qr", b: "pq + p'r", eq: true, law: 'Teorema del consenso', why: "El término [[qr]] sobra: cuando vale 1, [[pq]] o [[p'r]] ya vale 1." },
  { v: 2, a: "pq + pq'", b: "p", eq: true, law: 'Combinación (adyacencia)', why: 'Es lo que hace un grupo de 2 celdas en el mapa K: [[q]] cambia y se elimina.' },
  { v: 2, a: "(p + q)(p + q')", b: "p", eq: true, law: 'Combinación en forma POS', why: 'Es un grupo de 2 ceros en el mapa K: [[q]] cambia y se elimina.' },
  { v: 1, a: "(pp)'", b: "p'", eq: true, law: 'NAND con las entradas unidas', why: 'Una NAND con sus entradas conectadas funciona como NOT. Por eso NAND es una compuerta universal.' },
  { v: 1, a: "(p + p)'", b: "p'", eq: true, law: 'NOR con las entradas unidas', why: 'Una NOR con sus entradas conectadas también funciona como NOT.' },
  { v: 2, a: "(pq)'", b: "p'q'", eq: false, why: "Error típico de De Morgan: al negar un producto, el AND se cambia por OR. Lo correcto es [[p' + q']]." },
  { v: 2, a: "(p + q)'", b: "p' + q'", eq: false, why: "Error típico de De Morgan: al negar una suma, el OR se cambia por AND. Lo correcto es [[p'q']]." },
  { v: 3, a: "(pqr)'", b: "p'q'r'", eq: false, why: "De Morgan cambia el AND por OR. Lo correcto es [[p' + q' + r']]." },
  { v: 3, a: "p + qr", b: "(p + q)r", eq: false, why: 'El AND se hace antes que el OR: [[p + qr]] no es lo mismo que [[(p + q)r]].' },
  { v: 3, a: "p(q + r)", b: "pq + r", eq: false, why: 'Al distribuir, [[p]] multiplica a los dos términos: [[pq + pr]].' },
  { v: 2, a: "p ^ q", b: "pq + p'q'", eq: false, why: "[[pq + p'q']] es XNOR, la negación de XOR." },
  { v: 2, a: "(p ^ q)'", b: "p' ^ q'", eq: false, why: "Negar las dos entradas de una XOR no cambia nada: [[p' ^ q']] es igual a [[p ^ q]]." },
  { v: 2, a: "p + p'q", b: "q", eq: false, why: 'La absorción da [[p + q]], no solo [[q]].' },
  { v: 2, a: "p + pq", b: "pq", eq: false, why: 'La absorción deja solo [[p]]: [[p + pq]] = [[p]].' },
  { v: 3, a: "pq + p'r", b: "pq + r", eq: false, why: "No se puede quitar [[p']] de [[p'r]]: con [[p]] = 1, [[q]] = 0 y [[r]] = 1, [[pq + r]] vale 1 y [[pq + p'r]] vale 0." },
  { v: 4, a: "pq + rs", b: "(p + r)(q + s)", eq: false, why: 'Al multiplicar [[(p + r)(q + s)]] salen [[pq + ps + qr + rs]]: sobran [[ps]] y [[qr]].' },
  { v: 3, a: "(p + q)r'", b: "p + qr'", eq: false, why: "Falta multiplicar [[r']] también por [[p]]: [[(p + q)r']] = [[pr' + qr']]." },
  { v: 2, a: "(p'q)'", b: "pq'", eq: false, why: "Con De Morgan, [[(p'q)']] = [[p + q']], no [[pq']]." }
];

/* ---------- generadores ---------- */
function stepCols(ast) {
  const cols = [], seen = new Map();
  const key = a => stripTags(astHTML(a, 'prime'));
  const walk = a => {
    if (a.t === 'var' || a.t === 'const') return;
    if (a.t === 'not') walk(a.a); else a.xs.forEach(walk);
    const k = key(a);
    if (!seen.has(k)) { seen.set(k, cols.length); cols.push(a); }
  };
  walk(ast);
  const ref = x => x.t === 'var' ? VARS[x.i] : CIRC[seen.get(key(x))];
  return cols.map(a => ({ a, args: a.t === 'not' ? [ref(a.a)] : a.xs.map(ref) }));
}
const capOf = c => c.a.t === 'not' ? `NOT ${c.args[0]}` : `${OPNAME[c.a.t]}(${c.args.join(', ')})`;
function opRule(t, args) {
  const L = listY(args);
  if (t === 'not') return `es la negación de ${args[0]}: donde ${args[0]} vale 1 va 0, y donde vale 0 va 1.`;
  if (t === 'and') return `vale 1 solo en las filas donde ${L} valen 1.`;
  if (t === 'or') return `vale 1 en las filas donde al menos una de ${L} vale 1.`;
  return `vale 1 en las filas donde un número impar de ${L} vale 1.`;
}
function gateRuleOn(g, ins) {
  const L = listY(ins);
  return {
    AND: `vale 1 solo cuando ${L} valen 1`, NAND: `vale 0 solo cuando ${L} valen 1`,
    OR: `vale 1 cuando al menos una de ${L} vale 1`, NOR: `vale 1 solo cuando ${L} valen 0`,
    XOR: `vale 1 cuando ${L} son distintas`, XNOR: `vale 1 cuando ${L} son iguales`
  }[g.id] || `es ${ins[0]} invertida`;
}
function gateOn(g, xs) {
  switch (g.id) {
    case 'AND': return { t: 'and', xs };
    case 'NAND': return { t: 'not', a: { t: 'and', xs } };
    case 'OR': return { t: 'or', xs };
    case 'NOR': return { t: 'not', a: { t: 'or', xs } };
    case 'XOR': return { t: 'xor', xs };
    case 'XNOR': return { t: 'not', a: { t: 'xor', xs } };
    default: return { t: 'not', a: xs[0] };
  }
}
function evalCircuit(gates, n) {
  const N = 1 << n, vals = {};
  VARS.slice(0, n).forEach((v, i) => { vals[v] = Array.from({ length: N }, (_, m) => (m >> (n - 1 - i)) & 1); });
  gates.forEach(gt => {
    vals[gt.out] = Array.from({ length: N }, (_, m) => {
      const b = gt.ins.map(s => vals[s][m]);
      return gt.g.kind === 'buf' ? 1 - b[0] : (gt.g.f(b) ? 1 : 0);
    });
  });
  return vals;
}
function makeCircuit(n) {
  const rg = () => GATE[pick(G2IDS)], N = 1 << n, sum = a => a.reduce((x, y) => x + y, 0);
  const topo = Math.random() < 0.5 ? 'par' : n === 2 ? 'inv' : 'cad';
  for (let t = 0; t < 400; t++) {
    let gates, inv = null;
    if (topo === 'par') {
      const ins = n === 2 ? [['A', 'B'], ['A', 'B']] : n === 3 ? [['A', 'B'], ['B', 'C']] : [['A', 'B'], ['C', 'D']];
      gates = [{ g: rg(), ins: ins[0], out: 'X' }, { g: rg(), ins: ins[1], out: 'Y' }, { g: rg(), ins: ['X', 'Y'], out: 'F' }];
    } else if (topo === 'cad') {
      gates = [{ g: rg(), ins: ['A', 'B'], out: 'X' }, { g: rg(), ins: ['X', 'C'], out: n === 3 ? 'F' : 'Y' }];
      if (n === 4) gates.push({ g: rg(), ins: ['Y', 'D'], out: 'F' });
    } else {
      inv = pick(['A', 'B']);
      gates = [{ g: inv === 'A' ? GATE.NOTA : GATE.NOTB, ins: [inv], out: 'X' }, { g: rg(), ins: inv === 'A' ? ['X', 'B'] : ['A', 'X'], out: 'F' }];
    }
    const vals = evalCircuit(gates, n);
    if (gates.some(gt => { const s = sum(vals[gt.out]); return s === 0 || s === N; })) continue;
    if (topo === 'par' && n === 2) { const x = vals.X.join(''), y = vals.Y.join(''), ny = vals.Y.map(v => 1 - v).join(''); if (x === y || x === ny) continue; }
    const f = vals.F.join('');
    if (Object.keys(vals).some(k => k !== 'F' && vals[k].join('') === f)) continue;
    return { n, topo, inv, gates, vals };
  }
}
function circuitAST(c) {
  const ast = {};
  VARS.slice(0, c.n).forEach((v, i) => { ast[v] = { t: 'var', i }; });
  c.gates.forEach(gt => { ast[gt.out] = gateOn(gt.g, gt.ins.map(s => ast[s])); });
  return tidy(flat(ast.F));
}
function makeEquiv(n, last) {
  const eq = Math.random() < 0.5;
  const cands = LEYES.filter(t => t.eq === eq && t.v <= n && t !== last);
  const w = cands.map(t => t.v === n ? 3 : t.v === n - 1 ? 2 : t.v === 1 ? 0.5 : 1);
  let r = Math.random() * w.reduce((a, b) => a + b, 0), tpl = cands[0];
  for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) { tpl = cands[i]; break; } }
  const vs = shuffle([...Array(n).keys()]).slice(0, tpl.v).sort((a, b) => a - b);
  const map = {}; ['p', 'q', 'r', 's'].forEach((ch, i) => { if (i < tpl.v) map[ch] = VARS[vs[i]]; });
  const sub = s => s.replace(/[pqrs]/g, ch => map[ch]);
  let a = parse(sub(tpl.a), n), b = parse(sub(tpl.b), n);
  if (Math.random() < 0.4) [a, b] = [b, a];
  return { tpl, sub, a, b, eq: tpl.eq };
}
function lawText(st) { return st.tpl.why.replace(/\[\[(.+?)\]\]/g, (_, x) => `<span class="ex inl">${astHTML(parse(st.sub(x), st.n), S.nt)}</span>`); }

/* ---------- rejilla editable genérica ---------- */
function gridInit(st, cols) { st.cols = cols; st.user = cols.map(() => Array(1 << st.n).fill(null)); st.marks = null; }
function gridSet(st, ci, m, v) { st.user[ci][m] = v; if (st.marks) st.marks[ci][m] = ''; st.fb = null; }
function gridCheck(st) {
  let empty = 0;
  st.user.forEach(col => col.forEach(v => { if (v == null) empty++; }));
  if (empty) return { empty };
  const wrong = st.cols.map(() => 0);
  st.marks = st.cols.map((c, ci) => st.user[ci].map((v, m) => { const ok = v === c.truth[m]; if (!ok) wrong[ci]++; return ok ? 'ok' : 'bad'; }));
  return { empty: 0, wrong, total: wrong.reduce((a, b) => a + b, 0) };
}
function viewCols(st) {
  return st.cols.map(c => ({
    ...c,
    head: c.a ? astHTML(c.a, S.nt) : c.gt ? (S.circNames ? c.gt.g.label : '') : '',
    cap: c.args ? capOf(c) : c.gt ? `(${c.gt.ins.join(', ')})` : ''
  }));
}
function gridHTML(n, cols, st, o = {}) {
  const N = 1 << n;
  let h = `<table class="tt grid"><thead><tr><th class="mi" scope="col">m</th>${VARS.slice(0, n).map(v => `<th scope="col">${v}</th>`).join('')}`;
  cols.forEach((c, ci) => { h += `<th scope="col" class="xc${ci === 0 ? ' sep' : ''}"><span class="cl">${c.label}</span>${c.head ? `<span class="ce">${c.head}</span>` : ''}${c.cap ? `<span class="co">${c.cap}</span>` : ''}</th>`; });
  h += '</tr></thead><tbody>';
  for (let m = 0; m < N; m++) {
    const rc = [o.cur === m ? 'cur' : '', o.rowCls ? o.rowCls[m] : '', o.rowClick ? 'click' : ''].filter(Boolean).join(' ');
    h += `<tr data-m="${m}"${rc ? ` class="${rc}"` : ''}><td class="mi">${m}</td>${bitsOf(m, n).map(x => `<td>${x}</td>`).join('')}`;
    cols.forEach((c, ci) => {
      const u = st.user[ci][m], mk = st.marks ? st.marks[ci][m] || '' : '';
      h += `<td class="edit${ci === 0 ? ' sep' : ''}"><button type="button" class="fbtn ${u == null ? 'q' : 'v' + u} ${mk}" data-c="${ci}" data-m="${m}" aria-label="${c.aria} en la fila ${m}: ${u == null ? 'vacía' : u}">${u == null ? '?' : u}</button></td>`;
    });
    h += '</tr>';
  }
  return h + '</tbody></table>';
}
function filledMeta(st) {
  const tot = (1 << st.n) * st.cols.length, f = st.user.reduce((a, col) => a + col.filter(v => v != null).length, 0);
  return `${f} de ${tot} llenas`;
}

/* ---------- dibujo de circuitos ---------- */
function gGeom(g, x0, cy, s) {
  const { body, outX, inX } = gateBody(g);
  let b = body, ox = outX;
  if (g.bubble) { b += `<circle cx="${outX + 8}" cy="90" r="8"/>`; ox = outX + 16; }
  const X = bx => +(x0 + (bx - 110) * s).toFixed(1), Y = by => +(cy + (by - 90) * s).toFixed(1);
  return {
    svg: `<g class="body" transform="translate(${(x0 - 110 * s).toFixed(1)} ${(cy - 90 * s).toFixed(1)}) scale(${s})">${b}</g>`,
    pin: k => g.kind === 'buf' ? { x: X(132), y: cy } : { x: X(inX(k ? 115 : 65)), y: Y(k ? 115 : 65) },
    out: { x: X(ox), y: cy },
    mid: X(((g.kind === 'buf' ? 132 : 118) + ox) / 2), bot: Y(g.kind === 'buf' ? 128 : 140)
  };
}
function circuitSVG(c, row, showInner, names) {
  const s = 0.6, n = c.n, G = c.gates, geo = [], wires = [], dots = [], wl = [];
  let inY, out, H;
  const put = (k, x0, cy) => { geo[k] = gGeom(G[k].g, x0, cy, s); };
  const seg = (sig, d) => wires.push({ sig, d });
  if (c.topo === 'par') {
    put(0, 200, 60); put(1, 200, 170); put(2, 380, 115);
    const [g1, g2, g3] = geo;
    if (n === 4) {
      inY = { A: 45, B: 75, C: 155, D: 185 };
      seg('A', `M44 45H${g1.pin(0).x}`); seg('B', `M44 75H${g1.pin(1).x}`); seg('C', `M44 155H${g2.pin(0).x}`); seg('D', `M44 185H${g2.pin(1).x}`);
    } else if (n === 3) {
      inY = { A: 45, B: 115, C: 185 };
      seg('A', `M44 45H${g1.pin(0).x}`);
      seg('B', `M44 115H120M120 115V75H${g1.pin(1).x}M120 115V155H${g2.pin(0).x}`); dots.push([120, 115, 'B']);
      seg('C', `M44 185H${g2.pin(1).x}`);
    } else {
      inY = { A: 45, B: 185 };
      seg('A', `M44 45H${g1.pin(0).x}M100 45V155H124A6 6 0 0 1 136 155H${g2.pin(0).x}`); dots.push([100, 45, 'A']);
      seg('B', `M44 185H${g2.pin(1).x}M130 185V75H${g1.pin(1).x}`); dots.push([130, 185, 'B']);
    }
    seg('X', `M${g1.out.x} 60H330V${g3.pin(0).y}H${g3.pin(0).x}`);
    seg('Y', `M${g2.out.x} 170H330V${g3.pin(1).y}H${g3.pin(1).x}`);
    wl.push(['X', g1.out.x + 10, 52], ['Y', g2.out.x + 10, 162]);
    seg('F', `M${g3.out.x} 115H500`); out = [514, 115]; H = 225;
  } else if (c.topo === 'cad' && n === 3) {
    put(0, 190, 70); put(1, 370, 110);
    const [g1, g2] = geo;
    inY = { A: 55, B: 85, C: 125 };
    seg('A', `M44 55H${g1.pin(0).x}`); seg('B', `M44 85H${g1.pin(1).x}`);
    seg('X', `M${g1.out.x} 70H320V${g2.pin(0).y}H${g2.pin(0).x}`);
    seg('C', `M44 125H${g2.pin(1).x}`);
    wl.push(['X', g1.out.x + 10, 62]);
    seg('F', `M${g2.out.x} 110H500`); out = [514, 110]; H = 168;
  } else if (c.topo === 'cad') {
    put(0, 150, 55); put(1, 285, 105); put(2, 420, 155);
    const [g1, g2, g3] = geo;
    inY = { A: 40, B: 70, C: 120, D: 170 };
    seg('A', `M44 40H${g1.pin(0).x}`); seg('B', `M44 70H${g1.pin(1).x}`);
    seg('X', `M${g1.out.x} 55H255V${g2.pin(0).y}H${g2.pin(0).x}`);
    seg('C', `M44 120H${g2.pin(1).x}`);
    seg('Y', `M${g2.out.x} 105H390V${g3.pin(0).y}H${g3.pin(0).x}`);
    seg('D', `M44 170H${g3.pin(1).x}`);
    wl.push(['X', g1.out.x + 8, 47], ['Y', g2.out.x + 8, 97]);
    seg('F', `M${g3.out.x} 155H518`); out = [532, 155]; H = 205;
  } else {
    const yv = c.inv === 'A' ? 55 : 145;
    put(0, 150, yv); put(1, 340, 100);
    const [gn, g2] = geo;
    inY = { A: 55, B: 145 };
    if (c.inv === 'A') {
      seg('A', `M44 55H${gn.pin(0).x}`);
      seg('X', `M${gn.out.x} 55H300V${g2.pin(0).y}H${g2.pin(0).x}`);
      seg('B', `M44 145H300V${g2.pin(1).y}H${g2.pin(1).x}`);
    } else {
      seg('A', `M44 55H300V${g2.pin(0).y}H${g2.pin(0).x}`);
      seg('B', `M44 145H${gn.pin(0).x}`);
      seg('X', `M${gn.out.x} 145H300V${g2.pin(1).y}H${g2.pin(1).x}`);
    }
    wl.push(['X', gn.out.x + 10, yv - 8]);
    seg('F', `M${g2.out.x} 100H500`); out = [514, 100]; H = 192;
  }
  const isIn = sg => VARS.includes(sg);
  const val = sg => row == null ? null : (isIn(sg) || showInner ? c.vals[sg][row] : null);
  const col = v => v == null ? 'var(--ink)' : v ? 'var(--hi)' : 'var(--muted)';
  let h = `<svg class="circ" viewBox="0 0 560 ${H}" role="img" aria-label="Circuito de ${G.length} compuertas con ${n} entradas">`;
  h += wires.map(w => `<path class="w" style="stroke:${col(val(w.sig))}" d="${w.d}"/>`).join('');
  h += dots.map(([x, y, sg]) => `<circle cx="${x}" cy="${y}" r="3.6" style="fill:${col(val(sg))}"/>`).join('');
  h += geo.map(g => g.svg).join('');
  if (names) h += geo.map((g, k) => `<text class="gn" x="${g.mid}" y="${g.bot + 13}" text-anchor="middle">${G[k].g.label}</text>`).join('');
  Object.entries(inY).forEach(([v, y]) => {
    h += `<text class="lbl" x="14" y="${y + 5}" text-anchor="middle">${v}</text>`;
    if (row != null) h += `<text class="val" x="31" y="${y + 4}" text-anchor="middle">${c.vals[v][row]}</text>`;
  });
  wl.forEach(([sg, x, y]) => { const v = val(sg); h += `<text class="wl" x="${x}" y="${y}">${sg}${v != null ? ' = ' + v : ''}</text>`; });
  const fv = val('F');
  h += `<text class="lbl" x="${out[0]}" y="${out[1] - 17}" text-anchor="middle">F</text><circle class="led${fv === 1 ? ' on' : ''}${fv == null ? ' q' : ''}" cx="${out[0]}" cy="${out[1]}" r="11"/><text class="ledt${fv === 1 ? ' on' : ''}" x="${out[0]}" y="${out[1] + 4.5}" text-anchor="middle">${fv == null ? '?' : fv}</text>`;
  return h + '</svg>';
}
function circBox(st) {
  const done = st.solved || st.revealed, b = bitsOf(st.cur, st.n);
  return `<div class="circbox">${circuitSVG(st.c, st.cur, done, S.circNames)}</div><div class="readout"><span>Fila m${st.cur}: ${b.map((x, i) => `${VARS[i]} = <b>${x}</b>`).join(' · ')}</span>${done ? `<span>→ <b class="${st.c.vals.F[st.cur] ? 'fo' : ''}">F = ${st.c.vals.F[st.cur]}</b></span>` : ''}</div>`;
}

/* ---------- creación de ejercicios ---------- */
function ttNew(mode) {
  const n = S.n, prev = S.tm[mode];
  let st;
  if (mode === 'llenar') {
    const p = makeProblem(S.ttSrc.llenar, n, false);
    st = { n, p }; gridInit(st, [{ label: 'F', aria: 'F', truth: p.truth }]);
  } else if (mode === 'partes') {
    const max = n === 2 ? 4 : n === 3 ? 5 : 6;
    let ast, sc;
    for (let i = 0; i < 400; i++) { ast = randomExpr(n); sc = stepCols(ast); if (sc.length >= 3 && sc.length <= max) break; }
    const L = sc.length - 1;
    st = { n, ast };
    gridInit(st, sc.map((c, i) => ({ label: i === L ? 'F' : CIRC[i], aria: i === L ? 'F' : 'Columna ' + (i + 1), a: c.a, args: c.args, truth: truthOfAST(c.a, n) })));
  } else if (mode === 'circuito') {
    const c = makeCircuit(n);
    st = { n, c, cur: 0 }; gridInit(st, c.gates.map(gt => ({ label: gt.out, aria: gt.out, gt, truth: c.vals[gt.out] })));
  } else if (mode === 'equiv') {
    const e = makeEquiv(n, prev && prev.tpl);
    st = { n, ...e };
    gridInit(st, [{ label: 'E₁', aria: 'E1', a: e.a, truth: truthOfAST(e.a, n) }, { label: 'E₂', aria: 'E2', a: e.b, truth: truthOfAST(e.b, n) }]);
  } else if (mode === 'errores') {
    const p = makeProblem(S.ttSrc.errores, n, false), N = 1 << n;
    const k = n === 2 ? 1 : n === 3 ? 1 + rnd(2) : 2 + rnd(2);
    const bad = shuffle([...Array(N).keys()]).slice(0, k), shown = p.truth.slice();
    bad.forEach(m => { shown[m] = 1 - shown[m]; });
    st = { n, p, shown, bad: new Set(bad), flags: new Set(), marks: {}, done: false };
  } else if (mode === 'cual') {
    let g; do { g = pick(GATES).id; } while (prev && g === prev.g);
    const order = [...Array(1 << n).keys()];
    st = { n, g, order: S.ttShuffle ? shuffle(order) : order, chosen: null };
  }
  Object.assign(st, { mode, fb: null, counted: false, revealed: false, solved: false });
  S.tm[mode] = st;
  return st;
}
function ttNeedNew(mode) {
  const st = S.tm[mode];
  if (!st || st.n !== S.n) return true;
  if (mode === 'llenar' || mode === 'errores') return st.p.src !== S.ttSrc[mode] || (st.p.src === 'gate' && st.p.gate !== S.gate);
  return false;
}
function ttUsesGate() { const m = S.ttMode; return (m === 'llenar' || m === 'errores') && S.ttSrc[m] === 'gate'; }

/* ---------- revisión ---------- */
function minLine(F, n) { const o = minimize(F, n, 'sop'); return `Con esta tabla, la SOP mínima es <span class="ex inl">F = ${sopFromCover(o.cover, S.nt)}</span>.`; }
function ttCount(st, ok, mode) { if (st.counted) return; st.counted = true; scoreEvent('tabla', ok && !st.revealed, ok && !st.revealed ? mode : null); }
function gridCheckFb(st) {
  const r = gridCheck(st), N = 1 << st.n;
  if (r.empty) { st.fb = { kind: 'warn', html: `Te ${pl(r.empty, 'falta', 'faltan')} <b>${r.empty}</b> ${pl(r.empty, 'casilla', 'casillas')} por llenar.` }; return; }
  if (st.mode === 'equiv') {
    st.fb = r.total ? { kind: 'bad', html: `<b>Hay ${r.total} ${pl(r.total, 'casilla mal', 'casillas mal')}.</b> Corrige las marcadas en rojo.` }
      : { kind: 'ok', html: '<b>Las dos columnas están bien.</b> Ahora compáralas fila por fila y elige tu conclusión.' };
    return;
  }
  if (!r.total) {
    const F = st.cols[st.cols.length - 1].truth, k = onesOf(F).length;
    const head = st.mode === 'llenar' ? '¡Tabla correcta!' : st.mode === 'partes' ? '¡Todas las columnas están bien!' : '¡Circuito resuelto!';
    const tail = st.mode === 'llenar' ? (st.p.gate ? gateRule(GATE[st.p.gate]) : '') : minLine(F, st.n);
    st.solved = true;
    st.fb = { kind: 'ok', html: `<b>${head}</b> F vale 1 en ${k} de ${N} filas. ${tail}` };
    ttCount(st, true, st.mode);
    return;
  }
  if (st.mode === 'llenar') { st.fb = { kind: 'bad', html: `Llevas <b>${N - r.total}</b> de ${N} bien. Corrige las casillas marcadas.` }; return; }
  const name = c => st.mode === 'partes' ? `Columna ${c.label}` : c.label;
  const lines = st.cols.map((c, ci) => r.wrong[ci] ? `<li>${name(c)}: ${r.wrong[ci]} ${pl(r.wrong[ci], 'error', 'errores')}</li>` : '').join('');
  const fc = st.cols[r.wrong.findIndex(x => x > 0)];
  const tip = st.mode === 'partes' ? `la columna ${fc.label} ${opRule(fc.a.t, fc.args)}`
    : `${fc.label} sale de la compuerta ${fc.gt.g.label} con ${pl(fc.gt.ins.length, 'entrada', 'entradas')} ${listY(fc.gt.ins)}: ${gateRuleOn(fc.gt.g, fc.gt.ins)}.`;
  st.fb = { kind: 'bad', html: `<b>Hay ${r.total} ${pl(r.total, 'casilla mal', 'casillas mal')}.</b><ul>${lines}</ul><p>Pista: ${tip}</p>` };
}
function gridShow(st) {
  st.user = st.cols.map(c => c.truth.slice()); st.marks = null; st.revealed = true; st.solved = true;
  if (st.mode === 'equiv') { st.showDiff = !st.eq; st.done = true; st.fb = { kind: 'warn', html: `Esta es la respuesta: ${st.eq ? 'sí' : 'no'} son equivalentes. ${equivExplain(st, true)}` }; }
  else st.fb = { kind: 'warn', html: `Esta es la respuesta. ${st.mode === 'llenar' && st.p.gate ? gateRule(GATE[st.p.gate]) : 'Compárala con lo que tenías para ver dónde estaba el error.'}` };
  ttCount(st, false);
}
function equivExplain(st, ok) {
  if (st.eq) return `${ok ? '' : 'Tus dos columnas quedaron iguales en todas las filas, así que sí son equivalentes. '}<b>${st.tpl.law}.</b> ${lawText(st)}`;
  const d = st.cols[0].truth.map((v, m) => v !== st.cols[1].truth[m] ? m : -1).filter(m => m >= 0);
  return `${ok ? 'Las columnas' : 'Las columnas no son iguales:'} difieren en ${d.length} ${pl(d.length, 'fila', 'filas')} (${d.map(m => 'm' + m).join(', ')}), marcadas en rojo. ${lawText(st)}`;
}
function equivVerdict(st, yes) {
  if (st.done) return;
  const r = gridCheck(st);
  if (r.empty) { st.fb = { kind: 'warn', html: 'Primero llena las dos columnas: la conclusión sale de compararlas.' }; return; }
  if (r.total) { st.fb = { kind: 'bad', html: `Antes de decidir, corrige ${pl(r.total, 'la casilla marcada', 'las ' + r.total + ' casillas marcadas')} en rojo.` }; return; }
  const ok = yes === st.eq;
  st.showDiff = !st.eq; st.done = true; st.solved = true;
  st.fb = { kind: ok ? 'ok' : 'bad', html: (ok ? `<b>¡Correcto! ${st.eq ? 'Sí son equivalentes.' : 'No son equivalentes.'}</b> ` : '<b>Revisa tu conclusión.</b> ') + equivExplain(st, ok) };
  ttCount(st, ok, 'equiv');
}
function errCheck(st) {
  if (!st.flags.size) { st.fb = { kind: 'warn', html: 'Todavía no marcas ningún valor. Toca los valores de F que estén mal.' }; return; }
  const fl = [...st.flags], found = fl.filter(m => st.bad.has(m)), wrongF = fl.filter(m => !st.bad.has(m)), miss = [...st.bad].filter(m => !st.flags.has(m));
  st.marks = {};
  found.forEach(m => { st.marks[m] = 'ok'; });
  wrongF.forEach(m => { st.marks[m] = 'bad'; st.flags.delete(m); });
  if (!wrongF.length && !miss.length) {
    st.done = true; st.solved = true;
    st.fb = { kind: 'ok', html: `<b>¡Encontraste ${found.length === 1 ? 'el error' : `los ${found.length} errores`}!</b> Ya aparecen corregidos en la tabla.${st.p.gate ? ' ' + gateRule(GATE[st.p.gate]) : ''}` };
    ttCount(st, true, 'errores');
    return;
  }
  const li = [];
  if (found.length) li.push(`Encontraste ${found.length} (con borde verde).`);
  if (wrongF.length) li.push(`${pl(wrongF.length, 'El valor con borde rojo sí estaba bien', 'Los valores con borde rojo sí estaban bien')} (${wrongF.sort((a, b) => a - b).map(m => 'm' + m).join(', ')}); ya ${pl(wrongF.length, 'lo', 'los')} desmarqué.`);
  if (miss.length) li.push(`Te ${pl(miss.length, 'falta', 'faltan')} ${miss.length} por encontrar.`);
  st.fb = { kind: 'warn', html: `<b>Todavía no.</b><ul>${li.map(x => `<li>${x}</li>`).join('')}</ul>` };
}
function errShow(st) {
  st.flags = new Set(st.bad); st.marks = {}; st.done = true; st.revealed = true; st.solved = true;
  st.fb = { kind: 'warn', html: `Los errores estaban en ${[...st.bad].sort((a, b) => a - b).map(m => 'm' + m).join(', ')}. Ya aparecen corregidos.` };
  ttCount(st, false);
}
function cualAnswer(id) {
  const st = S.tm.cual; if (!st || st.chosen != null) return;
  st.chosen = id;
  const g = GATE[st.g], c = GATE[id], ok = id === st.g;
  if (ok) st.fb = { kind: 'ok', html: `<b>¡Correcto, es ${g.label}!</b> ${gateRule(g)}` };
  else {
    const t = truthOfGate(g, st.n), tc = truthOfGate(c, st.n), d = t.findIndex((v, m) => v !== tc[m]);
    st.fb = { kind: 'bad', html: `<b>No, es ${g.label}.</b> ${gateRule(g)} Con ${c.label}, la fila m${d} (${bitsOf(d, st.n).map((b, i) => VARS[i] + '=' + b).join(' ')}) daría ${tc[d]}, y en esta tabla vale ${t[d]}.` };
  }
  scoreEvent('tabla', ok, ok ? 'cual' : null);
  rBody(); focusSel('#ttBody [data-act="next"]');
}
function cualNext() { ttNew('cual'); rBody(); focusSel('#ttBody .gch'); }

/* ---------- ronda rápida ---------- */
function rpCard(n, lastKey) {
  for (;;) { const g = pick(GATES), m = rnd(1 << n), key = g.id + m; if (key !== lastKey) return { g: g.id, m, key, ans: g.f(bitsOf(m, n)) ? 1 : 0 }; }
}
function stopRapida(abort) {
  clearInterval(S.rpTimer); S.rpTimer = null;
  const st = S.tm.rapida;
  if (abort && st && st.phase === 'run') st.phase = 'start';
}
function startRapida() {
  const st = S.tm.rapida;
  Object.assign(st, { phase: 'run', dur: S.rpDur, n: S.n, ok: 0, bad: 0, mistakes: [], last: null, t0: Date.now(), newRec: false });
  st.card = rpCard(st.n, null);
  clearInterval(S.rpTimer); S.rpTimer = setInterval(tickRapida, 100);
}
function tickRapida() {
  const st = S.tm.rapida;
  if (!st || st.phase !== 'run') { stopRapida(); return; }
  const left = st.dur - (Date.now() - st.t0) / 1000;
  if (left <= 0) { endRapida(); return; }
  const bar = $('#rpBar'), t = $('#rpLeft');
  if (bar) bar.style.width = (left / st.dur * 100) + '%';
  if (t) t.textContent = Math.ceil(left) + ' s';
}
function endRapida() {
  stopRapida();
  const st = S.tm.rapida, key = `${st.dur}-${st.n}`, best = S.stats.rapida[key], pts = Math.max(0, st.ok - st.bad);
  st.phase = 'end'; st.pts = pts; st.prev = best;
  st.newRec = st.ok > 0 && (best == null || pts > best);
  if (st.newRec) { S.stats.rapida[key] = pts; store.set('stats', S.stats); }
  if (S.tab === 'tabla' && S.ttMode === 'rapida') rBody();
}
function answerRapida(v) {
  const st = S.tm.rapida; if (!st || st.phase !== 'run') return;
  const c = st.card, ok = v === c.ans;
  if (ok) st.ok++; else { st.bad++; st.mistakes.push({ ...c, v }); }
  st.last = { ...c, v, ok };
  st.card = rpCard(st.n, c.key);
  rBody();
}
function renderRapida() {
  let st = S.tm.rapida;
  if (!st) st = S.tm.rapida = { mode: 'rapida', phase: 'start' };
  if (st.phase === 'run' && st.n !== S.n) stopRapida(true);
  const key = `${S.rpDur}-${S.n}`, rec = S.stats.rapida[key];
  let h;
  if (st.phase === 'start') {
    h = `<article class="panel rp"><div class="kicker">Ronda rápida</div><h2 class="ptitle">¿Cuánto vale F?</h2>
      <p class="hint">Aparece una compuerta de ${S.n} entradas con sus valores y respondes 0 o 1 lo más rápido que puedas. Con teclado usa las teclas 0 y 1. Los puntos son aciertos menos errores, así que adivinar no conviene.</p>
      <div class="qset"><div class="field"><span class="flabel" id="lblRd">Duración</span><div class="seg" role="radiogroup" aria-labelledby="lblRd">${[30, 60, 120].map(d => `<button type="button" role="radio" data-dur="${d}" aria-checked="${S.rpDur === d}">${d} s</button>`).join('')}</div></div></div>
      <p class="meta">${rec != null ? `Récord con ${S.rpDur} s y ${S.n} entradas: ${rec} ${pl(rec, 'punto', 'puntos')}` : `Todavía no tienes récord con ${S.rpDur} s y ${S.n} entradas.`}</p>
      <div class="actions"><button class="btn primary" type="button" data-act="rp-start">Comenzar</button></div></article>`;
  } else if (st.phase === 'run') {
    const left = Math.max(0, st.dur - (Date.now() - st.t0) / 1000), g = GATE[st.card.g], bits = bitsOf(st.card.m, st.n);
    const L = st.last;
    const lastTxt = L ? `${L.ok ? '✓' : '✗'} ${GATE[L.g].label}(${bitsOf(L.m, st.n).join(', ')}) = ${L.ans}${L.ok ? '' : ` · respondiste ${L.v}`}` : 'Responde con los botones o con las teclas 0 y 1.';
    h = `<article class="panel rp"><div class="rphead"><span>Aciertos <b>${st.ok}</b> · Errores <b>${st.bad}</b></span><span id="rpLeft">${Math.ceil(left)} s</span></div>
      <div class="rptime"><span id="rpBar" style="width:${left / st.dur * 100}%"></span></div>
      <div class="rpcard"><div class="rpgate">${g.label}</div>${gateSVG(g, st.n, { inputs: bits, out: 'hide', ic: false })}
      <div class="rpbtns"><button type="button" class="rpbtn" data-act="rp-ans" data-v="0" aria-label="F vale 0">0</button><button type="button" class="rpbtn" data-act="rp-ans" data-v="1" aria-label="F vale 1">1</button></div>
      <div class="rplast ${L ? (L.ok ? 'ok' : 'bad') : ''}" aria-live="polite">${lastTxt}</div></div></article>`;
  } else {
    const seen = new Set(), miss = st.mistakes.filter(x => { if (seen.has(x.key)) return false; seen.add(x.key); return true; }).slice(0, 8);
    h = `<article class="panel rp"><div class="kicker">Ronda rápida · ${st.dur} s · ${st.n} entradas</div><div class="bigscore">${st.pts}<small> ${pl(st.pts, 'punto', 'puntos')}</small></div>
      <p class="hint" style="margin-top:8px">${st.ok} ${pl(st.ok, 'acierto', 'aciertos')} y ${st.bad} ${pl(st.bad, 'error', 'errores')}.${st.newRec ? ' <b>¡Nuevo récord!</b>' : st.prev != null ? ` Tu récord es ${st.prev}.` : ''}</p>
      ${miss.length ? `<ul class="review">${miss.map(x => { const g = GATE[x.g]; return `<li><div class="rq">${g.label} con ${bitsOf(x.m, st.n).map((b, i) => `${VARS[i]} = ${b}`).join(', ')}: respondiste ${x.v}, era ${x.ans}.</div><div class="ra">${gateRule(g)}</div></li>`; }).join('')}</ul>` : ''}
      <div class="actions"><button class="btn primary" type="button" data-act="rp-start">Otra ronda</button><button class="btn" type="button" data-act="rp-menu">Cambiar duración</button></div></article>`;
  }
  $('#ttBody').innerHTML = h;
}

/* ---------- vistas por modo ---------- */
const GRID_HINT = 'Toca una casilla para cambiarla entre 1 y 0. Con teclado escribe 0 o 1 y pasas sola a la siguiente fila; las flechas te mueven entre casillas.';
const NEW_BTN = '<button class="btn" type="button" data-act="new">Nuevo ejercicio</button>';
const ttBar = (inner = '') => `<div class="exbar">${inner}<div class="score">${scoreHTML('tabla')}</div></div>`;
const fbHTML = f => `<div class="fb${f ? ' ' + f.kind : ''}" role="status" aria-live="polite">${f ? f.html : ''}</div>`;
const gridActions = () => '<div class="actions"><button class="btn primary" type="button" data-act="check">Revisar</button><button class="btn" type="button" data-act="clear">Borrar todo</button><button class="btn ghost" type="button" data-act="show">Ver respuesta</button></div>';
function srcSelect(mode) { return `<label class="sel" for="ttSrc">Ejercicio <select id="ttSrc" data-mode="${mode}">${TT_SRC[mode].map(([v, l]) => `<option value="${v}"${S.ttSrc[mode] === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`; }

function rLlenar() {
  const st = S.tm.llenar;
  $('#ttBody').innerHTML = ttBar(srcSelect('llenar') + NEW_BTN) + `<div class="pgrid"><article class="panel prompt">${promptHTML(st.p, 'tabla')}</article>
    <article class="panel"><div class="ph"><h2>Llena la columna F</h2><span class="meta">${filledMeta(st)}</span></div><p class="hint">${GRID_HINT}</p>
    <div class="ttbox">${gridHTML(st.n, viewCols(st), st)}</div>${gridActions()}${fbHTML(st.fb)}</article></div>`;
}
function rPartes() {
  const st = S.tm.partes;
  $('#ttBody').innerHTML = ttBar(NEW_BTN) + `<div class="stack"><article class="panel prompt"><div class="kicker">Expresión · ${st.n} variables · ${st.cols.length} columnas</div><div class="ex big">F = ${astHTML(st.ast, S.nt)}</div>
    <p class="hint">Resuelve la tabla por partes: cada columna se calcula con las anteriores. Debajo de cada encabezado dice qué operación es y con qué columnas se hace; la última columna es F.</p></article>
    <article class="panel"><div class="ph"><h2>Llena todas las columnas</h2><span class="meta">${filledMeta(st)}</span></div><p class="hint">${GRID_HINT}</p>
    <div class="ttbox">${gridHTML(st.n, viewCols(st), st)}</div>${gridActions()}${fbHTML(st.fb)}</article></div>`;
}
function rCircuito() {
  const st = S.tm.circuito, outs = st.c.gates.map(g => g.out), inter = outs.slice(0, -1), done = st.solved || st.revealed;
  const interTxt = inter.length > 1 ? `${listY(inter)} son señales intermedias: cada una sale de una compuerta y entra a otra.` : `${inter[0]} es una señal intermedia: sale de una compuerta y entra a otra.`;
  $('#ttBody').innerHTML = ttBar(NEW_BTN + `<button class="btn" type="button" data-act="names" aria-pressed="${S.circNames}">${S.circNames ? 'Ocultar nombres' : 'Mostrar nombres'}</button>`) +
    `<div class="pgrid"><article class="panel prompt"><div class="kicker">Circuito · ${st.n} entradas · ${st.c.gates.length} compuertas</div><div id="ttCirc">${circBox(st)}</div>
    <p class="hint">${interTxt} Toca una fila de la tabla para ver esas entradas en los cables.${S.circNames ? '' : ' Reconoce cada compuerta por su forma, o pulsa Mostrar nombres.'}</p>
    ${done ? `<div class="direct"><span class="dlabel">Expresión del circuito</span><span class="ex">F = ${astHTML(circuitAST(st.c), S.nt)}</span></div>` : ''}</article>
    <article class="panel"><div class="ph"><h2>Llena ${listY(outs)}</h2><span class="meta">${filledMeta(st)}</span></div><p class="hint">${GRID_HINT}</p>
    <div class="ttbox">${gridHTML(st.n, viewCols(st), st, { cur: st.cur, rowClick: true })}</div>${gridActions()}${fbHTML(st.fb)}</article></div>`;
}
function rEquiv() {
  const st = S.tm.equiv;
  const diff = st.showDiff ? st.cols[0].truth.map((v, m) => v !== st.cols[1].truth[m] ? 'diff' : '') : null;
  $('#ttBody').innerHTML = ttBar(NEW_BTN) + `<div class="pgrid"><article class="panel prompt"><div class="kicker">¿Son equivalentes? · ${st.n} variables</div>
    <div class="ex big">E₁ = ${astHTML(st.a, S.nt)}</div><div class="ex big">E₂ = ${astHTML(st.b, S.nt)}</div>
    <p class="hint">Dos expresiones son equivalentes si dan el mismo valor en todas las filas. Llena las dos columnas, compáralas y elige tu conclusión.</p></article>
    <article class="panel"><div class="ph"><h2>Llena E₁ y E₂</h2><span class="meta">${filledMeta(st)}</span></div><p class="hint">${GRID_HINT}</p>
    <div class="ttbox">${gridHTML(st.n, viewCols(st), st, { rowCls: diff })}</div>
    <div class="actions"><button class="btn" type="button" data-act="check">Revisar columnas</button><button class="btn" type="button" data-act="clear">Borrar todo</button><button class="btn ghost" type="button" data-act="show">Ver respuesta</button></div>
    <div class="verdict"><span class="flabel">Tu conclusión</span><button class="btn primary" type="button" data-act="v-yes" ${st.done ? 'disabled' : ''}>Sí son equivalentes</button><button class="btn primary" type="button" data-act="v-no" ${st.done ? 'disabled' : ''}>No son equivalentes</button></div>
    ${fbHTML(st.fb)}</article></div>`;
}
function rErrores() {
  const st = S.tm.errores, n = st.n, N = 1 << n;
  let rows = '';
  for (let m = 0; m < N; m++) {
    const fl = st.flags.has(m), mk = st.marks[m] || '', fix = st.done && st.bad.has(m), v = st.shown[m];
    rows += `<tr data-m="${m}"><td class="mi">${m}</td>${bitsOf(m, n).map(x => `<td>${x}</td>`).join('')}<td class="edit sep"><button type="button" class="fbtn ${fix ? 'fixed' : 'v' + v}${fl && !fix ? ' flag' : ''} ${mk}" data-m="${m}" aria-pressed="${fl}" ${st.done ? 'disabled' : ''} aria-label="F en la fila ${m} vale ${v}${fl ? ', marcada como error' : ''}">${fix ? `${v}→${1 - v}` : v}</button></td></tr>`;
  }
  $('#ttBody').innerHTML = ttBar(srcSelect('errores') + NEW_BTN) + `<div class="pgrid"><article class="panel prompt">${promptHTML(st.p, 'tabla')}</article>
    <article class="panel"><div class="ph"><h2>Encuentra los errores</h2><span class="meta">${st.flags.size} ${pl(st.flags.size, 'marcado', 'marcados')}</span></div>
    <p class="hint">Esta tabla tiene al menos un error en la columna F. Revisa fila por fila y toca cada valor que esté mal para tacharlo; tócalo otra vez para desmarcarlo.</p>
    <div class="ttbox"><table class="tt"><thead><tr><th class="mi" scope="col">m</th>${VARS.slice(0, n).map(v => `<th scope="col">${v}</th>`).join('')}<th class="xc sep" scope="col"><span class="cl">F</span></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="actions"><button class="btn primary" type="button" data-act="check">Revisar</button><button class="btn" type="button" data-act="clear">Quitar marcas</button><button class="btn ghost" type="button" data-act="show">Ver respuesta</button></div>${fbHTML(st.fb)}</article></div>`;
}
function rCual() {
  const st = S.tm.cual, n = st.n, truth = truthOfGate(GATE[st.g], n);
  let rows = '';
  for (const m of st.order) rows += `<tr><td class="mi">${m}</td>${bitsOf(m, n).map(x => `<td>${x}</td>`).join('')}<td class="fcol${truth[m] ? ' on' : ''}">${truth[m]}</td></tr>`;
  const ch = GATES.map(x => {
    let cls = 'gch';
    if (st.chosen != null) cls += x.id === st.g ? ' ok' : x.id === st.chosen ? ' bad' : ' dimmed';
    return `<button type="button" class="${cls}" data-g="${x.id}" ${st.chosen != null ? 'disabled' : ''}>${gateMini(x)}<span>${x.label}</span></button>`;
  }).join('');
  $('#ttBody').innerHTML = ttBar(`<div class="seg txt" role="radiogroup" aria-label="Orden de las filas"><button type="button" role="radio" data-ord="0" aria-checked="${!S.ttShuffle}">Filas en orden</button><button type="button" role="radio" data-ord="1" aria-checked="${S.ttShuffle}">Filas en desorden</button></div>`) +
    `<div class="pgrid"><article class="panel"><div class="ph"><h2>Tabla de verdad</h2><span class="meta">${n} entradas${S.ttShuffle ? ' · filas revueltas' : ''}</span></div>
    <div class="ttbox"><table class="tt"><thead><tr><th class="mi" scope="col">m</th>${VARS.slice(0, n).map(v => `<th scope="col">${v}</th>`).join('')}<th class="fcol" scope="col">F</th></tr></thead><tbody>${rows}</tbody></table></div></article>
    <article class="panel"><div class="ph"><h2>¿Qué compuerta es?</h2></div><p class="hint">Cuenta cuántos 1 hay y fíjate en qué filas están. Si F solo sigue a una entrada, es NOT o Buffer.</p>
    <div class="gchoices">${ch}</div>${fbHTML(st.fb)}${st.chosen != null ? '<div class="actions"><button class="btn primary" type="button" data-act="next">Siguiente</button><span class="hint" style="margin:0;align-self:center">o pulsa Enter</span></div>' : ''}</article></div>`;
}

function renderModes() {
  $('#ttModes').innerHTML = TT_MODES.map(md => {
    const c = S.stats.modos[md.id] || 0;
    return `<button type="button" role="radio" class="mode" data-mode="${md.id}" aria-checked="${md.id === S.ttMode}"><span class="mn">${md.name}</span><span class="md">${md.desc}</span>${c ? `<span class="mc">✓ ${c} ${pl(c, 'resuelto', 'resueltos')}</span>` : ''}</button>`;
  }).join('');
}
function rBody() {
  const mode = S.ttMode;
  if (mode === 'rapida') renderRapida();
  else {
    if (ttNeedNew(mode)) ttNew(mode);
    ({ llenar: rLlenar, partes: rPartes, circuito: rCircuito, equiv: rEquiv, errores: rErrores, cual: rCual })[mode]();
  }
  renderModes();
}
function renderTablaTab() { if (S.rpTimer && S.ttMode !== 'rapida') stopRapida(true); rBody(); }
function setCircRow(m) {
  const st = S.tm.circuito; if (!st || st.cur === m) return;
  st.cur = m;
  const box = $('#ttCirc'); if (box) box.innerHTML = circBox(st);
  $$('#ttBody tr[data-m]').forEach(tr => tr.classList.toggle('cur', +tr.dataset.m === m));
}

/* ---------- eventos ---------- */
function ttClick(e) {
  const mode = S.ttMode, st = S.tm[mode], act = e.target.closest('[data-act]'), a = act && act.dataset.act;
  if (mode === 'rapida') {
    const d = e.target.closest('[data-dur]');
    if (d) { S.rpDur = +d.dataset.dur; store.set('rpDur', S.rpDur); rBody(); focusSel(`#ttBody [data-dur="${S.rpDur}"]`); return; }
    if (a === 'rp-start') { startRapida(); rBody(); }
    else if (a === 'rp-ans') answerRapida(+act.dataset.v);
    else if (a === 'rp-menu') { S.tm.rapida.phase = 'start'; rBody(); }
    return;
  }
  if (!st) return;
  if (a === 'new') { ttNew(mode); rBody(); return; }
  if (mode === 'cual') {
    const o = e.target.closest('[data-ord]');
    if (o) {
      S.ttShuffle = o.dataset.ord === '1'; store.set('ttShuffle', S.ttShuffle);
      if (st.chosen == null) { const ord = [...Array(1 << st.n).keys()]; st.order = S.ttShuffle ? shuffle(ord) : ord; }
      rBody(); return;
    }
    const g = e.target.closest('.gch[data-g]'); if (g) { cualAnswer(g.dataset.g); return; }
    if (a === 'next') cualNext();
    return;
  }
  if (mode === 'errores') {
    const b = e.target.closest('.fbtn[data-m]');
    if (b) {
      if (st.done) return;
      const m = +b.dataset.m;
      if (st.flags.has(m)) st.flags.delete(m); else st.flags.add(m);
      delete st.marks[m]; st.fb = null;
      rBody(); focusSel(`#ttBody .fbtn[data-m="${m}"]`); return;
    }
    if (a === 'check') errCheck(st);
    else if (a === 'clear') { st.flags.clear(); st.marks = {}; st.fb = null; }
    else if (a === 'show') errShow(st);
    else return;
    rBody(); return;
  }
  const b = e.target.closest('.fbtn[data-c]');
  if (b) {
    const ci = +b.dataset.c, m = +b.dataset.m;
    gridSet(st, ci, m, st.user[ci][m] === 1 ? 0 : 1);
    if (mode === 'circuito') st.cur = m;
    rBody(); focusSel(`#ttBody .fbtn[data-c="${ci}"][data-m="${m}"]`); return;
  }
  if (mode === 'circuito' && !act) { const tr = e.target.closest('tr[data-m]'); if (tr) setCircRow(+tr.dataset.m); return; }
  if (a === 'names') { S.circNames = !S.circNames; store.set('circNames', S.circNames); }
  else if (a === 'check') gridCheckFb(st);
  else if (a === 'clear') { gridInit(st, st.cols); st.fb = null; st.showDiff = false; }
  else if (a === 'show') gridShow(st);
  else if (a === 'v-yes' || a === 'v-no') equivVerdict(st, a === 'v-yes');
  else return;
  rBody();
  if (a === 'names') focusSel('#ttBody [data-act="names"]');
}
function ttGridKeys(e) {
  const b = e.target.closest('.fbtn[data-c]'); if (!b) return;
  const st = S.tm[S.ttMode]; if (!st || !st.cols) return;
  const ci = +b.dataset.c, m = +b.dataset.m, N = 1 << st.n, C = st.cols.length;
  const go = (c, r) => focusSel(`#ttBody .fbtn[data-c="${c}"][data-m="${r}"]`);
  if (e.key === '0' || e.key === '1') {
    e.preventDefault(); gridSet(st, ci, m, +e.key); rBody();
    if (m + 1 < N) go(ci, m + 1); else if (ci + 1 < C) go(ci + 1, 0); else go(ci, m);
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault(); gridSet(st, ci, m, null); rBody(); go(ci, m);
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault(); go(ci, Math.max(0, Math.min(N - 1, m + (e.key === 'ArrowDown' ? 1 : -1))));
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault(); go(Math.max(0, Math.min(C - 1, ci + (e.key === 'ArrowRight' ? 1 : -1))), m);
  }
}
function initTabla() {
  $('#ttModes').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]'); if (!b) return;
    S.ttMode = b.dataset.mode; store.set('ttMode', S.ttMode);
    render(); focusSel(`#ttModes [data-mode="${S.ttMode}"]`);
  });
  const B = $('#ttBody');
  B.addEventListener('change', e => { if (e.target.id === 'ttSrc') { S.ttSrc[e.target.dataset.mode] = e.target.value; store.set('ttSrc', S.ttSrc); render(); focusSel('#ttSrc'); } });
  B.addEventListener('click', ttClick);
  B.addEventListener('keydown', ttGridKeys);
  B.addEventListener('focusin', e => { if (S.ttMode !== 'circuito') return; const b = e.target.closest('.fbtn[data-m]'); if (b) setCircRow(+b.dataset.m); });
  document.addEventListener('keydown', e => {
    if (S.tab !== 'tabla' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (S.ttMode === 'rapida') {
      const st = S.tm.rapida;
      if (st && st.phase === 'run' && (e.key === '0' || e.key === '1')) { e.preventDefault(); answerRapida(+e.key); }
    } else if (S.ttMode === 'cual' && e.key === 'Enter') {
      const st = S.tm.cual;
      if (st && st.chosen != null && !e.target.closest('button,select,input')) { e.preventDefault(); cualNext(); }
    }
  });
}
