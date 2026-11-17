import React, { useCallback, useEffect, useState } from 'react';
import {
  Patient, Appointment, InventoryItem, ProcedureCatalogItem,
  Professional, FinancialTransaction, FaceMapPoint, AppointmentStatus
} from './types';
import { PatientsModule } from './components/PatientsModule';
import { AppointmentsModule } from './components/AppointmentsModule';
import { InventoryModule } from './components/InventoryModule';
import { ProceduresModule } from './components/ProceduresModule';
import { FinancialModule } from './components/FinancialModule';
import { AiAssistantModule } from './components/AiAssistantModule';
import { FaceMapStudio } from './components/FaceMapStudio';
import { Entrar } from './components/Entrar';
import { CLINICA, CORES, IA_ATIVA } from './lib/config';
import { hojeISO } from './lib/datas';
import { supabase } from './lib/supabase';
import {
  Bloqueio, Equipe, ajustarEstoque, atualizarStatus, carregarBloqueios, carregarEstoque,
  carregarFinanceiro, carregarMapas, carregarMarcacoes, carregarPacientes, carregarServicos,
  criarPacienteRapido, equipeDaSessao, excluirEstoque, excluirPaciente, sair, salvarEstoque,
  salvarFinanceiro, salvarMapa, salvarMarcacao, salvarPaciente,
} from './lib/clinicaApi';
import {
  Sparkles, Users, Calendar as CalendarIcon, Package, FileText,
  DollarSign, SlidersHorizontal, Menu, X, LogOut
} from 'lucide-react';

type NavModule =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'facemap'
  | 'inventory'
  | 'procedures'
  | 'financial'
  | 'ai_assistant';

const JIMENA: Professional = {
  id: 'jimena',
  name: CLINICA.nome,
  role: CLINICA.subtitulo,
  council: 'CRO',
  councilNumber: CLINICA.registro,
  phone: CLINICA.whatsapp,
  email: '',
  avatarUrl: '',
  color: CORES.musgo,
  commissionPercent: 0,
};

export default function App() {
  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [authPronto, setAuthPronto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroGeral, setErroGeral] = useState('');
  const [activeModule, setActiveModule] = useState<NavModule>('appointments');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [procedures, setProcedures] = useState<ProcedureCatalogItem[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [faceMaps, setFaceMaps] = useState<Record<string, FaceMapPoint[]>>({});
  const [standalonePatientId, setStandalonePatientId] = useState('');

  const dentista = equipe?.papel === 'dentista';

  const recarregar = useCallback(async (quem: Equipe) => {
    const jimena = quem.papel === 'dentista';
    const [servicos, pacientes, marcacoes, ausencias] = await Promise.all([
      carregarServicos(),
      carregarPacientes(jimena),
      carregarMarcacoes(),
      carregarBloqueios(),
    ]);
    setProcedures(servicos);
    setPatients(pacientes);
    setAppointments(marcacoes);
    setBloqueios(ausencias);
    setStandalonePatientId((atual) => atual || pacientes[0]?.id || '');
    if (jimena) {
      const [mapas, estoque, financeiro] = await Promise.all([
        carregarMapas(),
        carregarEstoque(),
        carregarFinanceiro(pacientes),
      ]);
      setFaceMaps(mapas);
      setInventory(estoque);
      setTransactions(financeiro);
    } else {
      setFaceMaps({});
      setInventory([]);
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    equipeDaSessao()
      .then((eq) => { if (vivo) setEquipe(eq); })
      .finally(() => { if (vivo) setAuthPronto(true); });
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      equipeDaSessao().then((eq) => { if (vivo) setEquipe(eq); });
    });
    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!equipe) return;
    let vivo = true;
    setCarregando(true);
    recarregar(equipe)
      .catch((e) => setErroGeral(e instanceof Error ? e.message : 'Não consegui carregar os dados.'))
      .finally(() => { if (vivo) setCarregando(false); });

    const canal = supabase
      .channel('harmonize-agenda')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinica_marcacoes' }, () => {
        recarregar(equipe).catch(() => undefined);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinica_bloqueios' }, () => {
        recarregar(equipe).catch(() => undefined);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinica_pacientes' }, () => {
        recarregar(equipe).catch(() => undefined);
      })
      .subscribe();

    return () => {
      vivo = false;
      supabase.removeChannel(canal);
    };
  }, [equipe, recarregar]);

  useEffect(() => {
    if (!dentista && activeModule !== 'appointments') setActiveModule('appointments');
    else if (!IA_ATIVA && activeModule === 'ai_assistant') setActiveModule('appointments');
  }, [dentista, activeModule]);

  const avisar = (e: unknown) => {
    const msg = e instanceof Error ? e.message : 'Não consegui salvar.';
    setErroGeral(msg);
    alert(msg);
  };

  const handleSavePatient = async (pat: Patient) => {
    try {
      await salvarPaciente(pat);
      if (equipe) await recarregar(equipe);
    } catch (e) { avisar(e); }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir o prontuário deste paciente?')) return;
    try {
      await excluirPaciente(id);
      if (equipe) await recarregar(equipe);
    } catch (e) { avisar(e); }
  };

  const handleUpdateFaceMap = async (patientId: string, points: FaceMapPoint[]) => {
    setFaceMaps((prev) => ({ ...prev, [patientId]: points }));
    try {
      await salvarMapa(patientId, points);
    } catch (e) { avisar(e); }
  };

  const handleSaveAppointment = async (apt: Appointment) => {
    await salvarMarcacao(apt, procedures);
    if (equipe) await recarregar(equipe);
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await atualizarStatus(id, 'cancelado');
      if (equipe) await recarregar(equipe);
    } catch (e) { avisar(e); }
  };

  const handleUpdateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await atualizarStatus(id, status);
      if (equipe) await recarregar(equipe);
    } catch (e) { avisar(e); }
  };

  const handleCreatePatient = async (nome: string, telefone: string) => {
    const criado = await criarPacienteRapido(nome, telefone);
    if (equipe) await recarregar(equipe);
    return criado;
  };

  const handleSaveInventory = async (item: InventoryItem) => {
    try {
      await salvarEstoque(item);
      if (equipe) await recarregar(equipe);
    } catch (e) { avisar(e); }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      await excluirEstoque(id);
      if (equipe) await recarregar(equipe);
    } catch (e) { avisar(e); }
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    try {
      await ajustarEstoque(id, Math.max(0, item.currentStock + delta));
      if (equipe) await recarregar(equipe);
    } catch (e) { avisar(e); }
  };

  const handleSaveProcedure = () => {
    alert('Estes são os 13 procedimentos da clínica, com a duração que ocupa a agenda. A lista não é alterada aqui, para continuar igual na marcação.');
  };

  const handleSaveTransaction = async (tx: FinancialTransaction) => {
    try {
      await salvarFinanceiro(tx);
      if (equipe) await recarregar(equipe);
    } catch (e) { avisar(e); }
  };

  const handleOpenPatientRecord = (patientId: string) => {
    if (!dentista) return;
    setStandalonePatientId(patientId);
    setActiveModule('patients');
  };

  if (!authPronto) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CORES.creme, color: CORES.cafe }}>
        Carregando…
      </div>
    );
  }

  if (!equipe) return <Entrar />;

  const hoje = hojeISO();
  const hojeLista = appointments.filter((a) => a.date === hoje && a.status !== 'cancelado');
  const criticos = inventory.filter((i) => i.currentStock <= i.minStock);
  const receitas = transactions.filter((t) => t.type === 'receita' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const pacienteMapa = patients.find((p) => p.id === standalonePatientId) || patients[0];

  const navItems: { id: NavModule; label: string; sublabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'appointments', label: 'Agenda', sublabel: `${hojeLista.length} hoje`, icon: CalendarIcon },
    ...(dentista ? [
      { id: 'patients' as NavModule, label: 'Pacientes', sublabel: `${patients.length} no prontuário`, icon: Users },
      { id: 'facemap' as NavModule, label: 'Mapa facial', sublabel: 'Pontos de botox', icon: SlidersHorizontal },
      { id: 'inventory' as NavModule, label: 'Estoque', sublabel: 'Injetáveis', icon: Package },
      { id: 'procedures' as NavModule, label: 'Procedimentos', sublabel: '13 serviços e durações', icon: FileText },
      { id: 'financial' as NavModule, label: 'Financeiro', sublabel: 'O que a Jimena registrar', icon: DollarSign },
      ...(IA_ATIVA ? [{ id: 'ai_assistant' as NavModule, label: 'Assistente', sublabel: 'Pós-cuidado', icon: Sparkles }] : []),
      { id: 'dashboard' as NavModule, label: 'Visão geral', sublabel: 'Resumo do dia', icon: Sparkles },
    ] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans antialiased" style={{ background: CORES.creme, color: CORES.cafe }}>
      <div className="md:hidden border-b p-4 flex items-center justify-between sticky top-0 z-50" style={{ background: '#fff', borderColor: CORES.areia }}>
        <button type="button" onClick={() => setActiveModule('appointments')} className="text-left">
          <span className="font-serif text-xl block" style={{ color: CORES.cafe }}>{CLINICA.nome}</span>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: CORES.oliva }}>{CLINICA.subtitulo}</span>
        </button>
        <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl border" style={{ borderColor: CORES.areia }} aria-label="Menu">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 lg:w-72 border-r flex-col shrink-0 md:sticky md:top-0 md:h-screen z-40`} style={{ background: '#fff', borderColor: CORES.areia }}>
        <div className="p-6 border-b hidden md:block" style={{ borderColor: CORES.areia }}>
          <p className="font-serif text-2xl" style={{ color: CORES.cafe }}>{CLINICA.nome}</p>
          <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: CORES.oliva }}>{CLINICA.subtitulo}</p>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const ativo = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`nav-btn-${tab.id}`}
                onClick={() => { setActiveModule(tab.id); setMobileMenuOpen(false); }}
                className="w-full p-3 rounded-2xl flex items-center gap-3 text-left"
                style={{ background: ativo ? CORES.creme : 'transparent', color: CORES.cafe }}
              >
                <span className="p-2 rounded-xl" style={{ background: ativo ? CORES.musgo : CORES.creme, color: ativo ? '#fff' : CORES.cafe }}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{tab.label}</span>
                  <span className="block text-[11px] truncate" style={{ color: CORES.oliva }}>{tab.sublabel}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: CORES.areia }}>
          <p className="text-sm font-semibold">{equipe.nome}</p>
          <p className="text-[11px]" style={{ color: CORES.oliva }}>
            {dentista ? 'Acesso completo' : 'Somente a agenda'}
            {CLINICA.registro ? ` · ${CLINICA.registro}` : ''}
          </p>
          <button type="button" onClick={() => sair()} className="mt-3 text-xs font-semibold inline-flex items-center gap-1" style={{ color: CORES.terracota }}>
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {erroGeral && (
            <p className="mb-4 text-sm rounded-2xl px-4 py-3" style={{ background: '#fff', color: CORES.terracota }}>
              {erroGeral}
            </p>
          )}
          {carregando && appointments.length === 0 && procedures.length === 0 ? (
            <p className="text-sm" style={{ color: CORES.oliva }}>Carregando a agenda…</p>
          ) : (
            <>
              {activeModule === 'dashboard' && dentista && (
                <div className="space-y-6">
                  <div className="rounded-3xl p-6 text-white" style={{ background: CORES.musgo }}>
                    <p className="text-xs uppercase tracking-[0.16em] opacity-80">Resumo de hoje</p>
                    <h2 className="font-serif text-3xl mt-1">{hojeLista.length} {hojeLista.length === 1 ? 'marcação' : 'marcações'}</h2>
                    <button type="button" onClick={() => setActiveModule('appointments')} className="mt-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: CORES.creme, color: CORES.cafe }}>
                      Abrir a agenda
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-3xl bg-white p-5 border" style={{ borderColor: CORES.areia }}>
                      <p className="text-[11px] uppercase tracking-wider" style={{ color: CORES.oliva }}>Pacientes</p>
                      <p className="font-serif text-3xl">{patients.length}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 border" style={{ borderColor: CORES.areia }}>
                      <p className="text-[11px] uppercase tracking-wider" style={{ color: CORES.oliva }}>Estoque em alerta</p>
                      <p className="font-serif text-3xl">{criticos.length}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-5 border" style={{ borderColor: CORES.areia }}>
                      <p className="text-[11px] uppercase tracking-wider" style={{ color: CORES.oliva }}>Receitas registradas</p>
                      <p className="font-serif text-3xl">R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'patients' && dentista && (
                <PatientsModule
                  patients={patients}
                  onSavePatient={handleSavePatient}
                  onDeletePatient={handleDeletePatient}
                  faceMapRecords={faceMaps}
                  onUpdateFaceMap={handleUpdateFaceMap}
                />
              )}

              {activeModule === 'appointments' && (
                <AppointmentsModule
                  appointments={appointments}
                  patients={patients}
                  procedures={procedures}
                  professionals={[JIMENA]}
                  bloqueios={bloqueios}
                  onSaveAppointment={handleSaveAppointment}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                  onOpenPatientRecord={handleOpenPatientRecord}
                  onDeleteAppointment={handleDeleteAppointment}
                  onCreatePatient={handleCreatePatient}
                  podeProntuario={dentista}
                  podeAnotacao={dentista}
                />
              )}

              {activeModule === 'facemap' && dentista && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: CORES.areia }}>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: CORES.oliva }}>Mapa facial</p>
                      <h3 className="font-serif text-2xl">Marcação de pontos de botox</h3>
                      <p className="text-xs mt-1" style={{ color: CORES.oliva }}>A mesma face vale para mulher e homem.</p>
                    </div>
                    <select
                      value={standalonePatientId}
                      onChange={(e) => setStandalonePatientId(e.target.value)}
                      className="px-4 py-2.5 rounded-2xl border text-sm"
                      style={{ borderColor: CORES.areia, background: CORES.creme }}
                    >
                      {patients.length === 0 && <option value="">Nenhum paciente</option>}
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  {pacienteMapa ? (
                    <FaceMapStudio
                      points={faceMaps[pacienteMapa.id] || []}
                      onChangePoints={(pts) => handleUpdateFaceMap(pacienteMapa.id, pts)}
                      patientName={pacienteMapa.name}
                      patientGender={pacienteMapa.gender}
                      pacienteId={pacienteMapa.id}
                    />
                  ) : (
                    <p className="text-sm">Cadastre um paciente para marcar os pontos.</p>
                  )}
                </div>
              )}

              {activeModule === 'inventory' && dentista && (
                <InventoryModule
                  inventory={inventory}
                  onSaveItem={handleSaveInventory}
                  onDeleteItem={handleDeleteInventory}
                  onAdjustStock={handleAdjustStock}
                />
              )}

              {activeModule === 'procedures' && dentista && (
                <ProceduresModule
                  procedures={procedures}
                  patients={patients}
                  onSaveProcedure={handleSaveProcedure}
                />
              )}

              {activeModule === 'financial' && dentista && (
                <FinancialModule
                  transactions={transactions}
                  professionals={[JIMENA]}
                  onSaveTransaction={handleSaveTransaction}
                />
              )}

              {IA_ATIVA && activeModule === 'ai_assistant' && dentista && (
                <AiAssistantModule patients={patients} procedures={procedures} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
