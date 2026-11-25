import type { ApiRequest, ApiResponse } from '../_types';
import { INITIAL_UFS } from '../../src/data/ufs';

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  res.status(200).json({ data: INITIAL_UFS });
}
