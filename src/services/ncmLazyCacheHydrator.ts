import { NCMInfo } from '../types/fiscal';
import {
  getCacheMeta,
  isIndexedDBAvailable,
  putNCMRecordsChunked,
  setCacheMeta,
} from './fiscalIndexedDBCache';

/**
 * Hidratador Assíncrono (Lazy-Loading Paginado) do Catálogo Completo de NCMs no IndexedDB
 *
 * Estratégia anti-travamento (60fps na inicialização do módulo de Tabelas):
 * 1. Inicia apenas após o primeiro paint da tela, agendado em `requestIdleCallback`.
 * 2. Baixa os ~10.516 NCMs em páginas compactas (`limit=500&compact=true`, ~22 páginas),
 *    uma página por vez, sem sobrecarregar a rede nem a RAM.
 * 3. Grava cada página no IndexedDB em micro-lotes de 150 itens cedendo a thread principal
 *    entre cada bloco (zero Long Tasks).
 * 4. Salva checkpoint retomável no IndexedDB (`ncm_hydration_progress`): se o usuário sair
 *    da aba ou fechar o navegador no meio, a retomada continua exatamente da próxima página.
 * 5. Ao concluir (TTL 24h), buscas, filtros por capítulo/setor e paginação passam a operar
 *    diretamente via cursor indexado no IndexedDB com ZERO requisições HTTP.
 */

const HYDRATION_META_KEY = 'ncm_hydration_progress';
const FILTERS_META_KEY = 'ncm_filters_meta';
const HYDRATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const PAGE_SIZE = 500;
const IDB_WRITE_CHUNK_SIZE = 150;
const INTER_PAGE_DELAY_MS = 90;

export type EstadoHidratacaoNCM = 'idle' | 'hydrating' | 'paused' | 'completed' | 'unavailable';

export interface ProgressoHidratacaoNCM {
  estado: EstadoHidratacaoNCM;
  lastCompletedPage: number;
  totalPages: number;
  totalSynced: number;
  totalExpected: number;
  percentual: number;
  completed: boolean;
  updatedAt: number;
}

export interface FiltrosCatalogoNCMMeta {
  capitulosDisponiveis: { capitulo: string; titulo: string }[];
  setoresDisponiveis: string[];
  ultimaSincronizacao: string;
  fonte: string;
}

type ProgressoListener = (progresso: ProgressoHidratacaoNCM) => void;

let estadoAtual: ProgressoHidratacaoNCM = {
  estado: isIndexedDBAvailable() ? 'idle' : 'unavailable',
  lastCompletedPage: 0,
  totalPages: 0,
  totalSynced: 0,
  totalExpected: 0,
  percentual: 0,
  completed: false,
  updatedAt: 0,
};

const listeners = new Set<ProgressoListener>();
let execucaoAtiva = false;
let pausarSolicitado = false;
let timerAgendado: ReturnType<typeof setTimeout> | null = null;
let idleHandle: number | null = null;
let catalogoCompletoEmMemoria = false;

function notificarListeners(): void {
  const snapshot = { ...estadoAtual };
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // ignora erro isolado de listener
    }
  });
}

function esperarOcioso(delayMs = INTER_PAGE_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    timerAgendado = setTimeout(() => {
      timerAgendado = null;
      if (typeof window !== 'undefined' && typeof (window as any).requestIdleCallback === 'function') {
        idleHandle = (window as any).requestIdleCallback(
          () => {
            idleHandle = null;
            resolve();
          },
          { timeout: 600 }
        );
      } else {
        resolve();
      }
    }, delayMs);
  });
}

function cancelarAgendamentos(): void {
  if (timerAgendado !== null) {
    clearTimeout(timerAgendado);
    timerAgendado = null;
  }
  if (
    idleHandle !== null &&
    typeof window !== 'undefined' &&
    typeof (window as any).cancelIdleCallback === 'function'
  ) {
    (window as any).cancelIdleCallback(idleHandle);
    idleHandle = null;
  }
}

export function assinarProgressoHidratacaoNCM(listener: ProgressoListener): () => void {
  listeners.add(listener);
  listener({ ...estadoAtual });
  return () => {
    listeners.delete(listener);
  };
}

export async function obterProgressoHidratacaoNCM(): Promise<ProgressoHidratacaoNCM> {
  if (!isIndexedDBAvailable()) {
    return { ...estadoAtual, estado: 'unavailable' };
  }

  if (estadoAtual.updatedAt === 0) {
    const salvo = await getCacheMeta<ProgressoHidratacaoNCM>(HYDRATION_META_KEY, HYDRATION_TTL_MS);
    if (salvo) {
      estadoAtual = {
        ...salvo,
        estado: salvo.completed ? 'completed' : execucaoAtiva ? 'hydrating' : 'paused',
      };
      catalogoCompletoEmMemoria = Boolean(salvo.completed);
    }
  }

  return { ...estadoAtual };
}

/**
 * Indica se todos os ~10.516 NCMs já estão persistidos no IndexedDB dentro do TTL (24h)
 */
export async function isNCMCatalogoLocalCompleto(): Promise<boolean> {
  if (!isIndexedDBAvailable()) return false;
  if (catalogoCompletoEmMemoria && Date.now() - estadoAtual.updatedAt < HYDRATION_TTL_MS) {
    return true;
  }
  const salvo = await getCacheMeta<ProgressoHidratacaoNCM>(HYDRATION_META_KEY, HYDRATION_TTL_MS);
  if (salvo?.completed) {
    catalogoCompletoEmMemoria = true;
    estadoAtual = { ...salvo, estado: 'completed' };
    return true;
  }
  catalogoCompletoEmMemoria = false;
  return false;
}

export async function obterFiltrosCatalogoNCMMeta(): Promise<FiltrosCatalogoNCMMeta | null> {
  return getCacheMeta<FiltrosCatalogoNCMMeta>(FILTERS_META_KEY, HYDRATION_TTL_MS);
}

export async function salvarFiltrosCatalogoNCMMeta(meta: FiltrosCatalogoNCMMeta): Promise<void> {
  await setCacheMeta(FILTERS_META_KEY, meta);
}

/**
 * Pausa gentilmente a hidratação paginada em segundo plano mantendo o checkpoint atual
 */
export function pausarHidratacaoPreguicosaNCM(): void {
  pausarSolicitado = true;
  cancelarAgendamentos();
  if (execucaoAtiva) {
    estadoAtual = { ...estadoAtual, estado: 'paused' };
    notificarListeners();
  }
}

/**
 * Reseta checkpoint em memória (chamado ao limpar cache ou forçar sincronização)
 */
export function resetarProgressoHidratacaoNCM(): void {
  pausarSolicitado = true;
  cancelarAgendamentos();
  catalogoCompletoEmMemoria = false;
  estadoAtual = {
    estado: isIndexedDBAvailable() ? 'idle' : 'unavailable',
    lastCompletedPage: 0,
    totalPages: 0,
    totalSynced: 0,
    totalExpected: 0,
    percentual: 0,
    completed: false,
    updatedAt: 0,
  };
  notificarListeners();
}

/**
 * Inicia (ou retoma a partir do último checkpoint) a hidratação paginada e ociosa
 * de todos os ~10.516 NCMs no IndexedDB sem travar a interface.
 */
export async function iniciarHidratacaoPreguicosaNCM(opcoes?: {
  forcar?: boolean;
  atrasoInicialMs?: number;
}): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  if (execucaoAtiva && !opcoes?.forcar) return;

  const forcar = Boolean(opcoes?.forcar);
  const atrasoInicial = opcoes?.atrasoInicialMs ?? 900;

  // Verifica checkpoint salvo no IndexedDB
  if (!forcar) {
    const salvo = await getCacheMeta<ProgressoHidratacaoNCM>(HYDRATION_META_KEY, HYDRATION_TTL_MS);
    if (salvo?.completed) {
      catalogoCompletoEmMemoria = true;
      estadoAtual = { ...salvo, estado: 'completed' };
      notificarListeners();
      return;
    }
    if (salvo && salvo.lastCompletedPage > 0) {
      estadoAtual = { ...salvo, estado: 'hydrating' };
    }
  } else {
    catalogoCompletoEmMemoria = false;
    estadoAtual = {
      estado: 'hydrating',
      lastCompletedPage: 0,
      totalPages: 0,
      totalSynced: 0,
      totalExpected: 0,
      percentual: 0,
      completed: false,
      updatedAt: Date.now(),
    };
  }

  pausarSolicitado = false;
  execucaoAtiva = true;
  estadoAtual = { ...estadoAtual, estado: 'hydrating' };
  notificarListeners();

  try {
    // Aguarda o navegador ficar ocioso após o primeiro render da tela de tabelas
    await esperarOcioso(atrasoInicial);
    if (pausarSolicitado) return;

    let paginaAtual = Math.max(1, estadoAtual.lastCompletedPage + 1);
    let totalPages = estadoAtual.totalPages || 1;
    let totalSynced = estadoAtual.totalSynced || 0;
    let totalExpected = estadoAtual.totalExpected || 0;

    while (!pausarSolicitado) {
      // Na página 1 buscamos metadados de filtros (capítulos/setores); nas demais usamos compact=true
      const usarCompact = paginaAtual > 1;
      const url = `/api/ncms?page=${paginaAtual}&limit=${PAGE_SIZE}${usarCompact ? '&compact=true' : ''}`;

      const res = await fetch(url);
      if (!res.ok) {
        // Rede/servidor temporariamente indisponível: pausa sem perder checkpoint
        estadoAtual = { ...estadoAtual, estado: 'paused', updatedAt: Date.now() };
        notificarListeners();
        return;
      }

      const json: {
        data?: NCMInfo[];
        total?: number;
        totalPages?: number;
        capitulosDisponiveis?: { capitulo: string; titulo: string }[];
        setoresDisponiveis?: string[];
        ultimaSincronizacao?: string;
        fonte?: string;
      } = await res.json();

      if (pausarSolicitado) return;

      const itens = Array.isArray(json.data) ? json.data : [];
      totalPages = typeof json.totalPages === 'number' && json.totalPages > 0 ? json.totalPages : paginaAtual;
      totalExpected = typeof json.total === 'number' && json.total > 0 ? json.total : totalExpected;

      if (
        !usarCompact &&
        Array.isArray(json.capitulosDisponiveis) &&
        json.capitulosDisponiveis.length > 0
      ) {
        void salvarFiltrosCatalogoNCMMeta({
          capitulosDisponiveis: json.capitulosDisponiveis,
          setoresDisponiveis: Array.isArray(json.setoresDisponiveis) ? json.setoresDisponiveis : [],
          ultimaSincronizacao: json.ultimaSincronizacao || new Date().toISOString(),
          fonte: json.fonte || 'Portal Único Siscomex + Base Curada TIPI',
        });
      }

      if (itens.length > 0) {
        const gravados = await putNCMRecordsChunked(
          itens,
          IDB_WRITE_CHUNK_SIZE,
          () => pausarSolicitado
        );
        if (pausarSolicitado) return;
        totalSynced = Math.min(totalExpected || totalSynced + gravados, totalSynced + gravados);
      }

      const concluido = paginaAtual >= totalPages || itens.length === 0;
      const percentual = concluido
        ? 100
        : totalExpected > 0
        ? Math.min(99, Math.round((totalSynced / totalExpected) * 100))
        : Math.min(99, Math.round((paginaAtual / totalPages) * 100));

      estadoAtual = {
        estado: concluido ? 'completed' : 'hydrating',
        lastCompletedPage: paginaAtual,
        totalPages,
        totalSynced: concluido && totalExpected > 0 ? totalExpected : totalSynced,
        totalExpected,
        percentual,
        completed: concluido,
        updatedAt: Date.now(),
      };

      await setCacheMeta(HYDRATION_META_KEY, estadoAtual);
      notificarListeners();

      if (concluido) {
        catalogoCompletoEmMemoria = true;
        return;
      }

      paginaAtual++;
      await esperarOcioso(INTER_PAGE_DELAY_MS);
    }
  } catch {
    estadoAtual = { ...estadoAtual, estado: 'paused', updatedAt: Date.now() };
    notificarListeners();
  } finally {
    execucaoAtiva = false;
  }
}
