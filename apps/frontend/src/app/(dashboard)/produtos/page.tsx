'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Search, Pencil, Trash2, AlertTriangle, Upload } from 'lucide-react';
import { useRef } from 'react';
import { api } from '@/lib/api/client';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { useDebounce } from 'use-debounce';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ codigo: '', descricao: '', custo: '' });
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.get('/produtos', { params: { search: debouncedSearch } })
      .then((res: any) => setProdutos(Array.isArray(res) ? res : res?.items ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ codigo: '', descricao: '', custo: '' });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ codigo: p.codigo, descricao: p.descricao, custo: String(p.custo) });
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, custo: parseFloat(form.custo) };
      if (editing) {
        await api.patch(`/produtos/${editing.id}`, payload);
        toast.success('Produto atualizado');
      } else {
        await api.post('/produtos', payload);
        toast.success('Produto criado');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res: any = await api.post('/produtos/importar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${res.importados ?? res.total ?? 'Produtos'} produto(s) importado(s)`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao importar planilha');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const excluir = async (id: string) => {
    try {
      await api.delete(`/produtos/${id}`);
      toast.success('Produto excluído');
      setConfirmId(null);
      load();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
            <p className="text-sm text-gray-500">{produtos.length} produto(s)</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={importar}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="btn-secondary py-2.5"
              title="Importar planilha Excel (colunas: CODIGO, DESCRIÇÃO, CUSTO)"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">{importing ? 'Importando...' : 'Importar'}</span>
            </button>
            <button onClick={openCreate} className="btn-primary py-2.5">
              <Plus size={18} />
              <span className="hidden sm:inline">Novo</span>
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="search"
            placeholder="Buscar por código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-2.5"
          />
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-1 shrink-0">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </SkeletonCard>
        ))}

        {!loading && !produtos.length && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Package size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum produto cadastrado</p>
          </div>
        )}

        <div className="space-y-2">
          {produtos.map((p: any) => (
            <div key={p.id} className={clsx('card flex items-center gap-4', !p.ativo && 'opacity-50')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {p.codigo}
                  </span>
                  {!p.ativo && <span className="text-xs text-gray-400">(inativo)</span>}
                </div>
                <p className="font-medium text-gray-900 truncate">{p.descricao}</p>
                <p className="text-sm text-gray-500">
                  R$ {Number(p.custo).toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-brand-700 min-h-0">
                  <Pencil size={16} />
                </button>
                <button onClick={() => setConfirmId(p.id)} className="p-2 text-gray-400 hover:text-red-600 min-h-0">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Código</label>
                <input className="input" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
              </div>
              <div>
                <label className="label">Descrição</label>
                <input className="input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <label className="label">Custo (R$)</label>
                <input className="input" type="number" step="0.01" value={form.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })} />
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

      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 text-red-500" size={40} />
            <h2 className="text-lg font-bold mb-2">Excluir produto?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => excluir(confirmId)} className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
