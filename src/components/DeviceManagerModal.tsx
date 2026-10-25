import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  Smartphone, 
  Laptop, 
  Tablet,
  Copy, 
  Check, 
  X, 
  Radio, 
  User, 
  ShieldCheck,
  RefreshCw,
  QrCode,
  Lock,
  Users,
  Clock,
  Globe,
  Sparkles,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Share2,
  Camera,
  CheckCircle2,
  Download,
  Zap,
  Link2,
  Wifi,
  Monitor,
  Cpu
} from 'lucide-react';
import { DeviceInfo } from '../types/inventory.ts';
import { parseDeviceUserAgent, formatIpAddress } from '../utils/deviceParser.ts';

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'devices' | 'connect' | 'identity';
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'devices'
}) => {
  const { 
    connectedDevicesCount, 
    connectedDevices, 
    connectionStatus, 
    currentDevice, 
    updateDeviceProfile,
    settings
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'devices' | 'connect' | 'identity'>(initialTab);
  const [deviceName, setDeviceName] = useState(currentDevice.deviceName);
  const [operatorName, setOperatorName] = useState(currentDevice.operatorName);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [localDevices, setLocalDevices] = useState<DeviceInfo[]>([]);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');

  // Keep device name and operator name in sync with current device profile
  useEffect(() => {
    setDeviceName(currentDevice.deviceName);
    setOperatorName(currentDevice.operatorName);
  }, [currentDevice]);

  // Synchronize local view whenever WebSocket brings new connected devices
  useEffect(() => {
    if (connectedDevices && connectedDevices.length > 0) {
      setLocalDevices(connectedDevices);
      setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
    }
  }, [connectedDevices]);

  // Lock body scroll & poll real-time updates while modal is open
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      fetchDevicesList();

      // Real-time automatic polling every 3.5 seconds while open
      const interval = setInterval(() => {
        fetchDevicesList(true);
      }, 3500);

      return () => {
        document.body.style.overflow = originalStyle;
        clearInterval(interval);
      };
    }
  }, [isOpen, initialTab]);

  const fetchDevicesList = async (isBackground = false) => {
    if (!isBackground) setIsRefreshingDevices(true);
    try {
      const res = await fetch('/api/devices');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.devices && Array.isArray(data.devices)) {
          setLocalDevices(data.devices);
        }
      }
      setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
    } catch (e) {
      console.warn('Failed to fetch devices list:', e);
    } finally {
      if (!isBackground) {
        setTimeout(() => setIsRefreshingDevices(false), 300);
      }
    }
  };

  const handleCopyIp = (ipToCopy: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(ipToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = ipToCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Failed to copy IP:', err);
    }
    setCopiedIp(ipToCopy);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Determine URLs for multi-device access
  const getPublicShareUrl = (): string => {
    if (typeof window === 'undefined') return 'https://stz-fashion-stok.ai.studio';
    try {
      const origin = window.location.origin;
      const pathname = window.location.pathname || '/';
      // In Google Cloud Run / AI Studio, ais-dev-* requires developer Google account auth (causes 403 for other devices).
      // ais-pre-* is the publicly shared preview URL designed for all devices.
      if (origin && origin.includes('ais-dev-')) {
        return `${origin.replace('ais-dev-', 'ais-pre-')}${pathname}`;
      }
      return `${origin}${pathname}`;
    } catch {
      return window.location.href;
    }
  };

  const getDirectDevUrl = (): string => {
    if (typeof window === 'undefined') return '';
    try {
      return `${window.location.origin}${window.location.pathname || '/'}`;
    } catch {
      return window.location.href;
    }
  };

  const publicUrl = getPublicShareUrl();
  const devUrl = getDirectDevUrl();

  // Active URL automatically uses public preview URL (or direct dev fallback) to avoid 403 Google Auth errors
  const activeUrl = useMemo(() => {
    return publicUrl || devUrl;
  }, [publicUrl, devUrl]);

  // Generate QR Code locally via client-side SVG/Canvas data URL (0 external API calls -> NEVER 403)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsGeneratingQr(true);
    QRCode.toDataURL(activeUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        if (isMounted) {
          setQrCodeDataUrl(dataUrl);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.warn('Local QR Code generation error:', err);
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeUrl, isOpen]);

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `stz-barcode-koneksi-hp-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceName.trim() && operatorName.trim()) {
      updateDeviceProfile(deviceName.trim(), operatorName.trim());
      setIsSaved(true);
      fetchDevicesList();
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(activeUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = activeUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const store = settings.profile.storeName || 'STZ Stok';
    const text = `Halo, berikut tautan sistem inventaris ${store}:\n${activeUrl}\n\nSilakan buka di HP untuk mulai mencatat stok barang keluar & masuk secara real-time.`;
    const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    const link = document.createElement('a');
    link.href = targetUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    const link = document.createElement('a');
    link.href = activeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to determine device icon and badge
  const getDeviceVisuals = (device: DeviceInfo) => {
    const raw = `${device.deviceType || ''} ${device.deviceName || ''} ${device.deviceModel || ''} ${device.userAgent || ''}`.toLowerCase();
    if (/tablet|ipad/.test(raw)) {
      return {
        icon: <Tablet className="w-5 h-5 text-indigo-600" />,
        typeLabel: 'Tablet Kasir / Etalase',
        badge: 'Tablet',
        colorBg: 'bg-indigo-50 border-indigo-200 text-indigo-700'
      };
    }
    if (/mobi|phone|android|iphone|smartphone/.test(raw)) {
      return {
        icon: <Smartphone className="w-5 h-5 text-emerald-600" />,
        typeLabel: 'Smartphone / HP Kasir',
        badge: 'HP Kasir',
        colorBg: 'bg-emerald-50 border-emerald-200 text-emerald-700'
      };
    }
    return {
      icon: <Laptop className="w-5 h-5 text-blue-600" />,
      typeLabel: 'Komputer / Laptop Toko',
      badge: 'PC / Laptop',
      colorBg: 'bg-blue-50 border-blue-200 text-blue-700'
    };
  };

  // Combine localDevices and connectedDevices, ensuring current device is always shown with rich metadata
  const currentSpecs = parseDeviceUserAgent();
  const rawList = localDevices.length > 0 ? localDevices : connectedDevices;
  const mergedMap = new Map<string, DeviceInfo>();

  const currentDeviceFromList = rawList.find(d => d.deviceId === currentDevice.deviceId);
  const resolvedCurrentIp = currentDevice.ip && currentDevice.ip !== '127.0.0.1'
    ? currentDevice.ip
    : (currentDeviceFromList?.ip || '127.0.0.1 (Perangkat Ini)');

  // Ensure current device is present
  mergedMap.set(currentDevice.deviceId, {
    deviceId: currentDevice.deviceId,
    deviceName: currentDevice.deviceName,
    operatorName: currentDevice.operatorName,
    lastSeen: new Date().toISOString(),
    ip: resolvedCurrentIp,
    connectedAt: currentDeviceFromList?.connectedAt || new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    deviceType: currentSpecs.deviceCategory,
    deviceModel: currentSpecs.deviceModel,
    os: currentSpecs.os,
    browser: currentSpecs.browser,
    screen: currentSpecs.screenResolution,
    isCurrent: true,
  });

  // Add all other devices
  for (const d of rawList) {
    const isThis = d.deviceId === currentDevice.deviceId;
    const parsed = parseDeviceUserAgent(d.userAgent);
    mergedMap.set(d.deviceId, {
      ...d,
      ip: formatIpAddress(d.ip || (isThis ? resolvedCurrentIp : 'Jaringan Lokal')),
      deviceType: d.deviceType || parsed.deviceCategory,
      deviceModel: d.deviceModel || parsed.deviceModel,
      os: d.os || parsed.os,
      browser: d.browser || parsed.browser,
      screen: d.screen || parsed.screenResolution,
      isCurrent: isThis,
    });
  }

  const allDisplayDevices = Array.from(mergedMap.values()).sort((a, b) => {
    if (a.deviceId === currentDevice.deviceId) return -1;
    if (b.deviceId === currentDevice.deviceId) return 1;
    return 0;
  });

  const totalOnlineCount = Math.max(connectedDevicesCount, allDisplayDevices.length);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-yellow-200/90 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-yellow-500/20 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Radio className="w-5 h-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Sinkronisasi Multi-Perangkat
                </h2>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/40">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-yellow-100/70 mt-0.5">
                Stok otomatis tersinkron seketika antar HP kasir, tablet, dan komputer toko
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-yellow-200/80 bg-yellow-50/50 px-3 sm:px-6 pt-2.5 gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === 'devices'
                ? 'border-amber-500 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === 'devices' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Perangkat Online</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'devices' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {totalOnlineCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === 'connect'
                ? 'border-amber-500 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <QrCode className={`w-3.5 h-3.5 ${activeTab === 'connect' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Sambungkan HP Lain</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === 'identity'
                ? 'border-amber-500 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <Smartphone className={`w-3.5 h-3.5 ${activeTab === 'identity' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Nama Perangkat Ini</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-yellow-50/60 to-emerald-50/40 border border-yellow-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Status Server:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                    connectionStatus === 'connected' 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {connectionStatus === 'connected' ? '🟢 Terhubung & Siaga' : '🟡 Menghubungkan...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Setiap ada mutasi barang keluar atau masuk langsung diperbarui dan disiarkan ke seluruh perangkat.
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchDevicesList(false)}
              disabled={isRefreshingDevices}
              className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-yellow-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-center disabled:opacity-50 active:scale-95 cursor-pointer"
              title="Segarkan daftar perangkat online"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isRefreshingDevices ? 'animate-spin' : ''}`} />
              <span>{isRefreshingDevices ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
            </button>
          </div>

          {/* TAB 1: DAFTAR PERANGKAT ONLINE (INFORMASI DETAIL IP & PERANGKAT) */}
          {activeTab === 'devices' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Daftar Perangkat Terhubung ({allDisplayDevices.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi detail alamat IP, tipe perangkat, sistem operasi, dan browser yang sedang aktif tersinkronisasi.
                  </p>
                </div>
                {lastUpdatedTime && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Update Real-Time: {lastUpdatedTime} WIB</span>
                  </div>
                )}
              </div>

              {/* Device Cards List with Detailed IP & Device Specs */}
              <div className="space-y-3">
                {allDisplayDevices.map((dev, idx) => {
                  const isCurrent = dev.deviceId === currentDevice.deviceId;
                  const visuals = getDeviceVisuals(dev);
                  const isCopied = copiedIp === dev.ip;

                  return (
                    <div 
                      key={dev.deviceId || idx}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-br from-amber-50/70 via-yellow-50/40 to-white border-amber-300 ring-2 ring-amber-300/70 shadow-sm'
                          : 'bg-white border-yellow-200/90 hover:border-amber-300 shadow-xs'
                      }`}
                    >
                      {/* Top Header: Device Name, Badge, Live Status */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${visuals.colorBg} shadow-2xs`}>
                            {visuals.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                                {dev.deviceName || 'Perangkat Kasir'}
                              </span>
                              {isCurrent ? (
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-amber-300 shadow-2xs">
                                  Perangkat Ini
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  Online Real-Time
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${visuals.colorBg}`}>
                                {visuals.badge}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
                              <span className="flex items-center gap-1 font-semibold text-slate-800">
                                <User className="w-3.5 h-3.5 text-amber-600" />
                                <span>Kasir / Staf: <strong className="text-slate-950 font-bold">{dev.operatorName || 'Staf Toko'}</strong></span>
                              </span>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                                ID: <code className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{dev.deviceId}</code>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="w-2 h-2 rounded-full bg-emerald-600 -ml-3.5" />
                            <span>Terkoneksi Siaga</span>
                          </span>
                        </div>
                      </div>

                      {/* Detail Spesifikasi Perangkat & IP Address Grid */}
                      <div className="mt-3.5 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        {/* 1. Alamat IP */}
                        <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 flex flex-col justify-between">
                          <div className="text-[10px] font-black text-slate-600 flex items-center justify-between uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5 text-amber-600" />
                              <span>Alamat IP:</span>
                            </span>
                            {dev.ip && (
                              <button
                                type="button"
                                onClick={() => handleCopyIp(dev.ip || '')}
                                className="text-[10px] font-bold text-amber-700 hover:text-amber-950 flex items-center gap-0.5 cursor-pointer bg-white px-1.5 py-0.5 rounded border border-amber-200"
                                title="Salin Alamat IP"
                              >
                                {isCopied ? (
                                  <span className="text-emerald-700 font-black">✓ Tersalin</span>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="mt-1.5 font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide select-all break-all">
                            {dev.ip || '127.0.0.1 (Lokal)'}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-emerald-600" />
                            <span>Protokol: WebSocket Direct Sync</span>
                          </div>
                        </div>

                        {/* 2. Perangkat & Model */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                          <div className="text-[10px] font-black text-slate-600 flex items-center gap-1 uppercase tracking-wider">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Perangkat / Model:</span>
                          </div>
                          <div className="mt-1.5 font-bold text-xs text-slate-900 truncate" title={dev.deviceModel}>
                            {dev.deviceModel || visuals.typeLabel}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Monitor className="w-3 h-3 text-slate-400" />
                            <span>Resolusi: {dev.screen || 'Standar Layar'}</span>
                          </div>
                        </div>

                        {/* 3. Sistem Operasi & Browser */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between">
                          <div className="text-[10px] font-black text-slate-600 flex items-center gap-1 uppercase tracking-wider">
                            <Cpu className="w-3.5 h-3.5 text-blue-600" />
                            <span>Sistem Operasi &amp; Browser:</span>
                          </div>
                          <div className="mt-1.5 font-bold text-xs text-slate-900 truncate">
                            {dev.os || 'Sistem Operasi Web'}
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium truncate mt-1" title={dev.browser}>
                            {dev.browser || 'Web Browser'}
                          </div>
                        </div>
                      </div>

                      {/* Footer: Waktu Konek & Shortcut Edit Nama */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            Terkoneksi: {dev.connectedAt ? new Date(dev.connectedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Baru saja'} WIB
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Siaga Real-Time</span>
                          </span>
                        </div>
                        {isCurrent && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('identity')}
                            className="text-amber-800 hover:text-amber-950 font-extrabold text-[11px] flex items-center gap-0.5 hover:underline cursor-pointer"
                          >
                            <span>Ganti Nama / Kasir Perangkat Ini</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Helper Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-950">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900">Ingin menyambungkan HP kasir atau smartphone staf lain?</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Buka tab <strong>"Sambungkan HP Lain"</strong> untuk scan QR Code atau menyalin tautan toko ke HP staf.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('connect')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs active:scale-95 cursor-pointer"
                >
                  Sambungkan HP
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SAMBUNGKAN HP LAIN */}
          {activeTab === 'connect' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Main Hub Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-white border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Kolom Kiri: QR Code Card (Generated locally via client-side SVG/Canvas data URL -> 0% 403 risk) */}
                  <div className="w-full sm:w-auto flex flex-col items-center shrink-0">
                    <div className="p-3.5 bg-white rounded-2xl shadow-md border-2 border-amber-300 ring-4 ring-amber-100/70 flex flex-col items-center">
                      {isGeneratingQr ? (
                        <div className="w-44 h-44 flex flex-col items-center justify-center bg-slate-50 rounded-xl gap-2 text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                          <span className="text-[11px] font-bold">Membuat Barcode...</span>
                        </div>
                      ) : qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Barcode QR Code Buka di HP" 
                          className="w-44 h-44 object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-xl text-xs text-slate-500">
                          Gagal memuat barcode
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 text-[10px] font-black border border-amber-300">
                          <Camera className="w-3.5 h-3.5 text-amber-700" />
                          <span>Scan Kamera HP</span>
                        </div>
                        {qrCodeDataUrl && (
                          <button
                            type="button"
                            onClick={handleDownloadQr}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold active:scale-95 transition-all cursor-pointer shadow-xs"
                            title="Unduh gambar barcode QR (PNG)"
                          >
                            <Download className="w-3 h-3 text-amber-400" />
                            <span>Simpan</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 text-center max-w-[220px] leading-tight">
                      Arahkan kamera HP kasir ke barcode ini untuk langsung membuka katalog stok
                    </span>
                  </div>

                  {/* Kolom Kanan: Kotak Kartu Tautan Akses Toko & Tombol Aksi */}
                  <div className="flex-1 w-full min-w-0">
                    <div className="bg-white rounded-2xl border-2 border-amber-200/90 shadow-sm p-4 sm:p-4.5 space-y-3 w-full min-w-0">
                      {/* URL Card Display - Tautan Terstruktur & Rapi di Dalam Kolom */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                          <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Tautan Akses Toko:</span>
                          </label>
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                            ✓ Siap Digunakan
                          </span>
                        </div>
                        <div 
                          onClick={handleCopyLink}
                          className="flex items-center justify-between bg-amber-50/70 hover:bg-amber-100/60 border border-amber-300/80 hover:border-amber-500 rounded-xl py-2 px-3 shadow-2xs cursor-pointer transition-all group w-full min-w-0"
                          title="Klik untuk menyalin tautan toko ke clipboard"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 mr-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-200/80 flex items-center justify-center shrink-0 border border-amber-300 text-amber-800">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden select-none">
                              <span className="text-xs font-black text-slate-500 tracking-widest font-mono shrink-0">
                                ••••••••••••••••••••
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium truncate hidden xs:inline">
                                (Privat)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLink();
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="Salin tautan ke clipboard"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                  <span className="text-emerald-300">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tombol-Tombol Aksi Berbagi */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        {/* Tombol WhatsApp */}
                        <button
                          type="button"
                          onClick={handleShareWhatsApp}
                          className="w-full px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Kirim via WhatsApp</span>
                        </button>

                        {/* Tombol Buka Tab Baru */}
                        <button
                          type="button"
                          onClick={handleOpenNewTab}
                          className="w-full px-3.5 py-2.5 bg-white hover:bg-amber-50 active:bg-amber-100 text-slate-800 border border-yellow-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-amber-600" />
                          <span>Buka di Tab Baru</span>
                        </button>
                      </div>

                      {/* Status Alert Badge saat Tersalin */}
                      {copied && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>✓ Tautan berhasil disalin! Silakan kirimkan ke staf kasir Anda melalui chat WhatsApp.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panduan 3 Langkah Cepat & Terstruktur */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>3 Langkah Mudah Sambungkan HP Lain:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Langkah 1 */}
                  <div className="p-4 bg-white rounded-2xl border border-yellow-200/90 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors">
                    <div>
                      <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-2.5 shadow-2xs">
                        1
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Scan QR / Buka Link
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        Arahkan kamera HP ke barcode di atas, atau klik link toko yang Anda bagikan melalui WhatsApp.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-amber-800 font-extrabold">
                      ✓ Tanpa instal aplikasi
                    </div>
                  </div>

                  {/* Langkah 2 */}
                  <div className="p-4 bg-white rounded-2xl border border-yellow-200/90 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors">
                    <div>
                      <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-2.5 shadow-2xs">
                        2
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Beri Nama HP &amp; Kasir
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        Masukkan nama staf (misal: "Kasir 1" atau "Gudang") agar setiap aktivitas barang tercatat transparan.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-amber-800 font-extrabold">
                      ✓ Transparan di riwayat
                    </div>
                  </div>

                  {/* Langkah 3 */}
                  <div className="p-4 bg-white rounded-2xl border border-yellow-200/90 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-colors">
                    <div>
                      <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-2.5 shadow-2xs">
                        3
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Otomatis Tersinkron
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        Saat ada stok keluar atau masuk di kasir, data di seluruh HP dan tablet terupdate seketika secara otomatis.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-extrabold">
                      ✓ Real-time &amp; siaga otomatis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IDENTITAS PERANGKAT INI */}
          {activeTab === 'identity' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border border-yellow-200 rounded-2xl p-4 sm:p-5 bg-white shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>Identitas Perangkat Ini</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Nama ini akan muncul pada riwayat catatan aktivitas dan notifikasi di layar HP kasir lainnya setiap kali Anda mengubah stok barang.
                </p>

                <form onSubmit={handleSave} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Perangkat
                      </label>
                      <input
                        type="text"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        placeholder="Contoh: Tablet Kasir Utama / HP Kasir Depan"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-yellow-50/50 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Staf / Operator
                      </label>
                      <input
                        type="text"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        placeholder="Contoh: Siti (Kasir) / Budi (Gudang)"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-yellow-50/50 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {isSaved && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Identitas tersimpan!</span>
                      </span>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm active:scale-95"
                    >
                      Simpan Identitas
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-yellow-100 bg-yellow-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">STZ Stok Engine • {totalOnlineCount} Perangkat Terhubung</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
