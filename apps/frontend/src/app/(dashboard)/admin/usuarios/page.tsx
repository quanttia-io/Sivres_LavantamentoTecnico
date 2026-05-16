'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/lib/api/client';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  GESTOR: 'Gestor',
  SUPERVISOR: 'Supervisor',
  CONSULTOR: 'Consultor',
};

const ROLE_CLASS: Record<string, string> = {
  ADMINISTRADOR: 'bg-purple-100 text-purple-800',
  GESTOR: 'bg-blue-100 text-blue-800',
  SUPERVISOR: 'bg-orange-100 text-orange-800',
  CONSULTOR: 'bg-gray-100 text-gray-700',
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CONSULTOR' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users').then((res: any) => setUsers(res)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'CONSULTOR' });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const payload: any = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editing.id}`, payload);
        toast.success('Usuário atualizado');
      } else {
        await api.post('/users', form);
        toast.success('Usuário criado');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (u: any) => {
    try {
      await api.patch(`/users/${u.id}`, { active: !u.active });
      toast.success(u.active ? 'Usuário desativado' : 'Usuário ativado');
      load();
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
            <p className="text-sm text-gray-500">{users.length} usuário(s) cadastrado(s)</p>
          </div>
          <button onClick={openCreate} className="btn-primary py-2.5">
            <Plus size={18} />
            <span className="hidden sm:inline">Novo Usuário</span>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="search"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-2.5"
          />
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i}>
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full shrink-0 hidden sm:block" />
            <div className="flex gap-1 shrink-0">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </SkeletonCard>
        ))}

        {!loading && !filtered.length && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Users size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum usuário encontrado</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-700 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('font-semibold', !u.active && 'line-through text-gray-400')}>
                  {u.name}
                </p>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
              </div>
              <span className={clsx('badge hidden sm:inline-flex', ROLE_CLASS[u.role])}>
                {ROLE_LABEL[u.role]}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleAtivo(u)}
                  className="p-2 text-gray-400 hover:text-brand-700 min-h-0"
                  title={u.active ? 'Desativar' : 'Ativar'}
                >
                  {u.active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-brand-700 min-h-0">
                  <Pencil size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nome</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">{editing ? 'Nova senha (deixe em branco para manter)' : 'Senha'}</label>
                <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="label">Perfil</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="CONSULTOR">Consultor</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="GESTOR">Gestor</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
