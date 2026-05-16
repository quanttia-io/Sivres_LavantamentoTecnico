'use client';

import { useEffect, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from 'use-debounce';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);

  useEffect(() => {
    setLoading(true);
    api.get('/audit-logs', { params: { search: debouncedSearch } })
      .then((res: any) => setLogs(Array.isArray(res) ? res : res?.items ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Auditoria</h1>
          <p className="text-sm text-gray-500">Histórico de ações no sistema</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="search"
            placeholder="Buscar por ação, entidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-2.5"
          />
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {loading && Array.from({ length: 7 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-3 w-16 shrink-0" />
          </SkeletonCard>
        ))}

        {!loading && !logs.length && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <FileText size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum registro encontrado</p>
          </div>
        )}

        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                      {log.acao}
                    </span>
                    <span className="text-xs text-gray-500">{log.entidade}</span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">
                    <span className="font-medium">{log.user?.name ?? log.userId}</span>
                  </p>
                  {log.vistoriaId && (
                    <p className="text-xs text-gray-400 mt-0.5">Vistoria: {log.vistoriaId}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {format(new Date(log.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
