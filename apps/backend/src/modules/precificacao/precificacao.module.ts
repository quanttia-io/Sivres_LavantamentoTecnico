import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrecificacaoController } from './precificacao.controller';
import { PrecificacaoService } from './precificacao.service';

@Module({
  imports: [PrismaModule],
  controllers: [PrecificacaoController],
  providers: [PrecificacaoService],
  exports: [PrecificacaoService],
})
export class PrecificacaoModule {}
