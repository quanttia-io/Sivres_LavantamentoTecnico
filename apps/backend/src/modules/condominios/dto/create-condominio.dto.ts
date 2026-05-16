import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateCondominioDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @IsString()
  @MinLength(5, { message: 'Endereço deve ter no mínimo 5 caracteres' })
  endereco: string;

  @IsString()
  @MinLength(2)
  cidade: string;

  @IsString()
  @MinLength(2)
  estado: string;
}

export class UpdateCondominioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nome?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string;
}
