import {
  Controller, Post, Get, Delete, Param, UploadedFile,
  UseInterceptors, Body, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FotoCategoria } from '@prisma/client';
import { FotosService } from './fotos.service';

@ApiTags('Fotos')
@ApiBearerAuth()
@Controller('vistorias/:vistoriaId/fotos')
export class FotosController {
  constructor(private service: FotosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar fotos da vistoria' })
  findAll(@Param('vistoriaId') vistoriaId: string) {
    return this.service.findByVistoria(vistoriaId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de foto (máx 10 por vistoria)' })
  upload(
    @Param('vistoriaId') vistoriaId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('categoria') categoria: FotoCategoria,
    @Body('descricao') descricao?: string,
  ) {
    if (!file) throw new BadRequestException('Arquivo não recebido. Verifique o campo "file" no formulário.');
    return this.service.upload(vistoriaId, file, categoria, descricao);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover foto' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
