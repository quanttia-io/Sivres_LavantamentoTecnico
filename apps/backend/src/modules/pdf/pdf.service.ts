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

    // Converte fotos para base64 para garantir renderização no Puppeteer
    const fotosComBase64 = await Promise.all(
      vistoria.fotos.map(async (foto: any) => {
        const base64 = await this.fetchBase64(foto.url);
        return { ...foto, urlBase64: base64 || foto.url };
      }),
    );

    const html = this.buildHtml({ ...vistoria, fotos: fotosComBase64 });

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
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

  private buildConfiguracaoHtml(cfg: any): string {
    if (!cfg) return '';

    const row = (label: string, v: any): string | null => {
      if (v === undefined || v === null || v === 0 || v === '' || v === false) return null;
      return `<div class="info-item"><label>${label}:</label><span>${v}</span></div>`;
    };

    const lixeiraLabel = (v: number | undefined) =>
      v === 1 ? 'Interfone' : v === 2 ? 'Botão' : null;
    const cercaLabel = (v: number | undefined) =>
      v === 1 ? 'Completa' : v === 2 ? 'Apenas fiação' : null;
    const saidaPedLabel = (v: number | undefined) =>
      v === 0 ? 'Interfone' : v === 1 ? 'Botão' : null;

    const groups: { title: string; rows: Array<string | null> }[] = [
      {
        title: 'Portões Pedestres',
        rows: [
          row('Pivotante Manual', cfg.pedPivManual),
          row('Pivotante Automático', cfg.pedPivAuto),
          row('Deslizante Piso', cfg.pedDeslPiso),
          row('Deslizante Teto', cfg.pedDeslTeto),
          row('Pivotante Vidro', cfg.pedPivVidro),
          row('Outros', cfg.pedOutro),
        ],
      },
      {
        title: 'Controle de Acesso Pedestre',
        rows: [
          row('Eclusa Pedestre', cfg.eclusaPedestre),
          row('Leitor de Tag', cfg.leitorTagPedestre),
          row('Biometria Digital', cfg.biometriaDigital),
          row('Biometria Facial', cfg.biometriaFacial),
          row('Saída Pedestres', saidaPedLabel(cfg.opcaoSaidaPedestres)),
        ],
      },
      {
        title: 'Câmeras e Interfones',
        rows: [
          row('Interfones Autônomos', cfg.interfoneAut),
          row('Câmeras Portaria Aut.', cfg.camerasPortariaAut),
          row('Interfones Remotos', cfg.interfoneRem),
          row('Câmeras Portaria Rem.', cfg.camerasPortariaRem),
          row('Integração Interfone', cfg.integracaoInterfone ? 'Sim' : null),
        ],
      },
      {
        title: 'Acesso Veicular — Portões',
        rows: [
          row('Deslizante P', cfg.deslP),
          row('Deslizante M', cfg.deslM),
          row('Deslizante G', cfg.deslG),
          row('Basculante Simples', cfg.bascSimples),
          row('Pivotante Simples', cfg.pivSimples),
          row('Pivotante Duplo', cfg.pivDuplo),
          row('Outros', cfg.veiOutro),
        ],
      },
      {
        title: 'Acesso Veicular — Motores',
        rows: [
          row('Motor Deslizante P', cfg.motorDeslP),
          row('Motor Deslizante M', cfg.motorDeslM),
          row('Motor Deslizante G', cfg.motorDeslG),
          row('Motor Basculante', cfg.motorBasc),
          row('Motor Pivotante Simples', cfg.motorPivSimples),
          row('Motor Pivotante Duplo', cfg.motorPivDuplo),
          row('Motor Outros', cfg.motorOutro),
        ],
      },
      {
        title: 'Acesso Veicular — Controle',
        rows: [
          row('Controle Remoto', cfg.controleRemoto ? 'Sim' : null),
          row('Antenas Tag Veicular', cfg.antenasTagVeicular),
          row('Biometria Facial Veículo', cfg.biometriaFacialVeiculo),
          row('Eclusa Veículo', cfg.eclusaVeiculo),
          row('Intertravamento Pedestre', cfg.intertravamentoPedestre),
          row('Refletores', cfg.refletores),
        ],
      },
      {
        title: 'Hall de Pedestres',
        rows: [
          row('Abertura Temporizador', cfg.hallAberturaTemporizador ? 'Sim' : null),
          row('Pivotante Manual', cfg.hallPivManual),
          row('Pivotante Automático', cfg.hallPivAuto),
          row('Deslizante Piso', cfg.hallDeslPiso),
          row('Deslizante Teto', cfg.hallDeslTeto),
          row('Pivotante Vidro', cfg.hallPivVidro),
        ],
      },
      {
        title: 'Proteção de Perímetro',
        rows: [
          row('Metros de Cerca', cfg.metrosCerca),
          row('Sensores Barreira', cfg.sensoresBarreira),
          row('Cerca Elétrica', cercaLabel(cfg.cercaEletrica)),
        ],
      },
      {
        title: 'Dispositivos',
        rows: [
          row('Tag Pedestre', cfg.tagPedestre),
          row('Pulseira Pedestre', cfg.pulseiraPedestre),
          row('Controle Veículos', cfg.controleVeiculos),
          row('Tag Veicular Comum', cfg.tagVeicularComum),
          row('Tag Veicular Blindada', cfg.tagVeicularBlindada),
        ],
      },
      {
        title: 'Lixeira',
        rows: [
          row('Modalidade', lixeiraLabel(cfg.lixeiraModalidade)),
          row('Portão Pivotante Manual', cfg.lixeiraPivManual),
          row('Portão Deslizante Piso', cfg.lixeiraDeslPiso),
        ],
      },
      {
        title: 'Elevadores e Outros',
        rows: [
          row('Elevadores Monitorados', cfg.elevadoresMonitorados),
          row('Celular Zelador', cfg.celularZelador ? 'Sim' : null),
        ],
      },
    ];

    const rendered = groups
      .map((g) => {
        const items = g.rows.filter(Boolean).join('');
        if (!items) return '';
        return `<div class="cfg-group">
          <div class="cfg-group-title">${g.title}</div>
          <div class="info-grid">${items}</div>
        </div>`;
      })
      .filter(Boolean)
      .join('');

    if (!rendered) return '';

    return `<div class="section">
  <h3>3. CONFIGURAÇÃO TÉCNICA</h3>
  <div class="cfg-container">${rendered}</div>
</div>`;
  }

  private buildHtml(v: any): string {
    const tipoLabel: Record<string, string> = {
      ASSISTIDA: 'Portaria Assistida',
      AUTONOMA: 'Portaria Autônoma',
      CONTROLE_ACESSO: 'Controle de Acesso',
    };

    const fmtBrl = (v: number) =>
      v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const produtosRows = v.itens
      .map(
        (item: any) => `
        <tr>
          <td>${item.produto.codigo}</td>
          <td>${item.produto.descricao}</td>
          <td class="center">${item.quantidade}</td>
          <td class="right">R$ ${fmtBrl(Number(item.custoUnit))}</td>
          <td class="right">R$ ${fmtBrl(Number(item.custoUnit) * item.quantidade)}</td>
        </tr>`,
      )
      .join('');

    const totalCapex = v.itens.reduce(
      (acc: number, item: any) => acc + Number(item.custoUnit) * item.quantidade,
      0,
    );

    const totalRow = `<tr style="font-weight:bold;background:#edf2f7">
        <td colspan="4" class="right">Total Equipamentos:</td>
        <td class="right">R$ ${fmtBrl(totalCapex)}</td>
      </tr>`;

    const precHtml =
      v.capexTotal
        ? `<div class="section">
  <h3>6. PRECIFICAÇÃO</h3>
  <div class="info-grid">
    <div class="info-item"><label>CAPEX Total:</label><span>R$ ${fmtBrl(Number(v.capexTotal))}</span></div>
    <div class="info-item"><label>OPEX Mensal:</label><span>R$ ${fmtBrl(Number(v.opexMensal ?? 0))}</span></div>
    ${v.mensalidade ? `<div class="info-item"><label>Mensalidade Comodato ${v.tipoContrato === 'COMODATO_48' ? '48' : '36'}m:</label><span>R$ ${fmtBrl(Number(v.mensalidade))}</span></div>` : ''}
    ${v.valorVenda ? `<div class="info-item"><label>Valor Venda:</label><span>R$ ${fmtBrl(Number(v.valorVenda))}</span></div>` : ''}
  </div>
</div>`
        : '';

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
        (foto: any) =>
          `<div class="foto-cell">
            <img src="${foto.urlBase64 ?? foto.url}" alt="${foto.categoria}" />
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
  .cfg-container { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .cfg-group { border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; }
  .cfg-group-title { font-weight: bold; color: #2d3748; font-size: 10px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
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

${this.buildConfiguracaoHtml(v.dadosConfiguracao)}

<div class="section page-break">
  <h3>4. CHECKLIST OPERACIONAL</h3>
  <table>
    <thead><tr><th>Item</th><th style="width:60px">Resposta</th><th>Observação</th></tr></thead>
    <tbody>${checklistRows}</tbody>
  </table>
</div>

<div class="section">
  <h3>5. EQUIPAMENTOS PREVISTOS</h3>
  <table>
    <thead><tr><th>Código</th><th>Descrição</th><th style="width:50px" class="center">Qtd</th><th style="width:80px" class="right">Custo Unit.</th><th style="width:80px" class="right">Total</th></tr></thead>
    <tbody>${produtosRows}${totalRow}</tbody>
  </table>
</div>

${precHtml}

${v.fotos.length > 0 ? `
<div class="section page-break">
  <h3>${v.capexTotal ? '7' : '6'}. REGISTRO FOTOGRÁFICO</h3>
  <div class="fotos-grid">${fotosHtml}</div>
</div>` : ''}

${v.assinaturas.length > 0 ? `
<div class="section page-break">
  <h3>${v.capexTotal ? '8' : '7'}. ASSINATURAS</h3>
  <div class="assinaturas">${assinaturas}</div>
</div>` : ''}

</body>
</html>`;
  }

  private async fetchBase64(url: string): Promise<string> {
    try {
      const res = await fetch(url);
      if (!res.ok) return '';
      const buf = await res.arrayBuffer();
      const mime = res.headers.get('content-type') || 'image/jpeg';
      return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
    } catch {
      return '';
    }
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
