import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RegistrarParams {
  vistoriaId?: string;
  userId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  dadosAntes?: Record<string, unknown>;
  dadosDepois?: Record<string, unknown>;
}

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  async registrar(params: RegistrarParams) {
    return this.prisma.auditLog.create({
      data: {
        ...params,
        dadosAntes: (params.dadosAntes ?? null) as any,
        dadosDepois: (params.dadosDepois ?? null) as any,
      },
    });
  }

  async findByVistoria(vistoriaId: string) {
    return this.prisma.auditLog.findMany({
      where: { vistoriaId },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        include: {
          user: { select: { id: true, name: true, role: true } },
          vistoria: { select: { id: true, numero: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return { items, total, page, limit };
  }
}
