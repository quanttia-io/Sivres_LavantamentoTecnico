import { IsEnum, IsString, MinLength } from 'class-validator';
import { AprovacaoAcao } from '@prisma/client';

export class AprovarDto {
  @IsEnum(AprovacaoAcao, { message: 'Ação inválida' })
  acao: AprovacaoAcao;

  @IsString()
  @MinLength(10, { message: 'Comentário deve ter no mínimo 10 caracteres' })
  comentario: string;
}
