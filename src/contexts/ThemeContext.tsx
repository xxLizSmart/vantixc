import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function safeLocalStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeMatchMedia(query: string): boolean {
  try { return window.matchMedia(query).matches; } catch { return false; }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = safeLocalStorage('vantix-theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    // Vantix is dark-first — default to dark unless OS explicitly prefers light
    return safeMatchMedia('(prefers-color-scheme: light)') ? 'light' : 'dark';
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('vantix-theme', theme);
    } catch { /* localStorage blocked in some iframe contexts */ }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
