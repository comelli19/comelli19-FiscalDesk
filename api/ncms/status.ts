import type { ApiRequest, ApiResponse } from '../_types';
import { obterStatusCatalogoTIPIAsync } from '../../src/services/tipiCatalogService';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const status = await obterStatusCatalogoTIPIAsync(false);
    res.setHeader?.('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(status);
  } catch (error) {
    console.error('[api/ncms/status] Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro interno ao consultar status do catálogo NCM.' });
  }
}
