// Molde elástico do mapa facial.
// Algumas "alças" (olhos, nariz, boca, queixo, testa, laterais do rosto) são arrastadas
// para o lugar certo na foto do paciente. Todos os pontos e linhas do mapa acompanham,
// esticando como borracha (deformação "thin-plate spline").
// Coordenadas no espaço do desenho: largura 400, altura 533 (o viewBox do mapa).

export type Pt = [number, number];

export interface Alca {
  id: string;
  nome: string;
  base: Pt; // posição no desenho padrão
}

export const ALCAS: Alca[] = [
  { id: 'testa', nome: 'Meio da testa', base: [200, 101] },
  { id: 'olho_d', nome: 'Olho D', base: [142, 219] },
  { id: 'olho_e', nome: 'Olho E', base: [258, 219] },
  { id: 'nariz', nome: 'Ponta do nariz', base: [200, 285] },
  { id: 'boca', nome: 'Centro da boca', base: [200, 330] },
  { id: 'queixo', nome: 'Queixo', base: [200, 405] },
  { id: 'lado_d', nome: 'Lateral D', base: [88, 266] },
  { id: 'lado_e', nome: 'Lateral E', base: [312, 266] },
];

export type Molde = Record<string, Pt>;

export function moldePadrao(): Molde {
  return Object.fromEntries(ALCAS.map((a) => [a.id, [...a.base] as Pt]));
}

export function moldeEhPadrao(m: Molde | undefined | null): boolean {
  if (!m) return true;
  return ALCAS.every((a) => {
    const p = m[a.id];
    return !p || (Math.abs(p[0] - a.base[0]) < 0.01 && Math.abs(p[1] - a.base[1]) < 0.01);
  });
}

const U = (r2: number) => (r2 === 0 ? 0 : r2 * Math.log(r2));

// Resolve um sistema linear pequeno (eliminação de Gauss com pivô)
function resolver(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((linha, i) => [...linha, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / piv;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((linha, i) => linha[n] / (linha[i] || 1e-12));
}

/** Cria a função que leva um ponto do desenho padrão para o lugar dele na foto do paciente. */
export function criarDeformacao(molde: Molde | undefined | null): (p: Pt) => Pt {
  if (moldeEhPadrao(molde)) return (p) => p;
  const src = ALCAS.map((a) => a.base);
  const dst = ALCAS.map((a) => molde![a.id] || a.base);
  const n = src.length;
  const L: number[][] = [];
  for (let i = 0; i < n; i++) {
    const linha: number[] = [];
    for (let j = 0; j < n; j++) {
      const dx = src[i][0] - src[j][0], dy = src[i][1] - src[j][1];
      linha.push(U(dx * dx + dy * dy));
    }
    linha.push(1, src[i][0], src[i][1]);
    L.push(linha);
  }
  L.push([...Array(n).fill(1), 0, 0, 0]);
  L.push([...src.map((s) => s[0]), 0, 0, 0]);
  L.push([...src.map((s) => s[1]), 0, 0, 0]);
  const wx = resolver(L, [...dst.map((d) => d[0]), 0, 0, 0]);
  const wy = resolver(L, [...dst.map((d) => d[1]), 0, 0, 0]);
  return ([x, y]) => {
    let fx = wx[n] + wx[n + 1] * x + wx[n + 2] * y;
    let fy = wy[n] + wy[n + 1] * x + wy[n + 2] * y;
    for (let i = 0; i < n; i++) {
      const dx = x - src[i][0], dy = y - src[i][1];
      const u = U(dx * dx + dy * dy);
      fx += wx[i] * u;
      fy += wy[i] * u;
    }
    return [fx, fy];
  };
}

/** Elipse (ou círculo) como lista de pontos já deformados, para desenhar como polígono. */
export function elipseDeformada(w: (p: Pt) => Pt, cx: number, cy: number, rx: number, ry: number, passos = 36): string {
  const pts: string[] = [];
  for (let i = 0; i < passos; i++) {
    const t = (i / passos) * Math.PI * 2;
    const [x, y] = w([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Curva cúbica deformada, desenhada como linha com vários pontos (fica fiel mesmo esticada). */
export function curvaDeformada(w: (p: Pt) => Pt, segmentos: Pt[][]): string {
  // segmentos: [[p0, c1, c2, p1], [c1, c2, p2], ...] no formato de um path "M p0 C c1 c2 p1 ..."
  const pts: Pt[] = [];
  let atual = segmentos[0][0];
  pts.push(w(atual));
  segmentos.forEach((seg, i) => {
    const [c1, c2, fim] = i === 0 ? [seg[1], seg[2], seg[3]] : [seg[0], seg[1], seg[2]];
    for (let k = 1; k <= 16; k++) {
      const t = k / 16, m = 1 - t;
      const x = m * m * m * atual[0] + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * fim[0];
      const y = m * m * m * atual[1] + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * fim[1];
      pts.push(w([x, y]));
    }
    atual = fim;
  });
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}
