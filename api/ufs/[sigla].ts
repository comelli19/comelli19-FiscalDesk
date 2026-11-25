import type { ApiRequest, ApiResponse } from '../_types';
import { getQueryString, parseJsonBody } from '../_types';
import { INITIAL_UFS } from '../../src/data/ufs';

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const sigla = (getQueryString(req.query, 'sigla') || '').toUpperCase();
  const baseUF = INITIAL_UFS.find((u) => u.sigla.toUpperCase() === sigla);

  if (!baseUF) {
    res.status(404).json({ error: 'UF não encontrada' });
    return;
  }

  const body = parseJsonBody<Record<string, unknown>>(req);
  const updated = {
    ...baseUF,
    ...body,
    dataAtualizacao: new Date().toISOString().split('T')[0],
  };

  res.status(200).json(updated);
}
