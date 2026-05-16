'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, Plus, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => { logout(); router.replace('/login'); };

  const items = [
    { href: '/vistorias', label: 'Vistorias', icon: ClipboardList },
    { href: '/vistorias/nova', label: 'Nova', icon: Plus, highlight: true },
    { href: '/notificacoes', label: 'Alertas', icon: Bell },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 md:hidden z-50 safe-area-pb"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/vistorias/nova' && pathname.startsWith(item.href));

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg -translate-y-3" style={{ background: 'var(--accent)' }}>
                  <Icon style={{ color: '#fff' }} size={22} />
                </div>
                <span className="text-xs -mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-h-0"
              style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-h-0"
          style={{ color: '#f87171' }}
        >
          <LogOut size={22} />
          <span className="text-xs font-medium">Sair</span>
        </button>
      </div>
    </nav>
  );
}
