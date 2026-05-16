'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  ClipboardList, Package, LayoutTemplate, Users, Trash2,
  LogOut, FileText, Sun, Moon, Cog, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useRouter } from 'next/navigation';

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { href: '/vistorias', label: 'Vistorias', icon: ClipboardList, roles: ['SUPERVISOR', 'CONSULTOR', 'GESTOR', 'ADMINISTRADOR'] },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { href: '/produtos',        label: 'Produtos',   icon: Package,        roles: ['ADMINISTRADOR'] },
      { href: '/templates',       label: 'Templates',  icon: LayoutTemplate, roles: ['ADMINISTRADOR'] },
    ],
  },
  {
    label: 'Administração',
    items: [
      { href: '/admin/usuarios',  label: 'Usuários',   icon: Users,    roles: ['ADMINISTRADOR'] },
      { href: '/admin/lixeira',   label: 'Lixeira',    icon: Trash2,   roles: ['ADMINISTRADOR'] },
      { href: '/admin/auditoria', label: 'Auditoria',  icon: FileText, roles: ['ADMINISTRADOR'] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();

  const handleLogout = () => { logout(); router.replace('/login'); };

  return (
    <aside
      className="hidden md:flex flex-col w-56 min-h-screen shrink-0"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f97316' }}>
          <Cog size={16} style={{ color: '#1e3a8a' }} />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>SIVRES</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Levantamento Técnico</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_GROUPS.map((group) => {
          const allowed = group.items.filter((i) => user && i.roles.includes(user.role));
          if (!allowed.length) return null;
          return (
            <div key={group.label}>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1.5 px-3"
                style={{ color: 'var(--border)', letterSpacing: '0.1em' }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {allowed.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={
                        active
                          ? { background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', borderLeft: '2px solid var(--accent)' }
                          : { color: 'var(--text-muted)' }
                      }
                    >
                      <Icon size={16} />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight size={13} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all min-h-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
          {dark ? 'Modo claro' : 'Modo escuro'}
        </button>

        {/* User card + logout */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: '#1e3a8a', color: '#60a5fa' }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="shrink-0 p-1.5 rounded-lg transition-all min-h-0"
            style={{ color: '#94a3b8' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#7f1d1d33'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
