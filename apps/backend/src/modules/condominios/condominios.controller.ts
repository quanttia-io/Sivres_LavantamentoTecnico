import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CondominiosService } from './condominios.service';
import { CreateCondominioDto, UpdateCondominioDto } from './dto/create-condominio.dto';

@ApiTags('Condominios')
@ApiBearerAuth()
@Controller('condominios')
export class CondominiosController {
  constructor(private service: CondominiosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar condomínios' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar condomínio por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar condomínio' })
  create(@Body() dto: CreateCondominioDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar condomínio' })
  update(@Param('id') id: string, @Body() dto: UpdateCondominioDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover condomínio (soft delete)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
