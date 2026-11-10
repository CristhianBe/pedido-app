import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'pedidos-app',
  webDir: 'dist',
  plugins: {
    // fetch pasa por HTTP nativo: evita bloqueos de CORS del WebView
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
