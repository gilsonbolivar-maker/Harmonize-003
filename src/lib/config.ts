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
