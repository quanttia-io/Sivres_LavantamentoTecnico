import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCondominioDto, UpdateCondominioDto } from './dto/create-condominio.dto';

@Injectable()
export class CondominiosService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.condominio.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { endereco: { contains: search, mode: 'insensitive' } },
            { cidade: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const cond = await this.prisma.condominio.findFirst({
      where: { id, deletedAt: null },
      include: { vistorias: { where: { deletedAt: null }, select: { id: true, numero: true, status: true, createdAt: true } } },
    });
    if (!cond) throw new NotFoundException('Condomínio não encontrado');
    return cond;
  }

  async create(dto: CreateCondominioDto) {
    const existing = await this.prisma.condominio.findFirst({
      where: { nome: dto.nome, endereco: dto.endereco, deletedAt: null },
    });
    if (existing) throw new ConflictException('Condomínio já cadastrado com este nome e endereço');

    return this.prisma.condominio.create({ data: dto });
  }

  async update(id: string, dto: UpdateCondominioDto) {
    await this.findOne(id);
    return this.prisma.condominio.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.condominio.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
