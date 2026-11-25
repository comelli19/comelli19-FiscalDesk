// Single Vercel Serverless Function handling all official /api/calculadora/* endpoints
// Compatível com Portaria COTEC nº 342/2026 (Receita Federal — RTC Calculadora Offline)

import type { ApiRequest, ApiResponse } from '../_types';
import { getQueryString, parseJsonBody } from '../_types';
import { RTC_VERSAO_MOTOR } from '../../src/data/rtcTabelasOficiais';
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
} from '../../src/services/rtcCalculadoraService';

function resolveRoutePath(req: ApiRequest): string {
  const pathParam = req.query?.path;
  if (Array.isArray(pathParam) && pathParam.length > 0) {
    return pathParam.join('/').toLowerCase();
  }
  if (typeof pathParam === 'string' && pathParam.length > 0) {
    return pathParam.toLowerCase();
  }
  if (req.url) {
    const cleanUrl = req.url.split('?')[0];
    const idx = cleanUrl.indexOf('/api/calculadora/');
    if (idx !== -1) {
      return cleanUrl.slice(idx + '/api/calculadora/'.length).replace(/^\/+|\/+$/g, '').toLowerCase();
    }
  }
  return '';
}

export default function handler(req: ApiRequest, res: ApiResponse) {
  const method = (req.method || 'GET').toUpperCase();
  const route = resolveRoutePath(req);

  // Status & metadados da Calculadora RTC (inclui GET /versao/status da v1.7.2)
  if (method === 'GET' && (route === '' || route === 'status' || route === 'versao' || route === 'versao/status')) {
    return res.status(200).json({
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
  }

  // Dados Abertos (GET /api/calculadora/dados-abertos/*)
  if (method === 'GET' && route.startsWith('dados-abertos/')) {
    const subTabela = route.replace('dados-abertos/', '');
    const q = getQueryString(req.query, 'q');
    const cst = getQueryString(req.query, 'cst');
    const uf = getQueryString(req.query, 'uf');
    const anoStr = getQueryString(req.query, 'ano');
    const ano = anoStr ? parseInt(anoStr, 10) : undefined;

    return res.status(200).json(
      consultarDadosAbertosRTC(subTabela, {
        q,
        cst,
        uf,
        ano: Number.isFinite(ano) ? ano : undefined,
      })
    );
  }

  // POST Endpoints
  if (method === 'POST') {
    if (route === 'regime-geral') {
      const body = parseJsonBody<RtcRegimeRegularRequest>(req);
      return res.status(200).json(calcularRegimeRegular(body));
    }

    if (route === 'observabilidade/regime-geral') {
      const body = parseJsonBody<RtcRegimeRegularRequest>(req);
      return res.status(200).json(calcularRegimeRegularObservabilidade(body));
    }

    if (route === 'base-calculo/base-calculo-unificada') {
      const body = parseJsonBody<RtcBaseUnificadaNFeInput>(req);
      return res.status(200).json(calcularBaseUnificadaNFe(body));
    }

    if (route === 'base-calculo/base-calculo-unificada-nfse') {
      const body = parseJsonBody<RtcBaseUnificadaNFSeInput>(req);
      return res.status(200).json(calcularBaseUnificadaNFSe(body));
    }

    if (route === 'xml/generate') {
      const body = parseJsonBody<RtcRegimeRegularRequest & { tipo?: 'NFE' | 'NFSE' }>(req);
      const tipo = (getQueryString(req.query, 'tipo') || body.tipo || 'NFE').toUpperCase() as 'NFE' | 'NFSE';
      const resultado = calcularRegimeRegular(body);
      const xml = gerarXmlGruposRTC(resultado, tipo);
      return res.status(200).json({ tipo, xml, resultado });
    }

    if (route === 'xml/validate') {
      const body = parseJsonBody<{ xml?: string; tipo?: 'NFE' | 'NFSE' }>(req);
      const tipo = (getQueryString(req.query, 'tipo') || body.tipo || 'NFE').toUpperCase() as 'NFE' | 'NFSE';
      const validacao = validarXmlGruposRTC(body.xml || '', tipo);
      return res.status(200).json(validacao);
    }

    if (route === 'simples-nacional') {
      const body = parseJsonBody<RtcSimplesNacionalRequest>(req);
      return res.status(200).json(calcularSimplesNacionalRTC(body));
    }

    if (route === 'danfse/parse') {
      const body = parseJsonBody<{ xml?: string }>(req);
      if (!body.xml) {
        return res.status(400).json({ error: 'Informe o conteúdo XML no campo "xml".' });
      }
      return res.status(200).json(parseNFSeXmlParaDANFSe(body.xml));
    }
  }

  return res.status(404).json({
    error: `Endpoint RTC não encontrado: ${method} /api/calculadora/${route}`,
  });
}
