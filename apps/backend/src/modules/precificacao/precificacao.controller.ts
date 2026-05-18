import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CalcularPrecoDto } from './dto/calcular-preco.dto';
import { PrecificacaoService } from './precificacao.service';

@ApiTags('Precificação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('precificacao')
export class PrecificacaoController {
  constructor(private readonly precificacaoService: PrecificacaoService) {}

  @Post(':vistoriaId/calcular')
  @ApiOperation({ summary: 'Calcula e salva precificação da vistoria' })
  calcular(
    @Param('vistoriaId') vistoriaId: string,
    @Body() dto: CalcularPrecoDto,
  ) {
    return this.precificacaoService.calcular(vistoriaId, dto);
  }

  @Get(':vistoriaId')
  @ApiOperation({ summary: 'Retorna resumo de precificação já calculado' })
  obterResumo(@Param('vistoriaId') vistoriaId: string) {
    return this.precificacaoService.obterResumo(vistoriaId);
  }
}
