import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // veya '0.0.0.0'
    port: 5173,
    strictPort: true,
    // AI istekleri: npm run dev:api ile açılan yerel proxy'ye gider
    proxy: { '/api': 'http://localhost:3001' },
  },
  
});