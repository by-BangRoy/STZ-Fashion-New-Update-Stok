import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { 
  X, 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        onClose();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-yellow-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-md shadow-amber-600/20 border border-yellow-200 shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src="/pwa-192x192.png" 
                alt="Logo STZStok" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-slate-950 leading-tight">
                  Pasang STZStok di HP
                </h3>
                <span className="text-[10px] font-extrabold bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-md">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-900/80 font-semibold mt-0.5">
                Bisa dibuka cepat layaknya aplikasi Play Store
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status jika sudah terpasang */}
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Aplikasi Sudah Terpasang!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Aplikasi STZStok sudah berjalan dalam mode standalone di perangkat ini. Anda dapat membukanya langsung dari ikon di layar utama HP Anda.
              </p>
            </div>
          ) : (
            <>
              {/* Tombol Langsung Android / Chromium jika browser mendukung beforeinstallprompt */}
              {isInstallable && (
                <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-slate-900 text-xs">
                        Instalasi Otomatis Didukung Browser Anda
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Cukup ketuk tombol di bawah, aplikasi akan langsung dipasang ke beranda HP Anda.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs shadow-md shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Pasang Aplikasi Sekarang (Gratis)</span>
                  </button>
                </div>
              )}

              {/* Panduan Khusus iPhone & iPad (iOS Safari) */}
              {isIOS ? (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span>Cara Pasang di iPhone / iPad (Safari):</span>
                  </div>

                  <div className="space-y-2.5 pl-1">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Buka link ini di browser <strong>Safari</strong> iPhone Anda, lalu ketuk tombol <strong>Bagikan (Share)</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> di bilah bawah layar.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Gulir menu ke bawah lalu pilih opsi <strong className="text-slate-900 font-bold">"Tambah ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-800" />.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Ketuk tombol <strong>"Tambah" (Add)</strong> di pojok kanan atas. Ikon aplikasi STZStok akan langsung muncul di beranda iPhone Anda.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Panduan Manual Android (Chrome / Samsung Internet / Mi Browser) */
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span>Cara Pasang di HP Android (Chrome):</span>
                  </div>

                  <div className="space-y-2.5 pl-1">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Buka link di browser <strong>Google Chrome</strong> HP Anda.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Ketuk tombol <strong>menu titik tiga (⋮)</strong> di pojok kanan atas Chrome.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-[11px] text-slate-700 leading-relaxed">
                        Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal aplikasi"</strong>. Ikon STZStok akan otomatis terpasang di layar HP.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Keuntungan Memasang Aplikasi */}
              <div className="p-3.5 bg-yellow-50/70 border border-yellow-200 rounded-xl space-y-1.5">
                <div className="font-bold text-[11px] text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Keuntungan Memasang di HP:</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                  <li>Layar penuh (Full Screen) tanpa bilah URL browser yang mengganggu.</li>
                  <li>Buka aplikasi dalam 0 detik tanpa menunggu reload.</li>
                  <li>Bekerja mulus saat standby lama &amp; otomatis tersambung saat ada koneksi.</li>
                  <li>Hemat kuota data dengan penyimpanan offline mandiri.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
