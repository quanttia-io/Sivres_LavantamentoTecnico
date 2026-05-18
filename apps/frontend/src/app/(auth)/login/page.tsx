'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Cog, ClipboardList, MapPin, BarChart3, Shield } from 'lucide-react';
import Image from 'next/image';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  { icon: ClipboardList, label: 'Vistorias Digitais' },
  { icon: MapPin,        label: 'Portaria Remota'   },
  { icon: BarChart3,     label: 'Relatórios'        },
  { icon: Shield,        label: 'Auditoria'         },
];

const STATS = [
  { value: '5k+',  label: 'Vistorias/mês' },
  { value: '99.9%', label: 'Uptime'       },
  { value: '100+', label: 'Condomínios'   },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const tokens = await authApi.login(data.email, data.password) as any;
      useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
      const me = await authApi.me() as any;
      setAuth(me, tokens.accessToken, tokens.refreshToken);
      toast.success(`Bem-vindo, ${me.name}!`);
      router.replace('/vistorias');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Credenciais inválidas';
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#111827' }}>

      {/* ── LEFT PANEL — form ─────────────────────────────── */}
      <div
        className="flex flex-col w-full md:w-[46%] lg:w-[42%] min-h-screen px-8 py-8 md:px-12"
        style={{ background: '#111827' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-auto">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#f97316' }}
          >
            <Cog size={20} style={{ color: '#1e3a8a' }} />
          </div>
          <span className="font-bold text-base" style={{ color: '#e2e8f0' }}>SIVRES</span>
        </div>

        {/* Form area */}
        <div className="flex flex-col justify-center flex-1 max-w-sm mx-auto w-full py-10">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>
            Bem-vindo de volta
          </h1>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            Acesse sua conta para gerenciar as vistorias e portarias.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#94a3b8' }}>
                E-mail
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@email.com.br"
                autoComplete="email"
                inputMode="email"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px #3b82f622'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#94a3b8' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px #3b82f622'; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 min-h-0"
                  style={{ color: '#475569' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: '#2563eb', color: '#fff' }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Segurança */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
            <p className="text-xs" style={{ color: '#64748b' }}>Conexão segura — SSL/TLS</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between text-xs" style={{ color: '#334155' }}>
          <span suppressHydrationWarning>© {new Date().getFullYear()} Servis Soluções</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-slate-400 transition-colors">Termos de Uso</span>
            <span className="cursor-pointer hover:text-slate-400 transition-colors">Privacidade</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — image + overlay ────────────────── */}
      <div className="hidden md:flex flex-col flex-1 relative overflow-hidden">
        {/* Background image */}
        <Image
          src="/login-bg.png"
          alt="SIVRES Tecnologia"
          fill
          className="object-cover"
          priority
        />

        {/* Dark overlay gradient */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0f172acc 0%, #1e3a8a99 50%, #0b0f1ecc 100%)' }}
        />

        {/* Left-edge fade — blends into the form panel */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #111827 0%, transparent 100%)' }}
        />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 lg:p-14">
          {/* Top */}
          <div />

          {/* Center */}
          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4" style={{ color: '#f1f5f9' }}>
              Levantamento técnico<br />
              <span style={{ color: '#60a5fa' }}>inteligente e preciso</span>
            </h2>
            <p className="text-sm lg:text-base mb-8 max-w-sm" style={{ color: '#94a3b8' }}>
              Gestão completa de vistorias, portaria remota e relatórios em tempo real para condomínios.
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-10">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ background: '#ffffff18', border: '1px solid #ffffff22', color: '#e2e8f0', backdropFilter: 'blur(8px)' }}
                >
                  <Icon size={14} style={{ color: '#60a5fa' }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold" style={{ color: '#f1f5f9' }}>{value}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <div
            className="rounded-2xl p-5 max-w-sm"
            style={{ background: '#ffffff12', border: '1px solid #ffffff1a', backdropFilter: 'blur(12px)' }}
          >
            <p className="text-sm italic mb-3" style={{ color: '#cbd5e1' }}>
              "O sistema transformou nossa operação de portaria — vistorias mais rápidas e seguras."
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: '#1e3a8a', color: '#60a5fa' }}
              >
                S
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Síndico Responsável</p>
                <p className="text-xs" style={{ color: '#64748b' }}>Condomínio Bosque das Flores</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
