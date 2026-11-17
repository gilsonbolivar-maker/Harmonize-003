import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { VERSAO } from './lib/config';

function Versao() {
  return (
    <div
      style={{
        position: 'fixed', right: 8, bottom: 8, zIndex: 9999, pointerEvents: 'none',
        background: 'rgba(42,38,34,.82)', color: '#fff', fontSize: 12.5, fontWeight: 700,
        padding: '4px 10px', borderRadius: 20,
      }}
    >
      Versão {VERSAO}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Versao />
  </StrictMode>,
);
