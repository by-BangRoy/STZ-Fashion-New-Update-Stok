/**
 * Device & User-Agent Parser for STZ Stok Multi-Device Realtime Sync
 */

export interface ParsedDeviceInfo {
  deviceCategory: 'Smartphone (HP)' | 'Tablet' | 'Komputer / Laptop' | 'Perangkat Lain';
  deviceModel: string;
  os: string;
  browser: string;
  screenResolution: string;
  isMobile: boolean;
}

export function parseDeviceUserAgent(uaString?: string, screenWidth?: number, screenHeight?: number): ParsedDeviceInfo {
  const ua = uaString || (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  
  // 1. Detect Screen Resolution
  let screenResolution = 'Resolusi Normal';
  if (screenWidth && screenHeight) {
    screenResolution = `${screenWidth} × ${screenHeight} px`;
  } else if (typeof window !== 'undefined' && window.screen) {
    screenResolution = `${window.screen.width} × ${window.screen.height} px`;
  }

  // 2. Detect Operating System
  let os = 'Sistem Operasi Lain';
  if (/iphone os ([\d_]+)/i.test(ua)) {
    const v = ua.match(/iphone os ([\d_]+)/i)?.[1]?.replace(/_/g, '.') || '';
    os = `iOS ${v}`.trim();
  } else if (/ipad; cpu os ([\d_]+)/i.test(ua)) {
    const v = ua.match(/ipad; cpu os ([\d_]+)/i)?.[1]?.replace(/_/g, '.') || '';
    os = `iPadOS ${v}`.trim();
  } else if (/android ([\d.]+)/i.test(ua)) {
    const v = ua.match(/android ([\d.]+)/i)?.[1] || '';
    os = `Android ${v}`.trim();
  } else if (/windows nt 10\.0/i.test(ua)) {
    os = 'Windows 11 / 10';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/mac os x ([\d_]+)/i.test(ua)) {
    const v = ua.match(/mac os x ([\d_]+)/i)?.[1]?.replace(/_/g, '.') || '';
    os = `macOS ${v}`.trim();
  } else if (/cros/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux OS';
  }

  // 3. Detect Browser
  let browser = 'Browser Web';
  if (/samsungbrowser\/([\d.]+)/i.test(ua)) {
    const v = ua.match(/samsungbrowser\/([\d.]+)/i)?.[1]?.split('.')[0] || '';
    browser = `Samsung Internet ${v}`.trim();
  } else if (/edg\/([\d.]+)/i.test(ua)) {
    const v = ua.match(/edg\/([\d.]+)/i)?.[1]?.split('.')[0] || '';
    browser = `Microsoft Edge ${v}`.trim();
  } else if (/chrome\/([\d.]+)/i.test(ua) && !/edg\//i.test(ua)) {
    const v = ua.match(/chrome\/([\d.]+)/i)?.[1]?.split('.')[0] || '';
    browser = `Chrome v${v}`.trim();
  } else if (/firefox\/([\d.]+)/i.test(ua)) {
    const v = ua.match(/firefox\/([\d.]+)/i)?.[1]?.split('.')[0] || '';
    browser = `Firefox v${v}`.trim();
  } else if (/version\/([\d.]+).*safari/i.test(ua)) {
    const v = ua.match(/version\/([\d.]+)/i)?.[1]?.split('.')[0] || '';
    browser = `Safari v${v}`.trim();
  }

  // 4. Detect Specific Hardware / Model
  let deviceModel = 'Perangkat Standar';
  let isMobile = false;
  let deviceCategory: ParsedDeviceInfo['deviceCategory'] = 'Perangkat Lain';

  if (/iphone/i.test(ua)) {
    deviceCategory = 'Smartphone (HP)';
    deviceModel = 'Apple iPhone';
    isMobile = true;
  } else if (/ipad/i.test(ua)) {
    deviceCategory = 'Tablet';
    deviceModel = 'Apple iPad';
    isMobile = true;
  } else if (/android/i.test(ua)) {
    isMobile = true;
    if (/tablet|sm-t|gt-p/i.test(ua)) {
      deviceCategory = 'Tablet';
      deviceModel = 'Android Tablet';
    } else {
      deviceCategory = 'Smartphone (HP)';
      if (/sm-[a-z0-9]+/i.test(ua)) {
        const m = ua.match(/sm-([a-z0-9]+)/i)?.[0]?.toUpperCase();
        deviceModel = `Samsung Galaxy (${m})`;
      } else if (/redmi|xiaomi/i.test(ua)) {
        deviceModel = 'Xiaomi / Redmi';
      } else if (/poco/i.test(ua)) {
        deviceModel = 'Xiaomi POCO';
      } else if (/cph|oppo/i.test(ua)) {
        deviceModel = 'OPPO Smartphone';
      } else if (/vivo|v2[0-9]+/i.test(ua)) {
        deviceModel = 'Vivo Smartphone';
      } else if (/infinix/i.test(ua)) {
        deviceModel = 'Infinix Smartphone';
      } else if (/realme/i.test(ua)) {
        deviceModel = 'Realme Smartphone';
      } else {
        deviceModel = 'Smartphone Android';
      }
    }
  } else if (/macintosh|mac os x/i.test(ua)) {
    deviceCategory = 'Komputer / Laptop';
    deviceModel = 'Apple Mac / MacBook';
  } else if (/windows/i.test(ua)) {
    deviceCategory = 'Komputer / Laptop';
    deviceModel = 'PC Desktop / Laptop Windows';
  } else if (/linux/i.test(ua)) {
    deviceCategory = 'Komputer / Laptop';
    deviceModel = 'Komputer Linux';
  }

  // Responsive fallback adjustment for screen size
  if (typeof window !== 'undefined' && window.innerWidth) {
    if (window.innerWidth < 640 && deviceCategory === 'Komputer / Laptop') {
      deviceCategory = 'Smartphone (HP)';
    } else if (window.innerWidth >= 640 && window.innerWidth <= 1024 && isMobile) {
      deviceCategory = 'Tablet';
    }
  }

  return {
    deviceCategory,
    deviceModel,
    os,
    browser,
    screenResolution,
    isMobile,
  };
}

/**
 * Clean & Format IP Address display
 */
export function formatIpAddress(rawIp?: string): string {
  if (!rawIp) return 'Tidak terdeteksi';
  let ip = rawIp.trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  if (ip === '::1' || ip === '127.0.0.1') {
    return '127.0.0.1 (Localhost / Internal)';
  }
  return ip;
}
