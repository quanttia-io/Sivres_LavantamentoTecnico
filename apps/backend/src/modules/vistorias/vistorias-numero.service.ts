import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VistoriasNumeroService {
  constructor(private prisma: PrismaService) {}

  async gerarNumero(): Promise<{ numero: string; ano: number; sequencia: number }> {
    const ano = new Date().getFullYear();

    const seq = await this.prisma.$transaction(async (tx) => {
      const current = await tx.vistoriaSequence.upsert({
        where: { ano },
        update: { ultimo: { increment: 1 } },
        create: { ano, ultimo: 1 },
      });
      return current.ultimo;
    });

    const numero = `PR_${ano}_${String(seq).padStart(5, '0')}`;
    return { numero, ano, sequencia: seq };
  }
}
