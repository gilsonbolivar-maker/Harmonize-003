import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, RefreshCw, RotateCcw, X } from 'lucide-react';
import { ANATOMICAL_LANDMARKS } from './face-models/AnatomicalOverlay';

interface Props {
  onFoto: (arquivo: File) => void;
  onFechar: () => void;
  /** 'pontos' = desenho do rosto e pontos de injeção; 'avaliacao' = âncoras nos olhos e grade de linhas */
  modo?: 'pontos' | 'avaliacao';
}

// Posição fixa das âncoras dos olhos, em % do quadro 3:4.
// Toda foto tirada com os olhos nas âncoras fica no mesmo tamanho e lugar: dá para comparar.
export const ANCORA_OLHOS = { y: 40, esquerdo: 37.5, direito: 62.5 };

// Grade de avaliação: linhas a cada 10%, linha dos olhos e linha do meio em destaque,
// e os dois alvos dos olhos. Usada na câmera e no comparador de fotos.
export const GradeAvaliacao: React.FC<{ alvos?: boolean; forte?: boolean }> = ({ alvos = true, forte = false }) => {
  const fino = forte ? 0.55 : 0.35;
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
      {Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map((p) => (
        <g key={p} stroke="#ffffff" strokeOpacity={fino} strokeWidth={0.6} vectorEffect="non-scaling-stroke">
          <line x1={(p / 100) * 300} y1={0} x2={(p / 100) * 300} y2={400} vectorEffect="non-scaling-stroke" />
          <line x1={0} y1={(p / 100) * 400} x2={300} y2={(p / 100) * 400} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      {/* linha do meio do rosto */}
      <line x1={150} y1={0} x2={150} y2={400} stroke="#22d3ee" strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeDasharray="6 4" />
      {/* linha dos olhos */}
      <line x1={0} y1={(ANCORA_OLHOS.y / 100) * 400} x2={300} y2={(ANCORA_OLHOS.y / 100) * 400} stroke="#facc15" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      {alvos && [ANCORA_OLHOS.esquerdo, ANCORA_OLHOS.direito].map((x) => (
        <g key={x} stroke="#facc15" fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke">
          <ellipse cx={(x / 100) * 300} cy={(ANCORA_OLHOS.y / 100) * 400} rx={9} ry={6.75} vectorEffect="non-scaling-stroke" />
          <line x1={(x / 100) * 300 - 14} y1={(ANCORA_OLHOS.y / 100) * 400} x2={(x / 100) * 300 + 14} y2={(ANCORA_OLHOS.y / 100) * 400} vectorEffect="non-scaling-stroke" />
          <line x1={(x / 100) * 300} y1={(ANCORA_OLHOS.y / 100) * 400 - 11} x2={(x / 100) * 300} y2={(ANCORA_OLHOS.y / 100) * 400 + 11} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
};

// Câmera ao vivo com o desenho do rosto e os pontos por cima.
// A pessoa encaixa o rosto do paciente no desenho e tira a foto:
// a foto já sai no mesmo enquadramento (3:4) do mapa facial, com os pontos no lugar.
export const CameraComPontos: React.FC<Props> = ({ onFoto, onFechar, modo = 'pontos' }) => {
  const avaliacao = modo === 'avaliacao';
  const video = useRef<HTMLVideoElement>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const [frente, setFrente] = useState(false); // false = câmera de trás (a Jimena fotografa o paciente)
  const [erro, setErro] = useState('');
  const [pronta, setPronta] = useState(false);
  const [guia, setGuia] = useState(45);
  const [verPontos, setVerPontos] = useState(true);
  const [tirada, setTirada] = useState<{ arquivo: File; url: string } | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    setPronta(false);
    setErro('');
    const abrir = async () => {
      fluxo.current?.getTracks().forEach((t) => t.stop());
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro('Este navegador não abre a câmera aqui. Use "Foto do Paciente" para escolher uma foto.');
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: frente ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (!vivo) { s.getTracks().forEach((t) => t.stop()); return; }
        fluxo.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => undefined);
        }
      } catch {
        setErro('Não consegui abrir a câmera. Confira se o navegador tem permissão para usar a câmera.');
      }
    };
    abrir();
    return () => { vivo = false; };
  }, [frente, tentativa]);

  useEffect(() => () => fluxo.current?.getTracks().forEach((t) => t.stop()), []);

  const tirar = () => {
    const v = video.current;
    if (!v || !v.videoWidth) { setErro('A câmera ainda não está pronta. Espere a imagem aparecer e toque de novo.'); return; }
    // Recorta o centro do vídeo no formato 3:4, igual ao que aparece na tela
    const vw = v.videoWidth, vh = v.videoHeight;
    let sw = vw, sh = vh, sx = 0, sy = 0;
    if (vw / vh > 3 / 4) { sh = vh; sw = vh * 3 / 4; sx = (vw - sw) / 2; }
    else { sw = vw; sh = vw * 4 / 3; sy = (vh - sh) / 2; }
    const alt = Math.min(1600, Math.round(sh));
    const larg = Math.round(alt * 3 / 4);
    const c = document.createElement('canvas');
    c.width = larg; c.height = alt;
    const ctx = c.getContext('2d')!;
    if (frente) { ctx.translate(larg, 0); ctx.scale(-1, 1); } // a frontal aparece espelhada; a foto sai como a tela mostra
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, larg, alt);
    const entregar = (b: Blob) => {
      fluxo.current?.getTracks().forEach((t) => t.stop());
      const arquivo = new File([b], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setTirada({ arquivo, url: URL.createObjectURL(b) }); // mostra a foto para conferir antes de usar
    };
    try {
      c.toBlob((b) => {
        if (b) { entregar(b); return; }
        // Alguns iPads devolvem vazio no toBlob: monta a imagem pelo dataURL
        const dados = c.toDataURL('image/jpeg', 0.9);
        const bin = atob(dados.split(',')[1]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        entregar(new Blob([bytes], { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    } catch {
      setErro('Não consegui registrar a foto. Tente de novo.');
    }
  };

  const tirarOutra = () => {
    if (tirada) URL.revokeObjectURL(tirada.url);
    setTirada(null);
    setTentativa((n) => n + 1);
  };
  const usar = () => {
    if (!tirada) return;
    onFoto(tirada.arquivo);
  };

  // Desenhada direto no corpo da página, para nada da tela de trás interferir
  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">{avaliacao ? 'Câmera de avaliação' : 'Encaixe o rosto no desenho'}</p>
          {avaliacao && <p className="text-[11px] opacity-80">Centro de cada olho dentro de um alvo amarelo. Nariz na linha azul. Cabeça reta.</p>}
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar câmera" className="p-2 rounded-full bg-white/15"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-3">
        <div className="relative h-full max-h-full aspect-[3/4] max-w-full overflow-hidden rounded-2xl bg-neutral-900">
          <video
            ref={video}
            playsInline
            muted
            onPlaying={() => setPronta(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: frente ? 'scaleX(-1)' : undefined }}
          />
          {avaliacao && <GradeAvaliacao forte />}
          {/* Desenho do rosto como guia */}
          {!avaliacao && <img
            src={`${import.meta.env.BASE_URL}face-feminina.jpg`}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            style={{ opacity: guia / 100, mixBlendMode: 'multiply' }}
          />}
          {/* Pontos de referência */}
          {!avaliacao && verPontos && ANATOMICAL_LANDMARKS.map((p) => (
            <span
              key={p.id}
              className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full border-2 border-white pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%`, background: p.color, boxShadow: '0 0 2px rgba(0,0,0,.6)' }}
            />
          ))}
          {!pronta && !erro && (
            <p className="absolute inset-0 flex items-center justify-center text-white text-sm">Abrindo a câmera…</p>
          )}
          {tirada && (
            <div className="absolute inset-0">
              <img src={tirada.url} alt="Foto tirada" className="absolute inset-0 w-full h-full object-cover" />
              {avaliacao && <GradeAvaliacao />}
            </div>
          )}
          {erro && !tirada && (
            <p className="absolute inset-0 flex items-center justify-center text-center text-white text-sm p-6">{erro}</p>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3 text-white">
        {!avaliacao && <div className="flex items-center gap-3 text-xs">
          <span className="w-20">Desenho</span>
          <input type="range" min={0} max={90} value={guia} onChange={(e) => setGuia(Number(e.target.value))} className="flex-1" />
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={verPontos} onChange={(e) => setVerPontos(e.target.checked)} /> Pontos
          </label>
        </div>}
        {tirada ? (
          <div className="flex items-center gap-3">
            <button type="button" onClick={tirarOutra} className="flex-1 py-3 rounded-full bg-white/15 text-sm font-semibold inline-flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Tirar outra
            </button>
            <button type="button" onClick={usar} className="flex-1 py-3 rounded-full bg-emerald-500 text-white text-sm font-bold inline-flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Usar esta foto
            </button>
          </div>
        ) : (
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setFrente(!frente)} className="px-3 py-2 rounded-full bg-white/15 text-xs font-semibold inline-flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> {frente ? 'Câmera de trás' : 'Câmera da frente'}
          </button>
          <button
            type="button"
            onClick={tirar}
            disabled={!pronta}
            aria-label="Tirar foto"
            className="w-16 h-16 rounded-full bg-white border-4 border-white/40 flex items-center justify-center disabled:opacity-40"
          >
            <Camera className="w-7 h-7 text-black" />
          </button>
          <span className="w-[118px]" />
        </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
