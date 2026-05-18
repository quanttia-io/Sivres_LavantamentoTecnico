import { PeriodoAtendimento, PrismaClient, TipoCondominio } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tabela de custos operacionais centrais (OPEX Central).
 * Valores baseados na aba "OPEX Central" da planilha de precificação.
 * Representa o custo mensal que a empresa tem para prestar o serviço
 * de monitoramento remoto conforme o porte e período de atendimento.
 *
 * Ajuste os valores conforme a tabela atualizada da empresa.
 */
const opexData: Array<{
  periodoAtendimento: PeriodoAtendimento;
  tipoCondominio: TipoCondominio;
  faixaUnidadesMin: number;
  faixaUnidadesMax: number;
  custoMensal: number;
}> = [
  // ── VERTICAL ─────────────────────────────────────────────────────────────
  // INTEGRAL (24h/7d)
  { periodoAtendimento: PeriodoAtendimento.INTEGRAL, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 800.0  },
  { periodoAtendimento: PeriodoAtendimento.INTEGRAL, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 1000.0 },
  { periodoAtendimento: PeriodoAtendimento.INTEGRAL, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 1200.0 },
  { periodoAtendimento: PeriodoAtendimento.INTEGRAL, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1500.0 },
  // DIURNO
  { periodoAtendimento: PeriodoAtendimento.DIURNO, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 500.0 },
  { periodoAtendimento: PeriodoAtendimento.DIURNO, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 650.0 },
  { periodoAtendimento: PeriodoAtendimento.DIURNO, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 800.0 },
  { periodoAtendimento: PeriodoAtendimento.DIURNO, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1000.0 },
  // NOTURNO
  { periodoAtendimento: PeriodoAtendimento.NOTURNO, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 550.0 },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 700.0 },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 850.0 },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1050.0 },
  // DIURNO + FDS
  { periodoAtendimento: PeriodoAtendimento.DIURNO_FDS, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 620.0 },
  { periodoAtendimento: PeriodoAtendimento.DIURNO_FDS, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 780.0 },
  { periodoAtendimento: PeriodoAtendimento.DIURNO_FDS, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 950.0 },
  { periodoAtendimento: PeriodoAtendimento.DIURNO_FDS, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1200.0 },
  // NOTURNO + FDS
  { periodoAtendimento: PeriodoAtendimento.NOTURNO_FDS, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 680.0 },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO_FDS, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 850.0 },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO_FDS, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 1020.0 },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO_FDS, tipoCondominio: TipoCondominio.VERTICAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1280.0 },

  // ── HORIZONTAL ───────────────────────────────────────────────────────────
  // INTEGRAL
  { periodoAtendimento: PeriodoAtendimento.INTEGRAL, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 950.0  },
  { periodoAtendimento: PeriodoAtendimento.INTEGRAL, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 1150.0 },
  { periodoAtendimento: PeriodoAtendimento.INTEGRAL, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 1400.0 },
  { periodoAtendimento: PeriodoAtendimento.INTEGRAL, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1700.0 },
  // DIURNO
  { periodoAtendimento: PeriodoAtendimento.DIURNO, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 600.0  },
  { periodoAtendimento: PeriodoAtendimento.DIURNO, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 750.0  },
  { periodoAtendimento: PeriodoAtendimento.DIURNO, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 920.0  },
  { periodoAtendimento: PeriodoAtendimento.DIURNO, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1150.0 },
  // NOTURNO
  { periodoAtendimento: PeriodoAtendimento.NOTURNO, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 650.0  },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 800.0  },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 980.0  },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1220.0 },
  // DIURNO + FDS
  { periodoAtendimento: PeriodoAtendimento.DIURNO_FDS, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 720.0  },
  { periodoAtendimento: PeriodoAtendimento.DIURNO_FDS, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 900.0  },
  { periodoAtendimento: PeriodoAtendimento.DIURNO_FDS, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 1100.0 },
  { periodoAtendimento: PeriodoAtendimento.DIURNO_FDS, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1380.0 },
  // NOTURNO + FDS
  { periodoAtendimento: PeriodoAtendimento.NOTURNO_FDS, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 1,   faixaUnidadesMax: 50,  custoMensal: 780.0  },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO_FDS, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 51,  faixaUnidadesMax: 100, custoMensal: 980.0  },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO_FDS, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 101, faixaUnidadesMax: 200, custoMensal: 1180.0 },
  { periodoAtendimento: PeriodoAtendimento.NOTURNO_FDS, tipoCondominio: TipoCondominio.HORIZONTAL, faixaUnidadesMin: 201, faixaUnidadesMax: 999, custoMensal: 1480.0 },
];

export async function seedOpexCentral() {
  console.log('Populando tabela OPEX Central...');

  // Limpa e recria para garantir consistência
  await prisma.opexCentral.deleteMany();
  await prisma.opexCentral.createMany({ data: opexData });

  console.log(`${opexData.length} registros OPEX Central criados.`);
}

if (require.main === module) {
  seedOpexCentral()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
