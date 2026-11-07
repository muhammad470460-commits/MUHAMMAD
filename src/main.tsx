import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Immediate global capture of PWA beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__deferredPWAInstallPrompt = e as any;
    console.log('[PWA] Global beforeinstallprompt captured');
  });

  window.addEventListener('appinstalled', () => {
    window.__deferredPWAInstallPrompt = null;
    window.__pwaIsInstalled = true;
    try {
      localStorage.setItem('nbv_pwa_installed', 'true');
    } catch {
      // Ignore
    }
    console.log('[PWA] Global appinstalled confirmed');
  });

  // Register PWA Service Worker for Chrome/Android installability
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] Service worker registered successfully with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
