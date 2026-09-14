import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('ems_theme') || 'system';
    } catch (e) {
      return 'system';
    }
  });

  const getSystemTheme = useCallback(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const initialTheme = localStorage.getItem('ems_theme') || 'system';
    return initialTheme === 'system' ? getSystemTheme() : initialTheme;
  });

  const applyThemeToDOM = useCallback((targetResolvedTheme) => {
    const root = document.documentElement;
    if (targetResolvedTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, []);

  // Synchronize theme changes
  useEffect(() => {
    const targetResolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(targetResolved);
    applyThemeToDOM(targetResolved);

    try {
      localStorage.setItem('ems_theme', theme);
    } catch (e) {
      // Storage fallback
    }
  }, [theme, getSystemTheme, applyThemeToDOM]);

  // Dynamic OS Preference Listener for 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      if (theme === 'system') {
        const nextResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        applyThemeToDOM(nextResolved);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, [theme, applyThemeToDOM]);

  const setTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
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
