import { PrismaClient, Role, TipoPortaria } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedOpexCentral } from './seed-opex-central';
import { seedProdutosExcel } from './seed-produtos-excel';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@prss.com.br' },
    update: {},
    create: {
      email: 'admin@prss.com.br',
      password: adminPassword,
      name: 'Administrador',
      role: Role.ADMINISTRADOR,
    },
  });

  // Gestor user
  const gestorPassword = await bcrypt.hash('Gestor@2026', 10);
  await prisma.user.upsert({
    where: { email: 'gestor@prss.com.br' },
    update: {},
    create: {
      email: 'gestor@prss.com.br',
      password: gestorPassword,
      name: 'Gestor Comercial',
      role: Role.GESTOR,
    },
  });

  // Supervisor user
  const supervisorPassword = await bcrypt.hash('Super@2026', 10);
  await prisma.user.upsert({
    where: { email: 'supervisor@prss.com.br' },
    update: {},
    create: {
      email: 'supervisor@prss.com.br',
      password: supervisorPassword,
      name: 'Supervisor Técnico',
      role: Role.SUPERVISOR,
    },
  });

  // Consultor user
  const consultorPassword = await bcrypt.hash('Consultor@2026', 10);
  await prisma.user.upsert({
    where: { email: 'consultor@prss.com.br' },
    update: {},
    create: {
      email: 'consultor@prss.com.br',
      password: consultorPassword,
      name: 'Consultor Técnico',
      role: Role.CONSULTOR,
    },
  });

  // Seed products
  const produtos = [
    { codigo: 'CAM-001', descricao: 'Câmera IP Dome 2MP Infravermelho', custo: 350.0 },
    { codigo: 'CAM-002', descricao: 'Câmera IP Bullet 4MP Infravermelho', custo: 480.0 },
    { codigo: 'CAM-003', descricao: 'Câmera IP PTZ 2MP', custo: 1200.0 },
    { codigo: 'DVR-001', descricao: 'DVR 8 Canais Full HD', custo: 890.0 },
    { codigo: 'NVR-001', descricao: 'NVR 16 Canais 4K', custo: 1450.0 },
    { codigo: 'INT-001', descricao: 'Interfone IP HD', custo: 620.0 },
    { codigo: 'INT-002', descricao: 'Interfone Analógico 2 fios', custo: 280.0 },
    { codigo: 'CTL-001', descricao: 'Controladora de Acesso 2 Portas', custo: 780.0 },
    { codigo: 'CTL-002', descricao: 'Controladora de Acesso 4 Portas', custo: 1250.0 },
    { codigo: 'LKT-001', descricao: 'Leitor de Cartão RFID 125kHz', custo: 180.0 },
    { codigo: 'LKT-002', descricao: 'Leitor Biométrico Digital', custo: 450.0 },
    { codigo: 'TAG-001', descricao: 'Tag de Acesso Veicular (100 unid)', custo: 320.0 },
    { codigo: 'POR-001', descricao: 'Motor Portão Deslizante 1/3HP', custo: 890.0 },
    { codigo: 'POR-002', descricao: 'Motor Portão Basculante 1/4HP', custo: 680.0 },
    { codigo: 'SRV-001', descricao: 'Servidor de Monitoramento Mini PC', custo: 2200.0 },
    { codigo: 'NO-BREAK-001', descricao: 'No-Break 1500VA', custo: 650.0 },
    { codigo: 'RACK-001', descricao: 'Rack de Parede 12U', custo: 420.0 },
    { codigo: 'SW-001', descricao: 'Switch PoE 8 Portas Gerenciável', custo: 580.0 },
    { codigo: 'TOT-001', descricao: 'Totem de Atendimento Remoto 21"', custo: 3500.0 },
    { codigo: 'LED-001', descricao: 'Luminária LED Guarita 50W', custo: 180.0 },
  ];

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { codigo: p.codigo },
      update: { custo: p.custo },
      create: { ...p, custo: p.custo },
    });
  }

  // Seed templates
  const produtosDb = await prisma.produto.findMany();
  const byCode = Object.fromEntries(produtosDb.map((p) => [p.codigo, p.id]));

  const templates = [
    {
      tipoPortaria: TipoPortaria.ASSISTIDA,
      nome: 'Portaria Assistida Padrão',
      itens: [
        { codigo: 'CAM-001', qtd: 4 },
        { codigo: 'DVR-001', qtd: 1 },
        { codigo: 'INT-001', qtd: 2 },
        { codigo: 'NO-BREAK-001', qtd: 1 },
        { codigo: 'RACK-001', qtd: 1 },
        { codigo: 'LED-001', qtd: 2 },
      ],
    },
    {
      tipoPortaria: TipoPortaria.AUTONOMA,
      nome: 'Portaria Autônoma Padrão',
      itens: [
        { codigo: 'CAM-001', qtd: 6 },
        { codigo: 'NVR-001', qtd: 1 },
        { codigo: 'INT-001', qtd: 4 },
        { codigo: 'CTL-001', qtd: 2 },
        { codigo: 'LKT-001', qtd: 4 },
        { codigo: 'TAG-001', qtd: 1 },
        { codigo: 'TOT-001', qtd: 1 },
        { codigo: 'SRV-001', qtd: 1 },
        { codigo: 'NO-BREAK-001', qtd: 2 },
        { codigo: 'SW-001', qtd: 1 },
        { codigo: 'RACK-001', qtd: 1 },
      ],
    },
    {
      tipoPortaria: TipoPortaria.CONTROLE_ACESSO,
      nome: 'Controle de Acesso Padrão',
      itens: [
        { codigo: 'CAM-002', qtd: 4 },
        { codigo: 'NVR-001', qtd: 1 },
        { codigo: 'CTL-002', qtd: 1 },
        { codigo: 'LKT-002', qtd: 4 },
        { codigo: 'POR-001', qtd: 2 },
        { codigo: 'NO-BREAK-001', qtd: 1 },
        { codigo: 'SW-001', qtd: 1 },
      ],
    },
  ];

  for (const t of templates) {
    const template = await prisma.template.upsert({
      where: { tipoPortaria: t.tipoPortaria },
      update: { nome: t.nome },
      create: { tipoPortaria: t.tipoPortaria, nome: t.nome },
    });

    for (const item of t.itens) {
      const produtoId = byCode[item.codigo];
      if (!produtoId) continue;
      await prisma.templateItem.upsert({
        where: { templateId_produtoId: { templateId: template.id, produtoId } },
        update: { quantidade: item.qtd },
        create: { templateId: template.id, produtoId, quantidade: item.qtd },
      });
    }
  }

  // Seed checklist templates
  const checklistData = [
    // ASSISTIDA
    { tipoPortaria: TipoPortaria.ASSISTIDA, ordem: 1, pergunta: 'Existe ponto elétrico estabilizado para equipamentos?' },
    { tipoPortaria: TipoPortaria.ASSISTIDA, ordem: 2, pergunta: 'Possui cabeamento estruturado até a guarita?' },
    { tipoPortaria: TipoPortaria.ASSISTIDA, ordem: 3, pergunta: 'Há internet disponível (mínimo 10Mbps)?' },
    { tipoPortaria: TipoPortaria.ASSISTIDA, ordem: 4, pergunta: 'Guarita possui iluminação adequada?' },
    { tipoPortaria: TipoPortaria.ASSISTIDA, ordem: 5, pergunta: 'Portões possuem limite mecânico instalado?' },
    { tipoPortaria: TipoPortaria.ASSISTIDA, ordem: 6, pergunta: 'Há tomadas próximas aos portões para motores?' },
    { tipoPortaria: TipoPortaria.ASSISTIDA, ordem: 7, pergunta: 'Existe aterramento elétrico no local?' },
    { tipoPortaria: TipoPortaria.ASSISTIDA, ordem: 8, pergunta: 'O condomínio possui planta/croqui disponível?' },
    // AUTONOMA
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 1, pergunta: 'Existe link de internet dedicado no local?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 2, pergunta: 'Velocidade de internet é adequada (mínimo 20Mbps)?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 3, pergunta: 'Há local adequado para instalação do totem?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 4, pergunta: 'Portões possuem automação instalada?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 5, pergunta: 'Existe no-break ou gerador no local?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 6, pergunta: 'Há cobertura de sinal para comunicação?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 7, pergunta: 'Moradores possuem aplicativo de acesso?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 8, pergunta: 'Câmeras têm campo de visão completo das entradas?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 9, pergunta: 'Existe iluminação noturna adequada nas câmeras?' },
    { tipoPortaria: TipoPortaria.AUTONOMA, ordem: 10, pergunta: 'Condomínio possui síndico e contato definidos?' },
    // CONTROLE_ACESSO
    { tipoPortaria: TipoPortaria.CONTROLE_ACESSO, ordem: 1, pergunta: 'Quantidade de pontos de controle mapeados?' },
    { tipoPortaria: TipoPortaria.CONTROLE_ACESSO, ordem: 2, pergunta: 'Cabeamento para leitores está definido?' },
    { tipoPortaria: TipoPortaria.CONTROLE_ACESSO, ordem: 3, pergunta: 'Há alimentação elétrica nos pontos de leitura?' },
    { tipoPortaria: TipoPortaria.CONTROLE_ACESSO, ordem: 4, pergunta: 'Travas elétricas ou fechaduras eletrônicas previstas?' },
    { tipoPortaria: TipoPortaria.CONTROLE_ACESSO, ordem: 5, pergunta: 'Sistema de monitoramento central definido?' },
    { tipoPortaria: TipoPortaria.CONTROLE_ACESSO, ordem: 6, pergunta: 'Cronograma de cadastramento de usuários acordado?' },
  ];

  for (const item of checklistData) {
    const existing = await prisma.checklistTemplate.findFirst({
      where: { tipoPortaria: item.tipoPortaria, ordem: item.ordem },
    });
    if (!existing) {
      await prisma.checklistTemplate.create({ data: item });
    }
  }

  // Produtos reais do Excel e OPEX Central
  await seedProdutosExcel();
  await seedOpexCentral();

  console.log('Seed completed.');
  console.log('Admin: admin@prss.com.br / Admin@2026');
  console.log('Gestor: gestor@prss.com.br / Gestor@2026');
  console.log('Supervisor: supervisor@prss.com.br / Super@2026');
  console.log('Consultor: consultor@prss.com.br / Consultor@2026');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
