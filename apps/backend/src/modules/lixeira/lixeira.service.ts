import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

interface UserCtx { id: string; role: Role; }

@Injectable()
export class LixeiraService {
  constructor(private prisma: PrismaService) {}

  async listar() {
    return this.prisma.vistoria.findMany({
      where: { deletedAt: { not: null } },
      include: {
        condominio: { select: { nome: true } },
        supervisor: { select: { name: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async recuperar(id: string, user: UserCtx) {
    if (user.role !== Role.ADMINISTRADOR) {
      throw new ForbiddenException('Apenas Administrador pode recuperar vistorias da lixeira');
    }

    return this.prisma.vistoria.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async excluirPermanente(id: string, user: UserCtx) {
    if (user.role !== Role.ADMINISTRADOR) {
      throw new ForbiddenException('Apenas Administrador pode excluir permanentemente');
    }
    return this.prisma.vistoria.delete({ where: { id } });
  }
}
