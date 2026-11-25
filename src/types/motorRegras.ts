/**
 * Motor Fiscal Universal & Sistema de Inteligência Tributária
 * Tipagens estruturadas para o motor de regras desacoplado e simulador orientado ao cliente
 */

import { RegimeTributarioUniversal, NivelConfiabilidadeTipo } from './fiscal';

export interface PerfilEmpresaFiscal {
  id: string;
  nome: string;
  cnpj: string;
  uf: string;
  regimeTributario: RegimeTributarioUniversal;
  inscricaoEstadual: string;
  cnaePrincipal: string;
  municipio: string;
  regimeEspecial?: string;
  tipoEstabelecimento: 'MATRIZ' | 'FILIAL';
}

export type FinalidadeMercadoria =
  | 'comercializacao'
  | 'industrializacao'
  | 'consumo'
  | 'ativo_imobilizado';

export interface DadosEtapa1Operacao {
  empresaOrigemId?: string;
  regimeTributario: RegimeTributarioUniversal;
  ufOrigem: string;
  ufDestino: string;
  municipioDestino: string;
  tipoOperacao: 'interna' | 'interestadual' | 'exterior';
  emissaoPropria: 'PRÓPRIA' | 'TERCEIROS';
  cfopManual?: string;
}

export interface DadosEtapa2Caracteristicas {
  finalidadeMercadoria: FinalidadeMercadoria;
  destinatarioContribuinte: boolean;
  destinatarioPossuiIE: boolean;
  consumidorFinal: boolean;
  origemMercadoria: string; // 0 a 7
  envolveZFMouALC: boolean;
  geraFinanceiro: boolean;
  movimentaEstoque: boolean;
}

export interface DadosEtapa3Produto {
  descricaoComercial: string;
  ncmCodigo: string;
  ncmDescricao?: string;
  aliquotaIPIPadrao?: number;
  origemMercadoria: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface RegraTributariaParametrizada {
  id: string;
  tributo: 'ICMS' | 'ICMS_ST' | 'DIFAL' | 'IPI' | 'PIS' | 'COFINS' | 'CBS' | 'IBS' | 'II';
  nomeRegra: string;
  condicoes: {
    tipoOperacao?: 'interna' | 'interestadual' | 'exterior';
    ufOrigem?: string | string[];
    ufDestino?: string | string[];
    envolveZFMouALC?: boolean;
    destinatarioContribuinte?: boolean;
    consumidorFinal?: boolean;
    finalidade?: FinalidadeMercadoria[];
    regimeEmitente?: RegimeTributarioUniversal[];
    capituloNCM?: string[];
  };
  resultado: {
    cst: string;
    csosn?: string;
    aliquota: number | string;
    cClassTrib?: string;
    mva?: string;
    fcp?: number;
    reducaoBase?: number;
    beneficioFiscal?: string;
  };
  fundamentacaoLegal: string;
  abrangenciaTerritorial: string;
  vigenciaInicio: string; // ISO date
  vigenciaFim?: string;
  versao: string;
  validador: string;
}

export interface DetalheTributoSaida {
  tributo: string;
  cst: string;
  csosn?: string;
  aliquota: number | string;
  baseCalculo: number;
  valorTributo: number;
  cClassTrib?: string;
  mva?: string;
  fcp?: number;
  fundamentacaoLegal: string;
  motivoEnquadramento: string;
  statusValidacao: 'VALIDADO_OFICIAL' | 'PARAMETRIZADO' | 'REQUER_CONFIRMACAO';
}

export interface DetalheICMSST {
  aplicavel: boolean;
  retidaAnteriormente: boolean;
  cstOuCsosn: string;
  cest?: string;
  protocolo?: string;
  mvaOriginal: number;
  mvaAjustada: number;
  mvaAplicada: number;
  usouMvaOriginalSimples: boolean;
  aliquotaInternaDestino: number;
  aliquotaOperacaoPropria: number;
  baseCalculoST: number;
  icmsProprioDeduzido: number;
  valorICMSST: number;
  fcpSTAliquota: number;
  valorFCPST: number;
  fundamentacaoLegal: string;
  motivoEnquadramento: string;
  formulaCalculo: string;
  origemRegraMVA: 'manual' | 'tabela_protocolo_st' | 'ncm_padrao' | 'nao_aplicavel';
}

export interface PassoMemoriaCalculo {
  tributo: string;
  formula: string;
  resultado: string;
  referenciaTabela: string;
}

export interface ResultadoSimuladorInteligente {
  // CFOP e Natureza
  cfopRecomendado: {
    codigo: string;
    descricao: string;
    abrangencia: 'estadual' | 'interestadual' | 'exterior';
    quandoUsar: string;
  };
  naturezaOperacao: string;
  codigoOrigemMercadoria: string;

  // Tributos Tradicionais
  icms: DetalheTributoSaida;
  icmsST: DetalheICMSST;
  ii: DetalheTributoSaida;
  pis: DetalheTributoSaida;
  cofins: DetalheTributoSaida;
  ipi: DetalheTributoSaida;

  // Reforma Tributária (Ativa nas Notas Fiscais)
  cbs: DetalheTributoSaida;
  ibs: DetalheTributoSaida;

  // Partilhas e Específicos
  difal: {
    aplicavel: boolean;
    tipoDifal:
      | 'nao_contribuinte_ec87'
      | 'contribuinte_uso_consumo_ativo'
      | 'dispensado_simples'
      | 'nao_aplicavel';
    responsavelRecolhimento: 'remetente' | 'destinatario' | 'nenhum';
    aliquotaInter: number;
    aliquotaDestino: number;
    diferencial: number;
    fcp: number;
    valorDifal: number;
    valorFCP: number;
    baseLegal: string;
  };

  // Nível de Confiabilidade e Checklist SEFAZ
  nivelConfiabilidade: NivelConfiabilidadeTipo;
  checklistValidacoes: Array<{
    item: string;
    status: 'ok' | 'alerta' | 'pendente';
    mensagem: string;
  }>;
  alertasInconsistencias: string[];
  dataReferenciaLegislacao: string;
  memoriaCalculo: {
    valorProdutos: number;
    valorICMS: number;
    valorICMSDesonerado: number;
    valorICMSST: number;
    valorFCPST: number;
    valorDIFAL: number;
    valorFCP: number;
    valorIPI: number;
    basePISCOFINS: number;
    exclusaoICMSBasePISCOFINS: number;
    valorPIS: number;
    valorCOFINS: number;
    valorCBS: number;
    valorIBS: number;
    totalTributos: number;
    totalNota: number;
    cargaTributariaEfetivaPercentual: number;
    passos: PassoMemoriaCalculo[];
  };
}

export interface OperacaoSimuladorSnapshot {
  etapa1: DadosEtapa1Operacao;
  etapa2: DadosEtapa2Caracteristicas;
  etapa3: DadosEtapa3Produto;
  resultado: ResultadoSimuladorInteligente;
}

