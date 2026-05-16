'use client';

import { useEffect, useState } from 'react';
import { LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

const TIPOS = ['ASSISTIDA', 'AUTONOMA', 'CONTROLE_ACESSO'];
const TIPO_LABEL: Record<string, string> = {
  ASSISTIDA: 'Assistida',
  AUTONOMA: 'Autônoma',
  CONTROLE_ACESSO: 'Controle de Acesso',
};

export default function TemplatesPage() {
  const [tipoSelecionado, setTipoSelecionado] = useState('ASSISTIDA');
  const [template, setTemplate] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [saving, setSaving] = useState(false);

  const loadTemplate = () => {
    setLoading(true);
    api.get(`/templates/${tipoSelecionado}`)
      .then((res: any) => setTemplate(res))
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false));
  };

  const loadProdutos = () => {
    api.get('/produtos').then((res: any) => setProdutos(Array.isArray(res) ? res : res?.items ?? []));
  };

  useEffect(() => { loadTemplate(); }, [tipoSelecionado]);
  useEffect(() => { loadProdutos(); }, []);

  const addItem = async () => {
    if (!produtoId) return toast.error('Selecione um produto');
    setSaving(true);
    try {
      await api.post(`/templates/${tipoSelecionado}/itens`, { produtoId, quantidade: parseInt(quantidade) });
      toast.success('Item adicionado');
      setShowAdd(false);
      setProdutoId('');
      setQuantidade('1');
      loadTemplate();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao adicionar');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (pId: string) => {
    try {
      await api.delete(`/templates/${tipoSelecionado}/itens/${pId}`);
      toast.success('Item removido');
      loadTemplate();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const itens = template?.itens ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Templates</h1>
            <p className="text-sm text-gray-500">Produtos padrão por tipo de portaria</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary py-2.5">
            <Plus size={18} />
            <span className="hidden sm:inline">Adicionar Item</span>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => setTipoSelecionado(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-0 ${
                tipoSelecionado === t
                  ? 'bg-brand-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {TIPO_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          </SkeletonCard>
        ))}

        {!loading && !itens.length && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <LayoutTemplate size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum item no template</p>
            <p className="text-sm mt-1">Adicione produtos padrão para {TIPO_LABEL[tipoSelecionado]}</p>
          </div>
        )}

        <div className="space-y-2">
          {itens.map((item: any) => (
            <div key={item.id} className="card flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                  {item.produto?.codigo}
                </span>
                <p className="font-medium text-gray-900 mt-1 truncate">{item.produto?.descricao}</p>
                <p className="text-sm text-gray-500">Qtd: {item.quantidade}</p>
              </div>
              <button
                onClick={() => removeItem(item.produtoId)}
                className="p-2 text-gray-400 hover:text-red-600 min-h-0 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Adicionar Item ao Template</h2>
            <p className="text-sm text-gray-500 mb-4">Tipo: {TIPO_LABEL[tipoSelecionado]}</p>
            <div className="space-y-3">
              <div>
                <label className="label">Produto</label>
                <select className="input" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {produtos.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.codigo} — {p.descricao}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantidade</label>
                <input className="input" type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={addItem} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
