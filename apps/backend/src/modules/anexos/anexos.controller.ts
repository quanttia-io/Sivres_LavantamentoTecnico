import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AnexoTipo } from '@prisma/client';
import { AnexosService } from './anexos.service';

@ApiTags('Anexos')
@ApiBearerAuth()
@Controller('vistorias/:vistoriaId/anexos')
export class AnexosController {
  constructor(private service: AnexosService) {}

  @Get()
  findAll(@Param('vistoriaId') vistoriaId: string) {
    return this.service.findByVistoria(vistoriaId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de anexo (PDF, JPG, PNG)' })
  upload(
    @Param('vistoriaId') vistoriaId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('tipo') tipo: AnexoTipo,
  ) {
    return this.service.upload(vistoriaId, file, tipo);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
