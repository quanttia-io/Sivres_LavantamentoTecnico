'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vistoriasApi } from '@/lib/api/vistorias';
import FotoUpload from '@/components/vistoria/foto-upload';
import AnexoUpload from '@/components/vistoria/anexo-upload';
import SignaturePad from '@/components/vistoria/signature-pad';
import toast from 'react-hot-toast';
import { ChevronLeft, Download, Send, CheckCircle, XCircle, Loader2, Trash2, Pencil, Plus, Minus, Save, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { precificacaoApi } from '@/lib/api/configurador';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ALL_TABS = ['Dados', 'Produtos', 'Checklist', 'Fotos', 'Anexos', 'Assinaturas', 'Aprovação', 'Precificação'];

export default function VistoriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const tabs = user?.role === 'CONSULTOR'
    ? ALL_TABS.filter((t) => t !== 'Precificação')
    : ALL_TABS;

  const [vistoria, setVistoria] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Produtos edit state
  const [editandoProdutos, setEditandoProdutos] = useState(false);
  const [itensEditaveis, setItensEditaveis] = useState<any[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [salvandoProdutos, setSalvandoProdutos] = useState(false);

  // Precificação tab state
  const [precificacao, setPrecificacao] = useState<any>(null);
  const [loadingPrec, setLoadingPrec] = useState(false);
  const [precOpcoes, setPrecOpcoes] = useState({
    tipoContrato: 'COMODATO_36',
    internetPagoPor: 'EMPRESA',
    margemTipo: 'ESSENCIAL',
  });

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

  const handleAnexoUpload = async (file: File, tipo: string, nome?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('tipo', tipo);
    if (nome) fd.append('nome', nome);
    await vistoriasApi.uploadAnexo(id, fd);
    reload();
  };

  const handleAnexoRemove = async (anexoId: string) => {
    await vistoriasApi.removerAnexo(id, anexoId);
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

  const handleCalcularPreco = async () => {
    setLoadingPrec(true);
    try {
      const resultado = await precificacaoApi.calcular(id, {
        tipoContrato: precOpcoes.tipoContrato as any,
        internetPagoPor: precOpcoes.internetPagoPor as any,
        margemTipo: precOpcoes.margemTipo as any,
      });
      setPrecificacao(resultado);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao calcular precificação');
    } finally {
      setLoadingPrec(false);
    }
  };

  const iniciarEdicaoProdutos = () => {
    setItensEditaveis(vistoria.itens.map((i: any) => ({ ...i })));
    setBuscaProduto('');
    setResultadosBusca([]);
    setEditandoProdutos(true);
  };

  const cancelarEdicaoProdutos = () => {
    setEditandoProdutos(false);
    setBuscaProduto('');
    setResultadosBusca([]);
  };

  const alterarQtd = (produtoId: string, delta: number) => {
    setItensEditaveis((prev) =>
      prev.map((i) =>
        i.produto.id === produtoId ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i,
      ),
    );
  };

  const removerItemEditavel = (produtoId: string) => {
    setItensEditaveis((prev) => prev.filter((i) => i.produto.id !== produtoId));
  };

  const buscarProdutos = async (termo: string) => {
    setBuscaProduto(termo);
    if (termo.trim().length < 2) { setResultadosBusca([]); return; }
    try {
      const res = (await (await import('@/lib/api/client')).api.get('/produtos', {
        params: { search: termo, limit: 8 },
      })) as any;
      const lista = Array.isArray(res) ? res : res?.items ?? [];
      const idsAtuais = new Set(itensEditaveis.map((i: any) => i.produto.id));
      setResultadosBusca(lista.filter((p: any) => !idsAtuais.has(p.id)));
    } catch { setResultadosBusca([]); }
  };

  const adicionarProduto = (produto: any) => {
    setItensEditaveis((prev) => [
      ...prev,
      { produto, quantidade: 1 },
    ]);
    setBuscaProduto('');
    setResultadosBusca([]);
  };

  const salvarProdutos = async () => {
    setSalvandoProdutos(true);
    try {
      await vistoriasApi.updateItens(
        id,
        itensEditaveis.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      );
      toast.success('Produtos atualizados');
      setEditandoProdutos(false);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar produtos');
    } finally {
      setSalvandoProdutos(false);
    }
  };

  const handleExcluir = async () => {
    if (!window.confirm(`Deseja mover a vistoria ${vistoria.numero} para a lixeira?`)) return;
    try {
      await vistoriasApi.excluir(id);
      toast.success('Vistoria movida para a lixeira');
      router.push('/vistorias');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao excluir vistoria');
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
  const canManage = user?.role === 'GESTOR' || user?.role === 'ADMINISTRADOR';
  const canApprove = canManage && vistoria.status !== 'APROVADO';

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
          {canManage && (
            <button onClick={handleExcluir} className="btn-secondary py-2 px-3 min-h-0 text-red-600 hover:bg-red-50 hover:border-red-300" title="Mover para lixeira">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-0.5 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab, i) => (
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
        {/* Tab — Dados */}
        {tabs[activeTab] === 'Dados' && (
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

        {/* Tab — Produtos */}
        {tabs[activeTab] === 'Produtos' && (
          <div className="space-y-3">
            {!editandoProdutos ? (
              <div className="card overflow-x-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Equipamentos Previstos</h3>
                  {canEdit && (
                    <button onClick={iniciarEdicaoProdutos} className="btn-secondary py-1.5 px-3 min-h-0 text-xs flex items-center gap-1">
                      <Pencil size={14} /> Editar
                    </button>
                  )}
                </div>
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
            ) : (
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Editando Produtos</h3>
                  <div className="flex gap-2">
                    <button onClick={cancelarEdicaoProdutos} className="btn-secondary py-1.5 px-3 min-h-0 text-xs flex items-center gap-1">
                      <X size={14} /> Cancelar
                    </button>
                    <button onClick={salvarProdutos} disabled={salvandoProdutos} className="btn-primary py-1.5 px-3 min-h-0 text-xs flex items-center gap-1">
                      {salvandoProdutos ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
                    </button>
                  </div>
                </div>

                {/* Lista editável */}
                <div className="space-y-1">
                  {itensEditaveis.map((item: any) => (
                    <div key={item.produto.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                      <span className="font-mono text-xs text-brand-700 w-16 shrink-0">{item.produto.codigo}</span>
                      <span className="flex-1 text-sm truncate">{item.produto.descricao}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => alterarQtd(item.produto.id, -1)} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantidade}</span>
                        <button onClick={() => alterarQtd(item.produto.id, 1)} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100">
                          <Plus size={12} />
                        </button>
                        <button onClick={() => removerItemEditavel(item.produto.id)} className="w-7 h-7 rounded-lg border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Buscar produto */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar produto por código ou descrição..."
                    value={buscaProduto}
                    onChange={(e) => buscarProdutos(e.target.value)}
                    className="input text-sm py-2"
                  />
                  {resultadosBusca.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                      {resultadosBusca.map((p: any) => (
                        <button key={p.id} onClick={() => adicionarProduto(p)} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <span className="font-mono text-xs text-brand-700 mr-2">{p.codigo}</span>
                          <span className="text-sm">{p.descricao}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab — Checklist */}
        {tabs[activeTab] === 'Checklist' && (
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

        {/* Tab — Fotos */}
        {tabs[activeTab] === 'Fotos' && (
          <FotoUpload
            fotos={vistoria.fotos ?? []}
            onUpload={handleFotoUpload}
            onRemove={handleFotoRemove}
          />
        )}

        {/* Tab — Anexos */}
        {tabs[activeTab] === 'Anexos' && (
          <AnexoUpload
            anexos={vistoria.anexos ?? []}
            onUpload={handleAnexoUpload}
            onRemove={handleAnexoRemove}
            disabled={!canEdit}
          />
        )}

        {/* Tab — Assinaturas */}
        {tabs[activeTab] === 'Assinaturas' && (
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

        {/* Tab — Aprovação */}
        {tabs[activeTab] === 'Aprovação' && (
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

        {/* Tab — Precificação */}
        {tabs[activeTab] === 'Precificação' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Parâmetros de Precificação</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duração do Contrato</label>
                  <select
                    value={precOpcoes.tipoContrato}
                    onChange={(e) =>
                      setPrecOpcoes((p) => ({ ...p, tipoContrato: e.target.value }))
                    }
                    className="input"
                  >
                    <option value="COMODATO_36">Comodato 36 meses</option>
                    <option value="COMODATO_48">Comodato 48 meses</option>
                  </select>
                </div>
                <div>
                  <label className="label">Internet Pago Por</label>
                  <select
                    value={precOpcoes.internetPagoPor}
                    onChange={(e) =>
                      setPrecOpcoes((p) => ({ ...p, internetPagoPor: e.target.value }))
                    }
                    className="input"
                  >
                    <option value="EMPRESA">Empresa (Locktec)</option>
                    <option value="CLIENTE">Cliente</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Margem</label>
                  <select
                    value={precOpcoes.margemTipo}
                    onChange={(e) =>
                      setPrecOpcoes((p) => ({ ...p, margemTipo: e.target.value }))
                    }
                    className="input"
                  >
                    <option value="ESSENCIAL">Essencial</option>
                    <option value="COMPLETA">Completa</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleCalcularPreco}
                disabled={loadingPrec}
                className="btn-primary w-full mt-4"
              >
                {loadingPrec ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Calculando...
                  </>
                ) : (
                  'Calcular Preço'
                )}
              </button>
              {!canManage && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  Apenas gestores e administradores podem calcular.
                </p>
              )}
            </div>

            {precificacao && (
              <>
                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Resumo de Custos</h3>
                  <div className="space-y-2">
                    <InfoRow label="CAPEX Total" value={formatCurrency(precificacao.capexTotal)} />
                    <InfoRow
                      label="CAPEX Recuperável"
                      value={formatCurrency(precificacao.capexRecuperavel)}
                    />
                    <InfoRow
                      label="CAPEX Não-Recuperável"
                      value={formatCurrency(precificacao.capexNaoRecuperavel)}
                    />
                    <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
                      <InfoRow label="OPEX Local" value={formatCurrency(precificacao.opexLocal)} />
                      <InfoRow
                        label="OPEX Central"
                        value={formatCurrency(precificacao.opexCentral)}
                      />
                      <InfoRow
                        label="OPEX Mensal Total"
                        value={formatCurrency(precificacao.opexMensal)}
                      />
                    </div>
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <InfoRow label="Margem" value={formatCurrency(precificacao.margem)} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Opções Comodato</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {precificacao.opcoes
                      .filter((o: any) => o.tipo.startsWith('COMODATO'))
                      .map((o: any) => {
                        const selected = o.tipo === precOpcoes.tipoContrato;
                        return (
                          <div
                            key={o.tipo}
                            className={clsx(
                              'text-center p-4 rounded-xl border-2 cursor-pointer transition-all',
                              selected
                                ? 'border-brand-700 bg-brand-50'
                                : 'border-gray-200 hover:border-gray-300',
                            )}
                            onClick={() =>
                              setPrecOpcoes((p) => ({ ...p, tipoContrato: o.tipo }))
                            }
                          >
                            <p className="text-xs text-gray-500 mb-1 font-medium">
                              {o.meses} meses
                            </p>
                            <p
                              className={clsx(
                                'font-bold text-base',
                                selected ? 'text-brand-700' : 'text-gray-800',
                              )}
                            >
                              {formatCurrency(o.mensalidade)}
                            </p>
                            <p className="text-xs text-gray-400">/ mês</p>
                            {selected && (
                              <p className="text-[10px] text-brand-600 font-semibold mt-1">
                                Selecionado
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {(() => {
                  const venda = precificacao.opcoes.find((o: any) => o.tipo === 'VENDA');
                  if (!venda) return null;
                  return (
                    <div className="card">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800 text-sm">Venda à Vista</h3>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(venda.valorTotal)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {venda.parcelas?.map((p: any) => (
                          <div
                            key={p.nParcelas}
                            className="text-center p-2 rounded-xl border border-gray-200"
                          >
                            <p className="text-xs text-gray-500">{p.nParcelas}x</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(p.valorParcela)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
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
