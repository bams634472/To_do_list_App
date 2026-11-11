import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pwaRegisterShim = {
  name: 'local-pwa-register-shim',
  resolveId(id) {
    return id === 'virtual:pwa-register' ? '\0virtual:pwa-register' : null;
  },
  load(id) {
    return id === '\0virtual:pwa-register'
      ? 'export function registerSW() { return () => {}; }'
      : null;
  },
};

export default defineConfig({
  plugins: [react(), pwaRegisterShim],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
