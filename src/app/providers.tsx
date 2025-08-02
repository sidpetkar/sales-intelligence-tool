'use client';

import { ThemeProvider } from "../contexts/ThemeContext";
import { MockDataProvider } from '../contexts/MockDataContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MockDataProvider>
        {children}
      </MockDataProvider>
    </ThemeProvider>
  );
} 