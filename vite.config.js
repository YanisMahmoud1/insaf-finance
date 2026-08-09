import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/insaf-finance/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        contenu: resolve(__dirname, 'contenu.html'),
        outils: resolve(__dirname, 'outils.html'),
        contact: resolve(__dirname, 'contact.html')
      }
    }
  }
});
