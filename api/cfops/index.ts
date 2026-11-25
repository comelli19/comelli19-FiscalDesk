import type { ApiRequest, ApiResponse } from '../_types';
import { getQueryString, parseJsonBody } from '../_types';
import { buscarCFOPsNoCatalogo, importarLoteCFOPs } from '../../src/services/cfopCatalogService';

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'POST') {
    const body = parseJsonBody<Record<string, unknown>>(req);
    const newCFOP = {
      ...body,
      id: `cfop-${Date.now()}`,
      dataAtualizacao: new Date().toISOString().split('T')[0],
    };
    importarLoteCFOPs([newCFOP]);
    res.setHeader?.('Cache-Control', 'no-store');
    res.status(201).json(newCFOP);
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const q = getQueryString(req.query, 'q');
  const tipo = getQueryString(req.query, 'tipo');
  const abrangencia = getQueryString(req.query, 'abrangencia');
  const grupo = getQueryString(req.query, 'grupo');
  const apenasFavoritos = getQueryString(req.query, 'apenasFavoritos');
  const page = getQueryString(req.query, 'page');
  const limit = getQueryString(req.query, 'limit');

  res.setHeader?.('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (!q && !tipo && !abrangencia && !grupo && !apenasFavoritos && !page && !limit) {
    const todos = buscarCFOPsNoCatalogo({ limit: 1000 });
    res.status(200).json({ data: todos.data, total: todos.total });
    return;
  }

  const resultado = buscarCFOPsNoCatalogo({
    q: q || '',
    tipo: (tipo as 'todos' | 'entrada' | 'saida') || 'todos',
    abrangencia: (abrangencia as 'todos' | 'estadual' | 'interestadual' | 'exterior') || 'todos',
    grupo: grupo || 'todos',
    apenasFavoritos: apenasFavoritos === 'true',
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 50,
  });

  res.status(200).json(resultado);
}
