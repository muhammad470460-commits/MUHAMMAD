import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
    __pwaIsInstalled?: boolean;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt) {
      return window.__deferredPWAInstallPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.__pwaIsInstalled === true;
    return isStandalone;
  });

  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed' | 'dismissed'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const android = /android/.test(ua);
    const ios = /iphone|ipad|ipod/.test(ua);
    const chrome = /chrome|crios/.test(ua) && !/edge|opr\//.test(ua);

    setIsAndroid(android);
    setIsIOS(ios);
    setIsChrome(chrome);

    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://') ||
        window.__pwaIsInstalled === true;
      setIsInstalled(standalone);
    };

    checkStandalone();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt captured and ready');
    };

    const handleAppInstalled = () => {
      window.__deferredPWAInstallPrompt = null;
      window.__pwaIsInstalled = true;
      setDeferredPrompt(null);
      setIsInstalled(true);
      setInstallStatus('installed');
      try {
        localStorage.setItem('nbv_pwa_installed', 'true');
      } catch {
        // Ignore localStorage errors
      }
      console.log('[PWA] App successfully installed on device!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // If prompt was already captured prior to hook mount
    if (window.__deferredPWAInstallPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<{
    success: boolean;
    outcome?: 'accepted' | 'dismissed' | 'already_installed' | 'manual_required';
  }> => {
    if (isInstalled) {
      setInstallStatus('installed');
      return { success: true, outcome: 'already_installed' };
    }

    const promptEvent = deferredPrompt || window.__deferredPWAInstallPrompt;

    if (promptEvent) {
      try {
        setInstallStatus('installing');
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          window.__deferredPWAInstallPrompt = null;
          setInstallStatus('installed');
          try {
            localStorage.setItem('nbv_pwa_installed', 'true');
          } catch {
            // Ignore
          }
          return { success: true, outcome: 'accepted' };
        } else {
          setInstallStatus('dismissed');
          return { success: false, outcome: 'dismissed' };
        }
      } catch (err) {
        console.warn('[PWA] prompt() failed, opening guide:', err);
        setShowInstallGuide(true);
        return { success: false, outcome: 'manual_required' };
      }
    }

    // If Chrome has not fired beforeinstallprompt yet or on iOS
    setShowInstallGuide(true);
    return { success: false, outcome: 'manual_required' };
  }, [deferredPrompt, isInstalled]);

  return {
    isInstallable: Boolean(deferredPrompt || window.__deferredPWAInstallPrompt),
    isInstalled,
    isAndroid,
    isIOS,
    isChrome,
    showInstallGuide,
    setShowInstallGuide,
    installStatus,
    triggerInstall,
  };
}
