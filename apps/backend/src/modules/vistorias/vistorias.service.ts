import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VistoriasNumeroService } from './vistorias-numero.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateVistoriaDto, UpdateVistoriaDto, FilterVistoriaDto } from './dto/create-vistoria.dto';
import { Role, VistoriaStatus } from '@prisma/client';

interface UserCtx {
  id: string;
  role: Role;
}

const VISTORIA_INCLUDE = {
  condominio: true,
  supervisor: { select: { id: true, name: true, email: true } },
  consultor: { select: { id: true, name: true, email: true } },
  itens: { include: { produto: true } },
  checklist: { include: { checklistTemplate: true } },
  fotos: { orderBy: { ordem: 'asc' as const } },
  anexos: true,
  assinaturas: { include: { user: { select: { id: true, name: true } } } },
  aprovacoes: { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'desc' as const } },
  editLock: { include: { user: { select: { id: true, name: true } } } },
};

@Injectable()
export class VistoriasService {
  constructor(
    private prisma: PrismaService,
    private numeroService: VistoriasNumeroService,
    private auditoria: AuditoriaService,
  ) {}

  async findAll(user: UserCtx, filter: FilterVistoriaDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    // Consultor vê apenas suas vistorias
    if (user.role === Role.CONSULTOR) {
      where.consultorId = user.id;
    }

    if (filter.search) {
      where.OR = [
        { numero: { contains: filter.search, mode: 'insensitive' } },
        { condominio: { nome: { contains: filter.search, mode: 'insensitive' } } },
        { condominio: { endereco: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }
    if (filter.status) where.status = filter.status;
    if (filter.tipoPortaria) where.tipoPortaria = filter.tipoPortaria;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.vistoria.count({ where }),
      this.prisma.vistoria.findMany({
        where,
        include: {
          condominio: { select: { id: true, nome: true, cidade: true, estado: true } },
          supervisor: { select: { id: true, name: true } },
          consultor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: UserCtx) {
    const vistoria = await this.prisma.vistoria.findFirst({
      where: { id, deletedAt: null },
      include: VISTORIA_INCLUDE,
    });

    if (!vistoria) throw new NotFoundException('Vistoria não encontrada');

    if (user.role === Role.CONSULTOR && vistoria.consultorId !== user.id) {
      throw new ForbiddenException('Acesso negado a esta vistoria');
    }

    return vistoria;
  }

  async create(dto: CreateVistoriaDto, user: UserCtx) {
    const { numero, ano, sequencia } = await this.numeroService.gerarNumero();

    // Carrega checklist template
    const checklistItems = await this.prisma.checklistTemplate.findMany({
      where: { tipoPortaria: dto.tipoPortaria },
      orderBy: { ordem: 'asc' },
    });

    // Resolve itens: usa os fornecidos pelo usuário ou carrega do template
    let itensData: { produtoId: string; quantidade: number; custoUnit: any }[] | undefined;

    if (dto.itens && dto.itens.length > 0) {
      const produtoIds = dto.itens.map((i) => i.produtoId);
      const produtos = await this.prisma.produto.findMany({
        where: { id: { in: produtoIds } },
      });
      const produtoMap = new Map(produtos.map((p) => [p.id, p]));
      itensData = dto.itens
        .filter((item) => produtoMap.has(item.produtoId))
        .map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          custoUnit: produtoMap.get(item.produtoId)!.custo,
        }));
    } else {
      const template = await this.prisma.template.findUnique({
        where: { tipoPortaria: dto.tipoPortaria },
        include: { itens: { include: { produto: true } } },
      });
      if (template) {
        itensData = template.itens.map((ti) => ({
          produtoId: ti.produtoId,
          quantidade: ti.quantidade,
          custoUnit: ti.produto.custo,
        }));
      }
    }

    const vistoria = await this.prisma.vistoria.create({
      data: {
        numero,
        ano,
        sequencia,
        condominioId: dto.condominioId,
        supervisorId: dto.supervisorId,
        consultorId: dto.consultorId,
        tipoPortaria: dto.tipoPortaria,
        qtdUnidades: dto.qtdUnidades,
        qtdPortoesVeiculares: dto.qtdPortoesVeiculares,
        qtdPortoesPedestres: dto.qtdPortoesPedestres,
        qtdElevadores: dto.qtdElevadores,
        possuiLixeira: dto.possuiLixeira ?? false,
        tipoRecolhimento: dto.tipoRecolhimento,
        tipoCondominio: dto.tipoCondominio,
        periodoAtendimento: dto.periodoAtendimento,
        observacoesGerais: dto.observacoesGerais,
        itens: itensData
          ? { createMany: { data: itensData } }
          : undefined,
        checklist: {
          createMany: {
            data: checklistItems.map((ci) => ({
              checklistTemplateId: ci.id,
            })),
          },
        },
      },
      include: VISTORIA_INCLUDE,
    });

    await this.auditoria.registrar({
      vistoriaId: vistoria.id,
      userId: user.id,
      acao: 'CRIAR',
      entidade: 'Vistoria',
      entidadeId: vistoria.id,
      dadosDepois: { numero, tipoPortaria: dto.tipoPortaria },
    });

    return vistoria;
  }

  async update(id: string, dto: UpdateVistoriaDto, user: UserCtx) {
    const vistoria = await this.findOne(id, user);

    if (vistoria.status === VistoriaStatus.APROVADO && user.role !== Role.GESTOR) {
      throw new ForbiddenException('Vistoria aprovada não pode ser editada');
    }

    const antes = { status: vistoria.status, tipoPortaria: vistoria.tipoPortaria };

    const updated = await this.prisma.vistoria.update({
      where: { id },
      data: dto,
      include: VISTORIA_INCLUDE,
    });

    await this.auditoria.registrar({
      vistoriaId: id,
      userId: user.id,
      acao: 'EDITAR',
      entidade: 'Vistoria',
      entidadeId: id,
      dadosAntes: antes,
      dadosDepois: dto as Record<string, unknown>,
    });

    return updated;
  }

  async finalizar(id: string, user: UserCtx) {
    const vistoria = await this.findOne(id, user);

    if (vistoria.status !== VistoriaStatus.EM_ANDAMENTO) {
      throw new BadRequestException('Vistoria já foi finalizada');
    }

    // Valida checklist completo
    const checklistPendente = vistoria.checklist.filter(
      (item) => item.checklistTemplate.obrigatorio && item.resposta === null,
    );
    if (checklistPendente.length > 0) {
      throw new BadRequestException(
        `Checklist incompleto: ${checklistPendente.length} item(ns) obrigatório(s) sem resposta`,
      );
    }

    // Valida assinaturas
    const tiposSig = vistoria.assinaturas.map((a) => a.tipo);
    if (!tiposSig.includes('SUPERVISOR') || !tiposSig.includes('CONSULTOR')) {
      throw new BadRequestException('Assinaturas do supervisor e consultor são obrigatórias');
    }

    return this.prisma.vistoria.update({
      where: { id },
      data: { status: VistoriaStatus.AGUARDANDO_APROVACAO },
      include: VISTORIA_INCLUDE,
    });
  }

  async remove(id: string, user: UserCtx) {
    const vistoria = await this.findOne(id, user);

    if (vistoria.status === VistoriaStatus.APROVADO && user.role !== Role.ADMINISTRADOR) {
      throw new ForbiddenException('Vistoria aprovada não pode ser excluída');
    }

    await this.auditoria.registrar({
      vistoriaId: id,
      userId: user.id,
      acao: 'EXCLUIR',
      entidade: 'Vistoria',
      entidadeId: id,
      dadosAntes: { numero: vistoria.numero },
    });

    return this.prisma.vistoria.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async acquireLock(id: string, user: UserCtx) {
    const vistoria = await this.findOne(id, user);

    const existing = await this.prisma.editLock.findUnique({ where: { vistoriaId: id } });

    if (existing && existing.userId !== user.id && existing.expiresAt > new Date()) {
      return {
        locked: true,
        lockedBy: existing.userId,
        expiresAt: existing.expiresAt,
      };
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await this.prisma.editLock.upsert({
      where: { vistoriaId: id },
      update: { userId: user.id, expiresAt },
      create: { vistoriaId: id, userId: user.id, expiresAt },
    });

    return { locked: false, expiresAt };
  }

  async releaseLock(id: string, user: UserCtx) {
    const lock = await this.prisma.editLock.findUnique({ where: { vistoriaId: id } });
    if (lock && lock.userId === user.id) {
      await this.prisma.editLock.delete({ where: { vistoriaId: id } });
    }
    return { released: true };
  }
}
