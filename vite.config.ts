import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: '/Expense-Tracker/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'root-favicon-proxy',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url === '/favicon.ico' || req.url === '/favicon.png' || req.url === '/icon-192.png') {
              req.url = `/Expense-Tracker${req.url}`;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
