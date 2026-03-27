import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ["ADMIN_"],
    base: './',
    server: {
      proxy: {
        '/valgykla': {
          target: "https://valgykla.vpm.lt",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/valgykla/, ''),
        },
      },
    },
  };
});
