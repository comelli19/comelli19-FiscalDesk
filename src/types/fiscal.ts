export type OperacaoTipo = 'entrada' | 'saida';
export type AbrangenciaTipo = 'estadual' | 'interestadual' | 'exterior';
export type RegimeTributario = 'simples' | 'lucro_presumido' | 'lucro_real';

export interface CFOP {
  id: string;
  codigo: string; // e.g. "5.102"
  descricao: string;
  tipo: OperacaoTipo;
  abrangencia: AbrangenciaTipo;
  grupo: '1xxx' | '2xxx' | '3xxx' | '5xxx' | '6xxx' | '7xxx';
  quandoUsar: string;
  quandoNaoUsar: string;
  cfopDevolucao?: string;
  geraCreditoDebitoICMS: boolean;
  geraCreditoDebitoIPI: boolean;
  geraCreditoDebitoPISCOFINS: boolean;
  movimentaEstoque: boolean;
  movimentaFinanceiro: boolean;
  vigenciaInicio: string;
  vigenciaFim?: string;
  fonte: string;
  dataAtualizacao: string;
  favorito?: boolean;
  anotacoes?: string;
}

export interface UFInfo {
  sigla: string;
  nome: string;
  regiao: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  aliquotaInterna: number; // e.g. 18.0
  fcp: number; // Fundo de combate a pobreza e.g. 2.0
  vigenciaInicio: string;
  vigenciaFim?: string;
  fonte: string;
  dataAtualizacao: string;
  temST: boolean;
  temSuframaOuALC: boolean;
  municipiosRegimeEspecial?: string[];
  observacoesFiscais: string;
}

export interface NCMInfo {
  codigo: string; // e.g. "8504.40.10"
  descricao: string;
  aliquotaIPI: number;
  regimePISCOFINS: 'geral' | 'monofasico' | 'aliquota_zero' | 'substituicao';
  aliquotaPIS: number;
  aliquotaCOFINS: number;
  cestPadrao?: string;
  cest?: string;
  mvaOriginalPadrao?: number;
  temST: boolean;
  unidadeTributavel: string;
  tributacaoAproximadaIBPT: {
    federal: number;
    estadual: number;
    municipal: number;
  };
  fonteOficial: string;
  dataAtualizacao: string;
  observacao?: string;
  setor?: string;
  capitulo?: string;
}

export interface CBenef {
  id: string;
  uf: string;
  codigo: string; // e.g. "SP000001", "PR800001", "RS051001"
  descricao: string;
  cst: string; // e.g. "20", "40", "41", "51"
  tipoBeneficio: 'Isenção' | 'Redução de Base' | 'Diferimento' | 'Suspensão' | 'Não Incidência' | 'Crédito Presumido';
  exigeValorDesonerado: boolean;
  vigenciaInicio: string;
  vigenciaFim?: string;
  fonteOficial: string;
  dataAtualizacao: string;
  exemploUso: string;
}

export interface CarimboFiscal {
  id: string;
  titulo: string;
  categoria?: string;
  tipoOperacao: string;
  ufAplicavel: string;
  textoObrigatorio: string;
  quandoUsar: string;
  cbenefSugerido?: string;
  fonteOficial: string;
  tagsNFeRelacionadas: string[];
  dataAtualizacao: string;
}

export interface ReformaTributariaRegra {
  ano: number;
  fase: string;
  aliquotaCBS: number; // %
  aliquotaIBS: number; // %
  aliquotaPISCOFINS: number; // %
  reducaoICMSPercentual: number; // % de redução sobre o ICMS atual
  descricaoTransicao: string;
  impostoSeletivoAplicavel: boolean;
  fonteOficial: string;
}

export interface STRegra {
  id: string;
  ufOrigem: string;
  ufDestino: string;
  ncm: string;
  cest: string;
  descricaoProduto: string;
  mvaOriginal: number; // e.g. 40.0
  protocoloConvenio: string;
  aderiu: boolean;
  vigenciaInicio: string;
  vigenciaFim?: string;
  fonte: string;
  dataAtualizacao: string;
}

export interface SuframaRegra {
  id: string;
  uf: string;
  municipio: string;
  tipoArea: 'ZFM' | 'ALC';
  isencaoICMS: boolean;
  reducaoOuIsencaoIPI: boolean;
  aliquotaZeroPISCOFINS: boolean;
  exigePINInternamento: boolean;
  cfopsComuns: string[];
  cMotDesICMS: string; // e.g. "7 - Suframa"
  alertasObrigatorios: string[];
  documentosExigidos: string[];
  vigenciaInicio: string;
  fonte: string;
  dataAtualizacao: string;
}

export interface RejeicaoSEFAZ {
  codigo: number;
  descricao: string;
  causaProvavel: string;
  comoCorrigir: string;
  regraValidacao: string;
  tagsXMLAfetadas: string[];
  exemploCorrecao: string;
  fonteManual: string;
  dataAtualizacao: string;
  historicoOcorrencias?: number;
}

export interface CalculoEntrada {
  tipoOperacao: 'venda' | 'devolucao_venda' | 'devolucao_compra';
  ufOrigem: string;
  ufDestino: string;
  regime: RegimeTributario;
  consumidorFinal: boolean;
  destinatarioContribuinte: boolean;
  valorProdutos: number;
  valorFrete: number;
  valorSeguro: number;
  outrasDespesas: number;
  desconto: number;
  aliquotaIPI: number;
  temST: boolean;
  mvaOriginal: number;
  ncm?: string;
  chaveNFeReferenciada?: string; // Para devolução
}

export interface MemoriaPasso {
  titulo: string;
  formula: string;
  valores: string;
  resultado: string;
  explicacao: string;
  fonteOficial?: string;
}

export interface CalculoResultado {
  baseICMSProprio: number;
  aliquotaICMSProprio: number;
  valorICMSProprio: number;
  
  // ST
  mvaAjustada?: number;
  baseST?: number;
  aliquotaST?: number;
  valorICMSST?: number;
  
  // DIFAL
  aplicaDIFAL: boolean;
  baseDIFAL?: number;
  aliquotaInterDIFAL?: number;
  aliquotaIntDestino?: number;
  aliquotaFCP?: number;
  valorDIFAL?: number;
  valorFCP?: number;
  
  // IPI
  baseIPI: number;
  aliquotaIPI: number;
  valorIPI: number;
  
  // PIS / COFINS
  basePISCOFINS: number;
  aliquotaPIS: number;
  valorPIS: number;
  aliquotaCOFINS: number;
  valorCOFINS: number;
  excluiuICMSdaBasePISCOFINS: boolean;

  // Reforma Tributária (IBS e CBS)
  projecaoIBSCBS?: {
    aliquotaCBS: number;
    valorCBS: number;
    aliquotaIBS: number;
    valorIBS: number;
    totalNovoModelo: number;
    diferencaModeloAtual: number;
    anoReferencia: number;
    fonteOficial: string;
  };
  
  // Totais
  valorTotalOperacao: number;
  valorTotalTributos: number;
  cargaTributariaEfetivaPercentual: number;
  
  cfopSugerido: string;
  memoriaCalculo: MemoriaPasso[];
  avisosFiscais: string[];
  fonteOficialPrincipal: string;
}

export interface ComparacaoCenario {
  titulo: string;
  descricao: string;
  cfop: string;
  ufDestino: string;
  aliquotaEfetivaICMS: number;
  valorICMS: number;
  valorST: number;
  valorDIFAL: number;
  valorIPI: number;
  valorPIS: number;
  valorCOFINS: number;
  totalTributos: number;
  valorFinalNota: number;
  vantagensDesvantagens: string;
  fonteOficial: string;
}

export interface XMLValidacaoResultado {
  valido: boolean;
  erros: Array<{
    tipo: 'erro' | 'alerta' | 'conformidade';
    codigo?: number;
    tag?: string;
    mensagem: string;
    explicacao: string;
    solucao: string;
    fonteOficial?: string;
  }>;
  resumoNF?: {
    chave?: string;
    numero?: string;
    serie?: string;
    emitenteUF?: string;
    destinatarioUF?: string;
    cfopItemPrincipal?: string;
    valorTotalNF?: number;
    itensCount?: number;
  };
}

// ==========================================
// MOTOR FISCAL UNIVERSAL BRASILEIRO
// ==========================================

export type RegimeTributarioUniversal =
  | 'simples_nacional'
  | 'mei'
  | 'lucro_presumido'
  | 'lucro_real'
  | 'regime_especial';

export type TipoOperacaoUniversal =
  | 'venda_revenda'
  | 'venda_producao'
  | 'industrializacao'
  | 'remessa_industrializacao'
  | 'retorno_industrializacao'
  | 'transferencia'
  | 'devolucao_venda'
  | 'devolucao_compra'
  | 'bonificacao'
  | 'brinde'
  | 'amostra_gratis'
  | 'venda_consumidor_final'
  | 'importacao'
  | 'exportacao'
  | 'remessa_conserto'
  | 'retorno_conserto'
  | 'remessa_demonstracao'
  | 'retorno_demonstracao'
  | 'ativo_imobilizado'
  | 'baixa_perda_roubo'
  | 'servico_iss';

export type NivelConfiabilidadeTipo = 'simulacao' | 'validado' | 'liberado_emissao';

export interface CheckTecnicoSEFAZ {
  id: string;
  nome: string;
  descricao: string;
  obrigatorio: boolean;
  passou: boolean;
  detalhe: string;
}

export interface StatusConfiabilidade {
  nivel: NivelConfiabilidadeTipo;
  pontuacao: number; // 0 a 100
  titulo: string;
  descricao: string;
  simulacaoValida: boolean;
  fontesOficiaisValidadas: string[];
  checksTecnicos: CheckTecnicoSEFAZ[];
  bloqueiosParaEmissao: string[];
  alertasAdvertencia: string[];
}

export interface DetalheTributoUniversal {
  sigla: string;
  nomeCompleto: string;
  incide: boolean;
  baseCalculo: number;
  aliquota: number;
  valor: number;
  cstOuCsosn: string;
  cClasTrib?: string;
  fatorReducaoOuBeneficio?: string;
  motivoDesoneracao?: string;
  valorDesonerado?: number;
  formula: string;
  explicacao: string;
  fundamentoJuridico: string;
}

export interface MotorUniversalEntrada {
  dataOperacao: string; // YYYY-MM-DD
  regimeTributario: RegimeTributarioUniversal;
  tipoOperacao: TipoOperacaoUniversal;
  ufOrigem: string;
  municipioOrigem?: string;
  ufDestino: string;
  municipioDestino?: string;
  
  // Destinatário
  destinatarioContribuinte: boolean;
  destinatarioConsumidorFinal: boolean;
  destinatarioTemInscricaoEstadual: boolean;
  destinatarioSuframaHabilitado: boolean;
  
  // Produto
  ncm: string;
  cest?: string;
  descricaoProduto: string;
  origemMercadoria: string; // 0 a 8
  valorProduto: number;
  valorFrete: number;
  valorSeguro: number;
  outrasDespesas: number;
  desconto: number;
  
  // Indicadores
  temSubstituicaoTributaria: boolean;
  mvaOriginal: number;
  aliquotaIPIInformada?: number;
  aliquotaSimplesCreditoICMS?: number; // Para Simples Nacional
  codigoBeneficioFiscal?: string; // cBenef
  reducaoBaseICMSPercentual?: number;
  valorAduaneiroCIF?: number; // Para Importação
  taxaSiscomexAFRMM?: number; // Para Importação
}

export interface MotorUniversalResultado {
  dataOperacao: string;
  regimeTributario: RegimeTributarioUniversal;
  tipoOperacao: TipoOperacaoUniversal;
  ufOrigem: string;
  ufDestino: string;
  isOperacaoInterna: boolean;
  isInterestadual: boolean;
  isExterior: boolean;
  isZFMouALC: boolean;
  documentoFiscalAdequado: 'NF-e (Modelo 55)' | 'NFS-e (Municipal)' | 'CT-e' | 'NFC-e';
  
  // Enquadramento
  cfopPrincipal: string;
  naturezaOperacaoSugerida: string;
  cstOuCsosnSugerido: string;
  
  // Valores da Operação
  valorBaseOperacional: number;
  valorTotalOperacao: number;
  valorTotalTributos: number;
  cargaTributariaEfetivaPercentual: number;
  
  // Níveis de Confiabilidade
  confiabilidade: StatusConfiabilidade;
  
  // Tributos Individuais
  icmsProprio: DetalheTributoUniversal;
  icmsST: DetalheTributoUniversal;
  difal: DetalheTributoUniversal;
  fcp: DetalheTributoUniversal;
  ipi: DetalheTributoUniversal;
  pis: DetalheTributoUniversal;
  cofins: DetalheTributoUniversal;
  iss: DetalheTributoUniversal;
  impostoImportacao: DetalheTributoUniversal;
  ibs: DetalheTributoUniversal;
  cbs: DetalheTributoUniversal;
  impostoSeletivo: DetalheTributoUniversal;
  
  // Textos e Documentação
  carimboObrigatorioInfCpl: string;
  memoriaCompleta: MemoriaPasso[];
  fundamentacaoLegalConsolidada: Array<{
    tributo: string;
    norma: string;
    dispositivo: string;
    descricao: string;
  }>;
}

export interface CenarioFiscalNacional {
  id: string;
  regiao: 'Sul' | 'Sudeste' | 'Centro-Oeste' | 'Nordeste' | 'Norte' | 'Comércio Exterior';
  titulo: string;
  descricaoCurta: string;
  entrada: MotorUniversalEntrada;
  pontosChaveAnalise: string[];
}

