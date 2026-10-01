import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api/* is forwarded to the Express backend, so no CORS trouble in development
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5005' }
  }
});
