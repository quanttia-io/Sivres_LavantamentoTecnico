import { TipoPortaria } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class ConfiguracaoEntradasDto {
  @IsEnum(TipoPortaria)
  tipoPortaria: TipoPortaria;

  @IsInt() @Min(1)
  qtdUnidades: number;

  @IsBoolean() @IsOptional()
  tipoCondominioVertical?: boolean;

  // ─── PORTÕES PEDESTRE ────────────────────────────────────────────────────
  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pedPivManual?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pedPivAuto?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pedDeslPiso?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pedDeslTeto?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pedPivVidro?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pedOutro?: number;

  // ─── CONTROLE PEDESTRE ───────────────────────────────────────────────────
  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  eclusaPedestre?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  leitorTagPedestre?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  biometriaDigital?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  biometriaFacial?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  opcaoSaidaPedestres?: number; // 0=Interfone, 1=Botão

  // ─── CÂMERAS E INTERFONES ────────────────────────────────────────────────
  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  interfoneAut?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  camerasPortariaAut?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  interfoneRem?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  camerasPortariaRem?: number;

  @IsBoolean() @IsOptional()
  integracaoInterfone?: boolean;

  // ─── ELEVADORES ──────────────────────────────────────────────────────────
  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  elevadoresMonitorados?: number;

  // ─── ACESSO VEÍCULOS — PORTÕES ───────────────────────────────────────────
  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  deslP?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  deslM?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  deslG?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  bascSimples?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pivSimples?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pivDuplo?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  veiOutro?: number;

  // ─── ACESSO VEÍCULOS — MOTORES ───────────────────────────────────────────
  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  motorDeslP?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  motorDeslM?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  motorDeslG?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  motorBasc?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  motorPivSimples?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  motorPivDuplo?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  motorOutro?: number;

  // ─── ACESSO VEÍCULOS — CONTROLE ──────────────────────────────────────────
  @IsBoolean() @IsOptional()
  controleRemoto?: boolean;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  antenasTagVeicular?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  biometriaFacialVeiculo?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  eclusaVeiculo?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  intertravamentoPedestre?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  refletores?: number;

  // ─── PROTEÇÃO PERÍMETRO ──────────────────────────────────────────────────
  @IsNumber() @Min(0) @IsOptional()
  metrosCerca?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  sensoresBarreira?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  cercaEletrica?: number; // 0=Nenhuma, 1=Completa, 2=Apenas fiação

  // ─── DISPOSITIVOS ────────────────────────────────────────────────────────
  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  tagPedestre?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  pulseiraPedestre?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  controleVeiculos?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  tagVeicularComum?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  tagVeicularBlindada?: number;

  // ─── LIXEIRA ─────────────────────────────────────────────────────────────
  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  lixeiraModalidade?: number; // 0=Nenhum, 1=Interfone, 2=Botão

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  lixeiraPivManual?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  lixeiraDeslPiso?: number;

  // ─── HALL DE PEDESTRES ───────────────────────────────────────────────────
  @IsBoolean() @IsOptional()
  hallAberturaTemporizador?: boolean;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  hallPivManual?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  hallPivAuto?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  hallDeslPiso?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  hallDeslTeto?: number;

  @IsInt() @Min(0) @IsOptional() @Type(() => Number)
  hallPivVidro?: number;

  // ─── OUTROS ──────────────────────────────────────────────────────────────
  @IsBoolean() @IsOptional()
  celularZelador?: boolean;
}
