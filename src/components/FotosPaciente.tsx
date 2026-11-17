import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ChevronLeft, ChevronRight, Grid3x3, Images, Trash2, X } from 'lucide-react';
import { FotoPaciente, VisitaPaciente, apagarFoto, carregarFotos, carregarVisitas, enviarFoto } from '../lib/clinicaApi';
import { dataBonita, dataCurta, hojeISO } from '../lib/datas';
import { CameraComPontos, GradeAvaliacao } from './CameraComPontos';

const ANGULOS: { id: string; nome: string }[] = [
  { id: 'frontal', nome: 'Frontal' },
  { id: 'perfil_direito', nome: 'Perfil direito' },
  { id: 'perfil_esquerdo', nome: 'Perfil esquerdo' },
  { id: 'obliquo_direito', nome: 'Oblíquo direito' },
  { id: 'obliquo_esquerdo', nome: 'Oblíquo esquerdo' },
  { id: 'detalhe', nome: 'Detalhe' },
];
const nomeAngulo = (id: string) => ANGULOS.find((a) => a.id === id)?.nome || id;
const TIPOS: { id: FotoPaciente['tipo']; nome: string }[] = [
  { id: 'registro', nome: 'Registro' },
  { id: 'antes', nome: 'Antes' },
  { id: 'depois', nome: 'Depois' },
];
const SEM_VISITA = '';
const primeiraMaiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

interface Props {
  pacienteId: string;
}

interface Grupo {
  chave: string;
  data: string;
  titulo: string;
  subtitulo: string;
  fotos: FotoPaciente[];
}

// Galeria individual do paciente: as fotos ficam separadas por visita (cada marcação).
// Embaixo, o comparador para pôr duas fotos lado a lado com o divisor.
// As fotos ficam num espaço privado do banco: só a Jimena consegue ver.
export const FotosPaciente: React.FC<Props> = ({ pacienteId }) => {
  const [fotos, setFotos] = useState<FotoPaciente[]>([]);
  const [visitas, setVisitas] = useState<VisitaPaciente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // nova foto
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState('');
  const [visitaId, setVisitaId] = useState(SEM_VISITA);
  const [tipo, setTipo] = useState<FotoPaciente['tipo']>('registro');
  const [angulo, setAngulo] = useState('frontal');
  const [data, setData] = useState(hojeISO());
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cameraAberta, setCameraAberta] = useState(false);

  // ver foto grande
  const [aberta, setAberta] = useState<{ grupo: Grupo; indice: number } | null>(null);

  // comparador
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');
  const [divisor, setDivisor] = useState(50);
  const [verLinhas, setVerLinhas] = useState(true);

  const entrada = useRef<HTMLInputElement>(null);
  const blocoNova = useRef<HTMLDivElement>(null);

  const recarregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const [lista, vs] = await Promise.all([carregarFotos(pacienteId), carregarVisitas(pacienteId)]);
      setFotos(lista);
      setVisitas(vs);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar as fotos.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    setFotos([]);
    setVisitas([]);
    setAId('');
    setBId('');
    setAberta(null);
    cancelar();
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  useEffect(() => {
    if (previa) setTimeout(() => blocoNova.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [previa]);

  // Visita sugerida: a de hoje; se não houver, a mais recente que já passou
  const visitaSugerida = (): string => {
    const hoje = hojeISO();
    return (visitas.find((v) => v.data === hoje) || visitas.find((v) => v.data <= hoje))?.id || SEM_VISITA;
  };

  const prepararFoto = (f: File) => {
    if (!f.type.startsWith('image/')) { alert('Escolha uma imagem (foto).'); return; }
    if (previa) URL.revokeObjectURL(previa);
    setArquivo(f);
    setPrevia(URL.createObjectURL(f));
    const v = visitaSugerida();
    setVisitaId(v);
    setData(visitas.find((x) => x.id === v)?.data || hojeISO());
    setTipo('registro');
    setObservacao('');
  };

  const escolherArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) prepararFoto(f);
  };

  function cancelar() {
    setPrevia((p) => { if (p) URL.revokeObjectURL(p); return ''; });
    setArquivo(null);
  }

  const escolherVisita = (id: string) => {
    setVisitaId(id);
    const v = visitas.find((x) => x.id === id);
    if (v) setData(v.data);
  };

  const salvar = async () => {
    if (!arquivo) return;
    setEnviando(true);
    try {
      await enviarFoto(pacienteId, arquivo, { tipo, angulo, data, observacao, marcacaoId: visitaId || null });
      cancelar();
      await recarregar();
    } catch (e) {
      alert('Não consegui salvar a foto: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setEnviando(false);
    }
  };

  const excluir = async (f: FotoPaciente) => {
    if (!confirm(`Apagar esta foto de ${dataCurta(f.data)}? Não dá para desfazer.`)) return;
    try {
      await apagarFoto(f);
      setAberta(null);
      await recarregar();
    } catch (e) {
      alert('Não consegui apagar: ' + (e instanceof Error ? e.message : ''));
    }
  };

  // Fotos agrupadas por visita, da mais recente para a mais antiga
  const grupos: Grupo[] = useMemo(() => {
    const mapa = new Map<string, Grupo>();
    fotos.forEach((f) => {
      const v = f.marcacaoId ? visitas.find((x) => x.id === f.marcacaoId) : undefined;
      const chave = v ? `v:${v.id}` : `d:${f.data}`;
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          chave,
          data: v ? v.data : f.data,
          titulo: primeiraMaiuscula(dataBonita(v ? v.data : f.data)),
          subtitulo: v ? `${v.hora} · ${v.servico}` : 'Fotos sem visita marcada',
          fotos: [],
        });
      }
      mapa.get(chave)!.fotos.push(f);
    });
    return [...mapa.values()].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  }, [fotos, visitas]);

  // Comparador: por padrão, a foto "Antes" mais antiga contra a "Depois" mais recente
  useEffect(() => {
    if (fotos.length < 2) return;
    const ord = [...fotos].sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : 0));
    setAId((atual) => (fotos.some((f) => f.id === atual) ? atual : (ord.find((f) => f.tipo === 'antes') || ord[0]).id));
    setBId((atual) => (fotos.some((f) => f.id === atual) ? atual : ([...ord].reverse().find((f) => f.tipo === 'depois') || ord[ord.length - 1]).id));
  }, [fotos]);

  const fotoA = fotos.find((f) => f.id === aId);
  const fotoB = fotos.find((f) => f.id === bId);
  const rotulo = (f: FotoPaciente) =>
    `${dataCurta(f.data)} · ${f.tipo === 'registro' ? '' : (f.tipo === 'antes' ? 'Antes · ' : 'Depois · ')}${nomeAngulo(f.angulo)}`;

  const seloTipo = (t: FotoPaciente['tipo']) =>
    t === 'registro' ? null : (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${t === 'antes' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{t}</span>
    );

  return (
    <div className="space-y-5">
      {/* ===== Cabeçalho ===== */}
      <div className="bg-white p-6 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-serif italic text-xl text-[#0F172A]">Galeria do Paciente</h4>
            <p className="text-xs text-[#334155]">As fotos ficam separadas por visita. Só a Jimena tem acesso.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCameraAberta(true)}
              disabled={enviando}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#4A5D3A] text-white text-xs font-medium rounded-full disabled:opacity-60"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              Câmera de avaliação
            </button>
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              disabled={enviando}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0F172A] hover:bg-[#20364F] text-white text-xs font-medium rounded-full transition-colors disabled:opacity-60"
            >
              <Camera className="w-3.5 h-3.5" />
              Adicionar Foto
            </button>
          </div>
          <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={escolherArquivo} />
          {cameraAberta && (
            <CameraComPontos
              modo="avaliacao"
              onFechar={() => setCameraAberta(false)}
              onFoto={(f) => { setCameraAberta(false); prepararFoto(f); }}
            />
          )}
        </div>

        {/* ===== Nova foto ===== */}
        {previa && (
          <div ref={blocoNova} className="rounded-3xl border-2 border-[#4A5D3A] bg-[#F5EFE6] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#5C4033]">Nova foto: escolha a visita e toque em Salvar</p>
              <button type="button" onClick={cancelar} aria-label="Cancelar" className="p-1 text-[#5C4033]"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative w-full max-w-xs mx-auto rounded-2xl overflow-hidden bg-white">
              <img src={previa} alt="Prévia da foto" className="block w-full h-auto" />
              {verLinhas && <GradeAvaliacao />}
            </div>

            <label className="block text-xs text-[#334155]">Visita
              <select value={visitaId} onChange={(e) => escolherVisita(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-2xl border border-[#CBD5E1] bg-white text-sm">
                {visitas.map((v) => (
                  <option key={v.id} value={v.id}>{dataCurta(v.data)} às {v.hora} · {v.servico}{v.data === hojeISO() ? ' (hoje)' : ''}</option>
                ))}
                <option value={SEM_VISITA}>Sem visita marcada (usar a data abaixo)</option>
              </select>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTipo(t.id)}
                  className={`py-2.5 rounded-2xl text-sm font-semibold border ${tipo === t.id ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white text-[#0F172A] border-[#CBD5E1]'}`}
                >
                  {t.nome}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-[#334155]">Ângulo
                <select value={angulo} onChange={(e) => setAngulo(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-2xl border border-[#CBD5E1] bg-white text-sm">
                  {ANGULOS.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </label>
              <label className="text-xs text-[#334155]">Data da foto
                <input
                  type="date"
                  value={data}
                  max={hojeISO()}
                  disabled={!!visitaId}
                  onChange={(e) => setData(e.target.value || hojeISO())}
                  className="mt-1 w-full px-3 py-2.5 rounded-2xl border border-[#CBD5E1] bg-white text-sm disabled:opacity-60"
                />
              </label>
            </div>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observação (opcional). Ex.: 15 dias após o botox"
              className="w-full px-3 py-2.5 rounded-2xl border border-[#CBD5E1] bg-white text-sm"
            />
            <button
              type="button"
              onClick={salvar}
              disabled={enviando}
              className="w-full py-3 rounded-2xl bg-[#0F172A] text-white text-sm font-semibold disabled:opacity-60"
            >
              {enviando ? 'Salvando a foto…' : 'Salvar na galeria'}
            </button>
          </div>
        )}

        {erro && <p className="text-sm text-[#C1663F]">{erro}</p>}
      </div>

      {/* ===== Galeria por visita ===== */}
      {carregando ? (
        <p className="text-sm text-[#5C4033] px-2">Carregando as fotos…</p>
      ) : fotos.length === 0 ? (
        !previa && (
          <div className="rounded-3xl border border-[#E8D8C3] bg-[#F5EFE6] p-8 text-center text-sm text-[#5C4033]">
            <Images className="w-6 h-6 mx-auto mb-2 opacity-70" />
            Nenhuma foto registrada para este paciente.
            <span className="block mt-1 text-xs">Toque em "Câmera de avaliação" ou "Adicionar Foto".</span>
          </div>
        )
      ) : (
        <>
          {grupos.map((g) => (
            <div key={g.chave} className="bg-white p-5 rounded-3xl border border-[#CBD5E1] shadow-xs">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <div>
                  <p className="font-serif italic text-lg text-[#0F172A]">{g.titulo}</p>
                  <p className="text-xs text-[#334155]">{g.subtitulo}</p>
                </div>
                <span className="text-xs text-[#5C4033] shrink-0">{g.fotos.length} foto{g.fotos.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {g.fotos.map((f, i) => (
                  <button key={f.id} type="button" onClick={() => setAberta({ grupo: g, indice: i })} className="relative rounded-2xl overflow-hidden border border-[#E8D8C3] bg-[#F5EFE6]">
                    <img src={f.url} alt={rotulo(f)} className="w-full aspect-[3/4] object-cover" loading="lazy" />
                    <span className="absolute bottom-1 left-1">{seloTipo(f.tipo)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* ===== Comparador ===== */}
          {fotos.length >= 2 && fotoA && fotoB && (
            <div className="bg-white p-5 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-3">
              <div>
                <h4 className="font-serif italic text-lg text-[#0F172A]">Comparar duas fotos</h4>
                <p className="text-xs text-[#334155]">Arraste o dedo sobre a imagem para mover o divisor.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-[#334155]">Esquerda (antes)
                  <select value={aId} onChange={(e) => setAId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-2xl border border-[#CBD5E1] bg-white text-sm">
                    {fotos.map((f) => <option key={f.id} value={f.id}>{rotulo(f)}</option>)}
                  </select>
                </label>
                <label className="text-xs text-[#334155]">Direita (depois)
                  <select value={bId} onChange={(e) => setBId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-2xl border border-[#CBD5E1] bg-white text-sm">
                    {fotos.map((f) => <option key={f.id} value={f.id}>{rotulo(f)}</option>)}
                  </select>
                </label>
              </div>
              <label className="flex items-center justify-end gap-2 text-xs text-[#334155]">
                <input type="checkbox" checked={verLinhas} onChange={(e) => setVerLinhas(e.target.checked)} />
                Mostrar linhas de avaliação
              </label>
              <div className="relative w-full max-w-[560px] mx-auto rounded-3xl overflow-hidden bg-black select-none">
                <img src={fotoB.url} alt="Depois" className="block w-full h-auto" draggable={false} />
                <img
                  src={fotoA.url}
                  alt="Antes"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ clipPath: `inset(0 ${100 - divisor}% 0 0)` }}
                  draggable={false}
                />
                {verLinhas && <GradeAvaliacao />}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${divisor}%` }} />
                <span className="absolute top-3 left-3 text-[11px] font-bold bg-black/60 text-white px-2 py-1 rounded-full">{dataCurta(fotoA.data)}</span>
                <span className="absolute top-3 right-3 text-[11px] font-bold bg-black/60 text-white px-2 py-1 rounded-full">{dataCurta(fotoB.data)}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={divisor}
                  onChange={(e) => setDivisor(Number(e.target.value))}
                  aria-label="Divisor entre as duas fotos"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== Foto em tela cheia ===== */}
      {aberta && createPortal(
        <VerFoto
          grupo={aberta.grupo}
          indice={aberta.indice}
          onIndice={(i) => setAberta({ ...aberta, indice: i })}
          onFechar={() => setAberta(null)}
          onApagar={excluir}
          rotulo={rotulo}
        />,
        document.body,
      )}
    </div>
  );
};

const VerFoto: React.FC<{
  grupo: Grupo;
  indice: number;
  onIndice: (i: number) => void;
  onFechar: () => void;
  onApagar: (f: FotoPaciente) => void;
  rotulo: (f: FotoPaciente) => string;
}> = ({ grupo, indice, onIndice, onFechar, onApagar, rotulo }) => {
  const f = grupo.fotos[indice];
  const inicioX = useRef<number | null>(null);
  const total = grupo.fotos.length;
  const ir = (d: number) => onIndice((indice + d + total) % total);
  if (!f) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{grupo.titulo}</p>
          <p className="text-[11px] opacity-80">{rotulo(f)} · {indice + 1} de {total}</p>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="p-2 rounded-full bg-white/15"><X className="w-5 h-5" /></button>
      </div>
      <div
        className="flex-1 min-h-0 flex items-center justify-center px-2"
        onPointerDown={(e) => { inicioX.current = e.clientX; }}
        onPointerUp={(e) => {
          if (inicioX.current === null) return;
          const dx = e.clientX - inicioX.current;
          inicioX.current = null;
          if (Math.abs(dx) > 50 && total > 1) ir(dx < 0 ? 1 : -1);
        }}
        style={{ touchAction: 'pan-y' }}
      >
        <img src={f.url} alt={rotulo(f)} className="max-w-full max-h-full object-contain select-none" draggable={false} />
      </div>
      {f.observacao && <p className="px-4 text-xs opacity-90 text-center">{f.observacao}</p>}
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => ir(-1)} disabled={total < 2} aria-label="Foto anterior" className="p-3 rounded-full bg-white/15 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
        <button type="button" onClick={() => onApagar(f)} className="px-4 py-2 rounded-full bg-red-600/80 text-xs font-semibold inline-flex items-center gap-1.5">
          <Trash2 className="w-4 h-4" /> Apagar foto
        </button>
        <button type="button" onClick={() => ir(1)} disabled={total < 2} aria-label="Próxima foto" className="p-3 rounded-full bg-white/15 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </div>
  );
};
