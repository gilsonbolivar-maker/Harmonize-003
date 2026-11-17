// Versão do app: aparece no canto inferior direito de todas as telas.
// Suba o número a cada entrega, para saber qual versão o celular está mostrando.
export const VERSAO = '1.1.0';

// Mesmos dados públicos do ClinicaMarcacao (config.js).
// A chave é publicável: quem protege os dados são as regras de acesso do banco.
export const CLINICA = {
  nome: 'Jimena Andrade',
  subtitulo: 'Harmonização Orofacial',
  registro: '',
  whatsapp: '77998000177',
  endereco: 'Avenida Santana, 328',
  cidade: 'Caetité — BA',
  instagram: 'jimennandrade',
  supabaseUrl: 'https://meprwchojnjtoottbqry.supabase.co',
  supabaseChave: 'sb_publishable_04yVgvpeZRCqHk7XimGl5A_hLnmoWxs',
  abre: '08:00',
  fecha: '18:00',
  intervaloMin: 30,
  diasAtendimento: [1, 2, 3, 4, 5, 6] as number[],
  fuso: '-03:00',
};

// Assistente de IA (menu Pós-cuidado, tela de protocolos e auditoria da anamnese).
// Fica false porque no GitHub Pages o servidor da IA não está no ar.
// Para religar: mude para true e publique de novo. O código permanece em
// src/components/AiAssistantModule.tsx, src/App.tsx e src/components/PatientsModule.tsx.
export const IA_ATIVA = false;

export const CORES = {
  creme: '#F5EFE6',
  areia: '#E8D8C3',
  terracota: '#C1663F',
  argila: '#A0522D',
  caramelo: '#C68E4E',
  oliva: '#6B7B4B',
  musgo: '#4A5D3A',
  cafe: '#5C4033',
};
