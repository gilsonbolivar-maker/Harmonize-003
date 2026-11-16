import React, { useState } from 'react';
import { CLINICA, CORES } from '../lib/config';
import { entrar } from '../lib/clinicaApi';

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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: CORES.creme, color: CORES.cafe }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 mx-auto rounded-full text-white flex items-center justify-center text-xl font-semibold"
            style={{ background: CORES.musgo }}
          >
            JA
          </div>
          <h1 className="font-serif text-3xl mt-3" style={{ color: CORES.cafe }}>
            {CLINICA.nome}
          </h1>
          <p className="text-sm mt-1" style={{ color: CORES.oliva }}>
            {CLINICA.subtitulo}
          </p>
        </div>

        <form
          onSubmit={enviar}
          className="rounded-3xl p-6 space-y-3 border"
          style={{ background: '#fff', borderColor: CORES.areia }}
        >
          <p className="text-sm font-medium" style={{ color: CORES.cafe }}>
            Entrada da equipe
          </p>
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: CORES.areia, background: CORES.creme }}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: CORES.areia, background: CORES.creme }}
          />
          {erro && (
            <p className="text-sm" style={{ color: CORES.terracota }}>
              {erro}
            </p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 rounded-2xl text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: CORES.musgo }}
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
          <p className="text-xs text-center" style={{ color: CORES.oliva }}>
            Jimena entra na clínica inteira. A secretária entra só na agenda.
          </p>
        </form>
      </div>
    </div>
  );
};
