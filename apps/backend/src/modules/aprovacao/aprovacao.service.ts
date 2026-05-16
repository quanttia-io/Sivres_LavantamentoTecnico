import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { AprovarDto } from './dto/aprovar.dto';
import { Role, VistoriaStatus, AprovacaoAcao, NotificacaoTipo } from '@prisma/client';

interface UserCtx { id: string; role: Role; }

@Injectable()
export class AprovacaoService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
    private notificacoes: NotificacoesService,
  ) {}

  async aprovar(vistoriaId: string, dto: AprovarDto, user: UserCtx) {
    if (user.role !== Role.GESTOR && user.role !== Role.ADMINISTRADOR) {
      throw new ForbiddenException('Apenas Gestor ou Administrador podem aprovar vistorias');
    }

    const vistoria = await this.prisma.vistoria.findFirst({
      where: { id: vistoriaId, deletedAt: null },
      include: { supervisor: true, consultor: true },
    });

    if (!vistoria) throw new NotFoundException('Vistoria não encontrada');

    if (vistoria.status !== VistoriaStatus.AGUARDANDO_APROVACAO) {
      throw new BadRequestException('Vistoria não está aguardando aprovação');
    }

    const novoStatus =
      dto.acao === AprovacaoAcao.APROVADO
        ? VistoriaStatus.APROVADO
        : VistoriaStatus.EM_ANDAMENTO;

    await this.prisma.$transaction([
      this.prisma.aprovacao.create({
        data: { vistoriaId, userId: user.id, acao: dto.acao, comentario: dto.comentario },
      }),
      this.prisma.vistoria.update({ where: { id: vistoriaId }, data: { status: novoStatus } }),
    ]);

    // Notificações
    const tipo =
      dto.acao === AprovacaoAcao.APROVADO
        ? NotificacaoTipo.APROVACAO
        : dto.acao === AprovacaoAcao.REPROVADO
          ? NotificacaoTipo.REPROVACAO
          : NotificacaoTipo.SOLICITACAO_AJUSTE;

    const titulo = dto.acao === AprovacaoAcao.APROVADO
      ? `Vistoria ${vistoria.numero} aprovada`
      : `Vistoria ${vistoria.numero} ${dto.acao === AprovacaoAcao.REPROVADO ? 'reprovada' : 'com ajustes solicitados'}`;

    await this.notificacoes.criar({
      userId: vistoria.supervisorId,
      vistoriaId,
      tipo,
      titulo,
      mensagem: dto.comentario,
    });

    if (vistoria.consultorId !== vistoria.supervisorId) {
      await this.notificacoes.criar({
        userId: vistoria.consultorId,
        vistoriaId,
        tipo,
        titulo,
        mensagem: dto.comentario,
      });
    }

    await this.auditoria.registrar({
      vistoriaId,
      userId: user.id,
      acao: dto.acao,
      entidade: 'Vistoria',
      entidadeId: vistoriaId,
      dadosDepois: { acao: dto.acao, comentario: dto.comentario, novoStatus },
    });

    return this.prisma.vistoria.findUnique({ where: { id: vistoriaId } });
  }

  async historico(vistoriaId: string) {
    return this.prisma.aprovacao.findMany({
      where: { vistoriaId },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
