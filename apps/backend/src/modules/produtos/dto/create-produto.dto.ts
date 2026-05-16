import { IsString, IsNumber, IsPositive, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProdutoDto {
  @IsString()
  codigo: string;

  @IsString()
  descricao: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo: number;
}

export class UpdateProdutoDto {
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
