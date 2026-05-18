import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfiguradorService } from './configurador.service';
import { ConfiguracaoEntradasDto } from './dto/configuracao-entradas.dto';

@ApiTags('Configurador')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('configurador')
export class ConfiguradorController {
  constructor(private readonly configuradorService: ConfiguradorService) {}

  @Post('calcular')
  @ApiOperation({ summary: 'Calcula lista de produtos para os dados informados (sem salvar)' })
  calcular(@Body() dto: ConfiguracaoEntradasDto) {
    return this.configuradorService.calcularItens(dto);
  }

  @Post('aplicar/:vistoriaId')
  @ApiOperation({ summary: 'Calcula e salva produtos auto-gerados na vistoria' })
  aplicar(
    @Param('vistoriaId') vistoriaId: string,
    @Body() dto: ConfiguracaoEntradasDto,
  ) {
    return this.configuradorService.aplicarNaVistoria(vistoriaId, dto);
  }
}
