import React, { useState } from 'react';
import { CLINICA, CORES } from '../lib/config';
import { entrar } from '../lib/clinicaApi';

// Tela de entrada — linha "premium":
// linhas finas douradas, muito respiro, serifa grande e campos só com sublinhado.
const OURO = '#B8935A';
const LINHA = 'rgba(184,147,90,.45)';

export const Entrar: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const msg = await entrar(email, senha);
    setEnviando(false);
    if (msg) setErro(msg);
  };

  const [primeiro, ...resto] = CLINICA.nome.split(' ');

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-10 py-14"
      style={{
        color: CORES.cafe,
        background: `radial-gradient(120% 70% at 50% 0%, #FBF7F0 0%, ${CORES.creme} 55%, #EFE5D6 100%)`,
      }}
    >
      {/* Moldura fina em volta da tela */}
      <div aria-hidden className="pointer-events-none absolute inset-4 rounded-[28px]" style={{ border: `0.5px solid ${LINHA}` }} />
      <div aria-hidden className="pointer-events-none absolute inset-[22px] rounded-[24px]" style={{ border: `0.5px solid rgba(184,147,90,.18)` }} />

      {/* Arcos finos ao fundo */}
      <svg aria-hidden className="pointer-events-none absolute -top-[380px] left-1/2 -translate-x-1/2" width="760" height="760" viewBox="0 0 760 760" fill="none">
        <circle cx="380" cy="380" r="300" stroke={OURO} strokeOpacity=".22" strokeWidth=".6" />
        <circle cx="380" cy="380" r="340" stroke={OURO} strokeOpacity=".14" strokeWidth=".6" />
        <circle cx="380" cy="380" r="378" stroke={OURO} strokeOpacity=".08" strokeWidth=".6" />
      </svg>

      <div className="relative w-full max-w-sm">
        {/* Monograma */}
        <div className="flex justify-center">
          <div className="relative w-[92px] h-[92px] flex items-center justify-center">
            <span className="absolute inset-0 rounded-full" style={{ border: `0.75px solid ${OURO}` }} />
            <span className="absolute inset-[6px] rounded-full" style={{ border: `0.5px solid ${LINHA}` }} />
            <span className="font-serif italic text-[34px] leading-none" style={{ color: CORES.musgo, fontWeight: 500 }}>
              J<span style={{ color: OURO }}>A</span>
            </span>
          </div>
        </div>

        {/* Nome */}
        <div className="text-center mt-8">
          <h1 className="font-serif leading-[0.95] text-[46px]" style={{ color: CORES.cafe, fontWeight: 500 }}>
            {primeiro}
            <span className="block italic" style={{ color: CORES.musgo, fontWeight: 400 }}>{resto.join(' ')}</span>
          </h1>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${OURO})` }} />
            <span className="block w-[5px] h-[5px] rotate-45" style={{ border: `0.75px solid ${OURO}` }} />
            <span className="h-px w-10" style={{ background: `linear-gradient(270deg, transparent, ${OURO})` }} />
          </div>

          <p className="mt-4 text-[10.5px] uppercase tracking-[0.38em]" style={{ color: CORES.oliva, fontWeight: 500 }}>
            {CLINICA.subtitulo}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={enviar} className="mt-12 space-y-8">
          <p className="text-center font-serif italic text-[19px]" style={{ color: CORES.cafe }}>
            Entrada da equipe
          </p>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.28em]" style={{ color: OURO, fontWeight: 600 }}>E-mail</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full bg-transparent pb-2.5 text-[15px] outline-none transition-colors"
              style={{ borderBottom: `0.75px solid ${LINHA}`, color: CORES.cafe }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = CORES.musgo)}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = LINHA)}
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.28em]" style={{ color: OURO, fontWeight: 600 }}>Senha</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-2 w-full bg-transparent pb-2.5 text-[15px] outline-none transition-colors"
              style={{ borderBottom: `0.75px solid ${LINHA}`, color: CORES.cafe }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = CORES.musgo)}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = LINHA)}
            />
          </label>

          {erro && (
            <p className="text-sm text-center" style={{ color: CORES.terracota }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="group relative w-full py-4 rounded-full text-[11px] uppercase tracking-[0.34em] text-white disabled:opacity-60 transition-transform active:scale-[0.99]"
            style={{
              fontWeight: 600,
              background: `linear-gradient(180deg, #56693F 0%, ${CORES.musgo} 100%)`,
              boxShadow: '0 1px 0 rgba(255,255,255,.18) inset, 0 14px 30px -14px rgba(74,93,58,.55)',
            }}
          >
            <span className="absolute inset-[3px] rounded-full pointer-events-none" style={{ border: '0.5px solid rgba(232,216,195,.45)' }} />
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="text-[12px] text-center leading-relaxed" style={{ color: CORES.oliva }}>
            Jimena entra na clínica inteira.
            <br />
            A secretária entra só na agenda.
          </p>
        </form>
      </div>
    </div>
  );
};
