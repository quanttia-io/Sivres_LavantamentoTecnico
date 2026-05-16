import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacoesService } from './notificacoes.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notificações')
@ApiBearerAuth()
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private service: NotificacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário autenticado' })
  findAll(@CurrentUser() user: { id: string }, @Query('naoLidas') naoLidas?: string) {
    return this.service.findByUser(user.id, naoLidas === 'true');
  }

  @Get('count')
  @ApiOperation({ summary: 'Contar notificações não lidas' })
  async count(@CurrentUser() user: { id: string }) {
    const count = await this.service.countNaoLidas(user.id);
    return { count };
  }

  @Patch(':id/ler')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  marcarLida(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.service.marcarLida(id, user.id);
  }

  @Patch('ler-todas')
  @ApiOperation({ summary: 'Marcar todas notificações como lidas' })
  marcarTodasLidas(@CurrentUser() user: { id: string }) {
    return this.service.marcarTodasLidas(user.id);
  }
}
