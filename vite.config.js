import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5610,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5611',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5610,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5611',
        changeOrigin: true,
      },
    },
  },
});
