import React, { useEffect, useRef, useState } from 'react';
import { Camera, Grid3x3, Trash2, X } from 'lucide-react';
import { CameraComPontos, GradeAvaliacao } from './CameraComPontos';
import { FotoPaciente, apagarFoto, carregarFotos, enviarFoto } from '../lib/clinicaApi';
import { dataCurta, hojeISO } from '../lib/datas';

const ANGULOS: { id: string; nome: string }[] = [
  { id: 'frontal', nome: 'Frontal' },
  { id: 'perfil_direito', nome: 'Perfil direito' },
  { id: 'perfil_esquerdo', nome: 'Perfil esquerdo' },
  { id: 'obliquo_direito', nome: 'Oblíquo direito' },
  { id: 'obliquo_esquerdo', nome: 'Oblíquo esquerdo' },
  { id: 'detalhe', nome: 'Detalhe' },
];
const nomeAngulo = (id: string) => ANGULOS.find((a) => a.id === id)?.nome || id;

interface Props {
  pacienteId: string;
}

// Galeria de fotos do paciente com o comparador antes e depois.
// As fotos ficam num espaço privado do banco: só a Jimena consegue ver.
export const FotosPaciente: React.FC<Props> = ({ pacienteId }) => {
  const [fotos, setFotos] = useState<FotoPaciente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState('');
  const [tipo, setTipo] = useState<'antes' | 'depois'>('antes');
  const [angulo, setAngulo] = useState('frontal');
  const [data, setData] = useState(hojeISO());
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [antesId, setAntesId] = useState('');
  const [depoisId, setDepoisId] = useState('');
  const [divisor, setDivisor] = useState(50);
  const [cameraAberta, setCameraAberta] = useState(false);
  const [verLinhas, setVerLinhas] = useState(true);
  const entrada = useRef<HTMLInputElement>(null);
  const blocoNova = useRef<HTMLDivElement>(null);

  // Quando chega uma foto nova, rola a tela até o quadro de salvar
  useEffect(() => {
    if (previa) setTimeout(() => blocoNova.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [previa]);

  const recarregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const lista = await carregarFotos(pacienteId);
      setFotos(lista);
      const antes = lista.filter((f) => f.tipo === 'antes');
      const depois = lista.filter((f) => f.tipo === 'depois');
      setAntesId((atual) => (antes.some((f) => f.id === atual) ? atual : antes[0]?.id || ''));
      setDepoisId((atual) => (depois.some((f) => f.id === atual) ? atual : depois[depois.length - 1]?.id || ''));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar as fotos.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    setFotos([]);
    setAntesId('');
    setDepoisId('');
    cancelar();
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const escolherArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) prepararFoto(f);
  };

  const prepararFoto = (f: File) => {
    if (!f.type.startsWith('image/')) { alert('Escolha uma imagem (foto).'); return; }
    if (previa) URL.revokeObjectURL(previa);
    setArquivo(f);
    setPrevia(URL.createObjectURL(f));
    setTipo(fotos.some((x) => x.tipo === 'antes') ? 'depois' : 'antes');
    setData(hojeISO());
    setObservacao('');
  };

  function cancelar() {
    setPrevia((p) => { if (p) URL.revokeObjectURL(p); return ''; });
    setArquivo(null);
  }

  const salvar = async () => {
    if (!arquivo) return;
    setEnviando(true);
    try {
      await enviarFoto(pacienteId, arquivo, { tipo, angulo, data, observacao });
      cancelar();
      await recarregar();
    } catch (e) {
      alert('Não consegui salvar a foto: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setEnviando(false);
    }
  };

  const excluir = async (f: FotoPaciente) => {
    if (!confirm(`Apagar a foto "${f.tipo}" de ${dataCurta(f.data)}? Não dá para desfazer.`)) return;
    try {
      await apagarFoto(f);
      await recarregar();
    } catch (e) {
      alert('Não consegui apagar: ' + (e instanceof Error ? e.message : ''));
    }
  };

  const antes = fotos.filter((f) => f.tipo === 'antes');
  const depois = fotos.filter((f) => f.tipo === 'depois');
  const fotoAntes = fotos.find((f) => f.id === antesId);
  const fotoDepois = fotos.find((f) => f.id === depoisId);
  const rotulo = (f: FotoPaciente) => `${dataCurta(f.data)} · ${nomeAngulo(f.angulo)}`;

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-serif italic text-xl text-[#0F172A]">Comparador Interativo Antes & Depois</h4>
          <p className="text-xs text-[#334155]">Arraste o divisor central para verificar a evolução e simetria do tratamento.</p>
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
        {cameraAberta && (
          <CameraComPontos
            modo="avaliacao"
            onFechar={() => setCameraAberta(false)}
            onFoto={(f) => { setCameraAberta(false); prepararFoto(f); }}
          />
        )}
        <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={escolherArquivo} />
      </div>

      {/* Nova foto: confirmar antes de salvar */}
      {previa && (
        <div ref={blocoNova} className="rounded-3xl border-2 border-[#4A5D3A] bg-[#F5EFE6] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#5C4033]">Nova foto: escolha Antes ou Depois e toque em Salvar</p>
            <button type="button" onClick={cancelar} aria-label="Cancelar" className="p-1 text-[#5C4033]"><X className="w-4 h-4" /></button>
          </div>
          <div className="relative w-full max-w-xs mx-auto rounded-2xl overflow-hidden bg-white">
            <img src={previa} alt="Prévia da foto" className="block w-full h-auto" />
            {verLinhas && <GradeAvaliacao />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['antes', 'depois'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`py-2.5 rounded-2xl text-sm font-semibold border ${tipo === t ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white text-[#0F172A] border-[#CBD5E1]'}`}
              >
                {t === 'antes' ? 'Antes' : 'Depois'}
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
              <input type="date" value={data} max={hojeISO()} onChange={(e) => setData(e.target.value || hojeISO())} className="mt-1 w-full px-3 py-2.5 rounded-2xl border border-[#CBD5E1] bg-white text-sm" />
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
            {enviando ? 'Salvando a foto…' : `Salvar como "${tipo === 'antes' ? 'Antes' : 'Depois'}"`}
          </button>
        </div>
      )}

      {erro && <p className="text-sm text-[#C1663F]">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-[#5C4033]">Carregando as fotos…</p>
      ) : fotos.length === 0 ? (
        !previa && (
          <div className="rounded-3xl border border-[#E8D8C3] bg-[#F5EFE6] p-8 text-center text-sm text-[#5C4033]">
            Nenhuma foto registrada para este paciente.
            <span className="block mt-1 text-xs">Toque em "Adicionar Foto" para tirar uma foto ou escolher da galeria.</span>
          </div>
        )
      ) : (
        <>
          {/* Comparador */}
          {fotoAntes && fotoDepois ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-[#334155]">Antes
                  <select value={antesId} onChange={(e) => setAntesId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-2xl border border-[#CBD5E1] bg-white text-sm">
                    {antes.map((f) => <option key={f.id} value={f.id}>{rotulo(f)}</option>)}
                  </select>
                </label>
                <label className="text-xs text-[#334155]">Depois
                  <select value={depoisId} onChange={(e) => setDepoisId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-2xl border border-[#CBD5E1] bg-white text-sm">
                    {depois.map((f) => <option key={f.id} value={f.id}>{rotulo(f)}</option>)}
                  </select>
                </label>
              </div>
              <label className="flex items-center justify-end gap-2 text-xs text-[#334155]">
                <input type="checkbox" checked={verLinhas} onChange={(e) => setVerLinhas(e.target.checked)} />
                Mostrar linhas de avaliação
              </label>
              <div className="relative w-full max-w-[560px] mx-auto rounded-3xl overflow-hidden bg-black select-none">
                <img src={fotoDepois.url} alt="Depois" className="block w-full h-auto" draggable={false} />
                <img
                  src={fotoAntes.url}
                  alt="Antes"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ clipPath: `inset(0 ${100 - divisor}% 0 0)` }}
                  draggable={false}
                />
                {verLinhas && <GradeAvaliacao />}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${divisor}%` }} />
                <span className="absolute top-3 left-3 text-[11px] font-bold uppercase bg-black/60 text-white px-2 py-1 rounded-full">Antes</span>
                <span className="absolute top-3 right-3 text-[11px] font-bold uppercase bg-black/60 text-white px-2 py-1 rounded-full">Depois</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={divisor}
                  onChange={(e) => setDivisor(Number(e.target.value))}
                  aria-label="Divisor antes e depois"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E8D8C3] bg-[#F5EFE6] p-5 text-center text-sm text-[#5C4033]">
              {antes.length === 0 ? 'Falta uma foto "Antes" para comparar.' : 'Falta uma foto "Depois" para comparar.'}
            </div>
          )}

          {/* Todas as fotos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fotos.map((f) => (
              <div key={f.id} className="rounded-2xl border border-[#E8D8C3] overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => (f.tipo === 'antes' ? setAntesId(f.id) : setDepoisId(f.id))}
                  className="block w-full"
                  title="Usar no comparador"
                >
                  <img src={f.url} alt={`${f.tipo} ${rotulo(f)}`} className="w-full aspect-[3/4] object-cover" />
                </button>
                <div className="p-2 flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${f.tipo === 'antes' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {f.tipo}
                    </span>
                    <p className="text-[11px] text-[#334155] mt-1">{rotulo(f)}</p>
                    {f.observacao && <p className="text-[11px] text-[#5C4033] truncate">{f.observacao}</p>}
                  </div>
                  <button type="button" onClick={() => excluir(f)} aria-label="Apagar foto" className="p-1 text-[#C1663F] shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
