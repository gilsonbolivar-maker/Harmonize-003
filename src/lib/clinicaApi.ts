import type {
  AnamnesisData,
  Appointment,
  AppointmentStatus,
  FaceMapPoint,
  FinancialTransaction,
  InventoryItem,
  Patient,
  ProcedureCatalogItem,
} from '../types';
import { CLINICA } from './config';
import { instante, local, minutos, hhmm, somaDias } from './datas';
import { supabase } from './supabase';

export interface Equipe {
  email: string;
  nome: string;
  papel: 'dentista' | 'assistente';
}

export interface Bloqueio {
  id: string;
  inicio: string;
  fim: string;
  motivo: string | null;
  data: string;
  horaInicio: string;
  horaFim: string;
}

interface ServicoRow {
  id: number;
  nome: string;
  area: 'Estética' | 'Odontologia';
  duracao_min: number;
  ativo: boolean;
}

interface PacienteRow {
  id: string;
  nome: string;
  telefone: string | null;
  nascimento: string | null;
  observacoes: string | null;
  em_tratamento: boolean;
  criado_em: string;
}

interface MarcacaoRow {
  id: string;
  paciente_id: string;
  servico_id: number | null;
  inicio: string;
  fim: string;
  observacao: string | null;
  status: 'marcado' | 'confirmado' | 'cancelado' | 'atendido' | 'faltou';
  anotacao_atendimento: string | null;
  origem: string | null;
  paciente: { id: string; nome: string; telefone: string | null; em_tratamento: boolean } | null;
  servico: { id: number; nome: string; area: 'Estética' | 'Odontologia'; duracao_min: number } | null;
}

export function anamneseVazia(): AnamnesisData {
  return {
    skinType: 'Normal',
    fitzpatrick: 'I',
    allergies: [],
    medicationsInUse: [],
    chronicDiseases: [],
    pregnantOrLactating: false,
    priorTreatments: [],
    herpesHistory: false,
    keloidTendency: false,
    smoker: false,
    alcoholFrequency: 'Nunca',
    sunExposure: 'Baixa',
    waterIntakeLitersPerDay: 0,
    mainConcerns: [],
    aestheticGoals: '',
  };
}

function idValido(id: string | undefined): boolean {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function mensagemErro(error: { code?: string; message?: string } | null): string {
  if (!error) return '';
  const msg = error.message || '';
  if (error.code === '23P01' || /conflito|exclusion|overlap/i.test(msg)) {
    return 'Esse horário já está ocupado. Escolha outro.';
  }
  if (/ausente/i.test(msg)) return msg;
  if (/row-level security|permission|42501/i.test(msg) || error.code === '42501') {
    return 'Sem permissão para ver ou gravar isto.';
  }
  if (/foreign key|23503/i.test(msg) || error.code === '23503') {
    return 'Este paciente tem marcações e não pode ser excluído.';
  }
  return msg || 'Não consegui concluir. Tente de novo.';
}

export function servicoParaProcedimento(s: ServicoRow): ProcedureCatalogItem {
  return {
    id: String(s.id),
    name: s.nome,
    category: s.area === 'Estética' ? 'estetica' : 'odontologia',
    area: s.area,
    defaultPrice: 0,
    costPrice: 0,
    durationMinutes: s.duracao_min,
    recommendedRetouchDays: 0,
    description: `${s.area}. Ocupa ${s.duracao_min} min na agenda.`,
    defaultDoseUnit: 'sessao',
    defaultDoseAmount: 1,
    suggestedProducts: [],
  };
}

function pacienteParaApp(row: PacienteRow, dados?: Record<string, unknown> | null): Patient {
  const extra = dados && Object.keys(dados).length > 0 ? dados : null;
  const anamnese = (extra?.anamnesis as AnamnesisData | undefined) || anamneseVazia();
  return {
    id: row.id,
    name: row.nome,
    cpf: (extra?.cpf as string) || '',
    phone: row.telefone || '',
    email: (extra?.email as string) || '',
    birthDate: row.nascimento || '',
    gender: (extra?.gender as Patient['gender']) || 'Feminino',
    address: (extra?.address as string) || '',
    city: (extra?.city as string) || '',
    tag: row.em_tratamento ? 'em_tratamento' : ((extra?.tag as Patient['tag']) || 'novo'),
    createdAt: (row.criado_em || '').slice(0, 10),
    anamnesis: anamnese,
    generalNotes: (extra?.generalNotes as string) || '',
    consentSigned: Boolean(extra?.consentSigned),
    prontuarioPreenchido: !!extra,
  };
}

function marcacaoParaApp(row: MarcacaoRow): Appointment {
  const quando = local(row.inicio);
  const fim = local(row.fim);
  const duracao = Math.max(CLINICA.intervaloMin, minutos(fim.hora) - minutos(quando.hora));
  return {
    id: row.id,
    patientId: row.paciente_id,
    patientName: row.paciente?.nome || 'Paciente',
    patientPhone: row.paciente?.telefone || '',
    professionalId: 'jimena',
    professionalName: CLINICA.nome,
    procedureIds: row.servico_id != null ? [String(row.servico_id)] : [],
    procedureNames: row.servico?.nome ? [row.servico.nome] : [],
    date: quando.data,
    time: quando.hora,
    durationMinutes: row.servico?.duracao_min || duracao,
    status: row.status,
    notes: row.observacao || '',
    anotacaoAtendimento: row.anotacao_atendimento || '',
    totalPrice: 0,
    paymentStatus: 'pendente',
    isBotoxRetouch: false,
  };
}

export async function entrar(email: string, senha: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  if (error) return 'E-mail ou senha incorretos.';
  return null;
}

export async function sair(): Promise<void> {
  await supabase.auth.signOut();
}

export async function equipeDaSessao(): Promise<Equipe | null> {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email?.toLowerCase();
  if (!email) return null;
  const { data: eq, error } = await supabase
    .from('clinica_equipe')
    .select('email,nome,papel')
    .eq('email', email)
    .maybeSingle();
  if (error || !eq) {
    await supabase.auth.signOut();
    return null;
  }
  return eq as Equipe;
}

export async function carregarServicos(): Promise<ProcedureCatalogItem[]> {
  const { data, error } = await supabase
    .from('clinica_servicos')
    .select('id,nome,area,duracao_min,ativo')
    .eq('ativo', true)
    .order('area')
    .order('nome');
  if (error) throw new Error(mensagemErro(error));
  return ((data || []) as ServicoRow[]).map(servicoParaProcedimento);
}

export async function carregarPacientes(comProntuario: boolean): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('clinica_pacientes')
    .select('id,nome,telefone,nascimento,observacoes,em_tratamento,criado_em')
    .order('nome');
  if (error) throw new Error(mensagemErro(error));
  const linhas = (data || []) as PacienteRow[];
  let prontuarios = new Map<string, Record<string, unknown>>();
  if (comProntuario) {
    const { data: pr, error: erroPr } = await supabase.from('clinica_prontuarios').select('paciente_id,dados');
    if (erroPr) throw new Error(mensagemErro(erroPr));
    prontuarios = new Map(
      (pr || []).map((p: { paciente_id: string; dados: Record<string, unknown> }) => [p.paciente_id, p.dados || {}]),
    );
  }
  return linhas.map((row) => pacienteParaApp(row, prontuarios.get(row.id)));
}

export async function carregarMarcacoes(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('clinica_marcacoes')
    .select('id,paciente_id,servico_id,inicio,fim,observacao,status,anotacao_atendimento,origem,paciente:clinica_pacientes(id,nome,telefone,em_tratamento),servico:clinica_servicos(id,nome,area,duracao_min)')
    .order('inicio');
  if (error) throw new Error(mensagemErro(error));
  return ((data || []) as unknown as MarcacaoRow[]).map(marcacaoParaApp);
}

export async function carregarBloqueios(): Promise<Bloqueio[]> {
  const { data, error } = await supabase.from('clinica_bloqueios').select('id,inicio,fim,motivo').order('inicio');
  if (error) throw new Error(mensagemErro(error));
  const lista: Bloqueio[] = [];
  for (const b of (data || []) as { id: string; inicio: string; fim: string; motivo: string | null }[]) {
    const ini = local(b.inicio);
    const fim = local(b.fim);
    let dia = ini.data;
    let voltas = 0;
    while (dia <= fim.data && voltas < 370) {
      const horaInicio = dia === ini.data ? ini.hora : '00:00';
      const horaFim = dia === fim.data ? fim.hora : '24:00';
      if (minutos(horaFim) > minutos(horaInicio)) {
        lista.push({
          id: `${b.id}-${dia}`,
          inicio: b.inicio,
          fim: b.fim,
          motivo: b.motivo,
          data: dia,
          horaInicio,
          horaFim,
        });
      }
      dia = somaDias(dia, 1);
      voltas += 1;
    }
  }
  return lista;
}

export async function carregarMapas(): Promise<Record<string, FaceMapPoint[]>> {
  const { data, error } = await supabase.from('clinica_mapas_faciais').select('paciente_id,pontos');
  if (error) throw new Error(mensagemErro(error));
  const mapas: Record<string, FaceMapPoint[]> = {};
  for (const row of data || []) {
    mapas[row.paciente_id] = Array.isArray(row.pontos) ? row.pontos : [];
  }
  return mapas;
}

export async function salvarMapa(pacienteId: string, pontos: FaceMapPoint[]): Promise<void> {
  const { error } = await supabase
    .from('clinica_mapas_faciais')
    .upsert({ paciente_id: pacienteId, pontos, atualizado_em: new Date().toISOString() });
  if (error) throw new Error(mensagemErro(error));
}

export async function salvarPaciente(pat: Patient): Promise<void> {
  const basico = {
    nome: pat.name.trim(),
    telefone: pat.phone.trim() || null,
    nascimento: pat.birthDate || null,
    em_tratamento: pat.tag === 'em_tratamento',
  };
  let id = pat.id;
  if (idValido(id)) {
    const { error } = await supabase.from('clinica_pacientes').update(basico).eq('id', id);
    if (error) throw new Error(mensagemErro(error));
  } else {
    const { data, error } = await supabase.from('clinica_pacientes').insert(basico).select('id').single();
    if (error) throw new Error(mensagemErro(error));
    id = data.id;
  }
  const dados = {
    cpf: pat.cpf || '',
    email: pat.email || '',
    gender: pat.gender,
    address: pat.address || '',
    city: pat.city || '',
    tag: pat.tag,
    consentSigned: pat.consentSigned,
    generalNotes: pat.generalNotes || '',
    anamnesis: pat.anamnesis,
  };
  const { error: erroPr } = await supabase
    .from('clinica_prontuarios')
    .upsert({ paciente_id: id, dados, atualizado_em: new Date().toISOString() });
  if (erroPr) throw new Error(mensagemErro(erroPr));
}

export async function criarPacienteRapido(nome: string, telefone: string): Promise<Patient> {
  const { data, error } = await supabase
    .from('clinica_pacientes')
    .insert({ nome: nome.trim(), telefone: telefone.trim() || null })
    .select('id,nome,telefone,nascimento,observacoes,em_tratamento,criado_em')
    .single();
  if (error) throw new Error(mensagemErro(error));
  return pacienteParaApp(data as PacienteRow, null);
}

export async function excluirPaciente(id: string): Promise<void> {
  const { error } = await supabase.from('clinica_pacientes').delete().eq('id', id);
  if (error) throw new Error(mensagemErro(error));
}

function statusDoBanco(status: AppointmentStatus): MarcacaoRow['status'] {
  if (status === 'agendado') return 'marcado';
  if (status === 'concluido') return 'atendido';
  if (status === 'em_atendimento' || status === 'retorno_pendente') return 'confirmado';
  if (status === 'atendido' || status === 'faltou' || status === 'cancelado' || status === 'confirmado' || status === 'marcado') {
    return status;
  }
  return 'marcado';
}

export async function salvarMarcacao(apt: Appointment, procedimentos: ProcedureCatalogItem[]): Promise<void> {
  const proc = procedimentos.find((p) => p.id === apt.procedureIds[0]);
  const servicoId = Number(apt.procedureIds[0]);
  if (!proc || !Number.isFinite(servicoId)) throw new Error('Escolha o procedimento.');
  const duracao = proc.durationMinutes;
  const fimMin = minutos(apt.time) + duracao;
  if (fimMin > minutos(CLINICA.fecha)) {
    throw new Error('Esse horário não cabe antes das 18:00.');
  }
  const payload = {
    paciente_id: apt.patientId,
    servico_id: servicoId,
    inicio: instante(apt.date, apt.time),
    fim: instante(apt.date, hhmm(fimMin)),
    observacao: apt.notes?.trim() || null,
    anotacao_atendimento: apt.anotacaoAtendimento?.trim() || null,
    status: statusDoBanco(apt.status),
  };
  if (idValido(apt.id)) {
    const { error } = await supabase.from('clinica_marcacoes').update(payload).eq('id', apt.id);
    if (error) throw new Error(mensagemErro(error));
    return;
  }
  const { error } = await supabase.from('clinica_marcacoes').insert({ ...payload, status: 'marcado' });
  if (error) throw new Error(mensagemErro(error));
}

export async function atualizarStatus(id: string, status: AppointmentStatus): Promise<void> {
  const { error } = await supabase.from('clinica_marcacoes').update({ status: statusDoBanco(status) }).eq('id', id);
  if (error) throw new Error(mensagemErro(error));
}

interface EstoqueRow {
  id: string;
  nome: string;
  marca: string;
  categoria: InventoryItem['category'];
  estoque: number;
  minimo: number;
  unidade: InventoryItem['unit'];
  custo: number | null;
  preco_sugerido: number | null;
  lote: string;
  validade: string | null;
  registro_anvisa: string | null;
}

export async function carregarEstoque(): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from('clinica_estoque').select('*').order('nome');
  if (error) throw new Error(mensagemErro(error));
  return ((data || []) as EstoqueRow[]).map((item) => ({
    id: item.id,
    name: item.nome,
    brand: item.marca,
    category: item.categoria,
    currentStock: item.estoque,
    minStock: item.minimo,
    unit: item.unidade,
    costPerUnit: item.custo ?? 0,
    sellPriceSuggested: item.preco_sugerido ?? 0,
    lotNumber: item.lote,
    expirationDate: item.validade || '',
    anvisaRegistry: item.registro_anvisa || '',
  }));
}

export async function salvarEstoque(item: InventoryItem): Promise<void> {
  const payload = {
    nome: item.name,
    marca: item.brand || '',
    categoria: item.category,
    estoque: item.currentStock,
    minimo: item.minStock,
    unidade: item.unit,
    custo: item.costPerUnit || null,
    preco_sugerido: item.sellPriceSuggested || null,
    lote: item.lotNumber || '',
    validade: item.expirationDate || null,
    registro_anvisa: item.anvisaRegistry || null,
  };
  if (idValido(item.id)) {
    const { error } = await supabase.from('clinica_estoque').update(payload).eq('id', item.id);
    if (error) throw new Error(mensagemErro(error));
    return;
  }
  const { error } = await supabase.from('clinica_estoque').insert(payload);
  if (error) throw new Error(mensagemErro(error));
}

export async function excluirEstoque(id: string): Promise<void> {
  const { error } = await supabase.from('clinica_estoque').delete().eq('id', id);
  if (error) throw new Error(mensagemErro(error));
}

export async function ajustarEstoque(id: string, estoque: number): Promise<void> {
  const { error } = await supabase.from('clinica_estoque').update({ estoque }).eq('id', id);
  if (error) throw new Error(mensagemErro(error));
}

interface FinanceiroRow {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  forma: FinancialTransaction['paymentMethod'];
  status: 'pago' | 'pendente';
  paciente_id: string | null;
}

export async function carregarFinanceiro(pacientes: Patient[]): Promise<FinancialTransaction[]> {
  const { data, error } = await supabase.from('clinica_financeiro').select('*').order('data', { ascending: false });
  if (error) throw new Error(mensagemErro(error));
  return ((data || []) as FinanceiroRow[]).map((tx) => ({
    id: tx.id,
    type: tx.tipo,
    category: tx.categoria,
    description: tx.descricao,
    amount: Number(tx.valor),
    date: tx.data,
    paymentMethod: tx.forma,
    status: tx.status,
    patientId: tx.paciente_id || undefined,
    patientName: pacientes.find((p) => p.id === tx.paciente_id)?.name,
  }));
}

export async function salvarFinanceiro(tx: FinancialTransaction): Promise<void> {
  const { error } = await supabase.from('clinica_financeiro').insert({
    tipo: tx.type,
    categoria: tx.category,
    descricao: tx.description,
    valor: tx.amount,
    data: tx.date,
    forma: tx.paymentMethod,
    status: tx.status,
    paciente_id: tx.patientId && idValido(tx.patientId) ? tx.patientId : null,
  });
  if (error) throw new Error(mensagemErro(error));
}

// ---------- Fotos antes e depois (só a Jimena vê) ----------
export interface FotoPaciente {
  id: string;
  pacienteId: string;
  caminho: string;
  tipo: 'antes' | 'depois';
  angulo: string;
  data: string;
  observacao: string | null;
  url: string;
}

const BUCKET_FOTOS = 'clinica-fotos';

export async function carregarFotos(pacienteId: string): Promise<FotoPaciente[]> {
  const { data, error } = await supabase
    .from('clinica_fotos')
    .select('id,paciente_id,caminho,tipo,angulo,data,observacao')
    .eq('paciente_id', pacienteId)
    .order('data')
    .order('criado_em');
  if (error) throw new Error(mensagemErro(error));
  const linhas = data || [];
  if (!linhas.length) return [];
  const { data: links, error: erroLinks } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrls(linhas.map((l) => l.caminho), 60 * 60);
  if (erroLinks) throw new Error(mensagemErro(erroLinks));
  const porCaminho = new Map((links || []).map((l) => [l.path, l.signedUrl]));
  return linhas.map((l) => ({
    id: l.id,
    pacienteId: l.paciente_id,
    caminho: l.caminho,
    tipo: l.tipo,
    angulo: l.angulo,
    data: l.data,
    observacao: l.observacao,
    url: porCaminho.get(l.caminho) || '',
  }));
}

// Reduz a foto do celular (que pode ter 5 MB ou mais) para no máximo 1600 px, em JPEG.
async function reduzirFoto(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return await new Promise<Blob>((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error('Não consegui preparar a foto.'))), 'image/jpeg', 0.85),
  );
}

export async function enviarFoto(
  pacienteId: string,
  arquivo: File,
  dados: { tipo: 'antes' | 'depois'; angulo: string; data: string; observacao: string },
): Promise<void> {
  const blob = await reduzirFoto(arquivo);
  const caminho = `${pacienteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error(mensagemErro(error));
  const { error: erroLinha } = await supabase.from('clinica_fotos').insert({
    paciente_id: pacienteId,
    caminho,
    tipo: dados.tipo,
    angulo: dados.angulo,
    data: dados.data,
    observacao: dados.observacao.trim() || null,
  });
  if (erroLinha) {
    await supabase.storage.from(BUCKET_FOTOS).remove([caminho]);
    throw new Error(mensagemErro(erroLinha));
  }
}

export async function apagarFoto(foto: FotoPaciente): Promise<void> {
  const { error } = await supabase.from('clinica_fotos').delete().eq('id', foto.id);
  if (error) throw new Error(mensagemErro(error));
  await supabase.storage.from(BUCKET_FOTOS).remove([foto.caminho]);
}

// ---------- Foto do paciente no mapa facial (ajustada sobre os pontos) ----------
export interface AjusteFoto {
  x: number;    // deslocamento horizontal, em % da largura do quadro
  y: number;    // deslocamento vertical, em % da altura do quadro
  zoom: number; // 1 = tamanho original
  giro: number; // graus
  /** Molde elástico: posição de cada alça (olhos, nariz, boca…) na foto, no espaço 400x533 */
  molde?: Record<string, [number, number]>;
}
export const AJUSTE_PADRAO: AjusteFoto = { x: 0, y: 0, zoom: 1, giro: 0 };

export async function carregarFotoMapa(pacienteId: string): Promise<{ url: string; caminho: string; ajuste: AjusteFoto } | null> {
  const { data, error } = await supabase
    .from('clinica_mapas_faciais')
    .select('foto_caminho,foto_ajuste')
    .eq('paciente_id', pacienteId)
    .maybeSingle();
  if (error) throw new Error(mensagemErro(error));
  if (!data?.foto_caminho) return null;
  const { data: link, error: erroLink } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrl(data.foto_caminho, 60 * 60);
  if (erroLink) throw new Error(mensagemErro(erroLink));
  return { url: link.signedUrl, caminho: data.foto_caminho, ajuste: { ...AJUSTE_PADRAO, ...(data.foto_ajuste || {}) } };
}

export async function enviarFotoMapa(pacienteId: string, arquivo: File, caminhoAntigo: string | null): Promise<{ url: string; caminho: string }> {
  const blob = await reduzirFoto(arquivo);
  const caminho = `${pacienteId}/mapa-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error(mensagemErro(error));
  const { error: erroLinha } = await supabase
    .from('clinica_mapas_faciais')
    .upsert({ paciente_id: pacienteId, foto_caminho: caminho, foto_ajuste: AJUSTE_PADRAO, atualizado_em: new Date().toISOString() });
  if (erroLinha) {
    await supabase.storage.from(BUCKET_FOTOS).remove([caminho]);
    throw new Error(mensagemErro(erroLinha));
  }
  if (caminhoAntigo) await supabase.storage.from(BUCKET_FOTOS).remove([caminhoAntigo]);
  const { data: link } = await supabase.storage.from(BUCKET_FOTOS).createSignedUrl(caminho, 60 * 60);
  return { url: link?.signedUrl || URL.createObjectURL(blob), caminho };
}

export async function salvarAjusteFotoMapa(pacienteId: string, ajuste: AjusteFoto): Promise<void> {
  const { error } = await supabase
    .from('clinica_mapas_faciais')
    .update({ foto_ajuste: ajuste, atualizado_em: new Date().toISOString() })
    .eq('paciente_id', pacienteId);
  if (error) throw new Error(mensagemErro(error));
}

export async function removerFotoMapa(pacienteId: string, caminho: string): Promise<void> {
  const { error } = await supabase
    .from('clinica_mapas_faciais')
    .update({ foto_caminho: null, foto_ajuste: AJUSTE_PADRAO, atualizado_em: new Date().toISOString() })
    .eq('paciente_id', pacienteId);
  if (error) throw new Error(mensagemErro(error));
  await supabase.storage.from(BUCKET_FOTOS).remove([caminho]);
}
