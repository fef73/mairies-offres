// qr.js — générateur de QR code minimal, sans dépendance
// Mode octet (UTF-8), correction d'erreur M (~15 %), versions 1 à 10 (jusqu'à 213 octets).
// QR.svg(texte) → chaîne SVG · QR.canvas(texte, px) → <canvas> · QR.encode(texte) → {size, get(x,y)}
const QR = (() => {
  const EC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]; // codewords de correction par bloc (niveau M)
  const NB = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];           // nombre de blocs (niveau M)
  const rawModules = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
  const align = v => { if (v === 1) return []; const n = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, r = [6]; for (let p = v * 4 + 10; r.length < n; p -= step) r.splice(1, 0, p); return r; };

  // Reed-Solomon sur GF(256), polynôme 0x11D
  const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => a && b ? EXP[LOG[a] + LOG[b]] : 0;
  const rsGen = n => { let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); g.forEach((c, j) => { ng[j] ^= c; ng[j + 1] ^= mul(c, EXP[i]); }); g = ng; } return g; };
  const rsRem = (data, n) => { const g = rsGen(n), r = new Array(n).fill(0); for (const d of data) { const f = d ^ r.shift(); r.push(0); for (let i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f); } return r; };

  function encode(text) {
    const bytes = [...new TextEncoder().encode(text)];
    let v = 1, cap;
    for (; v <= 10; v++) { cap = Math.floor(rawModules(v) / 8) - EC[v] * NB[v]; if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap * 8) break; }
    if (v > 10) throw new Error('Texte trop long pour le QR code');

    // Données : mode octet, longueur, octets, terminaison, bourrage
    const bits = [], put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push(val >>> i & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, cap * 8 - bits.length)); while (bits.length % 8) bits.push(0);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let p = 0xEC; data.length < cap; p ^= 0xEC ^ 0x11) data.push(p);

    // Blocs + correction, entrelacés
    const nb = NB[v], ec = EC[v], raw = Math.floor(rawModules(v) / 8), nShort = nb - raw % nb, lenShort = Math.floor(raw / nb) - ec;
    const blocks = []; for (let i = 0, k = 0; i < nb; i++) { const len = lenShort + (i < nShort ? 0 : 1), d = data.slice(k, k + len); k += len; blocks.push({ d, e: rsRem(d, ec) }); }
    const cw = []; for (let i = 0; i <= lenShort; i++) blocks.forEach(b => { if (i < b.d.length) cw.push(b.d[i]); });
    for (let i = 0; i < ec; i++) blocks.forEach(b => cw.push(b.e[i]));

    // Matrice : motifs fixes
    const N = v * 4 + 17, M = [...Array(N)].map(() => new Array(N).fill(false)), F = [...Array(N)].map(() => new Array(N).fill(false));
    const set = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < N; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); set(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(N - 4, 3); finder(3, N - 4);
    const al = align(v), last = al[al.length - 1];
    al.forEach(a => al.forEach(b => { if ((a === 6 && b === 6) || (a === 6 && b === last) || (a === last && b === 6)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
    const drawFormat = mask => {
      const fd = mask; // niveau M = 00
      let r = fd; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = (fd << 10 | r) ^ 0x5412, bit = i => (b >>> i & 1) === 1;
      for (let i = 0; i <= 5; i++) set(8, i, bit(i));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) set(N - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) set(8, N - 15 + i, bit(i));
      set(8, N - 8, true);
    };
    drawFormat(0);
    if (v >= 7) { let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const b = v << 12 | r;
      for (let i = 0; i < 18; i++) { const bt = (b >>> i & 1) === 1, a = N - 11 + i % 3, c = Math.floor(i / 3); set(a, c, bt); set(c, a, bt); } }

    // Placement en zigzag
    let i = 0;
    for (let right = N - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
      for (let vert = 0; vert < N; vert++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? N - 1 - vert : vert;
        if (!F[y][x] && i < cw.length * 8) { M[y][x] = (cw[i >>> 3] >>> (7 - (i & 7)) & 1) === 1; i++; } } }

    // Masque : le moins pénalisé parmi 6 (masques 1 et 2, en rayures, écartés : moins bien lus par certains lecteurs)
    const MASK = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const apply = m => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!F[y][x] && MASK[m](x, y)) M[y][x] = !M[y][x]; };
    const penalty = () => { let p = 0, dark = 0;
      for (let a = 0; a < 2; a++) for (let k = 0; k < N; k++) { let run = 1; for (let j = 1; j < N; j++) { const c = a ? M[j][k] : M[k][j], pr = a ? M[j - 1][k] : M[k][j - 1]; if (c === pr) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) { const c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
      // motifs ressemblant aux carrés de repérage (1011101 bordé de 4 clairs)
      const P1 = '10111010000', P2 = '00001011101';
      for (let a = 0; a < 2; a++) for (let k = 0; k < N; k++) { let s = '0000'; for (let j = 0; j < N; j++) s += (a ? M[j][k] : M[k][j]) ? '1' : '0'; s += '0000';
        for (let j = 0; j + 11 <= s.length; j++) { const w = s.substr(j, 11); if (w === P1 || w === P2) p += 40; } }
      M.forEach(r => r.forEach(c => dark += c)); return p + Math.floor(Math.abs(dark * 20 - N * N * 10) / (N * N)) * 10; };
    let best = 0, bp = Infinity;
    for (const m of [0, 3, 4, 5, 6, 7]) { apply(m); drawFormat(m); const p = penalty(); if (p < bp) { bp = p; best = m; } apply(m); }
    apply(best); drawFormat(best);
    return { size: N, get: (x, y) => M[y][x] };
  }

  function svg(text, { margin = 4, dark = '#000', light = '#fff' } = {}) {
    const q = encode(text), n = q.size + margin * 2; let d = '';
    for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.get(x, y)) d += `M${x + margin},${y + margin}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
  }
  function canvas(text, px = 1024, margin = 4) {
    const q = encode(text), n = q.size + margin * 2, s = Math.max(1, Math.floor(px / n)), c = document.createElement('canvas');
    c.width = c.height = s * n; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
    for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.get(x, y)) g.fillRect((x + margin) * s, (y + margin) * s, s, s);
    return c;
  }
  return { encode, svg, canvas };
})();
