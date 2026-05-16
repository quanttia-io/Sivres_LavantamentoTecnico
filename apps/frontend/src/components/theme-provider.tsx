'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme.store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dark = useThemeStore((s) => s.dark);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  return <>{children}</>;
}
