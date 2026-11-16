import { CLINICA } from './config';

const pad = (n: number) => String(n).padStart(2, '0');

/** Data de hoje no fuso da Bahia (UTC−3), no formato AAAA-MM-DD. */
export function hojeISO(): string {
  const deslocamento = parseInt(CLINICA.fuso, 10) * 3600e3;
  const d = new Date(Date.now() + deslocamento);
  return d.toISOString().slice(0, 10);
}

export function somaDias(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diaSemana(iso: string): number {
  return new Date(iso + 'T12:00:00Z').getUTCDay();
}

const NOMES_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const NOMES_MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const NOMES_MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function dataBonita(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const rel = iso === hojeISO() ? 'Hoje, ' : iso === somaDias(hojeISO(), 1) ? 'Amanhã, ' : '';
  const anoTxt = ano !== Number(hojeISO().slice(0, 4)) ? ` de ${ano}` : '';
  return `${rel}${NOMES_DIA[diaSemana(iso)]}, ${dia} de ${NOMES_MES[mes - 1]}${anoTxt}`;
}

export function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function nomeMes(ano: number, mes: number): string {
  const nome = NOMES_MES[mes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} ${ano}`;
}

export function mesCurto(mes: number): string {
  return NOMES_MES_CURTO[mes - 1];
}

export function instante(iso: string, hhmm: string): string {
  return `${iso}T${hhmm}:00${CLINICA.fuso}`;
}

export function local(ts: string): { data: string; hora: string } {
  const deslocamento = parseInt(CLINICA.fuso, 10) * 3600e3;
  const d = new Date(new Date(ts).getTime() + deslocamento);
  return { data: d.toISOString().slice(0, 10), hora: d.toISOString().slice(11, 16) };
}

export function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function hhmm(min: number): string {
  const normalizado = ((min % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${pad(Math.floor(normalizado / 60))}:${pad(normalizado % 60)}`;
}

export function diaAtende(iso: string): boolean {
  return CLINICA.diasAtendimento.includes(diaSemana(iso));
}

/** Grade do mês, começando no domingo. Cada célula é AAAA-MM-DD ou null. */
export function gradeDoMes(ano: number, mes: number): (string | null)[] {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const inicio = primeiro.getUTCDay();
  const total = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const celulas: (string | null)[] = [];
  for (let i = 0; i < inicio; i++) celulas.push(null);
  for (let dia = 1; dia <= total; dia++) {
    celulas.push(`${ano}-${pad(mes)}-${pad(dia)}`);
  }
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

export function partesDaData(iso: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return { ano, mes, dia };
}
