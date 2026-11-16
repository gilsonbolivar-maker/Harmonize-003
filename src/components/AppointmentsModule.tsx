import React, { useMemo, useState } from 'react';
import { Appointment, AppointmentStatus, Patient, ProcedureCatalogItem, Professional } from '../types';
import { CLINICA, CORES } from '../lib/config';
import {
  dataBonita,
  dataCurta,
  diaAtende,
  gradeDoMes,
  hhmm,
  hojeISO,
  local,
  minutos,
  nomeMes,
  partesDaData,
  somaDias,
} from '../lib/datas';
import type { Bloqueio } from '../lib/clinicaApi';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MessageSquare, Pencil, Plus, User, X } from 'lucide-react';

interface AppointmentsModuleProps {
  appointments: Appointment[];
  patients: Patient[];
  procedures: ProcedureCatalogItem[];
  professionals: Professional[];
  bloqueios?: Bloqueio[];
  onSaveAppointment: (appointment: Appointment) => void | Promise<void>;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void | Promise<void>;
  onOpenPatientRecord: (patientId: string) => void;
  onDeleteAppointment?: (id: string) => void | Promise<void>;
  onCreatePatient?: (nome: string, telefone: string) => Promise<Patient | null>;
  podeProntuario?: boolean;
  podeAnotacao?: boolean;
}

const ROTULOS: Record<string, string> = {
  marcado: 'Marcado',
  agendado: 'Marcado',
  confirmado: 'Confirmado',
  em_atendimento: 'Confirmado',
  atendido: 'Atendido',
  concluido: 'Atendido',
  faltou: 'Faltou',
  retorno_pendente: 'Confirmado',
  cancelado: 'Cancelado',
};

const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const AppointmentsModule: React.FC<AppointmentsModuleProps> = ({
  appointments,
  patients,
  procedures,
  professionals,
  bloqueios = [],
  onSaveAppointment,
  onUpdateStatus,
  onOpenPatientRecord,
  onDeleteAppointment,
  onCreatePatient,
  podeProntuario = false,
  podeAnotacao = false,
}) => {
  const hoje = hojeISO();
  const inicio = partesDaData(hoje);
  const [dia, setDia] = useState(hoje);
  const [mes, setMes] = useState({ ano: inicio.ano, mes: inicio.mes });
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [modoNovo, setModoNovo] = useState(false);
  const [area, setArea] = useState<'Estética' | 'Odontologia'>('Estética');
  const [form, setForm] = useState({
    id: '',
    patientId: '',
    novoNome: '',
    novoTelefone: '',
    servicoId: '',
    date: hoje,
    time: '',
    notes: '',
    anotacaoAtendimento: '',
    status: 'marcado' as AppointmentStatus,
  });

  const ativas = appointments.filter((a) => a.status !== 'cancelado');
  const diasComMarcacao = useMemo(() => {
    const set = new Set<string>();
    ativas.forEach((a) => set.add(a.date));
    return set;
  }, [appointments]);

  const doDia = ativas
    .filter((a) => a.date === dia)
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));
  const canceladas = appointments.filter((a) => a.date === dia && a.status === 'cancelado');
  const ausencias = bloqueios.filter((b) => b.data === dia);

  const celulas = gradeDoMes(mes.ano, mes.mes);
  const procedimentosDaArea = procedures.filter((p) => p.area === area);
  const procedimento = procedures.find((p) => p.id === form.servicoId);

  const mudarMes = (delta: number) => {
    setMes((atual) => {
      const data = new Date(Date.UTC(atual.ano, atual.mes - 1 + delta, 1));
      return { ano: data.getUTCFullYear(), mes: data.getUTCMonth() + 1 };
    });
  };

  const irPara = (iso: string) => {
    setDia(iso);
    const p = partesDaData(iso);
    setMes({ ano: p.ano, mes: p.mes });
  };

  const ocupacao = (data: string, ignorarId?: string) => {
    const faixas: [number, number][] = [];
    appointments
      .filter((a) => a.date === data && a.status !== 'cancelado' && a.id !== ignorarId)
      .forEach((a) => faixas.push([minutos(a.time), minutos(a.time) + a.durationMinutes]));
    bloqueios
      .filter((b) => b.data === data)
      .forEach((b) => faixas.push([minutos(b.horaInicio), minutos(b.horaFim)]));
    return faixas;
  };

  const horarios = useMemo(() => {
    if (!procedimento) return { aviso: 'Escolha o procedimento para ver os horários.', lista: [] as { hora: string; livre: boolean }[] };
    if (!diaAtende(form.date)) return { aviso: 'Não há atendimento neste dia.', lista: [] };
    if (form.date < hoje) return { aviso: 'Este dia já passou.', lista: [] };
    const dur = procedimento.durationMinutes;
    const faixas = ocupacao(form.date, editando ? form.id : undefined);
    const cobreTudo = faixas.some(([a, b]) => a <= minutos(CLINICA.abre) && b >= minutos(CLINICA.fecha));
    if (cobreTudo) return { aviso: 'Jimena ausente neste dia.', lista: [] };
    const agora = form.date === hoje ? minutos(local(new Date().toISOString()).hora) : -1;
    const lista: { hora: string; livre: boolean }[] = [];
    for (let t = minutos(CLINICA.abre); t + dur <= minutos(CLINICA.fecha); t += CLINICA.intervaloMin) {
      const ocupado = faixas.some(([a, b]) => t < b && t + dur > a);
      const passou = t <= agora;
      lista.push({ hora: hhmm(t), livre: !ocupado && !passou });
    }
    return { aviso: lista.some((h) => h.livre) ? '' : 'Nenhum horário livre para este procedimento neste dia.', lista };
  }, [form.date, form.servicoId, form.id, editando, appointments, bloqueios, procedimento, hoje]);

  const abrirNova = () => {
    const primeira = procedures.find((p) => p.area === 'Estética') || procedures[0];
    setEditando(false);
    setModoNovo(false);
    setBusca('');
    setErro('');
    setArea(primeira?.area || 'Estética');
    setForm({
      id: '',
      patientId: '',
      novoNome: '',
      novoTelefone: '',
      servicoId: primeira?.id || '',
      date: dia >= hoje ? dia : hoje,
      time: '',
      notes: '',
      anotacaoAtendimento: '',
      status: 'marcado',
    });
    setAberto(true);
  };

  const abrirEdicao = (apt: Appointment) => {
    const proc = procedures.find((p) => p.id === apt.procedureIds[0]);
    setEditando(true);
    setModoNovo(false);
    setBusca('');
    setErro('');
    setArea(proc?.area || 'Estética');
    setForm({
      id: apt.id,
      patientId: apt.patientId,
      novoNome: '',
      novoTelefone: '',
      servicoId: apt.procedureIds[0] || '',
      date: apt.date,
      time: apt.time,
      notes: apt.notes || '',
      anotacaoAtendimento: apt.anotacaoAtendimento || '',
      status: apt.status,
    });
    setAberto(true);
  };

  const pacientesFiltrados = patients
    .filter((p) => p.name.toLowerCase().includes(busca.trim().toLowerCase()))
    .slice(0, 6);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!form.servicoId || !form.time) {
      setErro('Falta escolher o procedimento e o horário.');
      return;
    }
    setSalvando(true);
    try {
      let patientId = form.patientId;
      let patientName = patients.find((p) => p.id === patientId)?.name || '';
      let patientPhone = patients.find((p) => p.id === patientId)?.phone || '';
      if (!patientId) {
        if (!modoNovo || !form.novoNome.trim()) {
          setErro('Escolha o paciente ou cadastre um nome.');
          setSalvando(false);
          return;
        }
        if (!onCreatePatient) {
          setErro('Não consegui cadastrar o paciente.');
          setSalvando(false);
          return;
        }
        const criado = await onCreatePatient(form.novoNome.trim(), form.novoTelefone.trim());
        if (!criado) {
          setErro('Não consegui cadastrar o paciente.');
          setSalvando(false);
          return;
        }
        patientId = criado.id;
        patientName = criado.name;
        patientPhone = criado.phone;
      }
      const proc = procedures.find((p) => p.id === form.servicoId);
      await onSaveAppointment({
        id: form.id,
        patientId,
        patientName,
        patientPhone,
        professionalId: 'jimena',
        professionalName: professionals[0]?.name || CLINICA.nome,
        procedureIds: [form.servicoId],
        procedureNames: proc ? [proc.name] : [],
        date: form.date,
        time: form.time,
        durationMinutes: proc?.durationMinutes || CLINICA.intervaloMin,
        status: editando ? form.status : 'marcado',
        notes: form.notes,
        anotacaoAtendimento: podeAnotacao ? form.anotacaoAtendimento : '',
        totalPrice: 0,
        paymentStatus: 'pendente',
      });
      setAberto(false);
      irPara(form.date);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não consegui marcar.');
    } finally {
      setSalvando(false);
    }
  };

  const lembrete = (apt: Appointment) => {
    const fone = apt.patientPhone.replace(/\D/g, '');
    if (!fone) return;
    const proc = apt.procedureNames.join(', ');
    const msg = `Olá, ${apt.patientName.split(' ')[0]}! Aqui é da clínica ${CLINICA.nome}. Confirmando seu horário: ${dataBonita(apt.date)} às ${apt.time} — ${proc}. Podemos confirmar?`;
    const numero = fone.length <= 11 ? `55${fone}` : fone;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const areaDa = (apt: Appointment) => procedures.find((p) => p.id === apt.procedureIds[0])?.area;

  return (
    <div id="appointments-module-container" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: CORES.oliva }}>
            {CLINICA.nome}
          </p>
          <h2 className="font-serif text-3xl" style={{ color: CORES.cafe }}>
            Agenda
          </h2>
        </div>
        <button
          type="button"
          onClick={abrirNova}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white text-sm font-semibold"
          style={{ background: CORES.musgo }}
        >
          <Plus className="w-4 h-4" />
          Nova marcação
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <aside
          className="w-full lg:w-80 shrink-0 rounded-3xl border p-4"
          style={{ background: '#fff', borderColor: CORES.areia }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => mudarMes(-1)}
              className="w-9 h-9 rounded-full border flex items-center justify-center text-lg leading-none"
              style={{ borderColor: CORES.areia, color: CORES.musgo, fontFamily: 'sans-serif' }}
            >
              {'\u25C0\uFE0E'}
            </button>
            <p className="font-serif text-lg" style={{ color: CORES.cafe }}>
              {nomeMes(mes.ano, mes.mes)}
            </p>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => mudarMes(1)}
              className="w-9 h-9 rounded-full border flex items-center justify-center text-lg leading-none"
              style={{ borderColor: CORES.areia, color: CORES.musgo, fontFamily: 'sans-serif' }}
            >
              {'\u25B6\uFE0E'}
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-1" style={{ color: CORES.oliva }}>
            {DIAS_CURTOS.map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celulas.map((iso, i) => {
              if (!iso) return <span key={`v-${i}`} />;
              const numero = Number(iso.slice(8, 10));
              const tem = diasComMarcacao.has(iso);
              const selecionado = iso === dia;
              const ehHoje = iso === hoje;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setDia(iso)}
                  className="h-10 rounded-full text-sm flex items-center justify-center"
                  style={{
                    background: tem ? CORES.musgo : selecionado ? CORES.areia : 'transparent',
                    color: tem ? '#fff' : CORES.cafe,
                    outline: selecionado ? `2px solid ${CORES.terracota}` : 'none',
                    outlineOffset: 1,
                    fontWeight: ehHoje || tem ? 700 : 500,
                    opacity: diaAtende(iso) ? 1 : 0.45,
                  }}
                  aria-label={dataBonita(iso)}
                  aria-current={ehHoje ? 'date' : undefined}
                >
                  {numero}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] mt-3" style={{ color: CORES.oliva }}>
            O número no círculo verde é um dia com marcação. Domingo não atende.
          </p>
          <button
            type="button"
            onClick={() => irPara(hoje)}
            className="mt-3 w-full py-2 rounded-full text-sm font-semibold border"
            style={{ borderColor: CORES.musgo, color: CORES.musgo }}
          >
            Hoje
          </button>
        </aside>

        <section className="flex-1 w-full min-w-0 space-y-3">
          <div
            className="rounded-3xl border p-4 flex items-center justify-between gap-3"
            style={{ background: '#fff', borderColor: CORES.areia }}
          >
            <button
              type="button"
              aria-label="Dia anterior"
              onClick={() => irPara(somaDias(dia, -1))}
              className="p-2 rounded-full border"
              style={{ borderColor: CORES.areia }}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: CORES.cafe }} />
            </button>
            <div className="text-center min-w-0">
              <p className="font-serif text-xl" style={{ color: CORES.cafe }}>
                {dataBonita(dia).charAt(0).toUpperCase() + dataBonita(dia).slice(1)}
              </p>
              <p className="text-xs" style={{ color: CORES.oliva }}>
                {doDia.length} {doDia.length === 1 ? 'marcação' : 'marcações'}
                {!diaAtende(dia) ? ' · sem atendimento' : ''}
              </p>
            </div>
            <button
              type="button"
              aria-label="Próximo dia"
              onClick={() => irPara(somaDias(dia, 1))}
              className="p-2 rounded-full border"
              style={{ borderColor: CORES.areia }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: CORES.cafe }} />
            </button>
          </div>

          {ausencias.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border px-4 py-3 flex items-center gap-3"
              style={{ background: CORES.areia, borderColor: CORES.caramelo }}
            >
              <Clock className="w-4 h-4 shrink-0" style={{ color: CORES.argila }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: CORES.cafe }}>
                  Ausência
                </p>
                <p className="text-xs" style={{ color: CORES.cafe }}>
                  {b.horaInicio <= CLINICA.abre && b.horaFim >= CLINICA.fecha
                    ? 'Dia inteiro'
                    : `${b.horaInicio} até ${b.horaFim}`}
                  {b.motivo ? ` · ${b.motivo}` : ''}
                </p>
              </div>
            </div>
          ))}

          {doDia.length === 0 && ausencias.length === 0 && (
            <div
              className="rounded-3xl border p-8 text-center"
              style={{ background: '#fff', borderColor: CORES.areia }}
            >
              <CalendarIcon className="w-8 h-8 mx-auto mb-2" style={{ color: CORES.caramelo }} />
              <p className="font-serif text-lg" style={{ color: CORES.cafe }}>
                Nenhuma marcação neste dia.
              </p>
            </div>
          )}

          {doDia.map((apt) => {
            const areaNome = areaDa(apt);
            return (
              <article
                key={apt.id}
                className="rounded-3xl border p-4 space-y-3"
                style={{ background: '#fff', borderColor: CORES.areia }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="rounded-2xl px-3 py-2 text-center text-white shrink-0 min-w-[76px]"
                    style={{ background: areaNome === 'Odontologia' ? CORES.argila : CORES.musgo }}
                  >
                    <p className="font-semibold">{apt.time}</p>
                    <p className="text-[10px] opacity-80">{apt.durationMinutes} min</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm" style={{ color: CORES.cafe }}>
                      {apt.patientName}
                    </p>
                    <p className="text-xs" style={{ color: CORES.oliva }}>
                      {apt.procedureNames.join(' · ') || 'Procedimento'}
                      {areaNome ? ` · ${areaNome}` : ''}
                    </p>
                    {apt.notes && (
                      <p className="text-xs mt-1" style={{ color: CORES.cafe }}>
                        {apt.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: CORES.creme, color: CORES.cafe }}
                  >
                    {ROTULOS[apt.status] || apt.status}
                  </span>
                  <button type="button" onClick={() => abrirEdicao(apt)} className="text-xs font-semibold inline-flex items-center gap-1 px-2 py-1" style={{ color: CORES.terracota }}>
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                  {apt.patientPhone && (
                    <button type="button" onClick={() => lembrete(apt)} className="text-xs font-semibold inline-flex items-center gap-1 px-2 py-1" style={{ color: CORES.oliva }}>
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                  )}
                  {podeProntuario && (
                    <button type="button" onClick={() => onOpenPatientRecord(apt.patientId)} className="text-xs font-semibold inline-flex items-center gap-1 px-2 py-1" style={{ color: CORES.musgo }}>
                      <User className="w-3.5 h-3.5" /> Prontuário
                    </button>
                  )}
                  <select
                    value={apt.status === 'agendado' ? 'marcado' : apt.status === 'concluido' ? 'atendido' : apt.status}
                    onChange={(e) => onUpdateStatus(apt.id, e.target.value as AppointmentStatus)}
                    className="text-xs rounded-full border px-2 py-1"
                    style={{ borderColor: CORES.areia, color: CORES.cafe, background: CORES.creme }}
                    aria-label="Situação da marcação"
                  >
                    <option value="marcado">Marcado</option>
                    <option value="confirmado">Confirmado</option>
                    {podeAnotacao && <option value="atendido">Atendido</option>}
                    {podeAnotacao && <option value="faltou">Faltou</option>}
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </article>
            );
          })}

          {canceladas.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: CORES.oliva }}>
                Canceladas
              </p>
              {canceladas.map((apt) => (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => abrirEdicao(apt)}
                  className="w-full text-left rounded-2xl border px-4 py-2 mb-2 text-sm opacity-70"
                  style={{ borderColor: CORES.areia, color: CORES.cafe }}
                >
                  {apt.time} · {apt.patientName} · {apt.procedureNames.join(', ')}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={salvar}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"
          >
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: CORES.areia }}>
              <h3 className="font-serif text-2xl" style={{ color: CORES.cafe }}>
                {editando ? 'Editar marcação' : 'Nova marcação'}
              </h3>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar">
                <X className="w-5 h-5" style={{ color: CORES.cafe }} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block font-medium mb-1.5" style={{ color: CORES.cafe }}>Paciente</label>
                {form.patientId ? (
                  <div className="flex items-center justify-between gap-2 rounded-2xl px-3 py-2" style={{ background: CORES.creme }}>
                    <span>{patients.find((p) => p.id === form.patientId)?.name}</span>
                    <button type="button" className="text-xs font-semibold" style={{ color: CORES.terracota }} onClick={() => setForm({ ...form, patientId: '' })}>
                      Trocar
                    </button>
                  </div>
                ) : modoNovo ? (
                  <div className="space-y-2">
                    <input
                      value={form.novoNome}
                      onChange={(e) => setForm({ ...form, novoNome: e.target.value })}
                      placeholder="Nome do paciente"
                      className="w-full px-3 py-2.5 rounded-2xl border"
                      style={{ borderColor: CORES.areia }}
                    />
                    <input
                      value={form.novoTelefone}
                      onChange={(e) => setForm({ ...form, novoTelefone: e.target.value })}
                      placeholder="Telefone / WhatsApp (com DDD)"
                      className="w-full px-3 py-2.5 rounded-2xl border"
                      style={{ borderColor: CORES.areia }}
                    />
                    <button type="button" className="text-xs font-semibold" style={{ color: CORES.terracota }} onClick={() => setModoNovo(false)}>
                      Buscar paciente já cadastrado
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Digite o nome do paciente"
                      className="w-full px-3 py-2.5 rounded-2xl border"
                      style={{ borderColor: CORES.areia, background: CORES.creme }}
                    />
                    {busca.trim().length >= 2 && (
                      <div className="mt-2 rounded-2xl border overflow-hidden" style={{ borderColor: CORES.areia }}>
                        {pacientesFiltrados.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="block w-full text-left px-3 py-2 border-b last:border-b-0"
                            style={{ borderColor: CORES.areia }}
                            onClick={() => {
                              setForm({ ...form, patientId: p.id });
                              setBusca('');
                            }}
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="block text-xs" style={{ color: CORES.oliva }}>{p.phone || 'sem telefone'}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          className="block w-full text-left px-3 py-2 font-medium"
                          style={{ color: CORES.musgo }}
                          onClick={() => {
                            setModoNovo(true);
                            setForm({ ...form, novoNome: busca.trim(), patientId: '' });
                          }}
                        >
                          Cadastrar novo: {busca.trim()}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium mb-1.5" style={{ color: CORES.cafe }}>Área</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Estética', 'Odontologia'] as const).map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => {
                        const proximo = procedures.find((p) => p.area === opcao);
                        setArea(opcao);
                        setForm({ ...form, servicoId: proximo?.id || '', time: '' });
                      }}
                      className="py-2.5 rounded-2xl border text-sm font-semibold"
                      style={{
                        borderColor: area === opcao ? CORES.musgo : CORES.areia,
                        background: area === opcao ? CORES.musgo : CORES.creme,
                        color: area === opcao ? '#fff' : CORES.cafe,
                      }}
                    >
                      {opcao}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1.5" style={{ color: CORES.cafe }}>Procedimento</label>
                <div className="space-y-2">
                  {procedimentosDaArea.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm({ ...form, servicoId: p.id, time: '' })}
                      className="w-full text-left px-3 py-2.5 rounded-2xl border flex items-center justify-between gap-2"
                      style={{
                        borderColor: form.servicoId === p.id ? CORES.terracota : CORES.areia,
                        background: form.servicoId === p.id ? CORES.creme : '#fff',
                      }}
                    >
                      <span>{p.name}</span>
                      <span className="text-xs shrink-0" style={{ color: CORES.oliva }}>{p.durationMinutes} min</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1.5" style={{ color: CORES.cafe }}>Dia</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value, time: '' })}
                  className="w-full px-3 py-2.5 rounded-2xl border"
                  style={{ borderColor: CORES.areia }}
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5" style={{ color: CORES.cafe }}>Horário</label>
                {horarios.aviso && (
                  <p className="text-xs mb-2" style={{ color: CORES.argila }}>{horarios.aviso}</p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {horarios.lista.map((h) => (
                    <button
                      key={h.hora}
                      type="button"
                      disabled={!h.livre && form.time !== h.hora}
                      onClick={() => setForm({ ...form, time: h.hora })}
                      className="py-2 rounded-xl text-xs font-semibold disabled:opacity-35"
                      style={{
                        background: form.time === h.hora ? CORES.musgo : CORES.creme,
                        color: form.time === h.hora ? '#fff' : CORES.cafe,
                      }}
                    >
                      {h.hora}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: CORES.oliva }}>
                  Segunda a sábado, {CLINICA.abre} às {CLINICA.fecha}, de {CLINICA.intervaloMin} em {CLINICA.intervaloMin} minutos. A duração do procedimento ocupa a agenda.
                </p>
              </div>

              <div>
                <label className="block font-medium mb-1.5" style={{ color: CORES.cafe }}>Observação</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Ex.: dor no dente de baixo, primeira consulta…"
                  className="w-full px-3 py-2.5 rounded-2xl border"
                  style={{ borderColor: CORES.areia }}
                />
              </div>

              {podeAnotacao && editando && (
                <div>
                  <label className="block font-medium mb-1.5" style={{ color: CORES.cafe }}>Anotação do atendimento</label>
                  <textarea
                    value={form.anotacaoAtendimento}
                    onChange={(e) => setForm({ ...form, anotacaoAtendimento: e.target.value })}
                    rows={3}
                    placeholder="O que foi feito, próximos passos…"
                    className="w-full px-3 py-2.5 rounded-2xl border"
                    style={{ borderColor: CORES.areia }}
                  />
                </div>
              )}

              {erro && <p className="text-sm" style={{ color: CORES.terracota }}>{erro}</p>}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-3 rounded-2xl text-white font-semibold disabled:opacity-60"
                  style={{ background: CORES.musgo }}
                >
                  {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Marcar horário'}
                </button>
                {editando && onDeleteAppointment && form.status !== 'cancelado' && (
                  <button
                    type="button"
                    className="px-4 py-3 rounded-2xl font-semibold border"
                    style={{ borderColor: CORES.terracota, color: CORES.terracota }}
                    onClick={async () => {
                      if (!confirm('Cancelar esta marcação?')) return;
                      await onDeleteAppointment(form.id);
                      setAberto(false);
                    }}
                  >
                    Cancelar marcação
                  </button>
                )}
              </div>
              <p className="text-[11px] text-center" style={{ color: CORES.oliva }}>
                {dataCurta(form.date)}
                {procedimento ? ` · ${procedimento.name} · ${procedimento.durationMinutes} min` : ''}
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
