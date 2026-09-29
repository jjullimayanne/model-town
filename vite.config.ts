import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base: the same build works at the domain root and under a GitHub Pages subpath (/repo-name/).
  base: './',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 3000 },
});
