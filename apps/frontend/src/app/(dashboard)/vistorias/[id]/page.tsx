'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vistoriasApi } from '@/lib/api/vistorias';
import FotoUpload from '@/components/vistoria/foto-upload';
import SignaturePad from '@/components/vistoria/signature-pad';
import toast from 'react-hot-toast';
import { ChevronLeft, Download, Send, CheckCircle, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';

const TABS = ['Dados', 'Produtos', 'Checklist', 'Fotos', 'Anexos', 'Assinaturas', 'Aprovação'];

export default function VistoriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [vistoria, setVistoria] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    vistoriasApi.buscar(id).then((v: any) => setVistoria(v)).finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // Acquire edit lock
    vistoriasApi.adquirirLock(id).catch(() => {});
    return () => { vistoriasApi.liberarLock(id).catch(() => {}); };
  }, [id]);

  const handleFotoUpload = async (file: File, categoria: string, descricao?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('categoria', categoria);
    if (descricao) fd.append('descricao', descricao);
    await vistoriasApi.uploadFoto(id, fd);
    reload();
  };

  const handleFotoRemove = async (fotoId: string) => {
    await vistoriasApi.removerFoto(id, fotoId);
    reload();
  };

  const handleAssinatura = async (tipo: 'SUPERVISOR' | 'CONSULTOR', base64Png: string) => {
    try {
      await vistoriasApi.salvarAssinatura(id, { tipo, base64Png });
      toast.success('Assinatura salva');
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar assinatura');
    }
  };

  const handleFinalizar = async () => {
    try {
      await vistoriasApi.finalizar(id);
      toast.success('Vistoria enviada para aprovação!');
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao finalizar vistoria');
    }
  };

  const handleAprovar = async (acao: string, comentario: string) => {
    try {
      await vistoriasApi.aprovar(id, { acao, comentario });
      toast.success(`Vistoria ${acao === 'APROVADO' ? 'aprovada' : 'reprovada'} com sucesso`);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro');
    }
  };

  const handleGerarPdf = async () => {
    try {
      const blob = await vistoriasApi.gerarPdf(id) as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vistoria-${vistoria.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao gerar PDF');
    }
  };

  const checklistCompleto = vistoria?.checklist?.every(
    (item: any) => !item.checklistTemplate.obrigatorio || item.resposta !== null,
  );

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500">Carregando...</div>;
  if (!vistoria) return <div className="flex-1 flex items-center justify-center text-gray-500">Vistoria não encontrada</div>;

  const isApproved = vistoria.status === 'APROVADO';
  const canEdit = !isApproved || user?.role === 'GESTOR' || user?.role === 'ADMINISTRADOR';
  const canApprove = (user?.role === 'GESTOR' || user?.role === 'ADMINISTRADOR') && vistoria.status === 'AGUARDANDO_APROVACAO';

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="btn-secondary py-2 px-3 min-h-0">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                {vistoria.numero}
              </span>
              <StatusBadge status={vistoria.status} />
            </div>
            <p className="font-bold text-gray-900 truncate">{vistoria.condominio?.nome}</p>
          </div>
          <button onClick={handleGerarPdf} className="btn-secondary py-2 px-3 min-h-0" title="Gerar PDF">
            <Download size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-0.5 -mx-4 px-4 scrollbar-hide">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={clsx(
                'whitespace-nowrap px-3 py-2 text-xs font-medium rounded-lg transition-colors min-h-0',
                activeTab === i ? 'bg-brand-700 text-white' : 'text-gray-500 hover:bg-gray-100',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-2xl w-full mx-auto space-y-4">
        {/* Tab 0 — Dados */}
        {activeTab === 0 && (
          <div className="space-y-3">
            <InfoCard title="Condomínio">
              <InfoRow label="Nome" value={vistoria.condominio?.nome} />
              <InfoRow label="Endereço" value={vistoria.condominio?.endereco} />
              <InfoRow label="Cidade/UF" value={`${vistoria.condominio?.cidade}/${vistoria.condominio?.estado}`} />
              <InfoRow label="Tipo" value={vistoria.tipoPortaria} />
            </InfoCard>
            <InfoCard title="Operacional">
              <InfoRow label="Unidades" value={vistoria.qtdUnidades ?? '-'} />
              <InfoRow label="Portões Veiculares" value={vistoria.qtdPortoesVeiculares ?? '-'} />
              <InfoRow label="Portões Pedestres" value={vistoria.qtdPortoesPedestres ?? '-'} />
              <InfoRow label="Elevadores" value={vistoria.qtdElevadores ?? '-'} />
              <InfoRow label="Lixeira" value={vistoria.possuiLixeira ? 'Sim' : 'Não'} />
            </InfoCard>
            <InfoCard title="Responsáveis">
              <InfoRow label="Supervisor" value={vistoria.supervisor?.name} />
              <InfoRow label="Consultor" value={vistoria.consultor?.name} />
            </InfoCard>

            {vistoria.status === 'EM_ANDAMENTO' && canEdit && (
              <button onClick={handleFinalizar} className="btn-primary w-full">
                <Send size={18} />
                Finalizar e Enviar para Aprovação
              </button>
            )}
          </div>
        )}

        {/* Tab 1 — Produtos */}
        {activeTab === 1 && (
          <div className="card overflow-x-auto">
            <h3 className="font-semibold text-gray-800 mb-3">Equipamentos Previstos</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 text-gray-500 font-medium">Código</th>
                  <th className="pb-2 text-gray-500 font-medium">Descrição</th>
                  <th className="pb-2 text-gray-500 font-medium text-center">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {vistoria.itens?.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5 font-mono text-xs text-brand-700">{item.produto.codigo}</td>
                    <td className="py-2.5">{item.produto.descricao}</td>
                    <td className="py-2.5 text-center font-semibold">{item.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!vistoria.itens?.length && (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum produto adicionado</p>
            )}
          </div>
        )}

        {/* Tab 2 — Checklist */}
        {activeTab === 2 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Checklist Operacional</h3>
              {checklistCompleto && (
                <span className="text-green-600 text-xs flex items-center gap-1">
                  <CheckCircle size={14} /> Completo
                </span>
              )}
            </div>
            {vistoria.checklist?.map((item: any) => (
              <ChecklistItem
                key={item.id}
                item={item}
                disabled={!canEdit}
                onChange={async (resposta: boolean, observacao?: string) => {
                  await vistoriasApi.responderChecklist(id, {
                    checklistTemplateId: item.checklistTemplateId,
                    resposta,
                    observacao,
                  });
                  reload();
                }}
              />
            ))}
          </div>
        )}

        {/* Tab 3 — Fotos */}
        {activeTab === 3 && (
          <FotoUpload
            fotos={vistoria.fotos ?? []}
            onUpload={handleFotoUpload}
            onRemove={handleFotoRemove}
          />
        )}

        {/* Tab 5 — Assinaturas */}
        {activeTab === 5 && (
          <div className="space-y-4">
            <SignaturePad
              label="Assinatura do Supervisor"
              onSave={(base64) => handleAssinatura('SUPERVISOR', base64)}
              savedUrl={vistoria.assinaturas?.find((a: any) => a.tipo === 'SUPERVISOR')?.url}
            />
            <SignaturePad
              label="Assinatura do Consultor"
              onSave={(base64) => handleAssinatura('CONSULTOR', base64)}
              savedUrl={vistoria.assinaturas?.find((a: any) => a.tipo === 'CONSULTOR')?.url}
            />
          </div>
        )}

        {/* Tab 6 — Aprovação */}
        {activeTab === 6 && (
          <div className="space-y-4">
            {canApprove && <AprovacaoForm onAprovar={handleAprovar} />}
            <div className="space-y-2">
              {vistoria.aprovacoes?.map((a: any) => (
                <div key={a.id} className="card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{a.user.name}</span>
                    <span className={clsx('badge', a.acao === 'APROVADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                      {a.acao}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{a.comentario}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    EM_ANDAMENTO: 'bg-yellow-100 text-yellow-800',
    AGUARDANDO_APROVACAO: 'bg-blue-100 text-blue-800',
    APROVADO: 'bg-green-100 text-green-800',
    REPROVADO: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    EM_ANDAMENTO: 'Em andamento',
    AGUARDANDO_APROVACAO: 'Aguard. aprovação',
    APROVADO: 'Aprovado',
    REPROVADO: 'Reprovado',
  };
  return <span className={clsx('badge', map[status])}>{labels[status] ?? status}</span>;
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{String(value ?? '-')}</span>
    </div>
  );
}

function ChecklistItem({ item, disabled, onChange }: any) {
  const [obs, setObs] = useState(item.observacao ?? '');

  return (
    <div className="card">
      <p className="text-sm font-medium text-gray-800 mb-3">{item.checklistTemplate.pergunta}</p>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => !disabled && onChange(true, obs)}
          className={clsx(
            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border',
            item.resposta === true
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-white text-gray-600 border-gray-300',
          )}
        >
          Sim
        </button>
        <button
          onClick={() => !disabled && onChange(false, obs)}
          className={clsx(
            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border',
            item.resposta === false
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-gray-600 border-gray-300',
          )}
        >
          Não
        </button>
      </div>
      <input
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        onBlur={() => item.resposta !== null && onChange(item.resposta, obs)}
        disabled={disabled}
        placeholder="Observação (opcional)"
        className="input text-xs py-2"
      />
    </div>
  );
}

function AprovacaoForm({ onAprovar }: { onAprovar: (acao: string, comentario: string) => void }) {
  const [comentario, setComentario] = useState('');

  return (
    <div className="card border-2 border-blue-200">
      <h3 className="font-semibold text-gray-800 mb-3">Decisão de Aprovação</h3>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Comentário obrigatório (mínimo 10 caracteres)..."
        rows={3}
        className="input resize-none mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={() => comentario.length >= 10 && onAprovar('APROVADO', comentario)}
          disabled={comentario.length < 10}
          className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle size={18} /> Aprovar
        </button>
        <button
          onClick={() => comentario.length >= 10 && onAprovar('REPROVADO', comentario)}
          disabled={comentario.length < 10}
          className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <XCircle size={18} /> Reprovar
        </button>
      </div>
    </div>
  );
}
