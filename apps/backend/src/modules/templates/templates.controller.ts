import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role, TipoPortaria } from '@prisma/client';
import { TemplatesService, UpsertTemplateItemDto } from './templates.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private service: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os templates' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':tipo')
  @ApiOperation({ summary: 'Buscar template por tipo de portaria' })
  findByTipo(@Param('tipo') tipo: TipoPortaria) {
    return this.service.findByTipo(tipo);
  }

  @Post(':tipo/itens')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Adicionar/atualizar item no template' })
  upsertItem(@Param('tipo') tipo: TipoPortaria, @Body() dto: UpsertTemplateItemDto) {
    return this.service.upsertItem(tipo, dto);
  }

  @Delete(':tipo/itens/:produtoId')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Remover item do template' })
  removeItem(@Param('tipo') tipo: TipoPortaria, @Param('produtoId') produtoId: string) {
    return this.service.removeItem(tipo, produtoId);
  }
}
