import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FotoCategoria } from '@prisma/client';
import { v4 as uuid } from 'uuid';

const MAX_FOTOS = 10;

@Injectable()
export class FotosService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async upload(
    vistoriaId: string,
    file: Express.Multer.File,
    categoria: FotoCategoria,
    descricao?: string,
  ) {
    const count = await this.prisma.vistoriaFoto.count({ where: { vistoriaId } });
    if (count >= MAX_FOTOS) {
      throw new BadRequestException(`Máximo de ${MAX_FOTOS} fotos por vistoria`);
    }

    const ext = file.mimetype.split('/')[1] ?? 'jpg';
    const storageKey = `vistorias/${vistoriaId}/fotos/${uuid()}.${ext}`;
    const url = await this.storage.upload(
      this.storage.getBucketFotos(),
      storageKey,
      file.buffer,
      file.mimetype,
    );

    return this.prisma.vistoriaFoto.create({
      data: {
        vistoriaId,
        categoria,
        descricao,
        storageKey,
        url,
        tamanhoBytes: file.size,
        ordem: count + 1,
      },
    });
  }

  async findByVistoria(vistoriaId: string) {
    return this.prisma.vistoriaFoto.findMany({
      where: { vistoriaId },
      orderBy: { ordem: 'asc' },
    });
  }

  async remove(id: string) {
    const foto = await this.prisma.vistoriaFoto.findUnique({ where: { id } });
    if (!foto) throw new NotFoundException('Foto não encontrada');

    await this.storage.delete(this.storage.getBucketFotos(), foto.storageKey);
    return this.prisma.vistoriaFoto.delete({ where: { id } });
  }
}
