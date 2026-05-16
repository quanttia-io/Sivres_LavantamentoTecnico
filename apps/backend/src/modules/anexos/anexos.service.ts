import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AnexoTipo } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AnexosService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async upload(vistoriaId: string, file: Express.Multer.File, tipo: AnexoTipo) {
    const ext = file.originalname.split('.').pop() ?? 'pdf';
    const storageKey = `vistorias/${vistoriaId}/anexos/${uuid()}.${ext}`;
    const url = await this.storage.upload(
      this.storage.getBucketAnexos(),
      storageKey,
      file.buffer,
      file.mimetype,
    );

    return this.prisma.vistoriaAnexo.create({
      data: {
        vistoriaId,
        tipo,
        nome: file.originalname,
        storageKey,
        url,
        mimeType: file.mimetype,
      },
    });
  }

  async findByVistoria(vistoriaId: string) {
    return this.prisma.vistoriaAnexo.findMany({ where: { vistoriaId }, orderBy: { createdAt: 'asc' } });
  }

  async remove(id: string) {
    const anexo = await this.prisma.vistoriaAnexo.findUnique({ where: { id } });
    if (!anexo) throw new NotFoundException('Anexo não encontrado');
    await this.storage.delete(this.storage.getBucketAnexos(), anexo.storageKey);
    return this.prisma.vistoriaAnexo.delete({ where: { id } });
  }
}
