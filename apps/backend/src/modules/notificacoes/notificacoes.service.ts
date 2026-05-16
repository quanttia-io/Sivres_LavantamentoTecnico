import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoTipo } from '@prisma/client';

interface CriarNotificacaoDto {
  userId: string;
  vistoriaId?: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
}

@Injectable()
export class NotificacoesService {
  constructor(private prisma: PrismaService) {}

  async criar(dto: CriarNotificacaoDto) {
    return this.prisma.notificacao.create({ data: dto });
  }

  async findByUser(userId: string, apenasNaoLidas = false) {
    return this.prisma.notificacao.findMany({
      where: { userId, ...(apenasNaoLidas && { lida: false }) },
      include: { vistoria: { select: { id: true, numero: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async marcarLida(id: string, userId: string) {
    return this.prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  }

  async marcarTodasLidas(userId: string) {
    return this.prisma.notificacao.updateMany({
      where: { userId, lida: false },
      data: { lida: true },
    });
  }

  async countNaoLidas(userId: string): Promise<number> {
    return this.prisma.notificacao.count({ where: { userId, lida: false } });
  }
}
