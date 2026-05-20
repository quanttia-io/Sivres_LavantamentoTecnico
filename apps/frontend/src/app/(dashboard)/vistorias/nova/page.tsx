'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  Loader2,
  ChevronDown,
  RefreshCw,
  Zap,
} from 'lucide-react';
import Stepper from '@/components/vistoria/stepper';
import { vistoriasApi } from '@/lib/api/vistorias';
import { api } from '@/lib/api/client';
import { configuradorApi, type ConfiguracaoEntradas } from '@/lib/api/configurador';
import { useAuthStore } from '@/store/auth.store';

const STEPS = [
  { id: 1, label: 'Condomínio' },
  { id: 2, label: 'Portaria' },
  { id: 3, label: 'Operacional' },
  { id: 4, label: 'Config. Técnica' },
  { id: 5, label: 'Produtos' },
  { id: 6, label: 'Revisão' },
];

const step1Schema = z.object({
  condominioNome: z.string().min(3, 'Nome obrigatório'),
  condominioEndereco: z.string().min(5, 'Endereço obrigatório'),
  condominioCidade: z.string().min(2, 'Cidade obrigatória'),
  condominioEstado: z.string().min(2, 'Estado obrigatório'),
});

const step2Schema = z.object({
  tipoPortaria: z.enum(['ASSISTIDA', 'AUTONOMA', 'CONTROLE_ACESSO']),
  consultorId: z.string().uuid('Selecione um consultor'),
  supervisorId: z.string().uuid('Selecione um supervisor'),
});

const step3Schema = z.object({
  qtdUnidades: z.coerce.number().int().min(1).optional(),
  qtdPortoesVeiculares: z.coerce.number().int().min(0).optional(),
  qtdPortoesPedestres: z.coerce.number().int().min(0).optional(),
  qtdElevadores: z.coerce.number().int().min(0).optional(),
  possuiLixeira: z.boolean().optional(),
  tipoRecolhimento: z.enum(['DIURNO', 'NOTURNO']).optional(),
  tipoCondominio: z.enum(['VERTICAL', 'HORIZONTAL']).optional(),
  periodoAtendimento: z
    .enum(['INTEGRAL', 'DIURNO', 'NOTURNO', 'DIURNO_FDS', 'NOTURNO_FDS'])
    .optional(),
  observacoesGerais: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface ProdutoItem {
  produtoId: string;
  quantidade: number;
  codigo: string;
  descricao: string;
  custo: number;
  autoGerado?: boolean;
}

const TIPO_PORTARIA_LABEL: Record<string, string> = {
  ASSISTIDA: 'Portaria Assistida',
  AUTONOMA: 'Portaria Autônoma',
  CONTROLE_ACESSO: 'Controle de Acesso',
};

const PERIODO_LABEL: Record<string, string> = {
  INTEGRAL: 'Integral (24h)',
  DIURNO: 'Diurno',
  NOTURNO: 'Noturno',
  DIURNO_FDS: 'Diurno + Fins de Semana',
  NOTURNO_FDS: 'Noturno + Fins de Semana',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const defaultConfigTecnica = (): ConfiguracaoEntradas => ({
  tipoPortaria: '',
  qtdUnidades: 0,
  tipoCondominioVertical: true,
  // Portões Pedestre
  pedPivManual: 0, pedPivAuto: 0, pedDeslPiso: 0, pedDeslTeto: 0, pedPivVidro: 0, pedOutro: 0,
  // Controle Pedestre
  eclusaPedestre: 0, leitorTagPedestre: 0, biometriaDigital: 0, biometriaFacial: 0,
  opcaoSaidaPedestres: 0,
  // Câmeras e Interfones
  interfoneAut: 0, camerasPortariaAut: 0, interfoneRem: 0, camerasPortariaRem: 0,
  integracaoInterfone: false,
  // Elevadores
  elevadoresMonitorados: 0,
  // Portões Veículos
  deslP: 0, deslM: 0, deslG: 0, bascSimples: 0, pivSimples: 0, pivDuplo: 0, veiOutro: 0,
  // Motores
  motorDeslP: 0, motorDeslM: 0, motorDeslG: 0, motorBasc: 0,
  motorPivSimples: 0, motorPivDuplo: 0, motorOutro: 0,
  // Controle Veículos
  controleRemoto: false, antenasTagVeicular: 0, biometriaFacialVeiculo: 0,
  eclusaVeiculo: 0, intertravamentoPedestre: 0, refletores: 0,
  // Proteção Perímetro
  metrosCerca: 0, sensoresBarreira: 0, cercaEletrica: 0,
  // Dispositivos
  tagPedestre: 0, pulseiraPedestre: 0, controleVeiculos: 0,
  tagVeicularComum: 0, tagVeicularBlindada: 0,
  // Lixeira
  lixeiraModalidade: 0, lixeiraPivManual: 0, lixeiraDeslPiso: 0,
  // Hall de Pedestres
  hallAberturaTemporizador: false,
  hallPivManual: 0, hallPivAuto: 0, hallDeslPiso: 0, hallDeslTeto: 0, hallPivVidro: 0,
  // Outros
  celularZelador: false,
});

export default function NovaVistoriaPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Step 4 — Configuração Técnica
  const [configTecnica, setConfigTecnica] = useState<ConfiguracaoEntradas>(defaultConfigTecnica);
  const [loadingConfigurador, setLoadingConfigurador] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pedestres: true,
    controlePed: false,
    cameras: false,
    portVei: false,
    motorVei: false,
    ctrlVei: false,
    perimetro: false,
    dispositivos: false,
    lixeira: false,
    hall: false,
    outros: false,
  });

  // Step 5 — Produtos
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const step1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { supervisorId: user?.id },
  });
  const step3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleStep1 = step1.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    api.get('/users').then((res: any) => setUsers(res));
    setStep(2);
  });

  const handleStep2 = step2.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  });

  const handleStep3 = step3.handleSubmit(async (data) => {
    setFormData((prev) => ({ ...prev, ...data }));

    if (todosProdutos.length === 0) {
      try {
        const allProdutos = (await api.get('/produtos', {
          params: { limit: 500 },
        })) as any;
        const lista = Array.isArray(allProdutos) ? allProdutos : (allProdutos?.items ?? []);
        setTodosProdutos(lista);
      } catch {
        // silently fail — search dropdown still works on demand
      }
    }

    setConfigTecnica((prev) => ({
      ...prev,
      tipoPortaria: formData.tipoPortaria as string,
      qtdUnidades: Number(data.qtdUnidades ?? 0),
      tipoCondominioVertical: data.tipoCondominio === 'VERTICAL',
      elevadoresMonitorados: Number(data.qtdElevadores ?? 0),
    }));

    setStep(4);
  });

  const handleStep4 = async () => {
    setLoadingConfigurador(true);
    try {
      const itens = (await configuradorApi.calcular(configTecnica)) as any[];
      const manuais = produtos.filter((p) => !p.autoGerado);
      const autoItens: ProdutoItem[] = itens
        .filter((item) => item.quantidade > 0)
        .map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          codigo: item.codigo,
          descricao: item.descricao,
          custo: item.custoUnit,
          autoGerado: true,
        }));
      const autoIds = new Set(autoItens.map((i) => i.produtoId));
      const manuaisUnicos = manuais.filter((m) => !autoIds.has(m.produtoId));
      setProdutos([...autoItens, ...manuaisUnicos]);
      toast.success(`${autoItens.length} produto(s) selecionados automaticamente`);
      setStep(5);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao calcular configuração técnica');
    } finally {
      setLoadingConfigurador(false);
    }
  };

  const recalcularConfigurador = async () => {
    setLoadingConfigurador(true);
    try {
      const itens = (await configuradorApi.calcular(configTecnica)) as any[];
      const manuais = produtos.filter((p) => !p.autoGerado);
      const autoItens: ProdutoItem[] = itens
        .filter((item) => item.quantidade > 0)
        .map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          codigo: item.codigo,
          descricao: item.descricao,
          custo: item.custoUnit,
          autoGerado: true,
        }));
      const autoIds = new Set(autoItens.map((i) => i.produtoId));
      const manuaisUnicos = manuais.filter((m) => !autoIds.has(m.produtoId));
      setProdutos([...autoItens, ...manuaisUnicos]);
      toast.success('Produtos recalculados');
    } catch {
      toast.error('Erro ao recalcular');
    } finally {
      setLoadingConfigurador(false);
    }
  };

  const alterarQuantidade = (produtoId: string, qtd: number) => {
    setProdutos((prev) =>
      prev.map((p) => (p.produtoId === produtoId ? { ...p, quantidade: Math.max(1, qtd) } : p)),
    );
  };

  const removerProduto = (produtoId: string) => {
    setProdutos((prev) => prev.filter((p) => p.produtoId !== produtoId));
  };

  const adicionarProdutoDireto = (produto: any) => {
    if (produtos.some((p) => p.produtoId === produto.id)) {
      toast.error('Produto já está na lista');
      return;
    }
    setProdutos((prev) => [
      ...prev,
      {
        produtoId: produto.id,
        quantidade: 1,
        codigo: produto.codigo,
        descricao: produto.descricao,
        custo: Number(produto.custo),
      },
    ]);
    setBusca('');
    setShowDropdown(false);
  };

  const totalGeral = produtos.reduce((acc, p) => acc + p.custo * p.quantidade, 0);

  const produtosDisponiveis = todosProdutos.filter(
    (p: any) => p.ativo !== false && !produtos.some((item) => item.produtoId === p.id),
  );

  const resultadosBusca =
    busca.trim().length >= 1
      ? produtosDisponiveis
          .filter(
            (p: any) =>
              p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
              p.descricao.toLowerCase().includes(busca.toLowerCase()),
          )
          .slice(0, 8)
      : [];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let condominioId: string;
      try {
        const existing = (await api.get('/condominios', {
          params: { search: formData.condominioNome },
        })) as any[];
        const found = existing.find(
          (c: any) =>
            c.nome === formData.condominioNome && c.endereco === formData.condominioEndereco,
        );
        if (found) {
          condominioId = found.id;
        } else {
          const created = (await api.post('/condominios', {
            nome: formData.condominioNome,
            endereco: formData.condominioEndereco,
            cidade: formData.condominioCidade,
            estado: formData.condominioEstado,
          })) as any;
          condominioId = created.id;
        }
      } catch {
        const created = (await api.post('/condominios', {
          nome: formData.condominioNome,
          endereco: formData.condominioEndereco,
          cidade: formData.condominioCidade,
          estado: formData.condominioEstado,
        })) as any;
        condominioId = created.id;
      }

      const vistoria = (await vistoriasApi.criar({
        condominioId,
        supervisorId: formData.supervisorId,
        consultorId: formData.consultorId,
        tipoPortaria: formData.tipoPortaria,
        qtdUnidades: formData.qtdUnidades || undefined,
        qtdPortoesVeiculares: formData.qtdPortoesVeiculares || undefined,
        qtdPortoesPedestres: formData.qtdPortoesPedestres || undefined,
        qtdElevadores: formData.qtdElevadores || undefined,
        possuiLixeira: formData.possuiLixeira ?? false,
        tipoRecolhimento: formData.tipoRecolhimento || undefined,
        tipoCondominio: formData.tipoCondominio || undefined,
        periodoAtendimento: formData.periodoAtendimento || undefined,
        observacoesGerais: formData.observacoesGerais || undefined,
        dadosConfiguracao: configTecnica as any,
        itens: produtos.map((p) => ({ produtoId: p.produtoId, quantidade: p.quantidade })),
      })) as any;

      toast.success(`Vistoria ${vistoria.numero} criada com sucesso!`);
      router.push(`/vistorias/${vistoria.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar vistoria');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
            className="btn-secondary py-2 px-3 min-h-0"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Nova Vistoria</h1>
            <p className="text-xs text-gray-500">
              Passo {step} de {STEPS.length}
            </p>
          </div>
        </div>
        <Stepper steps={STEPS} currentStep={step} onStepClick={setStep} />
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-2xl w-full mx-auto">
        {/* Step 1 — Condomínio */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Dados do Condomínio</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Nome do Condomínio *</label>
                  <input
                    {...step1.register('condominioNome')}
                    className="input"
                    placeholder="Ex: Condomínio Solar das Palmeiras"
                  />
                  {step1.formState.errors.condominioNome && (
                    <p className="text-red-500 text-xs mt-1">
                      {step1.formState.errors.condominioNome.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Endereço *</label>
                  <input
                    {...step1.register('condominioEndereco')}
                    className="input"
                    placeholder="Rua, número, bairro"
                  />
                  {step1.formState.errors.condominioEndereco && (
                    <p className="text-red-500 text-xs mt-1">
                      {step1.formState.errors.condominioEndereco.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Cidade *</label>
                    <input
                      {...step1.register('condominioCidade')}
                      className="input"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <label className="label">Estado *</label>
                    <input
                      {...step1.register('condominioEstado')}
                      className="input"
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              Continuar <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* Step 2 — Portaria + Responsáveis */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Tipo de Portaria</h2>
              <div className="grid gap-3">
                {[
                  {
                    value: 'ASSISTIDA',
                    label: 'Portaria Assistida',
                    desc: 'Porteiro presencial com suporte remoto',
                  },
                  {
                    value: 'AUTONOMA',
                    label: 'Portaria Autônoma',
                    desc: 'Totalmente remota, sem porteiro presencial',
                  },
                  {
                    value: 'CONTROLE_ACESSO',
                    label: 'Controle de Acesso',
                    desc: 'Sistema de controle sem portaria remota',
                  },
                ].map((tipo) => {
                  const selected = step2.watch('tipoPortaria') === tipo.value;
                  return (
                    <label
                      key={tipo.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selected
                          ? 'border-brand-700 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        {...step2.register('tipoPortaria')}
                        value={tipo.value}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{tipo.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{tipo.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {step2.formState.errors.tipoPortaria && (
                <p className="text-red-500 text-xs mt-2">
                  {step2.formState.errors.tipoPortaria.message}
                </p>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Responsáveis</h2>
              <div className="space-y-3">
                <div>
                  <label className="label">Consultor Responsável *</label>
                  <select {...step2.register('consultorId')} className="input">
                    <option value="">Selecione o consultor</option>
                    {users
                      .filter((u) =>
                        ['CONSULTOR', 'SUPERVISOR', 'GESTOR', 'ADMINISTRADOR'].includes(u.role),
                      )
                      .map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="label">Supervisor Responsável *</label>
                  <select {...step2.register('supervisorId')} className="input">
                    <option value="">Selecione o supervisor</option>
                    {users
                      .filter((u) =>
                        ['SUPERVISOR', 'GESTOR', 'ADMINISTRADOR'].includes(u.role),
                      )
                      .map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              Continuar <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* Step 3 — Dados Operacionais */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Dados Operacionais</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unidades</label>
                  <input
                    type="number"
                    {...step3.register('qtdUnidades')}
                    className="input"
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Portões Veiculares</label>
                  <input
                    type="number"
                    {...step3.register('qtdPortoesVeiculares')}
                    className="input"
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Portões Pedestres</label>
                  <input
                    type="number"
                    {...step3.register('qtdPortoesPedestres')}
                    className="input"
                    placeholder="0"
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Elevadores</label>
                  <input
                    type="number"
                    {...step3.register('qtdElevadores')}
                    className="input"
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo de Condomínio</label>
                  <select {...step3.register('tipoCondominio')} className="input">
                    <option value="">Selecione</option>
                    <option value="VERTICAL">Vertical</option>
                    <option value="HORIZONTAL">Horizontal</option>
                  </select>
                </div>
                <div>
                  <label className="label">Período de Atendimento</label>
                  <select {...step3.register('periodoAtendimento')} className="input">
                    <option value="">Selecione</option>
                    <option value="INTEGRAL">Integral (24h)</option>
                    <option value="DIURNO">Diurno</option>
                    <option value="NOTURNO">Noturno</option>
                    <option value="DIURNO_FDS">Diurno + Fins de Semana</option>
                    <option value="NOTURNO_FDS">Noturno + Fins de Semana</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                  <input
                    type="checkbox"
                    id="lixeira"
                    {...step3.register('possuiLixeira')}
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="lixeira" className="text-sm font-medium text-gray-700">
                    Possui área de lixeira
                  </label>
                </div>
                {step3.watch('possuiLixeira') && (
                  <div>
                    <label className="label">Tipo de Recolhimento</label>
                    <select {...step3.register('tipoRecolhimento')} className="input">
                      <option value="">Selecione</option>
                      <option value="DIURNO">Diurno</option>
                      <option value="NOTURNO">Noturno</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Observações Gerais</label>
                  <textarea
                    {...step3.register('observacoesGerais')}
                    rows={3}
                    className="input resize-none"
                    placeholder="Informações adicionais sobre o local..."
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              Continuar <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* Step 4 — Configuração Técnica */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} className="text-amber-500" />
                <h2 className="font-semibold text-gray-800">Configuração Técnica</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Preencha as características do condomínio para auto-selecionar os produtos.
                Todos os campos são opcionais.
              </p>

              <div className="space-y-2">

                {/* ─── Portões Pedestres ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('pedestres')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Portões Pedestres</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.pedestres ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.pedestres && (
                    <div className="px-4 py-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                      {([
                        ['Pivotante Manual', 'pedPivManual'],
                        ['Pivotante Automático', 'pedPivAuto'],
                        ['Deslizante Piso', 'pedDeslPiso'],
                        ['Deslizante Teto', 'pedDeslTeto'],
                        ['Pivotante Vidro', 'pedPivVidro'],
                        ['Outro', 'pedOutro'],
                      ] as [string, keyof ConfiguracaoEntradas][]).map(([label, field]) => (
                        <div key={field}>
                          <label className="text-xs text-gray-500 block mb-1">{label}</label>
                          <input type="number" min={0}
                            value={(configTecnica[field] as number) ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── Controle de Acesso Pedestre ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('controlePed')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Controle de Acesso Pedestre</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.controlePed ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.controlePed && (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          ['Eclusas Pedestre', 'eclusaPedestre'],
                          ['Leitores TAG', 'leitorTagPedestre'],
                          ['Biometria Digital', 'biometriaDigital'],
                          ['Biometria Facial', 'biometriaFacial'],
                        ] as [string, keyof ConfiguracaoEntradas][]).map(([label, field]) => (
                          <div key={field}>
                            <label className="text-xs text-gray-500 block mb-1">{label}</label>
                            <input type="number" min={0}
                              value={(configTecnica[field] as number) ?? 0}
                              onChange={(e) => setConfigTecnica((p) => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
                              className="input" />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Acionamento de Saída</label>
                        <select value={configTecnica.opcaoSaidaPedestres ?? 0}
                          onChange={(e) => setConfigTecnica((p) => ({ ...p, opcaoSaidaPedestres: parseInt(e.target.value) }))}
                          className="input">
                          <option value={0}>Interfone</option>
                          <option value={1}>Botão</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Câmeras e Interfones ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('cameras')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Câmeras e Interfones</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.cameras ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.cameras && (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Portaria Autônoma</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Interfones</label>
                          <input type="number" min={0} value={configTecnica.interfoneAut ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, interfoneAut: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Câmeras</label>
                          <input type="number" min={0} value={configTecnica.camerasPortariaAut ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, camerasPortariaAut: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Portaria Remota (CCC)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Interfones</label>
                          <input type="number" min={0} value={configTecnica.interfoneRem ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, interfoneRem: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Câmeras</label>
                          <input type="number" min={0} value={configTecnica.camerasPortariaRem ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, camerasPortariaRem: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Elevadores</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Elevadores Monitorados</label>
                          <input type="number" min={0} value={configTecnica.elevadoresMonitorados ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, elevadoresMonitorados: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 py-1">
                        <input type="checkbox" id="cfg-integracaoInterfone"
                          checked={configTecnica.integracaoInterfone ?? false}
                          onChange={(e) => setConfigTecnica((p) => ({ ...p, integracaoInterfone: e.target.checked }))}
                          className="w-4 h-4 rounded" />
                        <label htmlFor="cfg-integracaoInterfone" className="text-sm text-gray-700">
                          Integração com Central de Interfone
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Portões de Veículos ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('portVei')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Portões de Veículos</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.portVei ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.portVei && (
                    <div className="px-4 py-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                      {([
                        ['Deslizante P (até 3m)', 'deslP'],
                        ['Deslizante M (3–5m)', 'deslM'],
                        ['Deslizante G (> 5m)', 'deslG'],
                        ['Basculante Simples', 'bascSimples'],
                        ['Pivotante Simples', 'pivSimples'],
                        ['Pivotante Duplo', 'pivDuplo'],
                        ['Outro', 'veiOutro'],
                      ] as [string, keyof ConfiguracaoEntradas][]).map(([label, field]) => (
                        <div key={field}>
                          <label className="text-xs text-gray-500 block mb-1">{label}</label>
                          <input type="number" min={0}
                            value={(configTecnica[field] as number) ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── Motores de Portões ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('motorVei')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Motores de Portões</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.motorVei ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.motorVei && (
                    <div className="px-4 py-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                      {([
                        ['Motor Deslizante P', 'motorDeslP'],
                        ['Motor Deslizante M', 'motorDeslM'],
                        ['Motor Deslizante G', 'motorDeslG'],
                        ['Motor Basculante', 'motorBasc'],
                        ['Motor Pivotante Simples', 'motorPivSimples'],
                        ['Motor Pivotante Duplo', 'motorPivDuplo'],
                        ['Motor Outro', 'motorOutro'],
                      ] as [string, keyof ConfiguracaoEntradas][]).map(([label, field]) => (
                        <div key={field}>
                          <label className="text-xs text-gray-500 block mb-1">{label}</label>
                          <input type="number" min={0}
                            value={(configTecnica[field] as number) ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── Controle de Veículos ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('ctrlVei')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Controle de Veículos</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.ctrlVei ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.ctrlVei && (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          ['Antenas TAG Veicular', 'antenasTagVeicular'],
                          ['Biometria Facial Veículo', 'biometriaFacialVeiculo'],
                          ['Eclusas Veículo', 'eclusaVeiculo'],
                          ['Intertravamento Pedestre', 'intertravamentoPedestre'],
                          ['Refletores', 'refletores'],
                        ] as [string, keyof ConfiguracaoEntradas][]).map(([label, field]) => (
                          <div key={field}>
                            <label className="text-xs text-gray-500 block mb-1">{label}</label>
                            <input type="number" min={0}
                              value={(configTecnica[field] as number) ?? 0}
                              onChange={(e) => setConfigTecnica((p) => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
                              className="input" />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 py-1">
                        <input type="checkbox" id="cfg-controleRemoto"
                          checked={configTecnica.controleRemoto ?? false}
                          onChange={(e) => setConfigTecnica((p) => ({ ...p, controleRemoto: e.target.checked }))}
                          className="w-4 h-4 rounded" />
                        <label htmlFor="cfg-controleRemoto" className="text-sm text-gray-700">Abertura por Controle Remoto</label>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Proteção Perimetral ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('perimetro')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Proteção Perimetral</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.perimetro ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.perimetro && (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Metros de Cerca</label>
                          <input type="number" min={0} value={configTecnica.metrosCerca ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, metrosCerca: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Sensores de Barreira</label>
                          <input type="number" min={0} value={configTecnica.sensoresBarreira ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, sensoresBarreira: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Cerca Elétrica</label>
                        <select value={configTecnica.cercaEletrica ?? 0}
                          onChange={(e) => setConfigTecnica((p) => ({ ...p, cercaEletrica: parseInt(e.target.value) }))}
                          className="input">
                          <option value={0}>Nenhuma</option>
                          <option value={1}>Completa (fiação + central)</option>
                          <option value={2}>Apenas fiação</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Dispositivos ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('dispositivos')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Dispositivos</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.dispositivos ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.dispositivos && (
                    <div className="px-4 py-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                      {([
                        ['Tag Pedestre', 'tagPedestre'],
                        ['Pulseira Pedestre', 'pulseiraPedestre'],
                        ['Controles Veiculares', 'controleVeiculos'],
                        ['Tag Veicular Comum', 'tagVeicularComum'],
                        ['Tag Veicular Blindada', 'tagVeicularBlindada'],
                      ] as [string, keyof ConfiguracaoEntradas][]).map(([label, field]) => (
                        <div key={field}>
                          <label className="text-xs text-gray-500 block mb-1">{label}</label>
                          <input type="number" min={0}
                            value={(configTecnica[field] as number) ?? 0}
                            onChange={(e) => setConfigTecnica((p) => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
                            className="input" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── Área de Lixeira ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('lixeira')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Área de Lixeira</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.lixeira ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.lixeira && (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Modalidade</label>
                        <select value={configTecnica.lixeiraModalidade ?? 0}
                          onChange={(e) => setConfigTecnica((p) => ({ ...p, lixeiraModalidade: parseInt(e.target.value) }))}
                          className="input">
                          <option value={0}>Nenhum</option>
                          <option value={1}>Interfone</option>
                          <option value={2}>Botão</option>
                        </select>
                      </div>
                      {(configTecnica.lixeiraModalidade ?? 0) > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Portões Pivotantes</label>
                            <input type="number" min={0} value={configTecnica.lixeiraPivManual ?? 0}
                              onChange={(e) => setConfigTecnica((p) => ({ ...p, lixeiraPivManual: parseInt(e.target.value) || 0 }))}
                              className="input" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Portões Deslizantes</label>
                            <input type="number" min={0} value={configTecnica.lixeiraDeslPiso ?? 0}
                              onChange={(e) => setConfigTecnica((p) => ({ ...p, lixeiraDeslPiso: parseInt(e.target.value) || 0 }))}
                              className="input" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ─── Hall de Pedestres ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('hall')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Hall de Pedestres</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.hall ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.hall && (
                    <div className="px-4 py-3 border-t border-gray-100 space-y-3">
                      <div className="flex items-center gap-3 py-1">
                        <input type="checkbox" id="cfg-hallAbertura"
                          checked={configTecnica.hallAberturaTemporizador ?? false}
                          onChange={(e) => setConfigTecnica((p) => ({ ...p, hallAberturaTemporizador: e.target.checked }))}
                          className="w-4 h-4 rounded" />
                        <label htmlFor="cfg-hallAbertura" className="text-sm text-gray-700">
                          Abertura Automática c/ Temporizador
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          ['Pivotante Manual', 'hallPivManual'],
                          ['Pivotante Automático', 'hallPivAuto'],
                          ['Deslizante Piso', 'hallDeslPiso'],
                          ['Deslizante Teto', 'hallDeslTeto'],
                          ['Pivotante Vidro', 'hallPivVidro'],
                        ] as [string, keyof ConfiguracaoEntradas][]).map(([label, field]) => (
                          <div key={field}>
                            <label className="text-xs text-gray-500 block mb-1">{label}</label>
                            <input type="number" min={0}
                              value={(configTecnica[field] as number) ?? 0}
                              onChange={(e) => setConfigTecnica((p) => ({ ...p, [field]: parseInt(e.target.value) || 0 }))}
                              className="input" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Outros ─── */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => toggleSection('outros')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">Outros</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${openSections.outros ? 'rotate-180' : ''}`} />
                  </button>
                  {openSections.outros && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 py-1.5">
                        <input type="checkbox" id="cfg-celularZelador"
                          checked={configTecnica.celularZelador ?? false}
                          onChange={(e) => setConfigTecnica((p) => ({ ...p, celularZelador: e.target.checked }))}
                          className="w-4 h-4 rounded" />
                        <label htmlFor="cfg-celularZelador" className="text-sm text-gray-700">
                          Celular com Linha para Zelador
                        </label>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(5)} className="btn-secondary flex-1">
                Pular <ChevronRight size={18} />
              </button>
              <button type="button" onClick={handleStep4} disabled={loadingConfigurador} className="btn-primary flex-1">
                {loadingConfigurador ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Aplicar Configurador
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Produtos */}
        {step === 5 && (
          <div className="space-y-4">
            {/* Incluir Produto — topo */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">Incluir Produto</h3>
                {produtos.some((p) => p.autoGerado) && (
                  <button
                    type="button"
                    onClick={recalcularConfigurador}
                    disabled={loadingConfigurador}
                    className="flex items-center gap-1.5 text-xs text-brand-700 font-medium hover:text-brand-800 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loadingConfigurador ? 'animate-spin' : ''} />
                    Recalcular
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  className="input w-full"
                  placeholder="Buscar por código ou descrição..."
                />
                {showDropdown && resultadosBusca.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {resultadosBusca.map((p: any) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onMouseDown={() => adicionarProdutoDireto(p)}
                          className="w-full text-left px-4 py-2.5 hover:bg-brand-50 transition-colors flex items-center gap-3 text-sm"
                        >
                          <span className="font-mono text-xs text-gray-400 w-24 shrink-0">
                            {p.codigo}
                          </span>
                          <span className="text-gray-800">{p.descricao}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {showDropdown && busca.trim().length >= 1 && resultadosBusca.length === 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
                    Nenhum produto encontrado.
                  </div>
                )}
              </div>
            </div>

            {/* Lista de produtos */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">Produtos da Vistoria</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {TIPO_PORTARIA_LABEL[formData.tipoPortaria as string] ??
                      (formData.tipoPortaria as string)}
                  </p>
                </div>
                <span className="text-sm text-gray-500">{produtos.length} produto(s)</span>
              </div>

              {produtos.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  Nenhum produto adicionado. Use a busca acima ou volte e aplique o Configurador.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                        <th className="pb-2 font-medium w-28">Código</th>
                        <th className="pb-2 font-medium">Descrição</th>
                        <th className="pb-2 font-medium text-center w-28">Quantidade</th>
                        <th className="pb-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {produtos.map((p) => (
                        <tr key={p.produtoId}>
                          <td className="py-3 pr-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-xs text-gray-500">{p.codigo}</span>
                              {p.autoGerado && (
                                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">
                                  Auto
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-gray-800 pr-4">{p.descricao}</td>
                          <td className="py-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={p.quantidade}
                              onChange={(e) =>
                                alterarQuantidade(p.produtoId, Number(e.target.value))
                              }
                              className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-700"
                              style={{ color: '#1e3a8a' }}
                            />
                          </td>
                          <td className="py-3 pl-2">
                            <button
                              onClick={() => removerProduto(p.produtoId)}
                              className="text-red-300 hover:text-red-500 transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(6)}
              disabled={loadingConfigurador}
              className="btn-primary w-full"
            >
              Continuar <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 6 — Revisão */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-3">Resumo da Vistoria</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Condomínio</dt>
                  <dd className="font-medium">{formData.condominioNome as string}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Endereço</dt>
                  <dd className="font-medium text-right">
                    {formData.condominioEndereco as string}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tipo de Portaria</dt>
                  <dd className="font-medium">
                    {TIPO_PORTARIA_LABEL[formData.tipoPortaria as string] ??
                      (formData.tipoPortaria as string)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Unidades</dt>
                  <dd className="font-medium">{(formData.qtdUnidades as number) ?? '-'}</dd>
                </div>
                {!!formData.tipoCondominio && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Tipo Condomínio</dt>
                    <dd className="font-medium capitalize">
                      {(formData.tipoCondominio as string).toLowerCase()}
                    </dd>
                  </div>
                )}
                {!!formData.periodoAtendimento && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Período Atendimento</dt>
                    <dd className="font-medium">
                      {PERIODO_LABEL[formData.periodoAtendimento as string] ??
                        (formData.periodoAtendimento as string)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                  <dt className="text-gray-500">Produtos</dt>
                  <dd className="font-medium">
                    {produtos.length} item(s)
                    {produtos.some((p) => p.autoGerado) && (
                      <span className="ml-1 text-xs text-brand-600">
                        ({produtos.filter((p) => p.autoGerado).length} auto)
                      </span>
                    )}
                  </dd>
                </div>
                {totalGeral > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Custo Total</dt>
                    <dd className="font-semibold text-gray-900">{formatCurrency(totalGeral)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full py-4 text-base"
            >
              <Check size={20} />
              {submitting ? 'Criando vistoria...' : 'Criar Vistoria'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
