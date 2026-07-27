import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Pulls all environment variables out of the current process context
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    // Automatically uses the repository base path if provided, otherwise falls back to root
    base: env.BASE_PATH || '/', 
  };
});
