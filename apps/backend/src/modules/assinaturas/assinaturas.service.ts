import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AssinaturaTipo } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AssinaturasService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async salvar(vistoriaId: string, userId: string, tipo: AssinaturaTipo, base64Png: string) {
    const existente = await this.prisma.assinatura.findFirst({
      where: { vistoriaId, tipo },
    });
    if (existente) throw new ConflictException(`Assinatura de ${tipo} já registrada`);

    // Remove header data:image/png;base64,
    const base64Data = base64Png.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const storageKey = `vistorias/${vistoriaId}/assinaturas/${tipo.toLowerCase()}-${uuid()}.png`;
    const url = await this.storage.upload(
      this.storage.getBucketAssinaturas(),
      storageKey,
      buffer,
      'image/png',
    );

    return this.prisma.assinatura.create({
      data: { vistoriaId, userId, tipo, storageKey, url },
    });
  }

  async findByVistoria(vistoriaId: string) {
    return this.prisma.assinatura.findMany({
      where: { vistoriaId },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
