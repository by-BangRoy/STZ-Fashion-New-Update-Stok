import React from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { 
  Volume2, 
  VolumeX, 
  History, 
  Plus, 
  ClipboardCheck, 
  Smartphone, 
  Sliders, 
  Lock, 
  LayoutGrid,
  RefreshCw,
  Palette
} from 'lucide-react';

interface NavbarProps {
  onOpenDeviceManager: () => void;
  onOpenAuditLog: () => void;
  onOpenOpname: () => void;
  onOpenAddProduct: () => void;
  onOpenSettings: (tab?: any) => void;
  onOpenTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDeviceManager,
  onOpenAuditLog,
  onOpenOpname,
  onOpenAddProduct,
  onOpenSettings,
  onOpenTheme,
}) => {
  const { 
    connectedDevicesCount, 
    connectionStatus, 
    currentDevice, 
    soundOn, 
    toggleSound, 
    stockLogs,
    settings,
    lockApp,
    refreshData,
    isRefreshing
  } = useInventory();

  const {
    openThemeModal,
    palette,
    effectiveMode,
  } = useTheme();

  const handleOpenTheme = onOpenTheme || openThemeModal;

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 text-white shadow-lg safe-area-top-header">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
            
            {/* Bagian Kiri: Logo Toko & Judul yang Jelas & Rapi di HP */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
              <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-amber-400/10 p-1 shadow-sm border border-amber-400/30 shrink-0 flex items-center justify-center overflow-hidden">
                <img 
                  src="/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg" 
                  alt="STZ Stok Logo" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0 flex flex-col justify-center">
                <h1 className="font-black text-base sm:text-xl tracking-tight text-white flex items-center gap-1 whitespace-nowrap select-none">
                  <span className="text-white font-black">STZ</span>
                  <span className="text-amber-400 font-black">Stok</span>
                </h1>
                {settings.profile.storeBranch ? (
                  <p className="text-[10px] sm:text-xs text-amber-200/90 font-medium truncate max-w-[120px] sm:max-w-xs leading-none mt-0.5">
                    {settings.profile.storeBranch}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Bagian Tengah: Status Sinkronisasi Real-Time (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenDeviceManager}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${
                  connectionStatus === 'disconnected'
                    ? 'bg-slate-800/90 border-slate-600/60 text-slate-300 hover:bg-slate-700'
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
                }`}
                title="Status Sinkronisasi Multi-Perangkat (Klik untuk detail)"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    connectionStatus === 'disconnected' ? 'bg-slate-400' : 'bg-emerald-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    connectionStatus === 'disconnected' ? 'bg-slate-400' : 'bg-emerald-500'
                  }`} />
                </span>
                <span className="font-extrabold text-xs">
                  {Math.max(1, connectedDevicesCount)} <span className="hidden md:inline">{connectionStatus === 'disconnected' ? 'Aktif' : 'Online'}</span>
                </span>
              </button>

              {/* Perangkat Ini (Tampil di Layar Besar) */}
              <button
                type="button"
                onClick={onOpenDeviceManager}
                className="hidden xl:flex items-center gap-1.5 text-xs text-amber-200/90 bg-slate-800/90 hover:bg-slate-700/90 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-colors font-medium"
                title="Identitas Perangkat Ini"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[120px]">{currentDevice.deviceName}</span>
              </button>
            </div>

            {/* Bagian Kanan: Tombol Aksi yang Simetris & Pas di HP */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Badge Status Ringkas untuk HP */}
              <button
                type="button"
                onClick={onOpenDeviceManager}
                className={`sm:hidden flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all active:scale-95 cursor-pointer ${
                  connectionStatus === 'disconnected'
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                }`}
                title="Multi-Perangkat Kasir"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    connectionStatus === 'disconnected' ? 'bg-slate-400' : 'bg-emerald-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    connectionStatus === 'disconnected' ? 'bg-slate-400' : 'bg-emerald-500'
                  }`} />
                </span>
                <span>{Math.max(1, connectedDevicesCount)}</span>
              </button>

              {/* 1. Tombol Refresh / Segarkan Data */}
              <button
                type="button"
                onClick={() => refreshData(true)}
                disabled={isRefreshing}
                className="w-8.5 h-8.5 sm:w-auto sm:h-9 sm:px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-xs disabled:opacity-50 flex items-center justify-center cursor-pointer"
                title="Segarkan / Refresh Data Stok"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* 2. Tombol Suara Notifikasi */}
              <button
                type="button"
                onClick={toggleSound}
                className={`w-8.5 h-8.5 sm:w-auto sm:h-9 sm:px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                  soundOn
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 hover:bg-amber-400/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title={soundOn ? 'Suara Notifikasi: Aktif' : 'Suara Notifikasi: Senyap'}
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              {/* 3. Tombol Tema Tampilan */}
              <button
                type="button"
                onClick={handleOpenTheme}
                className="w-8.5 h-8.5 sm:w-auto sm:h-9 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-slate-200 transition-all hover:border-amber-400/50 cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
                title={`Tema Tampilan: ${palette.name} (${effectiveMode === 'dark' ? 'Mode Gelap' : 'Mode Terang'})`}
              >
                <div className="relative flex items-center justify-center">
                  <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span 
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-slate-900 shadow-2xs"
                    style={{ backgroundColor: palette.primaryHex }}
                  />
                </div>
                <span className="hidden xl:inline text-xs font-bold ml-1.5">Tema</span>
              </button>

              {/* 4. Desktop Only: Riwayat Perubahan Stok */}
              <button
                type="button"
                onClick={onOpenAuditLog}
                className="hidden sm:flex h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors items-center gap-1.5 cursor-pointer"
                title="Buka Riwayat Perubahan Stok Real-Time"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Riwayat</span>
                {stockLogs.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {stockLogs.length > 99 ? '99+' : stockLogs.length}
                  </span>
                )}
              </button>

              {/* 5. Desktop Only: Opname Stok Fisik */}
              <button
                type="button"
                onClick={onOpenOpname}
                className="hidden md:flex h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors items-center gap-1.5 cursor-pointer"
                title="Audit & Opname Fisik Stok"
              >
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                <span>Opname</span>
              </button>

              {/* 6. Desktop Only: Menu Pengaturan Toko */}
              <button
                type="button"
                onClick={() => onOpenSettings('profile')}
                className="hidden sm:flex h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors items-center gap-1.5 cursor-pointer"
                title="Buka Menu Pengaturan"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">Pengaturan</span>
              </button>

              {/* 7. Kunci Layar Aplikasi (PIN Lock) */}
              <button
                type="button"
                onClick={lockApp}
                className="w-8.5 h-8.5 sm:w-auto sm:h-9 sm:px-3 rounded-xl bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-600/50 text-slate-300 hover:text-rose-300 transition-all active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                title="Kunci Layar Aplikasi (PIN Lock)"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="hidden lg:inline text-xs font-bold">Kunci</span>
              </button>

              {/* 8. Desktop Only: Tambah Barang Baru (Primary Action) */}
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="hidden sm:flex h-9 px-3.5 sm:px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah Barang</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Mudah Dijangkau Jari Pengguna HP) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-yellow-200/90 shadow-[0_-4px_24px_rgba(202,138,4,0.15)] px-3 pt-1 safe-area-bottom-nav">
        <div className="flex items-center justify-around max-w-md mx-auto h-14">
          {/* 1. Katalog / Beranda */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-700 hover:text-amber-600 active:scale-95 transition-all cursor-pointer"
          >
            <LayoutGrid className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] font-extrabold mt-0.5">Katalog</span>
          </button>

          {/* 2. Opname */}
          <button
            type="button"
            onClick={onOpenOpname}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-700 hover:text-amber-600 active:scale-95 transition-all cursor-pointer"
          >
            <ClipboardCheck className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] font-bold mt-0.5">Opname</span>
          </button>

          {/* 3. Center Action: Tambah Barang */}
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="-mt-5 w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/40 border-2 border-white flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer"
            title="Tambah Barang"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          {/* 4. Riwayat Activity */}
          <button
            type="button"
            onClick={onOpenAuditLog}
            className="relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-700 hover:text-amber-600 active:scale-95 transition-all cursor-pointer"
          >
            <History className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] font-bold mt-0.5">Riwayat</span>
            {stockLogs.length > 0 && (
              <span className="absolute top-0 right-1.5 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                {stockLogs.length > 99 ? '99' : stockLogs.length}
              </span>
            )}
          </button>

          {/* 5. Pengaturan */}
          <button
            type="button"
            onClick={() => onOpenSettings('profile')}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-700 hover:text-amber-600 active:scale-95 transition-all cursor-pointer"
          >
            <Sliders className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] font-bold mt-0.5">Pengaturan</span>
          </button>
        </div>
      </nav>
    </>
  );
};
