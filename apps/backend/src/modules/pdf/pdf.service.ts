import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  async gerar(vistoriaId: string): Promise<Buffer> {
    const vistoria = await this.prisma.vistoria.findFirst({
      where: { id: vistoriaId, deletedAt: null },
      include: {
        condominio: true,
        supervisor: { select: { name: true, email: true } },
        consultor: { select: { name: true, email: true } },
        itens: { include: { produto: true } },
        checklist: {
          include: { checklistTemplate: true },
          orderBy: { checklistTemplate: { ordem: 'asc' } },
        },
        fotos: { orderBy: { ordem: 'asc' } },
        anexos: true,
        assinaturas: { include: { user: { select: { name: true } } } },
        aprovacoes: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!vistoria) throw new NotFoundException('Vistoria não encontrada');

    const html = this.buildHtml(vistoria);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '25mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: this.headerTemplate(vistoria.numero),
      footerTemplate: this.footerTemplate(),
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  private buildHtml(v: any): string {
    const tipoLabel: Record<string, string> = {
      ASSISTIDA: 'Portaria Assistida',
      AUTONOMA: 'Portaria Autônoma',
      CONTROLE_ACESSO: 'Controle de Acesso',
    };

    const produtosRows = v.itens
      .map(
        (item: any) => `
        <tr>
          <td>${item.produto.codigo}</td>
          <td>${item.produto.descricao}</td>
          <td class="center">${item.quantidade}</td>
          <td class="right">R$ ${Number(item.custoUnit).toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    const checklistRows = v.checklist
      .map(
        (item: any) => `
        <tr>
          <td>${item.checklistTemplate.pergunta}</td>
          <td class="center">${item.resposta === true ? 'Sim' : item.resposta === false ? 'Não' : 'N/R'}</td>
          <td>${item.observacao ?? ''}</td>
        </tr>`,
      )
      .join('');

    const fotosHtml = v.fotos
      .map(
        (foto: any, i: number) =>
          `<div class="foto-cell">
            <img src="${foto.url}" alt="${foto.categoria}" />
            <p>${foto.categoria.replace(/_/g, ' ')}</p>
          </div>`,
      )
      .join('');

    const assinaturas = v.assinaturas
      .map(
        (a: any) => `
        <div class="assinatura-box">
          <img src="${a.url}" alt="Assinatura ${a.tipo}" />
          <p>${a.user.name}</p>
          <span>${a.tipo}</span>
        </div>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #333; }
  .capa { text-align: center; padding: 60px 0; page-break-after: always; }
  .capa h1 { font-size: 28px; color: #1a365d; margin-bottom: 8px; }
  .capa h2 { font-size: 18px; color: #2d3748; margin-bottom: 4px; }
  .capa .numero { font-size: 20px; color: #e53e3e; font-weight: bold; margin: 20px 0; }
  .section { margin-bottom: 24px; }
  .section h3 { font-size: 13px; background: #1a365d; color: white; padding: 6px 10px; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
  .info-item { display: flex; gap: 6px; }
  .info-item label { font-weight: bold; min-width: 120px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #2d3748; color: white; padding: 6px; text-align: left; font-size: 10px; }
  td { padding: 5px 6px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f7fafc; }
  .center { text-align: center; }
  .right { text-align: right; }
  .fotos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .foto-cell img { width: 100%; height: 180px; object-fit: cover; border: 1px solid #e2e8f0; }
  .foto-cell p { text-align: center; font-size: 9px; margin: 2px 0; }
  .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
  .assinatura-box { border: 1px solid #e2e8f0; padding: 10px; text-align: center; }
  .assinatura-box img { width: 100%; height: 80px; object-fit: contain; }
  .assinatura-box p { font-weight: bold; margin: 4px 0 2px; }
  .assinatura-box span { font-size: 9px; color: #718096; }
  .badge-sim { color: #38a169; font-weight: bold; }
  .badge-nao { color: #e53e3e; font-weight: bold; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>

<div class="capa">
  <h1>LEVANTAMENTO TÉCNICO</h1>
  <h2>Portaria Remota</h2>
  <div class="numero">${v.numero}</div>
  <h2>${v.condominio.nome}</h2>
  <p>${v.condominio.endereco}, ${v.condominio.cidade}/${v.condominio.estado}</p>
  <p><strong>Tipo:</strong> ${tipoLabel[v.tipoPortaria] ?? v.tipoPortaria}</p>
  <p><strong>Data:</strong> ${new Date(v.createdAt).toLocaleDateString('pt-BR')}</p>
</div>

<div class="section">
  <h3>1. DADOS DO CONDOMÍNIO</h3>
  <div class="info-grid">
    <div class="info-item"><label>Condomínio:</label><span>${v.condominio.nome}</span></div>
    <div class="info-item"><label>Endereço:</label><span>${v.condominio.endereco}</span></div>
    <div class="info-item"><label>Cidade/Estado:</label><span>${v.condominio.cidade}/${v.condominio.estado}</span></div>
    <div class="info-item"><label>Tipo de Portaria:</label><span>${tipoLabel[v.tipoPortaria] ?? v.tipoPortaria}</span></div>
    <div class="info-item"><label>Supervisor:</label><span>${v.supervisor.name}</span></div>
    <div class="info-item"><label>Consultor:</label><span>${v.consultor.name}</span></div>
  </div>
</div>

<div class="section">
  <h3>2. DADOS OPERACIONAIS</h3>
  <div class="info-grid">
    <div class="info-item"><label>Unidades:</label><span>${v.qtdUnidades ?? '-'}</span></div>
    <div class="info-item"><label>Portões Veiculares:</label><span>${v.qtdPortoesVeiculares ?? '-'}</span></div>
    <div class="info-item"><label>Portões Pedestres:</label><span>${v.qtdPortoesPedestres ?? '-'}</span></div>
    <div class="info-item"><label>Elevadores:</label><span>${v.qtdElevadores ?? '-'}</span></div>
    <div class="info-item"><label>Possui Lixeira:</label><span>${v.possuiLixeira ? 'Sim' : 'Não'}</span></div>
    <div class="info-item"><label>Tipo Recolhimento:</label><span>${v.tipoRecolhimento ?? '-'}</span></div>
  </div>
  ${v.observacoesGerais ? `<p><strong>Observações:</strong> ${v.observacoesGerais}</p>` : ''}
</div>

<div class="section page-break">
  <h3>3. CHECKLIST OPERACIONAL</h3>
  <table>
    <thead><tr><th>Item</th><th style="width:60px">Resposta</th><th>Observação</th></tr></thead>
    <tbody>${checklistRows}</tbody>
  </table>
</div>

<div class="section">
  <h3>4. EQUIPAMENTOS PREVISTOS</h3>
  <table>
    <thead><tr><th>Código</th><th>Descrição</th><th style="width:60px" class="center">Qtd</th><th style="width:90px" class="right">Custo Unit.</th></tr></thead>
    <tbody>${produtosRows}</tbody>
  </table>
</div>

${v.fotos.length > 0 ? `
<div class="section page-break">
  <h3>5. REGISTRO FOTOGRÁFICO</h3>
  <div class="fotos-grid">${fotosHtml}</div>
</div>` : ''}

${v.assinaturas.length > 0 ? `
<div class="section page-break">
  <h3>6. ASSINATURAS</h3>
  <div class="assinaturas">${assinaturas}</div>
</div>` : ''}

</body>
</html>`;
  }

  private headerTemplate(numero: string): string {
    return `<div style="font-size:9px;width:100%;text-align:center;color:#718096;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
      LEVANTAMENTO TÉCNICO — ${numero} | PORTARIA REMOTA
    </div>`;
  }

  private footerTemplate(): string {
    return `<div style="font-size:9px;width:100%;display:flex;justify-content:space-between;padding:0 15mm;color:#718096;border-top:1px solid #e2e8f0;padding-top:4px;">
      <span>Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</span>
      <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>`;
  }
}
