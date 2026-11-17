import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';
import { ANATOMICAL_LANDMARKS } from './face-models/AnatomicalOverlay';

interface Props {
  onFoto: (arquivo: File) => void;
  onFechar: () => void;
}

// Câmera ao vivo com o desenho do rosto e os pontos por cima.
// A pessoa encaixa o rosto do paciente no desenho e tira a foto:
// a foto já sai no mesmo enquadramento (3:4) do mapa facial, com os pontos no lugar.
export const CameraComPontos: React.FC<Props> = ({ onFoto, onFechar }) => {
  const video = useRef<HTMLVideoElement>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const [frente, setFrente] = useState(false); // false = câmera de trás (a Jimena fotografa o paciente)
  const [erro, setErro] = useState('');
  const [pronta, setPronta] = useState(false);
  const [guia, setGuia] = useState(45);
  const [verPontos, setVerPontos] = useState(true);

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
  }, [frente]);

  useEffect(() => () => fluxo.current?.getTracks().forEach((t) => t.stop()), []);

  const tirar = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
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
    c.toBlob((b) => {
      if (!b) return;
      fluxo.current?.getTracks().forEach((t) => t.stop());
      onFoto(new File([b], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm font-semibold">Encaixe o rosto no desenho</p>
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
          {/* Desenho do rosto como guia */}
          <img
            src={`${import.meta.env.BASE_URL}face-feminina.jpg`}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            style={{ opacity: guia / 100, mixBlendMode: 'multiply' }}
          />
          {/* Pontos de referência */}
          {verPontos && ANATOMICAL_LANDMARKS.map((p) => (
            <span
              key={p.id}
              className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full border-2 border-white pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%`, background: p.color, boxShadow: '0 0 2px rgba(0,0,0,.6)' }}
            />
          ))}
          {!pronta && !erro && (
            <p className="absolute inset-0 flex items-center justify-center text-white text-sm">Abrindo a câmera…</p>
          )}
          {erro && (
            <p className="absolute inset-0 flex items-center justify-center text-center text-white text-sm p-6">{erro}</p>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3 text-white">
        <div className="flex items-center gap-3 text-xs">
          <span className="w-20">Desenho</span>
          <input type="range" min={0} max={90} value={guia} onChange={(e) => setGuia(Number(e.target.value))} className="flex-1" />
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={verPontos} onChange={(e) => setVerPontos(e.target.checked)} /> Pontos
          </label>
        </div>
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
      </div>
    </div>
  );
};
