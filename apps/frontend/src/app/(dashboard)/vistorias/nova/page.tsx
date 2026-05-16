'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Stepper from '@/components/vistoria/stepper';
import { vistoriasApi } from '@/lib/api/vistorias';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';

const STEPS = [
  { id: 1, label: 'Condomínio' },
  { id: 2, label: 'Portaria' },
  { id: 3, label: 'Operacional' },
  { id: 4, label: 'Revisão' },
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
  observacoesGerais: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export default function NovaVistoriaPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const step1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { supervisorId: user?.id },
  });
  const step3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const handleStep1 = step1.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Load users for step 2
    api.get('/users').then((res: any) => setUsers(res));
    setStep(2);
  });

  const handleStep2 = step2.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  });

  const handleStep3 = step3.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(4);
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create or find condominio
      let condominioId: string;
      try {
        const existing = await api.get('/condominios', {
          params: { search: formData.condominioNome },
        }) as any[];
        const found = existing.find(
          (c: any) =>
            c.nome === formData.condominioNome && c.endereco === formData.condominioEndereco,
        );
        if (found) {
          condominioId = found.id;
        } else {
          const created = await api.post('/condominios', {
            nome: formData.condominioNome,
            endereco: formData.condominioEndereco,
            cidade: formData.condominioCidade,
            estado: formData.condominioEstado,
          }) as any;
          condominioId = created.id;
        }
      } catch {
        const created = await api.post('/condominios', {
          nome: formData.condominioNome,
          endereco: formData.condominioEndereco,
          cidade: formData.condominioCidade,
          estado: formData.condominioEstado,
        }) as any;
        condominioId = created.id;
      }

      const vistoria = await vistoriasApi.criar({
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
        observacoesGerais: formData.observacoesGerais || undefined,
      }) as any;

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
          <button onClick={() => (step > 1 ? setStep(step - 1) : router.back())} className="btn-secondary py-2 px-3 min-h-0">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Nova Vistoria</h1>
            <p className="text-xs text-gray-500">Passo {step} de {STEPS.length}</p>
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
                  <input {...step1.register('condominioNome')} className="input" placeholder="Ex: Condomínio Solar das Palmeiras" />
                  {step1.formState.errors.condominioNome && (
                    <p className="text-red-500 text-xs mt-1">{step1.formState.errors.condominioNome.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Endereço *</label>
                  <input {...step1.register('condominioEndereco')} className="input" placeholder="Rua, número, bairro" />
                  {step1.formState.errors.condominioEndereco && (
                    <p className="text-red-500 text-xs mt-1">{step1.formState.errors.condominioEndereco.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Cidade *</label>
                    <input {...step1.register('condominioCidade')} className="input" placeholder="São Paulo" />
                  </div>
                  <div>
                    <label className="label">Estado *</label>
                    <input {...step1.register('condominioEstado')} className="input" placeholder="SP" maxLength={2} />
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              Continuar <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* Step 2 — Tipo + Responsáveis */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Tipo de Portaria</h2>
              <div className="grid gap-3">
                {[
                  { value: 'ASSISTIDA', label: 'Portaria Assistida', desc: 'Porteiro presencial com suporte remoto' },
                  { value: 'AUTONOMA', label: 'Portaria Autônoma', desc: 'Totalmente remota, sem porteiro presencial' },
                  { value: 'CONTROLE_ACESSO', label: 'Controle de Acesso', desc: 'Sistema de controle sem portaria remota' },
                ].map((tipo) => {
                  const selected = step2.watch('tipoPortaria') === tipo.value;
                  return (
                    <label
                      key={tipo.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selected ? 'border-brand-700 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input type="radio" {...step2.register('tipoPortaria')} value={tipo.value} className="mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{tipo.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{tipo.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {step2.formState.errors.tipoPortaria && (
                <p className="text-red-500 text-xs mt-2">{step2.formState.errors.tipoPortaria.message}</p>
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
                      .filter((u) => ['CONSULTOR', 'SUPERVISOR', 'GESTOR', 'ADMINISTRADOR'].includes(u.role))
                      .map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="label">Supervisor Responsável *</label>
                  <select {...step2.register('supervisorId')} className="input">
                    <option value="">Selecione o supervisor</option>
                    {users
                      .filter((u) => ['SUPERVISOR', 'GESTOR', 'ADMINISTRADOR'].includes(u.role))
                      .map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
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
                  <input type="number" {...step3.register('qtdUnidades')} className="input" placeholder="0" min={0} />
                </div>
                <div>
                  <label className="label">Portões Veiculares</label>
                  <input type="number" {...step3.register('qtdPortoesVeiculares')} className="input" placeholder="0" min={0} />
                </div>
                <div>
                  <label className="label">Portões Pedestres</label>
                  <input type="number" {...step3.register('qtdPortoesPedestres')} className="input" placeholder="0" min={0} />
                </div>
                <div>
                  <label className="label">Elevadores</label>
                  <input type="number" {...step3.register('qtdElevadores')} className="input" placeholder="0" min={0} />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                  <input type="checkbox" id="lixeira" {...step3.register('possuiLixeira')} className="w-5 h-5 rounded" />
                  <label htmlFor="lixeira" className="text-sm font-medium text-gray-700">Possui área de lixeira</label>
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

        {/* Step 4 — Revisão */}
        {step === 4 && (
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
                  <dd className="font-medium text-right">{formData.condominioEndereco as string}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tipo de Portaria</dt>
                  <dd className="font-medium">{formData.tipoPortaria as string}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Unidades</dt>
                  <dd className="font-medium">{(formData.qtdUnidades as number) ?? '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              Os produtos do template serão carregados automaticamente conforme o tipo de portaria selecionado.
              Você poderá ajustar após a criação.
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
