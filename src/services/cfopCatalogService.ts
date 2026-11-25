import { CFOP } from '../types/fiscal';
import { INITIAL_CFOPS } from '../data/cfops';

/**
 * Serviço de Catálogo Remoto de CFOPs (Convênio S/Nº 1970, Ajuste SINIEF e MOC v7.0)
 * Suporta busca assíncrona, paginação, dedução determinística universal e importação em lote.
 */

// Índice pré-normalizado em memória no servidor para busca ~1ms e lookup O(1)
interface CFOPIndexEntry {
  cleanCode: string;
  devCleanCode: string;
  searchText: string;
  cfop: CFOP;
}

const MAX_CFOP_QUERY_LEN = 120;
const MAX_CFOP_IMPORT_BATCH = 5000;

let cfopIndexList: CFOPIndexEntry[] = [];
const cfopIndexByCode = new Map<string, CFOPIndexEntry>();
let totalEntradasCache = 0;
let totalSaidasCache = 0;
let ultimaSincronizacaoCFOP = new Date().toISOString();
let totalCFOPsImportadosAdicionais = 0;

export interface BuscarCFOPParams {
  q?: string;
  tipo?: 'todos' | 'entrada' | 'saida';
  abrangencia?: 'todos' | 'estadual' | 'interestadual' | 'exterior';
  grupo?: string;
  apenasFavoritos?: boolean;
  page?: number;
  limit?: number;
}

export interface ResultadoBuscaCFOP {
  data: CFOP[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  gruposDisponiveis: string[];
  ultimaSincronizacao: string;
  fonte: string;
}

/**
 * Formata um código de 4 dígitos para a notação padrão "X.XXX"
 */
export function formatarCodigoCFOP(codigo: string): string {
  const limpo = codigo.replace(/\D/g, '');
  if (limpo.length === 4) {
    return `${limpo[0]}.${limpo.substring(1)}`;
  }
  return codigo;
}

/**
 * Dedução Determinística Universal de qualquer código CFOP oficial
 * Baseado no 1º dígito (Sentido e Abrangência) e nos 3 dígitos seguintes (Grupo de Operação)
 */
export function resolverCFOPUniversal(codigo: string): CFOP {
  const limpo = codigo.replace(/\D/g, '');
  const formatado = formatarCodigoCFOP(limpo);
  const digito1 = limpo[0] || '5';
  const sufixo3 = limpo.substring(1) || '102';

  // Sentido e Abrangência
  const ehEntrada = ['1', '2', '3'].includes(digito1);
  const tipo: 'entrada' | 'saida' = ehEntrada ? 'entrada' : 'saida';

  let abrangencia: 'estadual' | 'interestadual' | 'exterior' = 'estadual';
  if (digito1 === '2' || digito1 === '6') abrangencia = 'interestadual';
  if (digito1 === '3' || digito1 === '7') abrangencia = 'exterior';

  const grupo: '1xxx' | '2xxx' | '3xxx' | '5xxx' | '6xxx' | '7xxx' =
    ['1xxx', '2xxx', '3xxx', '5xxx', '6xxx', '7xxx'].includes(`${digito1}xxx`)
      ? (`${digito1}xxx` as any)
      : '1xxx';

  // Análise dos 3 dígitos de subgrupo
  let descricao = `Operação de ${tipo === 'saida' ? 'saída' : 'entrada'} ${abrangencia}`;
  let quandoUsar = `Utilizado para registrar operações fiscais de ${tipo} de mercadorias no âmbito ${abrangencia}.`;
  let quandoNaoUsar = 'Não utilizar para operações de natureza ou abrangência geográfica divergente.';
  let cfopDevolucao = '';
  let geraCreditoICMS = true;
  let geraCreditoIPI = false;
  let geraCreditoPISCOFINS = true;
  let movimentaEstoque = true;
  let movimentaFinanceiro = true;

  // Subgrupos oficiais da tabela SINIEF
  if (sufixo3 === '101' || sufixo3 === '102' || sufixo3 === '103' || sufixo3 === '104') {
    const ehProd = sufixo3 === '101' || sufixo3 === '103';
    descricao = ehEntrada
      ? ehProd
        ? 'Compra para industrialização ou produção rural'
        : 'Compra para comercialização'
      : ehProd
      ? 'Venda de produção do estabelecimento'
      : 'Venda de mercadoria adquirida ou recebida de terceiros';
    quandoUsar = ehEntrada
      ? 'Entrada por aquisição de mercadorias destinadas à atividade produtiva ou revenda.'
      : 'Saída por venda efetiva de mercadoria produzida ou adquirida de terceiros.';
    cfopDevolucao = ehEntrada
      ? digito1 === '1' ? '5.201' : digito1 === '2' ? '6.201' : '7.201'
      : digito1 === '5' ? '1.201' : digito1 === '6' ? '2.201' : '3.201';
    geraCreditoIPI = ehProd;
    if (digito1 === '7') {
      geraCreditoICMS = false;
      geraCreditoIPI = false;
      geraCreditoPISCOFINS = false;
    }
  } else if (sufixo3 === '107' || sufixo3 === '108') {
    descricao =
      sufixo3 === '107'
        ? 'Venda de produção do estabelecimento destinada a não contribuinte'
        : 'Venda de mercadoria adquirida ou recebida de terceiros destinada a não contribuinte';
    quandoUsar = 'Venda interestadual para consumidor final não contribuinte do ICMS (sujeita a DIFAL).';
    geraCreditoIPI = sufixo3 === '107';
  } else if (sufixo3 === '109' || sufixo3 === '110') {
    descricao =
      sufixo3 === '109'
        ? 'Venda de produção destinada à Zona Franca de Manaus ou Áreas de Livre Comércio'
        : 'Venda de mercadoria adquirida ou recebida de terceiros destinada à ZFM ou ALC';
    quandoUsar = 'Operação incentivada para ZFM/ALC com isenção de ICMS/IPI e alíquota zero de PIS/COFINS.';
    geraCreditoICMS = false;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = false;
  } else if (sufixo3 === '116' || sufixo3 === '117') {
    descricao = ehEntrada
      ? 'Compra para industrialização ou comercialização originada de encomenda para recebimento futuro'
      : 'Venda de produção ou mercadoria adquirida originada de encomenda para entrega futura';
    quandoUsar = 'Circulação física vinculada a simples faturamento antecipado (x.922).';
    geraCreditoICMS = true;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (sufixo3 === '118' || sufixo3 === '119') {
    descricao = 'Venda entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem';
    quandoUsar = 'Faturamento triangular em venda à ordem.';
    geraCreditoIPI = sufixo3 === '118';
    movimentaEstoque = false;
  } else if (sufixo3 === '124') {
    descricao = ehEntrada ? 'Industrialização efetuada por outra empresa' : 'Industrialização efetuada para outra empresa';
    quandoUsar = 'Cobrança da mão de obra e insumos aplicados em industrialização por encomenda.';
    geraCreditoIPI = true;
    movimentaEstoque = false;
  } else if (['151', '152', '155', '408', '409'].includes(sufixo3)) {
    descricao = ehEntrada
      ? 'Transferência para industrialização, comercialização ou ativo imobilizado'
      : 'Transferência de produção ou mercadoria entre estabelecimentos do mesmo titular';
    quandoUsar = 'Movimentação entre matriz e filiais sem incidência de ICMS (STF ADC 49 e LC 204/2023) e sem receita de PIS/COFINS.';
    geraCreditoICMS = false;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (sufixo3 === '201' || sufixo3 === '202') {
    descricao = ehEntrada
      ? 'Devolução de venda de mercadoria do estabelecimento'
      : 'Devolução de compra para industrialização ou comercialização';
    quandoUsar = 'Operação de estorno ou retorno físico de mercadorias recebidas anteriormente.';
    cfopDevolucao = ehEntrada
      ? digito1 === '1' ? '5.102' : digito1 === '2' ? '6.102' : '7.102'
      : digito1 === '5' ? '1.102' : digito1 === '6' ? '2.102' : '3.102';
    geraCreditoIPI = sufixo3 === '201';
    if (digito1 === '7' || limpo === '3201' || limpo === '3202') {
      geraCreditoICMS = false;
      geraCreditoIPI = false;
      geraCreditoPISCOFINS = false;
    }
  } else if (['401', '402', '403'].includes(sufixo3)) {
    descricao = ehEntrada
      ? 'Compra de mercadoria sujeita ao regime de substituição tributária'
      : 'Venda de mercadoria sujeita ao regime de substituição tributária (Substituto)';
    quandoUsar = 'Operação com retenção de ICMS-ST pelo substituto tributário.';
    geraCreditoICMS = !ehEntrada || sufixo3 === '401';
    geraCreditoIPI = sufixo3 === '401';
  } else if (['404', '405'].includes(sufixo3)) {
    descricao = 'Venda de mercadoria com ICMS cobrado anteriormente por substituição tributária (Substituído)';
    quandoUsar = 'Operação de contribuinte substituído sem destaque de ICMS próprio (CST 60 / CSOSN 500).';
    geraCreditoICMS = false;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = true;
  } else if (sufixo3 === '551') {
    descricao = ehEntrada
      ? 'Compra de bem para o ativo imobilizado'
      : 'Venda de bem do ativo imobilizado';
    quandoUsar = ehEntrada
      ? 'Aquisição de bens destinados ao ativo permanente.'
      : 'Alienação de bem do ativo imobilizado (não incidência de ICMS, IPI, PIS e COFINS).';
    geraCreditoICMS = ehEntrada;
    geraCreditoIPI = digito1 === '3';
    geraCreditoPISCOFINS = ehEntrada;
  } else if (sufixo3 === '556') {
    descricao = ehEntrada ? 'Compra de material para uso ou consumo' : 'Devolução ou saída de material de uso ou consumo';
    quandoUsar = 'Aquisição ou movimentação de material de uso e consumo (sem crédito de ICMS, IPI e PIS/COFINS).';
    geraCreditoICMS = false;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = false;
  } else if (['554', '555', '901', '902', '903', '905', '906', '912', '913', '914', '915', '916', '924', '925'].includes(sufixo3)) {
    descricao =
      sufixo3 === '915'
        ? ehEntrada ? 'Entrada de mercadoria ou bem recebido para conserto ou reparo' : 'Remessa de mercadoria ou bem para conserto ou reparo'
        : sufixo3 === '916'
        ? ehEntrada ? 'Retorno de mercadoria ou bem remetido para conserto ou reparo' : 'Retorno de mercadoria ou bem recebido para conserto ou reparo'
        : sufixo3 === '901' || sufixo3 === '902' || sufixo3 === '903'
        ? 'Remessa ou retorno em industrialização por encomenda'
        : sufixo3 === '905' || sufixo3 === '906'
        ? 'Remessa ou retorno de depósito fechado ou armazém geral'
        : sufixo3 === '912' || sufixo3 === '913' || sufixo3 === '914'
        ? 'Remessa ou retorno para demonstração, feira ou exposição'
        : 'Remessa ou retorno de bem fora do estabelecimento / conta e ordem';
    quandoUsar = 'Circulação física temporária sem transferência de propriedade, com suspensão de ICMS e IPI e sem incidência de PIS/COFINS.';
    geraCreditoICMS = false;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (['908', '909', '920', '921', '923', '927', '949'].includes(sufixo3)) {
    descricao =
      sufixo3 === '908' || sufixo3 === '909'
        ? 'Remessa ou retorno de bem por conta de contrato de comodato'
        : sufixo3 === '920' || sufixo3 === '921'
        ? 'Remessa ou devolução de vasilhame ou sacaria'
        : sufixo3 === '923'
        ? 'Remessa/entrada de mercadoria por conta e ordem de terceiros'
        : sufixo3 === '927'
        ? 'Baixa de estoque decorrente de perda, roubo ou deterioração'
        : ehEntrada
        ? 'Outra entrada de mercadoria ou prestação de serviço não especificada'
        : 'Outra saída de mercadoria ou prestação de serviço não especificada';
    quandoUsar = 'Operação sem natureza de venda/faturamento e sem incidência tributária padrão neste documento.';
    geraCreditoICMS = false;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (sufixo3 === '911') {
    descricao = 'Remessa/entrada de amostra grátis';
    quandoUsar = 'Amostra grátis de diminuto valor comercial (isenção de ICMS e IPI quando atendidos os requisitos legais).';
    geraCreditoICMS = false;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (sufixo3 === '910') {
    descricao = ehEntrada ? 'Entrada de bonificação, doação ou brinde' : 'Remessa em bonificação, doação ou brinde';
    quandoUsar = 'Circulação gratuita sem receita operacional de PIS/COFINS.';
    geraCreditoICMS = true;
    geraCreditoIPI = !ehEntrada;
    geraCreditoPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (sufixo3 === '917' || sufixo3 === '918') {
    descricao = 'Remessa ou devolução em consignação mercantil ou industrial';
    quandoUsar = 'Consignação com destaque de ICMS/IPI (Ajuste SINIEF 02/93) e sem incidência de PIS/COFINS até a venda efetiva.';
    geraCreditoICMS = true;
    geraCreditoIPI = true;
    geraCreditoPISCOFINS = false;
    movimentaFinanceiro = false;
  } else if (sufixo3 === '922') {
    descricao = 'Lançamento efetuado a título de simples faturamento para entrega futura';
    quandoUsar = 'Faturamento antecipado sem destaque de ICMS (destaque na efetiva remessa x.116/x.117).';
    geraCreditoICMS = false;
    geraCreditoIPI = true;
    geraCreditoPISCOFINS = true;
    movimentaEstoque = false;
    movimentaFinanceiro = true;
  }

  if (digito1 === '7') {
    geraCreditoICMS = false;
    geraCreditoIPI = false;
    geraCreditoPISCOFINS = false;
  }

  return {
    id: `cfop-${limpo}`,
    codigo: formatado,
    descricao,
    tipo,
    abrangencia,
    grupo,
    quandoUsar,
    quandoNaoUsar,
    cfopDevolucao: cfopDevolucao || undefined,
    geraCreditoDebitoICMS: geraCreditoICMS,
    geraCreditoDebitoIPI: geraCreditoIPI,
    geraCreditoDebitoPISCOFINS: geraCreditoPISCOFINS,
    movimentaEstoque,
    movimentaFinanceiro,
    vigenciaInicio: '2003-01-01',
    fonte: 'Tabela Oficial CFOP - Convênio S/Nº 1970 e Ajuste SINIEF 07/05 (MOC NF-e v7.0)',
    dataAtualizacao: '2026-01-01',
    favorito: false,
  };
}

/**
 * Normaliza texto para busca case-insensitive e sem acentos
 */
function normalizarTexto(t: string): string {
  return (t || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function criarCFOPIndexEntry(cfop: CFOP): CFOPIndexEntry {
  const cleanCode = (cfop.codigo || '').replace(/\D/g, '');
  const devCleanCode = (cfop.cfopDevolucao || '').replace(/\D/g, '');
  const searchText = normalizarTexto(
    `${cfop.codigo} ${cleanCode} ${cfop.descricao} ${cfop.quandoUsar} ${cfop.cfopDevolucao || ''}`
  );
  return { cleanCode, devCleanCode, searchText, cfop };
}

function reconstruirEstatisticasCFOP(): void {
  cfopIndexList = Array.from(cfopIndexByCode.values());
  let entradas = 0;
  let saidas = 0;
  for (let i = 0; i < cfopIndexList.length; i++) {
    if (cfopIndexList[i].cfop.tipo === 'entrada') entradas++;
    else saidas++;
  }
  totalEntradasCache = entradas;
  totalSaidasCache = saidas;
}

// Popula índice pré-normalizado na carga inicial do módulo
for (const cfop of INITIAL_CFOPS) {
  const entry = criarCFOPIndexEntry(cfop);
  if (entry.cleanCode) {
    cfopIndexByCode.set(entry.cleanCode, entry);
  }
}
reconstruirEstatisticasCFOP();

const GRUPOS_CFOP_DISPONIVEIS = [
  'todos',
  '1xxx_5xxx',
  '2xxx_6xxx',
  '3xxx_7xxx',
  '1xxx',
  '2xxx',
  '3xxx',
  '5xxx',
  '6xxx',
  '7xxx',
];

/**
 * Busca remota assíncrona com filtros, ordenação e paginação (~1ms com índice pré-normalizado)
 */
export function buscarCFOPsNoCatalogo(params: BuscarCFOPParams): ResultadoBuscaCFOP {
  const qRaw = typeof params.q === 'string' ? params.q.slice(0, MAX_CFOP_QUERY_LEN).trim() : '';
  const tipo = params.tipo || 'todos';
  const abrangencia = params.abrangencia || 'todos';
  const grupo = params.grupo || 'todos';
  const apenasFavoritos = Boolean(params.apenasFavoritos);
  const page = Number.isFinite(Number(params.page)) ? Math.max(1, Number(params.page)) : 1;
  const limit = Number.isFinite(Number(params.limit))
    ? Math.max(1, Math.min(1000, Number(params.limit)))
    : 40;

  const termoBusca = normalizarTexto(qRaw);
  const digitosBusca = qRaw.replace(/\D/g, '');
  const tokens = termoBusca ? termoBusca.split(/\s+/).filter(Boolean) : [];

  const filtrados: CFOPIndexEntry[] = [];

  for (let i = 0; i < cfopIndexList.length; i++) {
    const entry = cfopIndexList[i];
    const cfop = entry.cfop;

    if (tipo !== 'todos' && cfop.tipo !== tipo) continue;

    if (
      abrangencia !== 'todos' &&
      (abrangencia as string) !== 'todas' &&
      cfop.abrangencia !== abrangencia
    ) {
      continue;
    }

    if (grupo !== 'todos') {
      if (grupo === '1xxx_5xxx') {
        if (cfop.grupo !== '1xxx' && cfop.grupo !== '5xxx') continue;
      } else if (grupo === '2xxx_6xxx') {
        if (cfop.grupo !== '2xxx' && cfop.grupo !== '6xxx') continue;
      } else if (grupo === '3xxx_7xxx') {
        if (cfop.grupo !== '3xxx' && cfop.grupo !== '7xxx') continue;
      } else if (cfop.grupo !== grupo) {
        continue;
      }
    }

    if (apenasFavoritos && !cfop.favorito) continue;

    if (termoBusca) {
      const matchCod =
        digitosBusca.length > 0 &&
        (entry.cleanCode.includes(digitosBusca) || entry.devCleanCode.includes(digitosBusca));
      let matchTokens = true;
      for (let t = 0; t < tokens.length; t++) {
        if (!entry.searchText.includes(tokens[t])) {
          matchTokens = false;
          break;
        }
      }
      if (!matchCod && !matchTokens) continue;
    }

    filtrados.push(entry);
  }

  // Se o usuário digitou um código de 4 dígitos ainda não listado, resolve deterministicamente sem poluir o banco
  if (digitosBusca.length === 4 && !cfopIndexByCode.has(digitosBusca) && filtrados.length === 0) {
    filtrados.push(criarCFOPIndexEntry(resolverCFOPUniversal(digitosBusca)));
  }

  // Prioriza correspondência exata / prefixo quando pesquisando por dígitos
  if (digitosBusca.length >= 2 && filtrados.length > 1) {
    filtrados.sort((a, b) => {
      const aRank = a.cleanCode === digitosBusca ? 0 : a.cleanCode.startsWith(digitosBusca) ? 1 : 2;
      const bRank = b.cleanCode === digitosBusca ? 0 : b.cleanCode.startsWith(digitosBusca) ? 1 : 2;
      if (aRank !== bRank) return aRank - bRank;
      return a.cleanCode.localeCompare(b.cleanCode);
    });
  }

  const total = filtrados.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginaAtual = Math.min(page, totalPages);
  const inicio = (paginaAtual - 1) * limit;
  const paginados = filtrados.slice(inicio, inicio + limit).map((e) => e.cfop);

  return {
    data: paginados,
    total,
    page: paginaAtual,
    limit,
    totalPages,
    gruposDisponiveis: GRUPOS_CFOP_DISPONIVEIS,
    ultimaSincronizacao: ultimaSincronizacaoCFOP,
    fonte: 'Tabela Oficial de CFOPs do Ajuste SINIEF 07/05 e SEFAZ MOC v7.0',
  };
}

/**
 * Busca por código de CFOP específico (O(1))
 */
export function buscarCFOPPorCodigo(codigo: string): CFOP | null {
  const limpo = (codigo || '').replace(/\D/g, '').slice(0, 4);
  if (!limpo) return null;

  const encontrado = cfopIndexByCode.get(limpo);
  if (encontrado) return encontrado.cfop;

  if (limpo.length === 4) {
    return resolverCFOPUniversal(limpo);
  }

  return null;
}

/**
 * Importa um lote de CFOPs (upload JSON ou CSV)
 */
export function importarLoteCFOPs(itens: any[]): {
  sucesso: boolean;
  importados: number;
  atualizados: number;
  totalAtual: number;
} {
  if (!Array.isArray(itens) || itens.length === 0) {
    return {
      sucesso: false,
      importados: 0,
      atualizados: 0,
      totalAtual: cfopIndexList.length,
    };
  }

  let importados = 0;
  let atualizados = 0;

  for (const item of itens.slice(0, MAX_CFOP_IMPORT_BATCH)) {
    if (!item || typeof item !== 'object' || typeof item.codigo !== 'string') continue;
    const clean = item.codigo.replace(/\D/g, '').slice(0, 4);
    if (clean.length < 4) continue;

    const jaExiste = cfopIndexByCode.has(clean);
    const formatado = formatarCodigoCFOP(clean);
    const resolvido = resolverCFOPUniversal(clean);

    const novoCFOP: CFOP = {
      id: typeof item.id === 'string' ? item.id : `cfop-${clean}`,
      codigo: formatado,
      descricao:
        typeof item.descricao === 'string' && item.descricao.trim()
          ? item.descricao.replace(/<[^>]*>/g, '').trim().slice(0, 500)
          : resolvido.descricao,
      tipo: item.tipo === 'entrada' || item.tipo === 'saida' ? item.tipo : resolvido.tipo,
      abrangencia: ['estadual', 'interestadual', 'exterior'].includes(item.abrangencia)
        ? item.abrangencia
        : resolvido.abrangencia,
      grupo: item.grupo || resolvido.grupo,
      quandoUsar:
        typeof item.quandoUsar === 'string' && item.quandoUsar.trim()
          ? item.quandoUsar.replace(/<[^>]*>/g, '').trim().slice(0, 500)
          : resolvido.quandoUsar,
      quandoNaoUsar:
        typeof item.quandoNaoUsar === 'string' && item.quandoNaoUsar.trim()
          ? item.quandoNaoUsar.replace(/<[^>]*>/g, '').trim().slice(0, 500)
          : resolvido.quandoNaoUsar,
      cfopDevolucao: item.cfopDevolucao || resolvido.cfopDevolucao,
      geraCreditoDebitoICMS:
        typeof item.geraCreditoDebitoICMS === 'boolean'
          ? item.geraCreditoDebitoICMS
          : resolvido.geraCreditoDebitoICMS,
      geraCreditoDebitoIPI:
        typeof item.geraCreditoDebitoIPI === 'boolean'
          ? item.geraCreditoDebitoIPI
          : resolvido.geraCreditoDebitoIPI,
      geraCreditoDebitoPISCOFINS:
        typeof item.geraCreditoDebitoPISCOFINS === 'boolean'
          ? item.geraCreditoDebitoPISCOFINS
          : resolvido.geraCreditoDebitoPISCOFINS,
      movimentaEstoque:
        typeof item.movimentaEstoque === 'boolean'
          ? item.movimentaEstoque
          : resolvido.movimentaEstoque,
      movimentaFinanceiro:
        typeof item.movimentaFinanceiro === 'boolean'
          ? item.movimentaFinanceiro
          : resolvido.movimentaFinanceiro,
      vigenciaInicio: item.vigenciaInicio || '2003-01-01',
      fonte: item.fonte || 'Importação do Catálogo Oficial de CFOPs',
      dataAtualizacao: new Date().toISOString().split('T')[0],
      favorito: Boolean(item.favorito),
      anotacoes: typeof item.anotacoes === 'string' ? item.anotacoes.slice(0, 1000) : undefined,
    };

    cfopIndexByCode.set(clean, criarCFOPIndexEntry(novoCFOP));

    if (jaExiste) atualizados++;
    else importados++;
  }

  reconstruirEstatisticasCFOP();
  ultimaSincronizacaoCFOP = new Date().toISOString();
  totalCFOPsImportadosAdicionais += importados;

  return {
    sucesso: true,
    importados,
    atualizados,
    totalAtual: cfopIndexList.length,
  };
}

/**
 * Retorna o status e resumo do catálogo de CFOPs
 */
export function obterStatusCatalogoCFOP(): {
  totalRegistros: number;
  totalEntradas: number;
  totalSaidas: number;
  ultimaSincronizacao: string;
  totalImportadosAdicionais: number;
  versaoTabela: string;
} {
  return {
    totalRegistros: cfopIndexList.length,
    totalEntradas: totalEntradasCache,
    totalSaidas: totalSaidasCache,
    ultimaSincronizacao: ultimaSincronizacaoCFOP,
    totalImportadosAdicionais: totalCFOPsImportadosAdicionais,
    versaoTabela: 'Tabela Oficial CFOP (Ajuste SINIEF 07/05 e MOC NF-e v7.0 SEFAZ 2026)',
  };
}
