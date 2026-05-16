import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AprovacaoService } from './aprovacao.service';
import { AprovarDto } from './dto/aprovar.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Aprovação')
@ApiBearerAuth()
@Controller('vistorias/:id/aprovacao')
export class AprovacaoController {
  constructor(private service: AprovacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Aprovar, reprovar ou solicitar ajuste' })
  aprovar(
    @Param('id') vistoriaId: string,
    @Body() dto: AprovarDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.service.aprovar(vistoriaId, dto, user);
  }

  @Get('historico')
  @ApiOperation({ summary: 'Histórico de aprovações da vistoria' })
  historico(@Param('id') vistoriaId: string) {
    return this.service.historico(vistoriaId);
  }
}
