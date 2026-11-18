import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/plus-jakarta-sans/latin-300.css';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import './index.css';
import { VERSAO } from './lib/config';

function Versao() {
  return (
    <div
      style={{
        position: 'fixed', right: 8, bottom: 8, zIndex: 9999, pointerEvents: 'none',
        color: 'rgba(92,64,51,.45)', fontSize: 10, fontWeight: 500, letterSpacing: '.18em',
        textTransform: 'uppercase', padding: '4px 10px',
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
