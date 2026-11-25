import { NCMInfo } from '../types/fiscal';
import { INITIAL_NCMS } from '../data/ncms';
import { resolverNCMUniversal } from './ncmCatalogoUniversal';
import {
  clearFiscalCache,
  getCachedQuery,
  getCacheMeta,
  getNCMRecord,
  invalidateQueryNamespace,
  putNCMRecords,
  searchCachedNCMRecords,
  setCachedQuery,
  setCacheMeta,
} from './fiscalIndexedDBCache';
import {
  iniciarHidratacaoPreguicosaNCM,
  isNCMCatalogoLocalCompleto,
  obterFiltrosCatalogoNCMMeta,
  resetarProgressoHidratacaoNCM,
  salvarFiltrosCatalogoNCMMeta,
} from './ncmLazyCacheHydrator';

export interface ParametrosBuscaNCMRemota {
  q?: string;
  capitulo?: string;
  setor?: string;
  onlyST?: boolean;
  onlyMonofasico?: boolean;
  page?: number;
  limit?: number;
}

export interface RespostaBuscaNCMRemota {
  data: NCMInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  capitulosDisponiveis: { capitulo: string; titulo: string }[];
  setoresDisponiveis: string[];
  ultimaSincronizacao: string;
  fonte: string;
}

export interface StatusCatalogoTIPI {
  totalRegistros: number;
  totalCurados?: number;
  totalCapitulos: number;
  ultimaSincronizacao: string;
  totalImportadosAdicionais: number;
  versaoTIPI: string;
  fonteAtiva?: 'siscomex' | 'brasilapi' | 'local';
  atoLegal?: string;
  dataVigencia?: string;
}

// L1: Cache LRU enxuto em RAM (máx. 40 consultas) para evitar acúmulo de memória
const L1_MAX_ENTRIES = 40;
const L1_TTL_MS = 2 * 60 * 1000; // 2 minutos
const IDB_QUERY_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas em IndexedDB
const IDB_RECORD_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas por registro NCM
const IDB_STATUS_TTL_MS = 60 * 60 * 1000; // 1 hora para metadados de status

const l1QueryCache = new Map<string, { timestamp: number; dados: RespostaBuscaNCMRemota }>();
const inFlightQueries = new Map<string, Promise<RespostaBuscaNCMRemota>>();
let inFlightStatus: Promise<StatusCatalogoTIPI | null> | null = null;

function setL1Query(key: string, dados: RespostaBuscaNCMRemota): void {
  if (l1QueryCache.has(key)) {
    l1QueryCache.delete(key);
  }
  l1QueryCache.set(key, { timestamp: Date.now(), dados });
  while (l1QueryCache.size > L1_MAX_ENTRIES) {
    const oldestKey = l1QueryCache.keys().next().value;
    if (oldestKey !== undefined) l1QueryCache.delete(oldestKey);
    else break;
  }
}

function getL1Query(key: string): RespostaBuscaNCMRemota | null {
  const cached = l1QueryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > L1_TTL_MS) {
    l1QueryCache.delete(key);
    return null;
  }
  // Atualiza posição LRU
  l1QueryCache.delete(key);
  l1QueryCache.set(key, cached);
  return cached.dados;
}

/**
 * Realiza a busca assíncrona de NCMs com cache em 3 camadas:
 * L1 (LRU RAM) → L2 (IndexedDB persistente) → L3 (API Remota / Siscomex)
 */
export async function buscarNCMsRemoto(
  params: ParametrosBuscaNCMRemota
): Promise<RespostaBuscaNCMRemota> {
  const queryParams = new URLSearchParams();

  if (params.q) queryParams.set('q', params.q);
  if (params.capitulo && params.capitulo !== 'todos') queryParams.set('capitulo', params.capitulo);
  if (params.setor && params.setor !== 'todos') queryParams.set('setor', params.setor);
  if (params.onlyST) queryParams.set('onlyST', 'true');
  if (params.onlyMonofasico) queryParams.set('onlyMonofasico', 'true');
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));

  const cacheKey = queryParams.toString();

  // 1. L1 RAM LRU (instantâneo)
  const l1Hit = getL1Query(cacheKey);
  if (l1Hit) return l1Hit;

  // Deduplicação de chamadas concorrentes idênticas
  const existingFlight = inFlightQueries.get(cacheKey);
  if (existingFlight) return existingFlight;

  const task = (async (): Promise<RespostaBuscaNCMRemota> => {
    // 2. L2 IndexedDB query_cache (página exata já consultada)
    const idbHit = await getCachedQuery<RespostaBuscaNCMRemota>('ncm', cacheKey, IDB_QUERY_TTL_MS);
    if (idbHit && Array.isArray(idbHit.data)) {
      setL1Query(cacheKey, idbHit);
      return idbHit;
    }

    // 2.5. L2 IndexedDB Completo: se os ~10.516 NCMs já foram hidratados em disco via lazy-loading,
    // executa filtros + paginação 100% localmente via cursor indexado (ZERO requisições HTTP!)
    const catalogoLocalPronto = await isNCMCatalogoLocalCompleto();
    if (catalogoLocalPronto) {
      const limit = params.limit || 50;
      const page = params.page || 1;
      const [localSearch, filtrosMeta] = await Promise.all([
        searchCachedNCMRecords({
          q: params.q,
          capitulo: params.capitulo,
          setor: params.setor,
          onlyST: params.onlyST,
          onlyMonofasico: params.onlyMonofasico,
          page,
          limit,
        }),
        obterFiltrosCatalogoNCMMeta(),
      ]);

      const qDigitos = (params.q || '').replace(/\D/g, '');
      const dataLocal = [...localSearch.data];
      let totalLocal = localSearch.total;
      if (qDigitos.length >= 4 && totalLocal === 0) {
        dataLocal.unshift(resolverNCMUniversal(qDigitos.padEnd(8, '0')));
        totalLocal = 1;
      }

      const resultadoLocal: RespostaBuscaNCMRemota = {
        data: dataLocal,
        total: totalLocal,
        page,
        limit,
        totalPages: Math.ceil(totalLocal / limit) || 1,
        capitulosDisponiveis: filtrosMeta?.capitulosDisponiveis || [],
        setoresDisponiveis: filtrosMeta?.setoresDisponiveis || [],
        ultimaSincronizacao: filtrosMeta?.ultimaSincronizacao || new Date().toISOString(),
        fonte: `${filtrosMeta?.fonte || 'Catálogo Oficial NCM'} · Cache Local IndexedDB`,
      };

      setL1Query(cacheKey, resultadoLocal);
      return resultadoLocal;
    }

    // 3. L3 API remota (/api/ncms)
    try {
      const res = await fetch(`/api/ncms?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Erro na API de NCMs: status ${res.status}`);
      }

      const resultado: RespostaBuscaNCMRemota = await res.json();
      setL1Query(cacheKey, resultado);

      // Persiste página, metadados de filtros e registros individuais no IndexedDB em segundo plano
      void setCachedQuery('ncm', cacheKey, resultado);
      if (Array.isArray(resultado.capitulosDisponiveis) && resultado.capitulosDisponiveis.length > 0) {
        void salvarFiltrosCatalogoNCMMeta({
          capitulosDisponiveis: resultado.capitulosDisponiveis,
          setoresDisponiveis: resultado.setoresDisponiveis || [],
          ultimaSincronizacao: resultado.ultimaSincronizacao,
          fonte: resultado.fonte,
        });
      }
      if (Array.isArray(resultado.data) && resultado.data.length > 0) {
        void putNCMRecords(resultado.data);
      }

      return resultado;
    } catch {
      // Contingência 1: cursor direto no IndexedDB (pesquisa offline nos registros já persistidos)
      const limit = params.limit || 50;
      const page = params.page || 1;
      const cachedOffline = await searchCachedNCMRecords({
        q: params.q,
        capitulo: params.capitulo,
        setor: params.setor,
        onlyST: params.onlyST,
        onlyMonofasico: params.onlyMonofasico,
        page,
        limit,
      });

      if (cachedOffline.total > 0) {
        return {
          data: cachedOffline.data,
          total: cachedOffline.total,
          page,
          limit,
          totalPages: Math.ceil(cachedOffline.total / limit) || 1,
          capitulosDisponiveis: [],
          setoresDisponiveis: [],
          ultimaSincronizacao: new Date().toISOString(),
          fonte: 'Cache Local IndexedDB (Modo Offline)',
        };
      }

      // Contingência 2: base curada local + motor determinístico TIPI
      const qLower = (params.q || '').toLowerCase();
      const qDigitos = (params.q || '').replace(/\D/g, '');

      const filtrados = INITIAL_NCMS.filter((n) => {
        if (params.capitulo && params.capitulo !== 'todos') {
          const capNcm = n.codigo.replace(/\D/g, '').slice(0, 2);
          if (capNcm !== params.capitulo) return false;
        }
        if (params.setor && params.setor !== 'todos' && n.setor !== params.setor) return false;
        if (params.onlyST && !n.temST) return false;
        if (params.onlyMonofasico && n.regimePISCOFINS !== 'monofasico') return false;
        if (!qLower) return true;

        const codeDigits = n.codigo.replace(/\D/g, '');
        return (
          (qDigitos.length > 0 && codeDigits.includes(qDigitos)) ||
          n.codigo.toLowerCase().includes(qLower) ||
          n.descricao.toLowerCase().includes(qLower)
        );
      });

      if (qDigitos.length >= 4 && !filtrados.some((n) => n.codigo.replace(/\D/g, '').startsWith(qDigitos))) {
        filtrados.unshift(resolverNCMUniversal(qDigitos.padEnd(8, '0')));
      }

      const inicio = (page - 1) * limit;

      return {
        data: filtrados.slice(inicio, inicio + limit),
        total: filtrados.length,
        page,
        limit,
        totalPages: Math.ceil(filtrados.length / limit) || 1,
        capitulosDisponiveis: [],
        setoresDisponiveis: [],
        ultimaSincronizacao: new Date().toISOString(),
        fonte: 'Motor Determinístico Local TIPI (Modo de Contingência)',
      };
    }
  })().finally(() => {
    inFlightQueries.delete(cacheKey);
  });

  inFlightQueries.set(cacheKey, task);
  return task;
}

/**
 * Consulta um NCM específico (verifica IndexedDB em O(1) antes de acionar a rede)
 */
export async function obterNCMPorCodigoRemoto(codigo: string): Promise<NCMInfo | null> {
  const cachedRecord = await getNCMRecord(codigo, IDB_RECORD_TTL_MS);
  if (cachedRecord) return cachedRecord;

  try {
    const res = await fetch(`/api/ncms/${encodeURIComponent(codigo)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const ncm: NCMInfo | null = json.data || null;
    if (ncm) {
      void putNCMRecords([ncm]);
    }
    return ncm;
  } catch {
    return resolverNCMUniversal(codigo);
  }
}

/**
 * Importa um arquivo JSON ou CSV contendo catálogo da TIPI e invalida o cache local
 */
export async function importarCatalogoTIPIRemoto(
  itens: any[]
): Promise<{ sucesso: boolean; importados: number; atualizados: number; totalAtual: number }> {
  const res = await fetch('/api/ncms/importar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itens }),
  });

  if (!res.ok) {
    throw new Error('Falha ao importar registros no catálogo TIPI');
  }

  l1QueryCache.clear();
  resetarProgressoHidratacaoNCM();
  await invalidateQueryNamespace('ncm');
  return res.json();
}

/**
 * Dispara uma sincronização remota com a tabela oficial vigente (Siscomex / BrasilAPI)
 * e atualiza o cache persistente IndexedDB de forma paginada em segundo plano.
 */
export async function sincronizarCatalogoTIPI(): Promise<{
  sucesso: boolean;
  mensagem: string;
  status: StatusCatalogoTIPI;
}> {
  const res = await fetch('/api/ncms/sincronizar', {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Falha ao sincronizar com a Receita Federal');
  }

  const data = await res.json();
  l1QueryCache.clear();
  resetarProgressoHidratacaoNCM();
  await clearFiscalCache('ncm');
  if (data?.status) {
    await setCacheMeta('ncm_status', data.status);
  }
  void iniciarHidratacaoPreguicosaNCM({ forcar: true, atrasoInicialMs: 400 });
  return data;
}

/**
 * Obtém o status da base de NCMs (com cache IndexedDB de 1h e deduplicação)
 */
export async function obterStatusCatalogoRemoto(
  forcarRede = false
): Promise<StatusCatalogoTIPI | null> {
  if (!forcarRede) {
    const cachedMeta = await getCacheMeta<StatusCatalogoTIPI>('ncm_status', IDB_STATUS_TTL_MS);
    if (cachedMeta) return cachedMeta;
  }

  if (inFlightStatus) return inFlightStatus;

  inFlightStatus = (async () => {
    try {
      const res = await fetch('/api/ncms/status');
      if (!res.ok) return null;
      const status: StatusCatalogoTIPI = await res.json();
      void setCacheMeta('ncm_status', status);
      return status;
    } catch {
      return await getCacheMeta<StatusCatalogoTIPI>('ncm_status');
    }
  })().finally(() => {
    inFlightStatus = null;
  });

  return inFlightStatus;
}

/**
 * Limpa integralmente o cache local (RAM + IndexedDB) de NCMs
 */
export async function limparCacheLocalNCM(): Promise<void> {
  l1QueryCache.clear();
  resetarProgressoHidratacaoNCM();
  await clearFiscalCache('ncm');
}
