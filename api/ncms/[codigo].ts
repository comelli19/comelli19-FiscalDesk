import type { ApiRequest, ApiResponse } from '../_types';
import { getQueryString } from '../_types';
import { buscarNCMPorCodigoAsync } from '../../src/services/tipiCatalogService';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const codigo = getQueryString(req.query, 'codigo') || '';
    const ncm = await buscarNCMPorCodigoAsync(codigo);

    if (ncm) {
      res.setHeader?.('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.status(200).json({ data: ncm });
    } else {
      res.status(404).json({ error: 'NCM não localizado na Tabela TIPI / Siscomex' });
    }
  } catch (error) {
    console.error('[api/ncms/:codigo] Erro na consulta NCM:', error);
    res.status(500).json({ error: 'Erro interno ao consultar o código NCM.' });
  }
}
