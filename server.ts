import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_CFOPS } from './src/data/cfops';
import { INITIAL_UFS } from './src/data/ufs';
import { INITIAL_ST_REGRAS, INITIAL_SUFRAMA_REGRAS } from './src/data/stAndSuframa';
import { INITIAL_SEFAZ_REJEICOES } from './src/data/sefazRejections';
import {
  buscarNCMsNoCatalogoAsync,
  buscarNCMPorCodigoAsync,
  importarLoteNCMs,
  obterStatusCatalogoTIPIAsync,
} from './src/services/tipiCatalogService';
import {
  buscarCFOPsNoCatalogo,
  buscarCFOPPorCodigo,
  importarLoteCFOPs,
  obterStatusCatalogoCFOP,
} from './src/services/cfopCatalogService';
import { RTC_VERSAO_MOTOR } from './src/data/rtcTabelasOficiais';
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
} from './src/services/rtcCalculadoraService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client (server-side only)
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey || 'dummy-key-for-init',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory data store for administrative CRUD operations & live edits
let cfopsDB = [...INITIAL_CFOPS];
let ufsDB = [...INITIAL_UFS];
let stRulesDB = [...INITIAL_ST_REGRAS];
let suframaDB = [...INITIAL_SUFRAMA_REGRAS];
let sefazDB = [...INITIAL_SEFAZ_REJEICOES];
let calculationHistoryDB: any[] = [];
let userNotesDB: Record<string, string> = {};

// ==========================================
// REST API: Data & Admin CRUD
// ==========================================

// CFOPs: Catálogo Remoto e Busca Universal SINIEF / SEFAZ
app.get('/api/cfops', (req: Request, res: Response) => {
  const { q, tipo, abrangencia, grupo, apenasFavoritos, page, limit } = req.query;

  // Se nenhum parâmetro de filtro assíncrono ou paginação foi enviado, retorna lista básica
  if (!q && !tipo && !abrangencia && !grupo && !apenasFavoritos && !page && !limit) {
    const todos = buscarCFOPsNoCatalogo({ limit: 1000 });
    res.json({ data: todos.data, total: todos.total });
    return;
  }

  const resultado = buscarCFOPsNoCatalogo({
    q: typeof q === 'string' ? q : '',
    tipo: typeof tipo === 'string' ? (tipo as any) : 'todos',
    abrangencia: typeof abrangencia === 'string' ? (abrangencia as any) : 'todos',
    grupo: typeof grupo === 'string' ? grupo : 'todos',
    apenasFavoritos: apenasFavoritos === 'true',
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 50,
  });

  res.json(resultado);
});

app.get('/api/cfops/status', (_req: Request, res: Response) => {
  res.json(obterStatusCatalogoCFOP());
});

app.get('/api/cfops/:codigo', (req: Request, res: Response) => {
  const { codigo } = req.params;
  const cfop = buscarCFOPPorCodigo(codigo);
  if (cfop) {
    res.json({ data: cfop });
  } else {
    res.status(404).json({ error: 'CFOP não localizado na Tabela SINIEF' });
  }
});

app.post('/api/cfops/importar', (req: Request, res: Response) => {
  const { itens } = req.body;
  if (!Array.isArray(itens)) {
    res.status(400).json({ error: 'O corpo da requisição deve conter um array "itens".' });
    return;
  }
  const resultado = importarLoteCFOPs(itens);
  res.json(resultado);
});

app.post('/api/cfops/sincronizar', (_req: Request, res: Response) => {
  const status = obterStatusCatalogoCFOP();
  res.json({
    sucesso: true,
    mensagem: 'Catálogo de CFOPs sincronizado com sucesso com as tabelas do SINIEF/SEFAZ.',
    status,
  });
});

app.post('/api/cfops', (req: Request, res: Response) => {
  const newCFOP = {
    ...req.body,
    id: `cfop-${Date.now()}`,
    dataAtualizacao: new Date().toISOString().split('T')[0],
  };
  cfopsDB.unshift(newCFOP);
  importarLoteCFOPs([newCFOP]);
  res.status(201).json(newCFOP);
});

app.put('/api/cfops/:codigo', (req: Request, res: Response) => {
  const { codigo } = req.params;
  const index = cfopsDB.findIndex((c) => c.codigo === codigo);
  if (index !== -1) {
    cfopsDB[index] = {
      ...cfopsDB[index],
      ...req.body,
      dataAtualizacao: new Date().toISOString().split('T')[0],
    };
    res.json(cfopsDB[index]);
  } else {
    res.status(404).json({ error: 'CFOP não encontrado' });
  }
});

// UFs & Alíquotas
app.get('/api/ufs', (_req: Request, res: Response) => {
  res.json({ data: ufsDB });
});

app.put('/api/ufs/:sigla', (req: Request, res: Response) => {
  const { sigla } = req.params;
  const index = ufsDB.findIndex((u) => u.sigla.toUpperCase() === sigla.toUpperCase());
  if (index !== -1) {
    ufsDB[index] = {
      ...ufsDB[index],
      ...req.body,
      dataAtualizacao: new Date().toISOString().split('T')[0],
    };
    res.json(ufsDB[index]);
  } else {
    res.status(404).json({ error: 'UF não encontrada' });
  }
});

// ST Rules
app.get('/api/st-rules', (_req: Request, res: Response) => {
  res.json({ data: stRulesDB });
});

app.post('/api/st-rules', (req: Request, res: Response) => {
  const newRule = {
    ...req.body,
    id: `st-${Date.now()}`,
    dataAtualizacao: new Date().toISOString().split('T')[0],
  };
  stRulesDB.unshift(newRule);
  res.status(201).json(newRule);
});

// Suframa Rules
app.get('/api/suframa-rules', (_req: Request, res: Response) => {
  res.json({ data: suframaDB });
});

// SEFAZ Rejections
app.get('/api/sefaz-rejections', (_req: Request, res: Response) => {
  res.json({ data: sefazDB });
});

app.post('/api/sefaz-rejections', (req: Request, res: Response) => {
  const newRej = {
    ...req.body,
    dataAtualizacao: new Date().toISOString().split('T')[0],
    historicoOcorrencias: req.body.historicoOcorrencias || 1,
  };
  sefazDB.unshift(newRej);
  res.status(201).json(newRej);
});

// Calculation History
app.get('/api/calculations/history', (_req: Request, res: Response) => {
  res.json({ data: calculationHistoryDB.slice(0, 50) });
});

app.post('/api/calculations/history', (req: Request, res: Response) => {
  const entry = {
    id: `calc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...req.body,
  };
  calculationHistoryDB.unshift(entry);
  if (calculationHistoryDB.length > 100) calculationHistoryDB.pop();
  res.status(201).json(entry);
});

// Notes
app.get('/api/notes', (_req: Request, res: Response) => {
  res.json({ data: userNotesDB });
});

app.post('/api/notes', (req: Request, res: Response) => {
  const { key, text } = req.body;
  if (key) {
    userNotesDB[key] = text;
  }
  res.json({ success: true, key, text });
});

// ==========================================
// REST API: Catálogo Remoto NCM / TIPI (Siscomex + BrasilAPI + Curadoria Local)
// ==========================================
app.get('/api/ncms', async (req: Request, res: Response) => {
  try {
    const { q, capitulo, setor, onlyST, onlyMonofasico, page, limit, compact } = req.query;

    const resultado = await buscarNCMsNoCatalogoAsync({
      q: typeof q === 'string' ? q : '',
      capitulo: typeof capitulo === 'string' ? capitulo : '',
      setor: typeof setor === 'string' ? setor : '',
      onlyST: onlyST === 'true',
      onlyMonofasico: onlyMonofasico === 'true',
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
      compact: compact === 'true',
    });

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(resultado);
  } catch (error) {
    console.error('[server /api/ncms] Erro:', error);
    res.status(500).json({ error: 'Erro interno ao consultar o catálogo oficial de NCMs.' });
  }
});

app.get('/api/ncms/status', async (_req: Request, res: Response) => {
  try {
    const status = await obterStatusCatalogoTIPIAsync(false);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(status);
  } catch (error) {
    console.error('[server /api/ncms/status] Erro:', error);
    res.status(500).json({ error: 'Erro interno ao consultar status do catálogo NCM.' });
  }
});

app.get('/api/ncms/:codigo', async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    const ncm = await buscarNCMPorCodigoAsync(codigo);
    if (ncm) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json({ data: ncm });
    } else {
      res.status(404).json({ error: 'NCM não localizado na Tabela TIPI / Siscomex' });
    }
  } catch (error) {
    console.error('[server /api/ncms/:codigo] Erro:', error);
    res.status(500).json({ error: 'Erro interno ao consultar o código NCM.' });
  }
});

app.post('/api/ncms/importar', (req: Request, res: Response) => {
  const { itens } = req.body;
  if (!Array.isArray(itens)) {
    res.status(400).json({ error: 'O corpo da requisição deve conter um array "itens".' });
    return;
  }
  const resultado = importarLoteNCMs(itens);
  res.json(resultado);
});

app.post('/api/ncms/sincronizar', async (_req: Request, res: Response) => {
  try {
    const status = await obterStatusCatalogoTIPIAsync(true);
    const origem =
      status.fonteAtiva === 'siscomex'
        ? `Portal Único Siscomex (${status.atoLegal})`
        : status.fonteAtiva === 'brasilapi'
        ? 'BrasilAPI (Tabela NCM Oficial)'
        : 'Base Local Curada (modo contingência)';

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      sucesso: true,
      mensagem: `Catálogo NCM sincronizado com ${origem}: ${status.totalRegistros.toLocaleString('pt-BR')} códigos ativos.`,
      status,
    });
  } catch (error) {
    console.error('[server /api/ncms/sincronizar] Erro:', error);
    res.status(500).json({ error: 'Erro ao sincronizar catálogo oficial de NCMs.' });
  }
});

// ==========================================
// REST API: Calculadora RTC Offline (Receita Federal — Portaria COTEC 342/2026)
// ==========================================
app.get('/api/calculadora/status', (_req: Request, res: Response) => {
  res.json({ status: 'online', ...RTC_VERSAO_MOTOR });
});

app.get('/api/calculadora/dados-abertos/*', (req: Request, res: Response) => {
  const subTabela = req.path.replace(/^\/api\/calculadora\/dados-abertos\//i, '').toLowerCase();
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const cst = typeof req.query.cst === 'string' ? req.query.cst : undefined;
  const uf = typeof req.query.uf === 'string' ? req.query.uf : undefined;
  const ano = typeof req.query.ano === 'string' ? parseInt(req.query.ano, 10) : undefined;

  res.json(
    consultarDadosAbertosRTC(subTabela, {
      q,
      cst,
      uf,
      ano: Number.isFinite(ano) ? ano : undefined,
    })
  );
});

app.post('/api/calculadora/regime-geral', (req: Request, res: Response) => {
  res.json(calcularRegimeRegular(req.body));
});

app.post('/api/calculadora/observabilidade/regime-geral', (req: Request, res: Response) => {
  res.json(calcularRegimeRegularObservabilidade(req.body));
});

app.post('/api/calculadora/base-calculo/base-calculo-unificada', (req: Request, res: Response) => {
  res.json(calcularBaseUnificadaNFe(req.body));
});

app.post('/api/calculadora/base-calculo/base-calculo-unificada-nfse', (req: Request, res: Response) => {
  res.json(calcularBaseUnificadaNFSe(req.body));
});

app.post('/api/calculadora/xml/generate', (req: Request, res: Response) => {
  const tipo = String(req.query.tipo || req.body?.tipo || 'NFE').toUpperCase() as 'NFE' | 'NFSE';
  const resultado = calcularRegimeRegular(req.body);
  const xml = gerarXmlGruposRTC(resultado, tipo);
  res.json({ tipo, xml, resultado });
});

app.post('/api/calculadora/xml/validate', (req: Request, res: Response) => {
  const tipo = String(req.query.tipo || req.body?.tipo || 'NFE').toUpperCase() as 'NFE' | 'NFSE';
  res.json(validarXmlGruposRTC(req.body?.xml || '', tipo));
});

app.post('/api/calculadora/simples-nacional', (req: Request, res: Response) => {
  res.json(calcularSimplesNacionalRTC(req.body));
});

app.post('/api/calculadora/danfse/parse', (req: Request, res: Response) => {
  if (!req.body?.xml) {
    res.status(400).json({ error: 'Informe o conteúdo XML no campo "xml".' });
    return;
  }
  res.json(parseNFSeXmlParaDANFSe(req.body.xml));
});

// ==========================================
// GEMINI API: Search Grounding (Live Legislation)
// Model: gemini-3.8-flash with googleSearch tool
// ==========================================
app.post('/api/gemini/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query é obrigatória' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(400).json({
        error: 'Chave GEMINI_API_KEY não configurada. Configure sua API key no painel Settings > Secrets do AI Studio.',
      });
      return;
    }

    const systemInstruction = `Você é o Consultor Fiscal do FiscalDesk, especialista em direito tributário brasileiro, ICMS, ICMS-ST, DIFAL, Suframa, CFOPs e regras da SEFAZ.
Responda com precisão técnica e cite sempre a legislação vigente (Convênios CONFAZ, Leis Complementares, Decretos estaduais ou Notas Técnicas da SEFAZ).
Mencione a data de vigência e as UFs envolvidas.
Utilize a ferramenta de busca do Google para obter as informações mais atualizadas da legislação fiscal brasileira.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || 'Sem resposta para a consulta.';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources = groundingChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({
        title: c.web.title || c.web.uri,
        uri: c.web.uri,
      }));

    res.json({
      answer: text,
      sources,
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erro na busca de legislação com Gemini:', error);
    res.status(500).json({
      error: error.message || 'Erro ao consultar a legislação via Gemini Search Grounding',
    });
  }
});

// ==========================================
// GEMINI API: Deep Fiscal XML & Rejection Diagnosis
// ==========================================
app.post('/api/gemini/diagnose', async (req: Request, res: Response) => {
  try {
    const { xmlOuMensagem } = req.body;
    if (!xmlOuMensagem) {
      res.status(400).json({ error: 'XML ou mensagem de erro não fornecido' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(400).json({
        error: 'Chave GEMINI_API_KEY não configurada no ambiente do servidor.',
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Analise a seguinte ocorrência fiscal ou XML de NF-e na SEFAZ:
${xmlOuMensagem}

Explique em linguagem simples e técnica:
1. Qual a causa provável da rejeição ou erro fiscal.
2. Passo a passo exato para correção no ERP/sistema emissor.
3. Tags do XML afetadas e exemplo de preenchimento correto.
4. Fundamento legal ou Nota Técnica correspondente.`,
    });

    res.json({ diagnosis: response.text });
  } catch (error: any) {
    console.error('Erro no diagnóstico fiscal Gemini:', error);
    res.status(500).json({ error: error.message || 'Erro ao realizar diagnóstico' });
  }
});

// ==========================================
// Vite Middleware / Static Serve
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`FiscalDesk rodando na porta ${port}`);
  });
}

startServer();
