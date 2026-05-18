import type { Metadata } from 'next';
import ThemeProvider from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIVRES — Levantamento Técnico',
  description: 'Sistema de Levantamento Técnico',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
