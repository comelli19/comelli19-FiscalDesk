// Gerador Oficial de PDF — DANFSe (Documento Auxiliar da NFS-e Padrão Nacional + RTC CBS/IBS)
// Módulo equivalente ao repositório calculadora-rtc-gerador-danfse (Portaria COTEC nº 342/2026)

import { DanfseDadosExtraidos } from './rtcCalculadoraService';

function fmtBRL(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDoc(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return doc;
}

export async function gerarEBaixarDanfsePDF(dados: DanfseDadosExtraidos): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = 12;

  const drawBox = (x: number, top: number, w: number, h: number, fillRgb?: [number, number, number]) => {
    if (fillRgb) {
      doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
      doc.rect(x, top, w, h, 'FD');
    } else {
      doc.rect(x, top, w, h);
    }
  };

  doc.setDrawColor(190, 196, 206);
  doc.setLineWidth(0.25);

  // =========================================================
  // 1. CABEÇALHO OFICIAL DANFSe (PADRÃO NACIONAL)
  // =========================================================
  drawBox(margin, y, contentWidth, 22, [19, 20, 23]);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DANFSe v1.0 — Documento Auxiliar da NFS-e', margin + 4, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 204, 212);
  doc.text(
    `Padrão Nacional (RFB / Portaria COTEC nº 342/2026) · Município de Incidência: ${dados.municipioIncidencia} / ${dados.ufIncidencia}`,
    margin + 4,
    y + 13.5
  );
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Chave de Acesso: ${dados.chaveAcesso}`, margin + 4, y + 18.5);

  // Quadro Número NFS-e à direita
  doc.setFillColor(158, 20, 26);
  doc.rect(margin + contentWidth - 44, y + 3, 41, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('NÚMERO DA NFS-e', margin + contentWidth - 41, y + 8);
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text(dados.numeroNFSe, margin + contentWidth - 41, y + 14.5);

  y += 25;

  // =========================================================
  // 2. METADADOS DE EMISSÃO / DPS
  // =========================================================
  drawBox(margin, y, contentWidth, 13, [248, 249, 251]);
  doc.setTextColor(95, 104, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const colsMeta = [
    { label: 'DATA / HORA EMISSÃO', val: dados.dataEmissao.replace('T', ' ').slice(0, 19), x: margin + 3 },
    { label: 'COMPETÊNCIA', val: dados.competencia, x: margin + 52 },
    { label: 'SÉRIE / Nº DPS', val: `${dados.serieDPS} / ${dados.numeroDPS}`, x: margin + 88 },
    { label: 'CÓDIGO VERIFICAÇÃO', val: dados.codigoVerificacao, x: margin + 126 },
  ];
  colsMeta.forEach((c) => {
    doc.setTextColor(100, 108, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(c.label, c.x, y + 4.5);
    doc.setTextColor(20, 24, 32);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text(c.val, c.x, y + 10);
  });

  y += 16;

  // =========================================================
  // 3. PRESTADOR DE SERVIÇOS
  // =========================================================
  drawBox(margin, y, contentWidth, 24);
  doc.setFillColor(240, 242, 245);
  doc.rect(margin, y, contentWidth, 6, 'FD');
  doc.setTextColor(20, 24, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('EMITENTE / PRESTADOR DO SERVIÇO', margin + 3, y + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(dados.prestador.razaoSocial.slice(0, 85), margin + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.text(
    `CNPJ/CPF: ${fmtDoc(dados.prestador.cnpjCpf)}   ·   Inscrição Municipal: ${dados.prestador.inscricaoMunicipal}   ·   ${dados.prestador.optanteSimples}`,
    margin + 3,
    y + 16
  );
  doc.text(
    `Endereço: ${dados.prestador.endereco} — ${dados.prestador.municipioUF}   ·   E-mail: ${dados.prestador.email}`,
    margin + 3,
    y + 21
  );

  y += 27;

  // =========================================================
  // 4. TOMADOR DE SERVIÇOS
  // =========================================================
  drawBox(margin, y, contentWidth, 24);
  doc.setFillColor(240, 242, 245);
  doc.rect(margin, y, contentWidth, 6, 'FD');
  doc.setTextColor(20, 24, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TOMADOR DO SERVIÇO', margin + 3, y + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(dados.tomador.razaoSocial.slice(0, 85), margin + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.text(
    `CNPJ/CPF: ${fmtDoc(dados.tomador.cnpjCpf)}   ·   Inscrição Municipal: ${dados.tomador.inscricaoMunicipal}   ·   E-mail: ${dados.tomador.email}`,
    margin + 3,
    y + 16
  );
  doc.text(`Endereço: ${dados.tomador.endereco} — ${dados.tomador.municipioUF}`, margin + 3, y + 21);

  y += 27;

  // =========================================================
  // 5. SERVIÇO PRESTADO & DISCRIMINAÇÃO
  // =========================================================
  const descLines = doc.splitTextToSize(dados.servico.discriminacao, contentWidth - 6);
  const servBoxHeight = Math.max(28, 16 + descLines.length * 4.2);
  drawBox(margin, y, contentWidth, servBoxHeight);
  doc.setFillColor(240, 242, 245);
  doc.rect(margin, y, contentWidth, 6, 'FD');
  doc.setTextColor(20, 24, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SERVIÇO PRESTADO (DESCRIÇÃO / NBS / TRIBUTAÇÃO NACIONAL)', margin + 3, y + 4.2);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(158, 20, 26);
  doc.text(
    `Cód. Tributação Nacional: ${dados.servico.codigoTributacaoNacional}   ·   NBS: ${dados.servico.codigoNBS}`,
    margin + 3,
    y + 11
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(31, 41, 55);
  doc.text(descLines, margin + 3, y + 16.5);

  y += servBoxHeight + 3;

  // =========================================================
  // 6. TRIBUTAÇÃO MUNICIPAL (ISSQN) & RETENÇÕES FEDERAIS
  // =========================================================
  drawBox(margin, y, contentWidth, 26);
  doc.setFillColor(240, 242, 245);
  doc.rect(margin, y, contentWidth, 6, 'FD');
  doc.setTextColor(20, 24, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TRIBUTAÇÃO MUNICIPAL (ISSQN) E RETENÇÕES FEDERAIS', margin + 3, y + 4.2);

  const issItems = [
    { l: 'VALOR SERVIÇO', v: fmtBRL(dados.servico.valorServicos) },
    { l: 'BASE CÁLCULO ISS', v: fmtBRL(dados.servico.baseCalculoISS) },
    { l: 'ALÍQUOTA ISS', v: `${dados.servico.aliquotaISS.toFixed(2)}%` },
    { l: 'VALOR ISSQN', v: fmtBRL(dados.servico.valorISS) },
    { l: 'ISS RETIDO', v: dados.servico.issRetido ? 'SIM (Tomador)' : 'NÃO (Prestador)' },
  ];
  const colW = contentWidth / 5;
  issItems.forEach((item, idx) => {
    const cx = margin + 3 + idx * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(item.l, cx, y + 10.5);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(17, 24, 39);
    doc.text(item.v, cx, y + 15);
  });

  doc.setDrawColor(225, 229, 235);
  doc.line(margin + 2, y + 17.5, margin + contentWidth - 2, y + 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Retenções Federais:  IRRF ${fmtBRL(dados.retencoesFederais.irrf)}  ·  PIS ${fmtBRL(dados.retencoesFederais.pis)}  ·  COFINS ${fmtBRL(dados.retencoesFederais.cofins)}  ·  CSLL ${fmtBRL(dados.retencoesFederais.csll)}  ·  INSS ${fmtBRL(dados.retencoesFederais.inss)}`,
    margin + 3,
    y + 22.5
  );

  y += 29;

  // =========================================================
  // 7. GRUPO REFORMA TRIBUTÁRIA (IBS / CBS — LC 214/2025)
  // =========================================================
  drawBox(margin, y, contentWidth, 25, [253, 245, 245]);
  doc.setFillColor(158, 20, 26);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('REFORMA TRIBUTÁRIA DO CONSUMO — GRUPO <IBSCBS> (LC 214/2025 · NT 2025.002)', margin + 3, y + 4.2);

  if (dados.reformaTributariaRTC.presenteNoXml) {
    const rtc = dados.reformaTributariaRTC;
    const rtcCols = [
      { l: 'CST / cClassTrib', v: `${rtc.cst} / ${rtc.cClassTrib}` },
      { l: 'BASE UNIFICADA (vBC)', v: fmtBRL(rtc.vBC) },
      { l: `IBS UF (${rtc.pIBSUF.toFixed(2)}%)`, v: fmtBRL(rtc.vIBSUF) },
      { l: `IBS MUN (${rtc.pIBSMun.toFixed(2)}%)`, v: fmtBRL(rtc.vIBSMun) },
      { l: `CBS (${rtc.pCBS.toFixed(2)}%)`, v: fmtBRL(rtc.vCBS) },
    ];
    rtcCols.forEach((item, idx) => {
      const cx = margin + 3 + idx * colW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(127, 29, 29);
      doc.text(item.l, cx, y + 11.5);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(17, 24, 39);
      doc.text(item.v, cx, y + 16.5);
    });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(158, 20, 26);
    doc.text(
      `Total IBS + CBS destacado no documento: ${fmtBRL(rtc.totalIBSCBS)}`,
      margin + 3,
      y + 22
    );
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      'Grupo <IBSCBS> não informado no XML importado (documento emitido no leiaute anterior à NT 2025.002).',
      margin + 3,
      y + 15
    );
  }

  y += 28;

  // =========================================================
  // 8. VALOR TOTAL LÍQUIDO & INFORMAÇÕES COMPLEMENTARES
  // =========================================================
  drawBox(margin, y, contentWidth, 14, [19, 20, 23]);
  doc.setTextColor(200, 204, 212);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('VALOR LÍQUIDO DA NFS-e', margin + 4, y + 8.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text(fmtBRL(dados.servico.valorLiquido), margin + contentWidth - 4, y + 9, { align: 'right' });

  y += 17;

  const infoLines = doc.splitTextToSize(dados.informacoesComplementares, contentWidth - 6);
  const infoHeight = Math.max(16, 10 + infoLines.length * 4);
  drawBox(margin, y, contentWidth, infoHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('INFORMAÇÕES COMPLEMENTARES / BASE LEGAL', margin + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  doc.text(infoLines, margin + 3, y + 10);

  // Rodapé institucional
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 128, 140);
  doc.text(
    'Gerador DANFSe RTC (Portaria COTEC nº 342/2026) · FiscalDesk — Idealizado e desenvolvido por Leonardo Comelli',
    margin,
    287
  );
  doc.text(
    `Emitido em ${new Date().toLocaleString('pt-BR')}`,
    margin + contentWidth,
    287,
    { align: 'right' }
  );

  doc.save(`DANFSe_${dados.numeroNFSe.replace(/\W/g, '')}.pdf`);
}
