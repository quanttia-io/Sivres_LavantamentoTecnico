import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChecklistService, ResponderChecklistDto } from './checklist.service';

@ApiTags('Checklist')
@ApiBearerAuth()
@Controller('vistorias/:vistoriaId/checklist')
export class ChecklistController {
  constructor(private service: ChecklistService) {}

  @Get()
  @ApiOperation({ summary: 'Listar checklist da vistoria' })
  findAll(@Param('vistoriaId') vistoriaId: string) {
    return this.service.findByVistoria(vistoriaId);
  }

  @Post('responder')
  @ApiOperation({ summary: 'Responder item do checklist' })
  responder(@Param('vistoriaId') vistoriaId: string, @Body() dto: ResponderChecklistDto) {
    return this.service.responder(vistoriaId, dto);
  }

  @Put('lote')
  @ApiOperation({ summary: 'Responder múltiplos itens do checklist' })
  responderLote(@Param('vistoriaId') vistoriaId: string, @Body() itens: ResponderChecklistDto[]) {
    return this.service.responderLote(vistoriaId, itens);
  }
}
