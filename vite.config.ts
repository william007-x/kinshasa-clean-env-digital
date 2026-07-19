import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true, // Permet d'écouter correctement sur localhost
    hmr: {
      clientPort: 5173, // Aligne de force le WebSocket sur le bon port
    },
  },
});