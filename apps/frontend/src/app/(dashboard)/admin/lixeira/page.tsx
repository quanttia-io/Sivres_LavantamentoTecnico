'use client';

import { useEffect, useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function LixeiraPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/lixeira').then((res: any) => setItems(Array.isArray(res) ? res : res?.items ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const recuperar = async (id: string) => {
    try {
      await api.post(`/lixeira/${id}/recuperar`);
      toast.success('Vistoria recuperada');
      load();
    } catch {
      toast.error('Erro ao recuperar');
    }
  };

  const excluirDefinitivo = async (id: string) => {
    try {
      await api.delete(`/lixeira/${id}`);
      toast.success('Excluído permanentemente');
      setConfirmId(null);
      load();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <h1 className="text-xl font-bold text-gray-900">Lixeira</h1>
        <p className="text-sm text-gray-500">Vistorias excluídas — recupere ou exclua permanentemente</p>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex gap-1 shrink-0">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </SkeletonCard>
        ))}

        {!loading && !items.length && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Trash2 size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Lixeira vazia</p>
            <p className="text-sm mt-1">Nenhuma vistoria excluída</p>
          </div>
        )}

        <div className="space-y-2">
          {items.map((v: any) => (
            <div key={v.id} className="card flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                    {v.numero}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 truncate">{v.condominio?.nome ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Excluído em {v.deletedAt ? format(new Date(v.deletedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => recuperar(v.id)}
                  className="p-2 text-green-600 hover:text-green-700 min-h-0"
                  title="Recuperar"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => setConfirmId(v.id)}
                  className="p-2 text-red-400 hover:text-red-600 min-h-0"
                  title="Excluir permanentemente"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 text-red-500" size={40} />
            <h2 className="text-lg font-bold mb-2">Excluir permanentemente?</h2>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => excluirDefinitivo(confirmId)} className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
