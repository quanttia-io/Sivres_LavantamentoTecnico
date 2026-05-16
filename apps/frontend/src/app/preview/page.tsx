'use client';

import { useState } from 'react';
import {
  ClipboardList, Package, LayoutTemplate, Users, Trash2, FileText,
  Cog, LogOut, Bell, Plus, Search, Filter, ChevronRight,
  TrendingUp, CheckCircle, Clock, XCircle, Home, Settings,
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Paleta ──────────────────────────────────────────────
// bg principal:    #0b0f1e
// bg sidebar:      #0d1120
// bg card:         #131929
// bg card hover:   #1a2236
// border:          #1e2d45
// accent blue:     #3b82f6
// accent glow:     #2563eb
// text primary:    #e2e8f0
// text secondary:  #64748b

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { icon: ClipboardList, label: 'Vistorias', active: true },
      { icon: Package, label: 'Produtos', active: false },
      { icon: LayoutTemplate, label: 'Templates', active: false },
    ],
  },
  {
    label: 'Administração',
    items: [
      { icon: Users, label: 'Usuários', active: false },
      { icon: Trash2, label: 'Lixeira', active: false },
      { icon: FileText, label: 'Auditoria', active: false },
    ],
  },
];

const STATS = [
  { label: 'Total de Vistorias', value: '1.284', icon: ClipboardList, color: '#3b82f6', bg: '#1e3a8a22' },
  { label: 'Em Andamento', value: '47', icon: Clock, color: '#f59e0b', bg: '#78350f22' },
  { label: 'Taxa de Aprovação', value: '94%', icon: TrendingUp, color: '#10b981', bg: '#06472622' },
  { label: 'Aprovadas (mês)', value: '312', icon: CheckCircle, color: '#8b5cf6', bg: '#4c1d9522' },
];

const VISTORIAS = [
  { numero: '2026-0041', condominio: 'Residencial Bosque das Flores', cidade: 'Fortaleza', status: 'EM_ANDAMENTO', tipo: 'ASSISTIDA', data: '15/05/2026' },
  { numero: '2026-0040', condominio: 'Condomínio Serra Verde', cidade: 'Caucaia', status: 'AGUARDANDO_APROVACAO', tipo: 'AUTONOMA', data: '14/05/2026' },
  { numero: '2026-0039', condominio: 'Portal do Sol', cidade: 'Maracanaú', status: 'APROVADO', tipo: 'CONTROLE_ACESSO', data: '13/05/2026' },
  { numero: '2026-0038', condominio: 'Villa Jardins', cidade: 'Fortaleza', status: 'REPROVADO', tipo: 'ASSISTIDA', data: '12/05/2026' },
  { numero: '2026-0037', condominio: 'Morada do Vale', cidade: 'Eusébio', status: 'APROVADO', tipo: 'AUTONOMA', data: '11/05/2026' },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  EM_ANDAMENTO:        { label: 'Em andamento',      color: '#f59e0b', bg: '#78350f33' },
  AGUARDANDO_APROVACAO:{ label: 'Aguard. aprovação', color: '#3b82f6', bg: '#1e3a8a33' },
  APROVADO:            { label: 'Aprovado',           color: '#10b981', bg: '#06472633' },
  REPROVADO:           { label: 'Reprovado',          color: '#ef4444', bg: '#7f1d1d33' },
};

const TIPO_LABEL: Record<string, string> = {
  ASSISTIDA: 'Assistida', AUTONOMA: 'Autônoma', CONTROLE_ACESSO: 'Ctrl. Acesso',
};

export default function PreviewPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0b0f1e', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>

      {/* ── SIDEBAR ───────────────────────────────────────── */}
      <aside className="flex flex-col w-56 shrink-0 border-r" style={{ background: '#0d1120', borderColor: '#1e2d45' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: '#1e2d45' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f97316' }}>
            <Cog size={16} style={{ color: '#1e3a8a' }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: '#e2e8f0' }}>SIVRES</p>
            <p className="text-xs" style={{ color: '#475569' }}>Levantamento Técnico</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-2" style={{ color: '#334155' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                    style={item.active
                      ? { background: '#1e3a8a33', color: '#60a5fa', borderLeft: '2px solid #3b82f6' }
                      : { color: '#64748b' }}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t" style={{ borderColor: '#1e2d45' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: '#131929' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: '#1e3a8a', color: '#60a5fa' }}>
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#e2e8f0' }}>Admin</p>
              <p className="text-xs truncate" style={{ color: '#475569' }}>ADMINISTRADOR</p>
            </div>
            <LogOut size={14} style={{ color: '#475569' }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top header */}
        <header className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ background: '#0d1120', borderColor: '#1e2d45' }}>
          <div>
            <p className="text-xs font-medium" style={{ color: '#475569' }}>Bem-vindo de volta,</p>
            <h1 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>Administrador</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg" style={{ background: '#131929' }}>
              <Bell size={18} style={{ color: '#64748b' }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
            </button>
            <button className="p-2 rounded-lg" style={{ background: '#131929' }}>
              <Settings size={18} style={{ color: '#64748b' }} />
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ background: '#3b82f6', color: '#fff' }}>
              <Plus size={15} />
              Nova Vistoria
            </button>
          </div>
        </header>

        {/* Announcement bar */}
        <div className="flex items-center justify-center py-2 px-6 text-xs font-medium" style={{ background: 'linear-gradient(90deg, #1e3a8a, #2563eb, #1e3a8a)', color: '#bfdbfe' }}>
          SIVRES — Sistema de Levantamento Técnico · Portaria Remota · Servis Soluções
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl p-4 border" style={{ background: '#131929', borderColor: '#1e2d45' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium" style={{ color: '#64748b' }}>{s.label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                    <s.icon size={16} style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search + filter bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por condomínio, número..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: '#131929', border: '1px solid #1e2d45', color: '#e2e8f0' }}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ background: '#131929', border: '1px solid #1e2d45', color: '#64748b' }}>
              <Filter size={15} /> Filtrar
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border overflow-hidden" style={{ background: '#131929', borderColor: '#1e2d45' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e2d45' }}>
              <p className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Vistorias Recentes</p>
              <button className="text-xs flex items-center gap-1" style={{ color: '#3b82f6' }}>
                Ver todas <ChevronRight size={13} />
              </button>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-12 px-5 py-3 text-xs font-semibold uppercase tracking-wide border-b" style={{ color: '#334155', borderColor: '#1e2d45' }}>
              <span className="col-span-2">Número</span>
              <span className="col-span-4">Condomínio</span>
              <span className="col-span-2">Cidade</span>
              <span className="col-span-2">Tipo</span>
              <span className="col-span-1">Data</span>
              <span className="col-span-1 text-right">Status</span>
            </div>

            {/* Rows */}
            {VISTORIAS.filter((v) =>
              v.condominio.toLowerCase().includes(search.toLowerCase()) ||
              v.numero.includes(search)
            ).map((v, i) => {
              const st = STATUS_CFG[v.status];
              return (
                <div
                  key={v.numero}
                  className="grid grid-cols-12 items-center px-5 py-3.5 text-sm transition-colors cursor-pointer border-b last:border-0"
                  style={{
                    borderColor: '#1e2d45',
                    background: i % 2 === 0 ? 'transparent' : '#0f1525',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1a2236')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#0f1525')}
                >
                  <span className="col-span-2 font-mono text-xs font-semibold" style={{ color: '#60a5fa' }}>{v.numero}</span>
                  <span className="col-span-4 font-medium truncate" style={{ color: '#e2e8f0' }}>{v.condominio}</span>
                  <span className="col-span-2 text-xs" style={{ color: '#64748b' }}>{v.cidade}</span>
                  <span className="col-span-2 text-xs" style={{ color: '#94a3b8' }}>{TIPO_LABEL[v.tipo]}</span>
                  <span className="col-span-1 text-xs" style={{ color: '#475569' }}>{v.data}</span>
                  <span className="col-span-1 flex justify-end">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

        </main>
      </div>

      {/* ── Preview badge ─────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 px-4 py-2 rounded-full text-xs font-semibold" style={{ background: '#3b82f6', color: '#fff' }}>
        Preview — novo design
      </div>
    </div>
  );
}
