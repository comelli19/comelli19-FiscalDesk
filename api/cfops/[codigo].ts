import type { ApiRequest, ApiResponse } from '../_types';
import { getQueryString } from '../_types';
import { buscarCFOPPorCodigo } from '../../src/services/cfopCatalogService';

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const codigo = getQueryString(req.query, 'codigo') || '';
  const cfop = buscarCFOPPorCodigo(codigo);

  if (cfop) {
    res.status(200).json({ data: cfop });
  } else {
    res.status(404).json({ error: 'CFOP não localizado na Tabela SINIEF' });
  }
}
