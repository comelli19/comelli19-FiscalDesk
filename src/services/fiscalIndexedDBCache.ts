import { CFOP, NCMInfo } from '../types/fiscal';

/**
 * Camada de Persistência e Cache Local em IndexedDB (NCM & CFOP)
 *
 * Projetada para armazenar milhares de registros (~10.516 NCMs + 620+ CFOPs)
 * em disco de forma 100% assíncrona (sem travar a thread principal nem inflar a RAM),
 * com índices nativos, TTL por namespace, poda LRU automática e fallback silencioso
 * caso o navegador esteja em modo restrito/privado sem IndexedDB.
 */

const DB_NAME = 'fiscaldesk_cache_v1';
const DB_VERSION = 1;

const STORE_NCM = 'ncm_records';
const STORE_CFOP = 'cfop_records';
const STORE_QUERIES = 'query_cache';
const STORE_META = 'meta';

const MAX_CACHED_QUERIES = 160;
const MAX_NCM_RECORDS = 15000;

export type CacheNamespace = 'ncm' | 'cfop';

interface StoredNCMRecord {
  cleanCode: string;
  cap: string;
  updatedAt: number;
  searchText?: string;
  data: NCMInfo;
}

interface StoredCFOPRecord {
  cleanCode: string;
  tipo: string;
  grupo: string;
  updatedAt: number;
  data: CFOP;
}

interface StoredQueryEntry<T = unknown> {
  cacheKey: string;
  namespace: CacheNamespace;
  savedAt: number;
  data: T;
}

interface StoredMetaEntry<T = unknown> {
  key: string;
  savedAt: number;
  value: T;
}

export interface CFOPUserPrefs {
  favorito?: boolean;
  anotacoes?: string;
}

export interface FiscalCacheStats {
  available: boolean;
  ncmCount: number;
  cfopCount: number;
  queryCount: number;
  lastNcmSync?: string;
  lastCfopSync?: string;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

export function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(STORE_NCM)) {
          const ncmStore = db.createObjectStore(STORE_NCM, { keyPath: 'cleanCode' });
          ncmStore.createIndex('by_cap', 'cap', { unique: false });
          ncmStore.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_CFOP)) {
          const cfopStore = db.createObjectStore(STORE_CFOP, { keyPath: 'cleanCode' });
          cfopStore.createIndex('by_tipo', 'tipo', { unique: false });
          cfopStore.createIndex('by_grupo', 'grupo', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_QUERIES)) {
          const queryStore = db.createObjectStore(STORE_QUERIES, { keyPath: 'cacheKey' });
          queryStore.createIndex('by_namespace', 'namespace', { unique: false });
          queryStore.createIndex('by_savedAt', 'savedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

function normalizarTexto(texto: string): string {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// ==========================================
// 1. Cache de Consultas Paginadas (query_cache)
// ==========================================

export async function getCachedQuery<T>(
  namespace: CacheNamespace,
  key: string,
  ttlMs: number
): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  const fullKey = `${namespace}:${key}`;

  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction(STORE_QUERIES, 'readonly');
      const store = tx.objectStore(STORE_QUERIES);
      const req = store.get(fullKey);

      req.onsuccess = () => {
        const entry = req.result as StoredQueryEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (Date.now() - entry.savedAt > ttlMs) {
          resolve(null);
          return;
        }
        resolve(entry.data);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setCachedQuery<T>(
  namespace: CacheNamespace,
  key: string,
  data: T
): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  const fullKey = `${namespace}:${key}`;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_QUERIES, 'readwrite');
      const store = tx.objectStore(STORE_QUERIES);
      const entry: StoredQueryEntry<T> = {
        cacheKey: fullKey,
        namespace,
        savedAt: Date.now(),
        data,
      };
      store.put(entry);

      // Poda LRU leve se o cache de queries ultrapassar o limite
      const countReq = store.count();
      countReq.onsuccess = () => {
        const excesso = countReq.result - MAX_CACHED_QUERIES;
        if (excesso > 0) {
          const idx = store.index('by_savedAt');
          let removidos = 0;
          const cursorReq = idx.openCursor();
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor && removidos < excesso) {
              cursor.delete();
              removidos++;
              cursor.continue();
            }
          };
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function invalidateQueryNamespace(namespace: CacheNamespace): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_QUERIES, 'readwrite');
      const store = tx.objectStore(STORE_QUERIES);
      const idx = store.index('by_namespace');
      const range = IDBKeyRange.only(namespace);
      const cursorReq = idx.openCursor(range);

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

// ==========================================
// 2. Persistência Individual de Registros NCM
// ==========================================

function yieldToMainThread(timeoutMs = 80): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(() => resolve(), { timeout: timeoutMs });
    } else {
      setTimeout(resolve, 16);
    }
  });
}

function buildNCMSearchText(ncm: NCMInfo, cleanCode: string): string {
  return normalizarTexto(
    `${ncm.codigo} ${cleanCode} ${ncm.descricao} ${ncm.setor || ''} ${ncm.capitulo || ''} ${ncm.cestPadrao || ''}`
  );
}

export async function putNCMRecords(records: NCMInfo[]): Promise<void> {
  if (!Array.isArray(records) || records.length === 0) return;
  const db = await openDatabase();
  if (!db) return;

  const now = Date.now();

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NCM, 'readwrite');
      const store = tx.objectStore(STORE_NCM);

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        const cleanCode = (rec.codigo || '').replace(/\D/g, '');
        if (cleanCode.length < 4) continue;
        const item: StoredNCMRecord = {
          cleanCode,
          cap: cleanCode.substring(0, 2),
          updatedAt: now,
          searchText: buildNCMSearchText(rec, cleanCode),
          data: rec,
        };
        store.put(item);
      }

      // Garante limite máximo saudável no disco
      const countReq = store.count();
      countReq.onsuccess = () => {
        const excesso = countReq.result - MAX_NCM_RECORDS;
        if (excesso > 0) {
          const idx = store.index('by_updatedAt');
          let removidos = 0;
          const cursorReq = idx.openCursor();
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor && removidos < excesso) {
              cursor.delete();
              removidos++;
              cursor.continue();
            }
          };
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Grava lotes grandes de NCM no IndexedDB em micro-transações assíncronas,
 * cedendo o controle para a thread principal entre cada bloco (zero travamento de UI).
 */
export async function putNCMRecordsChunked(
  records: NCMInfo[],
  chunkSize = 150,
  shouldPause?: () => boolean
): Promise<number> {
  if (!Array.isArray(records) || records.length === 0) return 0;
  let gravados = 0;
  const safeChunk = Math.max(25, Math.min(250, chunkSize));

  for (let offset = 0; offset < records.length; offset += safeChunk) {
    if (shouldPause && shouldPause()) {
      break;
    }
    const slice = records.slice(offset, offset + safeChunk);
    await putNCMRecords(slice);
    gravados += slice.length;

    if (offset + safeChunk < records.length) {
      await yieldToMainThread(60);
    }
  }

  return gravados;
}

export async function getNCMRecord(codigo: string, maxAgeMs?: number): Promise<NCMInfo | null> {
  const cleanCode = (codigo || '').replace(/\D/g, '');
  if (!cleanCode) return null;

  const db = await openDatabase();
  if (!db) return null;

  return new Promise<NCMInfo | null>((resolve) => {
    try {
      const tx = db.transaction(STORE_NCM, 'readonly');
      const store = tx.objectStore(STORE_NCM);
      const req = store.get(cleanCode);

      req.onsuccess = () => {
        const rec = req.result as StoredNCMRecord | undefined;
        if (!rec) {
          resolve(null);
          return;
        }
        if (maxAgeMs && Date.now() - rec.updatedAt > maxAgeMs) {
          resolve(null);
          return;
        }
        resolve(rec.data);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Busca paginada via cursor direto no IndexedDB (sem carregar todos os registros na RAM)
 * Utilizada como contingência offline rica quando o servidor não responde.
 */
export async function searchCachedNCMRecords(params: {
  q?: string;
  capitulo?: string;
  setor?: string;
  onlyST?: boolean;
  onlyMonofasico?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: NCMInfo[]; total: number }> {
  const db = await openDatabase();
  if (!db) return { data: [], total: 0 };

  const qNorm = normalizarTexto((params.q || '').trim());
  const tokens = qNorm ? qNorm.split(/\s+/).filter(Boolean) : [];
  const qDigits = (params.q || '').replace(/\D/g, '');
  const capFilter =
    params.capitulo && params.capitulo !== 'todos'
      ? params.capitulo.replace(/\D/g, '')
      : '';
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(200, params.limit || 50));
  const inicio = (page - 1) * limit;
  const fim = inicio + limit;

  return new Promise<{ data: NCMInfo[]; total: number }>((resolve) => {
    try {
      const tx = db.transaction(STORE_NCM, 'readonly');
      const store = tx.objectStore(STORE_NCM);

      const cursorReq = capFilter
        ? store.index('by_cap').openCursor(IDBKeyRange.only(capFilter))
        : store.openCursor();

      const pageItems: NCMInfo[] = [];
      let total = 0;

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve({ data: pageItems, total });
          return;
        }

        const rec = cursor.value as StoredNCMRecord;
        const ncm = rec.data;

        let match = true;
        if (params.setor && params.setor !== 'todos' && ncm.setor !== params.setor) {
          match = false;
        }
        if (match && params.onlyST && !ncm.temST) {
          match = false;
        }
        if (match && params.onlyMonofasico && ncm.regimePISCOFINS !== 'monofasico') {
          match = false;
        }
        if (match && qNorm) {
          const matchCodigo = qDigits.length > 0 && rec.cleanCode.includes(qDigits);
          if (!matchCodigo) {
            const haystack =
              rec.searchText ||
              buildNCMSearchText(ncm, rec.cleanCode);
            for (let t = 0; t < tokens.length; t++) {
              if (!haystack.includes(tokens[t])) {
                match = false;
                break;
              }
            }
          }
        }

        if (match) {
          if (total >= inicio && total < fim) {
            pageItems.push(ncm);
          }
          total++;
        }

        cursor.continue();
      };

      cursorReq.onerror = () => resolve({ data: [], total: 0 });
    } catch {
      resolve({ data: [], total: 0 });
    }
  });
}

// ==========================================
// 3. Persistência Individual de Registros CFOP
// ==========================================

export async function putCFOPRecords(records: CFOP[]): Promise<void> {
  if (!Array.isArray(records) || records.length === 0) return;
  const db = await openDatabase();
  if (!db) return;

  const now = Date.now();

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_CFOP, 'readwrite');
      const store = tx.objectStore(STORE_CFOP);

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        const cleanCode = (rec.codigo || '').replace(/\D/g, '');
        if (cleanCode.length < 4) continue;
        const item: StoredCFOPRecord = {
          cleanCode,
          tipo: rec.tipo,
          grupo: rec.grupo,
          updatedAt: now,
          data: rec,
        };
        store.put(item);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getCFOPRecord(codigo: string, maxAgeMs?: number): Promise<CFOP | null> {
  const cleanCode = (codigo || '').replace(/\D/g, '');
  if (!cleanCode) return null;

  const db = await openDatabase();
  if (!db) return null;

  return new Promise<CFOP | null>((resolve) => {
    try {
      const tx = db.transaction(STORE_CFOP, 'readonly');
      const store = tx.objectStore(STORE_CFOP);
      const req = store.get(cleanCode);

      req.onsuccess = () => {
        const rec = req.result as StoredCFOPRecord | undefined;
        if (!rec) {
          resolve(null);
          return;
        }
        if (maxAgeMs && Date.now() - rec.updatedAt > maxAgeMs) {
          resolve(null);
          return;
        }
        resolve(rec.data);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function searchCachedCFOPRecords(params: {
  q?: string;
  tipo?: 'todos' | 'entrada' | 'saida';
  abrangencia?: 'todos' | 'estadual' | 'interestadual' | 'exterior';
  grupo?: string;
  apenasFavoritos?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: CFOP[]; total: number }> {
  const db = await openDatabase();
  if (!db) return { data: [], total: 0 };

  const qNorm = normalizarTexto((params.q || '').trim());
  const qDigits = (params.q || '').replace(/\D/g, '');
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(200, params.limit || 40));
  const inicio = (page - 1) * limit;
  const fim = inicio + limit;

  return new Promise<{ data: CFOP[]; total: number }>((resolve) => {
    try {
      const tx = db.transaction(STORE_CFOP, 'readonly');
      const store = tx.objectStore(STORE_CFOP);

      const cursorReq =
        params.tipo && params.tipo !== 'todos'
          ? store.index('by_tipo').openCursor(IDBKeyRange.only(params.tipo))
          : store.openCursor();

      const pageItems: CFOP[] = [];
      let total = 0;

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve({ data: pageItems, total });
          return;
        }

        const rec = cursor.value as StoredCFOPRecord;
        const cfop = rec.data;

        let match = true;
        if (params.abrangencia && params.abrangencia !== 'todos' && cfop.abrangencia !== params.abrangencia) {
          match = false;
        }
        if (match && params.grupo && params.grupo !== 'todos') {
          if (params.grupo === '1xxx_5xxx') {
            match = cfop.grupo === '1xxx' || cfop.grupo === '5xxx';
          } else if (params.grupo === '2xxx_6xxx') {
            match = cfop.grupo === '2xxx' || cfop.grupo === '6xxx';
          } else if (params.grupo === '3xxx_7xxx') {
            match = cfop.grupo === '3xxx' || cfop.grupo === '7xxx';
          } else {
            match = cfop.grupo === params.grupo;
          }
        }
        if (match && params.apenasFavoritos && !cfop.favorito) {
          match = false;
        }
        if (match && qNorm) {
          const matchCod = qDigits.length > 0 && rec.cleanCode.includes(qDigits);
          if (!matchCod) {
            const haystack = normalizarTexto(`${cfop.codigo} ${cfop.descricao} ${cfop.quandoUsar}`);
            match = haystack.includes(qNorm);
          }
        }

        if (match) {
          if (total >= inicio && total < fim) {
            pageItems.push(cfop);
          }
          total++;
        }

        cursor.continue();
      };

      cursorReq.onerror = () => resolve({ data: [], total: 0 });
    } catch {
      resolve({ data: [], total: 0 });
    }
  });
}

// ==========================================
// 4. Metadados, Preferências CFOP e Gestão do Cache
// ==========================================

export async function getCacheMeta<T>(key: string, ttlMs?: number): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const req = store.get(key);

      req.onsuccess = () => {
        const entry = req.result as StoredMetaEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (ttlMs && Date.now() - entry.savedAt > ttlMs) {
          resolve(null);
          return;
        }
        resolve(entry.value);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setCacheMeta<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readwrite');
      const store = tx.objectStore(STORE_META);
      const entry: StoredMetaEntry<T> = { key, savedAt: Date.now(), value };
      store.put(entry);

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getCFOPUserPrefsMap(): Promise<Record<string, CFOPUserPrefs>> {
  const saved = await getCacheMeta<Record<string, CFOPUserPrefs>>('cfop_user_prefs');
  return saved && typeof saved === 'object' ? saved : {};
}

export async function saveCFOPUserPref(
  cfopId: string,
  patch: CFOPUserPrefs
): Promise<void> {
  const current = await getCFOPUserPrefsMap();
  current[cfopId] = { ...current[cfopId], ...patch };
  await setCacheMeta('cfop_user_prefs', current);
}

export async function getFiscalCacheStats(): Promise<FiscalCacheStats> {
  const db = await openDatabase();
  if (!db) {
    return { available: false, ncmCount: 0, cfopCount: 0, queryCount: 0 };
  }

  return new Promise<FiscalCacheStats>((resolve) => {
    try {
      const tx = db.transaction([STORE_NCM, STORE_CFOP, STORE_QUERIES, STORE_META], 'readonly');
      let ncmCount = 0;
      let cfopCount = 0;
      let queryCount = 0;
      let lastNcmSync: string | undefined;
      let lastCfopSync: string | undefined;

      tx.objectStore(STORE_NCM).count().onsuccess = (e) => {
        ncmCount = (e.target as IDBRequest<number>).result || 0;
      };
      tx.objectStore(STORE_CFOP).count().onsuccess = (e) => {
        cfopCount = (e.target as IDBRequest<number>).result || 0;
      };
      tx.objectStore(STORE_QUERIES).count().onsuccess = (e) => {
        queryCount = (e.target as IDBRequest<number>).result || 0;
      };
      tx.objectStore(STORE_META).get('ncm_status').onsuccess = (e) => {
        const res = (e.target as IDBRequest<StoredMetaEntry<{ ultimaSincronizacao?: string }>>).result;
        lastNcmSync = res?.value?.ultimaSincronizacao;
      };
      tx.objectStore(STORE_META).get('cfop_status').onsuccess = (e) => {
        const res = (e.target as IDBRequest<StoredMetaEntry<{ ultimaSincronizacao?: string }>>).result;
        lastCfopSync = res?.value?.ultimaSincronizacao;
      };

      tx.oncomplete = () =>
        resolve({
          available: true,
          ncmCount,
          cfopCount,
          queryCount,
          lastNcmSync,
          lastCfopSync,
        });
      tx.onerror = () =>
        resolve({ available: true, ncmCount: 0, cfopCount: 0, queryCount: 0 });
    } catch {
      resolve({ available: false, ncmCount: 0, cfopCount: 0, queryCount: 0 });
    }
  });
}

export async function clearFiscalCache(target: 'ncm' | 'cfop' | 'all' = 'all'): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  if (target === 'ncm' || target === 'all') {
    await invalidateQueryNamespace('ncm');
  }
  if (target === 'cfop' || target === 'all') {
    await invalidateQueryNamespace('cfop');
  }

  await new Promise<void>((resolve) => {
    try {
      const stores: string[] = [STORE_META];
      if (target === 'ncm' || target === 'all') stores.push(STORE_NCM);
      if (target === 'cfop' || target === 'all') stores.push(STORE_CFOP);

      const tx = db.transaction(stores, 'readwrite');
      if (target === 'ncm' || target === 'all') {
        tx.objectStore(STORE_NCM).clear();
        tx.objectStore(STORE_META).delete('ncm_status');
        tx.objectStore(STORE_META).delete('ncm_hydration_progress');
        tx.objectStore(STORE_META).delete('ncm_filters_meta');
      }
      if (target === 'cfop' || target === 'all') {
        tx.objectStore(STORE_CFOP).clear();
        tx.objectStore(STORE_META).delete('cfop_status');
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}
