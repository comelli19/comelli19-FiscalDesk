import { ReformaTributariaRegra } from '../types/fiscal';

export const CRONOGRAMA_REFORMA_TRIBUTARIA: ReformaTributariaRegra[] = [
  {
    ano: 2026,
    fase: 'Fase de Teste e Calibração dos Sistemas',
    aliquotaCBS: 0.9,
    aliquotaIBS: 0.1,
    aliquotaPISCOFINS: 9.25, // Mantido normal com compensação
    reducaoICMSPercentual: 0.0,
    descricaoTransicao:
      'Início da cobrança-teste da CBS (0,9%) e do IBS (0,1%) sem aumento de carga (valores recolhidos são integralmente compensados com o PIS/COFINS devido na operação). Teste do Comitê Gestor do IBS.',
    impostoSeletivoAplicavel: false,
    fonteOficial: 'Art. 125 e 126 do ADCT (acrescentados pela Emenda Constitucional nº 132/2023) e PLP 68/2024',
  },
  {
    ano: 2027,
    fase: 'Entrada em Vigor Plena da CBS e Extinção do PIS/COFINS',
    aliquotaCBS: 8.8,
    aliquotaIBS: 0.1,
    aliquotaPISCOFINS: 0.0, // Extinto
    reducaoICMSPercentual: 0.0,
    descricaoTransicao:
      'Extinção definitiva do PIS e da COFINS. Início da cobrança integral da CBS (alíquota de referência federal de ~8,8%) e do Imposto Seletivo (IS). Redução a zero do IPI (exceto para produtos com industrialização na ZFM).',
    impostoSeletivoAplicavel: true,
    fonteOficial: 'Art. 127 do ADCT / EC 132/2023 e PLP 68/2024 (art. 420)',
  },
  {
    ano: 2028,
    fase: 'Manutenção da CBS e Preparação do IBS',
    aliquotaCBS: 8.8,
    aliquotaIBS: 0.1,
    aliquotaPISCOFINS: 0.0,
    reducaoICMSPercentual: 0.0,
    descricaoTransicao:
      'CBS em plena operação. ICMS e ISS continuam com suas regras normais vigentes em todas as 27 UFs e 5.570 municípios.',
    impostoSeletivoAplicavel: true,
    fonteOficial: 'Art. 128 do ADCT / EC 132/2023',
  },
  {
    ano: 2029,
    fase: 'Início da Transição Gradual do ICMS/ISS para o IBS (1/10)',
    aliquotaCBS: 8.8,
    aliquotaIBS: 1.77,
    aliquotaPISCOFINS: 0.0,
    reducaoICMSPercentual: 10.0, // Redução de 1/10 nas alíquotas do ICMS/ISS
    descricaoTransicao:
      'Redução de 10% nas alíquotas de ICMS e ISS e início da substituição proporcional pela alíquota do IBS (90% das alíquotas estaduais/municipais antigas + 10% do novo IBS).',
    impostoSeletivoAplicavel: true,
    fonteOficial: 'Art. 129 do ADCT / EC 132/2023',
  },
  {
    ano: 2030,
    fase: 'Transição Gradual (2/10)',
    aliquotaCBS: 8.8,
    aliquotaIBS: 3.54,
    aliquotaPISCOFINS: 0.0,
    reducaoICMSPercentual: 20.0,
    descricaoTransicao:
      'ICMS e ISS reduzidos a 80% do valor histórico. IBS assume 20% da carga estadual e municipal com partilha no destino.',
    impostoSeletivoAplicavel: true,
    fonteOficial: 'Art. 129 do ADCT / EC 132/2023',
  },
  {
    ano: 2031,
    fase: 'Transição Gradual (3/10)',
    aliquotaCBS: 8.8,
    aliquotaIBS: 5.31,
    aliquotaPISCOFINS: 0.0,
    reducaoICMSPercentual: 30.0,
    descricaoTransicao:
      'ICMS e ISS reduzidos a 70% do valor histórico. IBS assume 30% da carga.',
    impostoSeletivoAplicavel: true,
    fonteOficial: 'Art. 129 do ADCT / EC 132/2023',
  },
  {
    ano: 2032,
    fase: 'Último Ano de Transição (4/10)',
    aliquotaCBS: 8.8,
    aliquotaIBS: 7.08,
    aliquotaPISCOFINS: 0.0,
    reducaoICMSPercentual: 40.0,
    descricaoTransicao:
      'Último ano de convivência dos tributos antigos com o novo sistema. ICMS e ISS operam com 60% da alíquota.',
    impostoSeletivoAplicavel: true,
    fonteOficial: 'Art. 129 do ADCT / EC 132/2023',
  },
  {
    ano: 2033,
    fase: 'Vigência Plena e Definitiva do Novo Sistema Tributário (IVA Dual)',
    aliquotaCBS: 8.8,
    aliquotaIBS: 17.7,
    aliquotaPISCOFINS: 0.0,
    reducaoICMSPercentual: 100.0, // ICMS e ISS totalmente extintos
    descricaoTransicao:
      'Extinção definitiva e total do ICMS, ISS e IPI (exceto ZFM). Vigência plena e exclusiva do IBS (17,7% estimado) e da CBS (8,8% estimado), totalizando a alíquota padrão estimada em 26,5% a 27,97%.',
    impostoSeletivoAplicavel: true,
    fonteOficial: 'Art. 130 do ADCT / Emenda Constitucional nº 132/2023 e PLP 68/2024',
  },
];

export const REGIMES_DIFERENCIADOS_REFORMA = [
  {
    categoria: 'Cesta Básica Nacional de Alimentos',
    reducao: '100% de Redução (Alíquota Zero de IBS e CBS)',
    itens: 'Arroz, feijão, leite, carnes bovinas, suínas e de aves, peixes, pão francês, farinhas, frutas e café.',
    fonteOficial: 'Art. 8º da Emenda Constitucional 132/2023 e Anexo I do PLP 68/2024',
  },
  {
    categoria: 'Medicamentos e Dispositivos Médicos',
    reducao: 'Alíquota Zero ou Redução de 60%',
    itens: 'Medicamentos essenciais da Rename, fórmulas nutricionais especiais e dispositivos para pessoas com deficiência.',
    fonteOficial: 'Art. 156-A, § 5º da CF/88 e Art. 128 do PLP 68/2024',
  },
  {
    categoria: 'Serviços de Saúde e Ensino',
    reducao: 'Redução de 60% na Alíquota Padrão (Alíquota efetiva de ~10,6%)',
    itens: 'Consultas médicas, internações hospitalares, exames laboratoriais, creches, escolas e universidades.',
    fonteOficial: 'Art. 9º, § 1º da EC 132/2023 e PLP 68/2024',
  },
  {
    categoria: 'Transporte Público Coletivo Urbano',
    reducao: 'Redução de 60% a 100%',
    itens: 'Transporte rodoviário, ferroviário e metroviário de passageiros nas regiões metropolitanas.',
    fonteOficial: 'Art. 9º da EC 132/2023',
  },
  {
    categoria: 'Imposto Seletivo (IS - "Imposto do Pecado")',
    reducao: 'Sobretaxa adicional incidente na produção/extração',
    itens: 'Cigarros e produtos fumígenos, bebidas alcoólicas, bebidas açucaradas, veículos poluentes e minérios.',
    fonteOficial: 'Art. 153, VIII da Constituição Federal (acrescentado pela EC 132/2023)',
  },
];
