import type { ApiRequest, ApiResponse } from '../_types';
import { parseJsonBody } from '../_types';
import { importarLoteNCMs } from '../../src/services/tipiCatalogService';

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const body = parseJsonBody<{ itens?: unknown[] }>(req);
  if (!Array.isArray(body.itens)) {
    res.status(400).json({ error: 'O corpo da requisição deve conter um array "itens".' });
    return;
  }

  const resultado = importarLoteNCMs(body.itens);
  res.status(200).json(resultado);
}
