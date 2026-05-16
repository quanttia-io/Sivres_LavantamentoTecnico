import { Module } from '@nestjs/common';
import { AprovacaoService } from './aprovacao.service';
import { AprovacaoController } from './aprovacao.controller';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [AuditoriaModule, NotificacoesModule],
  controllers: [AprovacaoController],
  providers: [AprovacaoService],
})
export class AprovacaoModule {}
