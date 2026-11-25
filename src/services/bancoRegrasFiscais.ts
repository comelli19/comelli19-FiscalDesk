/**
 * Banco de Dados de Regras Fiscais Parametrizadas & Estruturadas
 * Armazena perfis fiscais de empresas, regras por tributo com controle de vigência e fundamentação oficial
 */

import { PerfilEmpresaFiscal, RegraTributariaParametrizada } from '../types/motorRegras';

/**
 * Cadastro estruturado de estabelecimentos/empresas
 */
export const EMPRESAS_CADASTRADAS: PerfilEmpresaFiscal[] = [
  {
    id: 'emp_rs_ind',
    nome: 'NOVA INDÚSTRIA METALÚRGICA LTDA',
    cnpj: '04.123.456/0001-89',
    uf: 'RS',
    regimeTributario: 'lucro_presumido',
    inscricaoEstadual: '096/0123456',
    cnaePrincipal: '2511-0/00 - Fabricação de estruturas metálicas',
    municipio: 'Porto Alegre',
    regimeEspecial: 'Benefício ZFM Habilitado Suframa',
    tipoEstabelecimento: 'MATRIZ',
  },
  {
    id: 'emp_sp_com',
    nome: 'DISTRIBUIDORA PAULISTA DE MATERIAIS S.A.',
    cnpj: '61.987.654/0001-10',
    uf: 'SP',
    regimeTributario: 'lucro_real',
    inscricaoEstadual: '110.456.789.112',
    cnaePrincipal: '4673-7/00 - Comércio atacadista de material elétrico',
    municipio: 'São Paulo',
    tipoEstabelecimento: 'MATRIZ',
  },
  {
    id: 'emp_sc_simples',
    nome: 'INOVA PLÁSTICOS E CONSTRUÇÃO EIRELI',
    cnpj: '28.345.678/0001-22',
    uf: 'SC',
    regimeTributario: 'simples_nacional',
    inscricaoEstadual: '254.890.123',
    cnaePrincipal: '2229-3/00 - Fabricação de artefatos de material plástico',
    municipio: 'Joinville',
    tipoEstabelecimento: 'MATRIZ',
  },
  {
    id: 'emp_ba_com',
    nome: 'NORDESTE LOGÍSTICA E DISTRIBUIÇÃO LTDA',
    cnpj: '13.567.890/0001-55',
    uf: 'BA',
    regimeTributario: 'lucro_presumido',
    inscricaoEstadual: '045.678.901',
    cnaePrincipal: '4689-3/99 - Comércio atacadista especializado em outros produtos',
    municipio: 'Salvador',
    tipoEstabelecimento: 'FILIAL',
  },
];

/**
 * Matriz de Regras Tributárias Parametrizadas
 */
export const REGRAS_TRIBUTARIAS_PARAMETRIZADAS: RegraTributariaParametrizada[] = [
  // ==========================================
  // 1. REGRAS ICMS
  // ==========================================
  {
    id: 'REG_ICMS_ZFM_001',
    tributo: 'ICMS',
    nomeRegra: 'Isenção de ICMS para Venda à Zona Franca de Manaus e ALC',
    condicoes: {
      tipoOperacao: 'interestadual',
      envolveZFMouALC: true,
      destinatarioContribuinte: true,
      finalidade: ['industrializacao', 'comercializacao'],
    },
    resultado: {
      cst: '40',
      csosn: '400',
      aliquota: 0,
      beneficioFiscal: 'Convênio ICMS 65/88',
    },
    fundamentacaoLegal: 'Convênio ICMS 65/88, Art. 1º e Convênio ICMS 52/92 (Desoneração para ZFM/ALC com inscrição Suframa ativa)',
    abrangenciaTerritorial: 'Interestadual para AM, AP, RR, RO, AC',
    vigenciaInicio: '1988-12-09',
    versao: '2.4',
    validador: 'Auditoria SEFAZ Nacional',
  },
  {
    id: 'REG_ICMS_DIFAL_NC_002',
    tributo: 'ICMS',
    nomeRegra: 'Venda Interestadual a Não Contribuinte (EC 87/2015 - DIFAL)',
    condicoes: {
      tipoOperacao: 'interestadual',
      destinatarioContribuinte: false,
      consumidorFinal: true,
      envolveZFMouALC: false,
    },
    resultado: {
      cst: '00',
      aliquota: 'INTERESTADUAL', // 4%, 7% ou 12%
      mva: '0%',
    },
    fundamentacaoLegal: 'Emenda Constitucional nº 87/2015 e Lei Complementar nº 190/2022 (Partilha de DIFAL 100% para o Estado de Destino)',
    abrangenciaTerritorial: 'Nacional Interestadual',
    vigenciaInicio: '2016-01-01',
    versao: '3.1',
    validador: 'Auditoria CONFAZ',
  },
  {
    id: 'REG_ICMS_INTER_NORMAL_003',
    tributo: 'ICMS',
    nomeRegra: 'Venda Interestadual Normal entre Contribuintes',
    condicoes: {
      tipoOperacao: 'interestadual',
      destinatarioContribuinte: true,
      envolveZFMouALC: false,
    },
    resultado: {
      cst: '00',
      aliquota: 'INTERESTADUAL',
    },
    fundamentacaoLegal: 'Resolução do Senado Federal nº 22/89 (Alíquotas de 7% ou 12% conforme região)',
    abrangenciaTerritorial: 'Nacional Interestadual',
    vigenciaInicio: '1989-05-19',
    versao: '1.0',
    validador: 'Auditoria Tributária',
  },
  {
    id: 'REG_ICMS_INTERNO_004',
    tributo: 'ICMS',
    nomeRegra: 'Operação Interna no Mesmo Estado',
    condicoes: {
      tipoOperacao: 'interna',
    },
    resultado: {
      cst: '00',
      aliquota: 'MODAL_UF',
    },
    fundamentacaoLegal: 'Legislação do ICMS do Estado de Origem (RICMS Estadual e Leis Orçamentárias)',
    abrangenciaTerritorial: 'Estadual',
    vigenciaInicio: '2024-01-01',
    versao: '2026.1',
    validador: 'Auditoria SEFAZ Estadual',
  },
  {
    id: 'REG_ICMS_EXPORT_005',
    tributo: 'ICMS',
    nomeRegra: 'Exportação para o Exterior (Não Incidência / Imunidade)',
    condicoes: {
      tipoOperacao: 'exterior',
    },
    resultado: {
      cst: '41',
      aliquota: 0,
      beneficioFiscal: 'Imunidade Constitucional',
    },
    fundamentacaoLegal: 'Constituição Federal de 1988, Art. 155, § 2º, X, "a" e Lei Complementar nº 87/1996 (Lei Kandir)',
    abrangenciaTerritorial: 'Internacional',
    vigenciaInicio: '1996-09-13',
    versao: '1.0',
    validador: 'Receita Federal / SECEX',
  },

  // ==========================================
  // 2. REGRAS PIS & COFINS
  // ==========================================
  {
    id: 'REG_PIS_COFINS_ZFM_001',
    tributo: 'PIS',
    nomeRegra: 'PIS e COFINS Alíquota Zero para ZFM e ALC',
    condicoes: {
      tipoOperacao: 'interestadual',
      envolveZFMouALC: true,
      destinatarioContribuinte: true,
    },
    resultado: {
      cst: '06',
      aliquota: 0,
      beneficioFiscal: 'Alíquota Zero ZFM',
    },
    fundamentacaoLegal: 'Lei nº 10.996/2004, Art. 2º (Alíquota Zero de PIS/COFINS nas vendas de mercadorias destinadas a pessoas jurídicas sediadas na ZFM)',
    abrangenciaTerritorial: 'ZFM e ALC',
    vigenciaInicio: '2004-12-15',
    versao: '2.0',
    validador: 'Receita Federal do Brasil',
  },
  {
    id: 'REG_PIS_COFINS_EXPORT_002',
    tributo: 'PIS',
    nomeRegra: 'Não Incidência de PIS e COFINS na Exportação',
    condicoes: {
      tipoOperacao: 'exterior',
    },
    resultado: {
      cst: '08',
      aliquota: 0,
    },
    fundamentacaoLegal: 'Constituição Federal de 1988, Art. 149, § 2º, I e Lei nº 10.833/2003, Art. 6º',
    abrangenciaTerritorial: 'Internacional',
    vigenciaInicio: '2003-12-29',
    versao: '1.2',
    validador: 'Receita Federal do Brasil',
  },
  {
    id: 'REG_PIS_COFINS_GERAL_003',
    tributo: 'PIS',
    nomeRegra: 'Incidência Geral de PIS/COFINS (Regime Não Cumulativo / Cumulativo)',
    condicoes: {
      envolveZFMouALC: false,
    },
    resultado: {
      cst: '01',
      aliquota: 1.65, // PIS 1.65%, COFINS 7.60%
    },
    fundamentacaoLegal: 'Lei nº 10.637/2002 e Lei nº 10.833/2003 (Regime Não-Cumulativo Padrão)',
    abrangenciaTerritorial: 'Nacional',
    vigenciaInicio: '2004-02-01',
    versao: '1.0',
    validador: 'Receita Federal do Brasil',
  },

  // ==========================================
  // 3. REGRAS IPI
  // ==========================================
  {
    id: 'REG_IPI_ZFM_001',
    tributo: 'IPI',
    nomeRegra: 'Isenção de IPI para Produtos Destinados à Zona Franca de Manaus',
    condicoes: {
      envolveZFMouALC: true,
      tipoOperacao: 'interestadual',
      destinatarioContribuinte: true,
    },
    resultado: {
      cst: '52',
      aliquota: 0,
      beneficioFiscal: 'Isenção ZFM Dec. 7.212/10',
    },
    fundamentacaoLegal: 'Decreto nº 7.212/2010 (RIPI), Art. 81, inciso II c/c Decreto-Lei nº 288/1967',
    abrangenciaTerritorial: 'ZFM e ALC',
    vigenciaInicio: '2010-06-15',
    versao: '2.1',
    validador: 'Receita Federal do Brasil',
  },
  {
    id: 'REG_IPI_EXPORT_002',
    tributo: 'IPI',
    nomeRegra: 'Imunidade de IPI para Mercadorias Exportadas',
    condicoes: {
      tipoOperacao: 'exterior',
    },
    resultado: {
      cst: '54',
      aliquota: 0,
    },
    fundamentacaoLegal: 'Constituição Federal de 1988, Art. 153, § 3º, III e Decreto nº 7.212/2010 (RIPI), Art. 18',
    abrangenciaTerritorial: 'Internacional',
    vigenciaInicio: '2010-06-15',
    versao: '1.0',
    validador: 'Receita Federal do Brasil',
  },
  {
    id: 'REG_IPI_REVENDA_003',
    tributo: 'IPI',
    nomeRegra: 'Saída Não Tributada de IPI para Estabelecimento Comercial Atacadista/Varejista',
    condicoes: {
      finalidade: ['comercializacao', 'consumo'],
    },
    resultado: {
      cst: '53',
      aliquota: 0,
    },
    fundamentacaoLegal: 'Decreto nº 7.212/2010 (RIPI), Art. 38 (Revenda de mercadoria sem industrialização própria)',
    abrangenciaTerritorial: 'Nacional',
    vigenciaInicio: '2010-06-15',
    versao: '1.0',
    validador: 'Receita Federal do Brasil',
  },
  {
    id: 'REG_IPI_INDUSTRIA_004',
    tributo: 'IPI',
    nomeRegra: 'Saída Tributada de IPI conforme Tabela TIPI',
    condicoes: {
      finalidade: ['industrializacao'],
      envolveZFMouALC: false,
    },
    resultado: {
      cst: '50',
      aliquota: 'TIPI',
    },
    fundamentacaoLegal: 'Decreto nº 11.158/2022 (Aprova a Tabela de Incidência do IPI - TIPI)',
    abrangenciaTerritorial: 'Nacional',
    vigenciaInicio: '2022-08-01',
    versao: '2026.1',
    validador: 'Receita Federal do Brasil',
  },

  // ==========================================
  // 4. REGRAS REFORMA TRIBUTÁRIA (CBS & IBS)
  // ==========================================
  {
    id: 'REG_REFORMA_ZFM_001',
    tributo: 'CBS',
    nomeRegra: 'Tratamento Diferenciado ZFM/ALC - CBS e IBS',
    condicoes: {
      envolveZFMouALC: true,
      destinatarioContribuinte: true,
    },
    resultado: {
      cst: '03', // Alíquota zero
      cClassTrib: '000002', // Regime favorecido regional
      aliquota: 0,
      beneficioFiscal: 'Preservação Constitucional ZFM',
    },
    fundamentacaoLegal: 'Emenda Constitucional nº 132/2023, Art. 92-B e Projeto de Lei Complementar nº 68/2024 (Regime Diferenciado da Zona Franca de Manaus)',
    abrangenciaTerritorial: 'ZFM e ALC',
    vigenciaInicio: '2026-01-01',
    versao: '1.0',
    validador: 'Comitê Gestor do IBS e Receita Federal (CBS)',
  },
  {
    id: 'REG_REFORMA_EXPORT_002',
    tributo: 'CBS',
    nomeRegra: 'Desoneração Completa nas Exportações - CBS e IBS',
    condicoes: {
      tipoOperacao: 'exterior',
    },
    resultado: {
      cst: '04', // Imunidade / Desoneração
      cClassTrib: '000003',
      aliquota: 0,
    },
    fundamentacaoLegal: 'CF/88 Art. 149-B, EC nº 132/2023 (Princípio da Destinação e Imunidade Completa das Exportações de Bens e Serviços)',
    abrangenciaTerritorial: 'Internacional',
    vigenciaInicio: '2026-01-01',
    versao: '1.0',
    validador: 'Comitê Gestor do IBS / RFB',
  },
  {
    id: 'REG_REFORMA_GERAL_003',
    tributo: 'CBS',
    nomeRegra: 'Regime Geral CBS e IBS - Princípio do Destino',
    condicoes: {
      envolveZFMouALC: false,
    },
    resultado: {
      cst: '01', // Tributação Integral
      cClassTrib: '000001', // Operação Geral
      aliquota: 8.8, // CBS 8.8% de referência
    },
    fundamentacaoLegal: 'Emenda Constitucional nº 132/2023 e PLP nº 68/2024 (Tributação no Destino e Não-Cumulatividade Plena)',
    abrangenciaTerritorial: 'Nacional',
    vigenciaInicio: '2026-01-01',
    versao: '1.0',
    validador: 'Comitê Gestor do IBS / RFB',
  },
];
