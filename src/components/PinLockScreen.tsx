import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  KeyRound, 
  Delete, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Lock
} from 'lucide-react';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, settings } = useInventory();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [shake, setShake] = useState(false);
  const [showDigits, setShowDigits] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const targetPinLength = Math.max(4, settings.securityPin?.length || 6);

  const handleKeyPress = (num: string) => {
    if (isChecking) return;
    if (pin.length < 8) {
      setErrorMsg('');
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === targetPinLength) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isChecking) return;
    setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isChecking) return;
    setErrorMsg('');
    setPin('');
  };

  const verifyPin = async (pinToTest = pin) => {
    const trimmed = pinToTest.trim();
    if (!trimmed || isChecking) return;
    setIsChecking(true);
    setErrorMsg('');

    try {
      const result = await unlockWithPin(trimmed);
      if (!result.success) {
        setErrorMsg(result.error || 'PIN Keamanan salah! Periksa kembali angka PIN Anda.');
        setShake(true);
        setTimeout(() => {
          setShake(false);
        }, 500);
      }
    } catch {
      setErrorMsg('Gagal memverifikasi PIN. Periksa koneksi atau coba lagi.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsChecking(false);
    }
  };

  // Keyboard support for typing digits directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChecking) return;
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 8) {
          setErrorMsg('');
          const next = pin + e.key;
          setPin(next);
          if (next.length === targetPinLength) {
            verifyPin(next);
          }
        }
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter' && pin.length >= 3) {
        verifyPin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isChecking, targetPinLength]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-yellow-950/95 via-slate-950 to-amber-950 text-white select-none overflow-y-auto">
      {/* Background ambient warm yellow glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden real input for mobile keyboard or autofill support */}
      <input
        ref={inputRef}
        type={showDigits ? 'text' : 'password'}
        inputMode="numeric"
        pattern="[0-9]*"
        value={pin}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
          setPin(val);
          setErrorMsg('');
          if (val.length === targetPinLength) {
            verifyPin(val);
          }
        }}
        className="opacity-0 absolute -top-96 left-0 pointer-events-none"
        aria-hidden="true"
      />

      <div className={`relative w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center transition-all ${
        shake ? 'animate-bounce text-amber-400' : ''
      }`}>
        {/* Brand & Security Badge with uploaded Logo */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#FEF9C3] p-1.5 shadow-xl shadow-amber-500/20 mb-3 border border-yellow-200 flex items-center justify-center overflow-hidden">
          <img 
            src="/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg" 
            alt="STZ Stok Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-lg sm:text-xl font-black text-white text-center tracking-tight">
          {settings.profile.storeName || 'STZ Stok'}
        </h1>
        <p className="text-xs text-amber-300/90 text-center mt-0.5 mb-3 font-medium">
          System Rekap Barang Keluar / Masuk
        </p>

        {/* Lock Instructions & Toggle view */}
        <div className="flex items-center justify-between w-full max-w-[280px] mb-2 px-1">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-400/30 text-xs font-semibold text-amber-200">
            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Masukkan PIN Masuk</span>
          </div>

          <button
            type="button"
            onClick={() => setShowDigits(!showDigits)}
            className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
            title={showDigits ? 'Sembunyikan Digit' : 'Lihat Digit'}
          >
            {showDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{showDigits ? 'Tutup' : 'Lihat'}</span>
          </button>
        </div>

        {/* PIN Display (clickable to focus native keyboard on mobile) */}
        <div 
          onClick={() => inputRef.current?.focus()}
          className="flex items-center justify-center gap-2.5 sm:gap-3 mb-2.5 h-12 px-4 py-1.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 cursor-pointer w-full max-w-[280px] transition-colors"
          title="Klik untuk mengetik langsung"
        >
          {showDigits ? (
            <div className="font-mono text-xl font-black tracking-widest text-amber-400">
              {pin || <span className="text-slate-600 text-sm font-sans tracking-normal font-normal">Ketik PIN...</span>}
            </div>
          ) : (
            Array.from({ length: Math.max(pin.length, targetPinLength) }).map((_, idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? 'bg-amber-400 border-yellow-300 scale-110 shadow-md shadow-amber-400/50'
                      : 'border-slate-700 bg-slate-800/80'
                  }`}
                />
              );
            })
          )}
        </div>

        {/* Status / Error message */}
        <div className="min-h-7 flex items-center justify-center mb-2 w-full max-w-[280px]">
          {isChecking ? (
            <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Memverifikasi PIN...</span>
            </div>
          ) : errorMsg ? (
            <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/30">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="truncate">{errorMsg}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 text-center flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>PIN dapat diakses oleh semua perangkat staf</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isChecking}
              onClick={() => handleKeyPress(digit)}
              className="h-11 sm:h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-extrabold text-xl border border-slate-700/60 transition-all shadow-sm flex items-center justify-center active:scale-95"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            disabled={isChecking || !pin}
            onClick={handleClear}
            className="h-11 sm:h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-white text-xs font-bold border border-slate-700/30 transition-all flex items-center justify-center active:scale-95"
          >
            Hapus
          </button>

          <button
            type="button"
            disabled={isChecking}
            onClick={() => handleKeyPress('0')}
            className="h-11 sm:h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-extrabold text-xl border border-slate-700/60 transition-all shadow-sm flex items-center justify-center active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            disabled={isChecking || !pin}
            onClick={handleDelete}
            className="h-11 sm:h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-amber-400 text-sm font-bold border border-slate-700/30 transition-all flex items-center justify-center active:scale-95"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Explicit Enter / Unlock Button */}
        <button
          type="button"
          disabled={isChecking || pin.length < 3}
          onClick={() => verifyPin(pin)}
          className="w-full max-w-[280px] py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
        >
          <span>Buka Kunci</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
