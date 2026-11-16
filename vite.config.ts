import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

const paginas = process.env.GITHUB_PAGES === 'true';
const base = paginas ? '/Harmonize-003/' : '/';

export default defineConfig(() => {
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['face-feminina.jpg', 'icone-192.png', 'icone-512.png'],
        manifest: {
          name: 'Jimena Andrade — Harmonização Orofacial',
          short_name: 'Jimena',
          description: 'Agenda da clínica de harmonização orofacial da Jimena Andrade.',
          lang: 'pt-BR',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#F5EFE6',
          theme_color: '#4A5D3A',
          icons: [
            { src: 'icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp,woff2}'],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
