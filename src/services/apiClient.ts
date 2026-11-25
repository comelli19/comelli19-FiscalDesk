/**
 * Cliente HTTP compartilhado com injeção automática de cabeçalho de autenticação
 * para rotas protegidas (POST, PUT, DELETE e /api/gemini/*).
 */

export const DEFAULT_AUTH_TOKEN =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_AUTH_TOKEN) ||
  'fiscaldesk-internal-token-2026';

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-token': DEFAULT_AUTH_TOKEN,
    Authorization: `Bearer ${DEFAULT_AUTH_TOKEN}`,
    ...extraHeaders,
  };
}

export function getAuthFetchOptions(method: 'POST' | 'PUT' | 'DELETE', body?: any): RequestInit {
  const init: RequestInit = {
    method,
    headers: getAuthHeaders(),
  };
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return init;
}
