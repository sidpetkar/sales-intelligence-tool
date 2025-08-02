'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light'); // Always start with light
  const [isClient, setIsClient] = useState(false);

  // Set client flag after mount to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize theme from localStorage only after client-side mount
  useEffect(() => {
    if (!isClient) return;
    
    // Get stored theme, but default to light if nothing stored
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    console.log('[ThemeContext] Initializing theme. Stored:', storedTheme);
    
    // Only use stored theme if it exists, otherwise stay with light default
    if (storedTheme) {
      setTheme(storedTheme);
    }
    
    // Apply initial theme (either stored or default light)
    const initialTheme = storedTheme || 'light';
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
    }
  }, [isClient]);

  // Apply theme changes when theme state changes
  useEffect(() => {
    console.log('[ThemeContext] Theme changed to:', theme);
    
    // Apply theme by adding/removing class on html element
    if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Log for debugging
    console.log('[ThemeContext] Applied theme:', theme);
    console.log('[ThemeContext] HTML classes:', document.documentElement.className);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    console.log('[ThemeContext] Toggle theme clicked');
    const currentHtmlClasses = document.documentElement.className;
    console.log('[ThemeContext] Current HTML classes:', currentHtmlClasses);
    
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('[ThemeContext] Changing theme from', prevTheme, 'to', newTheme);
      
      // Log the current state for debugging
      requestAnimationFrame(() => {
        console.log('[ThemeContext] After theme change, HTML classes:', document.documentElement.className);
        console.log('[ThemeContext] Body data-theme attribute:', document.body.getAttribute('data-theme'));
      });
      
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 