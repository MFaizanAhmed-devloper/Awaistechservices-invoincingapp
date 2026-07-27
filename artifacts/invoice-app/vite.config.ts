import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Yeh line aapki website ke saare CSS aur JS bundles ko aapke exact subfolder ke sath bind kar degi
  base: '/Awaistechservices-invoincingapp/', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
