import type { ApiRequest, ApiResponse } from '../_types';
import { obterStatusCatalogoCFOP } from '../../src/services/cfopCatalogService';

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  res.status(200).json(obterStatusCatalogoCFOP());
}
