import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PromptInstallResult {
  status: 'accepted' | 'dismissed' | 'ios' | 'manual' | 'installed';
  message: string;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect if app is already running in standalone (installed) mode
    const checkIsStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      return isStandaloneMedia || isIOSStandalone;
    };

    setIsInstalled(checkIsStandalone());

    // 2. Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // 3. Capture beforeinstallprompt event for Android & Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Direct 1-click install without tutorials
  const promptInstall = useCallback(async (): Promise<PromptInstallResult> => {
    if (isInstalled) {
      return {
        status: 'installed',
        message: '✓ Aplikasi STZStok sudah terpasang di perangkat ini!',
      };
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return {
            status: 'accepted',
            message: '✓ Berhasil! Aplikasi STZStok telah ditambahkan ke layar utama.',
          };
        }
        return {
          status: 'dismissed',
          message: 'Pemasangan aplikasi dibatalkan.',
        };
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
    }

    if (isIOS) {
      return {
        status: 'ios',
        message: 'Di iPhone: Ketuk tombol Bagikan [ ⎋ ] di bawah Safari, lalu pilih "Tambah ke Layar Utama".',
      };
    }

    return {
      status: 'manual',
      message: 'Ketuk menu titik tiga (⋮) di browser Anda lalu pilih "Instal Aplikasi" / "Tambahkan ke Layar Utama".',
    };
  }, [deferredPrompt, isInstalled, isIOS]);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    if (!deferredPrompt) {
      return 'unsupported';
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
      return 'unsupported';
    }
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
    install,
    deferredPrompt,
  };
}
