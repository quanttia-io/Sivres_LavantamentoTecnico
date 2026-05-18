import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoPortaria } from '@prisma/client';
import { evaluate } from 'mathjs';
import { PrismaService } from '../prisma/prisma.service';
import { ConfiguracaoEntradasDto } from './dto/configuracao-entradas.dto';

export interface ItemCalculado {
  produtoId: string;
  codigo: string;
  descricao: string;
  classeEquipamento: string | null;
  custoUnit: number;
  quantidade: number;
  custoTotal: number;
}

@Injectable()
export class ConfiguradorService {
  constructor(private readonly prisma: PrismaService) {}

  async calcularItens(dto: ConfiguracaoEntradasDto): Promise<ItemCalculado[]> {
    const produtos = await this.prisma.produto.findMany({
      where: { ativo: true },
    });

    const ctx = this.montarContexto(dto);
    const isAut = dto.tipoPortaria === TipoPortaria.AUTONOMA;

    const resultado: ItemCalculado[] = [];

    for (const produto of produtos) {
      const formula = isAut ? produto.regraQtdAut : produto.regraQtdRem;
      if (!formula) continue;

      try {
        const qtd = this.avaliarFormula(formula, ctx);
        if (qtd > 0) {
          resultado.push({
            produtoId: produto.id,
            codigo: produto.codigo,
            descricao: produto.descricao,
            classeEquipamento: produto.classeEquipamento,
            custoUnit: Number(produto.custo),
            quantidade: qtd,
            custoTotal: Number(produto.custo) * qtd,
          });
        }
      } catch {
        // Fórmula inválida — ignora produto silenciosamente
      }
    }

    return resultado.sort((a, b) => {
      const ordem = ['REDE', 'CONTROLE', 'VOIP', 'CFTV', 'AUTOMACAO', 'ENERGIA', 'INFRA', 'ALARME', 'PERIMETRO', 'DISPOSITIVO'];
      return (ordem.indexOf(a.classeEquipamento ?? '') ?? 99) - (ordem.indexOf(b.classeEquipamento ?? '') ?? 99);
    });
  }

  async aplicarNaVistoria(
    vistoriaId: string,
    dto: ConfiguracaoEntradasDto,
  ): Promise<ItemCalculado[]> {
    const vistoria = await this.prisma.vistoria.findUnique({
      where: { id: vistoriaId },
    });
    if (!vistoria) throw new NotFoundException('Vistoria não encontrada');

    const itens = await this.calcularItens(dto);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.vistoriaItem.deleteMany({
        where: { vistoriaId, autoGerado: true },
      });

      for (const item of itens) {
        await tx.vistoriaItem.upsert({
          where: {
            vistoriaId_produtoId: { vistoriaId, produtoId: item.produtoId },
          },
          update: {
            quantidade: item.quantidade,
            custoUnit: item.custoUnit,
            autoGerado: true,
          },
          create: {
            vistoriaId,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            custoUnit: item.custoUnit,
            autoGerado: true,
          },
        });
      }

      await tx.vistoria.update({
        where: { id: vistoriaId },
        data: {
          dadosConfiguracao: dto as object,
          tipoCondominio: dto.tipoCondominioVertical !== false ? 'VERTICAL' : 'HORIZONTAL',
        },
      });
    });

    return itens;
  }

  // ── Privado ────────────────────────────────────────────────────────────────

  private montarContexto(dto: ConfiguracaoEntradasDto): Record<string, number> {
    const n = (v?: number | boolean | null): number => {
      if (v === undefined || v === null) return 0;
      if (typeof v === 'boolean') return v ? 1 : 0;
      return Number(v);
    };

    // Portões pedestre
    const pedPivManual  = n(dto.pedPivManual);
    const pedPivAuto    = n(dto.pedPivAuto);
    const pedDeslPiso   = n(dto.pedDeslPiso);
    const pedDeslTeto   = n(dto.pedDeslTeto);
    const pedPivVidro   = n(dto.pedPivVidro);
    const pedOutro      = n(dto.pedOutro);

    // Controle pedestre
    const eclusaPed     = n(dto.eclusaPedestre);
    const leitorTagPed  = n(dto.leitorTagPedestre);
    const biomDigital   = n(dto.biometriaDigital);
    const biomFacial    = n(dto.biometriaFacial);
    const opcaoSaida    = n(dto.opcaoSaidaPedestres); // 0=Interfone, 1=Botão

    // Câmeras e interfones
    const interfoneAut  = n(dto.interfoneAut);
    const camAut        = n(dto.camerasPortariaAut);
    const interfoneRem  = n(dto.interfoneRem);
    const camRem        = n(dto.camerasPortariaRem);
    const integInterf   = n(dto.integracaoInterfone);

    // Elevadores
    const camElev       = n(dto.elevadoresMonitorados);

    // Portões veículos
    const deslP         = n(dto.deslP);
    const deslM         = n(dto.deslM);
    const deslG         = n(dto.deslG);
    const bascSimples   = n(dto.bascSimples);
    const pivSimples    = n(dto.pivSimples);
    const pivDuplo      = n(dto.pivDuplo);
    const veiOutro      = n(dto.veiOutro);

    // Motores veículos
    const motorDeslP    = n(dto.motorDeslP);
    const motorDeslM    = n(dto.motorDeslM);
    const motorDeslG    = n(dto.motorDeslG);
    const motorBasc     = n(dto.motorBasc);
    const motorPivS     = n(dto.motorPivSimples);
    const motorPivD     = n(dto.motorPivDuplo);
    const motorOutro    = n(dto.motorOutro);

    // Controle veículos
    const ctrlRemoto    = n(dto.controleRemoto);
    const antenasTag    = n(dto.antenasTagVeicular);
    const biomFacialVei = n(dto.biometriaFacialVeiculo);
    const eclusaVei     = n(dto.eclusaVeiculo);
    const intertravPed  = n(dto.intertravamentoPedestre);
    const refletores    = n(dto.refletores);

    // Proteção perímetro
    const metrosCerca   = n(dto.metrosCerca);
    const sensoresBar   = n(dto.sensoresBarreira);
    const cercaTipo     = n(dto.cercaEletrica); // 0=Nenhuma, 1=Completa, 2=Apenas fiação

    // Dispositivos
    const tagPedestre   = n(dto.tagPedestre);
    const pulseiraPed   = n(dto.pulseiraPedestre);
    const ctrlVeiculos  = n(dto.controleVeiculos);
    const tagVeiComum   = n(dto.tagVeicularComum);
    const tagVeiBlinc   = n(dto.tagVeicularBlindada);

    // Lixeira
    const lixeiraModal  = n(dto.lixeiraModalidade); // 0=Nenhum, 1=Interfone, 2=Botão
    const lixPivMan     = n(dto.lixeiraPivManual);
    const lixDeslPiso   = n(dto.lixeiraDeslPiso);

    // Hall de pedestres
    const hallAbertura  = n(dto.hallAberturaTemporizador);
    const hallPivMan    = n(dto.hallPivManual);
    const hallPivAuto   = n(dto.hallPivAuto);
    const hallDeslPiso  = n(dto.hallDeslPiso);
    const hallDeslTeto  = n(dto.hallDeslTeto);
    const hallPivVidro  = n(dto.hallPivVidro);

    // Outros
    const celularZelador = n(dto.celularZelador);

    // Calculated tubulations (auto-computed, not user inputs)
    const tubAut = 20 + 10 * camAut + 20 * sensoresBar + 30 * camElev;
    const tubRem = 20 + 10 * camRem + 20 * sensoresBar + 30 * camElev;
    const totalPortoesVei = deslP + deslM + deslG + bascSimples + pivSimples + pivDuplo + veiOutro;
    const tubVei = 30 * totalPortoesVei;

    return {
      // Condomínio
      qtd_unidades:       n(dto.qtdUnidades),
      tipo_condominio:    dto.tipoCondominioVertical !== false ? 1 : 0,

      // Portões pedestre (H12-H17)
      ped_piv_manual:     pedPivManual,
      ped_piv_auto:       pedPivAuto,
      ped_desl_piso:      pedDeslPiso,
      ped_desl_teto:      pedDeslTeto,
      ped_piv_vidro:      pedPivVidro,
      ped_outro:          pedOutro,

      // Controle pedestre (H20-H23 + H28)
      eclusa_pedestre:    eclusaPed,
      leitor_tag_ped:     leitorTagPed,
      biometria_digital:  biomDigital,
      biometria_facial:   biomFacial,
      opcao_saida_ped:    opcaoSaida,    // 0=Interfone, 1=Botão

      // Autônoma (H24-H25)
      interfone_aut:      interfoneAut,
      cam_aut:            camAut,

      // Atend. CCC (H29-H31)
      interfone_rem:      interfoneRem,
      cam_rem:            camRem,
      integracao_interfone: integInterf,

      // Tubulações calculadas (H27, H33)
      tub_aut:            tubAut,
      tub_rem:            tubRem,

      // Elevadores (H34)
      cam_elev:           camElev,

      // Acesso veículos controle (H35-H40)
      controle_remoto:    ctrlRemoto,
      antenas_tag_vei:    antenasTag,
      biometria_facial_vei: biomFacialVei,
      eclusa_veiculo:     eclusaVei,
      intertrav_ped:      intertravPed,
      refletores:         refletores,

      // Portões veículos (H41-H47)
      desl_p:             deslP,
      desl_m:             deslM,
      desl_g:             deslG,
      basc_simples:       bascSimples,
      piv_simples:        pivSimples,
      piv_duplo:          pivDuplo,
      vei_outro:          veiOutro,

      // Motores veículos (H48-H54)
      motor_desl_p:       motorDeslP,
      motor_desl_m:       motorDeslM,
      motor_desl_g:       motorDeslG,
      motor_basc:         motorBasc,
      motor_piv_simples:  motorPivS,
      motor_piv_duplo:    motorPivD,
      motor_outro:        motorOutro,

      // Tubulação veículo calculada (H57)
      tub_vei:            tubVei,

      // Proteção perímetro (H58-H60)
      metros_cerca:       metrosCerca,
      sensores_barreira:  sensoresBar,
      cerca_tipo:         cercaTipo,     // 0=Nenhuma, 1=Completa, 2=Apenas fiação

      // Dispositivos (H61-H65)
      tag_pedestre:       tagPedestre,
      pulseira_ped:       pulseiraPed,
      controle_veiculos:  ctrlVeiculos,
      tag_vei_comum:      tagVeiComum,
      tag_vei_blindada:   tagVeiBlinc,

      // Lixeira (H66, H68-H69)
      lixeira_modal:      lixeiraModal,  // 0=Nenhum, 1=Interfone, 2=Botão
      lixeira_piv_manual: lixPivMan,
      lixeira_desl_piso:  lixDeslPiso,

      // Hall de pedestres (H71-H76)
      hall_abertura:      hallAbertura,
      hall_piv_manual:    hallPivMan,
      hall_piv_auto:      hallPivAuto,
      hall_desl_piso:     hallDeslPiso,
      hall_desl_teto:     hallDeslTeto,
      hall_piv_vidro:     hallPivVidro,

      // Outros (H79)
      celular_zelador:    celularZelador,
    };
  }

  private avaliarFormula(formula: string, ctx: Record<string, number>): number {
    const result = evaluate(formula, ctx);
    const qtd = Math.round(Number(result));
    return Math.max(0, qtd);
  }
}
