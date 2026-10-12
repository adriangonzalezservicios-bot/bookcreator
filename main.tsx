import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Installable PWA shell. Manuscript data remains in browser storage; the service worker never caches API responses.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('No se pudo registrar el modo instalable:', error)); });
}
