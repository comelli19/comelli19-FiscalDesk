import { NCMInfo } from '../types/fiscal';

/**
 * Catálogo Oficial dos 97 Capítulos da Nomenclatura Comum do Mercosul (NCM / TIPI)
 * Conforme Decreto nº 11.158/2022 e Sistema Harmonizado (SH) da OMA.
 */
export interface CapituloNCM {
  capitulo: string; // Ex: "01", "30", "39", "84"
  titulo: string;
  secao: string;
  aliquotaIPITendencia: number;
  regimePISCOFINS: 'geral' | 'monofasico' | 'aliquota_zero' | 'substituicao';
  observacaoTributaria: string;
}

export const CAPITULOS_NCM_OFICIAIS: Record<string, CapituloNCM> = {
  '01': {
    capitulo: '01',
    titulo: 'Animais vivos',
    secao: 'Seção I - Animais vivos e produtos do reino animal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Isenção de IPI na TIPI. Alíquota zero de PIS/COFINS (Lei 10.925/04).',
  },
  '02': {
    capitulo: '02',
    titulo: 'Carnes e miudezas, comestíveis',
    secao: 'Seção I - Animais vivos e produtos do reino animal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Cesta básica nacional. PIS/COFINS alíquota zero nas saídas de carnes bovinas, suínas e aves.',
  },
  '03': {
    capitulo: '03',
    titulo: 'Peixes e crustáceos, moluscos e outros invertebrados aquáticos',
    secao: 'Seção I - Animais vivos e produtos do reino animal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Pescados frescos e congelados com alíquota zero de contribuições federais.',
  },
  '04': {
    capitulo: '04',
    titulo: 'Leite e laticínios; ovos de aves; mel natural; produtos comestíveis de origem animal',
    secao: 'Seção I - Animais vivos e produtos do reino animal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Leite fluido e queijos essenciais com tratamento favorecido e alíquota zero federal.',
  },
  '07': {
    capitulo: '07',
    titulo: 'Produtos hortícolas, plantas, raízes e tubérculos, comestíveis',
    secao: 'Seção II - Produtos do reino vegetal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Feijão, batatas e hortaliças da cesta básica. Isenção ampla de ICMS (Convênio 44/75).',
  },
  '08': {
    capitulo: '08',
    titulo: 'Frutas; cascas de citros e de melões',
    secao: 'Seção II - Produtos do reino vegetal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Frutas frescas nacionais com alíquota zero de PIS/COFINS e isenção de ICMS estadual.',
  },
  '09': {
    capitulo: '09',
    titulo: 'Café, chá, mate e especiarias',
    secao: 'Seção II - Produtos do reino vegetal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Café em grão cru e moído da cesta básica. Café solúvel pode ter incidência de ICMS-ST.',
  },
  '10': {
    capitulo: '10',
    titulo: 'Cereais (Trigo, milho, arroz, cevada)',
    secao: 'Seção II - Produtos do reino vegetal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Arroz e milho com desoneração total de PIS/COFINS (Lei 10.925/04).',
  },
  '11': {
    capitulo: '11',
    titulo: 'Produtos da indústria de moagem; malte; amidos e féculas; inulina; glúten de trigo',
    secao: 'Seção II - Produtos do reino vegetal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Farinha de trigo e mandioca com redução de base ou alíquota zero nas operações internas.',
  },
  '12': {
    capitulo: '12',
    titulo: 'Sementes e frutos oleaginosos; grãos, sementes e frutos diversos; plantas industriais',
    secao: 'Seção II - Produtos do reino vegetal',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Complexo soja e insumos agropecuários com alíquota zero ou suspensão de PIS/COFINS.',
  },
  '15': {
    capitulo: '15',
    titulo: 'Gorduras e óleos animais, vegetais ou de origem microbiana',
    secao: 'Seção III - Gorduras e óleos animais ou vegetais',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Óleo vegetal comestível de soja com alíquota zero federal e ST em diversos estados.',
  },
  '17': {
    capitulo: '17',
    titulo: 'Açúcares e produtos de confeitaria',
    secao: 'Seção IV - Produtos das indústrias alimentares',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Açúcar de cana (1701) com redução da cesta básica e ICMS-ST em produtos de confeitaria.',
  },
  '19': {
    capitulo: '19',
    titulo: 'Preparações à base de cereais, farinhas, amidos, féculas ou leite; produtos de pastelaria',
    secao: 'Seção IV - Produtos das indústrias alimentares',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Pão francês e massas alimentícias comuns com desoneração da cesta básica.',
  },
  '20': {
    capitulo: '20',
    titulo: 'Preparações de legumes, de frutas ou de outras partes de plantas',
    secao: 'Seção IV - Produtos das indústrias alimentares',
    aliquotaIPITendencia: 5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Sucos de frutas, conservas e atomatados com frequente substituição tributária (ICMS-ST).',
  },
  '21': {
    capitulo: '21',
    titulo: 'Preparações alimentícias diversas',
    secao: 'Seção IV - Produtos das indústrias alimentares',
    aliquotaIPITendencia: 5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Molhos, condimentos e suplementos com alíquotas de IPI entre 0% e 8% e ICMS-ST.',
  },
  '22': {
    capitulo: '22',
    titulo: 'Bebidas, líquidos alcoólicos e vinagres',
    secao: 'Seção IV - Produtos das indústrias alimentares',
    aliquotaIPITendencia: 15,
    regimePISCOFINS: 'monofasico',
    observacaoTributaria: 'Cervejas, refrigerantes e água com tributação concentrada de PIS/COFINS, ST e Imposto Seletivo.',
  },
  '25': {
    capitulo: '25',
    titulo: 'Sal; enxofre; terras e pedras; gesso, cal e cimento',
    secao: 'Seção V - Produtos minerais',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Cimento (2523) sujeito a ICMS-ST por Protocolo ICMS em todo o território nacional.',
  },
  '27': {
    capitulo: '27',
    titulo: 'Combustíveis minerais, óleos minerais; matérias betuminosas; ceras minerais',
    secao: 'Seção V - Produtos minerais',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'monofasico',
    observacaoTributaria: 'ICMS monofásico por alíquota ad rem (LC 192/2022) em diesel, gasolina, GLP e etanol.',
  },
  '28': {
    capitulo: '28',
    titulo: 'Produtos químicos inorgânicos; compostos inorgânicos ou orgânicos',
    secao: 'Seção VI - Produtos das indústrias químicas',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Insumos industriais básicos e fertilizantes químicos com redução de base (Convênio 100/97).',
  },
  '29': {
    capitulo: '29',
    titulo: 'Produtos químicos orgânicos',
    secao: 'Seção VI - Produtos das indústrias químicas',
    aliquotaIPITendencia: 3.25,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Mão de obra petroquímica e intermediários industriais com apuração não-cumulativa.',
  },
  '30': {
    capitulo: '30',
    titulo: 'Produtos farmacêuticos (Medicamentos, vacinas, artigos médicos)',
    secao: 'Seção VI - Produtos das indústrias químicas',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'monofasico',
    observacaoTributaria: 'Medicamentos com regime monofásico (Lei 10.147/00), ICMS-ST por PMC e Convênio ICMS 140/01.',
  },
  '31': {
    capitulo: '31',
    titulo: 'Adubos (fertilizantes)',
    secao: 'Seção VI - Produtos das indústrias químicas',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'aliquota_zero',
    observacaoTributaria: 'Alíquota zero federal (Lei 10.925/04) e alíquota gradual de ICMS interestadual sob Convênio 100/97.',
  },
  '32': {
    capitulo: '32',
    titulo: 'Extratos tanantes e tintoriais; tintas e vernizes; mástiques; tintas de escrever',
    secao: 'Seção VI - Produtos das indústrias químicas',
    aliquotaIPITendencia: 5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Tintas e vernizes da construção civil (3208/3209) sujeitos a ICMS-ST com MVA ajustada.',
  },
  '33': {
    capitulo: '33',
    titulo: 'Óleos essenciais e resinoides; produtos de perfumaria ou de toucador e cosméticos',
    secao: 'Seção VI - Produtos das indústrias químicas',
    aliquotaIPITendencia: 13,
    regimePISCOFINS: 'monofasico',
    observacaoTributaria: 'Perfumaria e cosméticos com PIS/COFINS monofásico e alíquotas majoradas de IPI.',
  },
  '34': {
    capitulo: '34',
    titulo: 'Sabões, agentes orgânicos de superfície; produtos de limpeza; velas',
    secao: 'Seção VI - Produtos das indústrias químicas',
    aliquotaIPITendencia: 5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Detergentes, sabonetes e desinfetantes frequentemente enquadrados em ICMS-ST.',
  },
  '38': {
    capitulo: '38',
    titulo: 'Produtos diversos das indústrias químicas (Biodiesel, defensivos, aditivos)',
    secao: 'Seção VI - Produtos das indústrias químicas',
    aliquotaIPITendencia: 5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Defensivos agrícolas com alíquota zero e redução de ICMS conforme Convênio 100/97.',
  },
  '39': {
    capitulo: '39',
    titulo: 'Plásticos e suas obras (Polímeros, tubos, chapas, artefatos para construção)',
    secao: 'Seção VII - Plásticos e suas obras; borracha e suas obras',
    aliquotaIPITendencia: 6.5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Tubos, conexões e caixas d\'água (3925) sujeitos a ICMS-ST para construção civil. IPI de 0% a 9,75%.',
  },
  '40': {
    capitulo: '40',
    titulo: 'Borracha e suas obras (Pneus, câmaras de ar, correias)',
    secao: 'Seção VII - Plásticos e suas obras; borracha e suas obras',
    aliquotaIPITendencia: 15,
    regimePISCOFINS: 'monofasico',
    observacaoTributaria: 'Pneus e câmaras de ar (4011/4013) com tributação monofásica de PIS/COFINS e ICMS-ST nacional.',
  },
  '44': {
    capitulo: '44',
    titulo: 'Madeira, carvão vegetal e obras de madeira',
    secao: 'Seção IX - Madeira, carvão vegetal e obras de madeira',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Madeira serrada e carvão vegetal com diferimento estadual de ICMS em operações internas.',
  },
  '48': {
    capitulo: '48',
    titulo: 'Papel e cartão; obras de pasta de celulose, de papel ou de cartão',
    secao: 'Seção X - Pastas de madeira; papel e cartão para reciclar',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Papel imune para livros e jornais (Art. 150, VI, "d" da CF/88). Caixas de papelão tributadas normalmente.',
  },
  '61': {
    capitulo: '61',
    titulo: 'Vestuário e seus acessórios, de malha',
    secao: 'Seção XI - Matérias têxteis e suas obras',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Vestuário em geral na TIPI com alíquota de IPI 0%. ICMS padrão ou com benefícios regionais.',
  },
  '62': {
    capitulo: '62',
    titulo: 'Vestuário e seus acessórios, exceto de malha',
    secao: 'Seção XI - Matérias têxteis e suas obras',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Camisas, calças e casacos de tecido plano com IPI alíquota zero.',
  },
  '64': {
    capitulo: '64',
    titulo: 'Calçados, polainas e artefatos semelhantes; suas partes',
    secao: 'Seção XII - Calçados, chapéus e artefatos de uso semelhante',
    aliquotaIPITendencia: 0,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Calçados com IPI de 0% a 5%. Vários estados mantêm regimes especiais de crédito presumido.',
  },
  '72': {
    capitulo: '72',
    titulo: 'Ferro fundido, ferro e aço',
    secao: 'Seção XV - Metais comuns e suas obras',
    aliquotaIPITendencia: 5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Siderurgia básica: bobinas, chapas e vergalhões para construção civil.',
  },
  '73': {
    capitulo: '73',
    titulo: 'Obras de ferro fundido, ferro ou aço (Tubos, estruturas, parafusos, arames)',
    secao: 'Seção XV - Metais comuns e suas obras',
    aliquotaIPITendencia: 6.5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Estruturas metálicas, arames e fixadores com ICMS-ST para materiais de construção.',
  },
  '76': {
    capitulo: '76',
    titulo: 'Alumínio e suas obras (Perfis, chapas, latas, esquadrias)',
    secao: 'Seção XV - Metais comuns e suas obras',
    aliquotaIPITendencia: 5,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Esquadrias de alumínio para construção civil com regime de substituição tributária.',
  },
  '84': {
    capitulo: '84',
    titulo: 'Reatores nucleares, caldeiras, máquinas, aparelhos e instrumentos mecânicos',
    secao: 'Seção XVI - Máquinas e aparelhos, material elétrico e suas partes',
    aliquotaIPITendencia: 5.2,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Bens de capital (BK) e máquinas industriais: benefício do Convênio ICMS 52/91 (base reduzida) e Ex-Tarifário.',
  },
  '85': {
    capitulo: '85',
    titulo: 'Máquinas, aparelhos e materiais elétricos; aparelhos de gravação ou de reprodução de som e imagens',
    secao: 'Seção XVI - Máquinas e aparelhos, material elétrico e suas partes',
    aliquotaIPITendencia: 9.75,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Smartphones, computadores e fios elétricos. Benefícios da Lei de Informática (PPB) e ZFM.',
  },
  '87': {
    capitulo: '87',
    titulo: 'Veículos automóveis, tratores, ciclos e outros veículos terrestres, suas partes e acessórios',
    secao: 'Seção XVII - Material de transporte',
    aliquotaIPITendencia: 11,
    regimePISCOFINS: 'monofasico',
    observacaoTributaria: 'Autopeças com regime monofásico (Lei 10.485/02), ICMS-ST com MVA ajustada e IPI de veículos.',
  },
  '90': {
    capitulo: '90',
    titulo: 'Instrumentos e aparelhos de óptica, de fotografia, médicos, cirúrgicos e de precisão',
    secao: 'Seção XVIII - Instrumentos e aparelhos de óptica, de precisão, médicos',
    aliquotaIPITendencia: 4,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Equipamentos médico-hospitalares com isenção ampla de ICMS conforme Convênio ICMS 01/99.',
  },
  '94': {
    capitulo: '94',
    titulo: 'Móveis; mobiliário médico-cirúrgico; colchões; aparelhos de iluminação',
    secao: 'Seção XX - Mercadorias e produtos diversos',
    aliquotaIPITendencia: 3.25,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Móveis e luminárias com incidência de IPI reduzida e substituição tributária em iluminação.',
  },
  '95': {
    capitulo: '95',
    titulo: 'Brinquedos, jogos, artigos para divertimento ou para esporte; suas partes e acessórios',
    secao: 'Seção XX - Mercadorias e produtos diversos',
    aliquotaIPITendencia: 13,
    regimePISCOFINS: 'geral',
    observacaoTributaria: 'Brinquedos e jogos de tabuleiro com alíquotas de IPI e ST conforme protocolo estadual.',
  },
};

// Complemento oficial para garantir cobertura integral dos 96 capítulos ativos do Sistema Harmonizado (Cap. 01 a 97, exceto 77 reservado)
const CAPITULOS_COMPLEMENTARES: Array<[string, string, string, number, CapituloNCM['regimePISCOFINS'], string]> = [
  ['05', 'Outros produtos de origem animal', 'Seção I - Animais vivos e produtos do reino animal', 0, 'aliquota_zero', 'Subprodutos animais e insumos agroindustriais com IPI zero.'],
  ['06', 'Plantas vivas e produtos de floricultura', 'Seção II - Produtos do reino vegetal', 0, 'aliquota_zero', 'Mudas e flores naturais; insumos agrícolas com redução de 60% na RTC.'],
  ['13', 'Gomas, resinas e outros sucos e extratos vegetais', 'Seção II - Produtos do reino vegetal', 0, 'geral', 'Insumos industriais para alimentos, cosméticos e farmacêutica.'],
  ['14', 'Matérias para entrançar e outros produtos de origem vegetal', 'Seção II - Produtos do reino vegetal', 0, 'geral', 'Matérias-primas vegetais com IPI zero na TIPI.'],
  ['16', 'Preparações de carne, de peixes ou de crustáceos', 'Seção IV - Produtos das indústrias alimentares', 0, 'geral', 'Embutidos e conservas alimentícias; verificar ICMS-ST estadual.'],
  ['18', 'Cacau e suas preparações', 'Seção IV - Produtos das indústrias alimentares', 3.25, 'geral', 'Chocolates e derivados de cacau com ICMS-ST em operações varejistas.'],
  ['20', 'Preparações de produtos hortícolas, frutas ou outras partes de plantas', 'Seção IV - Produtos das indústrias alimentares', 0, 'geral', 'Conservas, polpas e sucos; sucos naturais sem açúcar têm redução na RTC.'],
  ['21', 'Preparações alimentícias diversas', 'Seção IV - Produtos das indústrias alimentares', 0, 'geral', 'Condimentos, molhos e suplementos alimentares; conferir CEST 17.'],
  ['23', 'Resíduos e desperdícios das indústrias alimentares; alimentos preparados para animais', 'Seção IV - Produtos das indústrias alimentares', 0, 'aliquota_zero', 'Rações agropecuárias com redução de 60% na RTC; ração pet com IPI e ST.'],
  ['24', 'Tabaco e seus sucedâneos manufaturados', 'Seção IV - Produtos das indústrias alimentares', 300, 'substituicao', 'Substituição tributária federal e estadual; sujeito ao Imposto Seletivo (IS).'],
  ['25', 'Sal; enxofre; terras e pedras; gesso, cal e cimento', 'Seção V - Produtos minerais', 0, 'geral', 'Cimento com ICMS-ST (CEST 05); sal de mesa na Cesta Básica Nacional.'],
  ['26', 'Minérios, escórias e cinzas', 'Seção V - Produtos minerais', 0, 'geral', 'Extração mineral sujeita ao Imposto Seletivo (teto 0,25% — LC 214/2025).'],
  ['28', 'Produtos químicos inorgânicos', 'Seção VI - Produtos das indústrias químicas', 0, 'geral', 'Insumos químicos industriais com tributação padrão e créditos na indústria.'],
  ['29', 'Produtos químicos orgânicos', 'Seção VI - Produtos das indústrias químicas', 0, 'geral', 'Princípios ativos e insumos petroquímicos/farmacêuticos.'],
  ['31', 'Adubos (fertilizantes)', 'Seção VI - Produtos das indústrias químicas', 0, 'aliquota_zero', 'Alíquota zero PIS/COFINS (Lei 10.925/04), Convênio ICMS 100/97 e redução 60% IBS/CBS.'],
  ['34', 'Sabões, agentes orgânicos de superfície, preparações para lavagem e ceras', 'Seção VI - Produtos das indústrias químicas', 3.25, 'geral', 'Produtos de limpeza (CEST 11) e higiene pessoal (Anexo VIII LC 214/2025).'],
  ['35', 'Matérias albuminoides; produtos à base de amidos; colas; enzimas', 'Seção VI - Produtos das indústrias químicas', 6.5, 'geral', 'Colas e adesivos industriais; verificar ST para construção civil.'],
  ['36', 'Pólvoras e explosivos; artigos de pirotecnia; fósforos', 'Seção VI - Produtos das indústrias químicas', 13, 'geral', 'Tributação integral de IPI e controle de produtos fiscalizados.'],
  ['37', 'Produtos para fotografia e cinematografia', 'Seção VI - Produtos das indústrias químicas', 3.25, 'geral', 'Filmes radiográficos médicos possuem redução de 60% na Reforma Tributária.'],
  ['38', 'Produtos diversos das indústrias químicas', 'Seção VI - Produtos das indústrias químicas', 0, 'geral', 'Defensivos agrícolas com alíquota zero federal e redução 60% na RTC; argamassas com ST.'],
  ['41', 'Peles, exceto as peles com pelo, e couros', 'Seção VIII - Peles, couros, peleteria e obras', 0, 'geral', 'Insumo coureiro com IPI 0% e regimes de diferimento em polos calçadistas.'],
  ['42', 'Obras de couro; artigos de correeiro ou de seleiro; artigos de viagem e bolsas', 'Seção VIII - Peles, couros, peleteria e obras', 6.5, 'geral', 'Bolsas, malas e artefatos de couro com tributação padrão.'],
  ['43', 'Peles com pelo e suas obras; peles com pelo artificiais', 'Seção VIII - Peles, couros, peleteria e obras', 13, 'geral', 'Tributação integral conforme TIPI.'],
  ['44', 'Madeira, carvão vegetal e obras de madeira', 'Seção IX - Madeira, carvão vegetal e obras', 0, 'geral', 'Madeira serrada com IPI 0%; MDF e chapas com IPI 3,25%.'],
  ['45', 'Cortiça e suas obras', 'Seção IX - Madeira, carvão vegetal e obras', 3.25, 'geral', 'Rolhas e isolantes de cortiça.'],
  ['46', 'Obras de espartaria ou de cestaria', 'Seção IX - Madeira, carvão vegetal e obras', 0, 'geral', 'Obras trançadas com IPI zero.'],
  ['47', 'Pastas de madeira ou de outras matérias fibrosas celulósicas; papel para reciclar', 'Seção X - Pastas de madeira, papel e cartão', 0, 'geral', 'Celulose e aparas de papel reciclável (diferimento estadual em diversas UFs).'],
  ['49', 'Livros, jornais, gravuras e outros produtos das indústrias gráficas', 'Seção X - Pastas de madeira, papel e cartão', 0, 'aliquota_zero', 'Imunidade constitucional para livros/jornais/periódicos (CF/88 Art. 150, VI, d).'],
  ['50', 'Seda', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Fios e tecidos de seda com IPI 0%.'],
  ['51', 'Lã, pelos finos ou grosseiros; fios e tecidos de crina', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Tecidos e fios de lã com IPI 0%.'],
  ['52', 'Algodão', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Fios e tecidos de algodão com IPI 0%.'],
  ['53', 'Outras fibras têxteis vegetais; fios de papel e tecidos', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Linho, juta e fibras naturais com IPI 0%.'],
  ['54', 'Filamentos sintéticos ou artificiais', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Tecidos de poliéster e náilon com IPI 0%.'],
  ['55', 'Fibras sintéticas ou artificiais, descontínuas', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Fibras e tecidos mistos com IPI 0%.'],
  ['56', 'Pastas (ouates), feltros e falsos tecidos (TNT); cordéis e cordas', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Insumos industriais têxteis e hospitalares com IPI 0%.'],
  ['57', 'Tapetes e outros revestimentos para pisos, de matérias têxteis', 'Seção XI - Matérias têxteis e suas obras', 3.25, 'geral', 'Revestimentos têxteis e carpetes.'],
  ['58', 'Tecidos especiais; tecidos tufados; rendas; tapeçarias; passamanarias; bordados', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Aviamentos e tecidos especiais com IPI 0%.'],
  ['59', 'Tecidos impregnados, revestidos, recobertos ou estratificados', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Sintéticos laminados e lonas técnicas industriais.'],
  ['60', 'Tecidos de malha', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Malharia industrial com IPI 0%.'],
  ['63', 'Outros artefatos têxteis confeccionados; sortidos; roupas usadas', 'Seção XI - Matérias têxteis e suas obras', 0, 'geral', 'Cama, mesa e banho com IPI 0%.'],
  ['65', 'Chapéus e artefatos de uso semelhante, e suas partes', 'Seção XII - Calçados, chapéus e artefatos', 0, 'geral', 'Capacetes de segurança/motociclísticos (verificar ST autopeças).'],
  ['66', 'Guarda-chuvas, sombrinhas, guarda-sóis, bengalas e chicotes', 'Seção XII - Calçados, chapéus e artefatos', 6.5, 'geral', 'Tributação padrão no varejo.'],
  ['67', 'Penas e penugem preparadas; flores artificiais; obras de cabelo', 'Seção XII - Calçados, chapéus e artefatos', 9.75, 'geral', 'Tributação padrão na TIPI.'],
  ['68', 'Obras de pedra, gesso, cimento, amianto, mica ou matérias semelhantes', 'Seção XIII - Obras de pedra, cerâmica e vidro', 0, 'geral', 'Granitos, blocos de concreto e placas de gesso para construção civil.'],
  ['69', 'Produtos cerâmicos', 'Seção XIII - Obras de pedra, cerâmica e vidro', 3.25, 'geral', 'Porcelanatos, revestimentos e louças sanitárias sujeitos a ICMS-ST (CEST 10).'],
  ['70', 'Vidro e suas obras', 'Seção XIII - Obras de pedra, cerâmica e vidro', 3.25, 'geral', 'Vidros planos/temperados (construção) e embalagens de vidro.'],
  ['71', 'Pérolas naturais, pedras preciosas, metais preciosos e bijuterias', 'Seção XIV - Joias e metais preciosos', 7.8, 'geral', 'Joalheria e bijuterias com alíquotas diferenciadas de IPI.'],
  ['74', 'Cobre e suas obras', 'Seção XV - Metais comuns e suas obras', 3.25, 'geral', 'Fios, barras e tubos de cobre industriais.'],
  ['75', 'Níquel e suas obras', 'Seção XV - Metais comuns e suas obras', 3.25, 'geral', 'Ligas de níquel industriais.'],
  ['78', 'Chumbo e suas obras', 'Seção XV - Metais comuns e suas obras', 0, 'geral', 'Lingotes e insumos de chumbo.'],
  ['79', 'Zinco e suas obras', 'Seção XV - Metais comuns e suas obras', 0, 'geral', 'Insumos de galvanização e ligas de zinco.'],
  ['80', 'Estanho e suas obras', 'Seção XV - Metais comuns e suas obras', 0, 'geral', 'Soldas e lingotes de estanho.'],
  ['81', 'Outros metais comuns; cermets; obras dessas matérias', 'Seção XV - Metais comuns e suas obras', 3.25, 'geral', 'Titânio, tungstênio e ligas especiais.'],
  ['82', 'Ferramentas, artefatos de cutelaria e talheres, de metais comuns', 'Seção XV - Metais comuns e suas obras', 5.2, 'geral', 'Ferramentas manuais e brocas com ICMS-ST (CEST 08).'],
  ['83', 'Obras diversas de metais comuns', 'Seção XV - Metais comuns e suas obras', 6.5, 'geral', 'Fechaduras, dobradiças e ferragens com ICMS-ST (CEST 10).'],
  ['86', 'Veículos e material para vias férreas; contêineres', 'Seção XVII - Material de transporte', 0, 'geral', 'Equipamentos ferroviários e contêineres logísticos.'],
  ['88', 'Aeronaves e aparelhos espaciais, e suas partes', 'Seção XVII - Material de transporte', 3.25, 'geral', 'Aeronaves particulares sujeitas ao Imposto Seletivo (LC 214/2025).'],
  ['89', 'Embarcações e estruturas flutuantes', 'Seção XVII - Material de transporte', 6.5, 'geral', 'Embarcações de esporte/recreio sujeitas ao Imposto Seletivo (LC 214/2025).'],
  ['91', 'Artigos de relojoaria', 'Seção XVIII - Instrumentos ópticos e relojoaria', 13, 'geral', 'Relógios e peças de relojoaria.'],
  ['92', 'Instrumentos musicais; suas partes e acessórios', 'Seção XVIII - Instrumentos ópticos e relojoaria', 9.75, 'geral', 'Instrumentos acústicos e eletrônicos.'],
  ['93', 'Armas e munições; suas partes e acessórios', 'Seção XIX - Armas e munições', 29.25, 'geral', 'IPI elevado e controle regulatório específico.'],
  ['96', 'Obras diversas (escovas, canetas, fraldas, absorventes)', 'Seção XX - Mercadorias e produtos diversos', 0, 'geral', 'Absorventes higiênicos (alíquota zero IBS/CBS) e fraldas/escovas (redução 60%).'],
  ['97', 'Objetos de arte, de coleção e antiguidades', 'Seção XXI - Objetos de arte e antiguidades', 0, 'geral', 'Obras de arte originais com IPI 0%.'],
];

for (const [cap, titulo, secao, ipi, pisCofins, obs] of CAPITULOS_COMPLEMENTARES) {
  if (!CAPITULOS_NCM_OFICIAIS[cap]) {
    CAPITULOS_NCM_OFICIAIS[cap] = {
      capitulo: cap,
      titulo,
      secao,
      aliquotaIPITendencia: ipi,
      regimePISCOFINS: pisCofins,
      observacaoTributaria: obs,
    };
  }
}

/**
 * Motor Universal de Resolução de NCM:
 * Interpreta qualquer código NCM (8 dígitos ou formatado com pontos),
 * identifica o Capítulo, Seção, alíquota de IPI pela TIPI, tendência de PIS/COFINS e regras estaduais.
 */
export function resolverNCMUniversal(codigoNCM: string): NCMInfo {
  const limpo = codigoNCM.replace(/\D/g, '');
  const cap = limpo.substring(0, 2);
  const infoCap = CAPITULOS_NCM_OFICIAIS[cap];

  const capituloNome = infoCap
    ? `Capítulo ${cap} - ${infoCap.titulo}`
    : `Capítulo ${cap} (Classificação SH Mercosul)`;

  const setorNome = infoCap ? infoCap.secao : 'Indústria & Comércio em Geral';

  const formatado =
    limpo.length === 8
      ? `${limpo.substring(0, 4)}.${limpo.substring(4, 6)}.${limpo.substring(6, 8)}`
      : codigoNCM;

  return {
    codigo: formatado,
    descricao: `Mercadoria classificada no ${capituloNome}`,
    aliquotaIPI: infoCap ? infoCap.aliquotaIPITendencia : 5.0,
    regimePISCOFINS: infoCap ? infoCap.regimePISCOFINS : 'geral',
    aliquotaPIS: infoCap?.regimePISCOFINS === 'aliquota_zero' ? 0.0 : 1.65,
    aliquotaCOFINS: infoCap?.regimePISCOFINS === 'aliquota_zero' ? 0.0 : 7.6,
    temST: ['22', '27', '30', '32', '33', '39', '40', '73', '85', '87'].includes(cap),
    unidadeTributavel: 'UN',
    tributacaoAproximadaIBPT: { federal: 12.0, estadual: 18.0, municipal: 0.0 },
    fonteOficial: 'Tabela TIPI (Decreto nº 11.158/2022) e Sistema Harmonizado Mercosul',
    dataAtualizacao: '2026-01-20',
    observacao: infoCap
      ? infoCap.observacaoTributaria
      : 'NCM interpretado deterministicamente pelo motor de regras da TIPI e do Sistema Harmonizado.',
    setor: setorNome,
    capitulo: capituloNome,
  };
}
