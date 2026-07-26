import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import devServer from '@hono/vite-dev-server';
import { mockDb } from './src/api/mock-db';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      devServer({
        entry: 'src/api/index.ts',
        injectClientScript: false,
        adapter: {
          env: {
            DB: mockDb
          }
        }
      })
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
