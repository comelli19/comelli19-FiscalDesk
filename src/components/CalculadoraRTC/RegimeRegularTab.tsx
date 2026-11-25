import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Code2,
  Copy,
  Check,
  Calculator,
  ChevronDown,
  ChevronUp,
  FileCode2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  RTC_ALIQUOTAS_REFERENCIA_ANO,
  RTC_CLASSIFICACOES_TRIBUTARIAS,
  RTC_CST_CBS_IBS,
  RTC_MUNICIPIOS_REFERENCIA,
  RTC_NCM_CATALOGO_COMPLETO,
  RTC_NBS_SERVICOS,
  RtcNcmRegra,
} from '../../data/rtcTabelasOficiais';
import {
  calcularBaseUnificadaNFe,
  calcularBaseUnificadaNFSe,
  calcularRegimeRegular,
  RtcRegimeRegularItemInput,
  RtcRegimeRegularRequest,
  RtcRegimeRegularResponse,
} from '../../services/rtcCalculadoraService';

interface RegimeRegularTabProps {
  apiEndpointMode: 'integrado' | 'externo';
  externalApiUrl: string;
  onEnviarParaXml: (resultado: RtcRegimeRegularResponse, tipo: 'NFE' | 'NFSE') => void;
}

interface CenarioRapido {
  id: string;
  titulo: string;
  ano: number;
  tipo: 'NFE' | 'NFSE';
  item: RtcRegimeRegularItemInput;
}

const CENARIOS_RAPIDOS: CenarioRapido[] = [
  {
    id: 'industrial',
    titulo: 'Venda Industrial',
    ano: 2027,
    tipo: 'NFE',
    item: {
      numero: 1,
      descricao: 'Postigos e artefatos de plástico para construção',
      ncm: '39253000',
      cst: '000',
      cClassTrib: '000001',
      baseCalculo: 10000,
      aplicarIS: false,
    },
  },
  {
    id: 'cesta_basica',
    titulo: 'Cesta Básica (Zero)',
    ano: 2027,
    tipo: 'NFE',
    item: {
      numero: 1,
      descricao: 'Arroz semibranqueado ou branqueado (Cesta Básica)',
      ncm: '10063021',
      cst: '200',
      cClassTrib: '200003',
      baseCalculo: 5000,
      aplicarIS: false,
    },
  },
  {
    id: 'servico_prof',
    titulo: 'Consultoria (−30%)',
    ano: 2027,
    tipo: 'NFSE',
    item: {
      numero: 1,
      descricao: 'Serviços de contabilidade, auditoria e consultoria fiscal',
      nbs: '1.1302.10.00',
      cst: '200',
      cClassTrib: '200052',
      baseCalculo: 12000,
      aplicarIS: false,
    },
  },
  {
    id: 'imposto_seletivo',
    titulo: 'Bebida c/ Imposto Seletivo',
    ano: 2027,
    tipo: 'NFE',
    item: {
      numero: 1,
      descricao: 'Águas e bebidas não alcoólicas adicionadas de açúcar (Refrigerantes)',
      ncm: '22021000',
      cst: '000',
      cClassTrib: '000001',
      baseCalculo: 8000,
      aplicarIS: true,
      pISOverride: 2.0,
    },
  },
];

function fmtBRL(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNcmCode(ncm: string): string {
  const d = ncm.replace(/\D/g, '');
  if (d.length === 8) return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
  return ncm;
}

export const RegimeRegularTab: React.FC<RegimeRegularTabProps> = ({
  apiEndpointMode,
  externalApiUrl,
  onEnviarParaXml,
}) => {
  const [anoVigencia, setAnoVigencia] = useState<number>(2027);
  const [tipoDocumento, setTipoDocumento] = useState<'NFE' | 'NFSE'>('NFE');
  const [municipioIBGE, setMunicipioIBGE] = useState<string>('4307609');
  const [cenarioAtivo, setCenarioAtivo] = useState<string>('industrial');

  const [itens, setItens] = useState<RtcRegimeRegularItemInput[]>([CENARIOS_RAPIDOS[0].item]);

  // Busca inteligente de NCM por item
  const [ncmQueryMap, setNcmQueryMap] = useState<Record<number, string>>({});
  const [openNcmDropdown, setOpenNcmDropdown] = useState<number | null>(null);
  const [expandedAdvanced, setExpandedAdvanced] = useState<Record<number, boolean>>({});

  // Compositor de Base de Cálculo Unificada (LC 214/2025 Art. 12)
  const [showBaseComposer, setShowBaseComposer] = useState<boolean>(false);
  const [baseFornecimento, setBaseFornecimento] = useState<number>(12500);
  const [baseFrete, setBaseFrete] = useState<number>(350);
  const [baseDesconto, setBaseDesconto] = useState<number>(0);
  const [baseICMS, setBaseICMS] = useState<number>(2125);
  const [basePIS, setBasePIS] = useState<number>(206.25);
  const [baseCOFINS, setBaseCOFINS] = useState<number>(950);
  const [baseIPI, setBaseIPI] = useState<number>(0);
  const [baseISS, setBaseISS] = useState<number>(375);

  // Inspetor JSON API REST
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [externalResult, setExternalResult] = useState<RtcRegimeRegularResponse | null>(null);
  const [loadingExternal, setLoadingExternal] = useState<boolean>(false);

  const municipioSelecionado =
    RTC_MUNICIPIOS_REFERENCIA.find((m) => m.codigoIBGE === municipioIBGE) || RTC_MUNICIPIOS_REFERENCIA[0];

  const aliquotaAnoAtual =
    RTC_ALIQUOTAS_REFERENCIA_ANO.find((a) => a.ano === anoVigencia) || RTC_ALIQUOTAS_REFERENCIA_ANO[0];

  const requestPayload: RtcRegimeRegularRequest = useMemo(
    () => ({
      anoVigencia,
      tipoDocumento,
      ufDestino: municipioSelecionado.uf,
      municipioIBGE: municipioSelecionado.codigoIBGE,
      itens,
    }),
    [anoVigencia, tipoDocumento, municipioSelecionado, itens]
  );

  const resultadoLocal = useMemo(() => calcularRegimeRegular(requestPayload), [requestPayload]);
  const resultado = apiEndpointMode === 'externo' && externalResult ? externalResult : resultadoLocal;

  const baseUnificadaPreview = useMemo(() => {
    if (tipoDocumento === 'NFE') {
      return calcularBaseUnificadaNFe({
        valorFornecimento: baseFornecimento,
        valorFrete: baseFrete,
        descontoIncondicional: baseDesconto,
        icms: baseICMS,
        pis: basePIS,
        cofins: baseCOFINS,
        ipi: baseIPI,
      });
    }
    return calcularBaseUnificadaNFSe({
      valorServico: baseFornecimento,
      descontoIncondicional: baseDesconto,
      iss: baseISS,
      pis: basePIS,
      cofins: baseCOFINS,
    });
  }, [tipoDocumento, baseFornecimento, baseFrete, baseDesconto, baseICMS, basePIS, baseCOFINS, baseIPI, baseISS]);

  const handleAplicarCenario = (cenario: CenarioRapido) => {
    setCenarioAtivo(cenario.id);
    setAnoVigencia(cenario.ano);
    setTipoDocumento(cenario.tipo);
    setItens([{ ...cenario.item, numero: 1 }]);
    setNcmQueryMap({});
    setOpenNcmDropdown(null);
  };

  const handleTrocarTipoDocumento = (novoTipo: 'NFE' | 'NFSE') => {
    if (novoTipo === tipoDocumento) return;
    setTipoDocumento(novoTipo);
    setCenarioAtivo('');
    if (novoTipo === 'NFSE') {
      setItens([
        {
          numero: 1,
          descricao: 'Serviços de contabilidade, auditoria e consultoria fiscal',
          nbs: '1.1302.10.00',
          cst: '200',
          cClassTrib: '200052',
          baseCalculo: 10000,
          aplicarIS: false,
        },
      ]);
    } else {
      setItens([CENARIOS_RAPIDOS[0].item]);
    }
  };

  const handleAdicionarItem = () => {
    const nextNum = itens.length + 1;
    setCenarioAtivo('');
    setItens((prev) => [
      ...prev,
      tipoDocumento === 'NFE'
        ? {
            numero: nextNum,
            descricao: 'Peças e componentes industriais (Regra Geral)',
            ncm: '84779000',
            cst: '000',
            cClassTrib: '000001',
            baseCalculo: 2500,
            aplicarIS: false,
          }
        : {
            numero: nextNum,
            descricao: 'Serviços de desenvolvimento de software / TI',
            nbs: '1.1502.10.00',
            cst: '000',
            cClassTrib: '000001',
            baseCalculo: 5000,
            aplicarIS: false,
          },
    ]);
  };

  const handleRemoverItem = (index: number) => {
    if (itens.length <= 1) return;
    setItens((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, numero: idx + 1 }))
    );
  };

  const handleUpdateItem = (index: number, patch: Partial<RtcRegimeRegularItemInput>) => {
    setCenarioAtivo('');
    setItens((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const handleSelecionarNcmRegra = (index: number, regra: RtcNcmRegra) => {
    handleUpdateItem(index, {
      ncm: regra.ncm,
      descricao: regra.descricao,
      cst: regra.cst,
      cClassTrib: regra.cClassTrib,
      aplicarIS: regra.sujeitoIS,
      pISOverride: regra.sujeitoIS ? regra.pISReferencia : 0,
    });
    setNcmQueryMap((prev) => ({ ...prev, [index]: '' }));
    setOpenNcmDropdown(null);
  };

  const handlePresetNBS = (index: number, nbsCode: string) => {
    const found = RTC_NBS_SERVICOS.find((n) => n.nbs === nbsCode);
    if (!found) {
      handleUpdateItem(index, { nbs: nbsCode });
      return;
    }
    handleUpdateItem(index, {
      nbs: found.nbs,
      descricao: found.descricao,
      cst: found.cst,
      cClassTrib: found.cClassTrib,
      aplicarIS: false,
    });
  };

  const handleChangeClassTrib = (index: number, cClassTrib: string) => {
    const found = RTC_CLASSIFICACOES_TRIBUTARIAS.find((c) => c.cClassTrib === cClassTrib);
    handleUpdateItem(index, {
      cClassTrib,
      cst: found ? found.cst : itens[index].cst,
    });
  };

  const handleAplicarBaseNoPrimeiroItem = () => {
    handleUpdateItem(0, { baseCalculo: baseUnificadaPreview.baseCalculoIBSCBS });
    setShowBaseComposer(false);
  };

  const handleConsultarServidorExterno = async () => {
    setLoadingExternal(true);
    setExternalError(null);
    try {
      const base = externalApiUrl.replace(/\/+$/, '');
      const response = await fetch(`${base}/regime-geral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ao consultar ${base}/regime-geral`);
      }
      const data = await response.json();
      if (data?.totais && Array.isArray(data?.itens)) {
        setExternalResult(data);
      } else {
        setExternalError('O servidor local retornou um formato diferente do esperado; mantendo o cálculo integrado.');
      }
    } catch {
      setExternalError(
        `Não foi possível conectar ao servidor local (${externalApiUrl}). Confirme se o container da RFB está rodando com CORS habilitado.`
      );
    } finally {
      setLoadingExternal(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard
      .writeText(JSON.stringify({ endpoint: 'POST /api/calculadora/regime-geral', request: requestPayload, response: resultado }, null, 2))
      .then(() => {
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 1800);
      })
      .catch(() => {});
  };

  const filtrarNcms = (query: string): RtcNcmRegra[] => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    if (!q) return RTC_NCM_CATALOGO_COMPLETO.slice(0, 12);
    return RTC_NCM_CATALOGO_COMPLETO.filter(
      (n) =>
        (digits.length > 0 && n.ncm.includes(digits)) ||
        n.descricao.toLowerCase().includes(q) ||
        n.categoria.toLowerCase().includes(q)
    ).slice(0, 14);
  };

  const totalTributos = resultado.totais.vTotalTributosRTC;
  const pctCBS = totalTributos > 0 ? (resultado.totais.vCBS / totalTributos) * 100 : 0;
  const pctIBSUF = totalTributos > 0 ? (resultado.totais.vIBSUF / totalTributos) * 100 : 0;
  const pctIBSMun = totalTributos > 0 ? (resultado.totais.vIBSMun / totalTributos) * 100 : 0;
  const pctIS = totalTributos > 0 ? (resultado.totais.vIS / totalTributos) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Faixa compacta de cenários de exemplo (1 linha limpa) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[#6B7280] mr-1">Exemplos rápidos:</span>
          {CENARIOS_RAPIDOS.map((c) => {
            const active = cenarioAtivo === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleAplicarCenario(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#FDF3F3] border-[#9E141A] text-[#9E141A] font-semibold'
                    : 'bg-white border-[#E4E7EC] text-[#374151] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
                }`}
              >
                {c.titulo}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-[#6B7280]">
          {aliquotaAnoAtual.fase}
        </span>
      </div>

      {/* Layout Split-Screen: Formulário unificado à esquerda | Resumo ao vivo à direita */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* COLUNA ESQUERDA — PAINEL ÚNICO DE CONFIGURAÇÃO E ITENS */}
        <div className="xl:col-span-7 bg-white border border-[#E4E7EC] rounded-xl overflow-visible">
          {/* Seção 1: Operação */}
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold text-sm text-[#111827]">
                  1. Parâmetros da operação
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Defina o tipo de documento, o ano de vigência e o município de destino.
                </p>
              </div>

              {apiEndpointMode === 'externo' && (
                <button
                  type="button"
                  onClick={handleConsultarServidorExterno}
                  disabled={loadingExternal}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#131417] hover:bg-[#23262F] rounded-lg cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  {loadingExternal ? 'Consultando API Local...' : 'Executar na API Local'}
                </button>
              )}
            </div>

            {externalError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{externalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-[#374151] mb-1.5">Tipo de documento</label>
                <div className="grid grid-cols-2 bg-[#ECEEF2] p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleTrocarTipoDocumento('NFE')}
                    className={`py-1.5 px-2 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      tipoDocumento === 'NFE' ? 'bg-white text-[#111827] font-semibold shadow-2xs' : 'text-[#4B5563]'
                    }`}
                  >
                    Produtos (NF-e)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrocarTipoDocumento('NFSE')}
                    className={`py-1.5 px-2 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      tipoDocumento === 'NFSE' ? 'bg-white text-[#111827] font-semibold shadow-2xs' : 'text-[#4B5563]'
                    }`}
                  >
                    Serviços (NFS-e)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1.5">Ano da simulação</label>
                <select
                  value={anoVigencia}
                  onChange={(e) => setAnoVigencia(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[#111827] tabular-nums font-semibold outline-hidden focus:border-[#9E141A] focus:bg-white"
                >
                  {RTC_ALIQUOTAS_REFERENCIA_ANO.map((a) => (
                    <option key={a.ano} value={a.ano}>
                      {a.ano} — CBS {a.pCBSUniao}% + IBS {a.pIBSTotal}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-[#374151]">Município / UF de destino</label>
                  <span className="text-[11px] font-mono text-[#6B7280]">
                    IBGE {municipioSelecionado.codigoIBGE}
                  </span>
                </div>
                <select
                  value={municipioIBGE}
                  onChange={(e) => setMunicipioIBGE(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[#111827] font-medium outline-hidden focus:border-[#9E141A] focus:bg-white"
                >
                  {RTC_MUNICIPIOS_REFERENCIA.map((m) => (
                    <option key={m.codigoIBGE} value={m.codigoIBGE}>
                      {m.municipio} / {m.uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assistente Opcional de Base Unificada */}
            <div className="pt-3 border-t border-[#F1F3F6]">
              <button
                type="button"
                onClick={() => setShowBaseComposer((v) => !v)}
                className="flex items-center justify-between w-full text-left text-xs font-medium text-[#4B5563] hover:text-[#9E141A] cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-[#9E141A]" />
                  <span>Calcular base por fora (descontar ICMS, PIS, COFINS ou ISS do valor bruto)</span>
                </span>
                {showBaseComposer ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              </button>

              {showBaseComposer && (
                <div className="mt-3 p-4 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg space-y-3">
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    Na Reforma Tributária, IBS e CBS incidem <strong>por fora</strong> (LC 214/2025, Art. 12). Preencha o valor bruto e os tributos atuais para obter a base líquida (<span className="font-mono text-[11px]">vBC</span>).
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-[#6B7280] mb-1">
                        {tipoDocumento === 'NFE' ? 'Valor dos produtos' : 'Valor do serviço'}
                      </label>
                      <input
                        type="number"
                        value={baseFornecimento}
                        onChange={(e) => setBaseFornecimento(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums"
                      />
                    </div>
                    {tipoDocumento === 'NFE' && (
                      <div>
                        <label className="block text-[11px] text-[#6B7280] mb-1">(+) Frete / Outras</label>
                        <input
                          type="number"
                          value={baseFrete}
                          onChange={(e) => setBaseFrete(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] text-[#6B7280] mb-1">(−) Desconto</label>
                      <input
                        type="number"
                        value={baseDesconto}
                        onChange={(e) => setBaseDesconto(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums"
                      />
                    </div>
                    {tipoDocumento === 'NFE' ? (
                      <div>
                        <label className="block text-[11px] text-[#6B7280] mb-1">(−) ICMS</label>
                        <input
                          type="number"
                          value={baseICMS}
                          onChange={(e) => setBaseICMS(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] text-[#6B7280] mb-1">(−) ISS</label>
                        <input
                          type="number"
                          value={baseISS}
                          onChange={(e) => setBaseISS(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] text-[#6B7280] mb-1">(−) PIS</label>
                      <input
                        type="number"
                        value={basePIS}
                        onChange={(e) => setBasePIS(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B7280] mb-1">(−) COFINS</label>
                      <input
                        type="number"
                        value={baseCOFINS}
                        onChange={(e) => setBaseCOFINS(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums"
                      />
                    </div>
                    {tipoDocumento === 'NFE' && (
                      <div>
                        <label className="block text-[11px] text-[#6B7280] mb-1">(−) IPI</label>
                        <input
                          type="number"
                          value={baseIPI}
                          onChange={(e) => setBaseIPI(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E4E7EC] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[#6B7280]">Base de cálculo apurada (vBC): </span>
                      <strong className="font-display tabular-nums text-sm text-[#111827]">
                        {fmtBRL(baseUnificadaPreview.baseCalculoIBSCBS)}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleAplicarBaseNoPrimeiroItem}
                      className="px-3.5 py-1.5 bg-[#9E141A] hover:bg-[#851015] text-white font-semibold rounded-lg cursor-pointer whitespace-nowrap transition-colors"
                    >
                      Aplicar no Item 1
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção 2: Itens da Nota (dividida por linha fina, sem aninhar cards) */}
          <div className="border-t border-[#E4E7EC]">
            <div className="px-5 py-4 bg-[#F9FAFB]/70 border-b border-[#ECEEF2] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-sm text-[#111827]">
                  2. {tipoDocumento === 'NFE' ? 'Produtos da NF-e' : 'Serviços da NFS-e'} ({itens.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAdicionarItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9E141A] bg-white hover:bg-[#FDF3F3] border border-[#F3C6C8] rounded-lg cursor-pointer whitespace-nowrap transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar item</span>
              </button>
            </div>

            <div className="divide-y divide-[#ECEEF2]">
              {itens.map((item, idx) => {
                const calc = resultado.itens[idx];
                const ncmQuery = ncmQueryMap[idx] ?? '';
                const sugestoesNcm = openNcmDropdown === idx ? filtrarNcms(ncmQuery) : [];
                const showAdv = Boolean(expandedAdvanced[idx]) || item.cst === '510' || Boolean(item.aplicarIS);
                const classAtual = RTC_CLASSIFICACOES_TRIBUTARIAS.find((c) => c.cClassTrib === item.cClassTrib);

                return (
                  <div key={item.numero} className="p-5 space-y-4">
                    {/* Cabeçalho limpo do item */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs min-w-0">
                        <span className="font-display tabular-nums font-bold text-[#9E141A]">
                          Item {item.numero}
                        </span>
                        <span className="text-[#D1D5DB]" aria-hidden="true">·</span>
                        <span className="font-medium text-[#111827] truncate">{item.descricao}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAdvanced((prev) => ({ ...prev, [idx]: !prev[idx] }))
                          }
                          className="text-xs font-medium text-[#6B7280] hover:text-[#111827] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>{showAdv ? 'Ocultar ajustes' : 'CST / IS / Diferimento'}</span>
                        </button>
                        {itens.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoverItem(idx)}
                            className="text-xs text-[#6B7280] hover:text-[#9E141A] flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Linha 1: Produto/Serviço (8 cols) + Valor Base (4 cols) */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 text-xs">
                      <div className="sm:col-span-8 relative">
                        <label className="block font-medium text-[#374151] mb-1.5">
                          {tipoDocumento === 'NFE' ? 'Produto ou código NCM' : 'Serviço (NBS)'}
                        </label>

                        {tipoDocumento === 'NFE' ? (
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={openNcmDropdown === idx ? ncmQuery : item.ncm ? `${fmtNcmCode(item.ncm)}` : ''}
                              onFocus={() => {
                                setOpenNcmDropdown(idx);
                                setNcmQueryMap((prev) => ({ ...prev, [idx]: '' }));
                              }}
                              onBlur={() => setTimeout(() => setOpenNcmDropdown((cur) => (cur === idx ? null : cur)), 180)}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNcmQueryMap((prev) => ({ ...prev, [idx]: val }));
                                const clean = val.replace(/\D/g, '');
                                if (clean.length === 8) {
                                  const exact = RTC_NCM_CATALOGO_COMPLETO.find((n) => n.ncm === clean);
                                  if (exact) {
                                    handleSelecionarNcmRegra(idx, exact);
                                  } else {
                                    handleUpdateItem(idx, { ncm: clean });
                                  }
                                }
                              }}
                              placeholder="Busque por NCM ou nome (ex.: arroz, 8477)..."
                              className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg font-mono text-xs text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                            />

                            {openNcmDropdown === idx && (
                              <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#D1D5DB] rounded-lg shadow-lg max-h-64 overflow-y-auto divide-y divide-[#F1F3F6]">
                                {sugestoesNcm.length === 0 ? (
                                  <div className="p-3 text-xs text-[#6B7280]">
                                    Nenhum NCM encontrado. Digite os 8 dígitos diretamente para uso livre.
                                  </div>
                                ) : (
                                  sugestoesNcm.map((regra) => (
                                    <button
                                      key={regra.ncm}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelecionarNcmRegra(idx, regra);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-[#F9FAFB] cursor-pointer flex items-start justify-between gap-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="font-mono font-semibold text-[#111827]">
                                          {fmtNcmCode(regra.ncm)}
                                        </div>
                                        <div className="text-[11px] text-[#4B5563] truncate">
                                          {regra.descricao}
                                        </div>
                                      </div>
                                      <span className="text-[11px] tabular-nums whitespace-nowrap shrink-0 font-semibold text-[#9E141A]">
                                        {regra.sujeitoIS
                                          ? `IS ${regra.pISReferencia}%`
                                          : regra.pRedIBS > 0
                                            ? `−${regra.pRedIBS}%`
                                            : 'Integral'}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <select
                            value={item.nbs || ''}
                            onChange={(e) => handlePresetNBS(idx, e.target.value)}
                            className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                          >
                            <option value="">Selecionar serviço...</option>
                            {RTC_NBS_SERVICOS.map((n) => (
                              <option key={n.nbs} value={n.nbs}>
                                {n.nbs} — {n.categoria}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block font-medium text-[#374151] mb-1.5">
                          Valor base (R$)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.baseCalculo}
                          onChange={(e) => handleUpdateItem(idx, { baseCalculo: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg tabular-nums font-semibold text-right text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Linha 2: Classificação Tributária (largura total para leitura confortável) */}
                    <div className="text-xs space-y-1.5">
                      <label className="block font-medium text-[#374151]">
                        Classificação tributária (cClassTrib)
                      </label>
                      <select
                        value={item.cClassTrib}
                        onChange={(e) => handleChangeClassTrib(idx, e.target.value)}
                        className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                      >
                        {RTC_CLASSIFICACOES_TRIBUTARIAS.map((c) => (
                          <option key={c.cClassTrib} value={c.cClassTrib}>
                            {c.cClassTrib} · {c.pRedIBS > 0 ? `Redução ${c.pRedIBS}%` : `CST ${c.cst}`} — {c.nome}
                          </option>
                        ))}
                      </select>

                      {classAtual && (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6B7280] pt-0.5">
                          <span className="font-mono font-medium text-[#374151]">CST {item.cst}</span>
                          <span aria-hidden="true">·</span>
                          <span>{classAtual.descricao}</span>
                          <span aria-hidden="true">·</span>
                          <span>{classAtual.baseLegal}</span>
                        </div>
                      )}
                    </div>

                    {/* Ajustes Avançados Opcionais */}
                    {showAdv && (
                      <div className="pt-3 border-t border-[#F1F3F6] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                            CST CBS/IBS (ajuste manual)
                          </label>
                          <select
                            value={item.cst}
                            onChange={(e) => handleUpdateItem(idx, { cst: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg font-mono text-xs text-[#111827]"
                          >
                            {RTC_CST_CBS_IBS.map((c) => (
                              <option key={c.cst} value={c.cst}>
                                {c.cst} — {c.descricao.slice(0, 34)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {anoVigencia >= 2027 && tipoDocumento === 'NFE' && (
                          <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[#111827] font-medium cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={Boolean(item.aplicarIS)}
                                onChange={(e) =>
                                  handleUpdateItem(idx, {
                                    aplicarIS: e.target.checked,
                                    pISOverride: e.target.checked ? item.pISOverride || 2.0 : 0,
                                  })
                                }
                                className="rounded border-[#D1D5DB] accent-[#9E141A]"
                              />
                              <span>Aplicar Imposto Seletivo (IS)</span>
                            </label>
                            {item.aplicarIS && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[#6B7280]">Alíquota IS (%):</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.25"
                                  value={item.pISOverride ?? 2.0}
                                  onChange={(e) => handleUpdateItem(idx, { pISOverride: parseFloat(e.target.value) || 0 })}
                                  className="w-20 px-2 py-1 bg-white border border-[#D1D5DB] rounded tabular-nums text-xs"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {item.cst === '510' && (
                          <div>
                            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">
                              Percentual de Diferimento (%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.pDifOverride ?? 100}
                              onChange={(e) => handleUpdateItem(idx, { pDifOverride: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-lg tabular-nums text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subtotal compacto quando há múltiplos itens */}
                    {calc && itens.length > 1 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#F1F3F6] text-xs tabular-nums">
                        <span className="text-[#6B7280]">
                          CBS {fmtBRL(calc.gCBS.valorDevido)} · IBS UF {fmtBRL(calc.gIBSUF.valorDevido)} · IBS Mun{' '}
                          {fmtBRL(calc.gIBSMun.valorDevido)}
                          {calc.impostoSeletivo.aplicavel ? ` · IS ${fmtBRL(calc.impostoSeletivo.vIS)}` : ''}
                        </span>
                        <strong className="font-display text-[#9E141A]">
                          Subtotal: {fmtBRL(calc.totalTributosItem)} ({calc.cargaEfetivaPercentual.toFixed(2)}%)
                        </strong>
                      </div>
                    )}

                    {calc && calc.status === 'ERRO' && (
                      <div className="p-2.5 bg-[#FDF3F3] border border-[#F3C6C8] rounded-lg text-xs text-[#9E141A]">
                        {calc.mensagens.join(' ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA — RESUMO EXECUTIVO AO VIVO (STICKY) */}
        <div className="xl:col-span-5 xl:sticky xl:top-20">
          <div className="bg-white border border-[#E4E7EC] rounded-xl overflow-hidden">
            {/* Destaque Principal */}
            <div className="p-5 bg-[#131417] text-white space-y-3">
              <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>Resumo do cálculo · {resultado.anoVigencia}</span>
                <span>
                  {resultado.municipioDestino}/{resultado.ufDestino}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-xs text-[#D1D5DB]">Total de tributos da Reforma</div>
                  <div className="font-display tabular-nums tracking-tight text-2xl sm:text-3xl font-bold text-white mt-0.5">
                    {fmtBRL(resultado.totais.vTotalTributosRTC)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#9CA3AF]">Carga efetiva</div>
                  <div className="font-display tabular-nums tracking-tight text-lg font-bold text-emerald-400">
                    {resultado.totais.cargaMediaEfetiva.toFixed(2)}%
                  </div>
                </div>
              </div>

              {totalTributos === 0 && (
                <div className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 rounded-lg px-3 py-2">
                  Operação desonerada (alíquota zero, isenção, imunidade ou suspensão) — sem valor de CBS/IBS a recolher.
                </div>
              )}
            </div>

            {/* Memória Limpa de Valores */}
            <div className="p-5 space-y-3 text-xs">
              <div className="divide-y divide-[#F1F3F6] tabular-nums">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[#4B5563]">Base de cálculo unificada (vBC)</span>
                  <span className="font-display font-semibold text-[#111827]">
                    {fmtBRL(resultado.totais.vBCIBSCBS)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#4B5563]">CBS Federal (União)</span>
                    {totalTributos > 0 && (
                      <span className="text-[11px] text-[#9CA3AF]">{pctCBS.toFixed(0)}%</span>
                    )}
                  </div>
                  <span className="font-display font-semibold text-[#111827]">
                    {fmtBRL(resultado.totais.vCBS)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#4B5563]">IBS Estadual ({resultado.ufDestino})</span>
                    {totalTributos > 0 && pctIBSUF > 0 && (
                      <span className="text-[11px] text-[#9CA3AF]">{pctIBSUF.toFixed(0)}%</span>
                    )}
                  </div>
                  <span className="font-display font-semibold text-[#111827]">
                    {fmtBRL(resultado.totais.vIBSUF)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#4B5563]">IBS Municipal ({resultado.municipioDestino})</span>
                    {totalTributos > 0 && pctIBSMun > 0 && (
                      <span className="text-[11px] text-[#9CA3AF]">{pctIBSMun.toFixed(0)}%</span>
                    )}
                  </div>
                  <span className="font-display font-semibold text-[#111827]">
                    {fmtBRL(resultado.totais.vIBSMun)}
                  </span>
                </div>

                {resultado.totais.vIS > 0 && (
                  <div className="flex items-center justify-between py-2 text-amber-800">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Imposto Seletivo (IS)</span>
                      <span className="text-[11px] text-amber-700/80">{pctIS.toFixed(0)}%</span>
                    </div>
                    <span className="font-display font-semibold">
                      {fmtBRL(resultado.totais.vIS)}
                    </span>
                  </div>
                )}
              </div>

              {/* Notas Contextuais */}
              {resultado.anoVigencia === 2026 && totalTributos > 0 && (
                <div className="p-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg flex items-start gap-2 text-[11px] text-[#374151] leading-relaxed">
                  <Info className="w-4 h-4 text-[#9E141A] shrink-0 mt-0.5" />
                  <span>
                    <strong>Ano-teste 2026:</strong> CBS (0,9%) e IBS (0,1%) são destacados na nota mas compensados com PIS/COFINS — sem aumento real de carga.
                  </span>
                </div>
              )}

              {resultado.totais.vIS > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    O Imposto Seletivo de <strong>{fmtBRL(resultado.totais.vIS)}</strong> foi integrado automaticamente à base de IBS/CBS (LC 214/2025, Art. 12 § 1º).
                  </span>
                </div>
              )}

              {/* Ação Principal + Toggle Secundário */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => onEnviarParaXml(resultado, tipoDocumento)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9E141A] hover:bg-[#851015] text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>Gerar XML &lt;IBSCBS&gt; desta simulação</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowJsonInspector((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showJsonInspector ? 'Ocultar payload JSON da API' : 'Ver payload JSON da API REST'}</span>
                </button>
              </div>
            </div>

            {/* Inspetor JSON Colapsável */}
            {showJsonInspector && (
              <div className="border-t border-[#E4E7EC] p-4 bg-[#181A20] text-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#9CA3AF]">
                    POST /api/calculadora/regime-geral
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#252832] hover:bg-[#2F3340] rounded text-[11px] font-medium cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed text-[#D1D5DB]">
                  {JSON.stringify({ request: requestPayload, response: resultado }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
