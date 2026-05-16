import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoPortaria } from '@prisma/client';

export class UpsertTemplateItemDto {
  produtoId: string;
  quantidade: number;
}

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.template.findMany({
      include: { itens: { include: { produto: true } } },
    });
  }

  async findByTipo(tipoPortaria: TipoPortaria) {
    return this.prisma.template.findUnique({
      where: { tipoPortaria },
      include: { itens: { include: { produto: true } } },
    });
  }

  async upsertItem(tipoPortaria: TipoPortaria, dto: UpsertTemplateItemDto) {
    const template = await this.prisma.template.findUnique({ where: { tipoPortaria } });
    if (!template) throw new NotFoundException('Template não encontrado');

    return this.prisma.templateItem.upsert({
      where: { templateId_produtoId: { templateId: template.id, produtoId: dto.produtoId } },
      update: { quantidade: dto.quantidade },
      create: { templateId: template.id, produtoId: dto.produtoId, quantidade: dto.quantidade },
    });
  }

  async removeItem(tipoPortaria: TipoPortaria, produtoId: string) {
    const template = await this.prisma.template.findUnique({ where: { tipoPortaria } });
    if (!template) throw new NotFoundException('Template não encontrado');

    return this.prisma.templateItem.delete({
      where: { templateId_produtoId: { templateId: template.id, produtoId } },
    });
  }
}
