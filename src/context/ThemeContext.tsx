import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ThemeColor = 'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | 'slate';

export interface ThemePalette {
  id: ThemeColor;
  name: string;
  badge: string;
  primaryHex: string;
  darkHex: string;
  accentBgLight: string;
  accentBgDark: string;
  accentBorderLight: string;
  accentBorderDark: string;
  accentTextLight: string;
  accentTextDark: string;
  buttonGradient: string;
  ringColor: string;
}

export const THEME_PALETTES: Record<ThemeColor, ThemePalette> = {
  amber: {
    id: 'amber',
    name: 'Emas STZ (Golden Amber)',
    badge: 'Klasik Toko',
    primaryHex: '#f59e0b',
    darkHex: '#b45309',
    accentBgLight: 'bg-amber-50',
    accentBgDark: 'bg-amber-950/40',
    accentBorderLight: 'border-amber-300',
    accentBorderDark: 'border-amber-700/60',
    accentTextLight: 'text-amber-900',
    accentTextDark: 'text-amber-300',
    buttonGradient: 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950',
    ringColor: 'ring-amber-400',
  },
  emerald: {
    id: 'emerald',
    name: 'Hijau Zamrud (Emerald)',
    badge: 'Segar & Modern',
    primaryHex: '#10b981',
    darkHex: '#047857',
    accentBgLight: 'bg-emerald-50',
    accentBgDark: 'bg-emerald-950/40',
    accentBorderLight: 'border-emerald-300',
    accentBorderDark: 'border-emerald-700/60',
    accentTextLight: 'text-emerald-900',
    accentTextDark: 'text-emerald-300',
    buttonGradient: 'from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white',
    ringColor: 'ring-emerald-400',
  },
  blue: {
    id: 'blue',
    name: 'Biru Safir (Sapphire)',
    badge: 'Profesional',
    primaryHex: '#3b82f6',
    darkHex: '#1d4ed8',
    accentBgLight: 'bg-blue-50',
    accentBgDark: 'bg-blue-950/40',
    accentBorderLight: 'border-blue-300',
    accentBorderDark: 'border-blue-700/60',
    accentTextLight: 'text-blue-900',
    accentTextDark: 'text-blue-300',
    buttonGradient: 'from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white',
    ringColor: 'ring-blue-400',
  },
  rose: {
    id: 'rose',
    name: 'Mawar Berry (Rose Fashion)',
    badge: 'Butik & Estetik',
    primaryHex: '#f43f5e',
    darkHex: '#be123c',
    accentBgLight: 'bg-rose-50',
    accentBgDark: 'bg-rose-950/40',
    accentBorderLight: 'border-rose-300',
    accentBorderDark: 'border-rose-700/60',
    accentTextLight: 'text-rose-900',
    accentTextDark: 'text-rose-300',
    buttonGradient: 'from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white',
    ringColor: 'ring-rose-400',
  },
  purple: {
    id: 'purple',
    name: 'Ungu Mewah (Amethyst)',
    badge: 'Premium Luxury',
    primaryHex: '#a855f7',
    darkHex: '#7e22ce',
    accentBgLight: 'bg-purple-50',
    accentBgDark: 'bg-purple-950/40',
    accentBorderLight: 'border-purple-300',
    accentBorderDark: 'border-purple-700/60',
    accentTextLight: 'text-purple-900',
    accentTextDark: 'text-purple-300',
    buttonGradient: 'from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white',
    ringColor: 'ring-purple-400',
  },
  slate: {
    id: 'slate',
    name: 'Onyx Slate (Monokrom)',
    badge: 'Minimalis Elegan',
    primaryHex: '#64748b',
    darkHex: '#334155',
    accentBgLight: 'bg-slate-100',
    accentBgDark: 'bg-slate-800/80',
    accentBorderLight: 'border-slate-300',
    accentBorderDark: 'border-slate-700',
    accentTextLight: 'text-slate-900',
    accentTextDark: 'text-slate-200',
    buttonGradient: 'from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white',
    ringColor: 'ring-slate-400',
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  effectiveMode: 'light' | 'dark';
  devicePrefersDark: boolean;
  palette: ThemePalette;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  toggleThemeMode: () => void;
  isThemeModalOpen: boolean;
  openThemeModal: () => void;
  closeThemeModal: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage (per-device)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    const saved = localStorage.getItem('stz_theme_mode') as ThemeMode;
    return saved === 'light' || saved === 'dark' || saved === 'auto' ? saved : 'auto';
  });

  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    if (typeof window === 'undefined') return 'amber';
    const saved = localStorage.getItem('stz_theme_color') as ThemeColor;
    return saved && THEME_PALETTES[saved] ? saved : 'amber';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // 2. Real-time Device System Scheme Detection (prefers-color-scheme)
  const [devicePrefersDark, setDevicePrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setDevicePrefersDark(e.matches);
    };

    try {
      mql.addEventListener('change', handleChange);
    } catch {
      // Legacy Safari / Older Android browsers fallback
      mql.addListener(handleChange);
    }

    return () => {
      try {
        mql.removeEventListener('change', handleChange);
      } catch {
        mql.removeListener(handleChange);
      }
    };
  }, []);

  // 3. Determine Effective Mode (Resolved for this device)
  const effectiveMode: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'auto') {
      return devicePrefersDark ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, devicePrefersDark]);

  // 4. Active Palette Object
  const palette = useMemo(() => {
    return THEME_PALETTES[themeColor] || THEME_PALETTES.amber;
  }, [themeColor]);

  // 5. Apply to HTML DOM, attributes, and Meta theme-color
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    // Toggle dark class
    if (effectiveMode === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    // Set data attributes for easy CSS styling
    root.setAttribute('data-theme-mode', effectiveMode);
    root.setAttribute('data-theme-color', themeColor);
    root.setAttribute('data-theme-preference', themeMode);

    // Update mobile browser top bar color (<meta name="theme-color">)
    let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    if (effectiveMode === 'dark') {
      metaThemeColor.setAttribute('content', '#090d16');
    } else {
      // Light mode colors matching palette
      const lightThemeColors: Record<ThemeColor, string> = {
        amber: '#FEFCE8',
        emerald: '#F0FDF4',
        blue: '#EFF6FF',
        rose: '#FFF1F2',
        purple: '#FAF5FF',
        slate: '#F8FAFC',
      };
      metaThemeColor.setAttribute('content', lightThemeColors[themeColor] || '#FEFCE8');
    }
  }, [effectiveMode, themeColor, themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('stz_theme_mode', mode);
    } catch (e) {
      console.warn('Could not save theme mode to localStorage', e);
    }
  };

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    try {
      localStorage.setItem('stz_theme_color', color);
    } catch (e) {
      console.warn('Could not save theme color to localStorage', e);
    }
  };

  const toggleThemeMode = () => {
    if (themeMode === 'auto') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('light');
    } else {
      setThemeMode('auto');
    }
  };

  const openThemeModal = () => setIsThemeModalOpen(true);
  const closeThemeModal = () => setIsThemeModalOpen(false);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themeColor,
        effectiveMode,
        devicePrefersDark,
        palette,
        setThemeMode,
        setThemeColor,
        toggleThemeMode,
        isThemeModalOpen,
        openThemeModal,
        closeThemeModal,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
