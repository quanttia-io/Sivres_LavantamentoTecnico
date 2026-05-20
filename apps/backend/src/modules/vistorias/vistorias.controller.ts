import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VistoriasService } from './vistorias.service';
import { CreateVistoriaDto, UpdateVistoriaDto, FilterVistoriaDto } from './dto/create-vistoria.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

interface UserCtx { id: string; role: Role; }

@ApiTags('Vistorias')
@ApiBearerAuth()
@Controller('vistorias')
export class VistoriasController {
  constructor(private service: VistoriasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar vistorias' })
  findAll(@CurrentUser() user: UserCtx, @Query() filter: FilterVistoriaDto) {
    return this.service.findAll(user, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar vistoria por ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova vistoria' })
  create(@Body() dto: CreateVistoriaDto, @CurrentUser() user: UserCtx) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar vistoria' })
  update(@Param('id') id: string, @Body() dto: UpdateVistoriaDto, @CurrentUser() user: UserCtx) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/finalizar')
  @ApiOperation({ summary: 'Finalizar vistoria (enviar para aprovação)' })
  finalizar(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.service.finalizar(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir vistoria (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.service.remove(id, user);
  }

  @Put(':id/itens')
  @ApiOperation({ summary: 'Substituir lista de itens da vistoria' })
  updateItens(@Param('id') id: string, @Body() body: { itens: { produtoId: string; quantidade: number }[] }, @CurrentUser() user: UserCtx) {
    return this.service.updateItens(id, body.itens, user);
  }

  @Post(':id/lock')
  @ApiOperation({ summary: 'Adquirir lock de edição' })
  acquireLock(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.service.acquireLock(id, user);
  }

  @Delete(':id/lock')
  @ApiOperation({ summary: 'Liberar lock de edição' })
  releaseLock(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.service.releaseLock(id, user);
  }
}
