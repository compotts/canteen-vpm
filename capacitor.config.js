import { defineConfig } from '@capacitor/cli';

export default defineConfig({
  appId: 'lt.vpm.valgykla',
  appName: 'VPM Valgykla',
  webDir: 'dist',
  server: {
    url: "https://canteen-vpm.vercel.app",
    androidScheme: 'https',
  },
});
