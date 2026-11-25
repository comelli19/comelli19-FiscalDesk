import { CBenef, CarimboFiscal } from '../types/fiscal';

export const INITIAL_CBENEF: CBenef[] = [
  // ==========================================
  // SÃO PAULO (SP) - Portaria CAT nº 16/2020
  // ==========================================
  {
    id: 'cb-sp-01',
    uf: 'SP',
    codigo: 'SP000001',
    descricao: 'Isenção de ICMS em operações internas com produtos da cesta básica e hortifrutigranjeiros',
    cst: '40',
    tipoBeneficio: 'Isenção',
    exigeValorDesonerado: false,
    vigenciaInicio: '2020-01-01',
    fonteOficial: 'Portaria CAT nº 16/2020 e Anexo I do RICMS/SP (Decreto nº 45.490/2000)',
    dataAtualizacao: '2026-01-15',
    exemploUso: 'Venda de hortifrutigranjeiros em estado natural ou leite pasteurizado tipo especial.',
  },
  {
    id: 'cb-sp-02',
    uf: 'SP',
    codigo: 'SP020001',
    descricao: 'Redução de base de cálculo de ICMS para alíquota efetiva de 7% (Cesta básica paulista)',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2020-01-01',
    fonteOficial: 'Artigo 3º do Anexo II do RICMS/SP e Portaria CAT nº 16/2020',
    dataAtualizacao: '2026-01-15',
    exemploUso: 'Operações internas com carnes, arroz, feijão, farinhas e óleo de soja com redução de base.',
  },
  {
    id: 'cb-sp-03',
    uf: 'SP',
    codigo: 'SP020002',
    descricao: 'Redução de base de cálculo nas operações com máquinas industriais e implementos agrícolas',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2020-01-01',
    fonteOficial: 'Artigo 12 do Anexo II do RICMS/SP e Convênio ICMS 52/1991',
    dataAtualizacao: '2026-01-15',
    exemploUso: 'Saídas de tratores, colheitadeiras e maquinário industrial constante do Convênio 52/91.',
  },
  {
    id: 'cb-sp-04',
    uf: 'SP',
    codigo: 'SP051001',
    descricao: 'Diferimento total do ICMS nas saídas de matéria-prima e insumos para estabelecimento industrializador',
    cst: '51',
    tipoBeneficio: 'Diferimento',
    exigeValorDesonerado: false,
    vigenciaInicio: '2020-01-01',
    fonteOficial: 'Artigo 350 e seguintes do RICMS/SP (Decreto nº 45.490/2000)',
    dataAtualizacao: '2026-01-15',
    exemploUso: 'Remessa de sucata de metais não ferrosos, couros e matéria-prima com ICMS postergado.',
  },
  {
    id: 'cb-sp-05',
    uf: 'SP',
    codigo: 'SP041001',
    descricao: 'Não incidência de ICMS nas remessas com fim específico de exportação (Exportação indireta)',
    cst: '41',
    tipoBeneficio: 'Não Incidência',
    exigeValorDesonerado: false,
    vigenciaInicio: '2020-01-01',
    fonteOficial: 'Artigo 7º, § 1º do RICMS/SP e Convênio ICMS 84/2009',
    dataAtualizacao: '2026-01-15',
    exemploUso: 'Remessas para empresa comercial exportadora ou trading company habilitada.',
  },

  // ==========================================
  // RIO GRANDE DO SUL (RS) - IN RE nº 059/2023
  // ==========================================
  {
    id: 'cb-rs-01',
    uf: 'RS',
    codigo: 'RS051001',
    descricao: 'Diferimento do ICMS nas saídas internas para contribuintes industriais credenciados',
    cst: '51',
    tipoBeneficio: 'Diferimento',
    exigeValorDesonerado: false,
    vigenciaInicio: '2019-05-01',
    fonteOficial: 'Instrução Normativa RE nº 059/2023 (SEFAZ-RS) e Livro I do RICMS-RS',
    dataAtualizacao: '2026-01-20',
    exemploUso: 'Operações internas de insumos industriais com pagamento do imposto transferido para a saída subsequente.',
  },
  {
    id: 'cb-rs-02',
    uf: 'RS',
    codigo: 'RS000002',
    descricao: 'Isenção de ICMS com exigência de preenchimento do valor do ICMS desonerado',
    cst: '40',
    tipoBeneficio: 'Isenção',
    exigeValorDesonerado: true,
    vigenciaInicio: '2020-01-01',
    fonteOficial: 'Apêndice XVII do RICMS-RS e IN RE nº 059/2023',
    dataAtualizacao: '2026-01-20',
    exemploUso: 'Saídas de medicamentos de distribuição governamental ou vacinas com destaque de vICMSDeson.',
  },
  {
    id: 'cb-rs-03',
    uf: 'RS',
    codigo: 'RS020003',
    descricao: 'Redução de base de cálculo em saídas de mercadorias da cesta básica gaúcha',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2020-01-01',
    fonteOficial: 'Livro I, Art. 23 do RICMS-RS e IN RE nº 059/2023',
    dataAtualizacao: '2026-01-20',
    exemploUso: 'Arroz, feijão, farinha de trigo e leite fluido com carga tributária reduzida a 7%.',
  },
  {
    id: 'cb-rs-04',
    uf: 'RS',
    codigo: 'RS050001',
    descricao: 'Suspensão do ICMS nas remessas para industrialização e conserto',
    cst: '50',
    tipoBeneficio: 'Suspensão',
    exigeValorDesonerado: false,
    vigenciaInicio: '2019-01-01',
    fonteOficial: 'Livro I, Art. 55 do RICMS-RS e Convênio AE 15/1974',
    dataAtualizacao: '2026-01-20',
    exemploUso: 'Remessa interestadual ou interna de insumos com suspensão e retorno previsto em 180 dias.',
  },

  // ==========================================
  // PARANÁ (PR) - Norma de Procedimento Fiscal NPF 053/2019
  // ==========================================
  {
    id: 'cb-pr-01',
    uf: 'PR',
    codigo: 'PR800001',
    descricao: 'Não incidência de ICMS em operações de exportação direta ou remessa com fim específico',
    cst: '41',
    tipoBeneficio: 'Não Incidência',
    exigeValorDesonerado: false,
    vigenciaInicio: '2019-01-01',
    fonteOficial: 'NPF nº 053/2019 e Art. 3º RICMS-PR (Decreto nº 7.871/2017)',
    dataAtualizacao: '2026-01-10',
    exemploUso: 'Saídas de mercadorias destinadas ao exterior amparadas pelo Art. 155, § 2º, X da CF/88.',
  },
  {
    id: 'cb-pr-02',
    uf: 'PR',
    codigo: 'PR820002',
    descricao: 'Redução de base de cálculo nas operações com máquinas e implementos agrícolas',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2019-01-01',
    fonteOficial: 'Anexo II do Regulamento do ICMS-PR e Convênio ICMS 52/1991',
    dataAtualizacao: '2026-01-10',
    exemploUso: 'Operações com tratores e colheitadeiras com alíquota reduzida para 5,6% ou 8,8%.',
  },
  {
    id: 'cb-pr-03',
    uf: 'PR',
    codigo: 'PR851001',
    descricao: 'Diferimento total do ICMS nas saídas internas entre contribuintes inscritos no CAD/ICMS',
    cst: '51',
    tipoBeneficio: 'Diferimento',
    exigeValorDesonerado: false,
    vigenciaInicio: '2019-01-01',
    fonteOficial: 'Art. 31 do RICMS-PR (Decreto nº 7.871/2017) e NPF nº 053/2019',
    dataAtualizacao: '2026-01-10',
    exemploUso: 'Insumos agropecuários e matérias-primas com diferimento na etapa industrial.',
  },
  {
    id: 'cb-pr-04',
    uf: 'PR',
    codigo: 'PR800003',
    descricao: 'Isenção de ICMS com desoneração em operações de saída de medicamentos para órgãos públicos',
    cst: '40',
    tipoBeneficio: 'Isenção',
    exigeValorDesonerado: true,
    vigenciaInicio: '2019-01-01',
    fonteOficial: 'Anexo I, Tabela I do RICMS-PR e Convênio ICMS 26/2003',
    dataAtualizacao: '2026-01-10',
    exemploUso: 'Fornecimento governamental com dedução do valor do ICMS do preço total da proposta.',
  },

  // ==========================================
  // RIO DE JANEIRO (RJ) - Resolução SEFAZ nº 214/2021
  // ==========================================
  {
    id: 'cb-rj-01',
    uf: 'RJ',
    codigo: 'RJ000001',
    descricao: 'Isenção de ICMS em saídas internas de hortifrutigranjeiros frescos',
    cst: '40',
    tipoBeneficio: 'Isenção',
    exigeValorDesonerado: false,
    vigenciaInicio: '2021-01-01',
    fonteOficial: 'Resolução SEFAZ nº 214/2021 e Livro I do RICMS-RJ',
    dataAtualizacao: '2026-01-25',
    exemploUso: 'Comercialização interna de produtos frescos da agricultura familiar fluminense.',
  },
  {
    id: 'cb-rj-02',
    uf: 'RJ',
    codigo: 'RJ051003',
    descricao: 'Diferimento de ICMS no fornecimento de insumos para indústrias incentivadas',
    cst: '51',
    tipoBeneficio: 'Diferimento',
    exigeValorDesonerado: false,
    vigenciaInicio: '2020-01-01',
    fonteOficial: 'Lei Estadual nº 4.533/2005 e Resolução SEFAZ nº 214/2021',
    dataAtualizacao: '2026-01-25',
    exemploUso: 'Fornecimento para empresas enquadradas no regime de desenvolvimento econômico estadual.',
  },
  {
    id: 'cb-rj-03',
    uf: 'RJ',
    codigo: 'RJ020005',
    descricao: 'Redução de base de cálculo do ICMS nas operações de comércio atacadista (Lei 9.025/20)',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2021-01-01',
    fonteOficial: 'Lei Estadual nº 9.025/2020 (Regime Tributário do Setor Atacadista) e Resolução SEFAZ 214/2021',
    dataAtualizacao: '2026-01-25',
    exemploUso: 'Saídas internas com carga tributária efetiva de 7% e interestaduais de 1,5% a 2%.',
  },

  // ==========================================
  // SANTA CATARINA (SC) - Portaria SEF nº 272/2022
  // ==========================================
  {
    id: 'cb-sc-01',
    uf: 'SC',
    codigo: 'SC000001',
    descricao: 'Isenção de ICMS em saídas internas de mercadorias para órgãos públicos estaduais',
    cst: '40',
    tipoBeneficio: 'Isenção',
    exigeValorDesonerado: true,
    vigenciaInicio: '2022-01-01',
    fonteOficial: 'Portaria SEF nº 272/2022 e Anexo 2 do RICMS-SC',
    dataAtualizacao: '2026-01-12',
    exemploUso: 'Vendas para prefeituras e órgãos públicos com desconto obrigatório do imposto na NF.',
  },
  {
    id: 'cb-sc-02',
    uf: 'SC',
    codigo: 'SC051002',
    descricao: 'Diferimento de ICMS na importação de mercadorias por portos catarinenses (TTD 409/410)',
    cst: '51',
    tipoBeneficio: 'Diferimento',
    exigeValorDesonerado: false,
    vigenciaInicio: '2022-01-01',
    fonteOficial: 'Art. 10 do Anexo 3 do RICMS-SC e Tratamento Tributário Diferenciado (TTD)',
    dataAtualizacao: '2026-01-12',
    exemploUso: 'Desembaraço aduaneiro com diferimento total de ICMS mediante regime especial TTD.',
  },
  {
    id: 'cb-sc-03',
    uf: 'SC',
    codigo: 'SC020003',
    descricao: 'Redução de base de cálculo em operações da cesta básica em Santa Catarina',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2022-01-01',
    fonteOficial: 'Art. 11 do Anexo 2 do RICMS-SC e Portaria SEF nº 272/2022',
    dataAtualizacao: '2026-01-12',
    exemploUso: 'Leite pasteurizado, carne e arroz com carga tributária reduzida a 7%.',
  },

  // ==========================================
  // MINAS GERAIS (MG) - Resolução nº 5.539/2022
  // ==========================================
  {
    id: 'cb-mg-01',
    uf: 'MG',
    codigo: 'MG000001',
    descricao: 'Isenção de ICMS em operações internas com produtos hortifrutigranjeiros',
    cst: '40',
    tipoBeneficio: 'Isenção',
    exigeValorDesonerado: false,
    vigenciaInicio: '2022-03-01',
    fonteOficial: 'Resolução SEF nº 5.539/2022 e Item 1 do Anexo I do RICMS-MG',
    dataAtualizacao: '2026-01-18',
    exemploUso: 'Frutas, verduras e legumes frescos produzidos e comercializados em Minas Gerais.',
  },
  {
    id: 'cb-mg-02',
    uf: 'MG',
    codigo: 'MG020002',
    descricao: 'Redução de base de cálculo em operações com produtos da cesta básica mineira',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2022-03-01',
    fonteOficial: 'Item 19 do Anexo IV do RICMS-MG e Resolução SEF nº 5.539/2022',
    dataAtualizacao: '2026-01-18',
    exemploUso: 'Óleo vegetal, feijão, arroz e café torrado com redução de base de cálculo.',
  },
  {
    id: 'cb-mg-03',
    uf: 'MG',
    codigo: 'MG051001',
    descricao: 'Diferimento de ICMS nas remessas de leite cru para laticínios industriais',
    cst: '51',
    tipoBeneficio: 'Diferimento',
    exigeValorDesonerado: false,
    vigenciaInicio: '2022-03-01',
    fonteOficial: 'Artigo 8º e Anexo II do Regulamento do ICMS de Minas Gerais',
    dataAtualizacao: '2026-01-18',
    exemploUso: 'Leite in natura enviado do produtor rural mineiro para indústria de laticínios.',
  },

  // ==========================================
  // DISTRITO FEDERAL (DF) - Portaria SEF nº 290/2019
  // ==========================================
  {
    id: 'cb-df-01',
    uf: 'DF',
    codigo: 'DF000001',
    descricao: 'Isenção de ICMS nas operações internas de hortifrutigranjeiros e leite pasteurizado',
    cst: '40',
    tipoBeneficio: 'Isenção',
    exigeValorDesonerado: false,
    vigenciaInicio: '2019-11-01',
    fonteOficial: 'Portaria SEF nº 290/2019 e Caderno I do Anexo I do Decreto nº 18.955/1997',
    dataAtualizacao: '2026-01-10',
    exemploUso: 'Comércio varejista e feiras livres de alimentos básicos in natura no DF.',
  },
  {
    id: 'cb-df-02',
    uf: 'DF',
    codigo: 'DF020001',
    descricao: 'Redução de base de cálculo nas operações internas com bens da cesta básica',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2019-11-01',
    fonteOficial: 'Caderno II do Anexo I do Decreto nº 18.955/1997 e Portaria 290/2019',
    dataAtualizacao: '2026-01-10',
    exemploUso: 'Alimentos essenciais com carga tributária final fixada em 7%.',
  },

  // ==========================================
  // GOIÁS (GO) - IN GSF nº 1.418/2018
  // ==========================================
  {
    id: 'cb-go-01',
    uf: 'GO',
    codigo: 'GO000001',
    descricao: 'Isenção de ICMS em saídas internas de produtos agropecuários in natura',
    cst: '40',
    tipoBeneficio: 'Isenção',
    exigeValorDesonerado: false,
    vigenciaInicio: '2019-01-01',
    fonteOficial: 'Instrução Normativa GSF nº 1.418/2018 e Anexo IX do RCTE/GO',
    dataAtualizacao: '2026-01-15',
    exemploUso: 'Produção agrícola familiar comercializada no estado de Goiás.',
  },
  {
    id: 'cb-go-02',
    uf: 'GO',
    codigo: 'GO020002',
    descricao: 'Redução de base de cálculo nas operações de comércio atacadista de alimentos',
    cst: '20',
    tipoBeneficio: 'Redução de Base',
    exigeValorDesonerado: true,
    vigenciaInicio: '2019-01-01',
    fonteOficial: 'Artigo 8º do Anexo IX do RCTE/GO e Lei nº 12.462/1994',
    dataAtualizacao: '2026-01-15',
    exemploUso: 'Distribuição atacadista goiana com crédito outorgado e base reduzida.',
  },
  {
    id: 'cb-go-03',
    uf: 'GO',
    codigo: 'GO051001',
    descricao: 'Diferimento de ICMS nas remessas de grãos (soja e milho) para armazéns gerais',
    cst: '51',
    tipoBeneficio: 'Diferimento',
    exigeValorDesonerado: false,
    vigenciaInicio: '2019-01-01',
    fonteOficial: 'Apêndice II do RCTE/GO e Convênio s/nº de 1970',
    dataAtualizacao: '2026-01-15',
    exemploUso: 'Remessa de safra de grãos do produtor para silos e cooperativas no estado de Goiás.',
  },
];

export const INITIAL_CARIMBOS_FISCAIS: CarimboFiscal[] = [
  // ========================================================
  // 1. SIMPLES NACIONAL
  // ========================================================
  {
    id: 'carimbo-sn-01',
    titulo: 'Simples Nacional — Sem Crédito de ICMS e IPI (Regra Geral)',
    categoria: 'Simples Nacional',
    tipoOperacao: 'Venda / Saída de Microempresa ou EPP',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NÃO GERA DIREITO A CRÉDITO FISCAL DE IPI E DE ICMS.',
    quandoUsar:
      'Obrigatório em todas as notas fiscais emitidas por optantes do Simples Nacional que não transfiram crédito de ICMS aos destinatários (quando o adquirente não for contribuinte, consumidor final, ou mercadorias com ST/isenção).',
    cbenefSugerido: 'Não aplicável para Simples padrão',
    fonteOficial: 'Art. 59, § 4º da Resolução CGSN nº 140/2018 e Art. 23 da Lei Complementar nº 123/2006',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<emit><CRT>1</CRT>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-sn-02',
    titulo: 'Simples Nacional — Permissão de Crédito de ICMS ao Destinatário',
    categoria: 'Simples Nacional',
    tipoOperacao: 'Venda de ME/EPP para Contribuinte do Regime Normal (Lucro Real ou Presumido)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'PERMITE O APROVEITAMENTO DO CRÉDITO DE ICMS NO VALOR DE R$ [VALOR_CREDITO], CORRESPONDENTE À ALÍQUOTA DE [ALIQUOTA_SN]% NOS TERMOS DO ART. 23 DA LEI COMPLEMENTAR Nº 123/2006.',
    quandoUsar:
      'Quando o optante do Simples Nacional vende insumos ou produtos para revenda/industrialização por contribuinte do regime normal, calculando o percentual efetivo de ICMS do anexo do DAS.',
    fonteOficial: 'Art. 23, § 1º da Lei Complementar nº 123/2006 e Art. 60 da Resolução CGSN nº 140/2018',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<pCredSN>', '<vCredICMSSN>', '<CSOSN>101</CSOSN>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-sn-03',
    titulo: 'Simples Nacional — Excesso de Sublimite Estadual (ICMS em Guia Normal)',
    categoria: 'Simples Nacional',
    tipoOperacao: 'Empresas do Simples que ultrapassaram R$ 3,6 milhões no ano',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'EMPRESA OPTANTE PELO SIMPLES NACIONAL COM IMPEDIMENTO DE RECOLHIMENTO DO ICMS NO SIMPLES NACIONAL POR EXCESSO DE SUBLIMITE ESTADUAL (ART. 13-A DA LC 123/2006). ICMS APURADO E RECOLHIDO PELO REGIME NORMAL.',
    quandoUsar:
      'Empresas que faturam acima do sublimite estadual (R$ 3,6 milhões) e recolhem tributos federais no DAS, mas recolhem o ICMS e emitem notas pelo regime normal com CSTs normais e CRT = 2.',
    fonteOficial: 'Art. 13-A e 20 da Lei Complementar nº 123/2006 e Resolução CGSN nº 140/2018',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<emit><CRT>2</CRT>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-sn-04',
    titulo: 'Simples Nacional — Devolução de Mercadoria Emitida por ME/EPP',
    categoria: 'Simples Nacional',
    tipoOperacao: 'Devolução de Compra (CFOP 5.201, 5.202, 6.201, 6.202)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'NOTA FISCAL DE DEVOLUÇÃO EMITIDA POR ME/EPP OPTANTE PELO SIMPLES NACIONAL. IMPOSTOS DA OPERAÇÃO ORIGINAL: BASE DE CÁLCULO DO ICMS R$ [VALOR_BC_ORIGINAL], ICMS DESTACADO R$ [VALOR_ICMS_ORIGINAL], IPI R$ [VALOR_IPI_ORIGINAL], CONFORME ART. 59, § 9º DA RESOLUÇÃO CGSN Nº 140/2018. REFERENTE À NF-E Nº [NUMERO_NF_ORIGINAL], CHAVE: [CHAVE_44_DIGITOS].',
    quandoUsar:
      'Obrigatório quando optante do Simples Nacional devolve mercadorias adquiridas de empresa do regime normal. Como o Simples não destaca ICMS nos campos próprios na devolução, os impostos da NF originária devem ser mencionados obrigatoriamente em dados adicionais.',
    fonteOficial: 'Art. 59, § 9º da Resolução CGSN nº 140/2018 e Ajuste SINIEF 07/2005',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<NFref><refNFe>', '<CSOSN>900</CSOSN>'],
    dataAtualizacao: '2026-01-10',
  },

  // ========================================================
  // 2. SUBSTITUIÇÃO TRIBUTÁRIA (ICMS-ST)
  // ========================================================
  {
    id: 'carimbo-st-01',
    titulo: 'Substituição Tributária — Contribuinte Substituído (Revenda / CFOP 5.405 e 6.404)',
    categoria: 'Substituição Tributária',
    tipoOperacao: 'Revenda de mercadoria cujo imposto foi retido anteriormente',
    ufAplicavel: 'Todas as UFs (Convênio ICMS 142/2018)',
    textoObrigatorio:
      'IMPOSTO RECOLHIDO POR SUBSTITUIÇÃO TRIBUTÁRIA NOS TERMOS DO ARTIGO 274 DO RICMS/SP E CONVÊNIO ICMS 142/2018. BASE DE CÁLCULO DO ICMS-ST R$ [VALOR_BC_ST], ICMS-ST RETIDO R$ [VALOR_ST_RETIDO]. OPERAÇÃO SEM DIREITO A CRÉDITO DO IMPOSTO.',
    quandoUsar:
      'Emissão por comércio atacadista ou varejista que adquiriu a mercadoria com imposto retido e está revendendo sem novo destaque de ICMS na saída.',
    fonteOficial: 'Artigo 274 do Regulamento do ICMS de São Paulo (Decreto nº 45.490/2000) e Convênio ICMS 142/2018 Cláusula 15ª',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5405</CFOP>', '<ICMS60>', '<vBCSTRet>', '<vICMSSTRet>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-st-02',
    titulo: 'Substituição Tributária — Contribuinte Substituto com Retenção (Indústria / Importador)',
    categoria: 'Substituição Tributária',
    tipoOperacao: 'Saída da indústria ou distribuidor com cobrança de ST (CFOP 5.401, 6.401, 6.403)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'SUBSTITUIÇÃO TRIBUTÁRIA APLICADA CONFORME CONVÊNIO/PROTOCOLO ICMS Nº [NUMERO_PROTOCOLO]. BASE DE CÁLCULO PRÓPRIA R$ [BC_PROPRIA], ICMS PRÓPRIO R$ [ICMS_PROPRIO]. BASE DE CÁLCULO DO ICMS-ST R$ [BC_ST] COM MVA DE [MVA]%, VALOR DO ICMS-ST RETIDO R$ [VALOR_ST_RECOLHER].',
    quandoUsar:
      'Emissão pelo fabricante ou importador sujeito passivo por substituição que recolhe o imposto próprio e retém antecipadamente o imposto devido pelas etapas subsequentes.',
    fonteOficial: 'Convênio ICMS 142/2018 e Lei Complementar nº 87/1996 (Art. 6º a 10)',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<ICMS10>', '<vBCST>', '<pICMSST>', '<vICMSST>', '<pMVAST>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-st-03',
    titulo: 'Substituição Tributária — Ressarcimento de ICMS-ST na Saída Interestadual',
    categoria: 'Substituição Tributária',
    tipoOperacao: 'Saída para outro estado de mercadoria que pagou ST na entrada',
    ufAplicavel: 'São Paulo (SP) e estados com sistemas de ressarcimento (ADRC-ST, e-Ressarcimento)',
    textoObrigatorio:
      'MERCADORIA COM ICMS-ST RECOLHIDO ANTERIORMENTE. PEDIDO DE RESSARCIMENTO/COMPENSAÇÃO DO IMPOSTO RETIDO NOS TERMOS DA PORTARIA CAT Nº 42/2018 (SISTEMA E-RESSARCIMENTO) E CONVÊNIO ICMS 142/2018, DECORRENTE DE SAÍDA INTERESTADUAL COM DESTINO A [UF_DESTINO].',
    quandoUsar:
      'Quando um atacadista de uma UF comprou produto com ST interna e o revende para destinatário em outro estado, gerando direito ao ressarcimento do ICMS-ST pago na primeira operação.',
    fonteOficial: 'Portaria CAT nº 42/2018 (SEFAZ-SP) e Convênio ICMS 142/2018 (Cláusulas 22ª a 27ª)',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<ICMS60>', '<vBCEfet>', '<vICMSEfet>'],
    dataAtualizacao: '2026-01-15',
  },

  // ========================================================
  // 3. DEVOLUÇÕES & ESTORNOS
  // ========================================================
  {
    id: 'carimbo-dev-01',
    titulo: 'Devolução de Mercadoria de Compra ou Venda — Referência Obrigatória',
    categoria: 'Devoluções & Estornos',
    tipoOperacao: 'Devolução total ou parcial (CFOP 1.201, 1.202, 2.201, 2.202, 5.201, 5.202, 6.201, 6.202)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'NOTA FISCAL DE DEVOLUÇÃO TOTAL/PARCIAL REFERENTE À NF-E Nº [NUMERO_NF_ORIGINAL], SÉRIE [SERIE], EMITIDA EM [DATA_EMISSAO_ORIGINAL], CHAVE DE ACESSO: [CHAVE_44_DIGITOS]. MOTIVO DA DEVOLUÇÃO: [DESCREVER_MOTIVO_DESACORDO_COMERCIAL_DEFEITO].',
    quandoUsar:
      'Obrigatório em todas as notas fiscais de devolução para cumprir o Ajuste SINIEF 07/2005 e evitar a Rejeição 854 da SEFAZ.',
    fonteOficial: 'Ajuste SINIEF 07/2005 e Manual de Orientação do Contribuinte (MOC v7.00)',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<ide><finNFe>4</finNFe>', '<ide><NFref><refNFe>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-dev-02',
    titulo: 'Devolução Emitida por Pessoa Física ou Não Contribuinte (Entrada Própria)',
    categoria: 'Devoluções & Estornos',
    tipoOperacao: 'NF-e de Entrada Própria (CFOP 1.201, 1.202, 2.202)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'EMISSÃO DE NOTA FISCAL DE ENTRADA POR RETORNO DE MERCADORIA NÃO ENTREGUE OU DEVOLVIDA POR PESSOA FÍSICA / NÃO CONTRIBUINTE DO ICMS. REFERENTE À NOSSA NF-E DE SAÍDA Nº [NUMERO_NF_SAIDA], EMITIDA EM [DATA_ORIGINAL], CHAVE DE ACESSO: [CHAVE_44_DIGITOS]. MOTIVO: [DESTINATARIO_RECUSOU_OU_DEFEITO]. DECLARAÇÃO DE RECUSA FIRMADA NO VERSO DO DANFE ORIGINAL CONFORME ART. 453 DO RICMS.',
    quandoUsar:
      'Quando um cliente pessoa física ou empresa sem Inscrição Estadual recusa a mercadoria ou solicita devolução/troca. A empresa vendedora deve emitir a NF-e de entrada própria referenciando a saída.',
    fonteOficial: 'Artigo 453 do RICMS/SP e Ajuste SINIEF 07/2005',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<ide><tpNF>0</tpNF>', '<ide><finNFe>4</finNFe>', '<NFref><refNFe>'],
    dataAtualizacao: '2026-01-10',
  },

  // ========================================================
  // 4. INDUSTRIALIZAÇÃO POR ENCOMENDA
  // ========================================================
  {
    id: 'carimbo-ind-01',
    titulo: 'Remessa para Industrialização por Encomenda (Suspensão de ICMS e IPI)',
    categoria: 'Industrialização & Terceiros',
    tipoOperacao: 'Envio de insumos para industrializador (CFOP 5.901 / 6.901)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'MERCADORIA DESTINADA A PROCESSO DE INDUSTRIALIZAÇÃO POR ENCOMENDA. OPERAÇÃO COM SUSPENSÃO DO ICMS NOS TERMOS DO ARTIGO 402 DO RICMS/SP E DO CONVÊNIO AE Nº 15/1974. SUSPENSÃO DO IPI NOS TERMOS DO ARTIGO 43, INCISO VI DO DECRETO FEDERAL Nº 7.212/2010 (RIPI). PRAZO DE RETORNO: 180 DIAS.',
    quandoUsar:
      'Envio de matérias-primas, produtos intermediários e embalagens para outro estabelecimento industrializar sob encomenda.',
    fonteOficial: 'Artigo 402 do RICMS/SP, Convênio AE nº 15/1974 e Art. 43, VI do Decreto nº 7.212/2010 (RIPI)',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5901</CFOP>', '<ICMS50>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-ind-02',
    titulo: 'Retorno de Industrialização por Encomenda (Retorno dos Insumos + Mão de Obra)',
    categoria: 'Industrialização & Terceiros',
    tipoOperacao: 'Retorno da mercadoria industrializada (CFOP 5.902 / 6.902 e 5.124 / 6.124)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'RETORNO DE MERCADORIA RECEBIDA PARA INDUSTRIALIZAÇÃO POR ENCOMENDA. INSUMOS RECEBIDOS E UTILIZADOS RETORNADOS NO CFOP [5.902/6.902] COM SUSPENSÃO DO ICMS (ART. 402 RICMS). COBRANÇA DE MÃO DE OBRA E INSUMOS APLICADOS NO CFOP [5.124/6.124] COM TRIBUTAÇÃO/DIFERIMENTO NOS TERMOS DA LEGISLAÇÃO. REFERENTE À NF-E DE REMESSA Nº [NUMERO_NF_REMESSA], CHAVE: [CHAVE_44_DIGITOS].',
    quandoUsar:
      'Quando o industrializador conclui o serviço e emite a nota fiscal de retorno ao encomendante (geralmente com 2 itens na NF: item do retorno simbólico dos insumos do cliente e item do serviço/material próprio aplicado).',
    fonteOficial: 'Artigo 404 do RICMS/SP, Convênio AE nº 15/1974 e Decisão Normativa CAT nº 02/2003',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5902</CFOP>', '<prod><CFOP>5124</CFOP>', '<NFref><refNFe>'],
    dataAtualizacao: '2026-01-15',
  },

  // ========================================================
  // 5. REMESSAS, CONSERTOS, BRINDES & DEMONSTRAÇÃO
  // ========================================================
  {
    id: 'carimbo-rem-01',
    titulo: 'Remessa para Conserto, Reparo ou Manutenção (Não Incidência)',
    categoria: 'Remessas, Consertos & Brindes',
    tipoOperacao: 'Envio de bem para assistência técnica (CFOP 5.915 / 6.915)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'MERCADORIA / BEM REMETIDO PARA CONSERTO, REPARO OU MANUTENÇÃO. NÃO INCIDÊNCIA DO ICMS NOS TERMOS DO ARTIGO 7º, INCISO IX DO RICMS/SP E DO CONVÊNIO S/Nº DE 15/12/1970 (ART. 19). NÃO INCIDÊNCIA DE IPI CONFORME ART. 43 DO DECRETO Nº 7.212/2010. BEM INTEGRANTE DO ATIVO IMOBILIZADO OU DE USO DO ESTABELECIMENTO.',
    quandoUsar:
      'Envio de máquinas, equipamentos, veículos ou ferramentas para prestação de serviços de assistência técnica ou reparos externos.',
    fonteOficial: 'Artigo 7º, IX do RICMS/SP, Convênio s/nº de 15/12/1970 e Decreto nº 7.212/2010 (RIPI)',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5915</CFOP>', '<ICMS41>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-rem-02',
    titulo: 'Retorno de Mercadoria ou Bem Recebido para Conserto ou Reparo',
    categoria: 'Remessas, Consertos & Brindes',
    tipoOperacao: 'Devolução de bem após manutenção (CFOP 5.916 / 6.916)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'RETORNO DE MERCADORIA / BEM RECEBIDO PARA CONSERTO OU REPARO. NÃO INCIDÊNCIA DO ICMS CONFORME ART. 7º, INCISO X DO RICMS/SP E CONVÊNIO S/Nº DE 15/12/1970. REFERENTE À NF-E DE ENTRADA Nº [NUMERO_NF_ENTRADA], EMITIDA EM [DATA_ENTRADA], CHAVE DE ACESSO: [CHAVE_44_DIGITOS].',
    quandoUsar:
      'Oficinas e assistências técnicas devolvendo o bem consertado ao cliente proprietário.',
    fonteOficial: 'Artigo 7º, X do RICMS/SP e Convênio s/nº de 15/12/1970',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5916</CFOP>', '<NFref><refNFe>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-rem-03',
    titulo: 'Remessa para Demonstração (Suspensão do ICMS por 60 Dias)',
    categoria: 'Remessas, Consertos & Brindes',
    tipoOperacao: 'Envio para avaliação comercial do cliente (CFOP 5.912 / 6.912)',
    ufAplicavel: 'Todas as UFs (Ajuste SINIEF 08/2008)',
    textoObrigatorio:
      'MERCADORIA DESTINADA A DEMONSTRAÇÃO. OPERAÇÃO COM SUSPENSÃO DO ICMS NOS TERMOS DO AJUSTE SINIEF Nº 08/2008 E ARTIGO 319 DO RICMS/SP, CONDICIONADA AO RETORNO AO ESTABELECIMENTO DE ORIGEM DENTRO DO PRAZO DE 60 (SESSENTA) DIAS CONTADOS DA DATA DA SAÍDA.',
    quandoUsar:
      'Envio de mercadorias para potenciais compradores examinarem ou testarem comercialmente antes de decidir pela compra.',
    fonteOficial: 'Ajuste SINIEF nº 08/2008 (Cláusulas 1ª a 5ª) e Artigo 319 do RICMS/SP',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5912</CFOP>', '<ICMS50>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-rem-04',
    titulo: 'Remessa em Bonificação, Brinde ou Doação (Sem Cobrança Financeira)',
    categoria: 'Remessas, Consertos & Brindes',
    tipoOperacao: 'Saída a título gratuito (CFOP 5.910 / 6.910)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'MERCADORIA REMETIDA A TÍTULO DE BONIFICAÇÃO / DOAÇÃO / BRINDE. NÃO GERA COBRANÇA OU DUPLICATA FINANCEIRA. ICMS DESTACADO DEVIDO CONFORME REGULAMENTO ESTADUAL. BASE DE CÁLCULO DO ICMS R$ [VALOR_BC], VALOR DO ICMS R$ [VALOR_ICMS].',
    quandoUsar:
      'Envio gratuito de produtos a clientes como bonificação mercantil, cortesias ou amostras sem geração de boleto/título.',
    fonteOficial: 'Art. 13 da Lei Complementar nº 87/1996 e Parecer Normativo CST nº 67/1979',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5910</CFOP>', '<cobr>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-rem-05',
    titulo: 'Remessa para Mostruário para Uso de Representante Comercial',
    categoria: 'Remessas, Consertos & Brindes',
    tipoOperacao: 'Mostruário comercial levado por vendedores (CFOP 5.949 / 6.949)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'MERCADORIA DESTINADA A MOSTRUÁRIO DE PRODUTOS PARA EXIBIÇÃO POR VENDEDOR / REPRESENTANTE COMERCIAL. SUSPENSÃO DO ICMS NOS TERMOS DO AJUSTE SINIEF Nº 08/2008 E ARTIGO 322 DO RICMS/SP, CONDICIONADA AO RETORNO EM ATÉ 90 DIAS.',
    quandoUsar:
      'Envio de amostras coletivas ou peças de vestuário/calçados que acompanham o representante em viagens de demonstração.',
    fonteOficial: 'Ajuste SINIEF nº 08/2008 (Cláusulas 6ª e 7ª) e Artigo 322 do RICMS/SP',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5949</CFOP>', '<ICMS50>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-rem-06',
    titulo: 'Remessa para Armazém Geral ou Depósito Fechado (Não Incidência / Suspensão)',
    categoria: 'Remessas, Consertos & Brindes',
    tipoOperacao: 'Armazenagem externa de estoque (CFOP 5.905 / 5.906)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'MERCADORIA DESTINADA A GUARDA E ARMAZENAGEM EM ARMAZÉM GERAL / DEPÓSITO FECHADO. NÃO INCIDÊNCIA DO ICMS NOS TERMOS DO ARTIGO 7º, INCISO I DO RICMS/SP E DO CONVÊNIO S/Nº DE 15/12/1970. NÃO INCIDÊNCIA DE IPI CONFORME DECRETO Nº 7.212/2010.',
    quandoUsar:
      'Envio de mercadorias da empresa para centros de distribuição ou armazéns terceirizados para guarda de estoque.',
    fonteOficial: 'Artigo 7º, I do RICMS/SP e Convênio s/nº de 15/12/1970 (Sistema Nacional Integrado de Informações Econômico-Fiscais)',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5905</CFOP>', '<ICMS41>'],
    dataAtualizacao: '2026-01-10',
  },

  // ========================================================
  // 6. VENDA À ORDEM & ENTREGA FUTURA
  // ========================================================
  {
    id: 'carimbo-ordem-01',
    titulo: 'Venda para Entrega Futura — Simples Faturamento (CFOP 5.922 / 6.922)',
    categoria: 'Venda à Ordem & Entrega Futura',
    tipoOperacao: 'Nota fiscal de cobrança antecipada sem movimentação física imediata',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'EMISSÃO DE NOTA FISCAL A TÍTULO DE SIMPLES FATURAMENTO DECORRENTE DE VENDA PARA ENTREGA FUTURA, NOS TERMOS DO ARTIGO 129 DO RICMS/SP E DO CONVÊNIO S/Nº DE 15/12/1970. SEM DESTAQUE DO ICMS E DO IPI. IMPOSTOS SERÃO DESTACADOS POR OCASIÃO DA EFETIVA SAÍDA DAS MERCADORIAS.',
    quandoUsar:
      'Quando a negociação financeira ocorre com antecedência, gerando fatura/duplicata, e os bens serão produzidos ou entregues posteriormente.',
    fonteOficial: 'Artigo 129 do Regulamento do ICMS de São Paulo e Convênio s/nº de 15/12/1970',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5922</CFOP>', '<ICMS90>', '<cobr>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-ordem-02',
    titulo: 'Remessa em Venda para Entrega Futura (CFOP 5.116 / 5.117 / 6.116 / 6.117)',
    categoria: 'Venda à Ordem & Entrega Futura',
    tipoOperacao: 'Saída física da mercadoria faturada anteriormente',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'REMESSA DE MERCADORIAS ORIGINADA DE ENCOMENDA PARA ENTREGA FUTURA. IMPOSTOS DESTACADOS NESTA NF-E CONFORME ARTIGO 129, § 1º DO RICMS/SP. REFERENTE À NOTA FISCAL DE SIMPLES FATURAMENTO Nº [NUMERO_NF_FATURAMENTO], EMITIDA EM [DATA_FATURAMENTO], CHAVE: [CHAVE_44_DIGITOS].',
    quandoUsar:
      'Por ocasião do despacho físico do produto cuja nota de faturamento antecipado já havia sido emitida pelo CFOP 5.922/6.922.',
    fonteOficial: 'Artigo 129, § 1º do RICMS/SP e Convênio s/nº de 15/12/1970',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5116</CFOP>', '<NFref><refNFe>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-ordem-03',
    titulo: 'Venda à Ordem (Triangular) — NF de Venda ao Adquirente Originário (CFOP 5.118 / 6.118)',
    categoria: 'Venda à Ordem & Entrega Futura',
    tipoOperacao: 'Vendedor emitindo para o comprador originário com entrega direta ao cliente final',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'NOTA FISCAL DE VENDA À ORDEM EMITIDA AO ADQUIRENTE ORIGINÁRIO NOS TERMOS DO ARTIGO 129, § 2º, ALÍNEA "B" DO RICMS/SP E CONVÊNIO S/Nº DE 15/12/1970. MERCADORIA SERÁ ENTREGUE POR NOSSA CONTA E ORDEM DIRETAMENTE AO DESTINATÁRIO FINAL [NOME_DESTINATARIO_FINAL], CNPJ: [CNPJ_DESTINATARIO_FINAL], ACOMPANHADA DA NF-E DE REMESSA Nº [NUMERO_NF_REMESSA].',
    quandoUsar:
      'Na operação triangular, esta é a NF emitida do fornecedor (vendedor-remetente) para o revendedor (adquirente originário), com destaque de ICMS.',
    fonteOficial: 'Artigo 129, § 2º, alínea "b" do RICMS/SP e Convênio s/nº de 15/12/1970',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5118</CFOP>', '<dest>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-ordem-04',
    titulo: 'Venda à Ordem (Triangular) — NF de Remessa por Conta e Ordem (CFOP 5.923 / 6.923)',
    categoria: 'Venda à Ordem & Entrega Futura',
    tipoOperacao: 'Remessa física que acompanha o transporte até o destinatário final',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'MERCADORIA REMETIDA POR CONTA E ORDEM DO ADQUIRENTE ORIGINÁRIO [NOME_EMPRESA_REVENDEDORA], CNPJ: [CNPJ_REVENDEDORA], INSCRIÇÃO ESTADUAL: [IE_REVENDEDORA], CONFORME ARTIGO 129, § 2º, ALÍNEA "A" DO RICMS/SP. SEM DESTAQUE DO ICMS. REFERENTE À NF-E DE VENDA AO DESTINATÁRIO Nº [NUMERO_NF_VENDA_REVENDEDOR], CHAVE: [CHAVE_44_DIGITOS].',
    quandoUsar:
      'A nota fiscal que viaja fisicamente junto com a carga, emitida pelo vendedor-remetente para o destinatário final físico, sem destaque de imposto.',
    fonteOficial: 'Artigo 129, § 2º, alínea "a" do RICMS/SP e Convênio s/nº de 15/12/1970',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5923</CFOP>', '<ICMS41>', '<NFref><refNFe>'],
    dataAtualizacao: '2026-01-15',
  },

  // ========================================================
  // 7. COMÉRCIO EXTERIOR & SUFRAMA
  // ========================================================
  {
    id: 'carimbo-ext-01',
    titulo: 'Exportação Direta de Mercadorias para o Exterior (Imunidade / Alíquota Zero)',
    categoria: 'Comércio Exterior & ZFM',
    tipoOperacao: 'Exportação com desembaraço aduaneiro (CFOP 7.101 / 7.102)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'MERCADORIA DESTINADA À EXPORTAÇÃO DIRETA. NÃO INCIDÊNCIA DE ICMS CONFORME ARTIGO 155, § 2º, INCISO X, ALÍNEA "A" DA CONSTITUIÇÃO FEDERAL DE 1988 E ARTIGO 3º DA LEI COMPLEMENTAR Nº 87/1996. NÃO INCIDÊNCIA DE IPI CONFORME ART. 18 DO DECRETO Nº 7.212/2010. ALÍQUOTA ZERO DE PIS E COFINS NOS TERMOS DO ART. 5º DA LEI Nº 10.637/2002 E ART. 6º DA LEI Nº 10.833/2003.',
    quandoUsar:
      'Emissão de notas fiscais de exportação direta de produtos nacionais para adquirentes no exterior.',
    fonteOficial: 'Art. 155, § 2º, X, "a" da CF/88, Lei Complementar nº 87/1996 e Leis 10.637/02 e 10.833/03',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>7101</CFOP>', '<ICMS41>', '<exporta>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-ext-02',
    titulo: 'Remessa com Fim Específico de Exportação — Exportação Indireta (CFOP 5.501 / 6.501)',
    categoria: 'Comércio Exterior & ZFM',
    tipoOperacao: 'Venda para Trading Company ou Comercial Exportadora',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'REMESSA DE MERCADORIAS COM O FIM ESPECÍFICO DE EXPORTAÇÃO. NÃO INCIDÊNCIA DE ICMS NOS TERMOS DO ART. 3º, PARÁGRAFO ÚNICO DA LEI COMPLEMENTAR Nº 87/1996 E DO CONVÊNIO ICMS Nº 84/2009. SUSPENSÃO DO IPI CONFORME ARTIGO 43 DO DECRETO Nº 7.212/2010. ALÍQUOTA ZERO DE PIS/COFINS CONFORME ART. 9º DA MP Nº 2.158-35/2001. ADQUIRENTE: [TRADING], CNPJ: [CNPJ_TRADING].',
    quandoUsar:
      'Fabricante que vende mercadorias para empresa comercial exportadora ou trading que efetuará a exportação física em até 180 dias.',
    fonteOficial: 'Convênio ICMS nº 84/2009, Art. 3º da LC 87/1996 e MP nº 2.158-35/2001',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>6501</CFOP>', '<ICMS41>', '<exporta>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-ext-03',
    titulo: 'Remessa para ZFM e Áreas de Livre Comércio — Isenção ICMS e Alíquota Zero PIS/COFINS',
    categoria: 'Comércio Exterior & ZFM',
    tipoOperacao: 'Venda Interestadual para AM, RR, AP, RO, AC incentivados (CFOP 6.109 / 6.110)',
    ufAplicavel: 'AM, RR, AP, RO, AC (Suframa)',
    textoObrigatorio:
      'MERCADORIA DE ORIGEM NACIONAL DESTINADA À ÁREA INCENTIVADA DA ZONA FRANCA DE MANAUS / ÁREA DE LIVRE COMÉRCIO. ISENÇÃO DE ICMS CONFORME CONVÊNIO ICMS 65/88. ALÍQUOTA ZERO DE PIS/COFINS CONFORME ART. 2º DA LEI Nº 10.996/2004. INSCRIÇÃO SUFRAMA DO DESTINATÁRIO Nº: [INSCRICAO_SUFRAMA]. VALOR DO ICMS DESONERADO R$ [VALOR_DESON] ABATIDO DO VALOR TOTAL DA NOTA FISCAL.',
    quandoUsar:
      'Vendas de produtos de fabricação nacional a destinatários cadastrados e habilitados no CADSUF em Manaus ou Áreas de Livre Comércio.',
    cbenefSugerido: 'cMotDesICMS = 7 (Suframa)',
    fonteOficial: 'Convênio ICMS 65/88, Convênio ICMS 134/2019, Lei Federal nº 10.996/2004 e Decreto-Lei 288/1967',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<dest><ISUF>', '<vICMSDeson>', '<cMotDesICMS>7</cMotDesICMS>'],
    dataAtualizacao: '2026-01-20',
  },

  // ========================================================
  // 8. BENEFÍCIOS, ISENÇÕES & IMUNIDADES
  // ========================================================
  {
    id: 'carimbo-ben-01',
    titulo: 'Isenção de ICMS com Desoneração Obrigatória no Preço (vICMSDeson e cMotDesICMS)',
    categoria: 'Benefícios, Isenções & Imunidades',
    tipoOperacao: 'Vendas com benefício de isenção que exige repasse ao adquirente',
    ufAplicavel: 'Todas as UFs (Ajuste SINIEF 21/2012 e NT 2019.001)',
    textoObrigatorio:
      'MERCADORIA BENEFICIADA COM ISENÇÃO DO ICMS NOS TERMOS DO [DISPOSITIVO_LEGAL_ESTADUAL_EX_ANEXO_I_RICMS]. VALOR DO ICMS DESONERADO R$ [VALOR_ICMS_DESONERADO] DEDUZIDO DO PREÇO TOTAL DA NOTA FISCAL, CONFORME DETERMINAÇÃO DO AJUSTE SINIEF Nº 21/2012 E DA NOTA TÉCNICA 2019.001. CÓDIGO MOTIVO DESONERAÇÃO: [MOTIVO_EX_9_OUTROS].',
    quandoUsar:
      'Quando o regulamento do ICMS estabelece isenção condicionada ao abatimento do montante do imposto no preço faturado.',
    cbenefSugerido: 'cMotDesICMS = 9 (Outros) ou cBenef estadual',
    fonteOficial: 'Ajuste SINIEF nº 21/2012, Nota Técnica SEFAZ 2019.001 e Regulamentos do ICMS',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<vICMSDeson>', '<cMotDesICMS>', '<cBenef>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-ben-02',
    titulo: 'Diferimento de ICMS em Operação Interna',
    categoria: 'Benefícios, Isenções & Imunidades',
    tipoOperacao: 'Venda interna com imposto transferido para a etapa subsequente (CST 51)',
    ufAplicavel: 'Todas as UFs (Legislações Estaduais)',
    textoObrigatorio:
      'OPERAÇÃO COM DIFERIMENTO DO ICMS NOS TERMOS DO ARTIGO [ARTIGO_RICMS_ESTADUAL] DO REGULAMENTO DO ICMS DO ESTADO DE [ESTADO_EMISSOR]. O RECOLHIMENTO DO IMPOSTO INCIDENTE FICA TRANSFERIDO PARA A SAÍDA SUBSEQUENTE PROMOVIDA PELO ADQUIRENTE.',
    quandoUsar:
      'Vendas internas de insumos, matérias-primas e produtos agropecuários entre indústrias e produtores cadastrados.',
    fonteOficial: 'Artigo 350 do RICMS/SP e regulamentos congêneres de cada unidade federada',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<ICMS51>', '<vICMSDif>', '<vICMSOp>'],
    dataAtualizacao: '2026-01-15',
  },
  {
    id: 'carimbo-ben-03',
    titulo: 'Venda de Bens do Ativo Imobilizado (Não Incidência)',
    categoria: 'Ativo Imobilizado & Baixas',
    tipoOperacao: 'Desincorporação de máquinas, veículos e ativos da empresa (CFOP 5.551 / 6.551)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'SAÍDA DE BEM INTEGRANTE DO ATIVO IMOBILIZADO DO EMITENTE. NÃO INCIDÊNCIA DE ICMS CONFORME ARTIGO 3º, INCISO II DA LEI COMPLEMENTAR FEDERAL Nº 87/1996 (LEI KANDIR) E ARTIGO 7º, INCISO XIV DO RICMS/SP. NÃO INCIDÊNCIA DE IPI CONFORME ARTIGO 38, INCISO II DO DECRETO Nº 7.212/2010 (RIPI).',
    quandoUsar:
      'Venda ou transferência de computadores, veículos da frota, móveis ou máquinas industriais pertencentes ao ativo permanente.',
    fonteOficial: 'Art. 3º, II da Lei Complementar nº 87/1996 e Decreto nº 7.212/2010 (RIPI)',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5551</CFOP>', '<ICMS41>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-ben-04',
    titulo: 'Perda, Roubo, Deterioração ou Extravio — Estorno de Crédito (CFOP 5.927)',
    categoria: 'Ativo Imobilizado & Baixas',
    tipoOperacao: 'Baixa de estoque por sinistro ou validade vencida',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'EMISSÃO DE NOTA FISCAL PARA FINS DE BAIXA DE ESTOQUE DECORRENTE DE [PERDA / ROUBO / DETERIORAÇÃO / EXTRAVIO / VALIDADE_EXPIRADA], CONFORME ARTIGO 125, INCISO VI DO RICMS/SP E ART. 67, I DA LC Nº 87/1996. ESTORNO DOS CRÉDITOS DE ICMS APROPRIADOS NA ENTRADA NO VALOR DE R$ [VALOR_ESTORNO_ICMS]. DOCUMENTO INTERNO SEM CIRCULAÇÃO FÍSICA.',
    quandoUsar:
      'Regularização contábil e fiscal quando mercadorias do estoque perecem, vencem ou são extraviadas/furtadas.',
    fonteOficial: 'Artigo 125, VI do RICMS/SP, Artigo 67, I da LC nº 87/1996 e Resolução SF nº 41/2000',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5927</CFOP>', '<ICMS90>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-ben-05',
    titulo: 'Locação de Bens Móveis — Não Incidência de ICMS e ISS (Súmula Vinculante 31 STF)',
    categoria: 'Benefícios, Isenções & Imunidades',
    tipoOperacao: 'Aluguel de máquinas, geradores, veículos e equipamentos (CFOP 5.949 / 6.949)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'REMESSA DE BEM EM LOCAÇÃO DE BENS MÓVEIS CONTRATUALMENTE CELEBRADA. NÃO INCIDÊNCIA DE ICMS CONFORME ARTIGO 7º, INCISO IX DO RICMS/SP E NÃO INCIDÊNCIA DE ISS CONFORME SÚMULA VINCULANTE Nº 31 DO SUPREMO TRIBUNAL FEDERAL (STF). CONTRATO DE LOCAÇÃO Nº: [NUMERO_CONTRATO].',
    quandoUsar:
      'Aluguel e locação de bens móveis (computadores, andaimes, tratores, veículos) que não envolvem tributação de ICMS nem de ISS.',
    fonteOficial: 'Súmula Vinculante nº 31 do STF e Artigo 7º do RICMS/SP',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<prod><CFOP>5949</CFOP>', '<ICMS41>'],
    dataAtualizacao: '2026-01-05',
  },

  // ========================================================
  // 9. PIS/COFINS & REFORMA TRIBUTÁRIA
  // ========================================================
  {
    id: 'carimbo-pis-01',
    titulo: 'Exclusão do ICMS da Base de Cálculo do PIS e da COFINS (Tema 69 STF)',
    categoria: 'PIS/COFINS & Reforma Tributária',
    tipoOperacao: 'Saídas de empresas no Lucro Real e Lucro Presumido',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'BASE DE CÁLCULO DE PIS E COFINS APURADA COM EXCLUSÃO DO VALOR DO ICMS DESTACADO, CONFORME DECISÃO DO SUPREMO TRIBUNAL FEDERAL NO RECURSO EXTRAORDINÁRIO Nº 574.706 (TEMA 69 DE REPERCUSSÃO GERAL) E IN RFB Nº 2.121/2022 (ART. 26). VALOR DO ICMS EXCLUÍDO DA BASE DE PIS/COFINS: R$ [VALOR_ICMS_EXCLUIDO].',
    quandoUsar:
      'Para fundamentar a base de cálculo líquida das contribuições federais sobre o faturamento e resguardar a escrituração fiscal no EFD Contribuições.',
    fonteOficial: 'STF - RE 574.706 (Tema 69 de Repercussão Geral) e Instrução Normativa RFB nº 2.121/2022 (Art. 26)',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<PIS>', '<COFINS>'],
    dataAtualizacao: '2026-01-05',
  },
  {
    id: 'carimbo-pis-02',
    titulo: 'DIFAL da EC 87/2015 e LC 190/2022 — Venda Interestadual a Consumidor Final',
    categoria: 'PIS/COFINS & Reforma Tributária',
    tipoOperacao: 'Vendas para Não Contribuinte em outro estado (CFOP 6.107 / 6.108)',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'DIFERENCIAL DE ALÍQUOTAS (DIFAL) DEVIDO À UF DE DESTINO ([UF_DESTINO]) CONFORME EC Nº 87/2015, LEI COMPLEMENTAR Nº 190/2022 E CONVÊNIO ICMS Nº 236/2021. VALOR DA BASE DE CÁLCULO DO DIFAL: R$ [BC_DIFAL]. ALÍQUOTA INTERESTADUAL: [ALIQ_INTER]%. ALÍQUOTA INTERNA DO DESTINO: [ALIQ_DESTINO]%. VALOR DO ICMS DIFAL DESTINO: R$ [VALOR_DIFAL_DESTINO]. VALOR DO FCP: R$ [VALOR_FCP].',
    quandoUsar:
      'Operações de e-commerce e vendas B2C para outros estados quando o cliente não possuir Inscrição Estadual ativa.',
    fonteOficial: 'Emenda Constitucional nº 87/2015, Lei Complementar nº 190/2022 e Convênio ICMS nº 236/2021',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<ICMSUFDest>', '<vBCUFDest>', '<pICMSUFDest>', '<vICMSUFDest>'],
    dataAtualizacao: '2026-01-10',
  },
  {
    id: 'carimbo-ref-01',
    titulo: 'Reforma Tributária — Destaque Operacional de IBS e CBS em Transição (EC 132/23)',
    categoria: 'PIS/COFINS & Reforma Tributária',
    tipoOperacao: 'Notas de homologação e operações sob a Lei Complementar da Reforma Tributária',
    ufAplicavel: 'Todas as UFs (Nacional)',
    textoObrigatorio:
      'OPERAÇÃO COM DESTAQUE DE IBS (IMPOSTO SOBRE BENS E SERVIÇOS) E CBS (CONTRIBUIÇÃO SOBRE BENS E SERVIÇOS) EM CONFORMIDADE COM A EMENDA CONSTITUCIONAL Nº 132/2023. BASE DE CÁLCULO CBS/IBS R$ [VALOR_BC]. ALÍQUOTA CBS: [ALIQ_CBS]%, VALOR CBS R$ [VALOR_CBS]. ALÍQUOTA IBS ESTADUAL/MUNICIPAL: [ALIQ_IBS]%, VALOR IBS R$ [VALOR_IBS]. CÓDIGO CLASSIFICAÇÃO TRIBUTÁRIA (cClassTrib): [COD_CLASSIFTRIB].',
    quandoUsar:
      'Para a parametrização dos novos tributos sobre o consumo criados pela Reforma Tributária (IBS e CBS) nas notas fiscais eletrônicas.',
    fonteOficial: 'Emenda Constitucional nº 132/2023 (Arts. 156-A e 195, V da CF/88) e Projeto de Lei Complementar Regulamentador',
    tagsNFeRelacionadas: ['<infAdic><infCpl>', '<CBS>', '<IBS>', '<cClassTrib>'],
    dataAtualizacao: '2026-01-20',
  },
];
