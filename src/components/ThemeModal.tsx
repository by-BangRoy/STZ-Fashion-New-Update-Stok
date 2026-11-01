import React from 'react';
import { useTheme, THEME_PALETTES, ThemeColor, ThemeMode } from '../context/ThemeContext.tsx';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  X, 
  Palette, 
  Sun, 
  Moon, 
  Laptop, 
  Check, 
  Sparkles, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck,
  Eye
} from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  const { 
    themeMode, 
    themeColor, 
    effectiveMode, 
    devicePrefersDark, 
    palette, 
    setThemeMode, 
    setThemeColor 
  } = useTheme();

  const { currentDevice } = useInventory();

  if (!isOpen) return null;

  const modeOptions: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode; tag?: string }[] = [
    {
      id: 'auto',
      label: 'Ikuti Tema Perangkat',
      desc: `Otomatis menyesuaikan dengan setelan HP / Komputer Anda (Saat ini: ${devicePrefersDark ? 'Mode Gelap' : 'Mode Terang'})`,
      icon: <Laptop className="w-5 h-5 text-indigo-500" />,
      tag: 'Disarankan'
    },
    {
      id: 'light',
      label: 'Mode Terang (Light)',
      desc: 'Latar cerah, bersih, dan kontras tajam. Nyaman digunakan di siang hari atau toko berpenerangan terang.',
      icon: <Sun className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'dark',
      label: 'Mode Gelap (Dark / OLED)',
      desc: 'Latar gelap elegan, ramah di mata saat malam dan hemat baterai untuk layar HP OLED / AMOLED.',
      icon: <Moon className="w-5 h-5 text-purple-400" />
    }
  ];

  const paletteList = Object.values(THEME_PALETTES);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-yellow-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent dark:from-slate-800/50 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-500/40 shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Tema &amp; Warna Perangkat</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur tampilan khusus untuk {currentDevice.deviceName || 'perangkat kasir ini'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Info Banner Status Perangkat */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200/90 dark:border-slate-700/80 flex items-center gap-3 text-xs">
            <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                <span>Perangkat Ini:</span>
                <span className="text-amber-700 dark:text-amber-400">{currentDevice.deviceName || 'HP / Tablet'}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Sistem OS: <strong className="text-slate-900 dark:text-white">{devicePrefersDark ? 'Gelap (Dark Mode)' : 'Terang (Light Mode)'}</strong>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pilihan tema disimpan khusus di HP/perangkat ini tanpa mempengaruhi perangkat kasir lain.
              </p>
            </div>
          </div>

          {/* Bagian 1: Mode Tampilan (Terang / Gelap / Ikuti Sistem) */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>1. Mode Tampilan Sistem:</span>
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {modeOptions.map((opt) => {
                const isSelected = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setThemeMode(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-slate-800 border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/50 shadow-xs'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-700 border-amber-300 dark:border-amber-500 shadow-2xs' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      {opt.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{opt.label}</span>
                          {opt.tag && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {opt.tag}
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bagian 2: Warna Tema Aksen Toko */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Warna Aksen &amp; Tombol Toko:</span>
              </label>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {palette.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {paletteList.map((p) => {
                const isSelected = themeColor === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setThemeColor(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/50 dark:bg-slate-800 border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/50 shadow-xs'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div 
                        className="w-7 h-7 rounded-xl border border-white/40 shadow-xs flex items-center justify-center"
                        style={{ backgroundColor: p.primaryHex }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {p.badge}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {p.name.split('(')[0].trim()}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                        {p.id === 'amber' ? 'Default STZ' : p.id}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bagian 3: Pratinjau Tampilan Tema (Live Preview Card) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>Pratinjau Hasil di Layar:</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Mode Aktif: {effectiveMode === 'dark' ? '🌙 Gelap' : '☀️ Terang'}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs font-black text-xs"
                  style={{ backgroundColor: palette.primaryHex }}
                >
                  STZ
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Kaos Katun STZ (Contoh)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Stok Fisik: 48 Pcs • Real-time
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                  style={{
                    backgroundColor: effectiveMode === 'dark' ? `${palette.primaryHex}25` : `${palette.primaryHex}15`,
                    borderColor: `${palette.primaryHex}50`,
                    color: effectiveMode === 'dark' ? '#f8fafc' : palette.darkHex,
                  }}
                >
                  {palette.badge}
                </span>

                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-xs transition-all ${palette.buttonGradient}`}
                >
                  + Tambah
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Perubahan langsung tersimpan otomatis</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 text-white text-xs font-black transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
