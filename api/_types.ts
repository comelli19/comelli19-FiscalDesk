export interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  end?: (chunk?: string) => void;
}

export function getQueryString(
  query: ApiRequest['query'],
  key: string
): string | undefined {
  const val = query?.[key];
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && val.length > 0) return val[0];
  return undefined;
}

export function parseJsonBody<T = Record<string, unknown>>(req: ApiRequest): T {
  if (!req.body) return {} as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  return req.body as T;
}
