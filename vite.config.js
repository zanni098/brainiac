import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'gui/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './gui/index.html'
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
});