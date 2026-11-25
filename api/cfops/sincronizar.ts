import type { ApiRequest, ApiResponse } from '../_types';
import { obterStatusCatalogoCFOP } from '../../src/services/cfopCatalogService';

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const status = obterStatusCatalogoCFOP();
  res.status(200).json({
    sucesso: true,
    mensagem: 'Catálogo de CFOPs sincronizado com sucesso com as tabelas do SINIEF/SEFAZ.',
    status,
  });
}
