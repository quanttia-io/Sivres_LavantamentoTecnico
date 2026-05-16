import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssinaturaTipo } from '@prisma/client';
import { AssinaturasService } from './assinaturas.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsEnum, IsString } from 'class-validator';

class SalvarAssinaturaDto {
  @IsEnum(AssinaturaTipo)
  tipo: AssinaturaTipo;

  @IsString()
  base64Png: string;
}

@ApiTags('Assinaturas')
@ApiBearerAuth()
@Controller('vistorias/:vistoriaId/assinaturas')
export class AssinaturasController {
  constructor(private service: AssinaturasService) {}

  @Get()
  findAll(@Param('vistoriaId') vistoriaId: string) {
    return this.service.findByVistoria(vistoriaId);
  }

  @Post()
  @ApiOperation({ summary: 'Salvar assinatura (base64 PNG)' })
  salvar(
    @Param('vistoriaId') vistoriaId: string,
    @Body() dto: SalvarAssinaturaDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.service.salvar(vistoriaId, user.id, dto.tipo, dto.base64Png);
  }
}
