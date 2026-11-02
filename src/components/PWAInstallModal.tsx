import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { 
  X, 
  Download, 
  CheckCircle2, 
  Sparkles,
  Share2,
  AlertCircle
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const result = await promptInstall();
    if (result.status === 'accepted') {
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setFeedback(result.message);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-yellow-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md shadow-amber-600/20 border border-yellow-200 shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src="/pwa-192x192.png" 
                alt="Logo STZStok" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950 leading-tight">
                Pasang STZStok di HP
              </h3>
              <p className="text-[11px] text-slate-900/80 font-bold">
                Akses instan di layar beranda
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

        {/* Modal Body: Direct 1-Click Action without tutorials */}
        <div className="p-5 space-y-4 text-xs">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-black text-sm text-emerald-800">
                Aplikasi Sudah Terpasang!
              </div>
              <p className="text-xs text-emerald-700">
                STZStok sudah aktif di layar utama perangkat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-slate-600 text-xs">
                  Pasang STZStok sebagai aplikasi resmi di HP Anda agar terbuka secepat kilat dalam mode layar penuh (fullscreen).
                </p>
              </div>

              {/* Direct 1-Click Install Button */}
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-amber-300"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Pasang Sekarang (1-Klik)</span>
              </button>

              {/* Quick 1-line note if on iPhone */}
              {isIOS && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-slate-700 text-[11px] flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Di iPhone: Ketuk tombol <strong>Bagikan [ ⎋ ]</strong> di Safari ➔ <strong>Tambah ke Layar Utama</strong>.
                  </span>
                </div>
              )}

              {/* Feedback toast if manual/prompt message */}
              {feedback && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{feedback}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
