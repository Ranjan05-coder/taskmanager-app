import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Explicitly expose VITE_API_URL so it is available as import.meta.env.VITE_API_URL
  // in the built bundle. Vite already handles VITE_* prefixed variables automatically,
  // but listing it here makes the intent explicit and ensures it is picked up from
  // the Railway build environment.
  envPrefix: 'VITE_',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
