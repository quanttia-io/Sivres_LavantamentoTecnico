'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Settings, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/sidebar';
import BottomNav from '@/components/layout/bottom-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated()) return null;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top header */}
        <header
          className="hidden md:flex items-center justify-between px-6 py-4 shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Bem-vindo de volta,
            </p>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              {user?.name ?? 'Usuário'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 rounded-lg min-h-0"
              style={{ background: 'var(--surface-hover)' }}
            >
              <Bell size={18} style={{ color: 'var(--text-muted)' }} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            </button>
            <button
              className="p-2 rounded-lg min-h-0"
              style={{ background: 'var(--surface-hover)' }}
            >
              <Settings size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
            <Link
              href="/vistorias/nova"
              className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 min-h-0"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Plus size={15} />
              Nova Vistoria
            </Link>
          </div>
        </header>

        {/* Announcement bar */}
        <div
          className="hidden md:flex items-center justify-center py-1.5 px-6 text-xs font-medium shrink-0"
          style={{ background: 'linear-gradient(90deg, #1e3a8a, #2563eb, #1e3a8a)', color: '#bfdbfe' }}
        >
          SIVRES — Sistema de Levantamento Técnico · Portaria Remota · Servis Soluções
        </div>

        {/* Page content */}
        <main className="flex-1 flex flex-col pb-16 md:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
