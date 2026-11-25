import type { ApiRequest, ApiResponse } from '../_types';
import { getQueryString } from '../_types';
import { buscarNCMsNoCatalogoAsync } from '../../src/services/tipiCatalogService';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const q = getQueryString(req.query, 'q');
    const capitulo = getQueryString(req.query, 'capitulo');
    const setor = getQueryString(req.query, 'setor');
    const onlyST = getQueryString(req.query, 'onlyST');
    const onlyMonofasico = getQueryString(req.query, 'onlyMonofasico');
    const page = getQueryString(req.query, 'page');
    const limit = getQueryString(req.query, 'limit');
    const compact = getQueryString(req.query, 'compact');

    const resultado = await buscarNCMsNoCatalogoAsync({
      q: q || '',
      capitulo: capitulo || '',
      setor: setor || '',
      onlyST: onlyST === 'true',
      onlyMonofasico: onlyMonofasico === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      compact: compact === 'true',
    });

    res.setHeader?.('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[api/ncms] Erro na consulta NCM:', error);
    res.status(500).json({ error: 'Erro interno ao consultar o catálogo oficial de NCMs.' });
  }
}
