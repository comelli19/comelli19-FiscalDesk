import type { ApiRequest, ApiResponse } from '../_types';
import { obterStatusCatalogoTIPIAsync } from '../../src/services/tipiCatalogService';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const status = await obterStatusCatalogoTIPIAsync(true);
    const origem =
      status.fonteAtiva === 'siscomex'
        ? `Portal Único Siscomex (${status.atoLegal})`
        : status.fonteAtiva === 'brasilapi'
        ? 'BrasilAPI (Tabela NCM Oficial)'
        : 'Base Local Curada (modo contingência)';

    res.setHeader?.('Cache-Control', 'no-store');
    res.status(200).json({
      sucesso: true,
      mensagem: `Catálogo NCM sincronizado com ${origem}: ${status.totalRegistros.toLocaleString('pt-BR')} códigos ativos.`,
      status,
    });
  } catch (error) {
    console.error('[api/ncms/sincronizar] Erro na sincronização:', error);
    res.status(500).json({ error: 'Erro ao sincronizar catálogo oficial de NCMs.' });
  }
}
