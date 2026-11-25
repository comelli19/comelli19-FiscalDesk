/**
 * Mecanismo de Decisão do Motor Fiscal Universal
 * Recebe dados comerciais/operacionais da operação e deduz o enquadramento fiscal
 * completo com base em regras parametrizadas, vigência e tabelas oficiais.
 */

import {
  DadosEtapa1Operacao,
  DadosEtapa2Caracteristicas,
  DadosEtapa3Produto,
  ResultadoSimuladorInteligente,
  DetalheICMSST,
  PassoMemoriaCalculo,
} from '../types/motorRegras';
import { UFInfo, NCMInfo, CFOP, STRegra } from '../types/fiscal';
import { resolverNCMUniversal } from './ncmCatalogoUniversal';
import { resolverCFOPUniversal } from './cfopCatalogService';
import { RTC_NCM_CATALOGO_COMPLETO, RtcNcmRegra } from '../data/rtcTabelasOficiais';
import { INITIAL_UFS } from '../data/ufs';
import { INITIAL_ST_REGRAS, INITIAL_SUFRAMA_REGRAS } from '../data/stAndSuframa';

const MAPA_RTC_NCM = new Map<string, RtcNcmRegra>(
  RTC_NCM_CATALOGO_COMPLETO.map((item) => [item.ncm.replace(/\D/g, ''), item])
);

/**
 * Classifica qualquer NCM (incluindo os ~10.500 códigos oficiais Siscomex/TIPI)
 * nas regras de redução/alíquota zero/IS da Reforma Tributária (LC 214/2025)
 */
function resolverRegraRtcPorNcm(ncmLimpo: string, ncmObj?: NCMInfo): RtcNcmRegra | null {
  if (!ncmLimpo || ncmLimpo.length < 4) return null;
  const exata = MAPA_RTC_NCM.get(ncmLimpo);
  if (exata) return exata;

  const cap = ncmLimpo.slice(0, 2);
  const descLower = `${ncmObj?.descricao || ''} ${ncmObj?.observacao || ''}`.toLowerCase();

  // Imunidade de livros, jornais e periódicos (CF/88 Art. 150, VI, d)
  if (cap === '49' && ['4901', '4902', '4903', '4904'].some((p) => ncmLimpo.startsWith(p))) {
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Livros e publicações',
      categoria: 'Livros / Imunidade (Alíquota Zero)',
      cClassTrib: '200003',
      cst: '200',
      pRedIBS: 100,
      pRedCBS: 100,
      sujeitoIS: false,
      pISReferencia: 0,
      baseLegal: 'CF/88 Art. 150, VI, "d" e LC 214/2025, Art. 8º',
    };
  }

  // Cesta Básica Nacional explícita ou NCMs de alimentação básica (Anexo I LC 214/2025)
  if (
    descLower.includes('cesta básica') ||
    descLower.includes('alíquota zero de ibs/cbs') ||
    ['1006', '0713', '0201', '0202', '0203', '0207', '0401', '0402', '0405', '0406', '0901', '1101', '1102', '1106', '1701'].some((p) =>
      ncmLimpo.startsWith(p)
    )
  ) {
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Item da Cesta Básica Nacional',
      categoria: 'Cesta Básica Nacional (Alíquota Zero)',
      cClassTrib: '200003',
      cst: '200',
      pRedIBS: 100,
      pRedCBS: 100,
      sujeitoIS: false,
      pISReferencia: 0,
      baseLegal: 'LC 214/2025, Art. 125 e Anexo I (Cesta Básica Nacional)',
    };
  }

  // Combustíveis — Regime Monofásico (CST 620)
  if (cap === '27' && ['271012', '2710192', '271119'].some((p) => ncmLimpo.startsWith(p))) {
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Combustíveis (Monofásico)',
      categoria: 'Combustíveis — Regime Monofásico (CST 620)',
      cClassTrib: '620001',
      cst: '620',
      pRedIBS: 0,
      pRedCBS: 0,
      sujeitoIS: false,
      pISReferencia: 0,
      baseLegal: 'LC 214/2025, Art. 172 a 180 (Monofasia de Combustíveis)',
    };
  }

  // Saúde / Medicamentos / Dispositivos Médicos (Redução de 60% ou 100% vacinas)
  if (cap === '30' || ncmLimpo.startsWith('9018') || ncmLimpo.startsWith('9021')) {
    const isVacina = ncmLimpo.startsWith('300241');
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Medicamentos / Dispositivos de Saúde',
      categoria: isVacina ? 'Saúde / Vacinas (Alíquota Zero)' : 'Saúde & Medicamentos (Redução de 60%)',
      cClassTrib: isVacina ? '200009' : '200030',
      cst: '200',
      pRedIBS: isVacina ? 100 : 60,
      pRedCBS: isVacina ? 100 : 60,
      sujeitoIS: false,
      pISReferencia: 0,
      baseLegal: 'LC 214/2025, Art. 131 a 133 e Anexos IV/XIV',
    };
  }

  // Insumos Agropecuários e Fertilizantes (Redução de 60%)
  if (cap === '31' || ncmLimpo.startsWith('3808') || ncmLimpo.startsWith('230990') || cap === '06' || cap === '12') {
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Insumo Agropecuário',
      categoria: 'Insumos Agropecuários (Redução de 60%)',
      cClassTrib: '200038',
      cst: '200',
      pRedIBS: 60,
      pRedCBS: 60,
      sujeitoIS: false,
      pISReferencia: 0,
      baseLegal: 'LC 214/2025, Art. 138 e Anexo IX',
    };
  }

  // Alimentos essenciais / Higiene pessoal essencial (Redução de 60%)
  if (['07', '08', '09', '10', '11', '15', '19'].includes(cap)) {
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Alimentos destinados ao consumo humano',
      categoria: 'Alimentos Essenciais (Redução de 60%)',
      cClassTrib: '200034',
      cst: '200',
      pRedIBS: 60,
      pRedCBS: 60,
      sujeitoIS: false,
      pISReferencia: 0,
      baseLegal: 'LC 214/2025, Art. 135 e Anexo VII',
    };
  }

  // Bens sujeitos ao Imposto Seletivo (IS)
  if (['2202', '2203', '2204', '2208'].some((p) => ncmLimpo.startsWith(p)) || cap === '24') {
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Bebidas / Fumígenos',
      categoria: 'Sujeito ao Imposto Seletivo (IS)',
      cClassTrib: '000001',
      cst: '000',
      pRedIBS: 0,
      pRedCBS: 0,
      sujeitoIS: true,
      pISReferencia: cap === '24' ? 30 : ncmLimpo.startsWith('2202') ? 2 : ncmLimpo.startsWith('2203') ? 14 : 20,
      baseLegal: 'LC 214/2025, Art. 409 (Imposto Seletivo)',
    };
  }

  if (ncmLimpo.startsWith('8703') || ncmLimpo.startsWith('8802') || ncmLimpo.startsWith('8903')) {
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Veículos / Aeronaves / Embarcações',
      categoria: 'Veículos — Sujeito ao Imposto Seletivo (IS)',
      cClassTrib: '000001',
      cst: '000',
      pRedIBS: 0,
      pRedCBS: 0,
      sujeitoIS: true,
      pISReferencia: ncmLimpo.startsWith('870380') ? 2.0 : 5.5,
      baseLegal: 'LC 214/2025, Art. 409, I e Art. 418',
    };
  }

  if (cap === '26' || ncmLimpo.startsWith('2709')) {
    return {
      ncm: ncmLimpo,
      descricao: ncmObj?.descricao || 'Extração Mineral / Petróleo',
      categoria: 'Extração Mineral — Sujeito ao Imposto Seletivo (IS)',
      cClassTrib: '000001',
      cst: '000',
      pRedIBS: 0,
      pRedCBS: 0,
      sujeitoIS: true,
      pISReferencia: 0.25,
      baseLegal: 'LC 214/2025, Art. 409, VI e Art. 424 (teto 0,25%)',
    };
  }

  return null;
}

/**
 * Mapa de referência única das 27 UFs baseado em src/data/ufs.ts (INITIAL_UFS)
 */
const MAPA_UFS_PADRAO = new Map<string, UFInfo>(
  INITIAL_UFS.map((u) => [u.sigla.toUpperCase(), u])
);

/**
 * Normaliza textos removendo acentos e convertendo para maiúsculas
 */
function normalizarTexto(texto: string): string {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Interpreta a MVA personalizada informada pelo usuário
 */
function parseMVAPersonalizada(valor?: string): {
  informado: boolean;
  isento: boolean;
  percentual: number | null;
} {
  const limpo = (valor || '').trim();
  if (!limpo) return { informado: false, isento: false, percentual: null };
  const norm = normalizarTexto(limpo);
  if (norm.includes('ISENT') || norm === 'NAO' || norm === 'N/A' || norm.includes('NAO APLIC')) {
    return { informado: true, isento: true, percentual: 0 };
  }
  const numStr = limpo.replace('%', '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(numStr);
  if (Number.isNaN(parsed) || parsed < 0) {
    return { informado: false, isento: false, percentual: null };
  }
  return { informado: true, isento: false, percentual: parsed };
}

/**
 * Calcula a MVA Ajustada conforme Cláusula 11ª do Convênio ICMS 142/2018:
 * MVA Ajustada = [((1 + MVA-ST original) × (1 - ALQ inter)) / (1 - ALQ intra)] - 1
 */
export function calcularMVAAjustadaST(
  mvaOriginal: number,
  aliquotaInter: number,
  aliquotaInternaDestino: number
): number {
  if (mvaOriginal <= 0 || aliquotaInternaDestino <= aliquotaInter || aliquotaInternaDestino >= 100) {
    return Number(mvaOriginal.toFixed(2));
  }
  const ajustada =
    (((1 + mvaOriginal / 100) * (1 - aliquotaInter / 100)) /
      (1 - aliquotaInternaDestino / 100) -
      1) *
    100;
  return Number(Math.max(mvaOriginal, ajustada).toFixed(2));
}

/**
 * Localiza protocolo/convênio de ICMS-ST na tabela de referência (stAndSuframa.ts ou editada no Admin)
 */
function buscarRegraSTAplicavel(
  stRules: STRegra[],
  ufOrig: string,
  ufDest: string,
  ncmLimpo: string,
  isInterna: boolean
): STRegra | undefined {
  if (!ncmLimpo || ncmLimpo.length < 4) return undefined;
  const ativas = stRules.filter((r) => r.aderiu);

  const matchNcmExato = (r: STRegra) => r.ncm.replace(/\D/g, '') === ncmLimpo;
  const matchNcmPosicao = (r: STRegra) => {
    const rClean = r.ncm.replace(/\D/g, '');
    return rClean.length >= 4 && ncmLimpo.startsWith(rClean.slice(0, 4));
  };

  if (isInterna) {
    return (
      ativas.find((r) => r.ufDestino.toUpperCase() === ufDest && matchNcmExato(r)) ||
      ativas.find((r) => r.ufDestino.toUpperCase() === ufDest && matchNcmPosicao(r))
    );
  }

  // Interestadual: 1) Rota exata + NCM exato; 2) Rota exata + posição 4 dígitos; 3) Convênio nacional + UF destino + NCM exato
  return (
    ativas.find(
      (r) =>
        r.ufOrigem.toUpperCase() === ufOrig &&
        r.ufDestino.toUpperCase() === ufDest &&
        matchNcmExato(r)
    ) ||
    ativas.find(
      (r) =>
        r.ufOrigem.toUpperCase() === ufOrig &&
        r.ufDestino.toUpperCase() === ufDest &&
        matchNcmPosicao(r)
    ) ||
    ativas.find(
      (r) =>
        r.ufDestino.toUpperCase() === ufDest &&
        normalizarTexto(r.protocoloConvenio).includes('CONVENIO') &&
        matchNcmExato(r)
    )
  );
}

/**
 * Detecta se a UF/Município de destino pertence à ZFM ou Área de Livre Comércio (Tabela SUFRAMA + UFs)
 */
function detectarAreaSuframa(
  ufDestRaw: string,
  ufDestSigla: string,
  municipioDestino: string,
  ufDestObj?: UFInfo
): boolean {
  const destNorm = normalizarTexto(ufDestRaw);
  const munNorm = normalizarTexto(municipioDestino);

  if (destNorm.includes('ZFM') || destNorm.includes('ALC') || destNorm.includes('SUFRAMA')) {
    return true;
  }

  // Verifica contra os municípios oficiais de regime especial cadastrados em src/data/ufs.ts
  if (ufDestObj?.temSuframaOuALC && ufDestObj.municipiosRegimeEspecial) {
    const bateUF = ufDestObj.municipiosRegimeEspecial.some((m) => {
      const mNorm = normalizarTexto(m).replace(/\(.*?\)/g, '').trim();
      return (
        mNorm.length >= 4 &&
        (munNorm.includes(mNorm) || destNorm.includes(mNorm))
      );
    });
    if (bateUF) return true;
  }

  // Verifica contra a tabela oficial INITIAL_SUFRAMA_REGRAS
  return INITIAL_SUFRAMA_REGRAS.some((regra) => {
    if (regra.uf.toUpperCase() !== ufDestSigla) return false;
    const partes = regra.municipio
      .split('/')
      .map((p) => normalizarTexto(p).replace(/\(.*?\)/g, '').trim())
      .filter((p) => p.length >= 4);
    return partes.some((p) => munNorm.includes(p) || destNorm.includes(p));
  });
}

/**
 * Alíquota interestadual segundo Resolução do Senado nº 22/89 e Resolução 13/12
 */
function calcularAliquotaInterestadual(
  origem: string,
  destino: string,
  codigoOrigem: string
): number {
  // Mercadoria importada ou com conteúdo de importação > 40% (Resolução Senado 13/2012)
  if (['1', '2', '3', '8'].includes(codigoOrigem)) {
    return 4.0;
  }

  const sulSudesteSemES = ['SP', 'RJ', 'MG', 'RS', 'SC', 'PR'];
  const norteNordesteCentroES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO',
  ];

  // Origem Sul/Sudeste (exceto ES) destinada a Norte/Nordeste/Centro-Oeste/ES: 7%
  if (sulSudesteSemES.includes(origem) && norteNordesteCentroES.includes(destino)) {
    return 7.0;
  }

  // Demais fluxos interestaduais: 12%
  return 12.0;
}

/**
 * Extrai sigla pura da UF
 */
function normalizarUF(ufString: string): string {
  const upper = ufString.trim().toUpperCase();
  if (upper.includes('/')) {
    const parts = upper.split('/');
    return parts[parts.length - 1].trim();
  }
  const match = upper.match(
    /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO|EX)\b/
  );
  if (match) return match[1];
  return upper.slice(0, 2);
}

const fmtBRL = (val: number) =>
  `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Executa a interpretação tributária e calcula todos os parâmetros fiscais
 * com alinhamento integral às tabelas de referência (UFs, NCMs, CFOPs, ST e Suframa).
 */
export function executarMotorFiscalInteligente(params: {
  etapa1: DadosEtapa1Operacao;
  etapa2: DadosEtapa2Caracteristicas;
  etapa3: DadosEtapa3Produto;
  ufs?: UFInfo[];
  ncms?: NCMInfo[];
  cfops?: CFOP[];
  stRules?: STRegra[];
  ncmSelecionado?: NCMInfo | null;
  cfopSelecionado?: CFOP | null;
  mvaPersonalizada?: string;
}): ResultadoSimuladorInteligente {
  const {
    etapa1,
    etapa2,
    etapa3,
    ncms = [],
    cfops = [],
    stRules = INITIAL_ST_REGRAS,
    ncmSelecionado = null,
    cfopSelecionado = null,
    mvaPersonalizada = '',
  } = params;

  const ufOrig = normalizarUF(etapa1.ufOrigem);
  const ufDest = normalizarUF(etapa1.ufDestino);

  // Fonte única de verdade para UFs (prop atualizada pelo Admin → fallback INITIAL_UFS)
  const listaUFs = params.ufs && params.ufs.length > 0 ? params.ufs : INITIAL_UFS;
  const ufOrigObj = listaUFs.find((u) => u.sigla.toUpperCase() === ufOrig) || MAPA_UFS_PADRAO.get(ufOrig);
  const ufDestObj = listaUFs.find((u) => u.sigla.toUpperCase() === ufDest) || MAPA_UFS_PADRAO.get(ufDest);

  // 1. Identificação preliminar territorial, NCM e Protocolos ST
  const isExteriorInicial =
    etapa1.tipoOperacao === 'exterior' ||
    ufDest === 'EX' ||
    normalizarTexto(etapa1.ufDestino).includes('EXTERIOR');

  const isZFMouALCInicial =
    !isExteriorInicial &&
    (etapa2.envolveZFMouALC ||
      detectarAreaSuframa(etapa1.ufDestino, ufDest, etapa1.municipioDestino, ufDestObj));

  const valorTotal = etapa3.valorTotal || etapa3.quantidade * etapa3.valorUnitario || 1000.0;
  const mvaManual = parseMVAPersonalizada(mvaPersonalizada);

  // Resolução completa do NCM antes do CFOP automático (para identificar ST/Cesta Básica/TIPI)
  const ncmLimpo = etapa3.ncmCodigo.replace(/\D/g, '');
  const ncmExatoCatalogo =
    (ncmSelecionado && ncmSelecionado.codigo.replace(/\D/g, '') === ncmLimpo
      ? ncmSelecionado
      : undefined) || ncms.find((n) => n.codigo.replace(/\D/g, '') === ncmLimpo);
  const ncmResolvidoUniversal =
    !ncmExatoCatalogo && ncmLimpo.length === 8 ? resolverNCMUniversal(ncmLimpo) : undefined;
  const ncmObj: NCMInfo | undefined = ncmExatoCatalogo || ncmResolvidoUniversal;

  const isInternaInicial = !isExteriorInicial && ufOrig === ufDest;
  const regraSTInicial = !isExteriorInicial
    ? buscarRegraSTAplicavel(stRules, ufOrig, ufDest, ncmLimpo, isInternaInicial)
    : undefined;

  // Avalia se ST se aplica automaticamente em modo de dedução automática (B2B revenda com protocolo ou ST interna)
  const ufDestPermiteST = ufDestObj ? ufDestObj.temST : true;
  const mvaDesabilitadaManual =
    mvaManual.isento || (mvaManual.informado && mvaManual.percentual === 0);
  const isOrigemImportadaInicial = ['1', '2', '3', '8'].includes(etapa3.origemMercadoria);
  const isZFMDesoneradoInicial = isZFMouALCInicial && !isOrigemImportadaInicial;
  const stElegivelAutoCFOP =
    !isExteriorInicial &&
    !isZFMDesoneradoInicial &&
    etapa2.destinatarioContribuinte &&
    etapa2.destinatarioPossuiIE &&
    etapa2.finalidadeMercadoria === 'comercializacao' &&
    !mvaDesabilitadaManual &&
    (Boolean(regraSTInicial) ||
      (Boolean(ncmObj?.temST) &&
        ufDestPermiteST &&
        (isInternaInicial || (mvaManual.percentual !== null && mvaManual.percentual > 0))));

  // 2. Determinação de CFOP e Natureza de Operação (MOC SEFAZ)
  let cfopCodigo = '5.102';
  let cfopDescricao = 'Venda de mercadoria adquirida ou recebida de terceiros';
  let naturezaOperacao = 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS';
  let abrangencia: 'estadual' | 'interestadual' | 'exterior' = 'estadual';

  if (isExteriorInicial) {
    abrangencia = 'exterior';
    cfopCodigo = '7.101';
    cfopDescricao = 'Venda de produção do estabelecimento para o exterior';
    naturezaOperacao = 'EXPORTAÇÃO DE MERCADORIA DE PRODUÇÃO DO ESTABELECIMENTO';
  } else if (ufOrig !== ufDest) {
    abrangencia = 'interestadual';
    if (isZFMDesoneradoInicial && etapa2.destinatarioContribuinte) {
      if (etapa2.finalidadeMercadoria === 'industrializacao') {
        cfopCodigo = '6.109';
        cfopDescricao = 'Venda de produção para a Zona Franca de Manaus ou Áreas de Livre Comércio';
        naturezaOperacao =
          'VENDA DE PRODUÇÃO DO ESTABELECIMENTO DESTINADA À ZONA FRANCA DE MANAUS OU ÁREAS DE LIVRE COMÉRCIO';
      } else {
        cfopCodigo = '6.110';
        cfopDescricao = 'Venda de mercadoria adquirida de terceiros para a ZFM ou ALC';
        naturezaOperacao =
          'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS DESTINADA À ZONA FRANCA DE MANAUS OU ÁREAS DE LIVRE COMÉRCIO';
      }
    } else if (!etapa2.destinatarioContribuinte || !etapa2.destinatarioPossuiIE) {
      cfopCodigo = '6.108';
      cfopDescricao = 'Venda de mercadoria a consumidor final não contribuinte';
      naturezaOperacao =
        'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS DESTINADA A NÃO CONTRIBUINTE';
    } else if (stElegivelAutoCFOP) {
      cfopCodigo = '6.403';
      cfopDescricao =
        'Venda de mercadoria adquirida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituto';
      naturezaOperacao =
        'VENDA DE MERCADORIA SUJEITA AO REGIME DE SUBSTITUIÇÃO TRIBUTÁRIA (CONTRIBUINTE SUBSTITUTO)';
    } else if (etapa2.finalidadeMercadoria === 'industrializacao') {
      cfopCodigo = '6.101';
      cfopDescricao = 'Venda de produção do estabelecimento';
      naturezaOperacao = 'VENDA DE PRODUÇÃO DO ESTABELECIMENTO';
    } else {
      cfopCodigo = '6.102';
      cfopDescricao = 'Venda de mercadoria adquirida ou recebida de terceiros';
      naturezaOperacao = 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS';
    }
  } else {
    // Operação interna
    abrangencia = 'estadual';
    if (stElegivelAutoCFOP) {
      cfopCodigo = '5.403';
      cfopDescricao =
        'Venda de mercadoria adquirida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituto';
      naturezaOperacao =
        'VENDA DE MERCADORIA SUJEITA AO REGIME DE SUBSTITUIÇÃO TRIBUTÁRIA (CONTRIBUINTE SUBSTITUTO)';
    } else if (etapa2.finalidadeMercadoria === 'industrializacao') {
      cfopCodigo = '5.101';
      cfopDescricao = 'Venda de produção do estabelecimento';
      naturezaOperacao = 'VENDA DE PRODUÇÃO DO ESTABELECIMENTO';
    } else {
      cfopCodigo = '5.102';
      cfopDescricao = 'Venda de mercadoria adquirida ou recebida de terceiros';
      naturezaOperacao = 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS';
    }
  }

  // Se o usuário selecionou ou informou um CFOP manualmente, respeita a escolha
  const temCfopManual = Boolean(etapa1.cfopManual && etapa1.cfopManual.trim());
  if (temCfopManual) {
    const limpo = etapa1.cfopManual!.replace(/\D/g, '');
    const encontrado =
      (cfopSelecionado && cfopSelecionado.codigo.replace(/\D/g, '') === limpo
        ? cfopSelecionado
        : undefined) ||
      cfops.find((c) => c.codigo.replace(/\D/g, '') === limpo) ||
      (limpo.length === 4 ? resolverCFOPUniversal(limpo) : undefined);

    if (encontrado) {
      cfopCodigo = encontrado.codigo;
      cfopDescricao = encontrado.descricao;
      naturezaOperacao = encontrado.descricao.toUpperCase();
      abrangencia = encontrado.abrangencia;
    } else {
      cfopCodigo = etapa1.cfopManual!;
      cfopDescricao = `CFOP Informado Manualmente (${etapa1.cfopManual})`;
      naturezaOperacao = `OPERAÇÃO FISCAL CONFORME CFOP ${etapa1.cfopManual}`;
      const primDigito = limpo[0];
      if (['1', '5'].includes(primDigito)) abrangencia = 'estadual';
      else if (['2', '6'].includes(primDigito)) abrangencia = 'interestadual';
      else if (['3', '7'].includes(primDigito)) abrangencia = 'exterior';
    }
  }

  // 2b. Identificação completa do CFOP selecionado e sua natureza tributária
  const cfopLimpo = cfopCodigo.replace(/\D/g, '');
  const sufixoCFOP = cfopLimpo.slice(1);
  const digitoSentido = cfopLimpo[0];
  const isEntradaCFOP = ['1', '2', '3'].includes(digitoSentido);
  const isImportacaoCFOP = digitoSentido === '3';
  const isExportacao =
    !isImportacaoCFOP && (digitoSentido === '7' || isExteriorInicial);
  const isExterior = isExportacao || isImportacaoCFOP;
  const isInterna = !isExterior && ['1', '5'].includes(digitoSentido) && ufOrig === ufDest;
  const isInterestadual = !isExterior && (['2', '6'].includes(digitoSentido) || ufOrig !== ufDest);
  const isZFMouALC =
    !isExterior && (isZFMouALCInicial || ['6109', '6110'].includes(cfopLimpo));

  // Detecta inconsistência territorial entre o CFOP manual escolhido e as UFs configuradas
  const cfopIncompativelComUF =
    temCfopManual &&
    ((['1', '5'].includes(digitoSentido) && (ufOrig !== ufDest || isExteriorInicial)) ||
      (['2', '6'].includes(digitoSentido) && (ufOrig === ufDest || isExteriorInicial)) ||
      (['3', '7'].includes(digitoSentido) && !isExteriorInicial && ufDest !== 'EX'));

  const cfopObj =
    (cfopSelecionado && cfopSelecionado.codigo.replace(/\D/g, '') === cfopLimpo
      ? cfopSelecionado
      : undefined) ||
    cfops.find((c) => c.codigo.replace(/\D/g, '') === cfopLimpo) ||
    (cfopLimpo.length === 4 ? resolverCFOPUniversal(cfopLimpo) : undefined);

  // Classificação sistemática por natureza fiscal do CFOP
  const isConserto = ['915', '916'].includes(sufixoCFOP);
  const isTransferencia = ['151', '152', '155', '408', '409'].includes(sufixoCFOP);
  const isAtivoImobilizadoSaida = ['551'].includes(sufixoCFOP) && !isEntradaCFOP;
  const isAtivoOuUsoConsumoEntrada = ['1551', '2551', '1556', '2556'].includes(cfopLimpo);
  const isUsoConsumoEntrada = ['1556', '2556'].includes(cfopLimpo);
  const isSimplesFaturamento = ['922'].includes(sufixoCFOP);
  const isRemessaEntregaFutura = ['116', '117'].includes(sufixoCFOP);
  const isConsignacao = ['917', '918'].includes(sufixoCFOP);
  const isBonificacaoOuBrinde = ['910'].includes(sufixoCFOP);
  const isAmostraGratis = ['911'].includes(sufixoCFOP);
  const isRemessaContaOrdem = ['923'].includes(sufixoCFOP);
  const isIndustrializacaoTerceiros = ['124'].includes(sufixoCFOP);
  const isVendaNaoContribuinteCFOP = ['107', '108'].includes(sufixoCFOP);

  const sufixosSuspensao = [
    '901', '902', '903', '905', '906', '912', '913', '914', '915', '916', '924', '925', '554', '555',
  ];
  const sufixosNaoIncidencia = ['908', '909', '920', '921', '923', '927', '949'];

  const isSTSubstitutoCFOP = ['5401', '5402', '5403', '6401', '6402', '6403'].includes(cfopLimpo);
  const isSTJaRetidaCFOP = ['5405', '6404', '1403', '2403'].includes(cfopLimpo);
  const isRevendaComercialCFOP = [
    '102', '104', '108', '117', '119', '202', '403', '404', '405', '152', '155', '409',
  ].includes(sufixoCFOP);

  const isSuspensaoCFOP = sufixosSuspensao.includes(sufixoCFOP);
  const isNaoIncidenciaCFOP = sufixosNaoIncidencia.includes(sufixoCFOP);

  const isCatalogoSemTributacao =
    Boolean(cfopObj) &&
    cfopObj!.geraCreditoDebitoICMS === false &&
    cfopObj!.geraCreditoDebitoIPI === false &&
    cfopObj!.geraCreditoDebitoPISCOFINS === false &&
    !cfopObj!.movimentaFinanceiro &&
    !isSTJaRetidaCFOP &&
    !isZFMouALC &&
    !isAtivoImobilizadoSaida &&
    !isSimplesFaturamento &&
    !isConsignacao &&
    !isBonificacaoOuBrinde &&
    !isAmostraGratis &&
    !isTransferencia;

  const isOperacaoSemFaturamento =
    !isExterior &&
    !isTransferencia &&
    !isAtivoImobilizadoSaida &&
    !isSimplesFaturamento &&
    !isConsignacao &&
    !isBonificacaoOuBrinde &&
    !isAmostraGratis &&
    (isSuspensaoCFOP || isNaoIncidenciaCFOP || isCatalogoSemTributacao);

  const regimeEmitente = etapa1.regimeTributario || 'lucro_presumido';
  const isSimples = regimeEmitente === 'simples_nacional' || regimeEmitente === 'mei';
  const isRegimeEspecial = regimeEmitente === 'regime_especial';
  const isOrigemImportada = ['1', '2', '3', '8'].includes(etapa3.origemMercadoria);

  // Benefício ZFM/ALC exige produto de origem nacional (Convênio ICMS 65/88, Cláusula 1ª)
  const isZFMDesoneradoValido =
    isZFMouALC &&
    !isOrigemImportada &&
    (etapa2.destinatarioContribuinte || ['6109', '6110'].includes(cfopLimpo));

  // 3. IPI (calculado antes do ICMS/ST pois compõe base de ST e base de ICMS para consumidor final / uso e consumo)
  const ipiTipi =
    typeof etapa3.aliquotaIPIPadrao === 'number' && !Number.isNaN(etapa3.aliquotaIPIPadrao)
      ? etapa3.aliquotaIPIPadrao
      : ncmObj
      ? ncmObj.aliquotaIPI
      : 0;

  let ipiCST = isEntradaCFOP ? (ipiTipi === 0 ? '01' : '00') : ipiTipi === 0 ? '51' : '50';
  let ipiAliquota = ipiTipi;
  let ipiBase = ipiTipi > 0 ? valorTotal : 0;
  let ipiFundamentacao = 'Decreto nº 11.158/2022 (Tabela TIPI) e Decreto nº 7.212/2010 (RIPI)';
  let ipiMotivo =
    ipiTipi === 0
      ? `NCM ${etapa3.ncmCodigo} tributado com Alíquota Zero (0%) na Tabela TIPI — utilizar CST ${ipiCST}.`
      : `Operação tributada a ${ipiTipi}% conforme NCM ${etapa3.ncmCodigo} na Tabela TIPI.`;

  if (isSimples && !isImportacaoCFOP) {
    ipiCST = '99';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = 'Lei Complementar nº 123/2006, Art. 13';
    ipiMotivo = 'Optante pelo Simples Nacional/MEI desobrigado do destaque de IPI na NF-e.';
  } else if (isExportacao) {
    ipiCST = '54';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = 'CF/88 Art. 153, § 3º, III e RIPI Dec. 7.212/10 Art. 18';
    ipiMotivo = 'Imunidade constitucional de IPI na exportação.';
  } else if (isImportacaoCFOP) {
    if (cfopLimpo === '3201' || cfopLimpo === '3949') {
      ipiCST = '03';
      ipiAliquota = 0;
      ipiBase = 0;
      ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 38';
      ipiMotivo = `Entrada do exterior (${cfopCodigo}) sem destaque automático de IPI.`;
    } else {
      ipiCST = isSimples ? '49' : '00';
      ipiAliquota = ipiTipi;
      ipiBase = ipiTipi > 0 ? valorTotal : 0;
      ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 35, I e Tabela TIPI';
      ipiMotivo = isSimples
        ? `Desembaraço aduaneiro (${cfopCodigo}): IPI-Importação pago na DI conforme TIPI, porém sem apropriação de crédito pelo Simples Nacional (CST 49).`
        : `Desembaraço aduaneiro (${cfopCodigo}): incidência de IPI na importação conforme TIPI.`;
    }
  } else if (isBonificacaoOuBrinde && isEntradaCFOP) {
    ipiCST = '49';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 226 (Entrada sem direito a crédito)';
    ipiMotivo = `Entrada em bonificação, doação ou brinde (${cfopCodigo}): via de regra não gera crédito de IPI na escrita fiscal (CST 49).`;
  } else if (isAmostraGratis) {
    ipiCST = isEntradaCFOP ? '02' : '52';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 54, III (Isenção Amostra Grátis)';
    ipiMotivo = `Isenção de IPI na remessa de amostra grátis (${cfopCodigo}) observados os requisitos do RIPI.`;
  } else if (isOperacaoSemFaturamento) {
    const usaSuspensaoIPI = isSuspensaoCFOP && !isNaoIncidenciaCFOP;
    ipiCST = isEntradaCFOP ? (usaSuspensaoIPI ? '05' : '03') : usaSuspensaoIPI ? '55' : '53';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = usaSuspensaoIPI
      ? 'Decreto nº 7.212/2010 (RIPI), Art. 43 (Operação com Suspensão de IPI)'
      : 'Decreto nº 7.212/2010 (RIPI), Art. 38 (Operação Não Tributada de IPI)';
    ipiMotivo = usaSuspensaoIPI
      ? `Operação com suspensão de IPI (CST ${ipiCST}) no CFOP ${cfopCodigo} — sem destaque do imposto.`
      : `Operação não tributada de IPI (CST ${ipiCST}) no CFOP ${cfopCodigo}.`;
  } else if (isAtivoImobilizadoSaida || isUsoConsumoEntrada) {
    ipiCST = isEntradaCFOP ? '03' : '53';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI) — Sem incidência / sem direito a crédito';
    ipiMotivo = isAtivoImobilizadoSaida
      ? `Venda de bem usado do ativo imobilizado (${cfopCodigo}) sem destaque de IPI (CST 53).`
      : `Aquisição de material de uso/consumo (${cfopCodigo}) não gera crédito de IPI.`;
  } else if (isSimplesFaturamento) {
    ipiCST = isEntradaCFOP ? '03' : '53';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 407 (Destaque Facultativo na Entrega Futura)';
    ipiMotivo = `No simples faturamento (${cfopCodigo}), o destaque do IPI é facultativo (pode ser destacado aqui ou na efetiva remessa).`;
  } else if (isTransferencia) {
    if (['151', '408'].includes(sufixoCFOP)) {
      ipiCST = isEntradaCFOP ? '05' : '55';
      ipiAliquota = 0;
      ipiBase = 0;
      ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 43, X (Suspensão entre Estabelecimentos)';
      ipiMotivo = `Transferência de produção própria (${cfopCodigo}): verificar enquadramento de suspensão (Art. 43, X) ou destaque conforme equiparação.`;
    } else {
      ipiCST = isEntradaCFOP ? '03' : '53';
      ipiAliquota = 0;
      ipiBase = 0;
      ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 38';
      ipiMotivo = `Transferência de mercadoria de terceiros (${cfopCodigo}): sem incidência de IPI.`;
    }
  } else if (isZFMDesoneradoValido) {
    ipiCST = '52';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 81, II e Dec.-Lei 288/67';
    ipiMotivo = 'Isenção de IPI nas saídas de produtos nacionais destinados à Zona Franca de Manaus e ALC.';
  } else if (
    isRevendaComercialCFOP ||
    (!temCfopManual && etapa2.finalidadeMercadoria === 'comercializacao')
  ) {
    ipiCST = isEntradaCFOP ? '03' : '53';
    ipiAliquota = 0;
    ipiBase = 0;
    ipiFundamentacao = 'Decreto nº 7.212/2010 (RIPI), Art. 9º e Art. 38 (Comercialização)';
    ipiMotivo = `Operação de revenda/comercialização (${cfopCodigo}) sem industrialização própria: não tributada de IPI (salvo se equiparado a industrial).`;
  }

  const ipiValor = Number(((ipiBase * ipiAliquota) / 100).toFixed(2));

  // 4. Consulta de Alíquotas UF (100% alinhado à Tabela de Referência UFs) & Cálculo de ICMS, ICMS-ST, DIFAL e FCP
  const aliqInternaOrigem = ufOrigObj?.aliquotaInterna ?? 18.0;
  const aliqInternaDestino = ufDestObj?.aliquotaInterna ?? 18.0;
  const aliqFCPDestino = ufDestObj?.fcp ?? 0;
  const aliqInterestadual = calcularAliquotaInterestadual(
    ufOrig,
    ufDest,
    etapa3.origemMercadoria
  );

  // Regra Constitucional CF/88 Art. 155, § 2º, XI: IPI integra a base do ICMS quando destinada a não contribuinte ou uso/consumo/ativo
  const ipiIntegraBaseICMS =
    ipiValor > 0 &&
    (!etapa2.destinatarioContribuinte ||
      !etapa2.destinatarioPossuiIE ||
      etapa2.consumidorFinal ||
      etapa2.finalidadeMercadoria === 'consumo' ||
      etapa2.finalidadeMercadoria === 'ativo_imobilizado');

  const baseICMSOperacao = Number((valorTotal + (ipiIntegraBaseICMS ? ipiValor : 0)).toFixed(2));
  const aliqOperacaoPropria = isInterna ? aliqInternaOrigem : aliqInterestadual;

  // Regra ST efetiva para esta operação
  const regraST = !isExterior
    ? buscarRegraSTAplicavel(stRules, ufOrig, ufDest, ncmLimpo, isInterna)
    : undefined;

  // Exceção NCM Cesta Básica em operação interna (Convênio ICMS 128/94 → redução de base para carga efetiva 7%)
  const isNcmCestaBasicaICMS =
    Boolean(ncmObj) &&
    (['1006', '0713', '0401', '0201', '0202', '0203', '0207'].some((p) =>
      ncmLimpo.startsWith(p)
    ) ||
      normalizarTexto(ncmObj?.observacao || '').includes('REDUCAO DE BASE DE CALCULO DO ICMS PARA 7%'));

  // Avaliação de incidência de ICMS-ST (Convênio ICMS 142/2018)
  const operacaoBloqueiaST =
    isExterior ||
    isTransferencia ||
    isAtivoImobilizadoSaida ||
    isSimplesFaturamento ||
    isAmostraGratis ||
    isOperacaoSemFaturamento ||
    isSTJaRetidaCFOP ||
    isZFMDesoneradoValido ||
    isEntradaCFOP ||
    (!etapa2.destinatarioContribuinte || !etapa2.destinatarioPossuiIE) ||
    etapa2.finalidadeMercadoria === 'consumo' ||
    etapa2.finalidadeMercadoria === 'ativo_imobilizado';

  const stAplicavelPorRegra =
    !operacaoBloqueiaST &&
    (isSTSubstitutoCFOP ||
      (etapa2.finalidadeMercadoria === 'comercializacao' &&
        !mvaDesabilitadaManual &&
        (Boolean(regraST) ||
          (Boolean(ncmObj?.temST) &&
            ufDestPermiteST &&
            (isInterna || (mvaManual.percentual !== null && mvaManual.percentual > 0))))));

  let icmsCST = '00';
  let icmsAliquota = aliqOperacaoPropria;
  let icmsBase = baseICMSOperacao;
  let icmsValor = 0;
  let valorICMSDesonerado = 0;
  let icmsFundamentacao = isInterna
    ? `${ufOrigObj?.fonte || `RICMS/${ufOrig}`} (Alíquota Modal Interna ${aliqInternaOrigem}%)`
    : 'Resolução do Senado nº 22/1989, Resolução nº 13/2012 e RICMS Estadual';
  let icmsMotivo = isInterna
    ? `Operação interna tributada à alíquota modal de ${ufOrig} (${aliqInternaOrigem}%).`
    : `Operação interestadual tributada à alíquota de ${aliqInterestadual}% (${ufOrig} ➔ ${ufDest}) entre contribuintes${isOrigemImportada ? ' (mercadoria importada — Res. SF 13/2012)' : ''}.`;
  let icmsMva = mvaPersonalizada.trim() || '0%';

  // Estado detalhado de ICMS-ST
  let icmsST: DetalheICMSST = {
    aplicavel: false,
    retidaAnteriormente: false,
    cstOuCsosn: '',
    cest: regraST?.cest || ncmObj?.cestPadrao,
    protocolo: regraST?.protocoloConvenio,
    mvaOriginal: 0,
    mvaAjustada: 0,
    mvaAplicada: 0,
    usouMvaOriginalSimples: false,
    aliquotaInternaDestino: aliqInternaDestino,
    aliquotaOperacaoPropria: aliqOperacaoPropria,
    baseCalculoST: 0,
    icmsProprioDeduzido: 0,
    valorICMSST: 0,
    fcpSTAliquota: 0,
    valorFCPST: 0,
    fundamentacaoLegal: 'Convênio ICMS 142/2018',
    motivoEnquadramento: 'Operação não sujeita à retenção de ICMS-ST nesta etapa.',
    formulaCalculo: '',
    origemRegraMVA: 'nao_aplicavel',
  };

  // Diferencial de Alíquotas (DIFAL) e FCP
  let difalAplicavel = false;
  let difalTipo: ResultadoSimuladorInteligente['difal']['tipoDifal'] = 'nao_aplicavel';
  let difalResponsavel: ResultadoSimuladorInteligente['difal']['responsavelRecolhimento'] = 'nenhum';
  let difalDiferenca = 0;
  let difalValor = 0;
  let fcpAliquotaAplicada = 0;
  let fcpValor = 0;
  let difalBaseLegal =
    'Emenda Constitucional nº 87/2015, Lei Complementar nº 190/2022 e Convênio ICMS 236/2021';

  const isDifalNaoContribuinteCond =
    isInterestadual &&
    (!etapa2.destinatarioContribuinte ||
      !etapa2.destinatarioPossuiIE ||
      cfopLimpo === '6107' ||
      cfopLimpo === '6108');

  const isDifalContribuinteCond =
    isInterestadual &&
    !isDifalNaoContribuinteCond &&
    etapa2.destinatarioContribuinte &&
    etapa2.destinatarioPossuiIE &&
    (etapa2.finalidadeMercadoria === 'consumo' ||
      etapa2.finalidadeMercadoria === 'ativo_imobilizado');

  if (isExportacao) {
    icmsCST = isSimples ? '300' : '41';
    icmsAliquota = 0;
    icmsBase = 0;
    icmsValor = 0;
    icmsMva = 'Imune';
    icmsFundamentacao = isSimples
      ? 'CF/88 Art. 155, § 2º, X, "a" e Resolução CGSN nº 140/2018 (CSOSN 300 — Imune)'
      : 'CF/88 Art. 155, § 2º, X, "a" c/c LC 87/1996 (Imunidade Exportação)';
    icmsMotivo = 'Mercadoria destinada ao exterior goza de imunidade constitucional de ICMS.';
  } else if (isImportacaoCFOP) {
    if (cfopLimpo === '3201' || cfopLimpo === '3949') {
      icmsCST = '41';
      icmsAliquota = 0;
      icmsBase = 0;
      icmsValor = 0;
      icmsFundamentacao = 'LC nº 87/1996 e Regulamento Aduaneiro (Retorno de exportação / Outra entrada)';
      icmsMotivo =
        cfopLimpo === '3201'
          ? 'Devolução de mercadoria exportada: sem incidência de ICMS na reimportação quando vinculada à DU-E originária.'
          : `CFOP ${cfopCodigo}: verificar enquadramento aduaneiro específico no RICMS/${ufOrig}.`;
    } else {
      icmsCST = '00';
      icmsAliquota = aliqInternaOrigem;
      icmsBase = valorTotal;
      icmsValor = Number(((icmsBase * icmsAliquota) / 100).toFixed(2));
      icmsFundamentacao = `CF/88 Art. 155, § 2º, IX, "a" e ${ufOrigObj?.fonte || `RICMS/${ufOrig}`} (ICMS-Importação)`;
      icmsMotivo =
        `Importação direta (${cfopCodigo}): incide ICMS à alíquota interna do estado importador (${ufOrig}: ${aliqInternaOrigem}%), compondo a base com II, IPI, PIS/COFINS-Importação e despesas aduaneiras ("cálculo por dentro").`;
    }
  } else if (isTransferencia) {
    icmsCST = '41';
    icmsAliquota = 0;
    icmsBase = 0;
    icmsValor = 0;
    icmsMva = 'Não aplicável';
    icmsFundamentacao = 'STF ADC 49, Lei Complementar nº 204/2023 e Convênio ICMS 109/2024';
    icmsMotivo =
      `Transferência entre estabelecimentos do mesmo titular (${cfopCodigo}): não há incidência de ICMS, assegurada a transferência de crédito ao destino nos termos da LC 204/2023 e Convênio ICMS 109/2024.`;
  } else if (isAtivoImobilizadoSaida) {
    icmsCST = '41';
    icmsAliquota = 0;
    icmsBase = 0;
    icmsValor = 0;
    icmsMva = 'Não aplicável';
    icmsFundamentacao = 'LC nº 87/1996, Súmula 573 STF e RICMS Estadual (Ativo Imobilizado)';
    icmsMotivo =
      `Saída de bem do ativo imobilizado (${cfopCodigo}): não incidência/isenção de ICMS em regra, observando o prazo mínimo de imobilização previsto no RICMS/${ufOrig}.`;
  } else if (isSimplesFaturamento) {
    icmsCST = '41';
    icmsAliquota = 0;
    icmsBase = 0;
    icmsValor = 0;
    icmsMva = 'Não aplicável';
    icmsFundamentacao = 'Convênio S/Nº de 1970, Art. 40 e RICMS Estadual (Simples Faturamento)';
    icmsMotivo =
      `Simples faturamento para entrega futura (${cfopCodigo}): vedado o destaque de ICMS nesta nota; o imposto será destacado apenas na efetiva saída (${isInterna ? '5.116/5.117' : '6.116/6.117'}).`;
  } else if (isAmostraGratis) {
    icmsCST = '40';
    icmsAliquota = 0;
    icmsBase = 0;
    icmsValor = 0;
    icmsMva = 'Isento';
    icmsFundamentacao = 'Convênio ICMS 29/1990 (Isenção de Amostra Grátis)';
    icmsMotivo =
      'Remessa de amostra grátis de diminuto ou nenhum valor comercial: isenta de ICMS desde que atendidos os requisitos de rotulagem e quantidade do Convênio 29/90.';
  } else if (isOperacaoSemFaturamento) {
    const usaSuspensao = isSuspensaoCFOP && !isNaoIncidenciaCFOP;
    icmsCST = usaSuspensao ? '50' : '41';
    icmsAliquota = 0;
    icmsBase = 0;
    icmsValor = 0;
    icmsMva = 'Não aplicável';
    if (isConserto) {
      icmsFundamentacao =
        ufOrig === 'RS'
          ? 'RICMS-RS, Livro I, Art. 55 (Suspensão) ou CST 41 se bem sem incidência na UF'
          : 'Convênio AE-15/74 / RICMS Estadual (Suspensão ou Não Incidência no conserto/reparo)';
      icmsMotivo =
        `CFOP ${cfopCodigo} refere-se apenas à circulação física de bem para/de conserto ou reparo, sem transferência de titularidade ou faturamento de venda.`;
    } else if (isRemessaContaOrdem) {
      icmsFundamentacao = 'Convênio S/Nº de 1970, Art. 40, § 3º (Venda à Ordem)';
      icmsMotivo =
        `Remessa por conta e ordem de terceiros (${cfopCodigo}): sem destaque de ICMS nesta NF de acompanhamento físico (tributado na NF de venda ao adquirente originário).`;
    } else if (usaSuspensao) {
      icmsFundamentacao =
        cfopObj?.fonte || 'Convênio AE-15/74 e RICMS Estadual (Operação com Suspensão de ICMS)';
      icmsMotivo =
        `Operação enquadrada no CFOP ${cfopCodigo} com suspensão do ICMS (sem transferência de propriedade/faturamento).`;
    } else {
      icmsFundamentacao =
        cfopObj?.fonte || 'LC nº 87/1996, Art. 3º / RICMS Estadual (Não Incidência)';
      icmsMotivo =
        `Operação enquadrada no CFOP ${cfopCodigo} sem incidência de ICMS (não configura circulação mercantil onerosa).`;
    }
  } else if (isSTJaRetidaCFOP) {
    icmsCST = '60';
    icmsAliquota = 0;
    icmsBase = 0;
    icmsValor = 0;
    icmsMva = 'ST já retida';
    icmsFundamentacao = 'Convênio ICMS 142/2018 e RICMS Estadual (ICMS cobrado anteriormente por ST)';
    icmsMotivo =
      `CFOP ${cfopCodigo} de contribuinte substituído: o ICMS já foi retido anteriormente na cadeia, sem destaque de ICMS próprio.`;
    icmsST = {
      ...icmsST,
      aplicavel: false,
      retidaAnteriormente: true,
      cstOuCsosn: isSimples ? '500' : '60',
      fundamentacaoLegal: 'Convênio ICMS 142/2018 e RICMS Estadual (Contribuinte Substituído)',
      motivoEnquadramento: `ICMS-ST já retido na etapa anterior (${cfopCodigo}). Informar vBCSTRet e vICMSSTRet nas tags da NF-e.`,
    };
  } else if (isZFMDesoneradoValido) {
    icmsCST = '40';
    icmsAliquota = 0;
    icmsBase = 0;
    icmsValor = 0;
    valorICMSDesonerado = isSimples
      ? 0
      : Number(((valorTotal * aliqInterestadual) / 100).toFixed(2));
    icmsMva = 'Isento (ZFM/ALC)';
    icmsFundamentacao = 'Convênio ICMS 65/88, Cláusula 1ª (§ 2º) e Convênio ICMS 52/92';
    icmsMotivo = isSimples
      ? 'Isenção/não incidência na saída incentivada para ZFM/ALC (SUFRAMA).'
      : `Isenção de ICMS para produto nacional destinado à ZFM/ALC (SUFRAMA). ICMS desonerado de ${aliqInterestadual}% (${fmtBRL(valorICMSDesonerado)}) deduzido do total da NF-e (cMotDesICMS = 7).`;
  } else if (stAplicavelPorRegra) {
    // Determinação da MVA Original (prioridade: manual > tabela protocolos ST > NCM padrão > fallback 40%)
    let mvaOriginal = 0;
    let origemRegraMVA: DetalheICMSST['origemRegraMVA'] = 'nao_aplicavel';
    if (mvaManual.informado && mvaManual.percentual !== null && mvaManual.percentual > 0) {
      mvaOriginal = mvaManual.percentual;
      origemRegraMVA = 'manual';
    } else if (regraST) {
      mvaOriginal = regraST.mvaOriginal;
      origemRegraMVA = 'tabela_protocolo_st';
    } else if (ncmObj?.mvaOriginalPadrao && ncmObj.mvaOriginalPadrao > 0) {
      mvaOriginal = ncmObj.mvaOriginalPadrao;
      origemRegraMVA = 'ncm_padrao';
    } else {
      mvaOriginal = 40.0;
      origemRegraMVA = 'ncm_padrao';
    }

    const mvaAjustada =
      isInterestadual && aliqInternaDestino > aliqInterestadual
        ? calcularMVAAjustadaST(mvaOriginal, aliqInterestadual, aliqInternaDestino)
        : mvaOriginal;

    // Convênio ICMS 142/2018, Cláusula 11ª, § 1º: Optante do Simples Nacional/MEI usa MVA Original sem ajuste!
    const usouMvaOriginalSimples = isSimples && isInterestadual && mvaAjustada !== mvaOriginal;
    const mvaAplicada = isSimples
      ? mvaOriginal
      : isInterestadual && aliqInternaDestino > aliqInterestadual
      ? mvaAjustada
      : mvaOriginal;

    // Convênio ICMS 142/2018, Cláusula 13ª: IPI integra a Base de Cálculo do ICMS-ST
    const baseST = Number(((valorTotal + ipiValor) * (1 + mvaAplicada / 100)).toFixed(2));
    const icmsProprioTeorico = Number(((valorTotal * aliqOperacaoPropria) / 100).toFixed(2));

    icmsCST = '10';
    icmsBase = valorTotal;
    icmsAliquota = aliqOperacaoPropria;
    icmsValor = icmsProprioTeorico;

    const icmsSTBruto = (baseST * aliqInternaDestino) / 100;
    const valorICMSST = Math.max(0, Number((icmsSTBruto - icmsProprioTeorico).toFixed(2)));
    const fcpSTAliquota = aliqFCPDestino;
    const valorFCPST =
      fcpSTAliquota > 0 ? Number(((baseST * fcpSTAliquota) / 100).toFixed(2)) : 0;

    icmsMva = `${mvaAplicada.toFixed(2).replace('.', ',')}%${usouMvaOriginalSimples ? ' (Original — Simples)' : isInterestadual && !isSimples && mvaAjustada !== mvaOriginal ? ' (Ajustada)' : ' (Original)'}`;

    const protocoloTexto =
      regraST?.protocoloConvenio || 'Convênio ICMS 142/2018 e RICMS Estadual';
    icmsFundamentacao = `${protocoloTexto} (Substituto Tributário)`;
    icmsMotivo = `Operação como Substituto Tributário (${cfopCodigo}): destaca ICMS próprio (${aliqOperacaoPropria}%) e retém ICMS-ST sobre base de ${fmtBRL(baseST)} (MVA ${mvaAplicada.toFixed(2)}%, alíquota destino ${aliqInternaDestino}%).`;

    icmsST = {
      aplicavel: true,
      retidaAnteriormente: false,
      cstOuCsosn: isSimples
        ? regimeEmitente === 'simples_nacional' && etapa2.destinatarioContribuinte
          ? '201'
          : '202'
        : '10',
      cest: regraST?.cest || ncmObj?.cestPadrao,
      protocolo: protocoloTexto,
      mvaOriginal,
      mvaAjustada,
      mvaAplicada,
      usouMvaOriginalSimples,
      aliquotaInternaDestino: aliqInternaDestino,
      aliquotaOperacaoPropria: aliqOperacaoPropria,
      baseCalculoST: baseST,
      icmsProprioDeduzido: icmsProprioTeorico,
      valorICMSST,
      fcpSTAliquota,
      valorFCPST,
      fundamentacaoLegal: isSimples
        ? `${protocoloTexto} (Cláusula 11ª § 1º — MVA Original sem ajuste para Simples Nacional e Cláusula 13ª § 2º)`
        : `${protocoloTexto} (Cláusulas 11ª e 13ª — MVA ${isInterestadual && mvaAjustada !== mvaOriginal ? 'Ajustada' : 'Original'})`,
      motivoEnquadramento: isSimples
        ? `Simples Nacional / MEI substituto (${cfopCodigo}): aplica MVA Original de ${mvaOriginal.toFixed(2)}% sem ajuste interestadual (Conv. 142/18, Cláusula 11ª § 1º) e deduz ICMS próprio teórico de ${aliqOperacaoPropria}% (${fmtBRL(icmsProprioTeorico)}).`
        : `Regime Normal substituto (${cfopCodigo}): aplica ${isInterestadual && mvaAjustada !== mvaOriginal ? `MVA Ajustada de ${mvaAjustada.toFixed(2)}% (Original ${mvaOriginal.toFixed(2)}%)` : `MVA Original de ${mvaOriginal.toFixed(2)}%`} com alíquota interna de ${ufDest} (${aliqInternaDestino}%)${valorFCPST > 0 ? ` + FCP-ST ${fcpSTAliquota}%` : ''}.`,
      formulaCalculo: `BC ST = (${fmtBRL(valorTotal)}${ipiValor > 0 ? ` + IPI ${fmtBRL(ipiValor)}` : ''}) × (1 + ${mvaAplicada.toFixed(2)}%) = ${fmtBRL(baseST)} | ICMS-ST = (${fmtBRL(baseST)} × ${aliqInternaDestino}%) - ${fmtBRL(icmsProprioTeorico)} = ${fmtBRL(valorICMSST)}`,
      origemRegraMVA,
    };
  } else if (isDifalNaoContribuinteCond) {
    // Não contribuinte: Incidência de DIFAL pela EC 87/2015 e LC 190/2022 + FCP do destino
    difalAplicavel = true;
    difalTipo = 'nao_contribuinte_ec87';
    difalResponsavel = 'remetente';
    difalDiferenca = Math.max(0, Number((aliqInternaDestino - aliqInterestadual).toFixed(2)));
    fcpAliquotaAplicada = aliqFCPDestino;
    icmsCST = '00';
    icmsAliquota = aliqInterestadual;
    icmsBase = baseICMSOperacao;
    icmsValor = Number(((icmsBase * aliqInterestadual) / 100).toFixed(2));
    difalValor = Number(((icmsBase * difalDiferenca) / 100).toFixed(2));
    fcpValor =
      fcpAliquotaAplicada > 0 ? Number(((icmsBase * fcpAliquotaAplicada) / 100).toFixed(2)) : 0;
    icmsFundamentacao =
      'Emenda Constitucional nº 87/2015, LC 190/2022, Convênio ICMS 236/2021 e CF/88 Art. 155, § 2º, XI';
    icmsMotivo = `Partilha de DIFAL (${cfopCodigo}): Origem (${ufOrig}) recolhe ${aliqInterestadual}%, e Destino (${ufDest}) recolhe DIFAL de ${difalDiferenca}% (${aliqInternaDestino}% - ${aliqInterestadual}%)${fcpAliquotaAplicada > 0 ? ` + FCP de ${fcpAliquotaAplicada}%` : ''}${ipiIntegraBaseICMS ? ' (IPI incluso na base conforme CF/88 Art. 155, § 2º, XI)' : ''}.`;
  } else if (isDifalContribuinteCond) {
    // Contribuinte comprando para Uso/Consumo ou Ativo Imobilizado (DIFAL Contribuinte — LC 87/96 e LC 190/2022)
    difalAplicavel = true;
    difalTipo = 'contribuinte_uso_consumo_ativo';
    difalResponsavel = 'destinatario';
    difalDiferenca = Math.max(0, Number((aliqInternaDestino - aliqInterestadual).toFixed(2)));
    fcpAliquotaAplicada = aliqFCPDestino;
    icmsCST = '00';
    icmsAliquota = aliqInterestadual;
    icmsBase = baseICMSOperacao;
    icmsValor = Number(((icmsBase * aliqInterestadual) / 100).toFixed(2));
    difalValor = Number(((icmsBase * difalDiferenca) / 100).toFixed(2));
    fcpValor =
      fcpAliquotaAplicada > 0 ? Number(((icmsBase * fcpAliquotaAplicada) / 100).toFixed(2)) : 0;
    difalBaseLegal =
      'CF/88 Art. 155, § 2º, VII e VIII, LC nº 87/1996 e LC nº 190/2022 (DIFAL Contribuinte — Uso/Consumo ou Ativo Imobilizado)';
    icmsFundamentacao =
      'Resolução do Senado nº 22/1989, LC nº 87/1996 e CF/88 Art. 155, § 2º, XI';
    icmsMotivo = `Venda interestadual a contribuinte para ${etapa2.finalidadeMercadoria === 'consumo' ? 'Uso e Consumo' : 'Ativo Imobilizado'} (${cfopCodigo}): remetente destaca ICMS interestadual (${aliqInterestadual}%)${ipiIntegraBaseICMS ? ' com IPI na base' : ''}, e o destinatário em ${ufDest} recolhe DIFAL Contribuinte (${difalDiferenca}%${fcpAliquotaAplicada > 0 ? ` + FCP ${fcpAliquotaAplicada}%` : ''}; conferir cálculo "base dupla" do RICMS/${ufDest}).`;
  } else if (isInterna && !isSimples && isNcmCestaBasicaICMS && aliqInternaOrigem > 7.0) {
    // Exceção NCM Cesta Básica em operação interna (Convênio ICMS 128/94 → carga efetiva 7% via CST 20)
    const fatorReducao = 7.0 / aliqInternaOrigem;
    const percentualReducao = Number(((1 - fatorReducao) * 100).toFixed(2));
    icmsCST = '20';
    icmsAliquota = aliqInternaOrigem;
    icmsBase = Number((baseICMSOperacao * fatorReducao).toFixed(2));
    icmsValor = Number(((icmsBase * icmsAliquota) / 100).toFixed(2));
    icmsFundamentacao = `Convênio ICMS 128/1994 e ${ufOrigObj?.fonte || `RICMS/${ufOrig}`} (Redução de Base de Cálculo — Cesta Básica)`;
    icmsMotivo = `Exceção NCM Cesta Básica (${ncmObj?.codigo}): redução de ${percentualReducao}% na base de cálculo interna em ${ufOrig} (CST 20), resultando em carga tributária efetiva de 7,00% sobre ${fmtBRL(baseICMSOperacao)}.`;
  } else {
    // Operação normal (inclusive consignação 5.917/6.917, bonificação 5.910/6.910, remessa entrega futura 5.116/5.117)
    icmsBase = baseICMSOperacao;
    icmsValor = Number(((icmsBase * icmsAliquota) / 100).toFixed(2));
    if (isRegimeEspecial) {
      icmsFundamentacao = `${icmsFundamentacao} + Termo de Acordo / Regime Especial (TARE)`;
      icmsMotivo = `${icmsMotivo} (Regime Especial: validar eventual crédito presumido, diferimento ou carga efetiva específica do TARE.)`;
    }
  }

  // Ajuste de ICMS para optantes do Simples Nacional / MEI (CSOSN) e ADI 5464 STF
  const eraDifalNaoContribuinteAntesSimples =
    difalAplicavel && difalTipo === 'nao_contribuinte_ec87';

  if (isSimples && !isExportacao) {
    // STF ADI 5464: optante do Simples Nacional é dispensado APENAS do DIFAL EC 87/2015 (não contribuinte)
    // No DIFAL de contribuinte (uso/consumo/ativo), o destinatário contribuinte permanece responsável!
    if (difalTipo === 'nao_contribuinte_ec87') {
      difalAplicavel = false;
      difalTipo = 'dispensado_simples';
      difalResponsavel = 'nenhum';
      difalDiferenca = 0;
      difalValor = 0;
      fcpAliquotaAplicada = 0;
      fcpValor = 0;
      difalBaseLegal = 'STF ADI 5464 (Dispensa de DIFAL EC 87/2015 para optantes do Simples Nacional/MEI)';
    }

    if (isImportacaoCFOP) {
      if (cfopLimpo === '3201' || cfopLimpo === '3949') {
        icmsCST = '400';
        icmsAliquota = 0;
        icmsBase = 0;
        icmsValor = 0;
        icmsFundamentacao = 'Lei Complementar nº 123/2006 e Resolução CGSN nº 140/2018 (CSOSN 400)';
        icmsMotivo = `Optante pelo Simples Nacional em retorno/entrada aduaneira sem tributação de ICMS (${cfopCodigo}): utilizar CSOSN 400.`;
      } else {
        icmsCST = '900';
        icmsAliquota = aliqInternaOrigem;
        icmsBase = valorTotal;
        icmsValor = Number(((icmsBase * icmsAliquota) / 100).toFixed(2));
        icmsFundamentacao = `CF/88 Art. 155, § 2º, IX, "a" e Resolução CGSN nº 140/2018 (CSOSN 900 - ICMS-Importação)`;
        icmsMotivo = `Na importação direta (${cfopCodigo}), mesmo o optante pelo Simples Nacional recolhe ICMS-Importação à alíquota interna de ${ufOrig} (${aliqInternaOrigem}%) utilizando CSOSN 900.`;
      }
    } else if (
      isOperacaoSemFaturamento ||
      isTransferencia ||
      isAtivoImobilizadoSaida ||
      isSimplesFaturamento ||
      isAmostraGratis ||
      isZFMDesoneradoValido
    ) {
      icmsCST = '400';
      icmsAliquota = 0;
      icmsBase = 0;
      icmsValor = 0;
      icmsFundamentacao = 'Lei Complementar nº 123/2006 e Resolução CGSN nº 140/2018 (CSOSN 400)';
      icmsMotivo = isZFMDesoneradoValido
        ? `Optante pelo Simples Nacional/MEI em venda incentivada para ZFM/ALC (${cfopCodigo}): isenção/não incidência com CSOSN 400.`
        : `Optante pelo Simples Nacional/MEI em operação sem tributação de ICMS (${cfopCodigo}): utilizar CSOSN 400.`;
    } else if (isSTJaRetidaCFOP) {
      icmsCST = '500';
      icmsAliquota = 0;
      icmsBase = 0;
      icmsValor = 0;
      icmsFundamentacao = 'Resolução CGSN nº 140/2018 (CSOSN 500 - Substituído)';
      icmsMotivo = `Optante pelo Simples Nacional/MEI em operação com ST retida anteriormente (${cfopCodigo}).`;
    } else if (icmsST.aplicavel) {
      icmsCST = icmsST.cstOuCsosn || '201';
      icmsAliquota = 0;
      icmsBase = 0;
      icmsValor = 0; // ICMS próprio recolhido no DAS; ICMS-ST recolhido separadamente com MVA Original!
      icmsFundamentacao =
        'Resolução CGSN nº 140/2018 (CSOSN 201/202) e Convênio ICMS 142/2018, Cláusula 11ª § 1º e Cláusula 13ª § 2º';
      icmsMotivo = `Optante pelo Simples Nacional/MEI como Substituto Tributário (${cfopCodigo}): sem destaque de ICMS próprio (CSOSN ${icmsCST}), com retenção de ICMS-ST (${fmtBRL(icmsST.valorICMSST)}) utilizando MVA Original de ${icmsST.mvaOriginal.toFixed(2)}% sem ajuste interestadual.`;
    } else {
      icmsCST = '102';
      icmsAliquota = 0;
      icmsBase = 0;
      icmsValor = 0;
      icmsFundamentacao = eraDifalNaoContribuinteAntesSimples
        ? 'Lei Complementar nº 123/2006, Resolução CGSN nº 140/2018 e STF ADI 5464 (Dispensa de DIFAL)'
        : difalTipo === 'contribuinte_uso_consumo_ativo'
        ? 'Lei Complementar nº 123/2006 (CSOSN 102) e LC nº 87/1996 (DIFAL devido pelo Destinatário Contribuinte)'
        : 'Lei Complementar nº 123/2006 e Resolução CGSN nº 140/2018 (Simples Nacional)';
      icmsMotivo = eraDifalNaoContribuinteAntesSimples
        ? 'Emitente optante pelo Simples Nacional/MEI: sem destaque de ICMS próprio (CSOSN 102) e dispensado do DIFAL EC 87/2015 nas vendas interestaduais a não contribuintes (STF ADI 5464).'
        : difalTipo === 'contribuinte_uso_consumo_ativo'
        ? `Emitente Simples Nacional/MEI (CSOSN 102, sem destaque próprio). Por tratar-se de venda interestadual para contribuinte (${etapa2.finalidadeMercadoria === 'consumo' ? 'uso/consumo' : 'ativo imobilizado'}), o destinatário em ${ufDest} permanece sujeito ao recolhimento do DIFAL Contribuinte.`
        : isEntradaCFOP
        ? `Operação de entrada (${cfopCodigo}) em empresa do Simples Nacional sem destaque próprio de ICMS (CSOSN 102 quando emissão própria).`
        : 'Emitente optante pelo Simples Nacional/MEI emitindo com CSOSN 102 sem destaque de ICMS próprio na NF-e.';
    }
  }

  // 5. Imposto de Importação (II)
  const iiCST = isImportacaoCFOP && cfopLimpo !== '3201' && cfopLimpo !== '3949' ? '01' : '';
  const iiAliquota = 0;
  const iiValor = 0;

  // 6. PIS e COFINS conforme Regime Tributário, Natureza do CFOP, NCM e Tema 69 STF (Lei 14.592/2023)
  let pisCST = '01';
  let cofinsCST = '01';
  let pisAliquota = 1.65;
  let cofinsAliquota = 7.60;
  let exclusaoICMSBasePISCOFINS = 0;
  let pisBase = valorTotal;
  let pisFundamentacao =
    'Leis nº 10.637/2002 e 10.833/2003 (Não-Cumulativo) c/c STF Tema 69 e Lei nº 14.592/2023';
  let pisMotivo = 'Operação tributada no regime não-cumulativo (PIS 1,65% e COFINS 7,60%).';

  if (regimeEmitente === 'lucro_presumido') {
    pisCST = '01';
    cofinsCST = '01';
    pisAliquota = 0.65;
    cofinsAliquota = 3.00;
    pisFundamentacao =
      'Lei nº 9.718/1998 (Regime Cumulativo) c/c STF Tema 69 (RE 574.706) e Lei nº 14.592/2023';
    pisMotivo = 'Operação tributada no regime cumulativo (PIS 0,65% e COFINS 3,00%).';
  } else if (isRegimeEspecial) {
    pisFundamentacao =
      'Leis nº 10.637/2002 e 10.833/2003 + Regime Especial / Lei nº 14.592/2023 (STF Tema 69)';
    pisMotivo =
      'Regime Especial simulado sob padrão não-cumulativo (PIS 1,65% e COFINS 7,60%) — conferir eventual regime específico federal.';
  } else if (isSimples) {
    pisCST = '99';
    cofinsCST = '99';
    pisAliquota = 0;
    cofinsAliquota = 0;
    pisBase = 0;
    pisFundamentacao = 'Lei Complementar nº 123/2006 (Simples Nacional)';
    pisMotivo =
      'Tributos recolhidos unificadamente no PGDAS-D. Sem destaque de PIS e COFINS no documento fiscal.';
  }

  const isSemReceitaPISCOFINS =
    isOperacaoSemFaturamento ||
    isTransferencia ||
    isAtivoImobilizadoSaida ||
    isConsignacao ||
    isBonificacaoOuBrinde ||
    isAmostraGratis ||
    isUsoConsumoEntrada;

  if (isExportacao) {
    pisCST = '08';
    cofinsCST = '08';
    pisAliquota = 0;
    cofinsAliquota = 0;
    pisBase = 0;
    pisFundamentacao = 'CF/88 Art. 149, § 2º, I e Lei nº 10.833/2003, Art. 6º';
    pisMotivo = 'Não-incidência de PIS e COFINS sobre receitas de exportação.';
  } else if (isImportacaoCFOP) {
    if (cfopLimpo === '3201' || cfopLimpo === '3949') {
      pisCST = '98';
      cofinsCST = '98';
      pisAliquota = 0;
      cofinsAliquota = 0;
      pisBase = 0;
      pisFundamentacao = 'Lei nº 10.865/2004 (Reimportação / Outras Entradas do Exterior)';
      pisMotivo = `Operação ${cfopCodigo} sem incidência padrão de PIS/COFINS-Importação.`;
    } else {
      pisCST = isSimples || regimeEmitente === 'lucro_presumido' ? '70' : '50';
      cofinsCST = pisCST;
      pisAliquota = 2.1;
      cofinsAliquota = 9.65;
      pisBase = valorTotal;
      pisFundamentacao = 'Lei nº 10.865/2004, Art. 8º e Art. 15 (PIS/COFINS-Importação)';
      pisMotivo =
        pisCST === '50'
          ? `Importação (${cfopCodigo}): incidência de PIS-Importação (2,10%) e COFINS-Importação (9,65%) no desembaraço com direito a crédito no Lucro Real (CST 50).`
          : `Importação (${cfopCodigo}): incidência de PIS-Importação (2,10%) e COFINS-Importação (9,65%) no desembaraço sem aproveitamento de crédito neste regime (CST 70).`;
    }
  } else if (isSemReceitaPISCOFINS && !isSimples) {
    if (isUsoConsumoEntrada) {
      pisCST = '70';
      cofinsCST = '70';
      pisAliquota = 0;
      cofinsAliquota = 0;
      pisBase = 0;
      pisFundamentacao = 'Leis nº 10.637/2002 e 10.833/2003, Art. 3º (Aquisição sem Direito a Crédito)';
      pisMotivo = `Aquisição de material para uso ou consumo (${cfopCodigo}): sem direito a crédito de PIS/COFINS (CST 70).`;
    } else {
      pisCST = isEntradaCFOP ? '98' : '08';
      cofinsCST = pisCST;
      pisAliquota = 0;
      cofinsAliquota = 0;
      pisBase = 0;
      if (isAtivoImobilizadoSaida) {
        pisFundamentacao =
          'Lei nº 9.718/1998, Art. 3º, § 2º, IV; Lei nº 10.637/2002, Art. 1º, § 3º, II; Lei nº 10.833/2003, Art. 1º, § 3º, II';
        pisMotivo = `Venda de ativo imobilizado (${cfopCodigo}) é excluída da base de PIS/COFINS (CST 08).`;
      } else if (isTransferencia) {
        pisFundamentacao = 'STJ Súmula 166 e Leis nº 10.637/2002 e 10.833/2003 (Sem Receita)';
        pisMotivo = `Transferência entre estabelecimentos da mesma empresa (${cfopCodigo}) não gera receita tributável por PIS/COFINS.`;
      } else {
        pisFundamentacao =
          'Lei nº 9.718/1998, Art. 2º, Lei nº 10.637/2002 e Lei nº 10.833/2003 (Sem Receita/Faturamento)';
        pisMotivo =
          `Operação ${cfopCodigo} não gera receita operacional nem transferência onerosa definitiva, portanto não há incidência de PIS/COFINS (CST ${pisCST}).`;
      }
    }
  } else if (isSimplesFaturamento && isEntradaCFOP && !isSimples) {
    pisCST = '70';
    cofinsCST = '70';
    pisAliquota = 0;
    cofinsAliquota = 0;
    pisBase = 0;
    pisFundamentacao = 'Leis nº 10.637/2002 e 10.833/2003 (Simples Faturamento na Entrada)';
    pisMotivo = `Entrada de simples faturamento (${cfopCodigo}): crédito somente após entrada física dos bens.`;
  } else if (isZFMouALC && (etapa2.destinatarioContribuinte || ['6109', '6110'].includes(cfopLimpo))) {
    pisCST = '06';
    cofinsCST = '06';
    pisAliquota = 0;
    cofinsAliquota = 0;
    pisBase = 0;
    pisFundamentacao = 'Lei nº 10.996/2004, Art. 2º (Alíquota Zero ZFM/ALC)';
    pisMotivo =
      'Redução a zero das alíquotas da contribuição para o PIS/PASEP e da COFINS incidentes sobre as receitas de vendas para a ZFM/ALC.';
  } else if (!isSimples && ncmObj?.regimePISCOFINS === 'aliquota_zero') {
    pisCST = isEntradaCFOP ? '73' : '06';
    cofinsCST = pisCST;
    pisAliquota = 0;
    cofinsAliquota = 0;
    pisBase = 0;
    pisFundamentacao = 'Lei nº 10.925/2004 e Tabela 4.3.13 EFD-Contribuições (Alíquota Zero por NCM)';
    pisMotivo = `NCM ${ncmObj.codigo} enquadrado em alíquota zero de PIS e COFINS (${isEntradaCFOP ? 'CST 73 na aquisição' : 'CST 06 na saída'}).`;
  } else if (!isSimples && ncmObj?.regimePISCOFINS === 'monofasico') {
    const ehRevendaMonofasico =
      isRevendaComercialCFOP || etapa2.finalidadeMercadoria !== 'industrializacao';
    if (ehRevendaMonofasico) {
      pisCST = isEntradaCFOP ? '70' : '04';
      cofinsCST = pisCST;
      pisAliquota = 0;
      cofinsAliquota = 0;
      pisBase = 0;
      pisFundamentacao =
        'Leis nº 10.147/2000, 10.485/2002 e Tabela 4.3.10 EFD-Contribuições (Monofásico — Revenda)';
      pisMotivo = `NCM ${ncmObj.codigo} sujeito à tributação monofásica de PIS/COFINS: revenda/comercialização com alíquota zero (CST ${pisCST}), pois o tributo já foi concentrado na indústria/importador.`;
    } else {
      pisCST = isEntradaCFOP ? '50' : '02';
      cofinsCST = pisCST;
      pisFundamentacao =
        'Leis nº 10.147/2000, 10.485/2002 e Tabela 4.3.10 EFD-Contribuições (Monofásico — Indústria/Importador)';
      pisMotivo = `NCM ${ncmObj.codigo} sujeito à tributação monofásica com alíquota diferenciada na indústria/fabricante (CST ${pisCST}). Confira a alíquota concentrada específica do capítulo na Tabela 4.3.10.`;
    }
  } else if (!isSimples && ncmObj?.regimePISCOFINS === 'substituicao') {
    pisCST = isEntradaCFOP ? '75' : '05';
    cofinsCST = pisCST;
    pisAliquota = 0;
    cofinsAliquota = 0;
    pisBase = 0;
    pisFundamentacao = 'Tabela 4.3.11 EFD-Contribuições (Substituição Tributária de PIS/COFINS)';
    pisMotivo = `NCM ${ncmObj.codigo} sujeito à substituição tributária de PIS/COFINS (CST ${pisCST}).`;
  } else if (isSimples && ncmObj?.regimePISCOFINS === 'monofasico') {
    pisMotivo = `Optante pelo Simples Nacional: NCM ${ncmObj.codigo} possui PIS/COFINS monofásico — segregar a receita no PGDAS-D (LC 123/06, Art. 18, § 4º-A) para abater a parcela de PIS/COFINS do DAS.`;
  }

  // STF Tema 69 (RE 574.706) e Lei nº 14.592/2023: Exclusão obrigatória do ICMS destacado da base de PIS/COFINS
  if (!isSimples && !isImportacaoCFOP && !isExportacao && pisBase > 0 && icmsValor > 0) {
    exclusaoICMSBasePISCOFINS = icmsValor;
    pisBase = Math.max(0, Number((valorTotal - exclusaoICMSBasePISCOFINS).toFixed(2)));
    pisMotivo = `${pisMotivo} Base líquida de ${fmtBRL(pisBase)} após exclusão do ICMS destacado de ${fmtBRL(exclusaoICMSBasePISCOFINS)} (STF Tema 69 / Lei 14.592/2023).`;
  }

  const pisValor = Number(((pisBase * pisAliquota) / 100).toFixed(2));
  const cofinsValor = Number(((pisBase * cofinsAliquota) / 100).toFixed(2));

  // 7. Reforma Tributária (CBS e IBS — EC 132/2023, LC 214/2025 e NT 2025.002)
  const CBS_ALIQ_REF = 8.8;
  const IBS_ALIQ_REF = 17.7;
  const regraRtcNcm = resolverRegraRtcPorNcm(ncmLimpo, ncmObj);

  let cbsCST = '000';
  let ibsCST = '000';
  let cbsCClassTrib = '000001';
  let ibsCClassTrib = '000001';
  let cbsAliquota = CBS_ALIQ_REF;
  let ibsAliquota = IBS_ALIQ_REF;
  let reformaBase = valorTotal;
  let reformaFundamentacao =
    'Emenda Constitucional nº 132/2023, CF/88 Art. 156-A e LC nº 214/2025 (NT 2025.002)';
  let reformaMotivo =
    'Operação geral tributada integralmente no destino pelo novo modelo de IVA Dual (CBS 8,8% + IBS 17,7%).';

  const isSemFatoGeradorReforma =
    isOperacaoSemFaturamento ||
    isTransferencia ||
    isAtivoImobilizadoSaida ||
    isSimplesFaturamento ||
    isConsignacao ||
    isBonificacaoOuBrinde ||
    isAmostraGratis ||
    (isImportacaoCFOP && (cfopLimpo === '3201' || cfopLimpo === '3949'));

  if (isExportacao) {
    cbsCST = '410';
    ibsCST = '410';
    cbsCClassTrib = '410004';
    ibsCClassTrib = '410004';
    cbsAliquota = 0;
    ibsAliquota = 0;
    reformaBase = 0;
    reformaFundamentacao = 'CF/88 Art. 156-A, § 1º, III e LC nº 214/2025, Art. 8º (Imunidade Exportação)';
    reformaMotivo =
      'Princípio do destino e imunidade completa de CBS e IBS nas exportações (com manutenção de créditos).';
  } else if (isSemFatoGeradorReforma) {
    cbsCST = '410';
    ibsCST = '410';
    cbsCClassTrib = '410001';
    ibsCClassTrib = '410001';
    cbsAliquota = 0;
    ibsAliquota = 0;
    reformaBase = 0;
    reformaFundamentacao = 'LC nº 214/2025, Art. 4º e Art. 6º (Operação Não Onerosa / Sem Fornecimento)';
    reformaMotivo =
      `Não incidência de IBS/CBS nesta NF: o CFOP ${cfopCodigo} não configura fornecimento oneroso definitivo neste documento.`;
  } else if (isZFMouALC && (etapa2.destinatarioContribuinte || ['6109', '6110'].includes(cfopLimpo))) {
    cbsCST = '810';
    ibsCST = '810';
    cbsCClassTrib = '810001';
    ibsCClassTrib = '810001';
    cbsAliquota = 0;
    ibsAliquota = 0;
    reformaBase = 0;
    reformaFundamentacao = 'EC nº 132/2023 e LC nº 214/2025, Art. 445 a 456 (ZFM / ALC)';
    reformaMotivo =
      'Tratamento tributário favorecido da ZFM/ALC mantido pela LC 214/2025 (Alíquota Zero de IBS/CBS e crédito presumido).';
  } else if (isSimples) {
    cbsCST = '400';
    ibsCST = '400';
    cbsCClassTrib = 'SIMPLES_DAS';
    ibsCClassTrib = 'SIMPLES_DAS';
    cbsAliquota = 0;
    ibsAliquota = 0;
    reformaBase = 0;
    reformaFundamentacao = 'LC nº 214/2025, Art. 41 e LC nº 123/2006 (Simples Nacional no IVA Dual)';
    reformaMotivo =
      'Optante pelo Simples Nacional / MEI: recolhimento unificado via DAS sem destaque separado padrão de CBS/IBS (permitida opção semestral pelo recolhimento regular "por fora" para transferir crédito integral B2B).';
  } else if (regraRtcNcm) {
    cbsCST = regraRtcNcm.cst;
    ibsCST = regraRtcNcm.cst;
    cbsCClassTrib = regraRtcNcm.cClassTrib;
    ibsCClassTrib = regraRtcNcm.cClassTrib;
    cbsAliquota = Number((CBS_ALIQ_REF * (1 - regraRtcNcm.pRedCBS / 100)).toFixed(2));
    ibsAliquota = Number((IBS_ALIQ_REF * (1 - regraRtcNcm.pRedIBS / 100)).toFixed(2));
    if (cbsAliquota === 0 && ibsAliquota === 0) {
      reformaBase = 0;
    }
    reformaFundamentacao = regraRtcNcm.baseLegal;
    reformaMotivo =
      regraRtcNcm.pRedCBS === 100
        ? `${regraRtcNcm.categoria}: alíquota reduzida a 0% para CBS e IBS conforme LC 214/2025.`
        : regraRtcNcm.pRedCBS > 0
        ? `${regraRtcNcm.categoria}: redução de ${regraRtcNcm.pRedCBS}% sobre as alíquotas de referência (CBS ${cbsAliquota}% e IBS ${ibsAliquota}%).`
        : `${regraRtcNcm.categoria}: tributação conforme enquadramento específico da LC 214/2025.`;
  }

  const cbsValor = Number(((reformaBase * cbsAliquota) / 100).toFixed(2));
  const ibsValor = Number(((reformaBase * ibsAliquota) / 100).toFixed(2));

  // 8. Nível de Confiabilidade, Checklist SEFAZ e Alertas Fiscais
  const checklist = [
    {
      item: 'Validação do NCM na Tabela Oficial da Receita',
      status: ncmExatoCatalogo || ncmResolvidoUniversal ? ('ok' as const) : ('alerta' as const),
      mensagem: ncmExatoCatalogo
        ? `NCM ${ncmExatoCatalogo.codigo} validado na TIPI/Siscomex (${ncmExatoCatalogo.descricao.slice(0, 65)}${ncmExatoCatalogo.descricao.length > 65 ? '...' : ''})`
        : ncmResolvidoUniversal
        ? `NCM ${ncmResolvidoUniversal.codigo} estruturado pelo Capítulo ${ncmLimpo.slice(0, 2)} da TIPI (${ncmResolvidoUniversal.descricao.slice(0, 60)}...)`
        : `NCM ${etapa3.ncmCodigo} incompleto ou fora do padrão de 8 dígitos. Recomenda-se confirmar a classificação.`,
    },
    {
      item: 'Compatibilidade CFOP × Rota UF × Natureza',
      status: cfopIncompativelComUF ? ('alerta' as const) : ('ok' as const),
      mensagem: cfopIncompativelComUF
        ? `Atenção SEFAZ: CFOP ${cfopCodigo} (${abrangencia}) conflita com a rota ${ufOrig} ➔ ${ufDest} — risco de Rejeição 518/519/733.`
        : isOperacaoSemFaturamento
        ? `CFOP ${cfopCodigo} reconhecido como operação sem faturamento/venda (suspensão ou não incidência tributária aplicada).`
        : isTransferencia
        ? `CFOP ${cfopCodigo} tratado conforme ADC 49 STF e LC 204/2023 (não incidência na transferência).`
        : `CFOP ${cfopCodigo} compatível com ${abrangencia} (${ufOrig} ➔ ${ufDest}) e tabela oficial de UFs (${ufOrig}: ${aliqInternaOrigem}% | ${ufDest}: ${aliqInternaDestino}%).`,
    },
    {
      item: 'Enquadramento ICMS-ST, Inscrição Estadual, DIFAL e FCP',
      status:
        (isVendaNaoContribuinteCFOP && etapa2.destinatarioPossuiIE) ||
        (isSTSubstitutoCFOP && etapa2.finalidadeMercadoria === 'industrializacao')
          ? ('alerta' as const)
          : ('ok' as const),
      mensagem: icmsST.aplicavel
        ? `ICMS-ST calculado (${icmsST.usouMvaOriginalSimples ? 'MVA Original Simples' : isInterestadual && icmsST.mvaAjustada !== icmsST.mvaOriginal ? 'MVA Ajustada' : 'MVA Original'} ${icmsST.mvaAplicada.toFixed(2)}%): ST ${fmtBRL(icmsST.valorICMSST)}${icmsST.valorFCPST > 0 ? ` + FCP-ST ${fmtBRL(icmsST.valorFCPST)}` : ''}.`
        : icmsST.retidaAnteriormente
        ? `Contribuinte substituído (${cfopCodigo}): ICMS-ST já retido anteriormente (CST/CSOSN ${icmsCST}).`
        : isOperacaoSemFaturamento || isTransferencia || isAtivoImobilizadoSaida || isSimplesFaturamento
        ? 'Operação sem fato gerador de ICMS mercantil; DIFAL e ST não aplicáveis.'
        : isVendaNaoContribuinteCFOP && etapa2.destinatarioPossuiIE
        ? `CFOP ${cfopCodigo} é exclusivo para NÃO contribuinte. Confirme na Etapa 2 se o destinatário realmente não possui IE.`
        : eraDifalNaoContribuinteAntesSimples
        ? 'Simples Nacional/MEI dispensado do DIFAL EC 87/2015 em vendas interestaduais a não contribuintes (STF ADI 5464).'
        : difalAplicavel && difalTipo === 'contribuinte_uso_consumo_ativo'
        ? `Destinatário contribuinte (${etapa2.finalidadeMercadoria === 'consumo' ? 'Uso/Consumo' : 'Ativo Imobilizado'}): DIFAL Contribuinte de ${difalDiferenca}% devido pelo destinatário em ${ufDest}.`
        : difalAplicavel
        ? `Destinatário sem IE: calculada partilha de DIFAL (${difalDiferenca}%) para ${ufDest}${fcpAliquotaAplicada > 0 ? ` + FCP ${fcpAliquotaAplicada}%` : ''}.`
        : 'Destinatário contribuinte de ICMS sem exigência de DIFAL ou ST nesta operação.',
    },
    {
      item: 'Benefícios Fiscais, Tema 69 STF, NCM e ZFM/ALC',
      status: isZFMouALC && isOrigemImportada ? ('alerta' as const) : ('ok' as const),
      mensagem:
        isZFMouALC && isOrigemImportada
          ? 'Atenção ZFM/ALC: produto com origem estrangeira/importada não usufrui de isenção do ICMS do Convênio 65/88 (aplica-se 4% da Res. SF 13/2012).'
          : isZFMDesoneradoValido
          ? `Isenção ZFM/ALC aplicada (Convênio 65/88 e Lei 10.996/04)${valorICMSDesonerado > 0 ? ` com desoneração de ${fmtBRL(valorICMSDesonerado)}` : ''}.`
          : ncmObj?.regimePISCOFINS === 'monofasico'
          ? `NCM ${ncmObj.codigo} com PIS/COFINS Monofásico (${isSimples ? 'segregar receita no PGDAS-D' : `CST ${pisCST}`}).`
          : ncmObj?.regimePISCOFINS === 'aliquota_zero'
          ? `NCM ${ncmObj.codigo} com Alíquota Zero de PIS/COFINS (CST ${pisCST} — Lei 10.925/04)${icmsCST === '20' ? ' e Cesta Básica ICMS 7% (CST 20)' : ''}.`
          : exclusaoICMSBasePISCOFINS > 0
          ? `Exclusão do ICMS (${fmtBRL(exclusaoICMSBasePISCOFINS)}) da base de PIS/COFINS aplicada conforme STF Tema 69 e Lei 14.592/2023.`
          : 'Tributação aplicada conforme regime tributário, NCM e tabelas de referência.',
    },
  ];

  const alertas: string[] = [];
  if (!ncmObj) {
    alertas.push(
      'NCM informado possui menos de 8 dígitos ou está fora do padrão TIPI. Verifique o código completo.'
    );
  }
  if (cfopIncompativelComUF) {
    alertas.push(
      `Inconsistência Territorial (SEFAZ Rejeição 518/519/733): o CFOP ${cfopCodigo} é de abrangência ${abrangencia.toUpperCase()}, mas as UFs configuradas são ${ufOrig} ➔ ${ufDest}. Ajuste o CFOP ou a UF de destino.`
    );
  }
  if (isZFMouALC && isOrigemImportada) {
    alertas.push(
      'Restrição Convênio ICMS 65/88 (ZFM/ALC): a isenção de ICMS na remessa para Zona Franca de Manaus e Áreas de Livre Comércio alcança exclusivamente produtos industrializados de origem nacional. Para origem estrangeira/importada (códigos 1, 2, 3 ou 8), tributa-se ICMS a 4% (Resolução SF 13/2012).'
    );
  }
  if (isSTSubstitutoCFOP && etapa2.finalidadeMercadoria === 'industrializacao') {
    alertas.push(
      `Exceção de Industrialização (Convênio ICMS 142/2018, Cláusula 9ª, I): mercadorias destinadas a industrialização em geral não sofrem ICMS-ST, salvo previsão expressa no protocolo. Você selecionou manualmente o CFOP ${cfopCodigo}; confirme se a ST realmente se aplica.`
    );
  }
  if (
    ncmObj?.temST &&
    !icmsST.aplicavel &&
    !isSTJaRetidaCFOP &&
    !operacaoBloqueiaST &&
    etapa2.finalidadeMercadoria === 'comercializacao'
  ) {
    alertas.push(
      `Substituição Tributária (ICMS-ST): o NCM ${ncmObj.codigo} possui incidência potencial de ST${ncmObj.cestPadrao ? ` (CEST ${ncmObj.cestPadrao})` : ''}, porém não há protocolo interestadual ativo cadastrado entre ${ufOrig} e ${ufDest}. Confirme se existe protocolo CONFAZ vigente ou informe a MVA para simular o ICMS-ST.`
    );
  }
  if (
    ncmObj?.temST &&
    etapa2.finalidadeMercadoria === 'industrializacao' &&
    !isSTSubstitutoCFOP &&
    !isOperacaoSemFaturamento &&
    !isExterior
  ) {
    alertas.push(
      `Inaplicabilidade de ICMS-ST na Industrialização (Convênio ICMS 142/2018, Cláusula 9ª, I): embora o NCM ${ncmObj.codigo} conste em listas de ST, a venda como insumo para estabelecimento industrial não sofre retenção de ICMS-ST.`
    );
  }
  if (icmsST.aplicavel && icmsST.valorFCPST > 0 && ufDestObj?.observacoesFiscais) {
    alertas.push(
      `FCP-ST no Destino (${ufDest} — ${icmsST.fcpSTAliquota}% = ${fmtBRL(icmsST.valorFCPST)}): ${ufDestObj.observacoesFiscais}. Confirme se o NCM ${etapa3.ncmCodigo} está listado no decreto estadual de FCP.`
    );
  }
  if (difalAplicavel && difalTipo === 'contribuinte_uso_consumo_ativo') {
    alertas.push(
      `DIFAL Contribuinte (${ufDest}): na aquisição interestadual para ${etapa2.finalidadeMercadoria === 'consumo' ? 'uso/consumo' : 'ativo imobilizado'}, o recolhimento do DIFAL cabe ao destinatário (ou ao remetente como DIFAL-ST se houver protocolo de ST para o NCM). Verifique se ${ufDest} exige metodologia de "base dupla" (LC 190/2022).`
    );
  }
  if (difalAplicavel && fcpValor > 0) {
    alertas.push(
      `Adicional de FCP no Destino (${ufDest} — ${fcpAliquotaAplicada}% = ${fmtBRL(fcpValor)}): ${ufDestObj?.observacoesFiscais || 'Verifique na legislação estadual se o NCM está alcançado pelo FCP.'}`
    );
  }
  if (isRegimeEspecial) {
    alertas.push(
      'Regime Especial / Termo de Acordo (TARE): a simulação utilizou a matriz padrão do Lucro Real. Aplique os percentuais de crédito presumido, diferimento ou carga tributária efetiva específicos do seu termo de acordo.'
    );
  }
  if (regraRtcNcm?.sujeitoIS && !isExportacao && !isSemFatoGeradorReforma) {
    alertas.push(
      `Imposto Seletivo (Reforma Tributária — LC 214/2025): o NCM ${etapa3.ncmCodigo} está sujeito à incidência adicional de Imposto Seletivo (alíquota de referência ~${regraRtcNcm.pISReferencia}%).`
    );
  }
  if (isConserto) {
    alertas.push(
      `Atenção ERP (${cfopCodigo}): a não tributação vale apenas para o bem em conserto/reparo. Peças novas aplicadas devem ser faturadas em item separado (CFOP 5.101/5.102/5.405) com tributação normal, e a mão de obra via NFS-e (ISS).`
    );
  } else if (isTransferencia) {
    alertas.push(
      `Transferência (${cfopCodigo}): apesar da não incidência do ICMS (ADC 49 / LC 204/2023), verifique no ERP a opção de transferência de crédito de ICMS ao estabelecimento destino (Convênio ICMS 109/2024).`
    );
  } else if (isSimplesFaturamento) {
    alertas.push(
      `Simples Faturamento (${cfopCodigo}): ICMS não destacado nesta nota (será destacado na remessa ${isInterna ? '5.116/5.117' : '6.116/6.117'}). Destaque de IPI é facultativo (RIPI Art. 407).`
    );
  } else if (isRemessaEntregaFutura) {
    alertas.push(
      `Entrega Futura (${cfopCodigo}): referenciar a NF de simples faturamento (${isInterna ? '5.922' : '6.922'}) e evitar bitributação de PIS/COFINS caso já reconhecidos no faturamento antecipado.`
    );
  } else if (isConsignacao) {
    alertas.push(
      `Consignação (${cfopCodigo}): ICMS e IPI seguem Ajuste SINIEF 02/93, sem incidência de PIS/COFINS nesta remessa/devolução (faturamento tributado apenas na venda efetiva 5.113/5.114/5.115).`
    );
  } else if (isBonificacaoOuBrinde) {
    alertas.push(
      `Bonificação/Doação (${cfopCodigo}): saída gratuita sem receita para PIS/COFINS (CST ${pisCST}). Caso seja brinde distribuído a consumidor, observe regras específicas do RICMS/${ufOrig}.`
    );
  } else if (isAtivoImobilizadoSaida) {
    alertas.push(
      `Ativo Imobilizado (${cfopCodigo}): verifique se o bem cumpriu o prazo mínimo de permanência no ativo exigido pelo RICMS/${ufOrig} para fruição da não incidência/isenção de ICMS.`
    );
  } else if (isAtivoOuUsoConsumoEntrada && isInterestadual) {
    alertas.push(
      `Entrada interestadual de ${isUsoConsumoEntrada ? 'uso/consumo' : 'ativo imobilizado'} (${cfopCodigo}): o contribuinte destinatário deve recolher DIFAL de contribuinte para ${ufDest}.`
    );
  } else if (isIndustrializacaoTerceiros) {
    alertas.push(
      `Industrialização por Encomenda (${cfopCodigo}): o ICMS incide normalmente sobre os insumos próprios aplicados, porém diversas UFs (Convênio AE-15/74, RICMS-RS e RICMS-SP Port. CAT 22/07) aplicam diferimento ou suspensão (CST 50/51) sobre a parcela de mão de obra em operações internas.`
    );
  } else if (isRemessaContaOrdem) {
    alertas.push(
      `Venda à Ordem (${cfopCodigo}): referenciar a NF de venda ao adquirente originário; o destaque dos tributos ocorre na NF de faturamento (5.118/5.119/6.118/6.119).`
    );
  } else if (isOperacaoSemFaturamento) {
    alertas.push(
      `Operação ${cfopCodigo} enquadrada sem tributação de venda (CST ICMS ${icmsCST}, IPI ${ipiCST}, PIS/COFINS ${pisCST}). Confira o prazo de retorno e o dispositivo do RICMS/${ufOrig} exigido nos Dados Adicionais.`
    );
  } else if (isSTJaRetidaCFOP) {
    alertas.push(
      `CFOP ${cfopCodigo} (Substituído): preencher vBCSTRet e vICMSSTRet nas tags do XML quando aplicável.`
    );
  } else if (isImportacaoCFOP) {
    alertas.push(
      `Importação (${cfopCodigo}): informe na NF-e os dados da DI/DUIMP, Valor Aduaneiro (CIF), II e despesas aduaneiras para composição da base de cálculo do ICMS ("por dentro").`
    );
  }
  if (isVendaNaoContribuinteCFOP && etapa2.destinatarioPossuiIE) {
    alertas.push(
      `Inconsistência detectada: CFOP ${cfopCodigo} destina-se a NÃO contribuinte do ICMS, mas o destinatário está marcado com IE ativa na Etapa 2.`
    );
  }

  // 9. Memória de Cálculo Auditável (alinhada às tabelas de referência e layout NF-e W02)
  const passosMemoria: PassoMemoriaCalculo[] = [
    {
      tributo: 'Valor dos Produtos (vProd)',
      formula: `${etapa3.quantidade} × ${fmtBRL(etapa3.valorUnitario)}`,
      resultado: fmtBRL(valorTotal),
      referenciaTabela: `NCM ${etapa3.ncmCodigo} (${ncmObj?.fonteOficial || 'Tabela TIPI / Siscomex'})`,
    },
    {
      tributo: 'IPI',
      formula:
        ipiBase > 0
          ? `${fmtBRL(ipiBase)} × ${ipiAliquota}% (CST ${ipiCST})`
          : `Sem incidência / Alíquota 0% (CST ${ipiCST})`,
      resultado: fmtBRL(ipiValor),
      referenciaTabela: `TIPI Dec. 11.158/2022 • Alíquota NCM: ${ipiTipi}%`,
    },
    {
      tributo: valorICMSDesonerado > 0 ? 'ICMS Próprio (Desonerado ZFM)' : 'ICMS Próprio',
      formula:
        valorICMSDesonerado > 0
          ? `Isento (CST 40) • Desoneração = ${fmtBRL(valorTotal)} × ${aliqInterestadual}%`
          : icmsBase > 0
          ? `${fmtBRL(icmsBase)}${icmsCST === '20' ? ' (BC reduzida p/ carga 7%)' : ''} × ${icmsAliquota}% (CST ${icmsCST})`
          : `Sem destaque próprio (CST/CSOSN ${icmsCST})`,
      resultado:
        valorICMSDesonerado > 0
          ? `-${fmtBRL(valorICMSDesonerado)} (abate vNF)`
          : fmtBRL(icmsValor),
      referenciaTabela: isInterna
        ? `Tabela UFs (${ufOrig}: ${aliqInternaOrigem}% • ${ufOrigObj?.fonte || 'RICMS'})`
        : `Tabela UFs (${ufOrig} ➔ ${ufDest}: Inter ${aliqInterestadual}% | Dest ${aliqInternaDestino}%)`,
    },
  ];

  if (icmsST.aplicavel) {
    passosMemoria.push({
      tributo: 'ICMS-ST (Substituição Tributária)',
      formula: icmsST.formulaCalculo,
      resultado:
        icmsST.valorFCPST > 0
          ? `${fmtBRL(icmsST.valorICMSST)} + FCP-ST ${fmtBRL(icmsST.valorFCPST)}`
          : fmtBRL(icmsST.valorICMSST),
      referenciaTabela: `${icmsST.protocolo || 'Convênio ICMS 142/2018'}${icmsST.cest ? ` • CEST ${icmsST.cest}` : ''} • ${ufDest} (${aliqInternaDestino}%${icmsST.fcpSTAliquota > 0 ? ` + FCP ${icmsST.fcpSTAliquota}%` : ''})`,
    });
  }

  if (difalAplicavel) {
    passosMemoria.push({
      tributo:
        difalTipo === 'contribuinte_uso_consumo_ativo'
          ? 'DIFAL Contribuinte (Uso/Consumo ou Ativo)'
          : 'DIFAL Não Contribuinte (EC 87/2015)',
      formula: `${fmtBRL(baseICMSOperacao)} × (${aliqInternaDestino}% - ${aliqInterestadual}% = ${difalDiferenca}%)${fcpValor > 0 ? ` + FCP ${fcpAliquotaAplicada}% (${fmtBRL(fcpValor)})` : ''}`,
      resultado: fmtBRL(difalValor + fcpValor),
      referenciaTabela: `Tabela UFs (${ufDest}: Interna ${aliqInternaDestino}%, FCP ${aliqFCPDestino}%) • Resp.: ${difalResponsavel === 'destinatario' ? 'Destinatário' : 'Remetente'}`,
    });
  }

  passosMemoria.push({
    tributo: 'PIS & COFINS',
    formula:
      pisBase > 0
        ? `BC = ${exclusaoICMSBasePISCOFINS > 0 ? `${fmtBRL(valorTotal)} - ICMS ${fmtBRL(exclusaoICMSBasePISCOFINS)} = ` : ''}${fmtBRL(pisBase)} | PIS ${pisAliquota}% (${fmtBRL(pisValor)}) + COFINS ${cofinsAliquota}% (${fmtBRL(cofinsValor)})`
        : `CST ${pisCST} (Alíquota 0% / Sem incidência / PGDAS-D)`,
    resultado: fmtBRL(pisValor + cofinsValor),
    referenciaTabela:
      exclusaoICMSBasePISCOFINS > 0
        ? 'STF Tema 69 / Lei 14.592/2023 + Regime Emitente'
        : ncmObj?.regimePISCOFINS && ncmObj.regimePISCOFINS !== 'geral'
        ? `Tabela NCM PIS/COFINS (${ncmObj.regimePISCOFINS})`
        : 'Legislação Federal PIS/COFINS',
  });

  passosMemoria.push({
    tributo: 'Reforma Tributária (CBS + IBS — Projeção)',
    formula:
      reformaBase > 0
        ? `${fmtBRL(reformaBase)} × (CBS ${cbsAliquota}% + IBS ${ibsAliquota}%) | CST ${cbsCST} / cClassTrib ${cbsCClassTrib}`
        : `CST ${cbsCST} / cClassTrib ${cbsCClassTrib} (Alíquota 0% / DAS / Imune)`,
    resultado: fmtBRL(cbsValor + ibsValor),
    referenciaTabela: 'EC 132/2023 · LC 214/2025 · NT 2025.002',
  });

  const totalTributosAtuais = Number(
    (
      icmsValor +
      icmsST.valorICMSST +
      icmsST.valorFCPST +
      difalValor +
      fcpValor +
      ipiValor +
      pisValor +
      cofinsValor
    ).toFixed(2)
  );

  // Total da NF-e conforme Manual de Orientação do Contribuinte SEFAZ (Grupo W02 - ICMSTot):
  // vNF = vProd - vICMSDeson + vIPI + vST + vFCPST
  const totalNota = Number(
    Math.max(
      0,
      valorTotal - valorICMSDesonerado + ipiValor + icmsST.valorICMSST + icmsST.valorFCPST
    ).toFixed(2)
  );

  return {
    cfopRecomendado: {
      codigo: cfopCodigo,
      descricao: cfopDescricao,
      abrangencia,
      quandoUsar:
        cfopObj?.quandoUsar ||
        `Utilizar nas operações de ${abrangencia} com ${etapa2.finalidadeMercadoria}.`,
    },
    naturezaOperacao,
    codigoOrigemMercadoria: etapa3.origemMercadoria,

    icms: {
      tributo: 'ICMS',
      cst: icmsCST,
      csosn: isSimples ? icmsCST : undefined,
      aliquota: icmsAliquota,
      baseCalculo: icmsBase,
      valorTributo: icmsValor,
      mva: icmsMva,
      fcp: fcpAliquotaAplicada || icmsST.fcpSTAliquota || undefined,
      fundamentacaoLegal: icmsFundamentacao,
      motivoEnquadramento: icmsMotivo,
      statusValidacao: 'VALIDADO_OFICIAL',
    },
    icmsST,
    ii: {
      tributo: 'Imposto de Importação',
      cst: iiCST,
      aliquota: iiAliquota,
      baseCalculo: 0,
      valorTributo: iiValor,
      fundamentacaoLegal: 'Regulamento Aduaneiro (Decreto nº 6.759/2009) e TEC Mercosul',
      motivoEnquadramento: isImportacaoCFOP
        ? cfopLimpo === '3201' || cfopLimpo === '3949'
          ? 'Reimportação / entrada aduaneira específica — verificar enquadramento na DI/DUIMP.'
          : 'Incidência de Imposto de Importação (II) no desembaraço aduaneiro conforme alíquota TEC do NCM na DI/DUIMP.'
        : isExportacao
        ? 'Imunidade constitucional na exportação.'
        : 'Não aplicável para operação no mercado interno.',
      statusValidacao: 'VALIDADO_OFICIAL',
    },
    pis: {
      tributo: 'PIS',
      cst: pisCST,
      aliquota: pisAliquota,
      baseCalculo: pisBase,
      valorTributo: pisValor,
      fundamentacaoLegal: pisFundamentacao,
      motivoEnquadramento: pisMotivo,
      statusValidacao: 'VALIDADO_OFICIAL',
    },
    cofins: {
      tributo: 'COFINS',
      cst: cofinsCST,
      aliquota: cofinsAliquota,
      baseCalculo: pisBase,
      valorTributo: cofinsValor,
      fundamentacaoLegal: pisFundamentacao,
      motivoEnquadramento: pisMotivo,
      statusValidacao: 'VALIDADO_OFICIAL',
    },
    ipi: {
      tributo: 'IPI',
      cst: ipiCST,
      aliquota: ipiAliquota,
      baseCalculo: ipiBase,
      valorTributo: ipiValor,
      fundamentacaoLegal: ipiFundamentacao,
      motivoEnquadramento: ipiMotivo,
      statusValidacao: 'VALIDADO_OFICIAL',
    },
    cbs: {
      tributo: 'CBS (Reforma Tributária)',
      cst: cbsCST,
      cClassTrib: cbsCClassTrib,
      aliquota: cbsAliquota,
      baseCalculo: reformaBase,
      valorTributo: cbsValor,
      fundamentacaoLegal: reformaFundamentacao,
      motivoEnquadramento: reformaMotivo,
      statusValidacao: 'PARAMETRIZADO',
    },
    ibs: {
      tributo: 'IBS (Reforma Tributária)',
      cst: ibsCST,
      cClassTrib: ibsCClassTrib,
      aliquota: ibsAliquota,
      baseCalculo: reformaBase,
      valorTributo: ibsValor,
      fundamentacaoLegal: reformaFundamentacao,
      motivoEnquadramento: reformaMotivo,
      statusValidacao: 'PARAMETRIZADO',
    },

    difal: {
      aplicavel: difalAplicavel,
      tipoDifal: difalTipo,
      responsavelRecolhimento: difalResponsavel,
      aliquotaInter: aliqInterestadual,
      aliquotaDestino: aliqInternaDestino,
      diferencial: difalDiferenca,
      fcp: fcpAliquotaAplicada,
      valorDifal: difalValor,
      valorFCP: fcpValor,
      baseLegal: difalBaseLegal,
    },

    nivelConfiabilidade:
      cfopIncompativelComUF || !ncmObj
        ? 'simulacao'
        : ncmExatoCatalogo
        ? 'liberado_emissao'
        : 'validado',
    checklistValidacoes: checklist,
    alertasInconsistencias: alertas,
    dataReferenciaLegislacao: 'Legislação Vigente 2026 (MOC v7.0, Conv. 142/18, LC 214/25 & NT 2025.002)',
    memoriaCalculo: {
      valorProdutos: valorTotal,
      valorICMS: icmsValor,
      valorICMSDesonerado,
      valorICMSST: icmsST.valorICMSST,
      valorFCPST: icmsST.valorFCPST,
      valorDIFAL: difalValor,
      valorFCP: fcpValor,
      valorIPI: ipiValor,
      basePISCOFINS: pisBase,
      exclusaoICMSBasePISCOFINS,
      valorPIS: pisValor,
      valorCOFINS: cofinsValor,
      valorCBS: cbsValor,
      valorIBS: ibsValor,
      totalTributos: totalTributosAtuais,
      totalNota,
      cargaTributariaEfetivaPercentual:
        valorTotal > 0 ? Number(((totalTributosAtuais / valorTotal) * 100).toFixed(2)) : 0,
      passos: passosMemoria,
    },
  };
}
