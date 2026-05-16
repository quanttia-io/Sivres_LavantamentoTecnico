import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class ResponderChecklistDto {
  checklistTemplateId: string;
  resposta: boolean;
  observacao?: string;
}

@Injectable()
export class ChecklistService {
  constructor(private prisma: PrismaService) {}

  async findByVistoria(vistoriaId: string) {
    return this.prisma.vistoriaChecklistItem.findMany({
      where: { vistoriaId },
      include: { checklistTemplate: true },
      orderBy: { checklistTemplate: { ordem: 'asc' } },
    });
  }

  async responder(vistoriaId: string, dto: ResponderChecklistDto) {
    return this.prisma.vistoriaChecklistItem.upsert({
      where: {
        vistoriaId_checklistTemplateId: {
          vistoriaId,
          checklistTemplateId: dto.checklistTemplateId,
        },
      },
      update: { resposta: dto.resposta, observacao: dto.observacao },
      create: {
        vistoriaId,
        checklistTemplateId: dto.checklistTemplateId,
        resposta: dto.resposta,
        observacao: dto.observacao,
      },
    });
  }

  async responderLote(vistoriaId: string, itens: ResponderChecklistDto[]) {
    return Promise.all(itens.map((dto) => this.responder(vistoriaId, dto)));
  }
}
