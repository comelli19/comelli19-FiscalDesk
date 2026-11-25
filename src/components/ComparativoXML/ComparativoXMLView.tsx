import React, { useState, useMemo, useRef } from 'react';
import {
  UploadCloud,
  FileCode,
  Copy,
  Check,
  Download,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  FileSpreadsheet,
} from 'lucide-react';
import {
  parseXMLNFe,
  DadosNFeExtraidos,
  gerarXMLExemplo,
  gerarXMLCompraDemonstracao,
} from '../../services/xmlNFeParser';

type CenarioComparacao = '2027_cbs' | '2033_pleno';
type PerfilCredito = 'integral' | 'sem_credito' | 'sem_ipi';
type RepassePreco = 'manter_bruto' | 'desonerar_pis_cofins';

function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarQtd(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 4,
  });
}

export const ComparativoXMLView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [xmlTexto, setXmlTexto] = useState('');
  const [arquivoNome, setArquivoNome] = useState('');
  const [erroParse, setErroParse] = useState<string | null>(null);
  const [dadosXML, setDadosXML] = useState<DadosNFeExtraidos | null>(null);
  const [mostrarCampoTexto, setMostrarCampoTexto] = useState(false);
  const [escopoItem, setEscopoItem] = useState<'total' | number>('total');

  // Parâmetros configuráveis do comparativo 2026 x 2027/2033
  const [cenario, setCenario] = useState<CenarioComparacao>('2027_cbs');
  const [aliqCBS, setAliqCBS] = useState<number>(11.3);
  const [aliqIBS, setAliqIBS] = useState<number>(0);
  const [manterIPI2027, setManterIPI2027] = useState<boolean>(false);
  const [perfilCredito, setPerfilCredito] = useState<PerfilCredito>('integral');
  const [repassePreco, setRepassePreco] = useState<RepassePreco>('manter_bruto');
  const [copiado, setCopiado] = useState(false);

  const processarConteudoXML = (conteudo: string, nomeOrigem: string) => {
    setErroParse(null);
    if (!conteudo.trim()) {
      setErroParse('Selecione um arquivo XML ou cole o conteúdo da NF-e.');
      return;
    }
    const resultado = parseXMLNFe(conteudo);
    if (!resultado.sucesso || !resultado.dados) {
      setErroParse(resultado.erro || 'Não foi possível ler o XML informado.');
      return;
    }
    setDadosXML(resultado.dados);
    setArquivoNome(nomeOrigem);
    setEscopoItem('total');
    setMostrarCampoTexto(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const texto = (ev.target?.result as string) || '';
      setXmlTexto(texto);
      processarConteudoXML(texto, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const texto = (ev.target?.result as string) || '';
      setXmlTexto(texto);
      processarConteudoXML(texto, file.name);
    };
    reader.readAsText(file);
  };

  const handleCarregarDemo = (tipo: 'pvc_31500' | 'zfm_rs_ap' | 'difal_sp_rj') => {
    const xml =
      tipo === 'pvc_31500'
        ? gerarXMLCompraDemonstracao()
        : gerarXMLExemplo(tipo);
    const nome =
      tipo === 'pvc_31500'
        ? 'nfe_compostos_pvc_31500kg.xml'
        : `exemplo_${tipo}.xml`;
    setXmlTexto(xml);
    processarConteudoXML(xml, nome);

    if (tipo === 'pvc_31500') {
      setCenario('2027_cbs');
      setAliqCBS(11.3);
      setAliqIBS(0);
      setManterIPI2027(false);
      setPerfilCredito('integral');
      setRepassePreco('manter_bruto');
    }
  };

  const handleTrocarCenario = (novoCenario: CenarioComparacao) => {
    setCenario(novoCenario);
    if (novoCenario === '2027_cbs') {
      setAliqCBS(11.3);
      setAliqIBS(0);
      setManterIPI2027(false);
    } else {
      setAliqCBS(9.21);
      setAliqIBS(18.7);
      setManterIPI2027(false);
    }
  };

  // Cálculo estruturado 2026 x Ano Alvo (2027 ou 2033)
  const analise = useMemo(() => {
    if (!dadosXML) return null;

    const itemSelecionado =
      typeof escopoItem === 'number' ? dadosXML.itens[escopoItem] : null;

    const vProd2026 = itemSelecionado
      ? itemSelecionado.vProd
      : dadosXML.totais.valorProdutos ||
        dadosXML.itens.reduce((acc, it) => acc + it.vProd, 0);

    const vFrete = itemSelecionado ? 0 : dadosXML.totais.valorFrete || 0;
    const vSeg = itemSelecionado ? 0 : dadosXML.totais.valorSeguro || 0;
    const vOutro = itemSelecionado ? 0 : dadosXML.totais.valorOutro || 0;
    const vDesc = itemSelecionado ? 0 : dadosXML.totais.valorDesconto || 0;
    const despesasAcessorias = Number((vFrete + vSeg + vOutro - vDesc).toFixed(2));

    const ipi2026 = itemSelecionado
      ? itemSelecionado.valorIPI || 0
      : dadosXML.totais.valorIPI ||
        dadosXML.itens.reduce((acc, it) => acc + (it.valorIPI || 0), 0);

    const pis2026 = itemSelecionado
      ? itemSelecionado.valorPIS || 0
      : dadosXML.totais.valorPIS ||
        dadosXML.itens.reduce((acc, it) => acc + (it.valorPIS || 0), 0);

    const cofins2026 = itemSelecionado
      ? itemSelecionado.valorCOFINS || 0
      : dadosXML.totais.valorCOFINS ||
        dadosXML.itens.reduce((acc, it) => acc + (it.valorCOFINS || 0), 0);

    const icms2026 = itemSelecionado
      ? itemSelecionado.valorICMS || 0
      : dadosXML.totais.valorICMS ||
        dadosXML.itens.reduce((acc, it) => acc + (it.valorICMS || 0), 0);

    const icmsST2026 = itemSelecionado
      ? itemSelecionado.valorICMSST || 0
      : dadosXML.totais.valorST ||
        dadosXML.itens.reduce((acc, it) => acc + (it.valorICMSST || 0), 0);

    const cbs2026 = 0; // 2026: 0,9% teste compensável com PIS/COFINS (sem desembolso líquido)
    const ibs2026 = 0; // 2026: 0,1% teste compensável (sem desembolso líquido)

    // Total da NF 2026: usa vNF real se nota completa e coerente, ou recompõe
    const totalNota2026Recomposto = Number(
      (vProd2026 + despesasAcessorias + ipi2026 + icmsST2026).toFixed(2)
    );
    const totalNota2026 =
      !itemSelecionado && dadosXML.totais.valorTotalNF > 0
        ? dadosXML.totais.valorTotalNF
        : totalNota2026Recomposto;

    // Créditos 2026
    const tomaCreditoGeral = perfilCredito !== 'sem_credito';
    const tomaCreditoIPI = perfilCredito === 'integral';

    const credICMS2026 = tomaCreditoGeral ? icms2026 : 0;
    const credIPI2026 = tomaCreditoIPI ? ipi2026 : 0;
    const credPIS2026 = tomaCreditoGeral ? pis2026 : 0;
    const credCOFINS2026 = tomaCreditoGeral ? cofins2026 : 0;
    const credCBS2026 = 0;
    const credIBS2026 = 0;

    const totalCreditos2026 = Number(
      (credICMS2026 + credIPI2026 + credPIS2026 + credCOFINS2026).toFixed(2)
    );
    const custoLiquido2026 = Number((totalNota2026 - totalCreditos2026).toFixed(2));

    // =========================================================================
    // CENÁRIO ALVO (2027 Transição CBS ou 2033 Pleno IBS + CBS)
    // =========================================================================
    const anoAlvo = cenario === '2027_cbs' ? 2027 : 2033;

    // Preço do produto no cenário alvo:
    // Se repassePreco === 'desonerar_pis_cofins', retira PIS+COFINS (e ICMS em 2033) do preço bruto
    let vProdAlvo = vProd2026;
    if (repassePreco === 'desonerar_pis_cofins') {
      const cargaEmbutidaRetirada =
        cenario === '2027_cbs'
          ? pis2026 + cofins2026
          : pis2026 + cofins2026 + icms2026;
      vProdAlvo = Math.max(0, Number((vProd2026 - cargaEmbutidaRetirada).toFixed(2)));
    }

    const ipiAlvo = manterIPI2027 ? ipi2026 : 0;
    const pisAlvo = 0; // Extinto em 2027
    const cofinsAlvo = 0; // Extinto em 2027
    const icmsAlvo = cenario === '2027_cbs' ? icms2026 : 0; // Mantido em 2027; extinto em 2033
    const icmsSTAlvo = cenario === '2027_cbs' ? icmsST2026 : 0;

    const baseCalculoReforma = Number((vProdAlvo + despesasAcessorias).toFixed(2));
    const cbsAlvo = Number(((baseCalculoReforma * aliqCBS) / 100).toFixed(2));
    const ibsAlvo = Number(((baseCalculoReforma * aliqIBS) / 100).toFixed(2));

    const totalNotaAlvo = Number(
      (vProdAlvo + despesasAcessorias + ipiAlvo + icmsSTAlvo + cbsAlvo + ibsAlvo).toFixed(2)
    );

    const credICMSAlvo = tomaCreditoGeral ? icmsAlvo : 0;
    const credIPIAlvo = tomaCreditoIPI ? ipiAlvo : 0;
    const credPISAlvo = 0;
    const credCOFINSAlvo = 0;
    const credCBSAlvo = tomaCreditoGeral ? cbsAlvo : 0;
    const credIBSAlvo = tomaCreditoGeral ? ibsAlvo : 0;

    const totalCreditosAlvo = Number(
      (credICMSAlvo + credIPIAlvo + credCBSAlvo + credIBSAlvo).toFixed(2)
    );
    const custoLiquidoAlvo = Number((totalNotaAlvo - totalCreditosAlvo).toFixed(2));

    const diferencaCusto = Number((custoLiquidoAlvo - custoLiquido2026).toFixed(2));
    const variacaoPercentual =
      custoLiquido2026 > 0
        ? Number(((diferencaCusto / custoLiquido2026) * 100).toFixed(2))
        : 0;

    // Unidade e quantidade para cálculo de custo unitário
    let quantidadeTotal = 0;
    let unidadeLabel = 'UN';
    let descricaoOperacao = '';

    if (itemSelecionado) {
      quantidadeTotal = itemSelecionado.qCom || 1;
      unidadeLabel = (itemSelecionado.uCom || 'UN').toUpperCase();
      descricaoOperacao = `${formatarQtd(quantidadeTotal)} ${unidadeLabel} de ${itemSelecionado.xProd}`;
    } else {
      const unidades = Array.from(
        new Set(dadosXML.itens.map((i) => (i.uCom || 'UN').toUpperCase()))
      );
      quantidadeTotal = dadosXML.itens.reduce((acc, i) => acc + (i.qCom || 0), 0) || 1;
      if (unidades.length === 1) {
        unidadeLabel = unidades[0];
      } else {
        unidadeLabel = 'ITENS';
      }

      if (dadosXML.itens.length === 1) {
        descricaoOperacao = `${formatarQtd(quantidadeTotal)} ${unidadeLabel} de ${dadosXML.itens[0].xProd}`;
      } else {
        descricaoOperacao = `${dadosXML.itens.length} itens (${formatarQtd(quantidadeTotal)} ${unidadeLabel} no total) — NF-e nº ${dadosXML.numeroNF}`;
      }
    }

    const custoUnitario2026 =
      quantidadeTotal > 0 ? custoLiquido2026 / quantidadeTotal : 0;
    const custoUnitarioAlvo =
      quantidadeTotal > 0 ? custoLiquidoAlvo / quantidadeTotal : 0;
    const diferencaUnitaria = custoUnitarioAlvo - custoUnitario2026;

    return {
      anoAlvo,
      descricaoOperacao,
      quantidadeTotal,
      unidadeLabel,
      despesasAcessorias,
      vProd2026,
      vProdAlvo,
      ipi2026,
      ipiAlvo,
      pis2026,
      pisAlvo,
      cofins2026,
      cofinsAlvo,
      icms2026,
      icmsAlvo,
      icmsST2026,
      icmsSTAlvo,
      cbs2026,
      cbsAlvo,
      ibs2026,
      ibsAlvo,
      totalNota2026,
      totalNotaAlvo,
      credICMS2026,
      credICMSAlvo,
      credIPI2026,
      credIPIAlvo,
      credPIS2026,
      credPISAlvo,
      credCOFINS2026,
      credCOFINSAlvo,
      credCBS2026,
      credCBSAlvo,
      credIBS2026,
      credIBSAlvo,
      totalCreditos2026,
      totalCreditosAlvo,
      custoLiquido2026,
      custoLiquidoAlvo,
      diferencaCusto,
      variacaoPercentual,
      custoUnitario2026,
      custoUnitarioAlvo,
      diferencaUnitaria,
    };
  }, [dadosXML, escopoItem, cenario, aliqCBS, aliqIBS, manterIPI2027, perfilCredito, repassePreco]);

  const handleCopiarResumo = () => {
    if (!analise || !dadosXML) return;
    const texto = [
      `Comparativo Fiscal 2026 x ${analise.anoAlvo} — NF-e ${dadosXML.numeroNF}`,
      `Operação: ${analise.descricaoOperacao}`,
      `Valor dos produtos: 2026 = ${formatarBRL(analise.vProd2026)} | ${analise.anoAlvo} = ${formatarBRL(analise.vProdAlvo)}`,
      `Total estimado da nota: 2026 = ${formatarBRL(analise.totalNota2026)} | ${analise.anoAlvo} = ${formatarBRL(analise.totalNotaAlvo)}`,
      `Total de créditos considerados: 2026 = ${formatarBRL(analise.totalCreditos2026)} | ${analise.anoAlvo} = ${formatarBRL(analise.totalCreditosAlvo)}`,
      `Custo líquido estimado: 2026 = ${formatarBRL(analise.custoLiquido2026)} | ${analise.anoAlvo} = ${formatarBRL(analise.custoLiquidoAlvo)}`,
      `Diferença no custo líquido: ${formatarBRL(analise.diferencaCusto)} (${analise.variacaoPercentual > 0 ? '+' : ''}${analise.variacaoPercentual.toFixed(2).replace('.', ',')}%)`,
      `Custo líquido/${analise.unidadeLabel}: 2026 = ${formatarBRL(analise.custoUnitario2026)} | ${analise.anoAlvo} = ${formatarBRL(analise.custoUnitarioAlvo)}`,
    ].join('\n');

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleExportarCSV = () => {
    if (!analise || !dadosXML) return;
    const linhas = [
      ['Composicao', '2026', String(analise.anoAlvo)],
      ['Valor dos produtos', analise.vProd2026.toFixed(2), analise.vProdAlvo.toFixed(2)],
      ['IPI', analise.ipi2026.toFixed(2), analise.ipiAlvo.toFixed(2)],
      ['PIS', analise.pis2026.toFixed(2), analise.pisAlvo.toFixed(2)],
      ['COFINS', analise.cofins2026.toFixed(2), analise.cofinsAlvo.toFixed(2)],
      ['ICMS', analise.icms2026.toFixed(2), analise.icmsAlvo.toFixed(2)],
      ['CBS', analise.cbs2026.toFixed(2), analise.cbsAlvo.toFixed(2)],
      ...(analise.ibsAlvo > 0 || cenario === '2033_pleno'
        ? [['IBS', analise.ibs2026.toFixed(2), analise.ibsAlvo.toFixed(2)]]
        : []),
      ['Total estimado da nota', analise.totalNota2026.toFixed(2), analise.totalNotaAlvo.toFixed(2)],
      ['Creditos de ICMS', analise.credICMS2026.toFixed(2), analise.credICMSAlvo.toFixed(2)],
      ['Creditos de IPI', analise.credIPI2026.toFixed(2), analise.credIPIAlvo.toFixed(2)],
      ['Creditos de PIS', analise.credPIS2026.toFixed(2), analise.credPISAlvo.toFixed(2)],
      ['Creditos de COFINS', analise.credCOFINS2026.toFixed(2), analise.credCOFINSAlvo.toFixed(2)],
      ['Creditos de CBS', analise.credCBS2026.toFixed(2), analise.credCBSAlvo.toFixed(2)],
      ['Total de creditos considerados', analise.totalCreditos2026.toFixed(2), analise.totalCreditosAlvo.toFixed(2)],
      ['Custo liquido estimado', analise.custoLiquido2026.toFixed(2), analise.custoLiquidoAlvo.toFixed(2)],
    ];

    const csv =
      'data:text/csv;charset=utf-8,\uFEFF' +
      linhas.map((l) => l.join(';')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute(
      'download',
      `comparativo_xml_nfe_${dadosXML.numeroNF}_2026_x_${analise.anoAlvo}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // TELA INICIAL (SEM XML CARREGADO)
  // =========================================================================
  if (!dadosXML || !analise) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-semibold text-[#111827]">
              Análise Executiva de XML — Comparativo 2026 × 2027
            </h2>
            <p className="text-sm text-[#4B5563]">
              Importe o arquivo XML de uma NF-e real para demonstrar de forma clara a composição tributária, os créditos aproveitáveis, o custo líquido total e o custo unitário (por kg/un) na transição tributária.
            </p>
          </div>

          {erroParse && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erroParse}</span>
            </div>
          )}

          {/* Área de Drag & Drop / Upload */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#D1D5DB] hover:border-[#9E141A] bg-[#F9FAFB] hover:bg-[#FDF3F3]/40 rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-colors space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-[#E4E7EC] flex items-center justify-center text-[#9E141A]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold text-[#111827]">
                Clique para selecionar o arquivo XML da NF-e ou arraste até aqui
              </p>
              <p className="text-xs text-[#6B7280]">
                Compatível com NF-e modelo 55 (v3.10 e v4.00) · Processamento local no navegador
              </p>
            </div>
          </div>

          {/* Toggle para colar XML manualmente */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMostrarCampoTexto((v) => !v)}
                className="text-xs font-medium text-[#374151] hover:text-[#9E141A] underline underline-offset-4 cursor-pointer"
              >
                {mostrarCampoTexto
                  ? 'Ocultar campo de texto XML'
                  : 'Ou colar o conteúdo XML manualmente'}
              </button>
            </div>

            {mostrarCampoTexto && (
              <div className="space-y-2.5">
                <textarea
                  rows={6}
                  value={xmlTexto}
                  onChange={(e) => setXmlTexto(e.target.value)}
                  placeholder="Cole aqui o conteúdo do arquivo XML (<nfeProc> ou <NFe>)..."
                  className="w-full p-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg font-mono text-xs text-[#111827] focus:border-[#9E141A] outline-hidden"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => processarConteudoXML(xmlTexto, 'xml_colado.xml')}
                    className="px-4 py-2 bg-[#9E141A] hover:bg-[#851015] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Gerar Comparativo 2026 × 2027
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Exemplos prontos para demonstração */}
          <div className="pt-4 border-t border-[#E4E7EC] space-y-3">
            <p className="text-xs font-medium text-[#4B5563]">
              Demonstrações prontas com 1 clique:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCarregarDemo('pvc_31500')}
                className="p-3.5 text-left bg-[#F9FAFB] hover:bg-[#FDF3F3] border border-[#E4E7EC] hover:border-[#F3C6C8] rounded-lg transition-colors space-y-1 cursor-pointer"
              >
                <span className="font-display text-xs font-semibold text-[#111827] block">
                  Compra 31.500 kg Compostos PVC
                </span>
                <span className="text-[11px] text-slate-500 block">
                  SP → SC · R$ 241.605,00 · IPI + PIS/COFINS + ICMS
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCarregarDemo('difal_sp_rj')}
                className="p-3.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors space-y-1 cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-900 block">
                  Venda Interestadual (SP → RJ)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Operação interestadual com destaque de ICMS e PIS/COFINS
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCarregarDemo('zfm_rs_ap')}
                className="p-3.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors space-y-1 cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-900 block">
                  Operação ALC Macapá (RS → AP)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Simulação com incentivos regionais e desoneração
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TELA DE RESULTADO EXECUTIVO (COMPARATIVO 2026 x 2027/2033)
  // =========================================================================
  const houveAumento = analise.diferencaCusto > 0.005;
  const houveEconomia = analise.diferencaCusto < -0.005;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Barra superior do documento XML carregado */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span className="font-bold text-slate-900">
              NF-e nº {dadosXML.numeroNF || '—'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{arquivoNome}</span>
            <span aria-hidden="true">·</span>
            <span>
              {dadosXML.emitente.uf} → {dadosXML.destinatario.uf}
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate">
            {dadosXML.emitente.razaoSocial} → {dadosXML.destinatario.razaoSocial}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleCopiarResumo}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copiado ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                Copiar Resumo
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportarCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => {
              setDadosXML(null);
              setErroParse(null);
            }}
            className="px-3 py-1.5 bg-[#9E141A] hover:bg-[#851015] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Importar Novo XML
          </button>
        </div>
      </div>

      {/* Controles da Simulação */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700 block">
            Cenário da Reforma
          </label>
          <select
            value={cenario}
            onChange={(e) => handleTrocarCenario(e.target.value as CenarioComparacao)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-hidden focus:border-[#A8181F]"
          >
            <option value="2027_cbs">2026 × 2027 (Entrada da CBS)</option>
            <option value="2033_pleno">2026 × 2033 (CBS + IBS Pleno)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700 block">
            {cenario === '2027_cbs' ? 'Alíquota CBS (%)' : 'Alíquotas CBS (%) / IBS (%)'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              max="50"
              value={aliqCBS}
              onChange={(e) => setAliqCBS(parseFloat(e.target.value) || 0)}
              aria-label="Alíquota CBS em porcentagem"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 tabular-nums outline-hidden focus:border-[#A8181F]"
            />
            {cenario === '2033_pleno' && (
              <input
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={aliqIBS}
                onChange={(e) => setAliqIBS(parseFloat(e.target.value) || 0)}
                aria-label="Alíquota IBS em porcentagem"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 tabular-nums outline-hidden focus:border-[#A8181F]"
              />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700 block">
            Aproveitamento de Créditos
          </label>
          <select
            value={perfilCredito}
            onChange={(e) => setPerfilCredito(e.target.value as PerfilCredito)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-hidden focus:border-[#A8181F]"
          >
            <option value="integral">Crédito Integral (Lucro Real / Insumo)</option>
            <option value="sem_ipi">Sem Crédito de IPI (Comércio / Revenda)</option>
            <option value="sem_credito">Sem Créditos (Consumo / Presumido)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700 block">
            Preço do Fornecedor em {analise.anoAlvo}
          </label>
          <select
            value={repassePreco}
            onChange={(e) => setRepassePreco(e.target.value as RepassePreco)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 outline-hidden focus:border-[#A8181F]"
          >
            <option value="manter_bruto">Manter preço do XML (sem repasse)</option>
            <option value="desonerar_pis_cofins">
              Desonerar tributos extintos do preço
            </option>
          </select>
        </div>

        {dadosXML.itens.length > 1 && (
          <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <label className="font-semibold text-slate-700">
              Escopo da Demonstração ({dadosXML.itens.length} itens na NF-e):
            </label>
            <select
              value={escopoItem === 'total' ? 'total' : String(escopoItem)}
              onChange={(e) =>
                setEscopoItem(
                  e.target.value === 'total' ? 'total' : parseInt(e.target.value, 10)
                )
              }
              className="p-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-hidden focus:border-[#A8181F]"
            >
              <option value="total">
                Nota Completa ({dadosXML.itens.length} itens)
              </option>
              {dadosXML.itens.map((it, idx) => (
                <option key={`${it.nItem}-${idx}`} value={String(idx)}>
                  Item {it.nItem}: {it.xProd} ({formatarQtd(it.qCom)} {it.uCom})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 1. COMPARATIVO GERAL — 2026 x 2027/2033                           */}
      {/* ================================================================= */}
      <section className="bg-white border border-[#E4E7EC] rounded-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#ECEEF2]">
          <h3 className="font-display text-base font-semibold text-[#111827]">
            1. Comparativo geral — 2026 × {analise.anoAlvo}
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Simulação para a operação de {analise.descricaoOperacao}.
          </p>
        </div>

        <div className="overflow-x-auto px-6 py-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 text-left">Composição</th>
                <th className="py-3 text-right w-40 tabular-nums">2026</th>
                <th className="py-3 text-right w-40 tabular-nums">{analise.anoAlvo}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
              <tr>
                <td className="py-2.5 font-medium text-slate-900">Valor dos produtos</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.vProd2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.vProdAlvo)}
                </td>
              </tr>

              {analise.despesasAcessorias !== 0 && (
                <tr>
                  <td className="py-2.5">Frete / despesas / descontos</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatarBRL(analise.despesasAcessorias)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatarBRL(analise.despesasAcessorias)}
                  </td>
                </tr>
              )}

              <tr>
                <td className="py-2.5">IPI</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.ipi2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.ipiAlvo)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5">PIS</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.pis2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.pisAlvo)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5">COFINS</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.cofins2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.cofinsAlvo)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5">ICMS</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.icms2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.icmsAlvo)}
                </td>
              </tr>

              {(analise.icmsST2026 > 0 || analise.icmsSTAlvo > 0) && (
                <tr>
                  <td className="py-2.5">ICMS-ST</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatarBRL(analise.icmsST2026)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatarBRL(analise.icmsSTAlvo)}
                  </td>
                </tr>
              )}

              <tr>
                <td className="py-2.5">
                  CBS ({aliqCBS.toFixed(2).replace('.', ',')}% em {analise.anoAlvo})
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums text-slate-400">
                  —
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.cbsAlvo)}
                </td>
              </tr>

              {(cenario === '2033_pleno' || analise.ibsAlvo > 0) && (
                <tr>
                  <td className="py-2.5">
                    IBS ({aliqIBS.toFixed(2).replace('.', ',')}% em {analise.anoAlvo})
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-slate-400">
                    —
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatarBRL(analise.ibsAlvo)}
                  </td>
                </tr>
              )}

              {/* Total estimado da nota */}
              <tr className="bg-slate-50/80 border-t border-b border-slate-200 font-bold text-slate-900">
                <td className="py-3">Total estimado da nota</td>
                <td className="py-3 text-right font-mono tabular-nums">
                  {formatarBRL(analise.totalNota2026)}
                </td>
                <td className="py-3 text-right font-mono tabular-nums">
                  {formatarBRL(analise.totalNotaAlvo)}
                </td>
              </tr>

              {/* Bloco de Créditos */}
              <tr>
                <td className="py-2.5">Créditos de ICMS</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credICMS2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credICMSAlvo)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5">Créditos de IPI</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credIPI2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credIPIAlvo)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5">Créditos de PIS</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credPIS2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credPISAlvo)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5">Créditos de COFINS</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credCOFINS2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credCOFINSAlvo)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5">Créditos de CBS</td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credCBS2026)}
                </td>
                <td className="py-2.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.credCBSAlvo)}
                </td>
              </tr>

              {(cenario === '2033_pleno' || analise.credIBSAlvo > 0) && (
                <tr>
                  <td className="py-2.5">Créditos de IBS</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatarBRL(analise.credIBS2026)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {formatarBRL(analise.credIBSAlvo)}
                  </td>
                </tr>
              )}

              <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                <td className="py-3">Total de créditos considerados</td>
                <td className="py-3 text-right font-mono tabular-nums">
                  {formatarBRL(analise.totalCreditos2026)}
                </td>
                <td className="py-3 text-right font-mono tabular-nums">
                  {formatarBRL(analise.totalCreditosAlvo)}
                </td>
              </tr>

              <tr className="bg-slate-900 text-white font-bold">
                <td className="py-3.5 px-3 rounded-bl-lg">Custo líquido estimado</td>
                <td className="py-3.5 text-right font-mono tabular-nums">
                  {formatarBRL(analise.custoLiquido2026)}
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums rounded-br-lg">
                  {formatarBRL(analise.custoLiquidoAlvo)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#ECEEF2] text-xs text-[#4B5563] leading-relaxed">
          {cenario === '2027_cbs' ? (
            <>
              Para o cenário de 2027, considerou-se a CBS ({aliqCBS.toFixed(2).replace('.', ',')}%) adicionada por fora ao valor dos produtos
              {repassePreco === 'desonerar_pis_cofins'
                ? ' (com desoneração prévia de PIS/COFINS no preço do fornecedor)'
                : ' (mantendo o preço bruto praticado em 2026)'}
              , extinção de PIS/COFINS e manutenção integral do ICMS.{' '}
              {perfilCredito === 'integral'
                ? 'Aplicado crédito integral de ICMS e CBS.'
                : perfilCredito === 'sem_ipi'
                ? 'Aplicado crédito de ICMS e CBS (sem aproveitamento de IPI).'
                : 'Sem aproveitamento de créditos fiscais na entrada.'}{' '}
              {aliqIBS === 0 && 'IBS não foi incluído nesta etapa de transição de 2027.'}
            </>
          ) : (
            <>
              Para o cenário pleno de 2033, considerou-se a substituição integral de ICMS, IPI, PIS e COFINS por CBS ({aliqCBS.toFixed(2).replace('.', ',')}%) + IBS ({aliqIBS.toFixed(2).replace('.', ',')}%) por fora
              {repassePreco === 'desonerar_pis_cofins'
                ? ', com desoneração dos tributos atuais embutidos no preço base.'
                : ', mantendo o valor base dos produtos constante.'}
            </>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. RESULTADO FINANCEIRO                                           */}
      {/* ================================================================= */}
      <section className="space-y-3">
        <h3 className="font-display text-base font-semibold text-[#111827]">
          2. Resultado financeiro
        </h3>

        <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 space-y-6">
          {/* Destaque principal da variação */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-[#6B7280] block">
              {houveAumento
                ? 'Aumento estimado no custo líquido da operação'
                : houveEconomia
                ? 'Economia estimada no custo líquido da operação'
                : 'Impacto neutro no custo líquido da operação'}
            </span>

            <div className="flex flex-wrap items-baseline gap-3">
              <span
                className={`text-3xl font-bold font-display tabular-nums tracking-tight ${
                  houveAumento
                    ? 'text-[#9E141A]'
                    : houveEconomia
                    ? 'text-emerald-700'
                    : 'text-[#111827]'
                }`}
              >
                {formatarBRL(Math.abs(analise.diferencaCusto))}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold tabular-nums ${
                  houveAumento
                    ? 'bg-[#FDF3F3] text-[#9E141A] border border-[#F3C6C8]'
                    : houveEconomia
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {houveAumento ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : houveEconomia ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {analise.variacaoPercentual > 0 ? '+' : ''}
                {analise.variacaoPercentual.toFixed(2).replace('.', ',')}%
              </span>
            </div>
          </div>

          {/* Grid 2x2 de custos totais e unitários */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-slate-200">
            <div>
              <span className="text-xs text-slate-500 block">Custo líquido 2026</span>
              <span className="text-lg font-bold font-display tabular-nums tracking-tight text-slate-900 mt-1 block">
                {formatarBRL(analise.custoLiquido2026)}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">
                Custo líquido {analise.anoAlvo}
              </span>
              <span className="text-lg font-bold font-display tabular-nums tracking-tight text-slate-900 mt-1 block">
                {formatarBRL(analise.custoLiquidoAlvo)}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 block">
                Custo líquido/{analise.unidadeLabel.toLowerCase()} em 2026
              </span>
              <span className="text-base font-bold font-display tabular-nums tracking-tight text-slate-900 mt-1 block">
                {formatarBRL(analise.custoUnitario2026)}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 block">
                Custo líquido/{analise.unidadeLabel.toLowerCase()} em {analise.anoAlvo}
              </span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                {formatarBRL(analise.custoUnitarioAlvo)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Diferença estimada:{' '}
            <strong className="text-slate-800 font-mono tabular-nums">
              {analise.diferencaUnitaria > 0 ? '+' : ''}
              {formatarBRL(analise.diferencaUnitaria)}
            </strong>{' '}
            por {analise.unidadeLabel.toLowerCase()} ({formatarQtd(analise.quantidadeTotal)}{' '}
            {analise.unidadeLabel.toLowerCase()} considerados).
          </div>
        </div>
      </section>
    </div>
  );
};
