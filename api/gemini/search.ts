import { GoogleGenAI } from '@google/genai';
import type { ApiRequest, ApiResponse } from '../_types';
import { parseJsonBody } from '../_types';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const body = parseJsonBody<{ query?: string }>(req);
    const { query } = body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query é obrigatória' });
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

    const systemInstruction = `Você é o Consultor Fiscal do FiscalDesk, especialista em direito tributário brasileiro, ICMS, ICMS-ST, DIFAL, Suframa, CFOPs e regras da SEFAZ.
Responda com precisão técnica e cite sempre a legislação vigente (Convênios CONFAZ, Leis Complementares, Decretos estaduais ou Notas Técnicas da SEFAZ).
Mencione a data de vigência e as UFs envolvidas.
Utilize a ferramenta de busca do Google para obter as informações mais atualizadas da legislação fiscal brasileira.`;

    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || 'Sem resposta para a consulta.';
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources = groundingChunks
      .filter((c) => Boolean(c.web?.uri))
      .map((c) => ({
        title: c.web?.title || c.web?.uri || '',
        uri: c.web?.uri || '',
      }));

    res.status(200).json({
      answer: text,
      sources,
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro ao consultar a legislação via Gemini Search Grounding';
    console.error('Erro na busca de legislação com Gemini:', error);
    res.status(500).json({ error: message });
  }
}
