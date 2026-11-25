// Tabelas Oficiais da Calculadora RTC — Receita Federal do Brasil
// Referência: Portaria COTEC nº 342/2026 (MIT), EC 132/2023, LC 214/2025 e NT 2025.002 (NF-e / NFS-e)
import { INITIAL_NCMS } from './ncms';

export interface RtcCstItem {
  cst: string;
  descricao: string;
  indTrib: boolean;
  indRedAliq: boolean;
  indDif: boolean;
  indIsencao: boolean;
  indImunidade: boolean;
  indSuspensao: boolean;
  indMono: boolean;
  indTransfCred: boolean;
  baseLegal: string;
}

export interface RtcClassTribItem {
  cClassTrib: string;
  cst: string;
  nome: string;
  descricao: string;
  pRedIBS: number; // % de redução na alíquota de IBS (0 a 100)
  pRedCBS: number; // % de redução na alíquota de CBS (0 a 100)
  pDifPadrao: number; // % de diferimento padrão quando aplicável
  aplicavelNFe: boolean;
  aplicavelNFSe: boolean;
  baseLegal: string;
}

export interface RtcNcmRegra {
  ncm: string;
  descricao: string;
  categoria: string;
  cClassTrib: string;
  cst: string;
  pRedIBS: number;
  pRedCBS: number;
  sujeitoIS: boolean;
  pISReferencia: number;
  cstIS?: string;
  cClassTribIS?: string;
  baseLegal: string;
}

export interface RtcNbsRegra {
  nbs: string;
  descricao: string;
  categoria: string;
  cClassTrib: string;
  cst: string;
  pRedIBS: number;
  pRedCBS: number;
  baseLegal: string;
}

export interface RtcAliquotaAno {
  ano: number;
  fase: string;
  pCBSUniao: number;
  pIBSUF: number;
  pIBSMun: number;
  pIBSTotal: number;
  pISVigente: boolean;
  fatorReducaoIcmsIss: number; // % de redução do ICMS/ISS na transição
  baseLegal: string;
}

export interface RtcMunicipioRef {
  codigoIBGE: string;
  municipio: string;
  uf: string;
  codigoUF: string;
  pIBSUFPlena: number;
  pIBSMunPlena: number;
  pISSPadrao: number;
}

export interface RtcFundamentacaoLegal {
  codigo: string;
  norma: string;
  artigo: string;
  tema: string;
  resumo: string;
}

export interface SimplesNacionalFaixa {
  faixa: number;
  rbt12Min: number;
  rbt12Max: number;
  aliqNominal: number;
  parcelaDeduzir: number;
  partilha: {
    irpj: number;
    csll: number;
    cofins: number;
    pis: number;
    cpp: number;
    icms: number;
    iss: number;
    ipi: number;
  };
}

export interface SimplesNacionalAnexo {
  codigo: 'I' | 'II' | 'III' | 'IV' | 'V';
  nome: string;
  descricao: string;
  tributoConsumoSub: 'ICMS' | 'ISS';
  faixas: SimplesNacionalFaixa[];
}

export const RTC_VERSAO_MOTOR = {
  versao: '1.7.2-rtc-2026',
  versoesRepositorios: {
    regimeRegular: '1.7.2',
    simplesNacional: '1.0.2',
    geradorDanfse: '1.0.0',
  },
  normativa: 'Portaria COTEC nº 342/2026 · IT 2025.002 v1.71 · LC 214/2025',
  politicaArredondamento: 'ABNT NBR 5891 (HALF_EVEN) · ADR003 v1.7.2',
  licenca: 'MIT (Código Aberto — RFB / SERPRO)',
  repositorios: [
    'calculadora-rtc-regime-regular',
    'calculadora-rtc-simples-nacional',
    'calculadora-rtc-gerador-danfse',
  ],
  ultimaAtualizacaoTabelas: '2026-11-25',
};

// 1. Tabela Oficial de CST CBS / IBS (3 dígitos — NT 2025.002)
export const RTC_CST_CBS_IBS: RtcCstItem[] = [
  {
    cst: '000',
    descricao: 'Tributação integral',
    indTrib: true,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 4º e Art. 14',
  },
  {
    cst: '010',
    descricao: 'Tributação com alíquotas uniformes (Setor Financeiro / Planos / Concursos)',
    indTrib: true,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 182 a 233',
  },
  {
    cst: '011',
    descricao: 'Tributação com alíquotas uniformes reduzidas',
    indTrib: true,
    indRedAliq: true,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Regimes Específicos com Redução',
  },
  {
    cst: '200',
    descricao: 'Alíquota reduzida (30%, 40%, 60% ou 100% — Cesta Básica / Saúde / Educação / Agro)',
    indTrib: true,
    indRedAliq: true,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 125 a 148 e Anexos I a XV',
  },
  {
    cst: '220',
    descricao: 'Alíquota fixa (Regimes específicos com base fixa)',
    indTrib: true,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Regimes Específicos',
  },
  {
    cst: '221',
    descricao: 'Alíquota fixa proporcional (Operações imobiliárias / Cooperativas)',
    indTrib: true,
    indRedAliq: true,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 251 a 270',
  },
  {
    cst: '222',
    descricao: 'Redução de base de cálculo',
    indTrib: true,
    indRedAliq: true,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 257 (Redutor de Ajuste / Social)',
  },
  {
    cst: '400',
    descricao: 'Isenção',
    indTrib: false,
    indRedAliq: false,
    indDif: false,
    indIsencao: true,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: false,
    baseLegal: 'LC 214/2025, Art. 149 a 162 (ex.: Transporte Coletivo, ZFM)',
  },
  {
    cst: '410',
    descricao: 'Imunidade e não incidência',
    indTrib: false,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: true,
    indSuspensao: false,
    indMono: false,
    indTransfCred: false,
    baseLegal: 'CF/88 Art. 156-A § 1º e LC 214/2025, Art. 6º e Art. 8º (Exportações, Retornos sem transferência)',
  },
  {
    cst: '510',
    descricao: 'Diferimento',
    indTrib: true,
    indRedAliq: false,
    indDif: true,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 28 e Art. 139 (Insumos Agropecuários / Energia)',
  },
  {
    cst: '550',
    descricao: 'Suspensão',
    indTrib: false,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: true,
    indMono: false,
    indTransfCred: false,
    baseLegal: 'LC 214/2025, Art. 82 a 108 (Regimes Aduaneiros, Drawback, Reparo, ZPE)',
  },
  {
    cst: '620',
    descricao: 'Tributação monofásica (Combustíveis e Lubrificantes)',
    indTrib: true,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: true,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 172 a 180',
  },
  {
    cst: '800',
    descricao: 'Transferência de crédito',
    indTrib: false,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 47 a 56',
  },
  {
    cst: '810',
    descricao: 'Ajuste de IBS na Zona Franca de Manaus (ZFM)',
    indTrib: false,
    indRedAliq: false,
    indDif: false,
    indIsencao: true,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 439 a 462 (ZFM e ALC)',
  },
  {
    cst: '820',
    descricao: 'Tributação em declaração de regime específico',
    indTrib: true,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: false,
    baseLegal: 'LC 214/2025, Regimes Específicos por Declaração',
  },
  {
    cst: '830',
    descricao: 'Exclusão de base de cálculo',
    indTrib: true,
    indRedAliq: false,
    indDif: false,
    indIsencao: false,
    indImunidade: false,
    indSuspensao: false,
    indMono: false,
    indTransfCred: true,
    baseLegal: 'LC 214/2025, Art. 12 § 2º',
  },
];

// 2. Tabela Oficial de Classificações Tributárias (cClassTrib — 6 dígitos: 3 dígitos CST + 3 sequenciais)
export const RTC_CLASSIFICACOES_TRIBUTARIAS: RtcClassTribItem[] = [
  {
    cClassTrib: '000001',
    cst: '000',
    nome: 'Situações tributadas integralmente pelo IBS e CBS',
    descricao: 'Regra geral de tributação integral sem redução, diferimento ou benefício específico para bens e serviços.',
    pRedIBS: 0,
    pRedCBS: 0,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 4º e Art. 14',
  },
  {
    cClassTrib: '000002',
    cst: '000',
    nome: 'Exploração de via (Pedágio / Concessões Rodoviárias)',
    descricao: 'Tributação integral com regra específica de repartição territorial por extensão da via.',
    pRedIBS: 0,
    pRedCBS: 0,
    pDifPadrao: 0,
    aplicavelNFe: false,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 11, § 8º',
  },
  {
    cClassTrib: '200001',
    cst: '200',
    nome: 'Aquisições realizadas entre empresas do mesmo grupo / operações com redução de 100% (Cesta Básica Nacional)',
    descricao: 'Redução de 100% nas alíquotas de IBS e CBS para produtos da Cesta Básica Nacional de Alimentos (Anexo I).',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 125 e Anexo I',
  },
  {
    cClassTrib: '200003',
    cst: '200',
    nome: 'Vendas de produtos destinados à alimentação humana (Cesta Básica — Alíquota Zero)',
    descricao: 'Alimentos essenciais da Cesta Básica Nacional com redução integral de 100% em IBS e CBS.',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 125, Anexo I (Arroz, Feijão, Leite, Carnes, Pão, Café)',
  },
  {
    cClassTrib: '200009',
    cst: '200',
    nome: 'Medicamentos registrados na Anvisa (Alíquota Zero — Anexo XIV)',
    descricao: 'Medicamentos essenciais listados no Anexo XIV da LC 214/2025 com redução de 100%.',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 146 e Anexo XIV',
  },
  {
    cClassTrib: '200014',
    cst: '200',
    nome: 'Produtos hortícolas, frutas e ovos (Alíquota Zero — Anexo XV)',
    descricao: 'Redução de 100% nas alíquotas de IBS e CBS para hortícolas, frutas e ovos do Anexo XV (inclui NCM 0710.80.00 conforme IT 2025.002 v1.71 / V0073).',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 148 e Anexo XV (atualizado pela V0073)',
  },
  {
    cClassTrib: '200028',
    cst: '200',
    nome: 'Fornecimento de serviços de educação (Redução de 60%)',
    descricao: 'Ensino infantil, fundamental, médio, técnico e superior com redução de 60% nas alíquotas de IBS e CBS.',
    pRedIBS: 60,
    pRedCBS: 60,
    pDifPadrao: 0,
    aplicavelNFe: false,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 129 e Anexo II',
  },
  {
    cClassTrib: '200029',
    cst: '200',
    nome: 'Fornecimento de serviços de saúde humana (Redução de 60%)',
    descricao: 'Consultas, exames, internações hospitalares e serviços de saúde listados no Anexo III.',
    pRedIBS: 60,
    pRedCBS: 60,
    pDifPadrao: 0,
    aplicavelNFe: false,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 130 e Anexo III',
  },
  {
    cClassTrib: '200030',
    cst: '200',
    nome: 'Venda de dispositivos médicos e medicamentos gerais (Redução de 60%)',
    descricao: 'Dispositivos médicos (Anexo IV) e medicamentos gerais não abrangidos na lista de alíquota zero.',
    pRedIBS: 60,
    pRedCBS: 60,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 131 e Art. 133',
  },
  {
    cClassTrib: '200034',
    cst: '200',
    nome: 'Fornecimento de alimentos destinados ao consumo humano (Redução de 60% — Anexo VII)',
    descricao: 'Alimentos não incluídos na Cesta Básica Nacional mas contemplados no Anexo VII.',
    pRedIBS: 60,
    pRedCBS: 60,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 135 e Anexo VII',
  },
  {
    cClassTrib: '200038',
    cst: '200',
    nome: 'Fornecimento de insumos agropecuários e aquícolas (Redução de 60%)',
    descricao: 'Fertilizantes, sementes, defensivos e rações listados no Anexo IX da LC 214/2025.',
    pRedIBS: 60,
    pRedCBS: 60,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 138 e Anexo IX',
  },
  {
    cClassTrib: '200046',
    cst: '200',
    nome: 'Operações com bens imóveis / Construção civil residencial (Redução de 50% / 40%)',
    descricao: 'Alienação de bens imóveis e serviços de construção civil enquadrados no regime específico imobiliário.',
    pRedIBS: 40,
    pRedCBS: 40,
    pDifPadrao: 0,
    aplicavelNFe: false,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 261 (Bens Imóveis — Redução de alíquota)',
  },
  {
    cClassTrib: '200052',
    cst: '200',
    nome: 'Prestação de serviços de profissões intelectuais regulamentadas (Redução de 30%)',
    descricao: 'Engenharia, arquitetura, contabilidade, advocacia, economia, medicina veterinária, administração e afins.',
    pRedIBS: 30,
    pRedCBS: 30,
    pDifPadrao: 0,
    aplicavelNFe: false,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 127 (18 profissões regulamentadas)',
  },
  {
    cClassTrib: '400001',
    cst: '400',
    nome: 'Fornecimento de serviços de transporte público coletivo urbano',
    descricao: 'Isenção total de IBS e CBS no transporte rodoviário, ferroviário e metroviário urbano/metropolitano.',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: false,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 157',
  },
  {
    cClassTrib: '410001',
    cst: '410',
    nome: 'Fornecimento de bonificação / Remessa e retorno sem transferência de titularidade',
    descricao: 'Não incidência de IBS/CBS em operações sem transferência onerosa de propriedade (ex.: retorno de conserto, demonstração, comodato).',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 6º',
  },
  {
    cClassTrib: '410003',
    cst: '410',
    nome: 'Doações e amostras grátis sem contraprestação em benefício do doador',
    descricao: 'Não incidência de IBS/CBS em doações e amostras grátis sem contraprestação (nomenclatura atualizada e inclusão em indDIR — IT 2025.002 v1.71).',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 6º · IT 2025.002 v1.71 (V0073)',
  },
  {
    cClassTrib: '410004',
    cst: '410',
    nome: 'Exportação de bens e serviços para o exterior (Imunidade)',
    descricao: 'Imunidade constitucional de IBS e CBS sobre exportações diretas e indiretas com manutenção integral de créditos.',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: true,
    baseLegal: 'CF/88 Art. 156-A § 1º, III e LC 214/2025, Art. 79',
  },
  {
    cClassTrib: '410026',
    cst: '410',
    nome: 'Doação e amostras grátis com anulação de crédito',
    descricao: 'Operações de doação e distribuição de amostras grátis sujeitas à anulação de créditos de IBS e CBS (IT 2025.002 v1.71).',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 6º · IT 2025.002 v1.71 (V0073)',
  },
  {
    cClassTrib: '410999',
    cst: '410',
    nome: 'Operações não onerosas sem previsão de tributação',
    descricao: 'Demais operações sem incidência de IBS/CBS, incluindo operações enquadradas em indDIR (IT 2025.002 v1.71).',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: true,
    baseLegal: 'LC 214/2025, Art. 6º · IT 2025.002 v1.71 (V0073)',
  },
  {
    cClassTrib: '510001',
    cst: '510',
    nome: 'Operações sujeitas a diferimento (Insumos agropecuários / Energia elétrica)',
    descricao: 'Diferimento do recolhimento do IBS e da CBS para etapa posterior da cadeia produtiva.',
    pRedIBS: 0,
    pRedCBS: 0,
    pDifPadrao: 100,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 28 e Art. 139',
  },
  {
    cClassTrib: '550001',
    cst: '550',
    nome: 'Operações com suspensão (Regimes Aduaneiros, Drawback, Remessa para Industrialização/Conserto)',
    descricao: 'Suspensão da exigibilidade de IBS e CBS condicionada ao cumprimento de prazo legal ou retorno.',
    pRedIBS: 0,
    pRedCBS: 0,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 82 a 108',
  },
  {
    cClassTrib: '620001',
    cst: '620',
    nome: 'Tributação monofásica sobre combustíveis (Alíquota ad rem)',
    descricao: 'Incidência única por unidade de medida sobre gasolina, etanol, diesel, GLP e QAV.',
    pRedIBS: 0,
    pRedCBS: 0,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 172 a 180',
  },
  {
    cClassTrib: '810001',
    cst: '810',
    nome: 'Remessa de bem industrializado nacional para Zona Franca de Manaus (ZFM / ALC)',
    descricao: 'Redução a zero de IBS e CBS com crédito presumido mantido na entrada na ZFM/ALC.',
    pRedIBS: 100,
    pRedCBS: 100,
    pDifPadrao: 0,
    aplicavelNFe: true,
    aplicavelNFSe: false,
    baseLegal: 'LC 214/2025, Art. 445 a 456',
  },
];

// 3. Tabela de NCMs — Reduções & Imposto Seletivo (IS)
export const RTC_NCM_BENEFICIOS_IS: RtcNcmRegra[] = [
  {
    ncm: '39253000',
    descricao: 'Postigos, estores (incluindo venezianas) e artefatos semelhantes de plástico',
    categoria: 'Indústria Geral (Regra Padrão)',
    cClassTrib: '000001',
    cst: '000',
    pRedIBS: 0,
    pRedCBS: 0,
    sujeitoIS: false,
    pISReferencia: 0,
    baseLegal: 'LC 214/2025, Art. 4º — Tributação integral',
  },
  {
    ncm: '84779000',
    descricao: 'Partes de máquinas e aparelhos para trabalhar borracha ou plásticos',
    categoria: 'Máquinas e Equipamentos Industriais',
    cClassTrib: '000001',
    cst: '000',
    pRedIBS: 0,
    pRedCBS: 0,
    sujeitoIS: false,
    pISReferencia: 0,
    baseLegal: 'LC 214/2025, Art. 4º — Tributação integral (crédito integral na aquisição)',
  },
  {
    ncm: '10063021',
    descricao: 'Arroz semibranqueado ou branqueado, polido ou brunido',
    categoria: 'Cesta Básica Nacional (Alíquota Zero)',
    cClassTrib: '200003',
    cst: '200',
    pRedIBS: 100,
    pRedCBS: 100,
    sujeitoIS: false,
    pISReferencia: 0,
    baseLegal: 'LC 214/2025, Art. 125 e Anexo I',
  },
  {
    ncm: '07133319',
    descricao: 'Feijão comum preto ou carioca',
    categoria: 'Cesta Básica Nacional (Alíquota Zero)',
    cClassTrib: '200003',
    cst: '200',
    pRedIBS: 100,
    pRedCBS: 100,
    sujeitoIS: false,
    pISReferencia: 0,
    baseLegal: 'LC 214/2025, Art. 125 e Anexo I',
  },
  {
    ncm: '02013000',
    descricao: 'Carnes desossadas de animais da espécie bovina, frescas ou refrigeradas',
    categoria: 'Cesta Básica Nacional (Alíquota Zero)',
    cClassTrib: '200003',
    cst: '200',
    pRedIBS: 100,
    pRedCBS: 100,
    sujeitoIS: false,
    pISReferencia: 0,
    baseLegal: 'LC 214/2025, Art. 125 e Anexo I',
  },
  {
    ncm: '07108000',
    descricao: 'Outros produtos hortícolas, congelados (exceto cogumelos e trufas)',
    categoria: 'Hortícolas e Frutas — Anexo XV (Alíquota Zero)',
    cClassTrib: '200014',
    cst: '200',
    pRedIBS: 100,
    pRedCBS: 100,
    sujeitoIS: false,
    pISReferencia: 0,
    baseLegal: 'LC 214/2025, Art. 148, Anexo XV, item 2 (exceção removida pela V0073)',
  },
  {
    ncm: '30049099',
    descricao: 'Outros medicamentos contendo produtos misturados ou não, para fins terapêuticos',
    categoria: 'Medicamentos (Redução de 60%)',
    cClassTrib: '200030',
    cst: '200',
    pRedIBS: 60,
    pRedCBS: 60,
    sujeitoIS: false,
    pISReferencia: 0,
    baseLegal: 'LC 214/2025, Art. 133 e Anexo XIV',
  },
  {
    ncm: '31052000',
    descricao: 'Adubos ou fertilizantes minerais ou químicos contendo nitrogênio, fósforo e potássio',
    categoria: 'Insumos Agropecuários (Redução de 60%)',
    cClassTrib: '200038',
    cst: '200',
    pRedIBS: 60,
    pRedCBS: 60,
    sujeitoIS: false,
    pISReferencia: 0,
    baseLegal: 'LC 214/2025, Art. 138 e Anexo IX',
  },
  {
    ncm: '22021000',
    descricao: 'Águas, incluindo as águas minerais e gaseificadas, adicionadas de açúcar (Refrigerantes)',
    categoria: 'Bebidas Açucaradas — Sujeito ao Imposto Seletivo (IS)',
    cClassTrib: '000001',
    cst: '000',
    pRedIBS: 0,
    pRedCBS: 0,
    sujeitoIS: true,
    pISReferencia: 2.0,
    cstIS: '000',
    cClassTribIS: '000001',
    baseLegal: 'LC 214/2025, Art. 409, V e Anexo XVII (Imposto Seletivo)',
  },
  {
    ncm: '22030000',
    descricao: 'Cervejas de malte (Bebida Alcoólica)',
    categoria: 'Bebidas Alcoólicas — Sujeito ao Imposto Seletivo (IS)',
    cClassTrib: '000001',
    cst: '000',
    pRedIBS: 0,
    pRedCBS: 0,
    sujeitoIS: true,
    pISReferencia: 14.0,
    cstIS: '000',
    cClassTribIS: '000002',
    baseLegal: 'LC 214/2025, Art. 409, IV e Art. 419 (IS ad valorem + ad rem)',
  },
  {
    ncm: '24022000',
    descricao: 'Cigarros contendo tabaco (Produtos Fumígenos)',
    categoria: 'Fumígenos — Sujeito ao Imposto Seletivo (IS)',
    cClassTrib: '000001',
    cst: '000',
    pRedIBS: 0,
    pRedCBS: 0,
    sujeitoIS: true,
    pISReferencia: 30.0,
    cstIS: '000',
    cClassTribIS: '000003',
    baseLegal: 'LC 214/2025, Art. 409, III (Imposto Seletivo)',
  },
  {
    ncm: '87032310',
    descricao: 'Automóveis de passageiros com motor a explosão (1.500 a 3.000 cm³)',
    categoria: 'Veículos — Sujeito ao Imposto Seletivo (IS)',
    cClassTrib: '000001',
    cst: '000',
    pRedIBS: 0,
    pRedCBS: 0,
    sujeitoIS: true,
    pISReferencia: 5.5,
    cstIS: '000',
    cClassTribIS: '000004',
    baseLegal: 'LC 214/2025, Art. 409, I e Art. 418 (Eficiência Energética / Emissões)',
  },
  {
    ncm: '26011100',
    descricao: 'Minérios de ferro e seus concentrados, não aglomerados',
    categoria: 'Bens Minerais Extraídos — Sujeito ao Imposto Seletivo (IS)',
    cClassTrib: '000001',
    cst: '000',
    pRedIBS: 0,
    pRedCBS: 0,
    sujeitoIS: true,
    pISReferencia: 0.25,
    cstIS: '000',
    cClassTribIS: '000005',
    baseLegal: 'LC 214/2025, Art. 409, VI e Art. 424 (teto constitucional de 0,25%)',
  },
];

// Converte automaticamente todos os NCMs do catálogo geral TIPI para regras RTC (CBS, IBS e IS)
function construirCatalogoNcmRTC(): RtcNcmRegra[] {
  const mapa = new Map<string, RtcNcmRegra>();
  for (const item of RTC_NCM_BENEFICIOS_IS) {
    mapa.set(item.ncm.replace(/\D/g, ''), item);
  }

  for (const ncm of INITIAL_NCMS) {
    const clean = ncm.codigo.replace(/\D/g, '');
    if (clean.length < 8 || mapa.has(clean)) continue;

    const cap = clean.slice(0, 2);
    const descLower = `${ncm.descricao} ${ncm.observacao || ''}`.toLowerCase();

    let cst = '000';
    let cClassTrib = '000001';
    let pRedIBS = 0;
    let pRedCBS = 0;
    let sujeitoIS = false;
    let pISReferencia = 0;
    let categoria = ncm.setor || `Capítulo ${cap} (Regra Geral)`;
    let baseLegal = 'LC 214/2025, Art. 4º — Tributação integral';

    if (descLower.includes('cesta básica') || descLower.includes('alíquota zero de ibs/cbs') || cap === '49') {
      cst = '200';
      cClassTrib = '200003';
      pRedIBS = 100;
      pRedCBS = 100;
      categoria = cap === '49' ? 'Livros / Imunidade (Alíquota Zero)' : 'Cesta Básica Nacional (Alíquota Zero)';
      baseLegal = cap === '49' ? 'CF/88 Art. 150, VI, d e LC 214/2025' : 'LC 214/2025, Art. 125 e Anexo I';
    } else if (['2202', '2203', '2204', '2208'].some((p) => clean.startsWith(p)) || cap === '24') {
      sujeitoIS = true;
      pISReferencia = cap === '24' ? 30 : clean.startsWith('2202') ? 2 : clean.startsWith('2203') ? 14 : 20;
      categoria = 'Sujeito ao Imposto Seletivo (IS)';
      baseLegal = 'LC 214/2025, Art. 409 (Imposto Seletivo)';
    } else if (clean.startsWith('8703') || clean.startsWith('8802') || clean.startsWith('8903')) {
      sujeitoIS = true;
      pISReferencia = clean.startsWith('870380') ? 2.0 : 5.5;
      categoria = 'Veículos / Aeronaves / Embarcações — Imposto Seletivo (IS)';
      baseLegal = 'LC 214/2025, Art. 409, I e Art. 418';
    } else if (cap === '26' || clean.startsWith('2709')) {
      sujeitoIS = true;
      pISReferencia = 0.25;
      categoria = 'Extração Mineral — Imposto Seletivo (IS)';
      baseLegal = 'LC 214/2025, Art. 409, VI e Art. 424';
    } else if (cap === '27' && (clean.startsWith('271012') || clean.startsWith('2710192') || clean.startsWith('271119'))) {
      cst = '620';
      cClassTrib = '620001';
      categoria = 'Combustíveis — Regime Monofásico (CST 620)';
      baseLegal = 'LC 214/2025, Art. 172 a 180';
    } else if (cap === '30' || clean.startsWith('9018') || clean.startsWith('370110')) {
      cst = '200';
      cClassTrib = clean.startsWith('300241') ? '200009' : '200030';
      pRedIBS = clean.startsWith('300241') ? 100 : 60;
      pRedCBS = pRedIBS;
      categoria = pRedIBS === 100 ? 'Saúde / Vacinas (Alíquota Zero)' : 'Saúde & Medicamentos (Redução de 60%)';
      baseLegal = 'LC 214/2025, Art. 131 a 133 e Anexos IV/XIV';
    } else if (cap === '31' || clean.startsWith('3808') || clean.startsWith('230990') || cap === '06' || cap === '10' || cap === '12') {
      cst = '200';
      cClassTrib = '200038';
      pRedIBS = 60;
      pRedCBS = 60;
      categoria = 'Insumos Agropecuários (Redução de 60%)';
      baseLegal = 'LC 214/2025, Art. 138 e Anexo IX';
    } else if (descLower.includes('redução de 60%') || ['04', '07', '08', '09', '11', '15', '19'].includes(cap)) {
      cst = '200';
      cClassTrib = '200034';
      pRedIBS = 60;
      pRedCBS = 60;
      categoria = 'Alimentos / Higiene Essencial (Redução de 60%)';
      baseLegal = 'LC 214/2025, Art. 135 e Anexos VII/VIII';
    }

    mapa.set(clean, {
      ncm: clean,
      descricao: ncm.descricao,
      categoria,
      cClassTrib,
      cst,
      pRedIBS,
      pRedCBS,
      sujeitoIS,
      pISReferencia,
      cstIS: sujeitoIS ? '000' : undefined,
      cClassTribIS: sujeitoIS ? '000001' : undefined,
      baseLegal,
    });
  }

  return Array.from(mapa.values());
}

export const RTC_NCM_CATALOGO_COMPLETO: RtcNcmRegra[] = construirCatalogoNcmRTC();

// 4. Tabela de NBS — Serviços (Nomenclatura Brasileira de Serviços)
export const RTC_NBS_SERVICOS: RtcNbsRegra[] = [
  {
    nbs: '1.1502.10.00',
    descricao: 'Serviços de desenvolvimento e licenciamento de software sob encomenda / SaaS',
    categoria: 'Tecnologia da Informação (Regra Geral)',
    cClassTrib: '000001',
    cst: '000',
    pRedIBS: 0,
    pRedCBS: 0,
    baseLegal: 'LC 214/2025, Art. 4º — Tributação integral no destino',
  },
  {
    nbs: '1.1401.11.00',
    descricao: 'Serviços de engenharia, arquitetura e projetos técnicos',
    categoria: 'Profissões Regulamentadas (Redução de 30%)',
    cClassTrib: '200052',
    cst: '200',
    pRedIBS: 30,
    pRedCBS: 30,
    baseLegal: 'LC 214/2025, Art. 127, VIII',
  },
  {
    nbs: '1.1302.10.00',
    descricao: 'Serviços de contabilidade, auditoria e consultoria fiscal',
    categoria: 'Profissões Regulamentadas (Redução de 30%)',
    cClassTrib: '200052',
    cst: '200',
    pRedIBS: 30,
    pRedCBS: 30,
    baseLegal: 'LC 214/2025, Art. 127, VI',
  },
  {
    nbs: '1.1301.10.00',
    descricao: 'Serviços jurídicos e de advocacia',
    categoria: 'Profissões Regulamentadas (Redução de 30%)',
    cClassTrib: '200052',
    cst: '200',
    pRedIBS: 30,
    pRedCBS: 30,
    baseLegal: 'LC 214/2025, Art. 127, II',
  },
  {
    nbs: '1.2301.11.00',
    descricao: 'Serviços médicos, consultas ambulatoriais e internação hospitalar',
    categoria: 'Saúde Humana (Redução de 60%)',
    cClassTrib: '200029',
    cst: '200',
    pRedIBS: 60,
    pRedCBS: 60,
    baseLegal: 'LC 214/2025, Art. 130 e Anexo III',
  },
  {
    nbs: '1.2201.11.00',
    descricao: 'Serviços de educação infantil, ensino fundamental, médio e superior',
    categoria: 'Educação (Redução de 60%)',
    cClassTrib: '200028',
    cst: '200',
    pRedIBS: 60,
    pRedCBS: 60,
    baseLegal: 'LC 214/2025, Art. 129 e Anexo II',
  },
  {
    nbs: '1.0101.11.00',
    descricao: 'Serviços de construção civil de edificações residenciais e comerciais',
    categoria: 'Construção Civil / Imobiliário (Redução de 40%)',
    cClassTrib: '200046',
    cst: '200',
    pRedIBS: 40,
    pRedCBS: 40,
    baseLegal: 'LC 214/2025, Art. 261',
  },
  {
    nbs: '1.0401.11.00',
    descricao: 'Transporte rodoviário coletivo urbano e metropolitano de passageiros',
    categoria: 'Transporte Público Coletivo (Isenção)',
    cClassTrib: '400001',
    cst: '400',
    pRedIBS: 100,
    pRedCBS: 100,
    baseLegal: 'LC 214/2025, Art. 157',
  },
];

// 5. Cronograma de Alíquotas de Referência (União, UF e Município — 2026 a 2033)
export const RTC_ALIQUOTAS_REFERENCIA_ANO: RtcAliquotaAno[] = [
  {
    ano: 2026,
    fase: 'Ano-Teste (Alíquotas Experimentais — Compensáveis com PIS/COFINS)',
    pCBSUniao: 0.9,
    pIBSUF: 0.1,
    pIBSMun: 0.0,
    pIBSTotal: 0.1,
    pISVigente: false,
    fatorReducaoIcmsIss: 0,
    baseLegal: 'LC 214/2025, Art. 343 e Art. 348 (EC 132/2023, ADCT Art. 125)',
  },
  {
    ano: 2027,
    fase: 'Entrada Plena da CBS e IS · Extinção do PIS/COFINS · IBS Estadual 0,05% / Municipal 0,05%',
    pCBSUniao: 8.8,
    pIBSUF: 0.05,
    pIBSMun: 0.05,
    pIBSTotal: 0.1,
    pISVigente: true,
    fatorReducaoIcmsIss: 0,
    baseLegal: 'LC 214/2025, Art. 344 e EC 132/2023, ADCT Art. 127',
  },
  {
    ano: 2028,
    fase: 'CBS Plena + IBS de Referência (0,05% UF + 0,05% Mun) + IS',
    pCBSUniao: 8.8,
    pIBSUF: 0.05,
    pIBSMun: 0.05,
    pIBSTotal: 0.1,
    pISVigente: true,
    fatorReducaoIcmsIss: 0,
    baseLegal: 'EC 132/2023, ADCT Art. 128',
  },
  {
    ano: 2029,
    fase: 'Transição IBS 1/10 · Redução de 10% no ICMS e ISS',
    pCBSUniao: 8.8,
    pIBSUF: 1.56,
    pIBSMun: 0.21,
    pIBSTotal: 1.77,
    pISVigente: true,
    fatorReducaoIcmsIss: 10,
    baseLegal: 'EC 132/2023, ADCT Art. 129',
  },
  {
    ano: 2030,
    fase: 'Transição IBS 2/10 · Redução de 20% no ICMS e ISS',
    pCBSUniao: 8.8,
    pIBSUF: 3.12,
    pIBSMun: 0.42,
    pIBSTotal: 3.54,
    pISVigente: true,
    fatorReducaoIcmsIss: 20,
    baseLegal: 'EC 132/2023, ADCT Art. 129',
  },
  {
    ano: 2031,
    fase: 'Transição IBS 3/10 · Redução de 30% no ICMS e ISS',
    pCBSUniao: 8.8,
    pIBSUF: 4.68,
    pIBSMun: 0.63,
    pIBSTotal: 5.31,
    pISVigente: true,
    fatorReducaoIcmsIss: 30,
    baseLegal: 'EC 132/2023, ADCT Art. 129',
  },
  {
    ano: 2032,
    fase: 'Transição IBS 4/10 · Redução de 40% no ICMS e ISS',
    pCBSUniao: 8.8,
    pIBSUF: 6.24,
    pIBSMun: 0.84,
    pIBSTotal: 7.08,
    pISVigente: true,
    fatorReducaoIcmsIss: 40,
    baseLegal: 'EC 132/2023, ADCT Art. 129',
  },
  {
    ano: 2033,
    fase: 'Vigência Plena do IVA Dual (CBS + IBS) · Extinção Total de ICMS e ISS',
    pCBSUniao: 8.8,
    pIBSUF: 15.6,
    pIBSMun: 2.1,
    pIBSTotal: 17.7,
    pISVigente: true,
    fatorReducaoIcmsIss: 100,
    baseLegal: 'EC 132/2023, ADCT Art. 130 e LC 214/2025',
  },
];

// 6. Municípios & UFs de Referência (Códigos IBGE)
export const RTC_MUNICIPIOS_REFERENCIA: RtcMunicipioRef[] = [
  { codigoIBGE: '4307609', municipio: 'Estância Velha', uf: 'RS', codigoUF: '43', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 3.0 },
  { codigoIBGE: '4314902', municipio: 'Porto Alegre', uf: 'RS', codigoUF: '43', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 4.0 },
  { codigoIBGE: '4313409', municipio: 'Novo Hamburgo', uf: 'RS', codigoUF: '43', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 3.5 },
  { codigoIBGE: '3550308', municipio: 'São Paulo', uf: 'SP', codigoUF: '35', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '3304557', municipio: 'Rio de Janeiro', uf: 'RJ', codigoUF: '33', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '3106200', municipio: 'Belo Horizonte', uf: 'MG', codigoUF: '31', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '4106902', municipio: 'Curitiba', uf: 'PR', codigoUF: '41', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '4205407', municipio: 'Florianópolis', uf: 'SC', codigoUF: '42', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '1302603', municipio: 'Manaus (ZFM)', uf: 'AM', codigoUF: '13', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '5300108', municipio: 'Brasília', uf: 'DF', codigoUF: '53', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '2927408', municipio: 'Salvador', uf: 'BA', codigoUF: '29', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '2611606', municipio: 'Recife', uf: 'PE', codigoUF: '26', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '2304400', municipio: 'Fortaleza', uf: 'CE', codigoUF: '23', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
  { codigoIBGE: '5208707', municipio: 'Goiânia', uf: 'GO', codigoUF: '52', pIBSUFPlena: 15.6, pIBSMunPlena: 2.1, pISSPadrao: 5.0 },
];

// 7. Anexos I a V do Simples Nacional (LC 123/2006 + LC 214/2025 Art. 41 § 3º)
export const RTC_SIMPLES_ANEXOS: SimplesNacionalAnexo[] = [
  {
    codigo: 'I',
    nome: 'Anexo I — Comércio',
    descricao: 'Revenda de mercadorias (varejo e atacado). IBS substitui parcela de ICMS; CBS substitui PIS/COFINS no DAS.',
    tributoConsumoSub: 'ICMS',
    faixas: [
      { faixa: 1, rbt12Min: 0, rbt12Max: 180000, aliqNominal: 4.0, parcelaDeduzir: 0, partilha: { irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 41.5, icms: 34.0, iss: 0, ipi: 0 } },
      { faixa: 2, rbt12Min: 180000.01, rbt12Max: 360000, aliqNominal: 7.3, parcelaDeduzir: 5940, partilha: { irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 41.5, icms: 34.0, iss: 0, ipi: 0 } },
      { faixa: 3, rbt12Min: 360000.01, rbt12Max: 720000, aliqNominal: 9.5, parcelaDeduzir: 13860, partilha: { irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 42.0, icms: 33.5, iss: 0, ipi: 0 } },
      { faixa: 4, rbt12Min: 720000.01, rbt12Max: 1800000, aliqNominal: 10.7, parcelaDeduzir: 22500, partilha: { irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 42.0, icms: 33.5, iss: 0, ipi: 0 } },
      { faixa: 5, rbt12Min: 1800000.01, rbt12Max: 3600000, aliqNominal: 14.3, parcelaDeduzir: 87300, partilha: { irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 42.0, icms: 33.5, iss: 0, ipi: 0 } },
      { faixa: 6, rbt12Min: 3600000.01, rbt12Max: 4800000, aliqNominal: 19.0, parcelaDeduzir: 378000, partilha: { irpj: 13.5, csll: 10.0, cofins: 28.27, pis: 6.13, cpp: 42.1, icms: 0, iss: 0, ipi: 0 } },
    ],
  },
  {
    codigo: 'II',
    nome: 'Anexo II — Indústria',
    descricao: 'Fábricas e estabelecimentos industriais. Inclui parcela de IPI além de ICMS (IBS) e PIS/COFINS (CBS).',
    tributoConsumoSub: 'ICMS',
    faixas: [
      { faixa: 1, rbt12Min: 0, rbt12Max: 180000, aliqNominal: 4.5, parcelaDeduzir: 0, partilha: { irpj: 5.5, csll: 3.5, cofins: 11.51, pis: 2.49, cpp: 37.5, ipi: 7.5, icms: 32.0, iss: 0 } },
      { faixa: 2, rbt12Min: 180000.01, rbt12Max: 360000, aliqNominal: 7.8, parcelaDeduzir: 5940, partilha: { irpj: 5.5, csll: 3.5, cofins: 11.51, pis: 2.49, cpp: 37.5, ipi: 7.5, icms: 32.0, iss: 0 } },
      { faixa: 3, rbt12Min: 360000.01, rbt12Max: 720000, aliqNominal: 10.0, parcelaDeduzir: 13860, partilha: { irpj: 5.5, csll: 3.5, cofins: 11.51, pis: 2.49, cpp: 37.5, ipi: 7.5, icms: 32.0, iss: 0 } },
      { faixa: 4, rbt12Min: 720000.01, rbt12Max: 1800000, aliqNominal: 11.2, parcelaDeduzir: 22500, partilha: { irpj: 5.5, csll: 3.5, cofins: 11.51, pis: 2.49, cpp: 37.5, ipi: 7.5, icms: 32.0, iss: 0 } },
      { faixa: 5, rbt12Min: 1800000.01, rbt12Max: 3600000, aliqNominal: 14.7, parcelaDeduzir: 85500, partilha: { irpj: 5.5, csll: 3.5, cofins: 11.51, pis: 2.49, cpp: 37.5, ipi: 7.5, icms: 32.0, iss: 0 } },
      { faixa: 6, rbt12Min: 3600000.01, rbt12Max: 4800000, aliqNominal: 30.0, parcelaDeduzir: 720000, partilha: { irpj: 8.5, csll: 7.5, cofins: 20.96, pis: 4.54, cpp: 23.5, ipi: 35.0, icms: 0, iss: 0 } },
    ],
  },
  {
    codigo: 'III',
    nome: 'Anexo III — Serviços (Fator R ≥ 28% / Serviços Gerais)',
    descricao: 'Prestação de serviços de manutenção, instalação, agências, contabilidade e Fator R ≥ 28%. IBS substitui ISS.',
    tributoConsumoSub: 'ISS',
    faixas: [
      { faixa: 1, rbt12Min: 0, rbt12Max: 180000, aliqNominal: 6.0, parcelaDeduzir: 0, partilha: { irpj: 4.0, csll: 3.5, cofins: 12.82, pis: 2.78, cpp: 43.4, icms: 0, iss: 33.5, ipi: 0 } },
      { faixa: 2, rbt12Min: 180000.01, rbt12Max: 360000, aliqNominal: 11.2, parcelaDeduzir: 9360, partilha: { irpj: 4.0, csll: 3.5, cofins: 14.05, pis: 3.05, cpp: 43.4, icms: 0, iss: 32.0, ipi: 0 } },
      { faixa: 3, rbt12Min: 360000.01, rbt12Max: 720000, aliqNominal: 13.5, parcelaDeduzir: 17640, partilha: { irpj: 4.0, csll: 3.5, cofins: 13.64, pis: 2.96, cpp: 43.4, icms: 0, iss: 32.5, ipi: 0 } },
      { faixa: 4, rbt12Min: 720000.01, rbt12Max: 1800000, aliqNominal: 16.0, parcelaDeduzir: 35640, partilha: { irpj: 4.0, csll: 3.5, cofins: 13.64, pis: 2.96, cpp: 43.4, icms: 0, iss: 32.5, ipi: 0 } },
      { faixa: 5, rbt12Min: 1800000.01, rbt12Max: 3600000, aliqNominal: 21.0, parcelaDeduzir: 125640, partilha: { irpj: 4.0, csll: 3.5, cofins: 12.82, pis: 2.78, cpp: 43.4, icms: 0, iss: 33.5, ipi: 0 } },
      { faixa: 6, rbt12Min: 3600000.01, rbt12Max: 4800000, aliqNominal: 33.0, parcelaDeduzir: 648000, partilha: { irpj: 35.0, csll: 15.0, cofins: 16.03, pis: 3.47, cpp: 30.5, icms: 0, iss: 0, ipi: 0 } },
    ],
  },
  {
    codigo: 'IV',
    nome: 'Anexo IV — Construção Civil, Vigilância e Advocacia',
    descricao: 'Serviços sem CPP no DAS (INSS patronal recolhido à parte). IBS substitui ISS; CBS substitui PIS/COFINS.',
    tributoConsumoSub: 'ISS',
    faixas: [
      { faixa: 1, rbt12Min: 0, rbt12Max: 180000, aliqNominal: 4.5, parcelaDeduzir: 0, partilha: { irpj: 18.8, csll: 15.2, cofins: 17.67, pis: 3.83, cpp: 0, icms: 0, iss: 44.5, ipi: 0 } },
      { faixa: 2, rbt12Min: 180000.01, rbt12Max: 360000, aliqNominal: 9.0, parcelaDeduzir: 8100, partilha: { irpj: 19.8, csll: 15.2, cofins: 20.55, pis: 4.45, cpp: 0, icms: 0, iss: 40.0, ipi: 0 } },
      { faixa: 3, rbt12Min: 360000.01, rbt12Max: 720000, aliqNominal: 10.2, parcelaDeduzir: 12420, partilha: { irpj: 20.8, csll: 15.2, cofins: 19.73, pis: 4.27, cpp: 0, icms: 0, iss: 40.0, ipi: 0 } },
      { faixa: 4, rbt12Min: 720000.01, rbt12Max: 1800000, aliqNominal: 14.0, parcelaDeduzir: 39780, partilha: { irpj: 17.8, csll: 19.2, cofins: 18.9, pis: 4.1, cpp: 0, icms: 0, iss: 40.0, ipi: 0 } },
      { faixa: 5, rbt12Min: 1800000.01, rbt12Max: 3600000, aliqNominal: 22.0, parcelaDeduzir: 183780, partilha: { irpj: 18.8, csll: 19.2, cofins: 18.08, pis: 3.92, cpp: 0, icms: 0, iss: 40.0, ipi: 0 } },
      { faixa: 6, rbt12Min: 3600000.01, rbt12Max: 4800000, aliqNominal: 33.0, parcelaDeduzir: 828000, partilha: { irpj: 53.5, csll: 21.5, cofins: 20.55, pis: 4.45, cpp: 0, icms: 0, iss: 0, ipi: 0 } },
    ],
  },
  {
    codigo: 'V',
    nome: 'Anexo V — Serviços Intelectuais (Fator R < 28%)',
    descricao: 'Engenharia, tecnologia, auditoria e consultoria quando folha salarial < 28% do faturamento.',
    tributoConsumoSub: 'ISS',
    faixas: [
      { faixa: 1, rbt12Min: 0, rbt12Max: 180000, aliqNominal: 15.5, parcelaDeduzir: 0, partilha: { irpj: 25.0, csll: 15.0, cofins: 14.1, pis: 3.05, cpp: 28.85, icms: 0, iss: 14.0, ipi: 0 } },
      { faixa: 2, rbt12Min: 180000.01, rbt12Max: 360000, aliqNominal: 18.0, parcelaDeduzir: 4500, partilha: { irpj: 23.0, csll: 15.0, cofins: 14.1, pis: 3.05, cpp: 27.85, icms: 0, iss: 17.0, ipi: 0 } },
      { faixa: 3, rbt12Min: 360000.01, rbt12Max: 720000, aliqNominal: 19.5, parcelaDeduzir: 9900, partilha: { irpj: 24.0, csll: 15.0, cofins: 14.92, pis: 3.23, cpp: 23.85, icms: 0, iss: 19.0, ipi: 0 } },
      { faixa: 4, rbt12Min: 720000.01, rbt12Max: 1800000, aliqNominal: 20.5, parcelaDeduzir: 17100, partilha: { irpj: 21.0, csll: 15.0, cofins: 15.74, pis: 3.41, cpp: 23.85, icms: 0, iss: 21.0, ipi: 0 } },
      { faixa: 5, rbt12Min: 1800000.01, rbt12Max: 3600000, aliqNominal: 23.0, parcelaDeduzir: 62100, partilha: { irpj: 23.0, csll: 12.5, cofins: 14.1, pis: 3.05, cpp: 23.85, icms: 0, iss: 23.5, ipi: 0 } },
      { faixa: 6, rbt12Min: 3600000.01, rbt12Max: 4800000, aliqNominal: 30.5, parcelaDeduzir: 540000, partilha: { irpj: 35.0, csll: 15.5, cofins: 16.44, pis: 3.56, cpp: 29.5, icms: 0, iss: 0, ipi: 0 } },
    ],
  },
];

// 8. Fundamentações Legais Oficiais (Dados Abertos RTC)
export const RTC_FUNDAMENTACOES_LEGAIS: RtcFundamentacaoLegal[] = [
  {
    codigo: 'COTEC-342-2026',
    norma: 'Portaria COTEC nº 342/2026 (DOU 13/11/2026)',
    artigo: 'Art. 1º a 5º',
    tema: 'Publicação Oficial em Código Aberto (MIT) da Calculadora RTC',
    resumo: 'Disponibiliza os repositórios oficiais da Receita Federal/SERPRO: Regime Regular, Simples Nacional e Gerador DANFSe para integração offline e via API REST.',
  },
  {
    codigo: 'LC214-ART12',
    norma: 'Lei Complementar nº 214/2025',
    artigo: 'Art. 12',
    tema: 'Base de Cálculo Unificada do IBS e da CBS ("Por Fora")',
    resumo: 'Define o valor da operação como base de cálculo de IBS e CBS, excluindo da base o próprio IBS, a CBS, o IPI e, durante a transição, ICMS, ISS, PIS e COFINS.',
  },
  {
    codigo: 'LC214-ART41',
    norma: 'Lei Complementar nº 214/2025',
    artigo: 'Art. 41, § 3º e Art. 52',
    tema: 'Simples Nacional — Recolhimento Integrado no DAS vs. Regime Regular ("Por Fora")',
    resumo: 'Permite ao optante do Simples Nacional recolher IBS/CBS pelo regime regular para transferir crédito integral em vendas B2B, ou manter no DAS transferindo apenas o valor efetivamente recolhido.',
  },
  {
    codigo: 'LC214-ART125',
    norma: 'Lei Complementar nº 214/2025',
    artigo: 'Art. 125 a 148',
    tema: 'Regimes Diferenciados (Reduções de 30%, 40%, 60% e 100%)',
    resumo: 'Estabelece as reduções de alíquota por NCM/NBS e classificação tributária (cClassTrib) para Cesta Básica, Saúde, Educação, Agropecuária e Profissões Regulamentadas.',
  },
  {
    codigo: 'LC214-ART409',
    norma: 'Lei Complementar nº 214/2025',
    artigo: 'Art. 409 a 438',
    tema: 'Imposto Seletivo (IS)',
    resumo: 'Institui o Imposto Seletivo sobre produção, extração, comercialização ou importação de bens e serviços prejudiciais à saúde ou ao meio ambiente.',
  },
  {
    codigo: 'NT2025-002',
    norma: 'Nota Técnica NF-e / NFC-e nº 2025.002 (IT v1.71)',
    artigo: 'Grupo UB (<IBSCBS>) e Grupo U (<IS>)',
    tema: 'Leiaute XML dos Documentos Fiscais Eletrônicos e Tabela cClassTrib (30/10/2026)',
    resumo: 'Especifica as tags CST, cClassTrib, vBC, gIBSUF, gIBSMun, gCBS, gDif, gRed, IS e totalizadores IBSCBSTot para validação na SEFAZ, incluindo atualizações V0073 (amostras grátis, indDIR e NCM 0710.80.00).',
  },
  {
    codigo: 'ADR003-V172',
    norma: 'Calculadora RTC RFB/SERPRO — v1.7.2 (Regime Regular) e v1.0.2 (Simples Nacional)',
    artigo: 'ADR003 · ABNT NBR 5891 (HALF_EVEN)',
    tema: 'Política Oficial de Precisão Numérica e Arredondamento Único',
    resumo: 'Define aritmética interna exata, arredondamento HALF_EVEN (empate para o par) único no cálculo — base (vBC) em 2 casas, alíquota efetiva (pAliqEfet) em 4 casas — e somatórios fechados sobre valores publicados (evita Rejeição 1091).',
  },
];
