// Função Serverless Unificada da Vercel (1 única Serverless Function para o plano Hobby)
// Roteia todos os endpoints /api/* (NCMs, CFOPs, UFs, Gemini e Calculadora RTC)

import { GoogleGenAI } from '@google/genai';
import type { ApiRequest, ApiResponse } from './_types';
import { getQueryString, parseJsonBody } from './_types';
import { INITIAL_UFS } from '../src/data/ufs';
import { RTC_VERSAO_MOTOR } from '../src/data/rtcTabelasOficiais';
import {
  buscarNCMsNoCatalogoAsync,
  buscarNCMPorCodigoAsync,
  importarLoteNCMs,
  obterStatusCatalogoTIPIAsync,
} from '../src/services/tipiCatalogService';
import {
  buscarCFOPsNoCatalogo,
  buscarCFOPPorCodigo,
  importarLoteCFOPs,
  obterStatusCatalogoCFOP,
} from '../src/services/cfopCatalogService';
import {
  calcularRegimeRegular,
  calcularRegimeRegularObservabilidade,
  calcularBaseUnificadaNFe,
  calcularBaseUnificadaNFSe,
  gerarXmlGruposRTC,
  validarXmlGruposRTC,
  calcularSimplesNacionalRTC,
  parseNFSeXmlParaDANFSe,
  consultarDadosAbertosRTC,
  RtcRegimeRegularRequest,
  RtcBaseUnificadaNFeInput,
  RtcBaseUnificadaNFSeInput,
  RtcSimplesNacionalRequest,
} from '../src/services/rtcCalculadoraService';

function resolveApiPath(req: ApiRequest): string {
  const fromQuery = getQueryString(req.query, '__route');
  if (fromQuery !== undefined) {
    return fromQuery.replace(/^\/+|\/+$/g, '');
  }
  if (req.url) {
    const cleanUrl = req.url.split('?')[0];
    const idx = cleanUrl.indexOf('/api/');
    if (idx !== -1) {
      const rest = cleanUrl.slice(idx + '/api/'.length).replace(/^\/+|\/+$/g, '');
      return rest === 'index' ? '' : rest;
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// 1. NCMs (/api/ncms/*)
// ---------------------------------------------------------------------------
async function handleNcms(method: string, subPath: string, req: ApiRequest, res: ApiResponse) {
  const sub = subPath.toLowerCase();

  if (sub === '' || sub === 'index') {
    if (method !== 'GET') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }
    try {
      const resultado = await buscarNCMsNoCatalogoAsync({
        q: getQueryString(req.query, 'q') || '',
        capitulo: getQueryString(req.query, 'capitulo') || '',
        setor: getQueryString(req.query, 'setor') || '',
        onlyST: getQueryString(req.query, 'onlyST') === 'true',
        onlyMonofasico: getQueryString(req.query, 'onlyMonofasico') === 'true',
        page: getQueryString(req.query, 'page') ? parseInt(getQueryString(req.query, 'page')!, 10) : 1,
        limit: getQueryString(req.query, 'limit') ? parseInt(getQueryString(req.query, 'limit')!, 10) : 50,
        compact: getQueryString(req.query, 'compact') === 'true',
      });
      res.setHeader?.('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.status(200).json(resultado);
    } catch (error) {
      console.error('[api/ncms] Erro na consulta NCM:', error);
      res.status(500).json({ error: 'Erro interno ao consultar o catálogo oficial de NCMs.' });
    }
    return;
  }

  if (sub === 'status') {
    if (method !== 'GET') {
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
    return;
  }

  if (sub === 'sincronizar') {
    if (method !== 'POST') {
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
    return;
  }

  if (sub === 'importar') {
    if (method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }
    const body = parseJsonBody<{ itens?: unknown[] }>(req);
    if (!Array.isArray(body.itens)) {
      res.status(400).json({ error: 'O corpo da requisição deve conter um array "itens".' });
      return;
    }
    res.status(200).json(importarLoteNCMs(body.itens));
    return;
  }

  // GET /api/ncms/:codigo
  if (method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  try {
    const codigo = decodeURIComponent(subPath);
    const ncm = await buscarNCMPorCodigoAsync(codigo);
    if (ncm) {
      res.setHeader?.('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.status(200).json({ data: ncm });
    } else {
      res.status(404).json({ error: 'NCM não localizado na Tabela TIPI / Siscomex' });
    }
  } catch (error) {
    console.error('[api/ncms/:codigo] Erro na consulta NCM:', error);
    res.status(500).json({ error: 'Erro interno ao consultar o código NCM.' });
  }
}

// ---------------------------------------------------------------------------
// 2. CFOPs (/api/cfops/*)
// ---------------------------------------------------------------------------
function handleCfops(method: string, subPath: string, req: ApiRequest, res: ApiResponse) {
  const sub = subPath.toLowerCase();

  if (sub === '' || sub === 'index') {
    if (method === 'POST') {
      const body = parseJsonBody<Record<string, unknown>>(req);
      const newCFOP = {
        ...body,
        id: `cfop-${Date.now()}`,
        dataAtualizacao: new Date().toISOString().split('T')[0],
      };
      importarLoteCFOPs([newCFOP]);
      res.setHeader?.('Cache-Control', 'no-store');
      res.status(201).json(newCFOP);
      return;
    }

    if (method !== 'GET') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const q = getQueryString(req.query, 'q');
    const tipo = getQueryString(req.query, 'tipo');
    const abrangencia = getQueryString(req.query, 'abrangencia');
    const grupo = getQueryString(req.query, 'grupo');
    const apenasFavoritos = getQueryString(req.query, 'apenasFavoritos');
    const page = getQueryString(req.query, 'page');
    const limit = getQueryString(req.query, 'limit');

    res.setHeader?.('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    if (!q && !tipo && !abrangencia && !grupo && !apenasFavoritos && !page && !limit) {
      const todos = buscarCFOPsNoCatalogo({ limit: 1000 });
      res.status(200).json({ data: todos.data, total: todos.total });
      return;
    }

    const resultado = buscarCFOPsNoCatalogo({
      q: q || '',
      tipo: (tipo as 'todos' | 'entrada' | 'saida') || 'todos',
      abrangencia: (abrangencia as 'todos' | 'estadual' | 'interestadual' | 'exterior') || 'todos',
      grupo: grupo || 'todos',
      apenasFavoritos: apenasFavoritos === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    res.status(200).json(resultado);
    return;
  }

  if (sub === 'status') {
    if (method !== 'GET') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }
    res.status(200).json(obterStatusCatalogoCFOP());
    return;
  }

  if (sub === 'sincronizar') {
    if (method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }
    const status = obterStatusCatalogoCFOP();
    res.status(200).json({
      sucesso: true,
      mensagem: 'Catálogo de CFOPs sincronizado com sucesso com as tabelas do SINIEF/SEFAZ.',
      status,
    });
    return;
  }

  if (sub === 'importar') {
    if (method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }
    const body = parseJsonBody<{ itens?: unknown[] }>(req);
    if (!Array.isArray(body.itens)) {
      res.status(400).json({ error: 'O corpo da requisição deve conter um array "itens".' });
      return;
    }
    res.status(200).json(importarLoteCFOPs(body.itens));
    return;
  }

  // GET /api/cfops/:codigo
  if (method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  const cfop = buscarCFOPPorCodigo(decodeURIComponent(subPath));
  if (cfop) {
    res.status(200).json({ data: cfop });
  } else {
    res.status(404).json({ error: 'CFOP não localizado na Tabela SINIEF' });
  }
}

// ---------------------------------------------------------------------------
// 3. UFs (/api/ufs/*)
// ---------------------------------------------------------------------------
function handleUfs(method: string, subPath: string, req: ApiRequest, res: ApiResponse) {
  if (!subPath || subPath.toLowerCase() === 'index') {
    if (method !== 'GET') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }
    res.status(200).json({ data: INITIAL_UFS });
    return;
  }

  if (method !== 'PUT') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const sigla = decodeURIComponent(subPath).toUpperCase();
  const baseUF = INITIAL_UFS.find((u) => u.sigla.toUpperCase() === sigla);
  if (!baseUF) {
    res.status(404).json({ error: 'UF não encontrada' });
    return;
  }

  const body = parseJsonBody<Record<string, unknown>>(req);
  res.status(200).json({
    ...baseUF,
    ...body,
    dataAtualizacao: new Date().toISOString().split('T')[0],
  });
}

// ---------------------------------------------------------------------------
// 4. Gemini (/api/gemini/diagnose e /api/gemini/search)
// ---------------------------------------------------------------------------
async function handleGemini(method: string, subPath: string, req: ApiRequest, res: ApiResponse) {
  const sub = subPath.toLowerCase();
  if (method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (sub === 'diagnose') {
    try {
      const { xmlOuMensagem } = parseJsonBody<{ xmlOuMensagem?: string }>(req);
      if (!xmlOuMensagem || typeof xmlOuMensagem !== 'string') {
        res.status(400).json({ error: 'XML ou mensagem de erro não fornecido' });
        return;
      }
      if (!apiKey) {
        res.status(400).json({
          error:
            'Chave GEMINI_API_KEY não configurada nas variáveis de ambiente da Vercel (Settings > Environment Variables).',
        });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
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
    return;
  }

  if (sub === 'search') {
    try {
      const { query } = parseJsonBody<{ query?: string }>(req);
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query é obrigatória' });
        return;
      }
      if (!apiKey) {
        res.status(400).json({
          error:
            'Chave GEMINI_API_KEY não configurada nas variáveis de ambiente da Vercel (Settings > Environment Variables).',
        });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
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
    return;
  }

  res.status(404).json({ error: `Endpoint Gemini não encontrado: /api/gemini/${subPath}` });
}

// ---------------------------------------------------------------------------
// 5. Calculadora RTC (/api/calculadora/*)
// ---------------------------------------------------------------------------
function handleCalculadora(method: string, subPath: string, req: ApiRequest, res: ApiResponse) {
  const route = subPath.toLowerCase();

  if (method === 'GET' && (route === '' || route === 'status' || route === 'versao' || route === 'versao/status')) {
    res.status(200).json({
      status: 'online',
      ...RTC_VERSAO_MOTOR,
      endpoints: [
        'POST /api/calculadora/regime-geral',
        'POST /api/calculadora/observabilidade/regime-geral',
        'POST /api/calculadora/base-calculo/base-calculo-unificada',
        'POST /api/calculadora/base-calculo/base-calculo-unificada-nfse',
        'POST /api/calculadora/xml/generate',
        'POST /api/calculadora/xml/validate',
        'POST /api/calculadora/simples-nacional',
        'POST /api/calculadora/danfse/parse',
        'GET /api/calculadora/dados-abertos/situacoes-tributarias/cbs-ibs',
        'GET /api/calculadora/dados-abertos/classificacoes-tributarias',
        'GET /api/calculadora/dados-abertos/ncm',
        'GET /api/calculadora/dados-abertos/nbs',
        'GET /api/calculadora/dados-abertos/aliquota-uniao',
        'GET /api/calculadora/dados-abertos/aliquota-uf',
        'GET /api/calculadora/dados-abertos/aliquota-municipio',
        'GET /api/calculadora/dados-abertos/fundamentacoes-legais',
      ],
    });
    return;
  }

  if (method === 'GET' && route.startsWith('dados-abertos/')) {
    const subTabela = route.replace('dados-abertos/', '');
    const anoStr = getQueryString(req.query, 'ano');
    const ano = anoStr ? parseInt(anoStr, 10) : undefined;
    res.status(200).json(
      consultarDadosAbertosRTC(subTabela, {
        q: getQueryString(req.query, 'q'),
        cst: getQueryString(req.query, 'cst'),
        uf: getQueryString(req.query, 'uf'),
        ano: Number.isFinite(ano) ? ano : undefined,
      })
    );
    return;
  }

  if (method === 'POST') {
    if (route === 'regime-geral') {
      res.status(200).json(calcularRegimeRegular(parseJsonBody<RtcRegimeRegularRequest>(req)));
      return;
    }
    if (route === 'observabilidade/regime-geral') {
      res.status(200).json(calcularRegimeRegularObservabilidade(parseJsonBody<RtcRegimeRegularRequest>(req)));
      return;
    }
    if (route === 'base-calculo/base-calculo-unificada') {
      res.status(200).json(calcularBaseUnificadaNFe(parseJsonBody<RtcBaseUnificadaNFeInput>(req)));
      return;
    }
    if (route === 'base-calculo/base-calculo-unificada-nfse') {
      res.status(200).json(calcularBaseUnificadaNFSe(parseJsonBody<RtcBaseUnificadaNFSeInput>(req)));
      return;
    }
    if (route === 'xml/generate') {
      const body = parseJsonBody<RtcRegimeRegularRequest & { tipo?: 'NFE' | 'NFSE' }>(req);
      const tipo = (getQueryString(req.query, 'tipo') || body.tipo || 'NFE').toUpperCase() as 'NFE' | 'NFSE';
      const resultado = calcularRegimeRegular(body);
      const xml = gerarXmlGruposRTC(resultado, tipo);
      res.status(200).json({ tipo, xml, resultado });
      return;
    }
    if (route === 'xml/validate') {
      const body = parseJsonBody<{ xml?: string; tipo?: 'NFE' | 'NFSE' }>(req);
      const tipo = (getQueryString(req.query, 'tipo') || body.tipo || 'NFE').toUpperCase() as 'NFE' | 'NFSE';
      res.status(200).json(validarXmlGruposRTC(body.xml || '', tipo));
      return;
    }
    if (route === 'simples-nacional') {
      res.status(200).json(calcularSimplesNacionalRTC(parseJsonBody<RtcSimplesNacionalRequest>(req)));
      return;
    }
    if (route === 'danfse/parse') {
      const body = parseJsonBody<{ xml?: string }>(req);
      if (!body.xml) {
        res.status(400).json({ error: 'Informe o conteúdo XML no campo "xml".' });
        return;
      }
      res.status(200).json(parseNFSeXmlParaDANFSe(body.xml));
      return;
    }
  }

  res.status(404).json({ error: `Endpoint RTC não encontrado: ${method} /api/calculadora/${route}` });
}

// ---------------------------------------------------------------------------
// Entrypoint Único
// ---------------------------------------------------------------------------
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const method = (req.method || 'GET').toUpperCase();
  const fullPath = resolveApiPath(req);
  const slashIdx = fullPath.indexOf('/');
  const resource = (slashIdx === -1 ? fullPath : fullPath.slice(0, slashIdx)).toLowerCase();
  const subPath = slashIdx === -1 ? '' : fullPath.slice(slashIdx + 1);

  if (resource === '' || resource === 'health') {
    res.status(200).json({ status: 'online', motorRTC: RTC_VERSAO_MOTOR.versao });
    return;
  }
  if (resource === 'ncms') {
    await handleNcms(method, subPath, req, res);
    return;
  }
  if (resource === 'cfops') {
    handleCfops(method, subPath, req, res);
    return;
  }
  if (resource === 'ufs') {
    handleUfs(method, subPath, req, res);
    return;
  }
  if (resource === 'gemini') {
    await handleGemini(method, subPath, req, res);
    return;
  }
  if (resource === 'calculadora') {
    handleCalculadora(method, subPath, req, res);
    return;
  }

  res.status(404).json({ error: `Rota de API não encontrada: ${method} /api/${fullPath}` });
}
