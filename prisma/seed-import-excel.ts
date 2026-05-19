import { PrismaClient, TipoPortaria } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando importação do catálogo de produtos...');

  // ── 1. Limpar dados anteriores ───────────────────────────────────────────
  console.log('Removendo itens de vistorias...');
  await prisma.vistoriaItem.deleteMany({});

  console.log('Removendo template items antigos...');
  await prisma.templateItem.deleteMany({});

  console.log('Removendo produtos antigos...');
  await prisma.produto.deleteMany({});

  // ── 2. Importar produtos do catálogo (Planilha2) ─────────────────────────
  const produtosRaw: { codigo: string; descricao: string; custo: number }[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'import-produtos.json'), 'utf8'),
  );

  console.log(`Importando ${produtosRaw.length} produtos...`);

  // Batch inserts de 100 em 100 para não sobrecarregar o pool
  const batchSize = 100;
  let importados = 0;
  for (let i = 0; i < produtosRaw.length; i += batchSize) {
    const batch = produtosRaw.slice(i, i + batchSize);
    await prisma.produto.createMany({
      data: batch.map((p) => ({
        codigo: p.codigo,
        descricao: p.descricao,
        custo: p.custo,
        ativo: true,
      })),
      skipDuplicates: true,
    });
    importados += batch.length;
    process.stdout.write(`\r  ${importados}/${produtosRaw.length}`);
  }
  console.log('\nProdutos importados.');

  // ── 3. Montar mapa código → id ───────────────────────────────────────────
  const todosProdutos = await prisma.produto.findMany({ select: { id: true, codigo: true } });
  const porCodigo = new Map(todosProdutos.map((p) => [p.codigo, p.id]));

  // ── 4. Importar itens do Template para os 3 tipos de portaria ───────────
  const templateRaw: { codigo: string; descricao: string }[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'import-template.json'), 'utf8'),
  );

  const tiposPortaria = [TipoPortaria.ASSISTIDA, TipoPortaria.AUTONOMA, TipoPortaria.CONTROLE_ACESSO];

  for (const tipo of tiposPortaria) {
    console.log(`Atualizando template: ${tipo}`);

    const template = await prisma.template.upsert({
      where: { tipoPortaria: tipo },
      update: {},
      create: {
        tipoPortaria: tipo,
        nome: `Template ${tipo.replace('_', ' ')}`,
      },
    });

    let adicionados = 0;
    let semCodigo = 0;
    for (const item of templateRaw) {
      const produtoId = porCodigo.get(item.codigo);
      if (!produtoId) { semCodigo++; continue; }

      await prisma.templateItem.upsert({
        where: { templateId_produtoId: { templateId: template.id, produtoId } },
        update: { quantidade: 1 },
        create: { templateId: template.id, produtoId, quantidade: 1 },
      });
      adicionados++;
    }
    console.log(`  ${tipo}: ${adicionados} itens adicionados (${semCodigo} sem correspondência)`);
  }

  console.log('\n✓ Importação concluída.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
