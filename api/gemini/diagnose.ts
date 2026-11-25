import { GoogleGenAI } from '@google/genai';
import type { ApiRequest, ApiResponse } from '../_types';
import { parseJsonBody } from '../_types';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const body = parseJsonBody<{ xmlOuMensagem?: string }>(req);
    const { xmlOuMensagem } = body;

    if (!xmlOuMensagem || typeof xmlOuMensagem !== 'string') {
      res.status(400).json({ error: 'XML ou mensagem de erro não fornecido' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(400).json({
        error:
          'Chave GEMINI_API_KEY não configurada nas variáveis de ambiente da Vercel (Settings > Environment Variables).',
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model,
      contents: `Analise a seguinte ocorrência fiscal ou XML de NF-e na SEFAZ:
${xmlOuMensagem}

Explique em linguagem simples e técnica:
1. Qual a causa provável da rejeição ou erro fiscal.
2. Passo a passo exato para correção no ERP/sistema emissor.
3. Tags do XML afetadas e exemplo de preenchimento correto.
4. Fundamento legal ou Nota Técnica correspondente.`,
    });

    res.status(200).json({ diagnosis: response.text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao realizar diagnóstico';
    console.error('Erro no diagnóstico fiscal Gemini:', error);
    res.status(500).json({ error: message });
  }
}
