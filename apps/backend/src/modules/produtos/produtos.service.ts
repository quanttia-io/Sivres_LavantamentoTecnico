import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/create-produto.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, apenasAtivos = true) {
    return this.prisma.produto.findMany({
      where: {
        deletedAt: null,
        ...(apenasAtivos && { ativo: true }),
        ...(search && {
          OR: [
            { codigo: { contains: search, mode: 'insensitive' } },
            { descricao: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { codigo: 'asc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.produto.findFirst({ where: { id, deletedAt: null } });
    if (!p) throw new NotFoundException('Produto não encontrado');
    return p;
  }

  async create(dto: CreateProdutoDto) {
    const existing = await this.prisma.produto.findUnique({ where: { codigo: dto.codigo } });
    if (existing) throw new ConflictException('Código de produto já cadastrado');
    return this.prisma.produto.create({ data: dto });
  }

  async update(id: string, dto: UpdateProdutoDto) {
    await this.findOne(id);
    return this.prisma.produto.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.produto.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async importarExcel(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];

    const results = { criados: 0, atualizados: 0, erros: [] as string[] };

    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // header
      const codigo = String(row.getCell(1).value ?? '').trim();
      const descricao = String(row.getCell(2).value ?? '').trim();
      const custo = parseFloat(String(row.getCell(3).value ?? '0'));

      if (!codigo || !descricao) {
        results.erros.push(`Linha ${rowNum}: código ou descrição vazio`);
        return;
      }
      if (isNaN(custo)) {
        results.erros.push(`Linha ${rowNum}: custo inválido`);
        return;
      }

      // Execute async upsert via promises collected
      this.prisma.produto
        .upsert({
          where: { codigo },
          update: { descricao, custo },
          create: { codigo, descricao, custo },
        })
        .then(() => results.atualizados++);
    });

    return results;
  }
}
