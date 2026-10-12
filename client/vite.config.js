import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load .env variables for this mode (development / production / etc.)
  // The third argument '' means load ALL variables, not just VITE_ prefixed ones
  const env = loadEnv(mode, process.cwd(), '');

  const port = parseInt(env.VITE_PORT, 10) || 5173;
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://localhost:8000';

  return {
    plugins: [react()],
    server: {
      port,
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});
