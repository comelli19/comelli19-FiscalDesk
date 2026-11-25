// Motor Oficial Integrado da Calculadora RTC Offline (Receita Federal — Portaria COTEC nº 342/2026)
// Sincronizado com os 3 repositórios oficiais (@ReceitaFederal no GitHub):
// 1. calculadora-rtc-regime-regular v1.7.2 (CBS, IBS UF/Mun, IS, Base Unificada, XML, ADR003 HALF_EVEN)
// 2. calculadora-rtc-simples-nacional v1.0.2 (DAS vs. Regime Regular "Por Fora" — LC 214/2025 Art. 41 § 3º)
// 3. calculadora-rtc-gerador-danfse v1.0.0 (Parser XML Padrão Nacional / ABRASF + Grupo <IBSCBS>)

import {
  RTC_VERSAO_MOTOR,
  RTC_CST_CBS_IBS,
  RTC_CLASSIFICACOES_TRIBUTARIAS,
  RTC_NCM_CATALOGO_COMPLETO,
  RTC_NBS_SERVICOS,
  RTC_ALIQUOTAS_REFERENCIA_ANO,
  RTC_MUNICIPIOS_REFERENCIA,
  RTC_SIMPLES_ANEXOS,
  RTC_FUNDAMENTACOES_LEGAIS,
} from '../data/rtcTabelasOficiais';

// ============================================================================
// TIPOS — MÓDULO 1: REGIME REGULAR (calculadora-rtc-regime-regular)
// ============================================================================

export interface RtcBaseUnificadaNFeInput {
  valorFornecimento: number;
  valorFrete?: number;
  valorSeguro?: number;
  outrasDespesas?: number;
  descontoIncondicional?: number;
  impostoImportacao?: number;
  icms?: number;
  pis?: number;
  cofins?: number;
  ipi?: number;
  iss?: number;
}

export interface RtcBaseUnificadaNFSeInput {
  valorServico: number;
  descontoIncondicional?: number;
  deducoesLegais?: number;
  iss?: number;
  pis?: number;
  cofins?: number;
}

export interface RtcBaseUnificadaResult {
  tipoDocumento: 'NFE' | 'NFSE';
  valorBruto: number;
  exclusoesTransicao: number;
  baseCalculoIBSCBS: number;
  baseCalculoIS: number;
  memoriaCalculo: string;
  baseLegal: string;
}

export interface RtcRegimeRegularItemInput {
  numero: number;
  descricao?: string;
  ncm?: string;
  nbs?: string;
  cst: string;
  cClassTrib: string;
  baseCalculo: number;
  quantidade?: number;
  unidade?: string;
  pDifOverride?: number; // Diferimento opcional (0 a 100)
  pISOverride?: number;  // Alíquota IS opcional
  aplicarIS?: boolean;
}

export interface RtcRegimeRegularRequest {
  id?: string;
  versao?: string;
  dataHoraEmissao?: string;
  anoVigencia: number;
  tipoDocumento?: 'NFE' | 'NFSE';
  ufDestino: string;
  municipioIBGE: string;
  itens: RtcRegimeRegularItemInput[];
}

export interface RtcGrupoTributoCalculado {
  aliquotaReferencia: number;
  pRedAliq: number;
  aliquotaEfetiva: number;
  pDif: number;
  valorDiferido: number;
  valorDevido: number;
}

export interface RtcRegimeRegularItemOutput {
  numero: number;
  descricao: string;
  ncm?: string;
  nbs?: string;
  cst: string;
  cClassTrib: string;
  classificacaoNome: string;
  vBC: number;
  gIBSUF: RtcGrupoTributoCalculado;
  gIBSMun: RtcGrupoTributoCalculado;
  vIBSTotalItem: number;
  gCBS: RtcGrupoTributoCalculado;
  impostoSeletivo: {
    aplicavel: boolean;
    cstIS: string;
    cClassTribIS: string;
    vBCIS: number;
    pIS: number;
    vIS: number;
  };
  totalTributosItem: number;
  cargaEfetivaPercentual: number;
  status: 'OK' | 'ALERTA' | 'ERRO';
  mensagens: string[];
  baseLegal: string;
}

export interface RtcRegimeRegularResponse {
  id: string;
  versaoMotor: string;
  dataHoraProcessamento: string;
  anoVigencia: number;
  faseTransicao: string;
  tipoDocumento: 'NFE' | 'NFSE';
  ufDestino: string;
  municipioDestino: string;
  municipioIBGE: string;
  itens: RtcRegimeRegularItemOutput[];
  totais: {
    vBCIBSCBS: number;
    vIBSUF: number;
    vIBSMun: number;
    vIBS: number;
    vCBS: number;
    vIS: number;
    vTotalTributosRTC: number;
    cargaMediaEfetiva: number;
  };
}

export interface RtcXmlValidationIssue {
  severidade: 'ERRO' | 'ALERTA' | 'OK';
  regra: string;
  tag: string;
  mensagem: string;
}

export interface RtcXmlValidationResult {
  valido: boolean;
  tipoDocumento: 'NFE' | 'NFSE';
  itensAnalisados: number;
  totalErros: number;
  totalAlertas: number;
  issues: RtcXmlValidationIssue[];
  resumoExtraido: {
    cst?: string;
    cClassTrib?: string;
    vBC?: number;
    vIBSUF?: number;
    vIBSMun?: number;
    vCBS?: number;
    vIS?: number;
  };
}

// ============================================================================
// TIPOS — MÓDULO 2: SIMPLES NACIONAL (calculadora-rtc-simples-nacional)
// ============================================================================

export interface RtcSimplesNacionalRequest {
  anexo: 'I' | 'II' | 'III' | 'IV' | 'V';
  rbt12: number;
  receitaMensal: number;
  anoVigencia: number;
  cClassTrib?: string;
  valorInsumosComCredito?: number; // Compras com CBS/IBS destacável para simular opção "Por Fora"
  percentualVendasB2B?: number;    // % de clientes que aproveitam crédito de IBS/CBS (0 a 100)
}

export interface RtcSimplesNacionalResponse {
  anexo: string;
  anexoNome: string;
  faixaEnquadrada: number;
  rbt12: number;
  receitaMensal: number;
  anoVigencia: number;
  aliquotaNominal: number;
  parcelaDeduzir: number;
  aliquotaEfetivaDAS: number;
  // Cenário A: Integrado no DAS
  cenarioIntegradoDAS: {
    valorTotalDAS: number;
    parcelaIRPJ_CSLL_CPP_IPI: number;
    parcelaCBSNoDAS: number;
    parcelaIBSNoDAS: number;
    aliquotaCBSNoDAS: number;
    aliquotaIBSNoDAS: number;
    creditoTransferivelB2B: number;
    aliquotaCreditoB2B: number;
  };
  // Cenário B: Opção pelo Regime Regular ("Por Fora" — LC 214/2025 Art. 41 § 3º)
  cenarioPorFora: {
    dasSemIbsCbs: number;
    aliquotaDASReduzida: number;
    debitoCBSBruto: number;
    debitoIBSBruto: number;
    creditoSobreInsumos: number;
    ibsCbsLiquidoARecolher: number;
    desembolsoTotalEmpresa: number;
    aliquotaEfetivaTotal: number;
    creditoTransferivelB2B: number;
    aliquotaCreditoB2B: number;
  };
  comparativo: {
    diferencaDesembolsoEmpresa: number; // Por Fora - Integrado DAS
    ganhoCreditoClienteB2B: number;
    custoLiquidoParaCompradorDAS: number;
    custoLiquidoParaCompradorPorFora: number;
    recomendacaoTecnica: string;
    baseLegal: string;
  };
}

// ============================================================================
// TIPOS — MÓDULO 3: GERADOR DANFSe (calculadora-rtc-gerador-danfse)
// ============================================================================

export interface DanfseDadosExtraidos {
  padraoDetectado: 'NFSE_NACIONAL' | 'ABRASF' | 'GENERICO';
  chaveAcesso: string;
  numeroNFSe: string;
  serieDPS: string;
  numeroDPS: string;
  dataEmissao: string;
  competencia: string;
  codigoVerificacao: string;
  municipioIncidencia: string;
  ufIncidencia: string;
  prestador: {
    razaoSocial: string;
    cnpjCpf: string;
    inscricaoMunicipal: string;
    endereco: string;
    municipioUF: string;
    email: string;
    optanteSimples: string;
  };
  tomador: {
    razaoSocial: string;
    cnpjCpf: string;
    inscricaoMunicipal: string;
    endereco: string;
    municipioUF: string;
    email: string;
  };
  servico: {
    codigoTributacaoNacional: string;
    codigoNBS: string;
    discriminacao: string;
    valorServicos: number;
    descontoIncondicionado: number;
    deducoes: number;
    baseCalculoISS: number;
    aliquotaISS: number;
    valorISS: number;
    issRetido: boolean;
    valorLiquido: number;
  };
  retencoesFederais: {
    irrf: number;
    pis: number;
    cofins: number;
    csll: number;
    inss: number;
  };
  reformaTributariaRTC: {
    presenteNoXml: boolean;
    cst: string;
    cClassTrib: string;
    vBC: number;
    pIBSUF: number;
    vIBSUF: number;
    pIBSMun: number;
    vIBSMun: number;
    pCBS: number;
    vCBS: number;
    totalIBSCBS: number;
  };
  informacoesComplementares: string;
}

// ============================================================================
// ARREDONDAMENTO OFICIAL — ESPELHO DE ArredondamentoUtils (RFB / SERPRO v1.7.2)
// ADR003: ABNT NBR 5891 (HALF_EVEN), conta interna exata e arredondamento único
// ============================================================================

interface ExactDec {
  val: bigint;
  scale: number;
}

const DEC_ZERO: ExactDec = { val: 0n, scale: 0 };
const DEC_ONE: ExactDec = { val: 1n, scale: 0 };

function toExactDec(input: number | string | ExactDec): ExactDec {
  if (typeof input === 'object' && input !== null && 'val' in input) return input;
  const raw =
    typeof input === 'number'
      ? Number.isFinite(input)
        ? input.toString()
        : '0'
      : String(input).trim().replace(',', '.');
  if (!raw || raw === 'NaN' || raw === 'Infinity' || raw === '-Infinity') return DEC_ZERO;

  const neg = raw.startsWith('-');
  const unsigned = neg || raw.startsWith('+') ? raw.slice(1) : raw;
  const [mantissa, expPart] = unsigned.toLowerCase().split('e');
  const exp = expPart ? parseInt(expPart, 10) : 0;
  const [intPart, fracPart = ''] = mantissa.split('.');
  const cleanDigits = `${intPart}${fracPart}`.replace(/\D/g, '').replace(/^0+/, '') || '0';
  let scale = fracPart.length - exp;
  let val = BigInt(cleanDigits);
  if (scale < 0) {
    val *= 10n ** BigInt(-scale);
    scale = 0;
  }
  return { val: neg && val !== 0n ? -val : val, scale };
}

function decAdd(a: ExactDec, b: ExactDec): ExactDec {
  if (a.scale === b.scale) return { val: a.val + b.val, scale: a.scale };
  if (a.scale > b.scale) {
    return { val: a.val + b.val * 10n ** BigInt(a.scale - b.scale), scale: a.scale };
  }
  return { val: a.val * 10n ** BigInt(b.scale - a.scale) + b.val, scale: b.scale };
}

function decSub(a: ExactDec, b: ExactDec): ExactDec {
  return decAdd(a, { val: -b.val, scale: b.scale });
}

function decMul(a: ExactDec, b: ExactDec): ExactDec {
  return { val: a.val * b.val, scale: a.scale + b.scale };
}

function decPercentToFrac(a: ExactDec): ExactDec {
  return { val: a.val, scale: a.scale + 2 };
}

function decFracToPercent(a: ExactDec): ExactDec {
  if (a.scale >= 2) return { val: a.val, scale: a.scale - 2 };
  return { val: a.val * 10n ** BigInt(2 - a.scale), scale: 0 };
}

function decDiv(a: ExactDec, b: ExactDec, precisionScale = 16): ExactDec {
  if (b.val === 0n) return DEC_ZERO;
  const neg = (a.val < 0n) !== (b.val < 0n);
  const absA = a.val < 0n ? -a.val : a.val;
  const absB = b.val < 0n ? -b.val : b.val;
  const shift = b.scale - a.scale + precisionScale;
  let num = absA;
  let den = absB;
  if (shift >= 0) {
    num = absA * 10n ** BigInt(shift);
  } else {
    den = absB * 10n ** BigInt(-shift);
  }
  const q = num / den;
  const r = num % den;
  const twiceR = r * 2n;
  let rounded = q;
  if (twiceR > den || (twiceR === den && q % 2n === 1n)) {
    rounded = q + 1n;
  }
  return { val: neg && rounded !== 0n ? -rounded : rounded, scale: precisionScale };
}

function decRoundHalfEven(d: ExactDec, casas: number): ExactDec {
  if (d.scale <= casas) {
    return { val: d.val * 10n ** BigInt(casas - d.scale), scale: casas };
  }
  const neg = d.val < 0n;
  const absVal = neg ? -d.val : d.val;
  const divisor = 10n ** BigInt(d.scale - casas);
  const q = absVal / divisor;
  const r = absVal % divisor;
  const half = divisor / 2n;
  let rounded = q;
  if (r > half || (r === half && q % 2n === 1n)) {
    rounded = q + 1n;
  }
  return { val: neg && rounded !== 0n ? -rounded : rounded, scale: casas };
}

function decTruncate(d: ExactDec, casas: number): ExactDec {
  if (d.scale <= casas) {
    return { val: d.val * 10n ** BigInt(casas - d.scale), scale: casas };
  }
  const divisor = 10n ** BigInt(d.scale - casas);
  return { val: d.val / divisor, scale: casas };
}

function decToNumber(d: ExactDec): number {
  if (d.val === 0n) return 0;
  const neg = d.val < 0n;
  const s = (neg ? -d.val : d.val).toString();
  if (d.scale === 0) return Number(neg ? `-${s}` : s);
  const padded = s.padStart(d.scale + 1, '0');
  const intPart = padded.slice(0, -d.scale);
  const fracPart = padded.slice(-d.scale);
  return Number(`${neg ? '-' : ''}${intPart}.${fracPart}`);
}

/** Arredonda valor fiscal (2 casas, HALF_EVEN — ABNT NBR 5891) */
export function arredondarValorFiscal(value: number): number {
  return decToNumber(decRoundHalfEven(toExactDec(value), 2));
}

/** Arredonda alíquota publicada (4 casas, HALF_EVEN — ABNT NBR 5891) */
export function arredondarAliquotaPublicada(value: number): number {
  return decToNumber(decRoundHalfEven(toExactDec(value), 4));
}

/** Formata alíquota oficial (mín. 2, máx. 4 casas decimais, HALF_EVEN) */
export function formatarAliquotaRTC(value: number): string {
  const fixed = arredondarAliquotaPublicada(value).toFixed(4);
  return fixed.replace(/(\.\d{2,}?)0+$/, '$1');
}

/**
 * Rateio oficial de valor fiscal em parcelas cuja soma fecha exatamente com o total
 * (método dos maiores restos — ArredondamentoUtils.ratearValorFiscal v1.7.2).
 */
export function ratearValorFiscal(parcelasExatas: number[]): number[] {
  if (parcelasExatas.length === 0) return [];
  const exatas = parcelasExatas.map((p) => toExactDec(Math.max(0, p)));
  const somaExata = exatas.reduce((acc, d) => decAdd(acc, d), DEC_ZERO);
  const total = decRoundHalfEven(somaExata, 2);

  const truncadas = exatas.map((d) => decTruncate(d, 2));
  const restos = exatas.map((d, idx) => decSub(d, truncadas[idx]));
  const distribuido = truncadas.reduce((acc, d) => decAdd(acc, d), DEC_ZERO);
  const centavosFaltantes = Number(decSub(total, distribuido).val);

  const ordem = exatas.map((_, idx) => idx);
  ordem.sort((a, b) => {
    const diff = decSub(restos[b], restos[a]).val;
    if (diff > 0n) return 1;
    if (diff < 0n) return -1;
    return a - b;
  });

  const centavo: ExactDec = { val: 1n, scale: 2 };
  for (let k = 0; k < centavosFaltantes; k++) {
    const pos = ordem[k % ordem.length];
    truncadas[pos] = decAdd(truncadas[pos], centavo);
  }
  return truncadas.map(decToNumber);
}

function round2(value: number): number {
  return arredondarValorFiscal(value);
}

function extrairTagXml(xml: string, tagName: string): string {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extrairBlocoXml(xml: string, tagName: string): string {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

function extrairTodosBlocosXml(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tagName}>`, 'gi');
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const parsed = parseFloat(val.replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

// ============================================================================
// 1. BASE DE CÁLCULO UNIFICADA (LC 214/2025 Art. 12 · ADR003 v1.7.2)
// ============================================================================

export function calcularBaseUnificadaNFe(input: RtcBaseUnificadaNFeInput): RtcBaseUnificadaResult {
  // Conta interna exata, arredondamento único ao final (ADR003 ponto 8)
  const brutoExato = [
    toExactDec(input.valorFornecimento || 0),
    toExactDec(input.valorFrete || 0),
    toExactDec(input.valorSeguro || 0),
    toExactDec(input.outrasDespesas || 0),
    toExactDec(input.impostoImportacao || 0),
  ].reduce(decAdd, DEC_ZERO);
  const valorBrutoExato = decSub(brutoExato, toExactDec(input.descontoIncondicional || 0));

  // LC 214/2025 Art. 12 § 2º: exclui ICMS, PIS, COFINS, ISS e IPI da base de IBS/CBS
  const exclusoesExatas = [
    toExactDec(input.icms || 0),
    toExactDec(input.pis || 0),
    toExactDec(input.cofins || 0),
    toExactDec(input.iss || 0),
    toExactDec(input.ipi || 0),
  ].reduce(decAdd, DEC_ZERO);

  const baseExata = decSub(valorBrutoExato, exclusoesExatas);
  const valorBruto = decToNumber(decRoundHalfEven(valorBrutoExato, 2));
  const exclusoesTransicao = decToNumber(decRoundHalfEven(exclusoesExatas, 2));
  const baseCalculoIBSCBS = Math.max(0, decToNumber(decRoundHalfEven(baseExata, 2)));
  // Para o Imposto Seletivo (LC 214/2025 Art. 414), o IS integra a base de cálculo de IBS/CBS, mas IBS/CBS não integram a base do IS
  const baseCalculoIS = baseCalculoIBSCBS;

  return {
    tipoDocumento: 'NFE',
    valorBruto,
    exclusoesTransicao,
    baseCalculoIBSCBS,
    baseCalculoIS,
    memoriaCalculo: `R$ ${valorBruto.toFixed(2)} (valor líquido da operação) − R$ ${exclusoesTransicao.toFixed(2)} (exclusões ICMS/PIS/COFINS/IPI/ISS) = R$ ${baseCalculoIBSCBS.toFixed(2)}`,
    baseLegal: 'LC 214/2025, Art. 12, § 2º — Cálculo "por fora" com exclusão dos tributos em extinção na transição (arredondamento HALF_EVEN v1.7.2).',
  };
}

export function calcularBaseUnificadaNFSe(input: RtcBaseUnificadaNFSeInput): RtcBaseUnificadaResult {
  const valorBrutoExato = decSub(
    decSub(toExactDec(input.valorServico || 0), toExactDec(input.descontoIncondicional || 0)),
    toExactDec(input.deducoesLegais || 0)
  );
  const exclusoesExatas = [
    toExactDec(input.iss || 0),
    toExactDec(input.pis || 0),
    toExactDec(input.cofins || 0),
  ].reduce(decAdd, DEC_ZERO);

  const valorBruto = decToNumber(decRoundHalfEven(valorBrutoExato, 2));
  const exclusoesTransicao = decToNumber(decRoundHalfEven(exclusoesExatas, 2));
  const baseCalculoIBSCBS = Math.max(0, decToNumber(decRoundHalfEven(decSub(valorBrutoExato, exclusoesExatas), 2)));

  return {
    tipoDocumento: 'NFSE',
    valorBruto,
    exclusoesTransicao,
    baseCalculoIBSCBS,
    baseCalculoIS: 0,
    memoriaCalculo: `R$ ${valorBruto.toFixed(2)} (serviço líquido) − R$ ${exclusoesTransicao.toFixed(2)} (exclusões ISS/PIS/COFINS) = R$ ${baseCalculoIBSCBS.toFixed(2)}`,
    baseLegal: 'LC 214/2025, Art. 12, § 2º — Base unificada de serviços (NFS-e Padrão Nacional · HALF_EVEN v1.7.2).',
  };
}

// ============================================================================
// 2. CALCULADORA REGIME REGULAR (/api/calculadora/regime-geral)
// ============================================================================

export function calcularRegimeRegular(req: RtcRegimeRegularRequest): RtcRegimeRegularResponse {
  const ano = req.anoVigencia || 2026;
  const aliquotasAno =
    RTC_ALIQUOTAS_REFERENCIA_ANO.find((a) => a.ano === ano) || RTC_ALIQUOTAS_REFERENCIA_ANO[0];

  const municipioInfo =
    RTC_MUNICIPIOS_REFERENCIA.find((m) => m.codigoIBGE === req.municipioIBGE) ||
    RTC_MUNICIPIOS_REFERENCIA.find((m) => m.uf === req.ufDestino) ||
    RTC_MUNICIPIOS_REFERENCIA[0];

  const tipoDoc = req.tipoDocumento || 'NFE';
  const itensCalculados: RtcRegimeRegularItemOutput[] = [];

  let totalVBCDec = DEC_ZERO;
  let totalIBSUFDec = DEC_ZERO;
  let totalIBSMunDec = DEC_ZERO;
  let totalIBSDec = DEC_ZERO;
  let totalCBSDec = DEC_ZERO;
  let totalISDec = DEC_ZERO;
  let somaBasesOriginaisDec = DEC_ZERO;

  for (const item of req.itens || []) {
    const mensagens: string[] = [];
    let status: 'OK' | 'ALERTA' | 'ERRO' = 'OK';

    const cstInfo = RTC_CST_CBS_IBS.find((c) => c.cst === item.cst);
    const classInfo = RTC_CLASSIFICACOES_TRIBUTARIAS.find((c) => c.cClassTrib === item.cClassTrib);
    const ncmInfo = item.ncm ? RTC_NCM_CATALOGO_COMPLETO.find((n) => n.ncm === item.ncm?.replace(/\D/g, '')) : undefined;
    const nbsInfo = item.nbs ? RTC_NBS_SERVICOS.find((n) => n.nbs === item.nbs?.trim()) : undefined;

    if (!cstInfo) {
      status = 'ERRO';
      mensagens.push(`CST '${item.cst}' não localizado na tabela oficial da NT 2025.002.`);
    }
    if (!classInfo) {
      status = status === 'ERRO' ? 'ERRO' : 'ALERTA';
      mensagens.push(`cClassTrib '${item.cClassTrib}' não catalogado — aplicadas alíquotas padrão do CST.`);
    } else if (item.cClassTrib.slice(0, 3) !== item.cst) {
      status = 'ERRO';
      mensagens.push(`Inconsistência NT 2025.002: prefixo de cClassTrib (${item.cClassTrib.slice(0, 3)}) diverge do CST (${item.cst}).`);
    }

    // ADR003 ponto 4: a base (vBC) é arredondada a 2 casas (HALF_EVEN) antes de multiplicar
    const vBCDec = decRoundHalfEven(toExactDec(Math.max(0, Number(item.baseCalculo) || 0)), 2);
    const vBC = decToNumber(vBCDec);
    somaBasesOriginaisDec = decAdd(somaBasesOriginaisDec, vBCDec);

    // Determinar se há tributação ou desoneração integral (400 isenção, 410 imunidade/não incidência, 550 suspensão, 810 ZFM)
    const semTributacao = cstInfo ? !cstInfo.indTrib : false;

    const pRedIBS = semTributacao ? 100 : classInfo ? classInfo.pRedIBS : 0;
    const pRedCBS = semTributacao ? 100 : classInfo ? classInfo.pRedCBS : 0;
    const pDif = cstInfo?.indDif
      ? item.pDifOverride !== undefined
        ? Math.min(100, Math.max(0, item.pDifOverride))
        : classInfo?.pDifPadrao ?? 100
      : 0;

    // Imposto Seletivo (IS) — incide a partir de 2027 e o vIS publicado compõe a base de IBS/CBS (ADR003 ponto 4)
    const isAplicavel =
      aliquotasAno.pISVigente &&
      !semTributacao &&
      (item.aplicarIS === true || (item.aplicarIS !== false && Boolean(ncmInfo?.sujeitoIS)));

    const pISRaw = isAplicavel
      ? item.pISOverride !== undefined
        ? Math.max(0, item.pISOverride)
        : ncmInfo?.pISReferencia || 0
      : 0;
    const pISDec = decRoundHalfEven(toExactDec(pISRaw), 4);
    const pIS = decToNumber(pISDec);

    const vISDec =
      isAplicavel && pIS > 0
        ? decRoundHalfEven(decMul(vBCDec, decPercentToFrac(pISDec)), 2)
        : DEC_ZERO;
    const vIS = decToNumber(vISDec);

    // Base efetiva de IBS/CBS inclui o vIS publicado quando devido (LC 214/2025 Art. 12 § 1º, IV)
    const vBCIBSCBSDec = semTributacao ? DEC_ZERO : decAdd(vBCDec, vISDec);
    const vBCIBSCBS = decToNumber(vBCIBSCBSDec);

    const pDifDec = toExactDec(pDif);

    const calcGrupo = (aliqRef: number, pRed: number): RtcGrupoTributoCalculado => {
      const aliqRefDec = decRoundHalfEven(toExactDec(aliqRef), 4);
      if (semTributacao || vBCIBSCBS <= 0) {
        return {
          aliquotaReferencia: decToNumber(aliqRefDec),
          pRedAliq: pRed,
          aliquotaEfetiva: 0,
          pDif: 0,
          valorDiferido: 0,
          valorDevido: 0,
        };
      }

      // ADR003 ponto 4:
      // 1) pAliqEfet arredondada a 4 casas (HALF_EVEN) e é ela que multiplica a base
      const fatorRed = decSub(DEC_ONE, decPercentToFrac(toExactDec(pRed)));
      const aliqEfetivaDec = decRoundHalfEven(decMul(aliqRefDec, fatorRed), 4);
      // 2) valor = arred2(vBC × pAliqEfet ÷ 100)
      const valorBrutoExato = decMul(vBCIBSCBSDec, decPercentToFrac(aliqEfetivaDec));
      const valorBrutoPub = decRoundHalfEven(valorBrutoExato, 2);
      // 3) com diferimento: vDif = arred2(vBC × pAliqEfet ÷ 100 × pDif ÷ 100) e devido = valor − vDif (descontado uma única vez)
      const valorDiferidoPub =
        pDif > 0
          ? decRoundHalfEven(decMul(valorBrutoExato, decPercentToFrac(pDifDec)), 2)
          : DEC_ZERO;
      const valorDevidoPub = decSub(valorBrutoPub, valorDiferidoPub);

      return {
        aliquotaReferencia: decToNumber(aliqRefDec),
        pRedAliq: pRed,
        aliquotaEfetiva: decToNumber(aliqEfetivaDec),
        pDif,
        valorDiferido: decToNumber(valorDiferidoPub),
        valorDevido: decToNumber(valorDevidoPub),
      };
    };

    const gIBSUF = calcGrupo(aliquotasAno.pIBSUF, pRedIBS);
    const gIBSMun = calcGrupo(aliquotasAno.pIBSMun, pRedIBS);
    const gCBS = calcGrupo(aliquotasAno.pCBSUniao, pRedCBS);

    // ADR003 ponto 5: vIBS do item é a soma exata dos valores publicados vIBSUF + vIBSMun
    const vIBSUFDec = toExactDec(gIBSUF.valorDevido);
    const vIBSMunDec = toExactDec(gIBSMun.valorDevido);
    const vCBSDec = toExactDec(gCBS.valorDevido);
    const vIBSTotalItemDec = decAdd(vIBSUFDec, vIBSMunDec);
    const totalTributosItemDec = decAdd(decAdd(vIBSTotalItemDec, vCBSDec), vISDec);

    const vIBSTotalItem = decToNumber(vIBSTotalItemDec);
    const totalTributosItem = decToNumber(totalTributosItemDec);
    const cargaEfetivaPercentual =
      vBC > 0
        ? decToNumber(decRoundHalfEven(decFracToPercent(decDiv(totalTributosItemDec, vBCDec)), 2))
        : 0;

    if (ano === 2026 && !semTributacao) {
      mensagens.push('Ano-teste 2026: CBS (0,9%) e IBS (0,1%) são compensáveis com PIS/COFINS sem aumento de carga (LC 214/2025 Art. 348).');
    }
    if (isAplicavel && vIS > 0) {
      mensagens.push(`Imposto Seletivo (R$ ${vIS.toFixed(2)}) integrado à base de IBS/CBS conforme LC 214/2025 Art. 12 § 1º.`);
    }

    // ADR003 ponto 5: cada total é a soma exata dos campos publicados nos itens (elimina Rejeição 1091)
    totalVBCDec = decAdd(totalVBCDec, vBCIBSCBSDec);
    totalIBSUFDec = decAdd(totalIBSUFDec, vIBSUFDec);
    totalIBSMunDec = decAdd(totalIBSMunDec, vIBSMunDec);
    totalIBSDec = decAdd(totalIBSDec, vIBSTotalItemDec);
    totalCBSDec = decAdd(totalCBSDec, vCBSDec);
    totalISDec = decAdd(totalISDec, vISDec);

    itensCalculados.push({
      numero: item.numero,
      descricao: item.descricao || ncmInfo?.descricao || nbsInfo?.descricao || `Item ${item.numero}`,
      ncm: item.ncm,
      nbs: item.nbs,
      cst: item.cst,
      cClassTrib: item.cClassTrib,
      classificacaoNome: classInfo?.nome || cstInfo?.descricao || 'Classificação manual',
      vBC: vBCIBSCBS,
      gIBSUF,
      gIBSMun,
      vIBSTotalItem,
      gCBS,
      impostoSeletivo: {
        aplicavel: isAplicavel && vIS > 0,
        cstIS: ncmInfo?.cstIS || '000',
        cClassTribIS: ncmInfo?.cClassTribIS || '000001',
        vBCIS: isAplicavel ? vBC : 0,
        pIS,
        vIS,
      },
      totalTributosItem,
      cargaEfetivaPercentual,
      status,
      mensagens,
      baseLegal: classInfo?.baseLegal || cstInfo?.baseLegal || 'LC 214/2025',
    });
  }

  const vTotalTributosRTCDec = decAdd(decAdd(totalIBSDec, totalCBSDec), totalISDec);
  const cargaMediaEfetiva =
    somaBasesOriginaisDec.val > 0n
      ? decToNumber(decRoundHalfEven(decFracToPercent(decDiv(vTotalTributosRTCDec, somaBasesOriginaisDec)), 2))
      : 0;

  return {
    id: req.id || `RTC-${Date.now()}`,
    versaoMotor: RTC_VERSAO_MOTOR.versao,
    dataHoraProcessamento: new Date().toISOString(),
    anoVigencia: ano,
    faseTransicao: aliquotasAno.fase,
    tipoDocumento: tipoDoc,
    ufDestino: municipioInfo.uf,
    municipioDestino: municipioInfo.municipio,
    municipioIBGE: municipioInfo.codigoIBGE,
    itens: itensCalculados,
    totais: {
      vBCIBSCBS: decToNumber(totalVBCDec),
      vIBSUF: decToNumber(totalIBSUFDec),
      vIBSMun: decToNumber(totalIBSMunDec),
      vIBS: decToNumber(totalIBSDec),
      vCBS: decToNumber(totalCBSDec),
      vIS: decToNumber(totalISDec),
      vTotalTributosRTC: decToNumber(vTotalTributosRTCDec),
      cargaMediaEfetiva,
    },
  };
}

// Endpoint /observabilidade/regime-geral (lote com granularidade por item)
export function calcularRegimeRegularObservabilidade(req: RtcRegimeRegularRequest) {
  const resultado = calcularRegimeRegular(req);
  const itensComErro = resultado.itens.filter((i) => i.status === 'ERRO').length;
  const itensComAlerta = resultado.itens.filter((i) => i.status === 'ALERTA').length;

  return {
    observabilidade: {
      totalItens: resultado.itens.length,
      sucesso: resultado.itens.length - itensComErro,
      alertas: itensComAlerta,
      erros: itensComErro,
      normativa: RTC_VERSAO_MOTOR.normativa,
    },
    resultado,
  };
}

// ============================================================================
// 3. GERADOR & VALIDADOR XML (<IBSCBS> / <IS> — NT 2025.002)
// ============================================================================

export function gerarXmlGruposRTC(resultado: RtcRegimeRegularResponse, tipo: 'NFE' | 'NFSE' = 'NFE'): string {
  const linhas: string[] = [];
  linhas.push(`<!-- Gerado pela Calculadora RTC Offline (Portaria COTEC nº 342/2026 · NT 2025.002) -->`);
  linhas.push(`<!-- Vigência: ${resultado.anoVigencia} | Destino: ${resultado.municipioDestino}/${resultado.ufDestino} (IBGE ${resultado.municipioIBGE}) -->`);

  if (tipo === 'NFE') {
    linhas.push(`<detributosRTC versao="1.00">`);
    for (const item of resultado.itens) {
      linhas.push(`  <det nItem="${item.numero}">`);
      linhas.push(`    <imposto>`);

      // Grupo IS (quando aplicável)
      if (item.impostoSeletivo.aplicavel) {
        linhas.push(`      <IS>`);
        linhas.push(`        <CSTIS>${item.impostoSeletivo.cstIS}</CSTIS>`);
        linhas.push(`        <cClassTribIS>${item.impostoSeletivo.cClassTribIS}</cClassTribIS>`);
        linhas.push(`        <vBCIS>${item.impostoSeletivo.vBCIS.toFixed(2)}</vBCIS>`);
        linhas.push(`        <pIS>${item.impostoSeletivo.pIS.toFixed(4)}</pIS>`);
        linhas.push(`        <vIS>${item.impostoSeletivo.vIS.toFixed(2)}</vIS>`);
        linhas.push(`      </IS>`);
      }

      // Grupo UB — IBSCBS
      linhas.push(`      <IBSCBS>`);
      linhas.push(`        <CST>${item.cst}</CST>`);
      linhas.push(`        <cClassTrib>${item.cClassTrib}</cClassTrib>`);
      if (item.vBC > 0) {
        linhas.push(`        <gIBSCBS>`);
        linhas.push(`          <vBC>${item.vBC.toFixed(2)}</vBC>`);
        linhas.push(`          <gIBSUF>`);
        linhas.push(`            <pIBSUF>${item.gIBSUF.aliquotaReferencia.toFixed(4)}</pIBSUF>`);
        if (item.gIBSUF.pRedAliq > 0) {
          linhas.push(`            <gRed>`);
          linhas.push(`              <pRedAliq>${item.gIBSUF.pRedAliq.toFixed(2)}</pRedAliq>`);
          linhas.push(`              <pAliqEfet>${item.gIBSUF.aliquotaEfetiva.toFixed(4)}</pAliqEfet>`);
          linhas.push(`            </gRed>`);
        }
        if (item.gIBSUF.pDif > 0) {
          linhas.push(`            <gDif>`);
          linhas.push(`              <pDif>${item.gIBSUF.pDif.toFixed(2)}</pDif>`);
          linhas.push(`              <vDif>${item.gIBSUF.valorDiferido.toFixed(2)}</vDif>`);
          linhas.push(`            </gDif>`);
        }
        linhas.push(`            <vIBSUF>${item.gIBSUF.valorDevido.toFixed(2)}</vIBSUF>`);
        linhas.push(`          </gIBSUF>`);

        linhas.push(`          <gIBSMun>`);
        linhas.push(`            <pIBSMun>${item.gIBSMun.aliquotaReferencia.toFixed(4)}</pIBSMun>`);
        if (item.gIBSMun.pRedAliq > 0) {
          linhas.push(`            <gRed>`);
          linhas.push(`              <pRedAliq>${item.gIBSMun.pRedAliq.toFixed(2)}</pRedAliq>`);
          linhas.push(`              <pAliqEfet>${item.gIBSMun.aliquotaEfetiva.toFixed(4)}</pAliqEfet>`);
          linhas.push(`            </gRed>`);
        }
        if (item.gIBSMun.pDif > 0) {
          linhas.push(`            <gDif>`);
          linhas.push(`              <pDif>${item.gIBSMun.pDif.toFixed(2)}</pDif>`);
          linhas.push(`              <vDif>${item.gIBSMun.valorDiferido.toFixed(2)}</vDif>`);
          linhas.push(`            </gDif>`);
        }
        linhas.push(`            <vIBSMun>${item.gIBSMun.valorDevido.toFixed(2)}</vIBSMun>`);
        linhas.push(`          </gIBSMun>`);

        linhas.push(`          <gCBS>`);
        linhas.push(`            <pCBS>${item.gCBS.aliquotaReferencia.toFixed(4)}</pCBS>`);
        if (item.gCBS.pRedAliq > 0) {
          linhas.push(`            <gRed>`);
          linhas.push(`              <pRedAliq>${item.gCBS.pRedAliq.toFixed(2)}</pRedAliq>`);
          linhas.push(`              <pAliqEfet>${item.gCBS.aliquotaEfetiva.toFixed(4)}</pAliqEfet>`);
          linhas.push(`            </gRed>`);
        }
        if (item.gCBS.pDif > 0) {
          linhas.push(`            <gDif>`);
          linhas.push(`              <pDif>${item.gCBS.pDif.toFixed(2)}</pDif>`);
          linhas.push(`              <vDif>${item.gCBS.valorDiferido.toFixed(2)}</vDif>`);
          linhas.push(`            </gDif>`);
        }
        linhas.push(`            <vCBS>${item.gCBS.valorDevido.toFixed(2)}</vCBS>`);
        linhas.push(`          </gCBS>`);
        linhas.push(`        </gIBSCBS>`);
      }
      linhas.push(`      </IBSCBS>`);
      linhas.push(`    </imposto>`);
      linhas.push(`  </det>`);
    }

    // Totalizador Grupo W03 — IBSCBSTot
    linhas.push(`  <total>`);
    linhas.push(`    <IBSCBSTot>`);
    linhas.push(`      <vBCIBSCBS>${resultado.totais.vBCIBSCBS.toFixed(2)}</vBCIBSCBS>`);
    linhas.push(`      <gIBS>`);
    linhas.push(`        <gIBSUF>`);
    linhas.push(`          <vIBSUF>${resultado.totais.vIBSUF.toFixed(2)}</vIBSUF>`);
    linhas.push(`        </gIBSUF>`);
    linhas.push(`        <gIBSMun>`);
    linhas.push(`          <vIBSMun>${resultado.totais.vIBSMun.toFixed(2)}</vIBSMun>`);
    linhas.push(`        </gIBSMun>`);
    linhas.push(`        <vIBS>${resultado.totais.vIBS.toFixed(2)}</vIBS>`);
    linhas.push(`      </gIBS>`);
    linhas.push(`      <gCBS>`);
    linhas.push(`        <vCBS>${resultado.totais.vCBS.toFixed(2)}</vCBS>`);
    linhas.push(`      </gCBS>`);
    linhas.push(`    </IBSCBSTot>`);
    if (resultado.totais.vIS > 0) {
      linhas.push(`    <ISTot>`);
      linhas.push(`      <vIS>${resultado.totais.vIS.toFixed(2)}</vIS>`);
      linhas.push(`    </ISTot>`);
    }
    linhas.push(`  </total>`);
    linhas.push(`</detributosRTC>`);
  } else {
    // Grupo IBSCBS para NFS-e Padrão Nacional
    const first = resultado.itens[0];
    linhas.push(`<IBSCBS>`);
    linhas.push(`  <finNFSe>0</finNFSe>`);
    linhas.push(`  <indFinal>1</indFinal>`);
    linhas.push(`  <cIndOp>000101</cIndOp>`);
    linhas.push(`  <valores>`);
    linhas.push(`    <trib>`);
    linhas.push(`      <gIBSCBS>`);
    linhas.push(`        <CST>${first?.cst || '000'}</CST>`);
    linhas.push(`        <cClassTrib>${first?.cClassTrib || '000001'}</cClassTrib>`);
    linhas.push(`        <vBC>${resultado.totais.vBCIBSCBS.toFixed(2)}</vBC>`);
    linhas.push(`        <pIBSUF>${(first?.gIBSUF.aliquotaEfetiva || 0).toFixed(4)}</pIBSUF>`);
    linhas.push(`        <vIBSUF>${resultado.totais.vIBSUF.toFixed(2)}</vIBSUF>`);
    linhas.push(`        <pIBSMun>${(first?.gIBSMun.aliquotaEfetiva || 0).toFixed(4)}</pIBSMun>`);
    linhas.push(`        <vIBSMun>${resultado.totais.vIBSMun.toFixed(2)}</vIBSMun>`);
    linhas.push(`        <pCBS>${(first?.gCBS.aliquotaEfetiva || 0).toFixed(4)}</pCBS>`);
    linhas.push(`        <vCBS>${resultado.totais.vCBS.toFixed(2)}</vCBS>`);
    linhas.push(`      </gIBSCBS>`);
    linhas.push(`    </trib>`);
    linhas.push(`  </valores>`);
    linhas.push(`</IBSCBS>`);
  }

  return linhas.join('\n');
}

export function validarXmlGruposRTC(xmlString: string, tipo: 'NFE' | 'NFSE' = 'NFE'): RtcXmlValidationResult {
  const issues: RtcXmlValidationIssue[] = [];
  const trimmed = (xmlString || '').trim();

  if (!trimmed || !trimmed.includes('<')) {
    return {
      valido: false,
      tipoDocumento: tipo,
      itensAnalisados: 0,
      totalErros: 1,
      totalAlertas: 0,
      issues: [
        {
          severidade: 'ERRO',
          regra: 'XML-001',
          tag: 'raiz',
          mensagem: 'Conteúdo XML vazio ou malformado. Cole o bloco <IBSCBS> ou um XML completo de NF-e/NFS-e.',
        },
      ],
      resumoExtraido: {},
    };
  }

  const blocosIBSCBS = extrairTodosBlocosXml(trimmed, 'IBSCBS');
  if (blocosIBSCBS.length === 0) {
    return {
      valido: false,
      tipoDocumento: tipo,
      itensAnalisados: 0,
      totalErros: 1,
      totalAlertas: 0,
      issues: [
        {
          severidade: 'ERRO',
          regra: 'NT2025.002-UB01',
          tag: '<IBSCBS>',
          mensagem: 'Grupo <IBSCBS> não encontrado no XML fornecido. Verifique se o documento já segue o leiaute da NT 2025.002.',
        },
      ],
      resumoExtraido: {},
    };
  }

  let resumoExtraido: RtcXmlValidationResult['resumoExtraido'] = {};

  let somaItensUF = DEC_ZERO;
  let somaItensMun = DEC_ZERO;
  let somaItensCBS = DEC_ZERO;

  blocosIBSCBS.forEach((bloco, idx) => {
    const prefix = blocosIBSCBS.length > 1 ? `[Item ${idx + 1}] ` : '';
    const cst = extrairTagXml(bloco, 'CST');
    const cClassTrib = extrairTagXml(bloco, 'cClassTrib');
    const vBC = parseNum(extrairTagXml(bloco, 'vBC'));

    const blocoUF = extrairBlocoXml(bloco, 'gIBSUF') || bloco;
    const pIBSUF = parseNum(extrairTagXml(blocoUF, 'pIBSUF'));
    const pAliqEfetUFStr = extrairTagXml(blocoUF, 'pAliqEfet');
    const pAliqEfetUF = pAliqEfetUFStr !== '' ? parseNum(pAliqEfetUFStr) : pIBSUF;
    const vDifUF = parseNum(extrairTagXml(blocoUF, 'vDif'));
    const vIBSUF = parseNum(extrairTagXml(blocoUF, 'vIBSUF'));

    const blocoMun = extrairBlocoXml(bloco, 'gIBSMun') || bloco;
    const pIBSMun = parseNum(extrairTagXml(blocoMun, 'pIBSMun'));
    const pAliqEfetMunStr = extrairTagXml(blocoMun, 'pAliqEfet');
    const pAliqEfetMun = pAliqEfetMunStr !== '' ? parseNum(pAliqEfetMunStr) : pIBSMun;
    const vDifMun = parseNum(extrairTagXml(blocoMun, 'vDif'));
    const vIBSMun = parseNum(extrairTagXml(blocoMun, 'vIBSMun'));

    const blocoCBS = extrairBlocoXml(bloco, 'gCBS') || bloco;
    const pCBS = parseNum(extrairTagXml(blocoCBS, 'pCBS'));
    const pAliqEfetCBSStr = extrairTagXml(blocoCBS, 'pAliqEfet');
    const pAliqEfetCBS = pAliqEfetCBSStr !== '' ? parseNum(pAliqEfetCBSStr) : pCBS;
    const vDifCBS = parseNum(extrairTagXml(blocoCBS, 'vDif'));
    const vCBS = parseNum(extrairTagXml(blocoCBS, 'vCBS'));

    somaItensUF = decAdd(somaItensUF, decRoundHalfEven(toExactDec(vIBSUF), 2));
    somaItensMun = decAdd(somaItensMun, decRoundHalfEven(toExactDec(vIBSMun), 2));
    somaItensCBS = decAdd(somaItensCBS, decRoundHalfEven(toExactDec(vCBS), 2));

    if (idx === 0) {
      const vIS = parseNum(extrairTagXml(trimmed, 'vIS'));
      resumoExtraido = { cst, cClassTrib, vBC, vIBSUF, vIBSMun, vCBS, vIS };
    }

    // Regra 1: CST obrigatório (3 dígitos) e existente na tabela oficial
    if (!/^\d{3}$/.test(cst)) {
      issues.push({
        severidade: 'ERRO',
        regra: 'NT2025.002-UB13',
        tag: '<CST>',
        mensagem: `${prefix}CST '${cst || '(vazio)'}' inválido. Deve possuir exatamente 3 dígitos numéricos (ex.: 000, 200, 410).`,
      });
    } else if (!RTC_CST_CBS_IBS.some((c) => c.cst === cst)) {
      issues.push({
        severidade: 'ERRO',
        regra: 'NT2025.002-UB13b',
        tag: '<CST>',
        mensagem: `${prefix}CST '${cst}' não pertence à tabela oficial de Situações Tributárias CBS/IBS.`,
      });
    } else {
      issues.push({
        severidade: 'OK',
        regra: 'NT2025.002-UB13',
        tag: '<CST>',
        mensagem: `${prefix}CST ${cst} válido conforme tabela oficial da RFB.`,
      });
    }

    // Regra 2: cClassTrib (6 dígitos) e prefixo igual ao CST
    if (!/^\d{6}$/.test(cClassTrib)) {
      issues.push({
        severidade: 'ERRO',
        regra: 'NT2025.002-UB14',
        tag: '<cClassTrib>',
        mensagem: `${prefix}cClassTrib '${cClassTrib || '(vazio)'}' inválido. Deve conter 6 dígitos numéricos.`,
      });
    } else if (cst && cClassTrib.slice(0, 3) !== cst) {
      issues.push({
        severidade: 'ERRO',
        regra: 'NT2025.002-UB14b',
        tag: '<cClassTrib>',
        mensagem: `${prefix}Divergência: os 3 primeiros dígitos do cClassTrib (${cClassTrib.slice(0, 3)}) devem coincidir com o CST (${cst}).`,
      });
    } else {
      const foundClass = RTC_CLASSIFICACOES_TRIBUTARIAS.find((c) => c.cClassTrib === cClassTrib);
      if (foundClass) {
        issues.push({
          severidade: 'OK',
          regra: 'NT2025.002-UB14',
          tag: '<cClassTrib>',
          mensagem: `${prefix}cClassTrib ${cClassTrib} reconhecido: ${foundClass.nome}.`,
        });
      } else {
        issues.push({
          severidade: 'ALERTA',
          regra: 'NT2025.002-UB14c',
          tag: '<cClassTrib>',
          mensagem: `${prefix}cClassTrib ${cClassTrib} com formato válido, mas fora do catálogo resumido local — confirme na tabela vigente da RFB.`,
        });
      }
    }

    // Regra 3: Consistência aritmética (ADR003 HALF_EVEN — tolerância SEFAZ de R$ 0,02)
    const cstMeta = RTC_CST_CBS_IBS.find((c) => c.cst === cst);
    if (cstMeta?.indTrib && vBC > 0) {
      const vBCDec = decRoundHalfEven(toExactDec(vBC), 2);
      const calcEsperado = (aliq: number, vDif: number) => {
        const aliqDec = decRoundHalfEven(toExactDec(aliq), 4);
        const bruto = decRoundHalfEven(decMul(vBCDec, decPercentToFrac(aliqDec)), 2);
        return decToNumber(decSub(bruto, decRoundHalfEven(toExactDec(vDif), 2)));
      };

      const esperadoUF = calcEsperado(pAliqEfetUF, vDifUF);
      const esperadoMun = calcEsperado(pAliqEfetMun, vDifMun);
      const esperadoCBS = calcEsperado(pAliqEfetCBS, vDifCBS);

      if (Math.abs(esperadoUF - vIBSUF) > 0.02) {
        issues.push({
          severidade: 'ERRO',
          regra: 'NT2025.002-UB35',
          tag: '<vIBSUF>',
          mensagem: `${prefix}Cálculo de vIBSUF divergente: informado R$ ${vIBSUF.toFixed(2)}, esperado R$ ${esperadoUF.toFixed(2)} (vBC ${vBC.toFixed(2)} × ${pAliqEfetUF}% — HALF_EVEN).`,
        });
      } else {
        issues.push({
          severidade: 'OK',
          regra: 'NT2025.002-UB35',
          tag: '<vIBSUF>',
          mensagem: `${prefix}vIBSUF (R$ ${vIBSUF.toFixed(2)}) conferido aritmeticamente (HALF_EVEN v1.7.2).`,
        });
      }

      if (Math.abs(esperadoMun - vIBSMun) > 0.02) {
        issues.push({
          severidade: 'ERRO',
          regra: 'NT2025.002-UB54',
          tag: '<vIBSMun>',
          mensagem: `${prefix}Cálculo de vIBSMun divergente: informado R$ ${vIBSMun.toFixed(2)}, esperado R$ ${esperadoMun.toFixed(2)}.`,
        });
      } else {
        issues.push({
          severidade: 'OK',
          regra: 'NT2025.002-UB54',
          tag: '<vIBSMun>',
          mensagem: `${prefix}vIBSMun (R$ ${vIBSMun.toFixed(2)}) conferido aritmeticamente.`,
        });
      }

      if (Math.abs(esperadoCBS - vCBS) > 0.02) {
        issues.push({
          severidade: 'ERRO',
          regra: 'NT2025.002-UB71',
          tag: '<vCBS>',
          mensagem: `${prefix}Cálculo de vCBS divergente: informado R$ ${vCBS.toFixed(2)}, esperado R$ ${esperadoCBS.toFixed(2)} (vBC ${vBC.toFixed(2)} × ${pAliqEfetCBS}% — HALF_EVEN).`,
        });
      } else {
        issues.push({
          severidade: 'OK',
          regra: 'NT2025.002-UB71',
          tag: '<vCBS>',
          mensagem: `${prefix}vCBS (R$ ${vCBS.toFixed(2)}) conferido aritmeticamente (HALF_EVEN v1.7.2).`,
        });
      }
    } else if (cstMeta && !cstMeta.indTrib && (vIBSUF > 0 || vIBSMun > 0 || vCBS > 0)) {
      issues.push({
        severidade: 'ERRO',
        regra: 'NT2025.002-UB15',
        tag: '<gIBSCBS>',
        mensagem: `${prefix}CST ${cst} (${cstMeta.descricao}) não admite valores positivos de IBS/CBS destacados.`,
      });
    }
  });

  // Regra 4 (RFB v1.7.2 — Rejeição 1091): fechamento exato do totalizador <IBSCBSTot> contra soma dos itens
  const blocoTot = extrairBlocoXml(trimmed, 'IBSCBSTot');
  if (blocoTot) {
    const totUF = parseNum(extrairTagXml(blocoTot, 'vIBSUF'));
    const totMun = parseNum(extrairTagXml(blocoTot, 'vIBSMun'));
    const totIBS = parseNum(extrairTagXml(blocoTot, 'vIBS'));
    const totCBS = parseNum(extrairTagXml(blocoTot, 'vCBS'));

    const somaUF = decToNumber(somaItensUF);
    const somaMun = decToNumber(somaItensMun);
    const somaIBS = decToNumber(decAdd(somaItensUF, somaItensMun));
    const somaCBS = decToNumber(somaItensCBS);

    if (Math.abs(totCBS - somaCBS) > 0.001) {
      issues.push({
        severidade: 'ERRO',
        regra: 'SEFAZ-REJ-1091',
        tag: '<IBSCBSTot/gCBS/vCBS>',
        mensagem: `Rejeição 1091: Total de CBS (R$ ${totCBS.toFixed(2)}) difere da soma exata dos itens (R$ ${somaCBS.toFixed(2)}).`,
      });
    } else {
      issues.push({
        severidade: 'OK',
        regra: 'SEFAZ-REJ-1091',
        tag: '<IBSCBSTot/gCBS/vCBS>',
        mensagem: `Totalizador vCBS (R$ ${totCBS.toFixed(2)}) fecha exatamente com a soma dos itens.`,
      });
    }

    if (Math.abs(totIBS - somaIBS) > 0.001 || Math.abs(totUF - somaUF) > 0.001 || Math.abs(totMun - somaMun) > 0.001) {
      issues.push({
        severidade: 'ERRO',
        regra: 'SEFAZ-W03-IBS',
        tag: '<IBSCBSTot/gIBS/vIBS>',
        mensagem: `Totalizador IBS (UF R$ ${totUF.toFixed(2)} + Mun R$ ${totMun.toFixed(2)} = R$ ${totIBS.toFixed(2)}) difere da soma dos itens (R$ ${somaIBS.toFixed(2)}).`,
      });
    } else {
      issues.push({
        severidade: 'OK',
        regra: 'SEFAZ-W03-IBS',
        tag: '<IBSCBSTot/gIBS/vIBS>',
        mensagem: `Totalizador vIBS (R$ ${totIBS.toFixed(2)}) fecha exatamente com vIBSUF + vIBSMun dos itens.`,
      });
    }
  }

  const totalErros = issues.filter((i) => i.severidade === 'ERRO').length;
  const totalAlertas = issues.filter((i) => i.severidade === 'ALERTA').length;

  return {
    valido: totalErros === 0,
    tipoDocumento: tipo,
    itensAnalisados: blocosIBSCBS.length,
    totalErros,
    totalAlertas,
    issues,
    resumoExtraido,
  };
}

// ============================================================================
// 4. SIMPLES NACIONAL RTC (/api/calculadora/simples-nacional)
// ============================================================================

export function calcularSimplesNacionalRTC(req: RtcSimplesNacionalRequest): RtcSimplesNacionalResponse {
  const anexoObj =
    RTC_SIMPLES_ANEXOS.find((a) => a.codigo === req.anexo) || RTC_SIMPLES_ANEXOS[0];

  const rbt12 = Math.max(1, Number(req.rbt12) || 360000);
  const receitaMensal = Math.max(0, Number(req.receitaMensal) || 30000);
  const ano = req.anoVigencia || 2027;
  const valorInsumos = Math.max(0, Number(req.valorInsumosComCredito) || 0);
  const percB2B = Math.min(100, Math.max(0, req.percentualVendasB2B ?? 100));

  const faixa =
    anexoObj.faixas.find((f) => rbt12 >= f.rbt12Min && rbt12 <= f.rbt12Max) ||
    anexoObj.faixas[anexoObj.faixas.length - 1];

  // Fórmula oficial LC 123/2006 Art. 18 (ArredondamentoUtils v1.0.2 — HALF_EVEN)
  const rbt12Dec = decRoundHalfEven(toExactDec(rbt12), 2);
  const receitaDec = decRoundHalfEven(toExactDec(receitaMensal), 2);
  const insumosDec = decRoundHalfEven(toExactDec(valorInsumos), 2);
  const percB2BFrac = decPercentToFrac(toExactDec(percB2B));

  const aliqEfetivaRaw = decDiv(
    decSub(decMul(rbt12Dec, decPercentToFrac(toExactDec(faixa.aliqNominal))), toExactDec(faixa.parcelaDeduzir)),
    rbt12Dec
  );
  const aliqEfetivaDASDec =
    aliqEfetivaRaw.val > 0n ? decRoundHalfEven(decFracToPercent(aliqEfetivaRaw), 4) : DEC_ZERO;
  const aliqEfetivaDAS = decToNumber(aliqEfetivaDASDec);

  // Partilha dos tributos dentro do DAS
  const pctCBSNoDASDec = decAdd(toExactDec(faixa.partilha.pis), toExactDec(faixa.partilha.cofins));
  const pctIBSNoDASDec = toExactDec(
    anexoObj.tributoConsumoSub === 'ICMS' ? faixa.partilha.icms : faixa.partilha.iss
  );
  const pctDemaisNoDASDec = decSub(decSub(toExactDec(100), pctCBSNoDASDec), pctIBSNoDASDec);

  const aliquotaCBSNoDASDec = decRoundHalfEven(decMul(aliqEfetivaDASDec, decPercentToFrac(pctCBSNoDASDec)), 4);
  const aliquotaIBSNoDASDec = decRoundHalfEven(decMul(aliqEfetivaDASDec, decPercentToFrac(pctIBSNoDASDec)), 4);
  const aliquotaDASReduzidaDec = decRoundHalfEven(decMul(aliqEfetivaDASDec, decPercentToFrac(pctDemaisNoDASDec)), 4);

  const aliquotaCBSNoDAS = decToNumber(aliquotaCBSNoDASDec);
  const aliquotaIBSNoDAS = decToNumber(aliquotaIBSNoDASDec);
  const aliquotaDASReduzida = decToNumber(aliquotaDASReduzidaDec);

  const valorTotalDASDec = decRoundHalfEven(decMul(receitaDec, decPercentToFrac(aliqEfetivaDASDec)), 2);
  const parcelaCBSNoDASDec = decRoundHalfEven(decMul(receitaDec, decPercentToFrac(aliquotaCBSNoDASDec)), 2);
  const parcelaIBSNoDASDec = decRoundHalfEven(decMul(receitaDec, decPercentToFrac(aliquotaIBSNoDASDec)), 2);
  const parcelaDemaisDec = decSub(decSub(valorTotalDASDec, parcelaCBSNoDASDec), parcelaIBSNoDASDec);

  const valorTotalDAS = decToNumber(valorTotalDASDec);
  const parcelaCBSNoDAS = decToNumber(parcelaCBSNoDASDec);
  const parcelaIBSNoDAS = decToNumber(parcelaIBSNoDASDec);
  const parcelaDemais = decToNumber(parcelaDemaisDec);

  // Crédito transferível ao comprador B2B no DAS: soma exata das parcelas publicadas de CBS + IBS (LC 214/2025 Art. 52)
  const creditoTransferivelDASDec = decRoundHalfEven(
    decMul(decAdd(parcelaCBSNoDASDec, parcelaIBSNoDASDec), percB2BFrac),
    2
  );
  const creditoTransferivelDAS = decToNumber(creditoTransferivelDASDec);
  const aliqCreditoDAS = decToNumber(decAdd(aliquotaCBSNoDASDec, aliquotaIBSNoDASDec));

  // Cenário B: Opção pelo Regime Regular ("Por Fora" — LC 214/2025 Art. 41 § 3º)
  const aliqAno =
    RTC_ALIQUOTAS_REFERENCIA_ANO.find((a) => a.ano === ano) || RTC_ALIQUOTAS_REFERENCIA_ANO[1];
  const classInfo = RTC_CLASSIFICACOES_TRIBUTARIAS.find((c) => c.cClassTrib === (req.cClassTrib || '000001'));

  const pRedCBS = classInfo ? classInfo.pRedCBS : 0;
  const pRedIBS = classInfo ? classInfo.pRedIBS : 0;

  const pCBSEfetivaForaDec = decRoundHalfEven(
    decMul(toExactDec(aliqAno.pCBSUniao), decSub(DEC_ONE, decPercentToFrac(toExactDec(pRedCBS)))),
    4
  );
  const pIBSEfetivaForaDec = decRoundHalfEven(
    decMul(toExactDec(aliqAno.pIBSTotal), decSub(DEC_ONE, decPercentToFrac(toExactDec(pRedIBS)))),
    4
  );
  const pTotalFora = decToNumber(decAdd(pCBSEfetivaForaDec, pIBSEfetivaForaDec));

  const debitoCBSBrutoDec = decRoundHalfEven(decMul(receitaDec, decPercentToFrac(pCBSEfetivaForaDec)), 2);
  const debitoIBSBrutoDec = decRoundHalfEven(decMul(receitaDec, decPercentToFrac(pIBSEfetivaForaDec)), 2);
  const debitoCBSBruto = decToNumber(debitoCBSBrutoDec);
  const debitoIBSBruto = decToNumber(debitoIBSBrutoDec);

  // Créditos sobre insumos adquiridos com CBS/IBS no regime regular (não-cumulatividade plena)
  const aliquotaInsumoRefDec = decAdd(toExactDec(aliqAno.pCBSUniao), toExactDec(aliqAno.pIBSTotal));
  const creditoSobreInsumosDec = decRoundHalfEven(decMul(insumosDec, decPercentToFrac(aliquotaInsumoRefDec)), 2);
  const creditoSobreInsumos = decToNumber(creditoSobreInsumosDec);

  const ibsCbsLiquidoRaw = decSub(decAdd(debitoCBSBrutoDec, debitoIBSBrutoDec), creditoSobreInsumosDec);
  const ibsCbsLiquidoDec = ibsCbsLiquidoRaw.val > 0n ? ibsCbsLiquidoRaw : DEC_ZERO;
  const ibsCbsLiquidoARecolher = decToNumber(ibsCbsLiquidoDec);

  const dasSemIbsCbsDec = decRoundHalfEven(decMul(receitaDec, decPercentToFrac(aliquotaDASReduzidaDec)), 2);
  const dasSemIbsCbs = decToNumber(dasSemIbsCbsDec);
  const desembolsoTotalPorForaDec = decAdd(dasSemIbsCbsDec, ibsCbsLiquidoDec);
  const desembolsoTotalPorFora = decToNumber(desembolsoTotalPorForaDec);

  const aliqEfetivaTotalPorFora =
    receitaMensal > 0
      ? decToNumber(decRoundHalfEven(decFracToPercent(decDiv(desembolsoTotalPorForaDec, receitaDec)), 2))
      : 0;

  // Crédito integral transferido ao comprador B2B no regime "Por Fora"
  const creditoTransferivelPorForaDec = decRoundHalfEven(
    decMul(decAdd(debitoCBSBrutoDec, debitoIBSBrutoDec), percB2BFrac),
    2
  );
  const creditoTransferivelPorFora = decToNumber(creditoTransferivelPorForaDec);

  const diferencaDesembolso = decToNumber(decSub(desembolsoTotalPorForaDec, valorTotalDASDec));
  const ganhoCreditoClienteB2B = decToNumber(decSub(creditoTransferivelPorForaDec, creditoTransferivelDASDec));
  const custoLiquidoCompradorDAS = decToNumber(decSub(receitaDec, creditoTransferivelDASDec));
  const custoLiquidoCompradorPorFora = decToNumber(decSub(receitaDec, creditoTransferivelPorForaDec));

  let recomendacaoTecnica = '';
  if (diferencaDesembolso <= 0) {
    recomendacaoTecnica = `A opção pelo Regime Regular ("Por Fora") reduz o desembolso próprio em R$ ${Math.abs(diferencaDesembolso).toFixed(2)}/mês devido ao aproveitamento de créditos sobre insumos e ainda entrega R$ ${ganhoCreditoClienteB2B.toFixed(2)} a mais em créditos para clientes B2B.`;
  } else if (percB2B >= 60 && ganhoCreditoClienteB2B > diferencaDesembolso) {
    recomendacaoTecnica = `Para vendas majoritariamente B2B (${percB2B}%), o Regime Regular ("Por Fora") gera R$ ${ganhoCreditoClienteB2B.toFixed(2)} adicionais de crédito ao cliente — superando a diferença de caixa próprio (R$ ${diferencaDesembolso.toFixed(2)}) e aumentando a competitividade comercial.`;
  } else {
    recomendacaoTecnica = `O recolhimento Integrado no DAS mantém menor desembolso mensal para a empresa (economia direta de R$ ${diferencaDesembolso.toFixed(2)}/mês), sendo especialmente vantajoso em operações B2C ou com baixa tomada de créditos sobre insumos.`;
  }

  return {
    anexo: anexoObj.codigo,
    anexoNome: anexoObj.nome,
    faixaEnquadrada: faixa.faixa,
    rbt12,
    receitaMensal,
    anoVigencia: ano,
    aliquotaNominal: faixa.aliqNominal,
    parcelaDeduzir: faixa.parcelaDeduzir,
    aliquotaEfetivaDAS: aliqEfetivaDAS,
    cenarioIntegradoDAS: {
      valorTotalDAS,
      parcelaIRPJ_CSLL_CPP_IPI: parcelaDemais,
      parcelaCBSNoDAS,
      parcelaIBSNoDAS,
      aliquotaCBSNoDAS,
      aliquotaIBSNoDAS,
      creditoTransferivelB2B: creditoTransferivelDAS,
      aliquotaCreditoB2B: aliqCreditoDAS,
    },
    cenarioPorFora: {
      dasSemIbsCbs,
      aliquotaDASReduzida,
      debitoCBSBruto,
      debitoIBSBruto,
      creditoSobreInsumos,
      ibsCbsLiquidoARecolher,
      desembolsoTotalEmpresa: desembolsoTotalPorFora,
      aliquotaEfetivaTotal: aliqEfetivaTotalPorFora,
      creditoTransferivelB2B: creditoTransferivelPorFora,
      aliquotaCreditoB2B: pTotalFora,
    },
    comparativo: {
      diferencaDesembolsoEmpresa: diferencaDesembolso,
      ganhoCreditoClienteB2B,
      custoLiquidoParaCompradorDAS: custoLiquidoCompradorDAS,
      custoLiquidoParaCompradorPorFora: custoLiquidoCompradorPorFora,
      recomendacaoTecnica,
      baseLegal: 'LC 123/2006 Art. 18 e LC 214/2025 Art. 41 § 3º e Art. 52 (Simples Nacional Híbrido).',
    },
  };
}

// ============================================================================
// 5. GERADOR DANFSe — PARSER XML (calculadora-rtc-gerador-danfse)
// ============================================================================

export function parseNFSeXmlParaDANFSe(xmlString: string): DanfseDadosExtraidos {
  const xml = (xmlString || '').trim();
  const isNacional = /<infNFSe|<DPS|<infDPS|<emit>/i.test(xml);
  const isAbrasf = /<CompNfse|<InfNfse|<PrestadorServico/i.test(xml);

  const padraoDetectado: DanfseDadosExtraidos['padraoDetectado'] = isNacional
    ? 'NFSE_NACIONAL'
    : isAbrasf
      ? 'ABRASF'
      : 'GENERICO';

  // Chave de acesso / Id da NFSe
  const idMatch = xml.match(/<infNFSe[^>]*\bId=["']([^"']+)["']/i);
  const chaveAcesso = idMatch
    ? idMatch[1].replace(/^NFS/i, '')
    : extrairTagXml(xml, 'chNFSe') || extrairTagXml(xml, 'CodigoVerificacao') || '43076092226111234567800019000000000010261112345678';

  const numeroNFSe = extrairTagXml(xml, 'nNFSe') || extrairTagXml(xml, 'Numero') || '00000001';
  const serieDPS = extrairTagXml(xml, 'serie') || extrairTagXml(xml, 'Serie') || '001';
  const numeroDPS = extrairTagXml(xml, 'nDPS') || extrairTagXml(xml, 'NumeroRps') || '1';
  const dataEmissao = extrairTagXml(xml, 'dhProc') || extrairTagXml(xml, 'dhEmi') || extrairTagXml(xml, 'DataEmissao') || new Date().toISOString();
  const competencia = extrairTagXml(xml, 'dCompet') || extrairTagXml(xml, 'Competencia') || dataEmissao.slice(0, 10);
  const codigoVerificacao = extrairTagXml(xml, 'CodigoVerificacao') || chaveAcesso.slice(-12).toUpperCase();

  const municipioIncidencia = extrairTagXml(xml, 'xLocIncid') || extrairTagXml(xml, 'xLocPrestacao') || 'Estância Velha';
  const ufIncidencia = extrairTagXml(xml, 'UF') || 'RS';

  // Blocos Prestador e Tomador
  const blocoPrestador =
    extrairBlocoXml(xml, 'emit') ||
    extrairBlocoXml(xml, 'prest') ||
    extrairBlocoXml(xml, 'PrestadorServico') ||
    '';

  const blocoTomador =
    extrairBlocoXml(xml, 'toma') ||
    extrairBlocoXml(xml, 'TomadorServico') ||
    extrairBlocoXml(xml, 'Tomador') ||
    '';

  const montarEndereco = (bloco: string) => {
    const lgr = extrairTagXml(bloco, 'xLgr') || extrairTagXml(bloco, 'Endereco');
    const nro = extrairTagXml(bloco, 'nro') || extrairTagXml(bloco, 'Numero');
    const bairro = extrairTagXml(bloco, 'xBairro') || extrairTagXml(bloco, 'Bairro');
    const cep = extrairTagXml(bloco, 'CEP') || extrairTagXml(bloco, 'Cep');
    const parts = [lgr, nro ? `nº ${nro}` : '', bairro, cep ? `CEP ${cep}` : ''].filter(Boolean);
    return parts.join(', ') || 'Endereço não informado no XML';
  };

  const prestMun = extrairTagXml(blocoPrestador, 'xMun') || municipioIncidencia;
  const prestUF = extrairTagXml(blocoPrestador, 'UF') || ufIncidencia;
  const tomaMun = extrairTagXml(blocoTomador, 'xMun') || municipioIncidencia;
  const tomaUF = extrairTagXml(blocoTomador, 'UF') || ufIncidencia;

  const opSimpNac = extrairTagXml(xml, 'opSimpNac');
  const optanteSimples =
    opSimpNac === '3'
      ? 'Optante — ME/EPP (Simples Nacional)'
      : opSimpNac === '2'
        ? 'Optante — MEI'
        : 'Não Optante (Regime Regular)';

  // Valores e Serviço
  const blocoServ = extrairBlocoXml(xml, 'serv') || extrairBlocoXml(xml, 'Servico') || xml;
  const blocoValores = extrairBlocoXml(xml, 'valores') || extrairBlocoXml(xml, 'Valores') || xml;

  const valorServicos = parseNum(extrairTagXml(blocoValores, 'vServ') || extrairTagXml(blocoValores, 'ValorServicos'));
  const descontoIncondicionado = parseNum(
    extrairTagXml(blocoValores, 'vDescIncond') || extrairTagXml(blocoValores, 'DescontoIncondicionado')
  );
  const deducoes = parseNum(
    extrairTagXml(blocoValores, 'vDR') || extrairTagXml(blocoValores, 'ValorDeducoes')
  );
  const baseCalculoISS =
    parseNum(extrairTagXml(xml, 'vBC') && !extrairBlocoXml(xml, 'gIBSCBS') ? extrairTagXml(xml, 'vBC') : '') ||
    parseNum(extrairTagXml(blocoValores, 'BaseCalculo')) ||
    Math.max(0, round2(valorServicos - descontoIncondicionado - deducoes));

  const aliquotaISS = parseNum(
    extrairTagXml(xml, 'pAliqAplic') || extrairTagXml(blocoValores, 'Aliquota') || extrairTagXml(xml, 'pAliq')
  );
  const valorISS =
    parseNum(extrairTagXml(xml, 'vISSQN') || extrairTagXml(blocoValores, 'ValorIss')) ||
    round2((baseCalculoISS * aliquotaISS) / 100);

  const tpRetISS = extrairTagXml(xml, 'tpRetISSQN') || extrairTagXml(xml, 'IssRetido');
  const issRetido = tpRetISS === '2' || tpRetISS === '1' && isAbrasf;

  // Retenções federais
  const irrf = parseNum(extrairTagXml(xml, 'vRetIRRF') || extrairTagXml(xml, 'ValorIr'));
  const pis = parseNum(extrairTagXml(xml, 'vPis') || extrairTagXml(xml, 'ValorPis'));
  const cofins = parseNum(extrairTagXml(xml, 'vCofins') || extrairTagXml(xml, 'ValorCofins'));
  const csll = parseNum(extrairTagXml(xml, 'vRetCSLL') || extrairTagXml(xml, 'ValorCsll'));
  const inss = parseNum(extrairTagXml(xml, 'vRetCP') || extrairTagXml(xml, 'ValorInss'));

  const valorLiquidoXml = parseNum(extrairTagXml(xml, 'vLiq') || extrairTagXml(xml, 'ValorLiquidoNfse'));
  const valorLiquido =
    valorLiquidoXml > 0
      ? valorLiquidoXml
      : round2(valorServicos - descontoIncondicionado - (issRetido ? valorISS : 0) - irrf - pis - cofins - csll - inss);

  // Grupo Reforma Tributária (<IBSCBS>) na NFS-e
  const blocoIBSCBS = extrairBlocoXml(xml, 'IBSCBS') || extrairBlocoXml(xml, 'gIBSCBS');
  const presenteNoXml = Boolean(blocoIBSCBS);
  const rtcCst = extrairTagXml(blocoIBSCBS, 'CST') || '000';
  const rtcClass = extrairTagXml(blocoIBSCBS, 'cClassTrib') || '000001';
  const rtcVBC = parseNum(extrairTagXml(blocoIBSCBS, 'vBC'));
  const rtcPIBSUF = parseNum(extrairTagXml(blocoIBSCBS, 'pIBSUF'));
  const rtcVIBSUF = parseNum(extrairTagXml(blocoIBSCBS, 'vIBSUF'));
  const rtcPIBSMun = parseNum(extrairTagXml(blocoIBSCBS, 'pIBSMun'));
  const rtcVIBSMun = parseNum(extrairTagXml(blocoIBSCBS, 'vIBSMun'));
  const rtcPCBS = parseNum(extrairTagXml(blocoIBSCBS, 'pCBS'));
  const rtcVCBS = parseNum(extrairTagXml(blocoIBSCBS, 'vCBS'));

  return {
    padraoDetectado,
    chaveAcesso,
    numeroNFSe,
    serieDPS,
    numeroDPS,
    dataEmissao,
    competencia,
    codigoVerificacao,
    municipioIncidencia,
    ufIncidencia,
    prestador: {
      razaoSocial: extrairTagXml(blocoPrestador, 'xNome') || extrairTagXml(blocoPrestador, 'RazaoSocial') || 'Prestador não informado',
      cnpjCpf: extrairTagXml(blocoPrestador, 'CNPJ') || extrairTagXml(blocoPrestador, 'CPF') || extrairTagXml(blocoPrestador, 'Cnpj') || '00.000.000/0000-00',
      inscricaoMunicipal: extrairTagXml(blocoPrestador, 'IM') || extrairTagXml(blocoPrestador, 'InscricaoMunicipal') || '—',
      endereco: montarEndereco(blocoPrestador),
      municipioUF: `${prestMun} / ${prestUF}`,
      email: extrairTagXml(blocoPrestador, 'email') || extrairTagXml(blocoPrestador, 'Email') || '—',
      optanteSimples,
    },
    tomador: {
      razaoSocial: extrairTagXml(blocoTomador, 'xNome') || extrairTagXml(blocoTomador, 'RazaoSocial') || 'Tomador não informado',
      cnpjCpf: extrairTagXml(blocoTomador, 'CNPJ') || extrairTagXml(blocoTomador, 'CPF') || extrairTagXml(blocoTomador, 'Cnpj') || '00.000.000/0000-00',
      inscricaoMunicipal: extrairTagXml(blocoTomador, 'IM') || extrairTagXml(blocoTomador, 'InscricaoMunicipal') || '—',
      endereco: montarEndereco(blocoTomador),
      municipioUF: `${tomaMun} / ${tomaUF}`,
      email: extrairTagXml(blocoTomador, 'email') || extrairTagXml(blocoTomador, 'Email') || '—',
    },
    servico: {
      codigoTributacaoNacional: extrairTagXml(blocoServ, 'cTribNac') || extrairTagXml(blocoServ, 'ItemListaServico') || '01.07.01',
      codigoNBS: extrairTagXml(blocoServ, 'cNBS') || '1.1502.10.00',
      discriminacao:
        extrairTagXml(blocoServ, 'xDescServ') ||
        extrairTagXml(blocoServ, 'Discriminacao') ||
        'Descrição do serviço não informada no XML.',
      valorServicos,
      descontoIncondicionado,
      deducoes,
      baseCalculoISS,
      aliquotaISS,
      valorISS,
      issRetido,
      valorLiquido,
    },
    retencoesFederais: { irrf, pis, cofins, csll, inss },
    reformaTributariaRTC: {
      presenteNoXml,
      cst: rtcCst,
      cClassTrib: rtcClass,
      vBC: rtcVBC,
      pIBSUF: rtcPIBSUF,
      vIBSUF: rtcVIBSUF,
      pIBSMun: rtcPIBSMun,
      vIBSMun: rtcVIBSMun,
      pCBS: rtcPCBS,
      vCBS: rtcVCBS,
      totalIBSCBS: round2(rtcVIBSUF + rtcVIBSMun + rtcVCBS),
    },
    informacoesComplementares:
      extrairTagXml(xml, 'xInfComp') ||
      extrairTagXml(xml, 'OutrasInformacoes') ||
      'Documento emitido no Padrão Nacional NFS-e com adequação à Reforma Tributária (LC 214/2025 / NT 2025.002).',
  };
}

export function gerarXmlExemploNFSeNacional(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">
  <infNFSe Id="NFS4307609221234567800019000000000001482611987654321">
    <xLocEmi>Estância Velha</xLocEmi>
    <xLocPrestacao>Estância Velha</xLocPrestacao>
    <nNFSe>00000148</nNFSe>
    <xLocIncid>Estância Velha</xLocIncid>
    <dhProc>2026-11-18T14:32:10-03:00</dhProc>
    <emit>
      <CNPJ>12345678000190</CNPJ>
      <IM>45890-2</IM>
      <xNome>COMELLI ENGENHARIA E CONSULTORIA TRIBUTARIA LTDA</xNome>
      <enderNac>
        <xLgr>Av. Presidente Lucena</xLgr>
        <nro>1450</nro>
        <xBairro>Centro</xBairro>
        <xMun>Estância Velha</xMun>
        <UF>RS</UF>
        <CEP>93600000</CEP>
      </enderNac>
      <email>fiscal@comelliconsultoria.com.br</email>
    </emit>
    <valores>
      <vBC>12500.00</vBC>
      <pAliqAplic>3.00</pAliqAplic>
      <vISSQN>375.00</vISSQN>
      <vLiq>12125.00</vLiq>
    </valores>
    <DPS versao="1.00">
      <infDPS>
        <serie>001</serie>
        <nDPS>148</nDPS>
        <dCompet>2026-11-18</dCompet>
        <prest>
          <regTrib>
            <opSimpNac>1</opSimpNac>
          </regTrib>
        </prest>
        <toma>
          <CNPJ>98765432000155</CNPJ>
          <IM>110234-9</IM>
          <xNome>INDUSTRIA METALURGICA SUL BRASIL S.A.</xNome>
          <end>
            <xLgr>Rodovia BR-116</xLgr>
            <nro>4820</nro>
            <xBairro>Distrito Industrial</xBairro>
            <xMun>Novo Hamburgo</xMun>
            <UF>RS</UF>
            <CEP>93310000</CEP>
          </end>
          <email>contabilidade@sulbrasil.ind.br</email>
        </toma>
        <serv>
          <cServ>
            <cTribNac>17.01.01</cTribNac>
            <cNBS>1.1302.10.00</cNBS>
            <xDescServ>Consultoria técnica especializada em parametrização fiscal ERP, adequação à Nota Técnica 2025.002 (CBS/IBS) e revisão de matriz tributária estadual e federal — Competência 11/2026.</xDescServ>
          </cServ>
          <infoCompl>
            <xInfComp>Serviço enquadrado na redução de 30% de alíquota de IBS e CBS (LC 214/2025, Art. 127 — Profissões Regulamentadas, cClassTrib 200052). Alíquotas-teste 2026 compensáveis com PIS/COFINS conforme Art. 348 da LC 214/2025.</xInfComp>
          </infoCompl>
        </serv>
        <valores>
          <vServPrest>
            <vServ>12500.00</vServ>
          </vServPrest>
          <vDescCondIncond>
            <vDescIncond>0.00</vDescIncond>
          </vDescCondIncond>
          <trib>
            <tribMun>
              <tpRetISSQN>1</tpRetISSQN>
            </tribMun>
            <tribFed>
              <vRetIRRF>187.50</vRetIRRF>
              <vRetCSLL>125.00</vRetCSLL>
              <vPis>62.50</vPis>
              <vCofins>0.00</vCofins>
            </tribFed>
          </trib>
        </valores>
        <IBSCBS>
          <finNFSe>0</finNFSe>
          <indFinal>0</indFinal>
          <valores>
            <trib>
              <gIBSCBS>
                <CST>200</CST>
                <cClassTrib>200052</cClassTrib>
                <vBC>12125.00</vBC>
                <pIBSUF>0.0700</pIBSUF>
                <vIBSUF>8.49</vIBSUF>
                <pIBSMun>0.0000</pIBSMun>
                <vIBSMun>0.00</vIBSMun>
                <pCBS>0.6300</pCBS>
                <vCBS>76.39</vCBS>
              </gIBSCBS>
            </trib>
          </valores>
        </IBSCBS>
      </infDPS>
    </DPS>
  </infNFSe>
</NFSe>`;
}

// ============================================================================
// 6. DADOS ABERTOS (/api/calculadora/dados-abertos/*)
// ============================================================================

export function consultarDadosAbertosRTC(
  tabela: string,
  filtro?: { q?: string; cst?: string; ano?: number; uf?: string }
) {
  const q = (filtro?.q || '').trim().toLowerCase();

  switch (tabela) {
    case 'situacoes-tributarias/cbs-ibs':
    case 'cst':
      return {
        tabela: 'situacoes-tributarias/cbs-ibs',
        versao: RTC_VERSAO_MOTOR.versao,
        data: RTC_CST_CBS_IBS.filter(
          (i) => !q || i.cst.includes(q) || i.descricao.toLowerCase().includes(q) || i.baseLegal.toLowerCase().includes(q)
        ),
      };

    case 'classificacoes-tributarias':
    case 'cclasstrib':
      return {
        tabela: 'classificacoes-tributarias',
        versao: RTC_VERSAO_MOTOR.versao,
        data: RTC_CLASSIFICACOES_TRIBUTARIAS.filter((i) => {
          const matchCst = !filtro?.cst || i.cst === filtro.cst;
          const matchQ =
            !q ||
            i.cClassTrib.includes(q) ||
            i.cst.includes(q) ||
            i.nome.toLowerCase().includes(q) ||
            i.descricao.toLowerCase().includes(q) ||
            i.baseLegal.toLowerCase().includes(q);
          return matchCst && matchQ;
        }),
      };

    case 'ncm':
      return {
        tabela: 'ncm',
        versao: RTC_VERSAO_MOTOR.versao,
        data: RTC_NCM_CATALOGO_COMPLETO.filter(
          (i) =>
            !q ||
            i.ncm.includes(q.replace(/\D/g, '')) ||
            i.descricao.toLowerCase().includes(q) ||
            i.categoria.toLowerCase().includes(q)
        ),
      };

    case 'nbs':
      return {
        tabela: 'nbs',
        versao: RTC_VERSAO_MOTOR.versao,
        data: RTC_NBS_SERVICOS.filter(
          (i) =>
            !q ||
            i.nbs.includes(q) ||
            i.descricao.toLowerCase().includes(q) ||
            i.categoria.toLowerCase().includes(q)
        ),
      };

    case 'aliquota-uniao':
    case 'aliquota-uf':
    case 'aliquota-municipio':
    case 'aliquotas':
      return {
        tabela,
        versao: RTC_VERSAO_MOTOR.versao,
        cronograma: filtro?.ano
          ? RTC_ALIQUOTAS_REFERENCIA_ANO.filter((a) => a.ano === filtro.ano)
          : RTC_ALIQUOTAS_REFERENCIA_ANO,
        municipios: filtro?.uf
          ? RTC_MUNICIPIOS_REFERENCIA.filter((m) => m.uf.toUpperCase() === filtro.uf?.toUpperCase())
          : RTC_MUNICIPIOS_REFERENCIA,
      };

    case 'fundamentacoes-legais':
      return {
        tabela: 'fundamentacoes-legais',
        versao: RTC_VERSAO_MOTOR.versao,
        data: RTC_FUNDAMENTACOES_LEGAIS.filter(
          (i) =>
            !q ||
            i.codigo.toLowerCase().includes(q) ||
            i.norma.toLowerCase().includes(q) ||
            i.tema.toLowerCase().includes(q) ||
            i.resumo.toLowerCase().includes(q)
        ),
      };

    default:
      return {
        versao: RTC_VERSAO_MOTOR,
        endpointsDisponiveis: [
          'GET /api/calculadora/dados-abertos/situacoes-tributarias/cbs-ibs',
          'GET /api/calculadora/dados-abertos/classificacoes-tributarias',
          'GET /api/calculadora/dados-abertos/ncm',
          'GET /api/calculadora/dados-abertos/nbs',
          'GET /api/calculadora/dados-abertos/aliquota-uniao',
          'GET /api/calculadora/dados-abertos/aliquota-uf',
          'GET /api/calculadora/dados-abertos/aliquota-municipio',
          'GET /api/calculadora/dados-abertos/fundamentacoes-legais',
        ],
      };
  }
}
