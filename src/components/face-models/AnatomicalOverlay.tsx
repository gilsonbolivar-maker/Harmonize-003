import React from 'react';
import { Pt, curvaDeformada, elipseDeformada } from '../../lib/molde';

export interface LandmarkDot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  category: 'frontal' | 'glabela' | 'periorbital' | 'nasal' | 'malar_mandibula' | 'mento_pescoco';
  color: string;
  name: string;
  recommendedProduct: 'botox' | 'acido_hialuronico' | 'bioestimulador' | 'fios_pdo';
  defaultDose: number;
  doseUnit: 'U' | 'ml' | 'fios';
}

export const ANATOMICAL_LANDMARKS: LandmarkDot[] = [
  // Frontal / Temporal (Azul / Blue)
  { id: 'lm-f1', x: 28, y: 23, category: 'frontal', color: '#0284c7', name: 'Frontal Superior Lateral D', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-f2', x: 35, y: 20, category: 'frontal', color: '#0284c7', name: 'Frontal Superior Médio D', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-f3', x: 43, y: 19, category: 'frontal', color: '#0284c7', name: 'Frontal Superior Paramediano D', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-f4', x: 50, y: 19, category: 'frontal', color: '#0284c7', name: 'Frontal Superior Central', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' },
  { id: 'lm-f5', x: 57, y: 19, category: 'frontal', color: '#0284c7', name: 'Frontal Superior Paramediano E', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-f6', x: 65, y: 20, category: 'frontal', color: '#0284c7', name: 'Frontal Superior Médio E', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-f7', x: 72, y: 23, category: 'frontal', color: '#0284c7', name: 'Frontal Superior Lateral E', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-f8', x: 50, y: 27, category: 'frontal', color: '#0284c7', name: 'Frontal Médio Central', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-f9', x: 27, y: 29, category: 'frontal', color: '#0284c7', name: 'Têmpora Superior D', recommendedProduct: 'botox', defaultDose: 1, doseUnit: 'U' },
  { id: 'lm-f10', x: 73, y: 29, category: 'frontal', color: '#0284c7', name: 'Têmpora Superior E', recommendedProduct: 'botox', defaultDose: 1, doseUnit: 'U' },
  { id: 'lm-f11', x: 23, y: 33, category: 'frontal', color: '#0284c7', name: 'Linha Temporal D', recommendedProduct: 'botox', defaultDose: 1, doseUnit: 'U' },
  { id: 'lm-f12', x: 77, y: 33, category: 'frontal', color: '#0284c7', name: 'Linha Temporal E', recommendedProduct: 'botox', defaultDose: 1, doseUnit: 'U' },

  // Glabela & Prócero & Dorso Superior (Amarelo / Yellow)
  { id: 'lm-g1', x: 50, y: 34, category: 'glabela', color: '#eab308', name: 'Prócero Superior', recommendedProduct: 'botox', defaultDose: 4, doseUnit: 'U' },
  { id: 'lm-g2', x: 50, y: 38, category: 'glabela', color: '#eab308', name: 'Prócero / Radix Central', recommendedProduct: 'botox', defaultDose: 4, doseUnit: 'U' },
  { id: 'lm-g3', x: 44.5, y: 36, category: 'glabela', color: '#eab308', name: 'Corrugador Medial D', recommendedProduct: 'botox', defaultDose: 4, doseUnit: 'U' },
  { id: 'lm-g4', x: 55.5, y: 36, category: 'glabela', color: '#eab308', name: 'Corrugador Medial E', recommendedProduct: 'botox', defaultDose: 4, doseUnit: 'U' },
  { id: 'lm-g5', x: 39, y: 34.5, category: 'glabela', color: '#eab308', name: 'Corrugador Cauda D', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' },
  { id: 'lm-g6', x: 61, y: 34.5, category: 'glabela', color: '#eab308', name: 'Corrugador Cauda E', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' },
  { id: 'lm-g7', x: 33, y: 33.5, category: 'glabela', color: '#eab308', name: 'Supraorbital Lateral D', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-g8', x: 67, y: 33.5, category: 'glabela', color: '#eab308', name: 'Supraorbital Lateral E', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },

  // Periorbital & Pés de Galinha (Rosa / Magenta)
  { id: 'lm-p1', x: 26, y: 36.5, category: 'periorbital', color: '#d946ef', name: 'Orbicular Superior Lateral D', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-p2', x: 74, y: 36.5, category: 'periorbital', color: '#d946ef', name: 'Orbicular Superior Lateral E', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-p3', x: 24, y: 40.5, category: 'periorbital', color: '#d946ef', name: 'Canto Lateral D1 (Pé de Galinha)', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' },
  { id: 'lm-p4', x: 76, y: 40.5, category: 'periorbital', color: '#d946ef', name: 'Canto Lateral E1 (Pé de Galinha)', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' },
  { id: 'lm-p5', x: 25, y: 44.5, category: 'periorbital', color: '#d946ef', name: 'Canto Lateral D2 (Pé de Galinha)', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-p6', x: 75, y: 44.5, category: 'periorbital', color: '#d946ef', name: 'Canto Lateral E2 (Pé de Galinha)', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-p7', x: 29, y: 47, category: 'periorbital', color: '#d946ef', name: 'Infraorbital Lateral D', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-p8', x: 71, y: 47, category: 'periorbital', color: '#d946ef', name: 'Infraorbital Lateral E', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-p9', x: 35, y: 46, category: 'periorbital', color: '#d946ef', name: 'Infraorbital / Olheira D', recommendedProduct: 'acido_hialuronico', defaultDose: 0.3, doseUnit: 'ml' },
  { id: 'lm-p10', x: 65, y: 46, category: 'periorbital', color: '#d946ef', name: 'Infraorbital / Olheira E', recommendedProduct: 'acido_hialuronico', defaultDose: 0.3, doseUnit: 'ml' },

  // Nasal, Ápice & Sulco (Verde / Green)
  { id: 'lm-n1', x: 45.5, y: 46, category: 'nasal', color: '#16a34a', name: 'Bunny Lines D', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-n2', x: 54.5, y: 46, category: 'nasal', color: '#16a34a', name: 'Bunny Lines E', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-n3', x: 50, y: 48.5, category: 'nasal', color: '#16a34a', name: 'Dorso Nasal Médio', recommendedProduct: 'acido_hialuronico', defaultDose: 0.3, doseUnit: 'ml' },
  { id: 'lm-n4', x: 44, y: 51.5, category: 'nasal', color: '#16a34a', name: 'Parede Nasal Lateral D', recommendedProduct: 'acido_hialuronico', defaultDose: 0.2, doseUnit: 'ml' },
  { id: 'lm-n5', x: 56, y: 51.5, category: 'nasal', color: '#16a34a', name: 'Parede Nasal Lateral E', recommendedProduct: 'acido_hialuronico', defaultDose: 0.2, doseUnit: 'ml' },
  { id: 'lm-n6', x: 50, y: 53.5, category: 'nasal', color: '#16a34a', name: 'Ponta Nasal (Tip Lift)', recommendedProduct: 'acido_hialuronico', defaultDose: 0.2, doseUnit: 'ml' },
  { id: 'lm-n7', x: 42, y: 55.5, category: 'nasal', color: '#16a34a', name: 'Asa Nasal / Sulco Superior D', recommendedProduct: 'acido_hialuronico', defaultDose: 0.4, doseUnit: 'ml' },
  { id: 'lm-n8', x: 58, y: 55.5, category: 'nasal', color: '#16a34a', name: 'Asa Nasal / Sulco Superior E', recommendedProduct: 'acido_hialuronico', defaultDose: 0.4, doseUnit: 'ml' },
  { id: 'lm-n9', x: 40, y: 59.5, category: 'nasal', color: '#16a34a', name: 'Sulco Nasogeniano Médio D', recommendedProduct: 'acido_hialuronico', defaultDose: 0.5, doseUnit: 'ml' },
  { id: 'lm-n10', x: 60, y: 59.5, category: 'nasal', color: '#16a34a', name: 'Sulco Nasogeniano Médio E', recommendedProduct: 'acido_hialuronico', defaultDose: 0.5, doseUnit: 'ml' },

  // Malar, Masseter & Mandíbula (Laranja / Orange)
  { id: 'lm-m1', x: 31, y: 52, category: 'malar_mandibula', color: '#ea580c', name: 'Malar / Ponto de Sustentação D', recommendedProduct: 'acido_hialuronico', defaultDose: 0.8, doseUnit: 'ml' },
  { id: 'lm-m2', x: 69, y: 52, category: 'malar_mandibula', color: '#ea580c', name: 'Malar / Ponto de Sustentação E', recommendedProduct: 'acido_hialuronico', defaultDose: 0.8, doseUnit: 'ml' },
  { id: 'lm-m3', x: 26, y: 60, category: 'malar_mandibula', color: '#ea580c', name: 'Masseter Superior D', recommendedProduct: 'botox', defaultDose: 10, doseUnit: 'U' },
  { id: 'lm-m4', x: 74, y: 60, category: 'malar_mandibula', color: '#ea580c', name: 'Masseter Superior E', recommendedProduct: 'botox', defaultDose: 10, doseUnit: 'U' },
  { id: 'lm-m5', x: 26, y: 66.5, category: 'malar_mandibula', color: '#ea580c', name: 'Ângulo Mandibular D', recommendedProduct: 'acido_hialuronico', defaultDose: 1.0, doseUnit: 'ml' },
  { id: 'lm-m6', x: 74, y: 66.5, category: 'malar_mandibula', color: '#ea580c', name: 'Ângulo Mandibular E', recommendedProduct: 'acido_hialuronico', defaultDose: 1.0, doseUnit: 'ml' },
  { id: 'lm-m7', x: 37, y: 63, category: 'malar_mandibula', color: '#ea580c', name: 'Modíolo / Canto Labial D', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-m8', x: 63, y: 63, category: 'malar_mandibula', color: '#ea580c', name: 'Modíolo / Canto Labial E', recommendedProduct: 'botox', defaultDose: 2, doseUnit: 'U' },
  { id: 'lm-m9', x: 38, y: 67.5, category: 'malar_mandibula', color: '#ea580c', name: 'Sulco Marionete / DAO D', recommendedProduct: 'acido_hialuronico', defaultDose: 0.4, doseUnit: 'ml' },
  { id: 'lm-m10', x: 62, y: 67.5, category: 'malar_mandibula', color: '#ea580c', name: 'Sulco Marionete / DAO E', recommendedProduct: 'acido_hialuronico', defaultDose: 0.4, doseUnit: 'ml' },
  { id: 'lm-m11', x: 34, y: 72, category: 'malar_mandibula', color: '#ea580c', name: 'Pré-Jowl Sulcus D', recommendedProduct: 'bioestimulador', defaultDose: 2.0, doseUnit: 'ml' },
  { id: 'lm-m12', x: 66, y: 72, category: 'malar_mandibula', color: '#ea580c', name: 'Pré-Jowl Sulcus E', recommendedProduct: 'bioestimulador', defaultDose: 2.0, doseUnit: 'ml' },

  // Mento & Cervical / Platisma (Roxo / Violet)
  { id: 'lm-c1', x: 50, y: 70.5, category: 'mento_pescoco', color: '#7c3aed', name: 'Mento Superior Central', recommendedProduct: 'botox', defaultDose: 4, doseUnit: 'U' },
  { id: 'lm-c2', x: 45, y: 73, category: 'mento_pescoco', color: '#7c3aed', name: 'Mento Lateral D', recommendedProduct: 'acido_hialuronico', defaultDose: 0.5, doseUnit: 'ml' },
  { id: 'lm-c3', x: 55, y: 73, category: 'mento_pescoco', color: '#7c3aed', name: 'Mento Lateral E', recommendedProduct: 'acido_hialuronico', defaultDose: 0.5, doseUnit: 'ml' },
  { id: 'lm-c4', x: 50, y: 75.5, category: 'mento_pescoco', color: '#7c3aed', name: 'Ápice do Mento (Projeção)', recommendedProduct: 'acido_hialuronico', defaultDose: 1.0, doseUnit: 'ml' },
  { id: 'lm-c5', x: 41, y: 74.5, category: 'mento_pescoco', color: '#7c3aed', name: 'Borda Mentoniana Inferior D', recommendedProduct: 'acido_hialuronico', defaultDose: 0.5, doseUnit: 'ml' },
  { id: 'lm-c6', x: 59, y: 74.5, category: 'mento_pescoco', color: '#7c3aed', name: 'Borda Mentoniana Inferior E', recommendedProduct: 'acido_hialuronico', defaultDose: 0.5, doseUnit: 'ml' },
  { id: 'lm-c7', x: 34, y: 84, category: 'mento_pescoco', color: '#7c3aed', name: 'Platisma Banda Lateral D', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' },
  { id: 'lm-c8', x: 43, y: 86, category: 'mento_pescoco', color: '#7c3aed', name: 'Platisma Banda Medial D', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' },
  { id: 'lm-c9', x: 57, y: 86, category: 'mento_pescoco', color: '#7c3aed', name: 'Platisma Banda Medial E', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' },
  { id: 'lm-c10', x: 66, y: 84, category: 'mento_pescoco', color: '#7c3aed', name: 'Platisma Banda Lateral E', recommendedProduct: 'botox', defaultDose: 3, doseUnit: 'U' }
];

interface AnatomicalOverlayProps {
  showGuidelines: boolean;
  showLandmarks: boolean;
  onSelectLandmark?: (landmark: LandmarkDot) => void;
  hoveredLandmarkId?: string | null;
  setHoveredLandmarkId?: (id: string | null) => void;
  /** Molde elástico: leva cada ponto do desenho padrão para o lugar dele na foto */
  deformar?: (p: Pt) => Pt;
}

export const AnatomicalOverlay: React.FC<AnatomicalOverlayProps> = ({
  showGuidelines,
  showLandmarks,
  onSelectLandmark,
  hoveredLandmarkId,
  setHoveredLandmarkId,
  deformar
}) => {
  // Sem molde, cada ponto fica onde está no desenho padrão
  const w = deformar || ((p: Pt) => p);
  const linha = (a: Pt, b: Pt, passos = 10) =>
    Array.from({ length: passos + 1 }, (_, i) => {
      const t = i / passos;
      const [x, y] = w([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  const poligono = (pts: Pt[]) => {
    const fechado = [...pts, pts[0]];
    return fechado.slice(0, -1).map((p, i) => linha(p, fechado[i + 1], 6)).join(' ');
  };

  return (
    <g id="anatomical-layer-group" className="pointer-events-auto">
      {/* 1. LINHAS GUIA (borboleta, órbitas, sulcos, mandíbula, pescoço) */}
      {showGuidelines && (
        <g id="facial-vectors" stroke="#3b82f6" strokeOpacity="0.45" strokeWidth="0.85" fill="none" strokeLinejoin="round">
          {/* Arco frontal superior */}
          <polyline points={curvaDeformada(w, [[[104, 105], [140, 78], [260, 78], [296, 105]]])} strokeDasharray="3 2" />
          <polyline points={linha([200, 22], [200, 505], 30)} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="0.75" />

          {/* Borboleta da glabela e da testa */}
          <polygon points={curvaDeformada(w, [[[200, 185], [182, 145], [128, 100], [108, 130]], [[98, 148], [112, 175], [162, 184]], [[182, 188], [200, 185], [200, 185]]])} />
          <polygon points={curvaDeformada(w, [[[200, 185], [218, 145], [272, 100], [292, 130]], [[302, 148], [288, 175], [238, 184]], [[218, 188], [200, 185], [200, 185]]])} />

          {/* Vetores da glabela para os corrugadores */}
          <polyline points={linha([200, 192], [178, 192])} />
          <polyline points={linha([200, 192], [222, 192])} />
          <polyline points={linha([178, 192], [152, 182])} />
          <polyline points={linha([222, 192], [248, 182])} />

          {/* Órbita D */}
          <polygon points={elipseDeformada(w, 142, 219, 48, 26)} stroke="#d946ef" strokeOpacity="0.4" strokeDasharray="3 3" />
          <polyline points={curvaDeformada(w, [[[96, 205], [88, 225], [104, 248], [142, 252]]])} stroke="#d946ef" strokeOpacity="0.5" />

          {/* Órbita E */}
          <polygon points={elipseDeformada(w, 258, 219, 48, 26)} stroke="#d946ef" strokeOpacity="0.4" strokeDasharray="3 3" />
          <polyline points={curvaDeformada(w, [[[304, 205], [312, 225], [296, 248], [258, 252]]])} stroke="#d946ef" strokeOpacity="0.5" />

          {/* Losango paranasal e sulcos */}
          <polygon points={poligono([[200, 232], [174, 290], [200, 302], [226, 290]])} stroke="#16a34a" strokeOpacity="0.5" />
          <polyline points={curvaDeformada(w, [[[170, 294], [156, 318], [148, 348], [144, 368]]])} stroke="#ea580c" strokeOpacity="0.5" />
          <polyline points={curvaDeformada(w, [[[230, 294], [244, 318], [252, 348], [256, 368]]])} stroke="#ea580c" strokeOpacity="0.5" />

          {/* Vetores zigomáticos (malar) */}
          <polyline points={linha([94, 226], [162, 292])} stroke="#ea580c" strokeOpacity="0.45" strokeDasharray="2 2" />
          <polyline points={linha([306, 226], [238, 292])} stroke="#ea580c" strokeOpacity="0.45" strokeDasharray="2 2" />

          {/* Mandíbula, masseter e marionete */}
          <polyline points={curvaDeformada(w, [[[114, 335], [122, 375], [156, 410], [200, 410]], [[244, 410], [278, 375], [286, 335]]])} stroke="#ea580c" strokeOpacity="0.4" />
          <polygon points={elipseDeformada(w, 200, 389, 24, 24)} stroke="#7c3aed" strokeOpacity="0.5" strokeDasharray="3 2" />
          <polyline points={linha([200, 365], [200, 413])} stroke="#7c3aed" strokeOpacity="0.5" />
          <polyline points={linha([176, 389], [224, 389])} stroke="#7c3aed" strokeOpacity="0.5" />

          {/* Pescoço / bandas do platisma */}
          <polyline points={linha([140, 420], [148, 485])} stroke="#7c3aed" strokeOpacity="0.35" strokeDasharray="2 2" />
          <polyline points={linha([176, 425], [178, 490])} stroke="#7c3aed" strokeOpacity="0.35" strokeDasharray="2 2" />
          <polyline points={linha([224, 425], [222, 490])} stroke="#7c3aed" strokeOpacity="0.35" strokeDasharray="2 2" />
          <polyline points={linha([260, 420], [252, 485])} stroke="#7c3aed" strokeOpacity="0.35" strokeDasharray="2 2" />
        </g>
      )}

      {/* 2. PONTOS ANATÔMICOS DE REFERÊNCIA */}
      {showLandmarks && (
        <g id="anatomical-dots">
          {ANATOMICAL_LANDMARKS.map((lm) => {
            const [svgX, svgY] = w([(lm.x / 100) * 400, (lm.y / 100) * 533]);
            const isHovered = hoveredLandmarkId === lm.id;

            return (
              <g
                key={lm.id}
                id={`ref-landmark-${lm.id}`}
                className="cursor-pointer transition-all duration-150 group"
                onClick={(e) => {
                  e.stopPropagation();
                  // o ponto marcado vai para onde o ponto está na foto (já moldado)
                  onSelectLandmark?.({ ...lm, x: (svgX / 400) * 100, y: (svgY / 533) * 100 });
                }}
                onMouseEnter={() => setHoveredLandmarkId?.(lm.id)}
                onMouseLeave={() => setHoveredLandmarkId?.(null)}
              >
                {isHovered && (
                  <circle cx={svgX} cy={svgY} r="8" fill={lm.color} fillOpacity="0.3" stroke={lm.color} strokeWidth="1.5" className="animate-ping" />
                )}
                <circle cx={svgX} cy={svgY} r={isHovered ? '5.5' : '4'} fill="#ffffff" stroke={lm.color} strokeWidth="1.8" />
                <circle cx={svgX} cy={svgY} r={isHovered ? '3.2' : '2.2'} fill={lm.color} />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};
