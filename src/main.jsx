import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n.js';
import App from './App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

if (import.meta.env.DEV && import.meta.env.VITE_MSW !== 'false') {
  import('./mocks/browser.js').then(({ worker }) => {
    worker.start({ serviceWorker: { url: '/mockServiceWorker.js' }, onUnhandledRequest: 'bypass', quiet: true }).catch((e) => console.warn('MSW', e));
  });
}
