import { Injectable, NotFoundException } from '@nestjs/common';
import {
  InternetPagoPor,
  MargemTipo,
  PeriodoAtendimento,
  TipoCondominio,
  TipoContrato,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CalcularPrecoDto } from './dto/calcular-preco.dto';

const TRIBUTACAO = 0.17;
const TAXA_MENSAL = 0.012;
const MARGEM_ESSENCIAL = 400;
const MARGEM_COMPLETA = 1000;
const OPEX_INTERNET = 220;
const OPEX_CELULAR_ZELADOR = 30;
const ARREDONDAMENTO = 5;

export interface OpcaoContrato {
  tipo: string;
  meses: number | null;
  mensalidade: number | null;
  valorTotal: number | null;
  parcelas?: ParcelaOpcao[];
}

interface ParcelaOpcao {
  nParcelas: number;
  taxaMensal: number;
  valorParcela: number;
}

export interface ResumoPrecificacao {
  capexTotal: number;
  capexRecuperavel: number;
  capexNaoRecuperavel: number;
  opexLocal: number;
  opexCentral: number;
  opexMensal: number;
  margem: number;
  opcoes: OpcaoContrato[];
}

@Injectable()
export class PrecificacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async calcular(
    vistoriaId: string,
    dto: CalcularPrecoDto,
  ): Promise<ResumoPrecificacao> {
    const vistoria = await this.prisma.vistoria.findUnique({
      where: { id: vistoriaId },
      include: { itens: { include: { produto: true } } },
    });
    if (!vistoria) throw new NotFoundException('Vistoria não encontrada');

    // ── CAPEX ─────────────────────────────────────────────────────────────
    let capexNaoRec = 0;
    let capexRec = 0;

    for (const item of vistoria.itens) {
      const custo = Number(item.custoUnit) * item.quantidade;
      const percRec = Number(item.produto.percentualRecuperavel ?? 0) / 100;
      const valRec = item.produto.valorRecuperavel
        ? Number(item.produto.valorRecuperavel) * item.quantidade
        : custo * percRec;

      capexRec += valRec;
      capexNaoRec += custo - valRec;
    }

    const capexTotal = capexNaoRec + capexRec;

    // ── OPEX Local ────────────────────────────────────────────────────────
    const pagarInternet =
      (dto.internetPagoPor ?? vistoria.internetPagoPor) === InternetPagoPor.EMPRESA;
    const temCelular = dto.celularZelador ?? vistoria.celularZelador;

    const opexLocal =
      (pagarInternet ? OPEX_INTERNET : 0) +
      (temCelular ? OPEX_CELULAR_ZELADOR : 0);

    // ── OPEX Central ─────────────────────────────────────────────────────
    const opexCentral = await this.buscarOpexCentral(
      vistoria.periodoAtendimento ?? PeriodoAtendimento.INTEGRAL,
      vistoria.tipoCondominio ?? TipoCondominio.VERTICAL,
      vistoria.qtdUnidades ?? 0,
    );

    const opexMensal = opexLocal + opexCentral;

    // ── Margem ────────────────────────────────────────────────────────────
    const tipoMargem = dto.margemTipo ?? vistoria.margemTipo ?? MargemTipo.ESSENCIAL;
    const margem = tipoMargem === MargemTipo.COMPLETA ? MARGEM_COMPLETA : MARGEM_ESSENCIAL;

    // ── Gerar opções ─────────────────────────────────────────────────────
    const opcoes: OpcaoContrato[] = [];

    for (const meses of [36, 48]) {
      const mensalidade = this.calcularMensalidade(
        capexNaoRec, capexRec, opexMensal, margem, meses,
      );
      opcoes.push({
        tipo: `COMODATO_${meses}`,
        meses,
        mensalidade,
        valorTotal: null,
      });
    }

    // Venda à vista
    const valorVenda = this.arredondar(
      (capexTotal + capexTotal * TAXA_MENSAL * 6) / (1 - TRIBUTACAO),
    );
    opcoes.push({
      tipo: 'VENDA',
      meses: null,
      mensalidade: null,
      valorTotal: valorVenda,
      parcelas: [3, 6, 9, 12].map((n) => ({
        nParcelas: n,
        taxaMensal: TAXA_MENSAL,
        valorParcela: Math.ceil(this.pmt(TAXA_MENSAL, n, valorVenda)),
      })).concat([
        { nParcelas: 36, taxaMensal: 0.0207, valorParcela: Math.ceil(this.pmt(0.0207, 36, valorVenda)) },
        { nParcelas: 48, taxaMensal: 0.0202, valorParcela: Math.ceil(this.pmt(0.0202, 48, valorVenda)) },
      ]),
    });

    // ── Persiste resultado na vistoria ────────────────────────────────────
    const opcaoAtiva = dto.tipoContrato ?? vistoria.tipoContrato ?? TipoContrato.COMODATO_36;
    const opcaoSelecionada = opcoes.find((o) => o.tipo === opcaoAtiva.toString())
      ?? opcoes.find((o) => o.tipo === 'COMODATO_36');

    await this.prisma.vistoria.update({
      where: { id: vistoriaId },
      data: {
        internetPagoPor: dto.internetPagoPor ?? vistoria.internetPagoPor,
        celularZelador: dto.celularZelador ?? vistoria.celularZelador,
        margemTipo: tipoMargem,
        tipoContrato: opcaoAtiva,
        capexTotal,
        opexMensal,
        mensalidade: opcaoSelecionada?.mensalidade ?? null,
        valorVenda,
      },
    });

    return {
      capexTotal,
      capexRecuperavel: capexRec,
      capexNaoRecuperavel: capexNaoRec,
      opexLocal,
      opexCentral,
      opexMensal,
      margem,
      opcoes,
    };
  }

  async obterResumo(vistoriaId: string): Promise<ResumoPrecificacao | null> {
    const vistoria = await this.prisma.vistoria.findUnique({
      where: { id: vistoriaId },
    });
    if (!vistoria || !vistoria.capexTotal) return null;

    // Retorna dados já calculados sem recalcular
    return this.calcular(vistoriaId, {
      internetPagoPor: vistoria.internetPagoPor ?? undefined,
      celularZelador: vistoria.celularZelador,
      margemTipo: vistoria.margemTipo ?? undefined,
      tipoContrato: vistoria.tipoContrato ?? undefined,
    });
  }

  // ── Privado ────────────────────────────────────────────────────────────

  private calcularMensalidade(
    capexNaoRec: number,
    capexRec: number,
    opexMensal: number,
    margem: number,
    meses: number,
  ): number {
    const taxaPmt = this.pmt(TAXA_MENSAL, meses, 1) / (1 - TRIBUTACAO);
    const amortizacao = (capexNaoRec * taxaPmt) / (1 - TRIBUTACAO);
    const capexRecTributado = capexRec * (TAXA_MENSAL / (1 - TRIBUTACAO));
    const opexTributado = opexMensal / (1 - TRIBUTACAO);
    const margemTributada = margem / (1 - TRIBUTACAO);

    const mensalidade = amortizacao + capexRecTributado + opexTributado + margemTributada;
    return this.arredondar(mensalidade);
  }

  /** Replica a função PMT do Excel: retorna o pagamento periódico de uma anuidade. */
  private pmt(taxa: number, nper: number, pv: number): number {
    return (pv * taxa) / (1 - Math.pow(1 + taxa, -nper));
  }

  private arredondar(valor: number): number {
    return Math.ceil(valor / ARREDONDAMENTO) * ARREDONDAMENTO;
  }

  private async buscarOpexCentral(
    periodoAtendimento: PeriodoAtendimento,
    tipoCondominio: TipoCondominio,
    qtdUnidades: number,
  ): Promise<number> {
    const registro = await this.prisma.opexCentral.findFirst({
      where: {
        periodoAtendimento,
        tipoCondominio,
        faixaUnidadesMin: { lte: qtdUnidades },
        faixaUnidadesMax: { gte: qtdUnidades },
      },
    });
    return registro ? Number(registro.custoMensal) : 800;
  }
}
