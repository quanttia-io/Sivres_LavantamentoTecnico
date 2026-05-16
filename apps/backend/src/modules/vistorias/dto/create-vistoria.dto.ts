import {
  IsString, IsEnum, IsOptional, IsInt, IsBoolean, Min, IsUUID,
} from 'class-validator';
import { TipoPortaria, TipoRecolhimento } from '@prisma/client';

export class CreateVistoriaDto {
  @IsUUID()
  condominioId: string;

  @IsUUID()
  supervisorId: string;

  @IsUUID()
  consultorId: string;

  @IsEnum(TipoPortaria, { message: 'Tipo de portaria inválido' })
  tipoPortaria: TipoPortaria;

  @IsOptional()
  @IsInt()
  @Min(1)
  qtdUnidades?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtdPortoesVeiculares?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtdPortoesPedestres?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtdElevadores?: number;

  @IsOptional()
  @IsBoolean()
  possuiLixeira?: boolean;

  @IsOptional()
  @IsEnum(TipoRecolhimento)
  tipoRecolhimento?: TipoRecolhimento;

  @IsOptional()
  @IsString()
  observacoesGerais?: string;
}

export class UpdateVistoriaDto {
  @IsOptional()
  @IsUUID()
  condominioId?: string;

  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @IsOptional()
  @IsUUID()
  consultorId?: string;

  @IsOptional()
  @IsEnum(TipoPortaria)
  tipoPortaria?: TipoPortaria;

  @IsOptional()
  @IsInt()
  @Min(1)
  qtdUnidades?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtdPortoesVeiculares?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtdPortoesPedestres?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtdElevadores?: number;

  @IsOptional()
  @IsBoolean()
  possuiLixeira?: boolean;

  @IsOptional()
  @IsEnum(TipoRecolhimento)
  tipoRecolhimento?: TipoRecolhimento;

  @IsOptional()
  @IsString()
  observacoesGerais?: string;
}

export class FilterVistoriaDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  tipoPortaria?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
