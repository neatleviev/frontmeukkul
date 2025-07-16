import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'; // Importa o plugin do Vue
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), // Usa o plugin do Vue para processar arquivos .vue
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});