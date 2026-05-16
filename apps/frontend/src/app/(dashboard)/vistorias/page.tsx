'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { Search, Plus, Filter, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';
import { vistoriasApi } from '@/lib/api/vistorias';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  EM_ANDAMENTO: { label: 'Em andamento', class: 'bg-yellow-100 text-yellow-800' },
  AGUARDANDO_APROVACAO: { label: 'Aguardando aprovação', class: 'bg-blue-100 text-blue-800' },
  APROVADO: { label: 'Aprovado', class: 'bg-green-100 text-green-800' },
  REPROVADO: { label: 'Reprovado', class: 'bg-red-100 text-red-800' },
};

const TIPO_LABEL: Record<string, string> = {
  ASSISTIDA: 'Assistida',
  AUTONOMA: 'Autônoma',
  CONTROLE_ACESSO: 'Ctrl. Acesso',
};

export default function VistoriasPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    vistoriasApi
      .listar({ search: debouncedSearch, status: statusFilter || undefined })
      .then((res: any) => setData(res))
      .finally(() => setLoading(false));
  }, [debouncedSearch, statusFilter]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vistorias</h1>
            <p className="text-sm text-gray-500">
              {data ? `${data.total} vistoria(s) encontrada(s)` : '...'}
            </p>
          </div>
          <Link href="/vistorias/nova" className="btn-primary py-2.5">
            <Plus size={18} />
            <span className="hidden sm:inline">Nova Vistoria</span>
          </Link>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="search"
              placeholder="Buscar por condomínio, número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 py-2.5"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto py-2.5 min-w-[140px]"
          >
            <option value="">Todos</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="AGUARDANDO_APROVACAO">Aguard. aprovação</option>
            <option value="APROVADO">Aprovado</option>
            <option value="REPROVADO">Reprovado</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-4 md:p-6 space-y-3">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full shrink-0" />
          </SkeletonCard>
        ))}

        {!loading && (!data?.items?.length) && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhuma vistoria encontrada</p>
            <p className="text-sm mt-1">Crie uma nova vistoria para começar</p>
            <Link href="/vistorias/nova" className="btn-primary mt-6">
              <Plus size={18} />
              Nova Vistoria
            </Link>
          </div>
        )}

        {data?.items?.map((v: any) => {
          const statusCfg = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG];
          return (
            <Link key={v.id} href={`/vistorias/${v.id}`}>
              <div className="card hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                        {v.numero}
                      </span>
                      <span className="text-xs text-gray-400">
                        {TIPO_LABEL[v.tipoPortaria] ?? v.tipoPortaria}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{v.condominio?.nome}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {v.condominio?.cidade}/{v.condominio?.estado}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {v.supervisor?.name} ·{' '}
                      {format(new Date(v.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <span className={clsx('badge whitespace-nowrap', statusCfg?.class)}>
                    {statusCfg?.label ?? v.status}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
