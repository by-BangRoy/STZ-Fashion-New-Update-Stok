// Web Audio API synthetic sound generator for real-time notifications
// 100% Procedural synthesis: no external MP3/WAV files required
// Zero latency, works offline, and handles mobile audio unlock policies gracefully

import { NotificationSoundType } from '../types/inventory.ts';

export interface SoundOptionMetadata {
  id: NotificationSoundType;
  name: string;
  badge: string;
  description: string;
  category: 'kasir' | 'elegan' | 'modern' | 'alert';
}

export const NOTIFICATION_SOUNDS: SoundOptionMetadata[] = [
  {
    id: 'cash',
    name: 'Kasir Modern (Ka-Ching)',
    badge: 'Rekomendasi Kasir',
    description: 'Denting register kasir & nada koin renyah saat terjadi penjualan',
    category: 'kasir',
  },
  {
    id: 'chime',
    name: 'Chime Elegan (2 Nada)',
    badge: 'Lembut & Mewah',
    description: 'Dua nada harmonik lembut (C6 → G6) yang menyejukkan',
    category: 'elegan',
  },
  {
    id: 'bell',
    name: 'Denting Halus (Lonceng Kristal)',
    badge: 'Jernih',
    description: 'Lonceng kaca butik bening dengan resonansi halus lingering',
    category: 'elegan',
  },
  {
    id: 'digital',
    name: 'Bip Digital (Scanner POS)',
    badge: 'Cepat & Ringkas',
    description: 'Bip digital modern tajam ala scanner barcode kasir profesional',
    category: 'modern',
  },
  {
    id: 'pop',
    name: 'Pop Ceria (Bubble Bounce)',
    badge: 'Ceria & Bersahabat',
    description: 'Efek akustik gelembung pop ringan yang ramah dan segar',
    category: 'modern',
  },
  {
    id: 'fanfare',
    name: 'Melodi Sukses (4 Nada Naik)',
    badge: 'Kemenangan',
    description: 'Melodi 4 nada akord naik ceria untuk restock & konfirmasi',
    category: 'elegan',
  },
  {
    id: 'classic',
    name: 'Lonceng Pintu Butik Klasik',
    badge: 'Nuansa Toko',
    description: 'Dentang lonceng pintu kuningan toko fisik saat pintu dibuka',
    category: 'kasir',
  },
  {
    id: 'warning',
    name: 'Peringatan Halus (Alarm Stok)',
    badge: 'Perhatian',
    description: 'Dua detak nada peringatan lembut untuk stok menipis atau habis',
    category: 'alert',
  },
];

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let soundVolume = 80; // 0 - 100
let selectedSound: NotificationSoundType = 'cash';
let restockSound: NotificationSoundType = 'fanfare';
let warningSound: NotificationSoundType = 'warning';

// Initialize AudioContext lazily on user gesture or first play
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    try {
      audioCtx.resume().catch(() => {});
    } catch {}
  }
  return audioCtx;
}

// Mobile and Safari Gesture Unlocker
let isUnlocked = false;
export function initAudioUnlock(): void {
  if (typeof window === 'undefined' || isUnlocked) return;

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isUnlocked = true;
        }).catch(() => {});
      } else if (ctx && ctx.state === 'running') {
        isUnlocked = true;
      }
    } catch {}

    if (isUnlocked) {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('click', unlock);
    }
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('click', unlock, { passive: true });
}

// Settings Accessors
export function isSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('stz_sound_enabled');
    if (saved !== null) {
      soundEnabled = saved === 'true';
    }
  }
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('stz_sound_enabled', String(enabled));
  }
}

export function getSoundVolume(): number {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('stz_sound_volume');
    if (saved !== null) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        soundVolume = num;
      }
    }
  }
  return soundVolume;
}

export function setSoundVolume(volume: number): void {
  const safeVol = Math.max(0, Math.min(100, Math.round(volume)));
  soundVolume = safeVol;
  if (typeof window !== 'undefined') {
    localStorage.setItem('stz_sound_volume', String(safeVol));
  }
}

export function getSelectedSound(): NotificationSoundType {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('stz_sound_type') as NotificationSoundType;
    if (saved && NOTIFICATION_SOUNDS.some(s => s.id === saved)) {
      selectedSound = saved;
    }
  }
  return selectedSound;
}

export function setSelectedSound(type: NotificationSoundType): void {
  selectedSound = type;
  if (typeof window !== 'undefined') {
    localStorage.setItem('stz_sound_type', type);
  }
}

export function getRestockSound(): NotificationSoundType {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('stz_restock_sound') as NotificationSoundType;
    if (saved && NOTIFICATION_SOUNDS.some(s => s.id === saved)) {
      restockSound = saved;
    }
  }
  return restockSound;
}

export function setRestockSound(type: NotificationSoundType): void {
  restockSound = type;
  if (typeof window !== 'undefined') {
    localStorage.setItem('stz_restock_sound', type);
  }
}

export function getWarningSound(): NotificationSoundType {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('stz_warning_sound') as NotificationSoundType;
    if (saved && NOTIFICATION_SOUNDS.some(s => s.id === saved)) {
      warningSound = saved;
    }
  }
  return warningSound;
}

export function setWarningSound(type: NotificationSoundType): void {
  warningSound = type;
  if (typeof window !== 'undefined') {
    localStorage.setItem('stz_warning_sound', type);
  }
}

// Master synthesizer functions for each sound type
export function playSound(
  type: NotificationSoundType = 'cash',
  customVolume?: number
): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const currentVol = customVolume !== undefined ? customVolume : getSoundVolume();
  if (currentVol <= 0) return;

  // Master Gain Node: scale volume 0-100 to gain 0 - 0.28 (comfortable listening)
  const masterVolumeGain = (currentVol / 100) * 0.28;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolumeGain, now);
    masterGain.connect(ctx.destination);

    switch (type) {
      case 'cash': {
        // Modern Cash Register "Ka-Ching":
        // 1. Initial metallic drawer ping
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(987.77, now); // B5
        osc1.frequency.setValueAtTime(1318.51, now + 0.04); // E6
        gain1.gain.setValueAtTime(0.8, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.19);

        // 2. High sparkling coin ring (C7 -> G7 harmonic shimmer)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2093.0, now + 0.08); // C7
        osc2.frequency.setValueAtTime(3135.96, now + 0.14); // G7
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(0.9, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.46);

        // 3. Subtle sub-metallic undertone
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1567.98, now + 0.08); // G6
        gain3.gain.setValueAtTime(0.001, now);
        gain3.gain.setValueAtTime(0.4, now + 0.08);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.start(now + 0.08);
        osc3.stop(now + 0.36);
        break;
      }

      case 'chime': {
        // Elegant Warm Dual-Chime: C6 (1046.5 Hz) -> G6 (1567.98 Hz)
        const tones = [
          { freq: 1046.5, start: now, duration: 0.3 },
          { freq: 1567.98, start: now + 0.09, duration: 0.38 },
        ];
        tones.forEach(({ freq, start, duration }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(0.85, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(start);
          osc.stop(start + duration + 0.01);
        });
        break;
      }

      case 'bell': {
        // Crystal Glass Boutique Bell: D6 (1174.66 Hz) with lingering resonance & overtone
        const fundamental = 1174.66;
        const overtones = [1, 2.76, 5.4];
        const weights = [0.9, 0.3, 0.12];

        overtones.forEach((multiplier, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = i === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(fundamental * multiplier, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(weights[i], now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + (0.55 - i * 0.1));
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.6);
        });
        break;
      }

      case 'digital': {
        // High-tech POS Scanner Beep (Short positive dual chirp: 1250 Hz -> 1800 Hz in 85ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1320, now);
        osc.frequency.setValueAtTime(1980, now + 0.045);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.9, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.13);
        break;
      }

      case 'pop': {
        // Cheerful Bubbly Pop: fast upward pitch scoop + acoustic snap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.1);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.95, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'fanfare': {
        // 4-chord Ascending Melodic Fanfare: C5 (523) -> E5 (659) -> G5 (784) -> C6 (1046)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const startTime = now + idx * 0.065;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(idx === 3 ? 0.95 : 0.75, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + (idx === 3 ? 0.45 : 0.22));
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(startTime);
          osc.stop(startTime + 0.48);
        });
        break;
      }

      case 'classic': {
        // Boutique Brass Door Bell (Twin resonant chime: 784 Hz & 1046 Hz)
        const notes = [
          { f: 783.99, t: 0, decay: 0.5 },
          { f: 1046.5, t: 0.07, decay: 0.6 },
        ];
        notes.forEach(({ f, t, decay }) => {
          const startTime = now + t;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, startTime);
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.85, startTime + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(startTime);
          osc.stop(startTime + decay + 0.02);
        });
        break;
      }

      case 'warning': {
        // 2-Pulse Alert Tone (Low/Out of Stock notice: 587 Hz D5 & 440 Hz A4)
        [0, 0.14].forEach((offset) => {
          const startTime = now + offset;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(587.33, startTime);
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.65, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(startTime);
          osc.stop(startTime + 0.11);
        });
        break;
      }

      default: {
        // Fallback pleasant ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.19);
      }
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

// Live interactive test button in Settings
export function previewSound(
  type: NotificationSoundType,
  customVolume?: number
): void {
  // Always trigger sound during user preview even if master sound was muted in settings
  const ctx = getAudioContext();
  if (!ctx) return;

  const currentVol = customVolume !== undefined ? customVolume : getSoundVolume();
  const effectiveVol = currentVol <= 5 ? 50 : currentVol; // if volume was 0%, preview at 50% so user hears what it sounds like

  const prevEnabled = soundEnabled;
  soundEnabled = true;
  playSound(type, effectiveVol);
  soundEnabled = prevEnabled;
}

// Backward-compatible playChime function connected to user preferences
export function playChime(
  type: 'sale' | 'restock' | 'adjustment' | 'warning' | 'alert' = 'sale',
  options?: { soundType?: NotificationSoundType; volume?: number }
): void {
  if (!isSoundEnabled()) return;

  if (options?.soundType) {
    playSound(options.soundType, options.volume);
    return;
  }

  // Resolve sound type based on event and user settings
  let resolvedTone: NotificationSoundType = getSelectedSound();

  if (type === 'sale') {
    resolvedTone = getSelectedSound();
  } else if (type === 'restock') {
    resolvedTone = getRestockSound();
  } else if (type === 'warning' || type === 'alert') {
    resolvedTone = getWarningSound();
  } else {
    // adjustment / opname / general
    resolvedTone = getSelectedSound() === 'cash' ? 'chime' : getSelectedSound();
  }

  playSound(resolvedTone, options?.volume);
}
