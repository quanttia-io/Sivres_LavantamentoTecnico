import { InternetPagoPor, MargemTipo, TipoContrato } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class CalcularPrecoDto {
  @IsEnum(TipoContrato)
  @IsOptional()
  tipoContrato?: TipoContrato;

  @IsEnum(InternetPagoPor)
  @IsOptional()
  internetPagoPor?: InternetPagoPor;

  @IsBoolean()
  @IsOptional()
  celularZelador?: boolean;

  @IsEnum(MargemTipo)
  @IsOptional()
  margemTipo?: MargemTipo;
}
