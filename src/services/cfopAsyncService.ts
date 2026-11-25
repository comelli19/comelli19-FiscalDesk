import { CFOP } from '../types/fiscal';
import { INITIAL_CFOPS } from '../data/cfops';
import { resolverCFOPUniversal } from './cfopCatalogService';
import { getAuthHeaders } from './apiClient';
import {
  clearFiscalCache,
  getCachedQuery,
  getCacheMeta,
  getCFOPRecord,
  invalidateQueryNamespace,
  putCFOPRecords,
  searchCachedCFOPRecords,
  setCachedQuery,
  setCacheMeta,
} from './fiscalIndexedDBCache';

export interface ParametrosBuscaCFOPRemota {
  q?: string;
  tipo?: 'todos' | 'entrada' | 'saida';
  abrangencia?: 'todos' | 'estadual' | 'interestadual' | 'exterior';
  grupo?: string;
  apenasFavoritos?: boolean;
  page?: number;
  limit?: number;
}

export interface RespostaBuscaCFOPRemota {
  data: CFOP[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  gruposDisponiveis: string[];
  ultimaSincronizacao: string;
  fonte: string;
}

export interface StatusCatalogoCFOP {
  totalRegistros: number;
  totalEntradas: number;
  totalSaidas: number;
  ultimaSincronizacao: string;
  totalImportadosAdicionais: number;
  versaoTabela: string;
}

// L1: Cache LRU enxuto em RAM (máx. 40 consultas) para evitar acúmulo de memória
const L1_MAX_ENTRIES = 40;
const L1_TTL_MS = 2 * 60 * 1000; // 2 minutos
const IDB_QUERY_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas em IndexedDB
const IDB_RECORD_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas por registro CFOP
const IDB_STATUS_TTL_MS = 60 * 60 * 1000; // 1 hora para metadados de status

const l1QueryCache = new Map<string, { timestamp: number; dados: RespostaBuscaCFOPRemota }>();
const inFlightQueries = new Map<string, Promise<RespostaBuscaCFOPRemota>>();
let inFlightStatus: Promise<StatusCatalogoCFOP | null> | null = null;
let cfopSeededInIDB = false;

function setL1Query(key: string, dados: RespostaBuscaCFOPRemota): void {
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

function getL1Query(key: string): RespostaBuscaCFOPRemota | null {
  const cached = l1QueryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > L1_TTL_MS) {
    l1QueryCache.delete(key);
    return null;
  }
  l1QueryCache.delete(key);
  l1QueryCache.set(key, cached);
  return cached.dados;
}

/**
 * Busca assíncrona de CFOPs com cache em 3 camadas:
 * L1 (LRU RAM) → L2 (IndexedDB persistente) → L3 (API Remota SINIEF)
 */
export async function buscarCFOPsRemoto(
  params: ParametrosBuscaCFOPRemota
): Promise<RespostaBuscaCFOPRemota> {
  const queryParams = new URLSearchParams();

  if (params.q) queryParams.set('q', params.q);
  if (params.tipo && params.tipo !== 'todos') queryParams.set('tipo', params.tipo);
  if (params.abrangencia && params.abrangencia !== 'todos') {
    queryParams.set('abrangencia', params.abrangencia);
  }
  if (params.grupo && params.grupo !== 'todos') queryParams.set('grupo', params.grupo);
  if (params.apenasFavoritos) queryParams.set('apenasFavoritos', 'true');
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));

  const cacheKey = queryParams.toString();

  // 1. L1 RAM LRU
  const l1Hit = getL1Query(cacheKey);
  if (l1Hit) return l1Hit;

  // Deduplicação de chamadas concorrentes
  const existingFlight = inFlightQueries.get(cacheKey);
  if (existingFlight) return existingFlight;

  const task = (async (): Promise<RespostaBuscaCFOPRemota> => {
    // 2. L2 IndexedDB persistente
    const idbHit = await getCachedQuery<RespostaBuscaCFOPRemota>('cfop', cacheKey, IDB_QUERY_TTL_MS);
    if (idbHit && Array.isArray(idbHit.data)) {
      setL1Query(cacheKey, idbHit);
      return idbHit;
    }

    // 3. L3 API remota (/api/cfops)
    try {
      const res = await fetch(`/api/cfops?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Erro na API de CFOPs: status ${res.status}`);
      }

      const json = await res.json();

      if (json.data && Array.isArray(json.data) && typeof json.total === 'number') {
        const resultado: RespostaBuscaCFOPRemota = json;
        setL1Query(cacheKey, resultado);
        void setCachedQuery('cfop', cacheKey, resultado);
        if (resultado.data.length > 0) {
          void putCFOPRecords(resultado.data);
        }
        return resultado;
      }

      const lista: CFOP[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : INITIAL_CFOPS;

      const limit = params.limit || 40;
      const resultadoLegado: RespostaBuscaCFOPRemota = {
        data: lista.slice(0, limit),
        total: lista.length,
        page: params.page || 1,
        limit,
        totalPages: Math.ceil(lista.length / limit) || 1,
        gruposDisponiveis: ['todos', '1xxx_5xxx', '2xxx_6xxx', '3xxx_7xxx', '1xxx', '5xxx'],
        ultimaSincronizacao: new Date().toISOString(),
        fonte: 'Tabela Oficial CFOP',
      };
      setL1Query(cacheKey, resultadoLegado);
      void setCachedQuery('cfop', cacheKey, resultadoLegado);
      return resultadoLegado;
    } catch {
      const limit = params.limit || 40;
      const page = params.page || 1;

      // Contingência 1: cursor direto no IndexedDB
      const cachedOffline = await searchCachedCFOPRecords({
        q: params.q,
        tipo: params.tipo,
        abrangencia: params.abrangencia,
        grupo: params.grupo,
        apenasFavoritos: params.apenasFavoritos,
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
          gruposDisponiveis: ['todos', '1xxx_5xxx', '2xxx_6xxx', '3xxx_7xxx'],
          ultimaSincronizacao: new Date().toISOString(),
          fonte: 'Cache Local IndexedDB (Modo Offline)',
        };
      }

      // Contingência 2: base oficial local (620 CFOPs) + persistência em segundo plano
      if (!cfopSeededInIDB) {
        cfopSeededInIDB = true;
        void putCFOPRecords(INITIAL_CFOPS);
      }

      const qLower = (params.q || '').toLowerCase();
      const qDigits = (params.q || '').replace(/\D/g, '');

      const filtrados = INITIAL_CFOPS.filter((c) => {
        if (params.tipo && params.tipo !== 'todos' && c.tipo !== params.tipo) return false;
        if (params.abrangencia && params.abrangencia !== 'todos' && c.abrangencia !== params.abrangencia) {
          return false;
        }
        if (params.grupo && params.grupo !== 'todos') {
          if (params.grupo === '1xxx_5xxx') {
            if (c.grupo !== '1xxx' && c.grupo !== '5xxx') return false;
          } else if (params.grupo === '2xxx_6xxx') {
            if (c.grupo !== '2xxx' && c.grupo !== '6xxx') return false;
          } else if (params.grupo === '3xxx_7xxx') {
            if (c.grupo !== '3xxx' && c.grupo !== '7xxx') return false;
          } else if (c.grupo !== params.grupo) {
            return false;
          }
        }
        if (params.apenasFavoritos && !c.favorito) return false;
        if (!qLower) return true;

        const codeDigits = c.codigo.replace(/\D/g, '');
        return (
          (qDigits.length > 0 && codeDigits.includes(qDigits)) ||
          c.codigo.toLowerCase().includes(qLower) ||
          c.descricao.toLowerCase().includes(qLower) ||
          c.quandoUsar.toLowerCase().includes(qLower)
        );
      });

      if (qDigits.length === 4 && !filtrados.some((c) => c.codigo.replace(/\D/g, '') === qDigits)) {
        filtrados.unshift(resolverCFOPUniversal(qDigits));
      }

      const inicio = (page - 1) * limit;

      return {
        data: filtrados.slice(inicio, inicio + limit),
        total: filtrados.length,
        page,
        limit,
        totalPages: Math.ceil(filtrados.length / limit) || 1,
        gruposDisponiveis: ['todos', '1xxx_5xxx', '2xxx_6xxx', '3xxx_7xxx'],
        ultimaSincronizacao: new Date().toISOString(),
        fonte: 'Motor Determinístico Local CFOP (Modo de Contingência)',
      };
    }
  })().finally(() => {
    inFlightQueries.delete(cacheKey);
  });

  inFlightQueries.set(cacheKey, task);
  return task;
}

/**
 * Consulta um CFOP específico pelo código (verifica IndexedDB em O(1) antes da rede)
 */
export async function obterCFOPPorCodigoRemoto(codigo: string): Promise<CFOP | null> {
  const limpo = codigo.replace(/\D/g, '');
  const cachedRecord = await getCFOPRecord(limpo, IDB_RECORD_TTL_MS);
  if (cachedRecord) return cachedRecord;

  try {
    const res = await fetch(`/api/cfops/${encodeURIComponent(limpo)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const cfop: CFOP | null = json.data || json || null;
    if (cfop) {
      void putCFOPRecords([cfop]);
    }
    return cfop;
  } catch {
    return resolverCFOPUniversal(limpo);
  }
}

/**
 * Importa lote de CFOPs via JSON ou CSV e invalida o cache local
 */
export async function importarCFOPsRemoto(
  itens: any[]
): Promise<{ sucesso: boolean; importados: number; atualizados: number; totalAtual: number }> {
  const res = await fetch('/api/cfops/importar', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ itens }),
  });

  if (!res.ok) {
    throw new Error('Falha ao importar CFOPs no servidor');
  }

  l1QueryCache.clear();
  await invalidateQueryNamespace('cfop');
  return res.json();
}

/**
 * Sincroniza catálogo com as tabelas da SEFAZ / SINIEF e atualiza o IndexedDB
 */
export async function sincronizarCFOPs(): Promise<{
  sucesso: boolean;
  mensagem: string;
  status: StatusCatalogoCFOP;
}> {
  const res = await fetch('/api/cfops/sincronizar', {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Falha ao sincronizar CFOPs');
  }

  const data = await res.json();
  l1QueryCache.clear();
  await invalidateQueryNamespace('cfop');
  if (data?.status) {
    await setCacheMeta('cfop_status', data.status);
  }
  return data;
}

/**
 * Consulta o status da base remota de CFOPs (com cache IndexedDB de 1h e deduplicação)
 */
export async function obterStatusCFOPRemoto(
  forcarRede = false
): Promise<StatusCatalogoCFOP | null> {
  if (!forcarRede) {
    const cachedMeta = await getCacheMeta<StatusCatalogoCFOP>('cfop_status', IDB_STATUS_TTL_MS);
    if (cachedMeta) return cachedMeta;
  }

  if (inFlightStatus) return inFlightStatus;

  inFlightStatus = (async () => {
    try {
      const res = await fetch('/api/cfops/status');
      if (!res.ok) return null;
      const status: StatusCatalogoCFOP = await res.json();
      void setCacheMeta('cfop_status', status);
      return status;
    } catch {
      return await getCacheMeta<StatusCatalogoCFOP>('cfop_status');
    }
  })().finally(() => {
    inFlightStatus = null;
  });

  return inFlightStatus;
}

/**
 * Limpa integralmente o cache local (RAM + IndexedDB) de CFOPs
 */
export async function limparCacheLocalCFOP(): Promise<void> {
  l1QueryCache.clear();
  await clearFiscalCache('cfop');
}
