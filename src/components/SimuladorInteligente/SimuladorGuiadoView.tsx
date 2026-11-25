import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UFInfo, NCMInfo, CFOP, STRegra, RegimeTributarioUniversal } from '../../types/fiscal';
import {
  DadosEtapa1Operacao,
  DadosEtapa2Caracteristicas,
  DadosEtapa3Produto,
  FinalidadeMercadoria,
  OperacaoSimuladorSnapshot,
} from '../../types/motorRegras';
import { executarMotorFiscalInteligente } from '../../services/motorFiscalDecisao';
import { ImportadorXMLModal } from '../ImportadorXML/ImportadorXMLModal';
import { DadosNFeExtraidos, XMLItemProduto } from '../../services/xmlNFeParser';
import { resolverNCMUniversal } from '../../services/ncmCatalogoUniversal';
import { buscarNCMsRemoto, obterNCMPorCodigoRemoto } from '../../services/ncmAsyncService';
import { buscarCFOPsRemoto, obterCFOPPorCodigoRemoto } from '../../services/cfopAsyncService';
import { resolverCFOPUniversal } from '../../services/cfopCatalogService';
import { iniciarHidratacaoPreguicosaNCM } from '../../services/ncmLazyCacheHydrator';
import {
  buscarMunicipiosPorUF,
  extrairSiglaUF,
  obterMunicipioPadraoDestino,
  obterMunicipiosLocaisPorUF,
} from '../../services/municipiosService';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  Layers,
  FileSpreadsheet,
  Download,
  Copy,
  Info,
  Search,
  Check,
  ShieldCheck,
  RotateCcw,
  ArrowRightLeft,
  Calculator,
  ListFilter,
  TrendingDown,
  Globe2,
  Truck,
  Edit2,
  X,
  Filter,
  UploadCloud,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileCode,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

interface SimuladorGuiadoViewProps {
  ufs: UFInfo[];
  ncms: NCMInfo[];
  cfops?: CFOP[];
  stRules?: STRegra[];
  ufOrigem?: string;
  setUfOrigem?: (uf: string) => void;
  ufDestino?: string;
  setUfDestino?: (uf: string) => void;
  onOpenAuditDrawer?: () => void;
  onSimulationChange?: (snapshot: OperacaoSimuladorSnapshot) => void;
  externalXMLData?: DadosNFeExtraidos | null;
  onClearExternalXML?: () => void;
}

export const SimuladorGuiadoView: React.FC<SimuladorGuiadoViewProps> = ({
  ufs,
  ncms,
  cfops = [],
  stRules,
  ufOrigem: ufOrigemProp,
  setUfOrigem: setUfOrigemProp,
  ufDestino: ufDestinoProp,
  setUfDestino: setUfDestinoProp,
  onOpenAuditDrawer,
  onSimulationChange,
  externalXMLData = null,
  onClearExternalXML,
}) => {
  // Current Step: 1, 2, 3 or 4
  const [etapaAtual, setEtapaAtual] = useState<1 | 2 | 3 | 4>(1);

  // Modo de visualização integrada na Etapa 4:
  // 'executiva' | 'espelho_planilha' | 'comparador' | 'devolucao' | 'auditoria_xml'
  const [modoResultado, setModoResultado] = useState<
    'executiva' | 'espelho_planilha' | 'comparador' | 'devolucao' | 'auditoria_xml'
  >('executiva');

  // MVA personalizada e editável para DIFAL
  const [mvaPersonalizada, setMvaPersonalizada] = useState<string>('');

  // Copy feedback
  const [copiado, setCopiado] = useState(false);

  // XML Ingestion & Audit states
  const [isModalXMLAberta, setIsModalXMLAberta] = useState(false);
  const [nfeAuditada, setNfeAuditada] = useState<DadosNFeExtraidos | null>(null);
  const [itemNFeIndex, setItemNFeIndex] = useState(0);

  // CFOP selection states (acesso a todos os 620+ CFOPs SINIEF via IndexedDB/API)
  const [modoCFOP, setModoCFOP] = useState<'auto' | 'manual'>('auto');
  const [termoBuscaCFOP, setTermoBuscaCFOP] = useState('');
  const [filtroSentidoCFOP, setFiltroSentidoCFOP] = useState<'todos' | 'saida' | 'entrada'>('saida');
  const [cfopsRemotos, setCfopsRemotos] = useState<CFOP[]>([]);
  const [totalCfopsCatalogo, setTotalCfopsCatalogo] = useState<number>(cfops.length);
  const [limiteCfopLista, setLimiteCfopLista] = useState<number>(60);
  const [carregandoCFOPRemoto, setCarregandoCFOPRemoto] = useState(false);
  const [cfopSelecionadoObj, setCfopSelecionadoObj] = useState<CFOP | null>(null);
  const [cfopManualInput, setCfopManualInput] = useState('');
  const [resolvendoCfopManual, setResolvendoCfopManual] = useState(false);

  // Busca paginada no catálogo completo de CFOPs (inclusive sem termo digitado)
  useEffect(() => {
    if (modoCFOP !== 'manual') return;
    let ativo = true;

    const delay = termoBuscaCFOP.trim() ? 220 : 0;
    const timer = setTimeout(async () => {
      setCarregandoCFOPRemoto(true);
      try {
        const resp = await buscarCFOPsRemoto({
          q: termoBuscaCFOP.trim() || undefined,
          tipo: filtroSentidoCFOP !== 'todos' ? filtroSentidoCFOP : undefined,
          page: 1,
          limit: limiteCfopLista,
        });
        if (!ativo) return;
        setCfopsRemotos(resp.data || []);
        if (typeof resp.total === 'number' && resp.total > 0) {
          setTotalCfopsCatalogo(resp.total);
        }
      } catch (err) {
        console.warn('Erro ao buscar CFOPs remotamente no simulador:', err);
      } finally {
        if (ativo) setCarregandoCFOPRemoto(false);
      }
    }, delay);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [modoCFOP, termoBuscaCFOP, filtroSentidoCFOP, limiteCfopLista]);

  // Search, chapter and sector filters for NCM in Step 3 (acesso aos 10.500+ NCMs oficiais Siscomex/TIPI)
  const [termoBuscaNCM, setTermoBuscaNCM] = useState('');
  const [setorNCM, setSetorNCM] = useState<string>('todos');
  const [capituloNCM, setCapituloNCM] = useState<string>('todos');
  const [capitulosDisponiveisNCM, setCapitulosDisponiveisNCM] = useState<
    Array<{ capitulo: string; titulo: string }>
  >([]);
  const [ncmManualInput, setNcmManualInput] = useState('');
  const [resolvendoNcmManual, setResolvendoNcmManual] = useState(false);
  const [ncmsRemotos, setNcmsRemotos] = useState<NCMInfo[]>([]);
  const [totalNcmsCatalogo, setTotalNcmsCatalogo] = useState<number>(ncms.length);
  const [limiteNcmLista, setLimiteNcmLista] = useState<number>(60);
  const [carregandoNCMRemoto, setCarregandoNCMRemoto] = useState(false);
  const [ncmSelecionadoObj, setNcmSelecionadoObj] = useState<NCMInfo | null>(
    () => ncms.find((n) => n.codigo.replace(/\D/g, '') === '39253000') || null
  );

  // Hidrata silenciosamente o catálogo completo de NCMs no IndexedDB ao entrar na Etapa 3
  useEffect(() => {
    if (etapaAtual === 3) {
      iniciarHidratacaoPreguicosaNCM();
    }
  }, [etapaAtual]);

  // Busca paginada no catálogo oficial completo de NCMs (Siscomex/TIPI/IndexedDB)
  useEffect(() => {
    if (etapaAtual !== 3) return;
    let ativo = true;

    const delay = termoBuscaNCM.trim() ? 220 : 0;
    const timer = setTimeout(async () => {
      setCarregandoNCMRemoto(true);
      try {
        const resp = await buscarNCMsRemoto({
          q: termoBuscaNCM.trim() || undefined,
          capitulo: capituloNCM !== 'todos' ? capituloNCM : undefined,
          setor: setorNCM !== 'todos' ? setorNCM : undefined,
          page: 1,
          limit: limiteNcmLista,
        });
        if (!ativo) return;
        setNcmsRemotos(resp.data || []);
        if (typeof resp.total === 'number' && resp.total > 0) {
          setTotalNcmsCatalogo(resp.total);
        }
        if (resp.capitulosDisponiveis && resp.capitulosDisponiveis.length > 0) {
          setCapitulosDisponiveisNCM(resp.capitulosDisponiveis);
        }
      } catch (err) {
        console.warn('Erro ao buscar NCMs remotamente no simulador:', err);
      } finally {
        if (ativo) setCarregandoNCMRemoto(false);
      }
    }, delay);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [etapaAtual, termoBuscaNCM, setorNCM, capituloNCM, limiteNcmLista]);

  // Devolução percentual state for tab 4
  const [percentualDevolucao, setPercentualDevolucao] = useState<number>(100);

  // Carrega os dados de um XML de NF-e diretamente para o simulador
  const handleCarregarXMLNoSimulador = (dadosXML: DadosNFeExtraidos, itemIdx = 0) => {
    const item = dadosXML.itens[itemIdx] || dadosXML.itens[0];
    if (!item) return;

    // Identifica regime
    let regime: RegimeTributarioUniversal = 'lucro_presumido';
    if (dadosXML.emitente.crt === '1') regime = 'simples_nacional';
    else if (dadosXML.emitente.crt === '2') regime = 'lucro_presumido';
    else if (dadosXML.emitente.crt === '3') regime = 'lucro_real';

    const ehInterna = dadosXML.emitente.uf === dadosXML.destinatario.uf;
    const ehExterior = dadosXML.destinatario.uf === 'EX';
    const munDestUpper = (dadosXML.destinatario.municipio || '').toUpperCase();
    const isMunicipioZFM =
      Boolean(dadosXML.destinatario.envolveZFM) ||
      munDestUpper.includes('MANAUS') ||
      munDestUpper.includes('MACAP') ||
      munDestUpper.includes('SANTANA') ||
      munDestUpper.includes('BOA VISTA') ||
      munDestUpper.includes('TABATINGA') ||
      munDestUpper.includes('GUAJAR');

    const ufDestFormatada = ehExterior
      ? 'EXTERIOR / EX'
      : isMunicipioZFM && dadosXML.destinatario.uf === 'AP'
      ? 'MACAPÁ / AP'
      : isMunicipioZFM && dadosXML.destinatario.uf === 'AM'
      ? 'MANAUS / AM'
      : isMunicipioZFM && dadosXML.destinatario.uf === 'RR'
      ? 'BOA VISTA / RR'
      : dadosXML.destinatario.uf || 'SP';

    // Etapa 1
    setModoCFOP(item.cfop ? 'manual' : 'auto');
    setEtapa1({
      regimeTributario: regime,
      ufOrigem: dadosXML.emitente.uf || 'RS',
      ufDestino: ufDestFormatada,
      municipioDestino: dadosXML.destinatario.municipio || obterMunicipioPadraoDestino(ufDestFormatada) || 'Capital / Polo',
      tipoOperacao: ehExterior ? 'exterior' : ehInterna ? 'interna' : 'interestadual',
      emissaoPropria: 'PRÓPRIA',
      cfopManual: item.cfop || '',
    });

    // Etapa 2
    const temIE = Boolean(dadosXML.destinatario.possuiIE);
    const consumidorFinal = dadosXML.destinatario.indIEDest === '9' || !temIE;
    const cfopDigitos = (item.cfop || '').replace(/\D/g, '');
    const ehRevendaXML = ['102', '104', '108', '403', '404', '405'].includes(cfopDigitos.slice(1));

    setEtapa2({
      finalidadeMercadoria: consumidorFinal
        ? 'consumo'
        : ehRevendaXML
        ? 'comercializacao'
        : 'industrializacao',
      destinatarioContribuinte: dadosXML.destinatario.indIEDest === '1',
      destinatarioPossuiIE: temIE,
      consumidorFinal,
      origemMercadoria: item.origemMercadoria || '0',
      envolveZFMouALC: isMunicipioZFM,
      geraFinanceiro: true,
      movimentaEstoque: true,
    });

    // Etapa 3
    setEtapa3({
      descricaoComercial: item.xProd || 'Produto importado do XML da NF-e',
      ncmCodigo: item.ncm || '39253000',
      ncmDescricao: item.xProd || 'Classificação NCM conforme NF-e',
      aliquotaIPIPadrao: item.aliquotaIPI || 0,
      origemMercadoria: item.origemMercadoria || '0',
      quantidade: item.qCom || 1,
      valorUnitario: item.vUnCom || item.vProd,
      valorTotal: item.vProd || 1000,
    });

    // Resolve objetos completos de NCM e CFOP no catálogo oficial (IndexedDB/API)
    if (item.ncm) {
      obterNCMPorCodigoRemoto(item.ncm)
        .then((obj) => {
          if (obj) setNcmSelecionadoObj(obj);
        })
        .catch(() => {});
    }
    if (item.cfop) {
      obterCFOPPorCodigoRemoto(item.cfop)
        .then((obj) => {
          if (obj) setCfopSelecionadoObj(obj);
        })
        .catch(() => {});
    }

    setNfeAuditada(dadosXML);
    setItemNFeIndex(itemIdx);
    setModoResultado('auditoria_xml');
    setEtapaAtual(4); // Salta imediatamente para a Etapa 4 de Auditoria & Enquadramento
  };

  // Reage se vier XML externo via prop
  useEffect(() => {
    if (externalXMLData) {
      handleCarregarXMLNoSimulador(externalXMLData, 0);
    }
  }, [externalXMLData]);

  // -------------------------------------------------------------
  // DADOS DA ETAPA 1 – IDENTIFICAÇÃO DA OPERAÇÃO
  // -------------------------------------------------------------
  const [etapa1, setEtapa1] = useState<DadosEtapa1Operacao>(() => {
    const origInicial = ufOrigemProp || 'RS';
    const destInicial =
      ufDestinoProp && ufDestinoProp !== 'AP'
        ? ufDestinoProp
        : ufDestinoProp === 'AP'
        ? 'MACAPÁ / AP'
        : 'MACAPÁ / AP';
    const siglaDest = extrairSiglaUF(destInicial);
    const ehExt = siglaDest === 'EX';
    const ehInt = !ehExt && siglaDest === origInicial && !destInicial.includes('/');
    return {
      regimeTributario: 'lucro_presumido',
      ufOrigem: origInicial,
      ufDestino: destInicial,
      municipioDestino: ehExt
        ? 'Exterior'
        : obterMunicipioPadraoDestino(destInicial) || 'Macapá',
      tipoOperacao: ehExt ? 'exterior' : ehInt ? 'interna' : 'interestadual',
      emissaoPropria: 'PRÓPRIA',
      cfopManual: '',
    };
  });

  // Sincroniza quando o usuário navega a partir do Mapa Fiscal com outra rota UF
  const lastPropRouteRef = useRef<string>(`${ufOrigemProp || ''}|${ufDestinoProp || ''}`);
  useEffect(() => {
    const chave = `${ufOrigemProp || ''}|${ufDestinoProp || ''}`;
    if (!ufOrigemProp || !ufDestinoProp || chave === lastPropRouteRef.current) return;
    lastPropRouteRef.current = chave;

    const siglaDest = extrairSiglaUF(ufDestinoProp);
    const ehExt = siglaDest === 'EX';
    const ehInt = !ehExt && siglaDest === ufOrigemProp;
    const ehZFM = !ehExt && !ehInt && ['AM', 'AP', 'RR'].includes(siglaDest);
    const destFormatada = ehExt
      ? 'EXTERIOR / EX'
      : siglaDest === 'AP' && !ehInt
      ? 'MACAPÁ / AP'
      : siglaDest === 'AM' && !ehInt
      ? 'MANAUS / AM'
      : ufDestinoProp;

    setEtapa1((prev) => ({
      ...prev,
      ufOrigem: ufOrigemProp,
      ufDestino: destFormatada,
      tipoOperacao: ehExt ? 'exterior' : ehInt ? 'interna' : 'interestadual',
      municipioDestino: ehExt
        ? 'Exterior'
        : obterMunicipioPadraoDestino(destFormatada) || prev.municipioDestino,
    }));
    setEtapa2((prev) => ({ ...prev, envolveZFMouALC: ehZFM }));
  }, [ufOrigemProp, ufDestinoProp]);

  // Municípios dinâmicos conforme UF de Destino selecionada
  const [municipiosDestinoLista, setMunicipiosDestinoLista] = useState<string[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [fonteMunicipios, setFonteMunicipios] = useState<'ibge' | 'local'>('local');
  const [dropdownMunicipioAberto, setDropdownMunicipioAberto] = useState(false);
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const municipioDropdownRef = useRef<HTMLDivElement | null>(null);

  const siglaUFDestino = useMemo(
    () => extrairSiglaUF(etapa1.ufDestino),
    [etapa1.ufDestino]
  );

  useEffect(() => {
    let ativo = true;
    const imediato = obterMunicipiosLocaisPorUF(etapa1.ufDestino);
    setMunicipiosDestinoLista(imediato.municipios);
    setFonteMunicipios(imediato.fonte);

    if (imediato.fonte === 'ibge') {
      setCarregandoMunicipios(false);
      return;
    }

    setCarregandoMunicipios(true);
    buscarMunicipiosPorUF(etapa1.ufDestino)
      .then((res) => {
        if (!ativo) return;
        setMunicipiosDestinoLista(res.municipios);
        setFonteMunicipios(res.fonte);
      })
      .finally(() => {
        if (ativo) setCarregandoMunicipios(false);
      });

    return () => {
      ativo = false;
    };
  }, [etapa1.ufDestino]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        municipioDropdownRef.current &&
        !municipioDropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownMunicipioAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const municipiosFiltrados = useMemo(() => {
    const termo = filtroMunicipio
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    if (!termo) return municipiosDestinoLista;
    return municipiosDestinoLista.filter((m) =>
      m
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(termo)
    );
  }, [municipiosDestinoLista, filtroMunicipio]);

  // -------------------------------------------------------------
  // DADOS DA ETAPA 2 – CARACTERÍSTICAS DA OPERAÇÃO
  // -------------------------------------------------------------
  const [etapa2, setEtapa2] = useState<DadosEtapa2Caracteristicas>({
    finalidadeMercadoria: 'industrializacao',
    destinatarioContribuinte: true,
    destinatarioPossuiIE: true,
    consumidorFinal: false,
    origemMercadoria: '0', // Nacional
    envolveZFMouALC: true,
    geraFinanceiro: true,
    movimentaEstoque: true,
  });

  // -------------------------------------------------------------
  // DADOS DA ETAPA 3 – INFORMAÇÕES DO PRODUTO
  // -------------------------------------------------------------
  const [etapa3, setEtapa3] = useState<DadosEtapa3Produto>({
    descricaoComercial: 'Artefatos de plástico para construção e industrialização',
    ncmCodigo: '39253000',
    ncmDescricao: 'Artefatos para apetrechamento de construções, de plásticos (TIPI: 0%)',
    aliquotaIPIPadrao: 0,
    origemMercadoria: '0',
    quantidade: 100,
    valorUnitario: 35.0,
    valorTotal: 3500.0,
  });

  // Nomes dos Regimes Tributários
  const nomesRegimes: Record<RegimeTributarioUniversal, string> = {
    lucro_presumido: 'Lucro Presumido',
    lucro_real: 'Lucro Real',
    simples_nacional: 'Simples Nacional',
    mei: 'MEI (Microempreendedor Individual)',
    regime_especial: 'Regime Especial / Diferenciado',
  };

  // Setores econômicos disponíveis nos NCMs
  const setoresDisponiveis = useMemo(() => {
    const s = new Set<string>();
    ncms.forEach((n) => {
      if (n.setor) s.add(n.setor);
    });
    return ['todos', ...Array.from(s).sort()];
  }, [ncms]);

  // Helper para normalizar acentos em buscas textuais
  const normalizarTextoBusca = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  // Lista dinâmica e completa de NCMs filtrados (Siscomex/IndexedDB + Curados + Resolução Universal)
  const ncmsFiltrados = useMemo(() => {
    const mapaCodigos = new Map<string, NCMInfo>();

    // 1. Prioriza os resultados do catálogo completo (10.500+ NCMs via IndexedDB/API)
    ncmsRemotos.forEach((n) => {
      mapaCodigos.set(n.codigo.replace(/\D/g, ''), n);
    });

    // 2. Complementa com base curada local (corrigido bug de cleanNumbers vazio!)
    const termNorm = normalizarTextoBusca(termoBuscaNCM.trim());
    const cleanNumbers = termoBuscaNCM.replace(/\D/g, '');

    ncms.forEach((n) => {
      const cleanCode = n.codigo.replace(/\D/g, '');
      if (setorNCM !== 'todos' && n.setor !== setorNCM) return;
      if (capituloNCM !== 'todos' && cleanCode.slice(0, 2) !== capituloNCM) return;

      if (!termNorm) {
        if (!mapaCodigos.has(cleanCode)) {
          mapaCodigos.set(cleanCode, n);
        }
        return;
      }

      const descNorm = normalizarTextoBusca(n.descricao);
      const setorNorm = n.setor ? normalizarTextoBusca(n.setor) : '';
      if (
        (cleanNumbers.length > 0 && cleanCode.includes(cleanNumbers)) ||
        n.codigo.toLowerCase().includes(termNorm) ||
        descNorm.includes(termNorm) ||
        setorNorm.includes(termNorm)
      ) {
        if (!mapaCodigos.has(cleanCode)) {
          mapaCodigos.set(cleanCode, n);
        }
      }
    });

    const filtrados = Array.from(mapaCodigos.values());

    // Se o usuário digitou um código NCM de 4 a 8 dígitos sem correspondência exata ainda
    if (cleanNumbers.length >= 4 && !filtrados.some((n) => n.codigo.replace(/\D/g, '') === cleanNumbers.padEnd(8, '0'))) {
      const ncmUniversal = resolverNCMUniversal(cleanNumbers.padEnd(8, '0'));
      if (!filtrados.some((n) => n.codigo.replace(/\D/g, '') === ncmUniversal.codigo.replace(/\D/g, ''))) {
        filtrados.push(ncmUniversal);
      }
    }

    return filtrados;
  }, [ncms, setorNCM, capituloNCM, termoBuscaNCM, ncmsRemotos]);

  // CFOPs disponíveis filtrados por sentido e busca (620+ CFOPs SINIEF via IndexedDB/API + Universal)
  const cfopsFiltrados = useMemo(() => {
    const mapaCodigos = new Map<string, CFOP>();

    // 1. Prioriza os CFOPs do catálogo completo (IndexedDB/API)
    cfopsRemotos.forEach((c) => {
      mapaCodigos.set(c.codigo.replace(/\D/g, ''), c);
    });

    // 2. Complementa com base inicial estática (corrigido bug de cleanTerm vazio!)
    const termNorm = normalizarTextoBusca(termoBuscaCFOP.trim());
    const cleanTerm = termoBuscaCFOP.replace(/\D/g, '');

    cfops.forEach((c) => {
      if (filtroSentidoCFOP === 'saida' && c.tipo !== 'saida') return;
      if (filtroSentidoCFOP === 'entrada' && c.tipo !== 'entrada') return;
      const cleanCode = c.codigo.replace(/\D/g, '');
      if (!termNorm) {
        if (!mapaCodigos.has(cleanCode)) {
          mapaCodigos.set(cleanCode, c);
        }
        return;
      }

      if (
        (cleanTerm.length > 0 && cleanCode.includes(cleanTerm)) ||
        c.codigo.toLowerCase().includes(termNorm) ||
        normalizarTextoBusca(c.descricao).includes(termNorm) ||
        normalizarTextoBusca(c.quandoUsar).includes(termNorm)
      ) {
        if (!mapaCodigos.has(cleanCode)) {
          mapaCodigos.set(cleanCode, c);
        }
      }
    });

    const filtrados = Array.from(mapaCodigos.values());

    // 3. Se o usuário digitou um número com 4 dígitos não presente, resolve universalmente
    if (cleanTerm.length === 4) {
      if (!filtrados.some((c) => c.codigo.replace(/\D/g, '') === cleanTerm)) {
        const cfopUniversal = resolverCFOPUniversal(cleanTerm);
        filtrados.unshift(cfopUniversal);
      }
    }

    return filtrados;
  }, [cfops, filtroSentidoCFOP, termoBuscaCFOP, cfopsRemotos]);

  // Executa o motor fiscal universal inteligente com os dados atuais e tabelas de referência
  const resultadoFiscal = useMemo(() => {
    return executarMotorFiscalInteligente({
      etapa1,
      etapa2,
      etapa3,
      ufs,
      ncms,
      cfops,
      stRules,
      ncmSelecionado: ncmSelecionadoObj,
      cfopSelecionado: cfopSelecionadoObj,
      mvaPersonalizada,
    });
  }, [etapa1, etapa2, etapa3, ufs, ncms, cfops, stRules, ncmSelecionadoObj, cfopSelecionadoObj, mvaPersonalizada]);

  // Mantém o Painel de Auditoria sincronizado em tempo real com a operação ativa do simulador
  useEffect(() => {
    onSimulationChange?.({
      etapa1,
      etapa2,
      etapa3,
      resultado: resultadoFiscal,
    });
  }, [etapa1, etapa2, etapa3, resultadoFiscal, onSimulationChange]);

  // Cenários reais calculados pelo motor para o Comparador de Cenários (sem números fixos!)
  const resultadoCenarioInterna = useMemo(() => {
    return executarMotorFiscalInteligente({
      etapa1: {
        ...etapa1,
        tipoOperacao: 'interna',
        ufDestino: etapa1.ufOrigem,
        cfopManual: '',
      },
      etapa2: {
        ...etapa2,
        envolveZFMouALC: false,
      },
      etapa3,
      ufs,
      ncms,
      cfops,
      stRules,
      ncmSelecionado: ncmSelecionadoObj,
    });
  }, [etapa1, etapa2, etapa3, ufs, ncms, cfops, stRules, ncmSelecionadoObj]);

  const resultadoCenarioExportacao = useMemo(() => {
    return executarMotorFiscalInteligente({
      etapa1: {
        ...etapa1,
        tipoOperacao: 'exterior',
        ufDestino: 'EXTERIOR / EX',
        cfopManual: '',
      },
      etapa2: {
        ...etapa2,
        envolveZFMouALC: false,
      },
      etapa3,
      ufs,
      ncms,
      cfops,
      stRules,
      ncmSelecionado: ncmSelecionadoObj,
    });
  }, [etapa1, etapa2, etapa3, ufs, ncms, cfops, stRules, ncmSelecionadoObj]);

  // Lista ordenada das 27 UFs oficiais do Brasil para os seletores da Etapa 1
  const ufsOrdenadas = useMemo(() => {
    return [...ufs].sort((a, b) => a.sigla.localeCompare(b.sigla));
  }, [ufs]);

  // Sincroniza valor total ao alterar quantidade ou valor unitário
  const handleAtualizarPreco = (qtd: number, vlrUnit: number) => {
    setEtapa3((prev) => ({
      ...prev,
      quantidade: qtd,
      valorUnitario: vlrUnit,
      valorTotal: Number((qtd * vlrUnit).toFixed(2)),
    }));
  };

  // Copia resumo completo para área de transferência
  const handleCopiarResumo = () => {
    const stLinha = resultadoFiscal.icmsST.aplicavel
      ? `• ICMS-ST: BC R$ ${resultadoFiscal.icmsST.baseCalculoST.toFixed(2)} | MVA ${resultadoFiscal.icmsST.mvaAplicada.toFixed(2)}%${resultadoFiscal.icmsST.usouMvaOriginalSimples ? ' (Original — Simples Nacional)' : ''} | Valor ST: R$ ${resultadoFiscal.icmsST.valorICMSST.toFixed(2)}${resultadoFiscal.icmsST.valorFCPST > 0 ? ` + FCP-ST (${resultadoFiscal.icmsST.fcpSTAliquota}%): R$ ${resultadoFiscal.icmsST.valorFCPST.toFixed(2)}` : ''}\n`
      : '';
    const difalLinha = resultadoFiscal.difal.aplicavel
      ? `• DIFAL (${resultadoFiscal.difal.tipoDifal === 'contribuinte_uso_consumo_ativo' ? 'Contribuinte Uso/Consumo/Ativo' : 'EC 87/15'}): ${resultadoFiscal.difal.diferencial}% = R$ ${resultadoFiscal.difal.valorDifal.toFixed(2)}${resultadoFiscal.difal.valorFCP > 0 ? ` + FCP ${resultadoFiscal.difal.fcp}% (R$ ${resultadoFiscal.difal.valorFCP.toFixed(2)})` : ''} [Resp.: ${resultadoFiscal.difal.responsavelRecolhimento}]\n`
      : '';
    const desonLinha =
      resultadoFiscal.memoriaCalculo.valorICMSDesonerado > 0
        ? `• Desoneração ZFM/ALC (Conv. 65/88): -R$ ${resultadoFiscal.memoriaCalculo.valorICMSDesonerado.toFixed(2)} (deduzido do vNF)\n`
        : '';

    const texto = `=== PARAMETRIZAÇÃO FISCAL VALIDADA PARA NOTA FISCAL ELETRÔNICA (NF-E) ===
REGIME DO EMITENTE: ${nomesRegimes[etapa1.regimeTributario].toUpperCase()} (ORIGEM: ${etapa1.ufOrigem})
OPERAÇÃO: ${etapa1.ufOrigem} ➔ ${etapa1.ufDestino} (${etapa1.municipioDestino})
FINALIDADE: ${etapa2.finalidadeMercadoria.toUpperCase()} | DESTINATÁRIO: ${etapa2.destinatarioPossuiIE ? 'COM IE' : 'SEM IE (DIFAL)'}
PRODUTO: ${etapa3.descricaoComercial} | NCM: ${etapa3.ncmCodigo}

ENQUADRAMENTO FISCAL AUTOMATIZADO:
• CFOP: ${resultadoFiscal.cfopRecomendado.codigo} - ${resultadoFiscal.cfopRecomendado.descricao}
• Natureza da Operação: ${resultadoFiscal.naturezaOperacao}
• ICMS: ${resultadoFiscal.icms.csosn ? 'CSOSN' : 'CST'} ${resultadoFiscal.icms.cst} | Alíquota ${resultadoFiscal.icms.aliquota}% | Valor: R$ ${resultadoFiscal.icms.valorTributo.toFixed(2)} (${resultadoFiscal.icms.fundamentacaoLegal})
${desonLinha}${stLinha}${difalLinha}• IPI: CST ${resultadoFiscal.ipi.cst} | Alíquota ${resultadoFiscal.ipi.aliquota}% | Valor: R$ ${resultadoFiscal.ipi.valorTributo.toFixed(2)} (${resultadoFiscal.ipi.fundamentacaoLegal})
• PIS: CST ${resultadoFiscal.pis.cst} | Alíquota ${resultadoFiscal.pis.aliquota}% | Base: R$ ${resultadoFiscal.pis.baseCalculo.toFixed(2)} | Valor: R$ ${resultadoFiscal.pis.valorTributo.toFixed(2)}
• COFINS: CST ${resultadoFiscal.cofins.cst} | Alíquota ${resultadoFiscal.cofins.aliquota}% | Base: R$ ${resultadoFiscal.cofins.baseCalculo.toFixed(2)} | Valor: R$ ${resultadoFiscal.cofins.valorTributo.toFixed(2)}
• CBS: CST ${resultadoFiscal.cbs.cst} | cClassTrib ${resultadoFiscal.cbs.cClassTrib} | Alíquota ${resultadoFiscal.cbs.aliquota}%
• IBS UF: CST ${resultadoFiscal.ibs.cst} | cClassTrib ${resultadoFiscal.ibs.cClassTrib} | Alíquota ${resultadoFiscal.ibs.aliquota}%

VALOR PRODUTOS: R$ ${resultadoFiscal.memoriaCalculo.valorProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
TOTAL TRIBUTOS: R$ ${resultadoFiscal.memoriaCalculo.totalTributos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${resultadoFiscal.memoriaCalculo.cargaTributariaEfetivaPercentual}%)
VALOR TOTAL DA NOTA (vNF): R$ ${resultadoFiscal.memoriaCalculo.totalNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
STATUS: ${resultadoFiscal.nivelConfiabilidade.toUpperCase()}`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // Exporta a parametrização em CSV formatado
  const handleExportarCSV = () => {
    const mvaFinal = mvaPersonalizada.trim() || resultadoFiscal.icms.mva || '0%';
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      `"REQUISITOS";"INFORMACOES";"TRIBUTO";"CAMPO";"VALOR"\n` +
      `"CFOP Estadual";"${resultadoFiscal.cfopRecomendado.abrangencia === 'estadual' ? resultadoFiscal.cfopRecomendado.codigo : ''}";"ICMS";"Aliquota";"${resultadoFiscal.icms.aliquota}"\n` +
      `"CFOP Interestadual";"${resultadoFiscal.cfopRecomendado.abrangencia === 'interestadual' ? resultadoFiscal.cfopRecomendado.codigo : ''}";"ICMS";"CST/CSOSN";"${resultadoFiscal.icms.cst}"\n` +
      `"CFOP Estrangeira";"${resultadoFiscal.cfopRecomendado.abrangencia === 'exterior' ? resultadoFiscal.cfopRecomendado.codigo : ''}";"ICMS-ST";"Base / Valor";"${resultadoFiscal.icmsST.aplicavel ? `BC R$ ${resultadoFiscal.icmsST.baseCalculoST.toFixed(2)} | ST R$ ${resultadoFiscal.icmsST.valorICMSST.toFixed(2)}` : 'Não aplicável'}"\n` +
      `"UF de Origem";"${etapa1.ufOrigem}";"II";"Aliquota / CST";"${resultadoFiscal.ii.aliquota} / ${resultadoFiscal.ii.cst}"\n` +
      `"UF de destino";"${etapa1.ufDestino}";"PIS";"Aliquota";"${resultadoFiscal.pis.aliquota}"\n` +
      `"Natureza da operacao fiscal";"${resultadoFiscal.naturezaOperacao}";"PIS";"CST";"${resultadoFiscal.pis.cst}"\n` +
      `"Codigo Origem mercadoria (De 0 a 7)";"${etapa3.origemMercadoria}";"COFINS";"Aliquota";"${resultadoFiscal.cofins.aliquota}"\n` +
      `"Destinacao da mercadoria";"${etapa2.finalidadeMercadoria}";"COFINS";"CST";"${resultadoFiscal.cofins.cst}"\n` +
      `"Participante com ou sem Inscrição Estadual?";"${etapa2.destinatarioPossuiIE ? 'COM' : 'SEM'}";"IPI";"NCM";"${etapa3.ncmCodigo}"\n` +
      `"Se difal, qual a aliquota interna do estado de destino?";"${resultadoFiscal.difal.aliquotaDestino}% (FCP: ${resultadoFiscal.difal.fcp}%)";"IPI";"Aliquota";"${resultadoFiscal.ipi.aliquota}"\n` +
      `"MVA ST / DiFAL";"${mvaFinal}";"IPI";"CST";"${resultadoFiscal.ipi.cst}"\n` +
      `"Vai gerar financeiro (Sim ou Não)?";"${etapa2.geraFinanceiro ? 'SIM' : 'NÃO'}";"CBS";"CST";"${resultadoFiscal.cbs.cst}"\n` +
      `"Vai movimentar estoque (Sim ou Não)?";"${etapa2.movimentaEstoque ? 'SIM' : 'NÃO'}";"CBS";"cClassTrib";"${resultadoFiscal.cbs.cClassTrib}"\n` +
      `"Emissão própria ou de terceiros?";"${etapa1.emissaoPropria}";"CBS";"Aliquota";"${resultadoFiscal.cbs.aliquota}"\n` +
      `"Total NF-e (vNF)";"R$ ${resultadoFiscal.memoriaCalculo.totalNota.toFixed(2)}";"IBS UF";"CST";"${resultadoFiscal.ibs.cst}"\n` +
      `"Total Tributos";"R$ ${resultadoFiscal.memoriaCalculo.totalTributos.toFixed(2)}";"IBS UF";"cClassTrib";"${resultadoFiscal.ibs.cClassTrib}"\n` +
      `"";"";"IBS UF";"Aliquota";"${resultadoFiscal.ibs.aliquota}"\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `enquadramento_nfe_${etapa1.ufOrigem}_para_${etapa1.ufDestino.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const etapasInfo = [
    { num: 1, titulo: 'Identificação da Operação', subtitulo: 'Quem vende e para onde vai' },
    { num: 2, titulo: 'Características da Operação', subtitulo: 'Finalidade e perfil do destinatário' },
    { num: 3, titulo: 'Informações do Produto & NCM', subtitulo: 'Descrição comercial e NCM' },
    { num: 4, titulo: 'Enquadramento Fiscal Inteligente', subtitulo: 'Dedução automática SEFAZ' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E7EC] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#9E141A] text-white rounded-lg shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-[#111827]">
                Simulador Fiscal de NF-e
              </h1>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Informe os dados comerciais da operação e o motor fiscal determina automaticamente CFOP, CSTs, alíquotas e benefícios.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Restart and Import XML Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalXMLAberta(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#A8181F] hover:bg-[#94151B] rounded-lg shadow-2xs transition-all"
            title="Importar arquivo XML de NF-e e carregar todos os dados da operação"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Importar XML de NF-e
          </button>

          <button
            type="button"
            onClick={() => {
              setEtapaAtual(1);
              setTermoBuscaNCM('');
              setNfeAuditada(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        </div>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {etapasInfo.map((item) => {
            const isAtiva = etapaAtual === item.num;
            const isConcluida = etapaAtual > item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => setEtapaAtual(item.num as any)}
                className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 ${
                  isAtiva
                    ? 'bg-[#FDF2F2] border-[#A8181F] ring-2 ring-[#FECACA] shadow-xs'
                    : isConcluida
                    ? 'bg-emerald-50/60 border-emerald-300 hover:bg-emerald-50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isAtiva
                      ? 'bg-[#A8181F] text-white'
                      : isConcluida
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isConcluida ? <Check className="w-3.5 h-3.5" /> : item.num}
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isAtiva
                        ? 'text-[#94151B]'
                        : isConcluida
                        ? 'text-emerald-900'
                        : 'text-slate-700'
                    }`}
                  >
                    {item.titulo}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {item.subtitulo}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* ETAPA 1 – IDENTIFICAÇÃO DA OPERAÇÃO                      */}
      {/* ======================================================== */}
      {etapaAtual === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Banner de Importação Rápida de XML */}
          <div className="p-4 bg-gradient-to-r from-[#FDF2F2] to-white border border-[#FECACA] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#A8181F] text-white rounded-lg shadow-2xs shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Tem o XML da Nota Fiscal Eletrônica (NF-e)?
                </h3>
                <p className="text-[11px] text-slate-600">
                  Carregue o arquivo <code className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[#A8181F]">.xml</code> ou cole o texto para preencher emitente, destinatário, produtos e auditar tributos automaticamente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalXMLAberta(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#A8181F] hover:bg-[#94151B] text-white rounded-lg font-bold text-xs shadow-2xs transition-all shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Importar XML e Auditar
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-[#A8181F]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Etapa 1 de 4: Quem está realizando a operação e para onde vai a mercadoria?
              </h2>
              <p className="text-xs text-slate-500">
                Selecione o regime tributário do emitente e os estados envolvidos na operação.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Regime Tributário do Emitente */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Regime Tributário do Emitente
              </label>
              <select
                value={etapa1.regimeTributario}
                onChange={(e) => {
                  setEtapa1((prev) => ({
                    ...prev,
                    regimeTributario: e.target.value as RegimeTributarioUniversal,
                  }));
                }}
                className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="lucro_presumido">Lucro Presumido (PIS 0,65% / COFINS 3,00% Cumulativo)</option>
                <option value="lucro_real">Lucro Real (PIS 1,65% / COFINS 7,60% Não-Cumulativo)</option>
                <option value="simples_nacional">Simples Nacional (CSOSN • Recolhimento Unificado LC 123/06)</option>
                <option value="mei">MEI (Microempreendedor Individual • Dispensa de Débito)</option>
                <option value="regime_especial">Regime Especial / Diferenciado</option>
              </select>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">
                  {etapa1.regimeTributario === 'lucro_presumido' && 'Regime Cumulativo federal (Lei 9.718/98) com apuração de ICMS normal Débito/Crédito.'}
                  {etapa1.regimeTributario === 'lucro_real' && 'Regime Não-Cumulativo de PIS/COFINS (Leis 10.637/02 e 10.833/03) com crédito na entrada.'}
                  {etapa1.regimeTributario === 'simples_nacional' && 'Tributação unificada no PGDAS-D (LC 123/06). Emissão com CSOSN sem destaque de ICMS próprio/IPI.'}
                  {etapa1.regimeTributario === 'mei' && 'Microempreendedor Individual: tributação fixa mensal no DAS-MEI sem retenção/destaque de ICMS e IPI.'}
                  {etapa1.regimeTributario === 'regime_especial' && 'Enquadramento especial conforme benefício ou termo de acordo estadual/federal.'}
                </div>
                <div className="text-[10px] text-slate-400">
                  O motor fiscal ajusta automaticamente CST/CSOSN, alíquotas de PIS/COFINS e regras de IPI com base no regime selecionado.
                </div>
              </div>
            </div>

            {/* Tipo de Operação */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Tipo Geográfico da Operação
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'interestadual', label: 'Interestadual', desc: 'Entre estados diferentes' },
                  { id: 'interna', label: 'Interna', desc: 'No mesmo estado' },
                  { id: 'exterior', label: 'Exterior', desc: 'Exportação / Importação' },
                ].map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => {
                      const novaDestino =
                        tipo.id === 'interna'
                          ? etapa1.ufOrigem
                          : tipo.id === 'exterior'
                          ? 'EXTERIOR / EX'
                          : extrairSiglaUF(etapa1.ufDestino) === etapa1.ufOrigem ||
                            extrairSiglaUF(etapa1.ufDestino) === 'EX'
                          ? etapa1.ufOrigem === 'SP'
                            ? 'RJ'
                            : 'SP'
                          : etapa1.ufDestino;
                      const munPadrao =
                        tipo.id === 'exterior'
                          ? 'Exterior'
                          : obterMunicipioPadraoDestino(novaDestino) || etapa1.municipioDestino;
                      const ehZFM =
                        tipo.id === 'interestadual' &&
                        (novaDestino.includes('MACAPÁ') ||
                          novaDestino.includes('MANAUS') ||
                          novaDestino.includes('BOA VISTA'));
                      setEtapa1((prev) => ({
                        ...prev,
                        tipoOperacao: tipo.id as 'interna' | 'interestadual' | 'exterior',
                        ufDestino: novaDestino,
                        municipioDestino: munPadrao,
                      }));
                      setEtapa2((prev) => ({ ...prev, envolveZFMouALC: ehZFM }));
                    }}
                    className={`p-2.5 rounded-lg text-left border text-xs font-semibold transition-all ${
                      etapa1.tipoOperacao === tipo.id
                        ? 'bg-[#A8181F] text-white border-[#94151B] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>{tipo.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        etapa1.tipoOperacao === tipo.id ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {tipo.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* UF Origem (todas as 27 UFs do Brasil) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Estado de Origem (Saída da Mercadoria)
              </label>
              <select
                value={etapa1.ufOrigem}
                onChange={(e) => {
                  const novaOrigem = e.target.value;
                  setUfOrigemProp?.(novaOrigem);
                  setEtapa1((prev) => {
                    if (prev.tipoOperacao === 'interna') {
                      setUfDestinoProp?.(novaOrigem);
                      return {
                        ...prev,
                        ufOrigem: novaOrigem,
                        ufDestino: novaOrigem,
                        municipioDestino:
                          obterMunicipioPadraoDestino(novaOrigem) || prev.municipioDestino,
                      };
                    }
                    const siglaDestAtual = extrairSiglaUF(prev.ufDestino);
                    const virouInterna =
                      siglaDestAtual === novaOrigem && !prev.ufDestino.includes('/');
                    return {
                      ...prev,
                      ufOrigem: novaOrigem,
                      tipoOperacao:
                        siglaDestAtual === 'EX'
                          ? 'exterior'
                          : virouInterna
                          ? 'interna'
                          : 'interestadual',
                    };
                  });
                }}
                className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                {ufsOrdenadas.map((u) => (
                  <option key={u.sigla} value={u.sigla}>
                    {u.sigla} - {u.nome} (Alíquota Interna: {u.aliquotaInterna}%
                    {u.fcp > 0 ? ` + ${u.fcp}% FCP` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* UF Destino & ZFM (todas as 27 UFs + ZFM/ALC + Exterior) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Estado / Região de Destino
              </label>
              <select
                value={etapa1.ufDestino}
                onChange={(e) => {
                  const val = e.target.value;
                  const isExt = val === 'EXTERIOR / EX';
                  const isZFM =
                    val.includes('MACAPÁ') ||
                    val.includes('MANAUS') ||
                    val.includes('BOA VISTA') ||
                    val.includes('ALC');
                  const siglaDest = extrairSiglaUF(val);
                  setUfDestinoProp?.(siglaDest || val);
                  const municipioPadrao = isExt
                    ? 'Exterior'
                    : obterMunicipioPadraoDestino(val);
                  setEtapa1((prev) => ({
                    ...prev,
                    ufDestino: val,
                    tipoOperacao: isExt
                      ? 'exterior'
                      : siglaDest === prev.ufOrigem && !isZFM
                      ? 'interna'
                      : 'interestadual',
                    municipioDestino: municipioPadrao || prev.municipioDestino,
                  }));
                  setEtapa2((prev) => ({ ...prev, envolveZFMouALC: isZFM }));
                  setFiltroMunicipio('');
                  setDropdownMunicipioAberto(false);
                }}
                className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <optgroup label="Regimes Especiais (ZFM & Áreas de Livre Comércio)">
                  <option value="MACAPÁ / AP">MACAPÁ / AP (Área de Livre Comércio - ALCMS)</option>
                  <option value="MANAUS / AM">MANAUS / AM (Zona Franca de Manaus - ZFM)</option>
                  <option value="BOA VISTA / RR">BOA VISTA / RR (Área de Livre Comércio - ALC)</option>
                </optgroup>
                <optgroup label="Todos os 27 Estados do Brasil">
                  {ufsOrdenadas.map((u) => (
                    <option key={u.sigla} value={u.sigla}>
                      {u.sigla} - {u.nome} (Alíquota: {u.aliquotaInterna}%
                      {u.fcp > 0 ? ` + ${u.fcp}% FCP` : ''})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Exterior">
                  <option value="EXTERIOR / EX">EXTERIOR / EX (Exportação / Importação)</option>
                </optgroup>
              </select>
            </div>

            {/* Município de Destino */}
            <div className="space-y-2 relative" ref={municipioDropdownRef}>
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-800">
                  Município de Destino {siglaUFDestino && siglaUFDestino !== 'EX' ? `(${siglaUFDestino})` : ''}
                </label>
                {siglaUFDestino && siglaUFDestino !== 'EX' && municipiosDestinoLista.length > 0 && (
                  <span className="text-[10px] font-medium text-slate-500">
                    {municipiosDestinoLista.length} municípios ({fonteMunicipios === 'ibge' ? 'IBGE' : 'base local'})
                  </span>
                )}
              </div>

              {siglaUFDestino === 'EX' ? (
                <input
                  type="text"
                  value={etapa1.municipioDestino}
                  onChange={(e) =>
                    setEtapa1((prev) => ({ ...prev, municipioDestino: e.target.value }))
                  }
                  placeholder="Ex: Miami, Hamburgo, Buenos Aires..."
                  className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-500 shadow-2xs"
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownMunicipioAberto((prev) => !prev);
                      setFiltroMunicipio('');
                    }}
                    className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-500 shadow-2xs flex items-center justify-between gap-2 cursor-pointer text-left hover:border-slate-400 transition-colors"
                  >
                    <span className="truncate">
                      {etapa1.municipioDestino || `Selecione um município de ${siglaUFDestino}...`}
                    </span>
                    {carregandoMunicipios ? (
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />
                    ) : (
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                          dropdownMunicipioAberto ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {dropdownMunicipioAberto && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden">
                      <div className="p-2 border-b border-slate-200 bg-slate-50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                          <input
                            type="text"
                            autoFocus
                            value={filtroMunicipio}
                            onChange={(e) => setFiltroMunicipio(e.target.value)}
                            placeholder={`Filtrar municípios de ${siglaUFDestino}...`}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {municipiosFiltrados.length > 0 ? (
                          municipiosFiltrados.map((municipio) => {
                            const selecionado =
                              etapa1.municipioDestino.toLowerCase() === municipio.toLowerCase();
                            return (
                              <button
                                key={municipio}
                                type="button"
                                onClick={() => {
                                  setEtapa1((prev) => ({
                                    ...prev,
                                    municipioDestino: municipio,
                                  }));
                                  setDropdownMunicipioAberto(false);
                                  setFiltroMunicipio('');
                                }}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                                  selecionado
                                    ? 'bg-blue-50 font-bold text-blue-900'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span>{municipio}</span>
                                {selecionado && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-500 space-y-2">
                            <p>Nenhum município encontrado para "{filtroMunicipio}" em {siglaUFDestino}.</p>
                            {filtroMunicipio.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEtapa1((prev) => ({
                                    ...prev,
                                    municipioDestino: filtroMunicipio.trim(),
                                  }));
                                  setDropdownMunicipioAberto(false);
                                  setFiltroMunicipio('');
                                }}
                                className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[11px] font-semibold hover:bg-slate-800"
                              >
                                Usar "{filtroMunicipio.trim()}"
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Emissão própria ou terceiros */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Modalidade de Emissão
              </label>
              <div className="flex gap-2">
                {(['PRÓPRIA', 'TERCEIROS'] as const).map((modalidade) => (
                  <button
                    key={modalidade}
                    type="button"
                    onClick={() =>
                      setEtapa1((prev) => ({ ...prev, emissaoPropria: modalidade }))
                    }
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      etapa1.emissaoPropria === modalidade
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Emissão {modalidade}
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor Inteligente de CFOP */}
            <div className="space-y-3 md:col-span-2 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ListFilter className="w-4 h-4 text-blue-600" />
                    Código Fiscal de Operações e Prestações (CFOP)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    O motor deduz o código ideal ou você pode escolher/informar manualmente qualquer CFOP.
                  </p>
                </div>

                {/* Alternador Automático vs Manual */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setModoCFOP('auto');
                      setCfopSelecionadoObj(null);
                      setEtapa1((prev) => ({ ...prev, cfopManual: '' }));
                    }}
                    className={`px-3 py-1 rounded-md font-bold transition-all ${
                      modoCFOP === 'auto'
                        ? 'bg-[#A8181F] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Dedução Automática do Motor
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoCFOP('manual')}
                    className={`px-3 py-1 rounded-md font-bold transition-all ${
                      modoCFOP === 'manual'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Selecionar CFOP Manualmente
                  </button>
                </div>
              </div>

              {modoCFOP === 'auto' ? (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
                      {resultadoFiscal.cfopRecomendado.codigo}
                    </div>
                    <div>
                      <div className="font-bold text-blue-950">
                        {resultadoFiscal.cfopRecomendado.codigo} — {resultadoFiscal.cfopRecomendado.descricao}
                      </div>
                      <div className="text-[11px] text-blue-700">
                        {resultadoFiscal.cfopRecomendado.quandoUsar}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                    Sugerido pelo Motor
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 flex-wrap justify-between">
                    <div className="flex items-center gap-1 text-xs flex-wrap">
                      <span className="text-slate-500 font-medium">Filtrar por sentido:</span>
                      {(['todos', 'saida', 'entrada'] as const).map((sentido) => (
                        <button
                          key={sentido}
                          type="button"
                          onClick={() => {
                            setFiltroSentidoCFOP(sentido);
                            setLimiteCfopLista(60);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            filtroSentidoCFOP === sentido
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {sentido === 'todos' ? 'Todos' : sentido === 'saida' ? 'Saída (5xxx / 6xxx / 7xxx)' : 'Entrada (1xxx / 2xxx / 3xxx)'}
                        </button>
                      ))}
                    </div>

                    {etapa1.cfopManual && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        CFOP Selecionado: {etapa1.cfopManual}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={termoBuscaCFOP}
                      onChange={(e) => {
                        setTermoBuscaCFOP(e.target.value);
                        setLimiteCfopLista(60);
                      }}
                      placeholder="Pesquisar em todos os 620+ CFOPs SINIEF (ex: 5.102, 5.916, 6.108, 3.101, devolução, conserto)..."
                      className="w-full pl-9 pr-24 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#A8181F]"
                    />
                    {carregandoCFOPRemoto ? (
                      <RefreshCw className="w-3.5 h-3.5 absolute right-3 top-2.5 text-[#A8181F] animate-spin" />
                    ) : (
                      <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {cfopsFiltrados.length} / {totalCfopsCatalogo}
                      </span>
                    )}
                  </div>

                  {/* Lista com os CFOPs filtrados (catálogo completo SINIEF) */}
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 shadow-2xs">
                    {cfopsFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Nenhum CFOP encontrado. Você pode digitar o código de 4 dígitos abaixo para adoção imediata.
                      </div>
                    ) : (
                      cfopsFiltrados.map((c, idx) => {
                        const isAtivo =
                          etapa1.cfopManual?.replace(/\D/g, '') === c.codigo.replace(/\D/g, '');
                        return (
                          <button
                            key={`${c.codigo}-${idx}`}
                            type="button"
                            onClick={() => {
                              setCfopSelecionadoObj(c);
                              setEtapa1((prev) => ({ ...prev, cfopManual: c.codigo }));
                            }}
                            className={`w-full p-2.5 text-left text-xs flex items-center justify-between gap-3 transition-colors ${
                              isAtivo
                                ? 'bg-blue-50/90 font-bold text-blue-900 border-l-4 border-blue-600'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-blue-700 mr-2">
                                {c.codigo}
                              </span>
                              <span className="font-medium text-slate-900">
                                {c.descricao}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                {c.quandoUsar}
                              </p>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {c.abrangencia}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {totalCfopsCatalogo > cfopsRemotos.length && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setLimiteCfopLista((prev) => prev + 100)}
                        className="px-3 py-1 text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                      >
                        Carregar mais CFOPs ({cfopsRemotos.length} de {totalCfopsCatalogo})
                      </button>
                    </div>
                  )}

                  {/* Entrada Direta de Qualquer CFOP (4 dígitos) */}
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-slate-600 font-medium">
                      Informar qualquer CFOP diretamente:
                    </span>
                    <input
                      type="text"
                      value={cfopManualInput}
                      onChange={(e) => setCfopManualInput(e.target.value)}
                      placeholder="Ex: 5.916 ou 6108"
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 w-36"
                    />
                    <button
                      type="button"
                      disabled={resolvendoCfopManual}
                      onClick={async () => {
                        const digitos = cfopManualInput.replace(/\D/g, '');
                        if (digitos.length !== 4) return;
                        setResolvendoCfopManual(true);
                        try {
                          const remoto = await obterCFOPPorCodigoRemoto(digitos);
                          const resolvido = remoto || resolverCFOPUniversal(digitos);
                          setCfopSelecionadoObj(resolvido);
                          setEtapa1((prev) => ({ ...prev, cfopManual: resolvido.codigo }));
                          setCfopManualInput('');
                        } finally {
                          setResolvendoCfopManual(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#A8181F] hover:bg-[#94151B] disabled:opacity-60 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      {resolvendoCfopManual ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Adotar CFOP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEtapaAtual(2)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#A8181F] hover:bg-[#94151B] text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              Avançar para Características da Operação
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ETAPA 2 – CARACTERÍSTICAS DA OPERAÇÃO                    */}
      {/* ======================================================== */}
      {etapaAtual === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Etapa 2 de 4: Quais são as características e finalidade da mercadoria?
              </h2>
              <p className="text-xs text-slate-500">
                Responda às perguntas comerciais para que o sistema determine o enquadramento de ICMS, DIFAL, ST e benefícios.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Finalidade da Mercadoria */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold text-slate-800">
                Qual será a finalidade da mercadoria pelo destinatário?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    id: 'comercializacao',
                    label: 'Comercialização / Revenda',
                    desc: 'O cliente vai revender a mercadoria',
                  },
                  {
                    id: 'industrializacao',
                    label: 'Industrialização',
                    desc: 'Matéria-prima ou insumo produtivo',
                  },
                  {
                    id: 'consumo',
                    label: 'Uso e Consumo',
                    desc: 'Consumidor final ou despesa operacional',
                  },
                  {
                    id: 'ativo_imobilizado',
                    label: 'Ativo Imobilizado',
                    desc: 'Bens e máquinas permanentes',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setEtapa2((prev) => ({
                        ...prev,
                        finalidadeMercadoria: item.id as FinalidadeMercadoria,
                        consumidorFinal: item.id === 'consumo',
                      }))
                    }
                    className={`p-3 rounded-xl text-left border transition-all ${
                      etapa2.finalidadeMercadoria === item.id
                        ? 'bg-[#A8181F] text-white border-[#94151B] shadow-xs ring-1 ring-[#FECACA]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div
                      className={`text-[10px] mt-1 ${
                        etapa2.finalidadeMercadoria === item.id
                          ? 'text-blue-100'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inscrição Estadual do Destinatário (COM IE vs SEM IE) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                O cliente/destinatário possui Inscrição Estadual ativa?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEtapa2((prev) => ({
                      ...prev,
                      destinatarioContribuinte: true,
                      destinatarioPossuiIE: true,
                    }))
                  }
                  className={`flex-1 p-3 rounded-xl text-left border transition-all ${
                    etapa2.destinatarioPossuiIE
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">✓ COM Inscrição Estadual</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      etapa2.destinatarioPossuiIE ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    Contribuinte de ICMS (Operação Normal)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEtapa2((prev) => ({
                      ...prev,
                      destinatarioContribuinte: false,
                      destinatarioPossuiIE: false,
                      consumidorFinal: true,
                    }))
                  }
                  className={`flex-1 p-3 rounded-xl text-left border transition-all ${
                    !etapa2.destinatarioPossuiIE
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">⚠ SEM Inscrição Estadual</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      !etapa2.destinatarioPossuiIE ? 'text-purple-100' : 'text-slate-400'
                    }`}
                  >
                    Não Contribuinte (Aplica DIFAL EC 87/15)
                  </div>
                </button>
              </div>
            </div>

            {/* Zona Franca de Manaus / ALC */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                A operação envolve Zona Franca de Manaus ou Área de Livre Comércio?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEtapa2((prev) => ({ ...prev, envolveZFMouALC: true }))}
                  className={`flex-1 p-3 rounded-xl text-left border transition-all ${
                    etapa2.envolveZFMouALC
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">SIM, envolve ZFM / ALC</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      etapa2.envolveZFMouALC ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    Benefício Suframa (Isenção ICMS e IPI / PIS Alíq. Zero)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEtapa2((prev) => ({ ...prev, envolveZFMouALC: false }))}
                  className={`flex-1 p-3 rounded-xl text-left border transition-all ${
                    !etapa2.envolveZFMouALC
                      ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">NÃO envolve ZFM / ALC</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      !etapa2.envolveZFMouALC ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    Tributação Nacional Padrão
                  </div>
                </button>
              </div>
            </div>

            {/* Movimentação Financeira */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                A operação vai gerar cobrança/financeiro?
              </label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setEtapa2((prev) => ({ ...prev, geraFinanceiro: val }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      etapa2.geraFinanceiro === val
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {val ? 'SIM, gera duplicata/boleto' : 'NÃO (Remessa/Bonificação)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Movimentação de Estoque */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                A operação vai movimentar estoque físico?
              </label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setEtapa2((prev) => ({ ...prev, movimentaEstoque: val }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      etapa2.movimentaEstoque === val
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {val ? 'SIM, baixa estoque físico' : 'NÃO movimenta estoque'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEtapaAtual(1)}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Etapa 1
            </button>
            <button
              type="button"
              onClick={() => setEtapaAtual(3)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#A8181F] hover:bg-[#94151B] text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              Avançar para Dados do Produto & NCM
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ETAPA 3 – INFORMAÇÕES DO PRODUTO & NCM                   */}
      {/* ======================================================== */}
      {etapaAtual === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Search className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Etapa 3 de 4: Qual é a mercadoria e classificação fiscal (NCM)?
              </h2>
              <p className="text-xs text-slate-500">
                Pesquise pela descrição comercial do item; o sistema identifica o NCM oficial, alíquota de IPI e validação da Receita Federal.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Descrição Comercial */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Descrição Comercial da Mercadoria
              </label>
              <input
                type="text"
                value={etapa3.descricaoComercial}
                onChange={(e) =>
                  setEtapa3((prev) => ({ ...prev, descricaoComercial: e.target.value }))
                }
                placeholder="Ex: Placas de polietileno, carregador para smartphone, notebook..."
                className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-500 shadow-2xs"
              />
            </div>

            {/* Busca Inteligente de NCM com Categorias, Resultados Completos (10.500+ Siscomex/TIPI) e Entrada Livre */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-blue-600" />
                    Catálogo Completo NCM & Tabela TIPI Oficial (Siscomex / Dec. nº 11.158/2022)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Base oficial conectada com <strong>{totalNcmsCatalogo.toLocaleString('pt-BR')} NCMs</strong>. Pesquise por código, descrição, capítulo ou setor.
                  </p>
                </div>
                <div className="text-xs flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 font-medium">NCM Ativo:</span>
                  <strong className="text-blue-900 font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
                    {etapa3.ncmCodigo}
                  </strong>
                  {ncmSelecionadoObj?.regimePISCOFINS === 'monofasico' && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                      Monofásico PIS/COFINS
                    </span>
                  )}
                  {ncmSelecionadoObj?.regimePISCOFINS === 'aliquota_zero' && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                      Alíquota Zero PIS/COFINS
                    </span>
                  )}
                  {ncmSelecionadoObj?.temST && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded">
                      ST Ativa{ncmSelecionadoObj.cestPadrao ? ` • CEST ${ncmSelecionadoObj.cestPadrao}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Filtro por Setor Econômico e Capítulo TIPI */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 min-w-[220px]">
                  <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Setor:
                  </span>
                  {setoresDisponiveis.slice(0, 8).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setSetorNCM(sec);
                        setLimiteNcmLista(60);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                        setorNCM === sec
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sec === 'todos' ? 'Todos os Setores' : sec}
                    </button>
                  ))}
                </div>

                {capitulosDisponiveisNCM.length > 0 && (
                  <select
                    value={capituloNCM}
                    onChange={(e) => {
                      setCapituloNCM(e.target.value);
                      setLimiteNcmLista(60);
                    }}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 max-w-[240px] cursor-pointer"
                  >
                    <option value="todos">Todos os Capítulos TIPI (01–97)</option>
                    {capitulosDisponiveisNCM.map((cap) => (
                      <option key={cap.capitulo} value={cap.capitulo}>
                        Cap. {cap.capitulo} — {cap.titulo}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Input de Pesquisa de NCM */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={termoBuscaNCM}
                  onChange={(e) => {
                    setTermoBuscaNCM(e.target.value);
                    setLimiteNcmLista(60);
                  }}
                  placeholder="Pesquisar em todos os 10.500+ NCMs oficiais por código (ex: 3925, 3305, 1006, 8504) ou descrição..."
                  className="w-full pl-9 pr-9 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden focus:ring-2 focus:ring-[#A8181F]"
                />
                {carregandoNCMRemoto && (
                  <div className="absolute right-3 top-2.5">
                    <RefreshCw className="w-4 h-4 text-[#A8181F] animate-spin" />
                  </div>
                )}
              </div>

              {/* Indicador de Quantidade */}
              <div className="text-[11px] text-slate-500 flex justify-between items-center flex-wrap gap-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Exibindo <strong>{ncmsFiltrados.length}</strong> de{' '}
                  <strong>{totalNcmsCatalogo.toLocaleString('pt-BR')}</strong> NCMs ({carregandoNCMRemoto ? 'Consultando TIPI / Cache Local...' : 'Catálogo Oficial Siscomex / TIPI'})
                </span>
                <span className="text-[10px] text-slate-400">Clique no item para aplicar IPI, PIS/COFINS e ST automaticamente</span>
              </div>

              {/* Grid / Lista Ampla de NCMs com Scroll */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 shadow-2xs">
                {ncmsFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nenhum NCM encontrado para o filtro aplicado.
                  </div>
                ) : (
                  ncmsFiltrados.map((n, idx) => {
                    const isSelecionado =
                      etapa3.ncmCodigo.replace(/\D/g, '') === n.codigo.replace(/\D/g, '');
                    return (
                      <button
                        key={`${n.codigo}-${idx}`}
                        type="button"
                        onClick={() => {
                          setNcmSelecionadoObj(n);
                          setEtapa3((prev) => ({
                            ...prev,
                            ncmCodigo: n.codigo,
                            ncmDescricao: n.descricao,
                            aliquotaIPIPadrao: n.aliquotaIPI,
                          }));
                        }}
                        className={`w-full p-2.5 text-left text-xs flex items-start justify-between gap-3 transition-colors ${
                          isSelecionado
                            ? 'bg-blue-50/90 font-medium text-blue-950 border-l-4 border-blue-600'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-blue-700">
                              {n.codigo}
                            </span>
                            {n.setor && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                {n.setor}
                              </span>
                            )}
                            {n.temST && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-bold">
                                ST Ativa
                              </span>
                            )}
                            {n.regimePISCOFINS === 'monofasico' && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                                Monofásico
                              </span>
                            )}
                            {n.regimePISCOFINS === 'aliquota_zero' && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                                Alíq. Zero
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-700 mt-1 line-clamp-1">
                            {n.descricao}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            IPI: {n.aliquotaIPI}%
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            PIS/COF: {n.regimePISCOFINS}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {totalNcmsCatalogo > ncmsRemotos.length && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setLimiteNcmLista((prev) => prev + 100)}
                    className="px-3 py-1 text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                  >
                    Carregar mais NCMs ({ncmsRemotos.length} de {totalNcmsCatalogo.toLocaleString('pt-BR')})
                  </button>
                </div>
              )}

              {/* Entrada Manual de Qualquer NCM (consulta Siscomex/IndexedDB antes do fallback universal) */}
              <div className="pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-600 font-medium">
                  Digite qualquer código NCM de 8 dígitos:
                </span>
                <input
                  type="text"
                  value={ncmManualInput}
                  onChange={(e) => setNcmManualInput(e.target.value)}
                  placeholder="Ex: 3925.30.00 ou 01012100"
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 w-44"
                />
                <button
                  type="button"
                  disabled={resolvendoNcmManual}
                  onClick={async () => {
                    const limpo = ncmManualInput.trim();
                    if (!limpo) return;
                    setResolvendoNcmManual(true);
                    try {
                      const remoto = await obterNCMPorCodigoRemoto(limpo);
                      const ncmResolvido = remoto || resolverNCMUniversal(limpo);
                      setNcmSelecionadoObj(ncmResolvido);
                      setEtapa3((prev) => ({
                        ...prev,
                        ncmCodigo: ncmResolvido.codigo,
                        ncmDescricao: ncmResolvido.descricao,
                        aliquotaIPIPadrao: ncmResolvido.aliquotaIPI,
                      }));
                      setNcmManualInput('');
                    } finally {
                      setResolvendoNcmManual(false);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#A8181F] hover:bg-[#94151B] disabled:opacity-60 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  {resolvendoNcmManual ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Resolver & Adotar NCM
                </button>
              </div>
            </div>

            {/* Origem, IPI TIPI, Quantidade e Preço */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Origem da Mercadoria (0 a 8)
                </label>
                <select
                  value={etapa3.origemMercadoria}
                  onChange={(e) =>
                    setEtapa3((prev) => ({ ...prev, origemMercadoria: e.target.value }))
                  }
                  className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden cursor-pointer"
                >
                  <option value="0">0 - Nacional (Produção local)</option>
                  <option value="1">1 - Estrangeira - Importação direta (4%)</option>
                  <option value="2">2 - Estrangeira - Mercado interno (4%)</option>
                  <option value="3">3 - Nacional com Conteúdo Imp. &gt; 40% (4%)</option>
                  <option value="4">4 - Nacional com Processo Básico (PPB)</option>
                  <option value="5">5 - Nacional com conteúdo imp. até 40%</option>
                  <option value="6">6 - Estrangeira - Imp. direta sem similar</option>
                  <option value="7">7 - Estrangeira - Merc. interno sem similar</option>
                  <option value="8">8 - Nacional com Conteúdo Imp. &gt; 70% (4%)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Alíquota IPI TIPI (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={etapa3.aliquotaIPIPadrao ?? 0}
                  onChange={(e) =>
                    setEtapa3((prev) => ({
                      ...prev,
                      aliquotaIPIPadrao: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={etapa3.quantidade}
                  onChange={(e) =>
                    handleAtualizarPreco(Number(e.target.value), etapa3.valorUnitario)
                  }
                  className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Valor Unitário (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={etapa3.valorUnitario}
                  onChange={(e) =>
                    handleAtualizarPreco(etapa3.quantidade, Number(e.target.value))
                  }
                  className="w-full p-2.5 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-blue-900 font-semibold">
                Valor Total da Mercadoria para Base de Cálculo:
              </span>
              <strong className="text-sm font-bold text-blue-950 font-mono">
                R$ {etapa3.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEtapaAtual(2)}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Etapa 2
            </button>
            <button
              type="button"
              onClick={() => setEtapaAtual(4)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#A8181F] hover:bg-[#94151B] text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              Executar Enquadramento Fiscal Inteligente
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ETAPA 4 – ENQUADRAMENTO FISCAL INTELIGENTE & RESULTADOS   */}
      {/* ======================================================== */}
      {etapaAtual === 4 && (
        <div className="space-y-6">
          {/* Header Bar with Reliability Tier and View Mode Switch */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Enquadramento Fiscal Identificado pelo Motor
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {resultadoFiscal.nivelConfiabilidade}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Operação interpretada em conformidade com o MOC v7.0, RICMS, TIPI e Reforma Tributária (EC 132/23).
                </p>
              </div>
            </div>

            {/* Alternador de Modo de Visualização Integrada (4 Visões em 1) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setModoResultado('executiva')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  modoResultado === 'executiva'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Visão Executiva & Memória
              </button>
              <button
                type="button"
                onClick={() => setModoResultado('espelho_planilha')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  modoResultado === 'espelho_planilha'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Espelho Fiel da Planilha
              </button>
              <button
                type="button"
                onClick={() => setModoResultado('comparador')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  modoResultado === 'comparador'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                Comparador de Cenários
              </button>
              <button
                type="button"
                onClick={() => setModoResultado('devolucao')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  modoResultado === 'devolucao'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                Calculadora de Devolução
              </button>

              {nfeAuditada && (
                <button
                  type="button"
                  onClick={() => setModoResultado('auditoria_xml')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    modoResultado === 'auditoria_xml'
                      ? 'bg-[#A8181F] text-white shadow-2xs font-bold'
                      : 'text-[#A8181F] bg-[#FDF2F2] hover:bg-rose-100 font-bold border border-[#FECACA]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Auditoria do XML ({nfeAuditada.numeroNF})
                </button>
              )}

              {onOpenAuditDrawer && (
                <button
                  type="button"
                  onClick={onOpenAuditDrawer}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs whitespace-nowrap ml-1"
                  title="Abrir painel lateral de memória de cálculo detalhada e base legal oficial"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Auditoria & Base Legal
                </button>
              )}
            </div>
          </div>

          {/* MODO 1: VISÃO EXECUTIVA & MEMÓRIA DE CÁLCULO */}
          {modoResultado === 'executiva' && (
            <div className="space-y-6">
              {/* Summary Cards of Primary Enquadramento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CFOP & Natureza */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-xs font-medium text-slate-500">
                    CFOP Recomendado
                  </div>
                  <div className="text-xl font-bold font-display tabular-nums tracking-tight text-[#A8181F] mt-1">
                    {resultadoFiscal.cfopRecomendado.codigo}
                  </div>
                  <div className="text-xs font-medium text-slate-800 mt-1 leading-snug">
                    {resultadoFiscal.cfopRecomendado.descricao}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5">
                    <span className="font-semibold text-slate-700">Natureza:</span> {resultadoFiscal.naturezaOperacao}
                  </div>
                </div>

                {/* Tributação Tradicional */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-xs font-medium text-slate-500">
                    ICMS, ST &amp; IPI
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold font-display tabular-nums tracking-tight text-slate-900">
                      {resultadoFiscal.icms.csosn ? 'CSOSN' : 'CST'} {resultadoFiscal.icms.cst}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-slate-600">
                      (Alíq: {resultadoFiscal.icms.aliquota}%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1 tabular-nums">
                    <span className="font-semibold text-slate-900">IPI:</span> CST {resultadoFiscal.ipi.cst} (Alíq: {resultadoFiscal.ipi.aliquota}%) · NCM <span className="font-mono text-[11px]">{etapa3.ncmCodigo}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5 tabular-nums">
                    {resultadoFiscal.icmsST.aplicavel
                      ? `ICMS-ST Retido: R$ ${resultadoFiscal.icmsST.valorICMSST.toFixed(2)} (MVA ${resultadoFiscal.icmsST.mvaAplicada.toFixed(2)}%)${resultadoFiscal.icmsST.valorFCPST > 0 ? ` + FCP-ST R$ ${resultadoFiscal.icmsST.valorFCPST.toFixed(2)}` : ''}`
                      : resultadoFiscal.memoriaCalculo.valorICMSDesonerado > 0
                      ? `Desoneração ZFM/ALC: -R$ ${resultadoFiscal.memoriaCalculo.valorICMSDesonerado.toFixed(2)} (abate vNF)`
                      : resultadoFiscal.difal.aplicavel
                      ? `DIFAL (${resultadoFiscal.difal.tipoDifal === 'contribuinte_uso_consumo_ativo' ? 'Contribuinte' : 'EC 87/15'}): ${resultadoFiscal.difal.diferencial}%${resultadoFiscal.difal.valorFCP > 0 ? ` + FCP ${resultadoFiscal.difal.fcp}%` : ''}`
                      : 'Sem incidência de ST ou DIFAL'}
                  </div>
                </div>

                {/* Reforma Tributária (CBS & IBS) */}
                <div className="bg-white p-4 rounded-xl border border-[#E4E7EC]">
                  <div className="text-xs font-medium text-[#9E141A]">
                    Reforma Tributária (CBS &amp; IBS)
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold font-display tabular-nums tracking-tight text-[#111827]">
                      CST {resultadoFiscal.cbs.cst}
                    </span>
                    <span className="text-xs font-medium text-[#4B5563] font-mono tabular-nums">
                      cClassTrib: {resultadoFiscal.cbs.cClassTrib}
                    </span>
                  </div>
                  <div className="text-xs tabular-nums font-medium text-[#374151] mt-1">
                    CBS: {resultadoFiscal.cbs.aliquota}% · IBS: {resultadoFiscal.ibs.aliquota}%
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-2 border-t border-[#ECEEF2] pt-1.5">
                    {resultadoFiscal.cbs.motivoEnquadramento}
                  </div>
                </div>
              </div>

              {/* Alertas Fiscais e Pontos de Atenção SEFAZ */}
              {resultadoFiscal.alertasInconsistencias.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
                  <h3 className="font-display text-xs font-semibold text-amber-950 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Alertas Fiscais &amp; Pontos de Atenção SEFAZ ({resultadoFiscal.alertasInconsistencias.length})
                  </h3>
                  <ul className="space-y-1.5 text-xs text-amber-900">
                    {resultadoFiscal.alertasInconsistencias.map((alerta, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-amber-600 font-bold mt-0.5">•</span>
                        <span>{alerta}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Breakdown of Taxes with Official Basis */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <span className="font-display font-semibold text-[13px] text-slate-900">
                    Memória Detalhada dos Tributos e Fundamentação Legal
                  </span>
                  <span className="text-xs text-slate-600 tabular-nums">
                    Produtos: <strong className="text-slate-900 font-semibold">R$ {resultadoFiscal.memoriaCalculo.valorProdutos.toFixed(2)}</strong> · Total Tributos: <strong className="text-[#A8181F] font-semibold">R$ {resultadoFiscal.memoriaCalculo.totalTributos.toFixed(2)}</strong> ({resultadoFiscal.memoriaCalculo.cargaTributariaEfetivaPercentual}%) · Total NF-e: <strong className="text-slate-900 font-semibold">R$ {resultadoFiscal.memoriaCalculo.totalNota.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="divide-y divide-slate-200 text-xs">
                  {/* ICMS */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="font-display text-sm font-semibold text-slate-900">ICMS Próprio</strong>
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold">
                          {resultadoFiscal.icms.csosn ? 'CSOSN' : 'CST'} {resultadoFiscal.icms.cst}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-blue-700">
                          Alíquota: {resultadoFiscal.icms.aliquota}%
                        </span>
                        {resultadoFiscal.icms.baseCalculo > 0 && (
                          <span className="text-xs tabular-nums text-slate-500">
                            BC: R$ {resultadoFiscal.icms.baseCalculo.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed text-xs">
                        {resultadoFiscal.icms.motivoEnquadramento}
                      </p>
                      <div className="text-[11px] text-slate-500">
                        Base Legal: {resultadoFiscal.icms.fundamentacaoLegal}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-display tabular-nums tracking-tight text-slate-900">
                        {resultadoFiscal.memoriaCalculo.valorICMSDesonerado > 0
                          ? `-R$ ${resultadoFiscal.memoriaCalculo.valorICMSDesonerado.toFixed(2)}`
                          : `R$ ${resultadoFiscal.icms.valorTributo.toFixed(2)}`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {resultadoFiscal.memoriaCalculo.valorICMSDesonerado > 0
                          ? 'ICMS Desonerado ZFM (abate vNF)'
                          : 'Valor do ICMS Próprio'}
                      </div>
                    </div>
                  </div>

                  {/* ICMS-ST (Substituição Tributária) */}
                  {resultadoFiscal.icmsST.aplicavel && (
                    <div className="p-4 bg-indigo-50/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-display text-sm font-semibold text-indigo-950">ICMS-ST (Substituição Tributária)</strong>
                          <span className="tabular-nums bg-indigo-100 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded font-semibold text-[11px]">
                            MVA {resultadoFiscal.icmsST.mvaAplicada.toFixed(2)}%
                            {resultadoFiscal.icmsST.usouMvaOriginalSimples
                              ? ' (Original · Simples)'
                              : resultadoFiscal.icmsST.mvaAjustada !== resultadoFiscal.icmsST.mvaOriginal
                              ? ` (Ajustada · Orig. ${resultadoFiscal.icmsST.mvaOriginal.toFixed(2)}%)`
                              : ' (Original)'}
                          </span>
                          {resultadoFiscal.icmsST.cest && (
                            <span className="font-mono bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                              CEST {resultadoFiscal.icmsST.cest}
                            </span>
                          )}
                          {resultadoFiscal.icmsST.valorFCPST > 0 && (
                            <span className="tabular-nums bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                              FCP-ST {resultadoFiscal.icmsST.fcpSTAliquota}%: R$ {resultadoFiscal.icmsST.valorFCPST.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 leading-relaxed text-xs">
                          {resultadoFiscal.icmsST.motivoEnquadramento}
                        </p>
                        <div className="text-[11px] tabular-nums text-indigo-900 bg-white/80 px-2.5 py-1 rounded border border-indigo-200">
                          {resultadoFiscal.icmsST.formulaCalculo}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Base Legal: {resultadoFiscal.icmsST.fundamentacaoLegal}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold font-display tabular-nums tracking-tight text-indigo-900">
                          R$ {(resultadoFiscal.icmsST.valorICMSST + resultadoFiscal.icmsST.valorFCPST).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-indigo-700 tabular-nums">
                          {resultadoFiscal.icmsST.valorFCPST > 0
                            ? `ST R$ ${resultadoFiscal.icmsST.valorICMSST.toFixed(2)} + FCP-ST R$ ${resultadoFiscal.icmsST.valorFCPST.toFixed(2)}`
                            : 'Soma ao Total da NF-e (vNF)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DIFAL / FCP */}
                  {resultadoFiscal.difal.aplicavel && (
                    <div className="p-4 bg-[#FDF3F3]/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-display text-sm font-semibold text-[#111827]">
                            {resultadoFiscal.difal.tipoDifal === 'contribuinte_uso_consumo_ativo'
                              ? 'DIFAL Contribuinte (Uso/Consumo ou Ativo)'
                              : 'DIFAL Não Contribuinte (EC 87/2015)'}
                          </strong>
                          <span className="tabular-nums bg-[#FDF3F3] text-[#9E141A] border border-[#F3C6C8] px-2 py-0.5 rounded text-xs font-semibold">
                            Diferencial: {resultadoFiscal.difal.diferencial}%
                          </span>
                          <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            Resp.: {resultadoFiscal.difal.responsavelRecolhimento === 'destinatario' ? 'Destinatário' : 'Remetente'}
                          </span>
                          {resultadoFiscal.difal.valorFCP > 0 && (
                            <span className="tabular-nums bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-xs font-semibold">
                              FCP: {resultadoFiscal.difal.fcp}% (R$ {resultadoFiscal.difal.valorFCP.toFixed(2)})
                            </span>
                          )}
                        </div>
                        <p className="text-[#4B5563] leading-relaxed text-xs">
                          {resultadoFiscal.difal.tipoDifal === 'contribuinte_uso_consumo_ativo'
                            ? `Destinatário contribuinte (${etapa2.finalidadeMercadoria === 'consumo' ? 'uso/consumo' : 'ativo imobilizado'}): recolhimento pelo destinatário em ${etapa1.ufDestino} referente à diferença entre a alíquota interna (${resultadoFiscal.difal.aliquotaDestino}%) e interestadual (${resultadoFiscal.difal.aliquotaInter}%)`
                            : `Destinatário não contribuinte: recolhimento de DIFAL para o estado de destino (${etapa1.ufDestino}) correspondente à diferença entre a alíquota interna (${resultadoFiscal.difal.aliquotaDestino}%) e interestadual (${resultadoFiscal.difal.aliquotaInter}%)`}
                          {resultadoFiscal.difal.valorFCP > 0
                            ? `, acrescido de FCP de ${resultadoFiscal.difal.fcp}% (R$ ${resultadoFiscal.difal.valorFCP.toFixed(2)}).`
                            : '.'}
                        </p>
                        <div className="text-[11px] text-[#6B7280]">
                          Base Legal: {resultadoFiscal.difal.baseLegal}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold font-display tabular-nums tracking-tight text-[#9E141A]">
                          R$ {(resultadoFiscal.difal.valorDifal + resultadoFiscal.difal.valorFCP).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-[#6B7280] tabular-nums">
                          {resultadoFiscal.difal.valorFCP > 0
                            ? `DIFAL R$ ${resultadoFiscal.difal.valorDifal.toFixed(2)} + FCP R$ ${resultadoFiscal.difal.valorFCP.toFixed(2)}`
                            : 'DIFAL Destino'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IPI */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <strong className="font-display text-sm font-semibold text-slate-900">IPI</strong>
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold">
                          CST {resultadoFiscal.ipi.cst}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-slate-700">
                          Alíquota: {resultadoFiscal.ipi.aliquota}%
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-xs">
                        {resultadoFiscal.ipi.motivoEnquadramento}
                      </p>
                      <div className="text-[11px] text-slate-500">
                        Base Legal: {resultadoFiscal.ipi.fundamentacaoLegal}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-display tabular-nums tracking-tight text-slate-900">
                        R$ {resultadoFiscal.ipi.valorTributo.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500">Valor do IPI</div>
                    </div>
                  </div>

                  {/* PIS & COFINS */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <strong className="font-display text-sm font-semibold text-slate-900">PIS &amp; COFINS</strong>
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold">
                          CST {resultadoFiscal.pis.cst}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-slate-700">
                          PIS: {resultadoFiscal.pis.aliquota}% · COFINS: {resultadoFiscal.cofins.aliquota}%
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-xs">
                        {resultadoFiscal.pis.motivoEnquadramento}
                      </p>
                      <div className="text-[11px] text-slate-500">
                        Base Legal: {resultadoFiscal.pis.fundamentacaoLegal}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-display tabular-nums tracking-tight text-slate-900">
                        R$ {(resultadoFiscal.pis.valorTributo + resultadoFiscal.cofins.valorTributo).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500">Total PIS + COFINS</div>
                    </div>
                  </div>

                  {/* CBS e IBS (Reforma Tributária) */}
                  <div className="p-4 bg-[#F9FAFB] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="font-display text-sm font-semibold text-[#111827]">CBS &amp; IBS (Reforma Tributária)</strong>
                        <span className="font-mono tabular-nums bg-[#ECEEF2] text-[#111827] px-2 py-0.5 rounded text-[11px] font-semibold">
                          CST {resultadoFiscal.cbs.cst} · cClassTrib {resultadoFiscal.cbs.cClassTrib}
                        </span>
                        <span className="text-xs font-semibold text-[#9E141A] tabular-nums">
                          CBS: {resultadoFiscal.cbs.aliquota}% · IBS: {resultadoFiscal.ibs.aliquota}%
                        </span>
                      </div>
                      <p className="text-[#4B5563] leading-relaxed text-xs">
                        {resultadoFiscal.cbs.motivoEnquadramento}
                      </p>
                      <div className="text-[11px] text-[#6B7280]">
                        Base Legal: {resultadoFiscal.cbs.fundamentacaoLegal}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-display tabular-nums tracking-tight text-[#111827]">
                        R$ {(resultadoFiscal.cbs.valorTributo + resultadoFiscal.ibs.valorTributo).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">Projeção CBS + IBS</div>
                    </div>
                  </div>
                </div>

                {/* Memória de Cálculo Auditável Passo a Passo */}
                <div className="border-t border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-display text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#A8181F]" />
                      Memória de Cálculo Auditável (Alinhada às Tabelas de Referência)
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      vNF = vProd{resultadoFiscal.memoriaCalculo.valorICMSDesonerado > 0 ? ' - vICMSDeson' : ''}{resultadoFiscal.memoriaCalculo.valorIPI > 0 ? ' + vIPI' : ''}{resultadoFiscal.memoriaCalculo.valorICMSST > 0 ? ' + vST' : ''}{resultadoFiscal.memoriaCalculo.valorFCPST > 0 ? ' + vFCPST' : ''}
                    </span>
                  </div>
                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Rubrica</th>
                          <th className="py-2.5 px-3">Fórmula Aplicada</th>
                          <th className="py-2.5 px-3">Tabela de Referência</th>
                          <th className="py-2.5 px-3 text-right">Resultado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resultadoFiscal.memoriaCalculo.passos.map((passo, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                              {passo.tributo}
                            </td>
                            <td className="py-2.5 px-3 tabular-nums text-slate-700">{passo.formula}</td>
                            <td className="py-2.5 px-3 text-slate-500">{passo.referenciaTabela}</td>
                            <td className="py-2.5 px-3 font-display tabular-nums font-semibold text-slate-900 text-right whitespace-nowrap">
                              {passo.resultado}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Checklist SEFAZ de Conformidade */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-display text-[13px] font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Checklist de Validação &amp; Conformidade SEFAZ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {resultadoFiscal.checklistValidacoes.map((item, idx) => {
                    const isAlerta = item.status === 'alerta';
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                          isAlerta
                            ? 'bg-amber-50/70 border-amber-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {isAlerta ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className={`font-bold ${isAlerta ? 'text-amber-950' : 'text-slate-800'}`}>
                            {item.item}
                          </div>
                          <div className={`text-[11px] mt-0.5 ${isAlerta ? 'text-amber-900' : 'text-slate-500'}`}>
                            {item.mensagem}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODO 2: ESPELHO FIEL DA PLANILHA (MATRIZ NF-E) */}
          {modoResultado === 'espelho_planilha' && (
            <div className="bg-white border-2 border-slate-300 rounded-xl shadow-xs overflow-hidden">
              <div className="bg-slate-200/90 border-b border-slate-300 py-2.5 px-4 text-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  PARA EMISSÃO DE NOTA FISCAL ELETRONICA (NF-E) – MATRIZ OPERACIONAL
                </h3>
              </div>

              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Tabela Esquerda: REQUISITOS | INFORMAÇÕES */}
                <div className="lg:col-span-7 border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[460px]">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-2 px-3 border-r border-slate-300 w-1/2 uppercase text-[11px]">
                            REQUISITOS
                          </th>
                          <th className="py-2 px-3 uppercase text-[11px]">
                            INFORMAÇÕES
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            CFOP Estadual
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                            {resultadoFiscal.cfopRecomendado.abrangencia === 'estadual'
                              ? resultadoFiscal.cfopRecomendado.codigo
                              : '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            CFOP Interestadual
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                            {resultadoFiscal.cfopRecomendado.abrangencia === 'interestadual'
                              ? resultadoFiscal.cfopRecomendado.codigo
                              : '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            CFOP Estrangeira
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                            {resultadoFiscal.cfopRecomendado.abrangencia === 'exterior'
                              ? resultadoFiscal.cfopRecomendado.codigo
                              : '—'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            UF de Origem
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {etapa1.ufOrigem}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            UF de destino
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {etapa1.ufDestino}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            Descrição Natureza de operação fiscal utilizada
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 uppercase text-[11px]">
                            {resultadoFiscal.naturezaOperacao}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            Código da Origem da mercadoria (De 0 a 7)
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 font-mono">
                            {etapa3.origemMercadoria}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            Destinação da mercadoria
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 uppercase text-[11px]">
                            {etapa2.envolveZFMouALC
                              ? 'MATERIAL PARA INDUSTRIALIZAÇÃO NA ZONA FRANCA DE MANAUS'
                              : etapa2.finalidadeMercadoria.toUpperCase()}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 bg-slate-50 border-r border-slate-300">
                            <div className="font-semibold text-slate-800">Participante com ou sem Inscrição Estadual?</div>
                            <div className="text-[10px] text-slate-400 font-normal">Define incidência de DIFAL (EC 87/2015)</div>
                          </td>
                          <td className="py-1.5 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setEtapa2((prev) => ({
                                    ...prev,
                                    destinatarioContribuinte: true,
                                    destinatarioPossuiIE: true,
                                    consumidorFinal: false,
                                  }))
                                }
                                className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                                  etapa2.destinatarioPossuiIE
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                ✓ COM IE (Contribuinte)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEtapa2((prev) => ({
                                    ...prev,
                                    destinatarioContribuinte: false,
                                    destinatarioPossuiIE: false,
                                    consumidorFinal: true,
                                  }))
                                }
                                className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                                  !etapa2.destinatarioPossuiIE
                                    ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                ⚠ SEM IE (Não Contribuinte - DIFAL)
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            Se difal, qual a aliquota interna do estado de destino?
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {resultadoFiscal.difal.aliquotaDestino}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 bg-slate-50 border-r border-slate-300">
                            <div className="font-semibold text-slate-800">MVA de DiFAL</div>
                            <div className="text-[10px] text-slate-400 font-normal">Margem de valor agregado ajustável</div>
                          </td>
                          <td className="py-1.5 px-3 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={mvaPersonalizada !== '' ? mvaPersonalizada : (resultadoFiscal.icms.mva || '0%')}
                                onChange={(e) => setMvaPersonalizada(e.target.value)}
                                placeholder="Ex: 0%, 35%, 40% ou Isento"
                                className="w-28 p-1 font-bold text-xs text-slate-900 bg-white border border-slate-300 rounded outline-hidden focus:border-blue-500 shadow-2xs font-mono"
                              />
                              {mvaPersonalizada !== '' && (
                                <button
                                  type="button"
                                  onClick={() => setMvaPersonalizada('')}
                                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                                  title="Restaurar padrão sugerido pelo motor"
                                >
                                  Restaurar Padrão
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {['0%', '35%', '40%', '50%', 'Isento'].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => setMvaPersonalizada(chip)}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition-colors"
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            Vai gerar financeiro (Sim ou Não)?
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {etapa2.geraFinanceiro ? 'SIM' : 'NÃO'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            Vai movimentar estoque (Sim ou Não)?
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {etapa2.movimentaEstoque ? 'SIM' : 'NÃO'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            Emissão própria ou de terceiros?
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {etapa1.emissaoPropria}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabela Direita: TRIBUTOS | INFORMAÇÃO */}
                <div className="lg:col-span-5 space-y-3">
                  {/* ICMS */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-1.5 px-3 border-r border-slate-300 w-3/5 uppercase text-[11px]">
                            ICMS
                          </th>
                          <th className="py-1.5 px-3 uppercase text-[11px]">
                            INFORMAÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            ICMS - Alíquota
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.icms.aliquota}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            ICMS - {resultadoFiscal.icms.csosn ? 'CSOSN' : 'CST'}
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.icms.cst}
                          </td>
                        </tr>
                        {resultadoFiscal.icmsST.aplicavel && (
                          <>
                            <tr>
                              <td className="py-1.5 px-3 bg-indigo-50/70 border-r border-slate-300 text-indigo-950">
                                ICMS-ST - MVA Aplicada
                              </td>
                              <td className="py-1.5 px-3 font-bold font-mono text-indigo-900">
                                {resultadoFiscal.icmsST.mvaAplicada.toFixed(2)}%
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5 px-3 bg-indigo-50/70 border-r border-slate-300 text-indigo-950">
                                ICMS-ST - Base / Valor
                              </td>
                              <td className="py-1.5 px-3 font-bold font-mono text-indigo-900">
                                R$ {resultadoFiscal.icmsST.baseCalculoST.toFixed(2)} / R$ {resultadoFiscal.icmsST.valorICMSST.toFixed(2)}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Imposto de Importação */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-1.5 px-3 border-r border-slate-300 w-3/5 uppercase text-[11px]">
                            IMPOSTO DE IMPORTAÇÃO
                          </th>
                          <th className="py-1.5 px-3 uppercase text-[11px]">
                            INFORMAÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            II - Alíquota
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {resultadoFiscal.ii.aliquota || ''}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            II - CST
                          </td>
                          <td className="py-1.5 px-3 font-mono">
                            {resultadoFiscal.ii.cst || ''}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* PIS */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-1.5 px-3 border-r border-slate-300 w-3/5 uppercase text-[11px]">
                            PIS
                          </th>
                          <th className="py-1.5 px-3 uppercase text-[11px]">
                            INFORMAÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            PIS - Alíquota
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.pis.aliquota}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            PIS - CST
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.pis.cst}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* COFINS */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-1.5 px-3 border-r border-slate-300 w-3/5 uppercase text-[11px]">
                            COFINS
                          </th>
                          <th className="py-1.5 px-3 uppercase text-[11px]">
                            INFORMAÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            COFINS - Alíquota
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.cofins.aliquota}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            COFINS - CST
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.cofins.cst}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* IPI* */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-1.5 px-3 border-r border-slate-300 w-3/5 uppercase text-[11px]">
                            IPI*
                          </th>
                          <th className="py-1.5 px-3 uppercase text-[11px]">
                            INFORMAÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            NCM
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {etapa3.ncmCodigo}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            IPI - Alíquota
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.ipi.aliquota}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            IPI - CST
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.ipi.cst}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="bg-slate-50 p-2 text-[10px] text-slate-500 border-t border-slate-200">
                      * Informar ao menos um NCM para podermos validar a operação no simulador
                    </div>
                  </div>

                  {/* CBS* */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-1.5 px-3 border-r border-slate-300 w-3/5 uppercase text-[11px]">
                            CBS*
                          </th>
                          <th className="py-1.5 px-3 uppercase text-[11px]">
                            INFORMAÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            CST
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.cbs.cst}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            CCLASSTRIB
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.cbs.cClassTrib}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            ALIQUOTA
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.cbs.aliquota}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* IBS UF* */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-1.5 px-3 border-r border-slate-300 w-3/5 uppercase text-[11px]">
                            IBS UF*
                          </th>
                          <th className="py-1.5 px-3 uppercase text-[11px]">
                            INFORMAÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            CST
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.ibs.cst}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            CCLASSTRIB
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.ibs.cClassTrib}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 px-3 bg-slate-50 border-r border-slate-300">
                            ALIQUOTA
                          </td>
                          <td className="py-1.5 px-3 font-bold font-mono">
                            {resultadoFiscal.ibs.aliquota}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODO 3: COMPARADOR DE CENÁRIOS INTEGRADO */}
          {modoResultado === 'comparador' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                      Análise Comparativa de Cenários Tributários
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comparação simultânea da carga tributária para este produto (Valor: R${' '}
                      {etapa3.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) entre 3 rotas fiscais.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    Planejamento Fiscal Inteligente
                  </span>
                </div>

                {/* Grid dos 3 Cenários Lado a Lado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cenário 1: Operação Atual */}
                  <div className="bg-blue-50/60 p-4 rounded-xl border-2 border-blue-400 space-y-3 relative shadow-2xs">
                    <span className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      Cenário Atual Configurado
                    </span>
                    <div>
                      <span className="text-[11px] font-semibold text-blue-700">
                        Cenário 1
                      </span>
                      <h4 className="font-display text-sm font-bold text-slate-900 mt-0.5">
                        {etapa1.ufOrigem} ➔ {etapa1.ufDestino}
                      </h4>
                      <p className="text-[11px] text-slate-600 capitalize">
                        {resultadoFiscal.cfopRecomendado.abrangencia} ({etapa2.finalidadeMercadoria})
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-blue-200 pt-2 text-slate-700 tabular-nums">
                      <div className="flex justify-between">
                        <span>CFOP:</span>
                        <strong className="font-mono text-blue-900">{resultadoFiscal.cfopRecomendado.codigo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>CST ICMS:</span>
                        <strong className="font-mono">{resultadoFiscal.icms.cst}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Alíquota ICMS:</span>
                        <strong>{resultadoFiscal.icms.aliquota}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>ICMS-ST / DIFAL:</span>
                        <strong>
                          {resultadoFiscal.icmsST.aplicavel
                            ? `ST R$ ${resultadoFiscal.icmsST.valorICMSST.toFixed(2)} (MVA ${resultadoFiscal.icmsST.mvaAplicada.toFixed(1)}%)`
                            : resultadoFiscal.difal.aplicavel
                            ? `DIFAL ${resultadoFiscal.difal.diferencial}% (R$ ${resultadoFiscal.difal.valorDifal.toFixed(2)})`
                            : 'Não aplicável'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>IPI (TIPI):</span>
                        <strong>{resultadoFiscal.ipi.aliquota}% (R$ {resultadoFiscal.ipi.valorTributo.toFixed(2)})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>PIS / COFINS:</span>
                        <strong>
                          {(Number(resultadoFiscal.pis.aliquota) + Number(resultadoFiscal.cofins.aliquota)).toFixed(2)}%
                        </strong>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-blue-300 space-y-1">
                      <div className="text-[11px] text-slate-500">Total de Tributos:</div>
                      <div className="text-lg font-bold font-display tabular-nums tracking-tight text-blue-950">
                        R$ {resultadoFiscal.memoriaCalculo.totalTributos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] font-semibold text-blue-700 tabular-nums">
                        Carga Efetiva: {resultadoFiscal.memoriaCalculo.cargaTributariaEfetivaPercentual}%
                      </div>
                    </div>
                  </div>

                  {/* Cenário 2: Venda Interna no mesmo estado (calculado em tempo real pelo Motor) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Cenário 2
                      </span>
                      <h4 className="font-display text-sm font-bold text-slate-900 mt-0.5">
                        {etapa1.ufOrigem} ➔ {etapa1.ufOrigem} (Venda Interna)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {nomesRegimes[etapa1.regimeTributario]} dentro do estado de {etapa1.ufOrigem}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-200 pt-2 text-slate-700 tabular-nums">
                      <div className="flex justify-between">
                        <span>CFOP:</span>
                        <strong className="font-mono">{resultadoCenarioInterna.cfopRecomendado.codigo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>CST/CSOSN ICMS:</span>
                        <strong className="font-mono">{resultadoCenarioInterna.icms.cst}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Alíquota ICMS:</span>
                        <strong>{resultadoCenarioInterna.icms.aliquota}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>DIFAL / Partilha:</span>
                        <span className="text-slate-400">Não aplicável (interna)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IPI (TIPI):</span>
                        <strong>
                          {resultadoCenarioInterna.ipi.aliquota}% (R$ {resultadoCenarioInterna.ipi.valorTributo.toFixed(2)})
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>PIS / COFINS:</span>
                        <strong>
                          {(
                            Number(resultadoCenarioInterna.pis.aliquota) +
                            Number(resultadoCenarioInterna.cofins.aliquota)
                          ).toFixed(2)}% (CST {resultadoCenarioInterna.pis.cst})
                        </strong>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="text-[11px] text-slate-500">Total de Tributos:</div>
                      <div className="text-lg font-bold font-display tabular-nums tracking-tight text-slate-900">
                        R${' '}
                        {resultadoCenarioInterna.memoriaCalculo.totalTributos.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 tabular-nums">
                        Carga Efetiva: {resultadoCenarioInterna.memoriaCalculo.cargaTributariaEfetivaPercentual}%
                      </div>
                    </div>
                  </div>

                  {/* Cenário 3: Exportação Internacional (calculado em tempo real pelo Motor) */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-300 space-y-3">
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Cenário 3 · Desoneração Máxima
                    </span>
                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 mt-0.5">
                        {etapa1.ufOrigem} ➔ Exterior (Exportação)
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Imunidade Constitucional (Art. 155 CF/88)
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-emerald-200 pt-2 text-slate-700 tabular-nums">
                      <div className="flex justify-between">
                        <span>CFOP:</span>
                        <strong className="font-mono text-emerald-800">
                          {resultadoCenarioExportacao.cfopRecomendado.codigo}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>CST ICMS:</span>
                        <strong className="font-mono">{resultadoCenarioExportacao.icms.cst} (Não Tributada)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Alíquota ICMS:</span>
                        <strong className="text-emerald-700">{resultadoCenarioExportacao.icms.aliquota}% (Imune)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>DIFAL:</span>
                        <span className="text-emerald-700">Isento</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IPI:</span>
                        <strong className="text-emerald-700">
                          {resultadoCenarioExportacao.ipi.aliquota}% (CST {resultadoCenarioExportacao.ipi.cst})
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>PIS / COFINS:</span>
                        <strong className="text-emerald-700">
                          {(
                            Number(resultadoCenarioExportacao.pis.aliquota) +
                            Number(resultadoCenarioExportacao.cofins.aliquota)
                          ).toFixed(2)}% (CST {resultadoCenarioExportacao.pis.cst})
                        </strong>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-emerald-300 space-y-1">
                      <div className="text-[11px] text-emerald-800 font-medium">Total de Tributos:</div>
                      <div className="text-lg font-bold font-display tabular-nums tracking-tight text-emerald-700">
                        R${' '}
                        {resultadoCenarioExportacao.memoriaCalculo.totalTributos.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800 tabular-nums">
                        Carga Efetiva: {resultadoCenarioExportacao.memoriaCalculo.cargaTributariaEfetivaPercentual}% (Desoneração Total)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODO 4: CALCULADORA DE DEVOLUÇÃO & ESTORNO */}
          {modoResultado === 'devolucao' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      Calculadora de Devolução de Mercadoria &amp; Estorno de Impostos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Geração dos valores fiscais exatos para emissão da NF-e de devolução (parcial ou total) conforme Convênio ICMS 54/2000 e Art. 4º do RICMS.
                    </p>
                  </div>

                  {/* Seletor de Percentual de Devolução */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <span className="text-slate-500 px-2">Percentual:</span>
                    {[20, 50, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPercentualDevolucao(pct)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          percentualDevolucao === pct
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pct === 100 ? '100% (Total)' : `${pct}% (Parcial)`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quadro de Valores Estornados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-medium text-slate-500">Valor Mercadoria Devolvida</span>
                    <div className="text-lg font-bold font-display tabular-nums tracking-tight text-slate-900 mt-1">
                      R${' '}
                      {((etapa3.valorTotal * percentualDevolucao) / 100).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {percentualDevolucao}% do valor original (R$ {etapa3.valorTotal.toFixed(2)})
                    </span>
                  </div>

                  <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
                    <span className="text-xs font-medium text-blue-700">ICMS Próprio a Estornar</span>
                    <div className="text-lg font-bold font-display tabular-nums tracking-tight text-blue-950 mt-1">
                      R${' '}
                      {((resultadoFiscal.icms.valorTributo * percentualDevolucao) / 100).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[11px] text-blue-700 tabular-nums">
                      Alíquota original: {resultadoFiscal.icms.aliquota}%
                    </span>
                  </div>

                  <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200">
                    <span className="text-xs font-medium text-purple-700">IPI a Estornar</span>
                    <div className="text-lg font-bold font-display tabular-nums tracking-tight text-purple-950 mt-1">
                      R${' '}
                      {((resultadoFiscal.ipi.valorTributo * percentualDevolucao) / 100).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[11px] text-purple-700">
                      Em outras despesas (se emitente não contribuinte)
                    </span>
                  </div>

                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                    <span className="text-xs font-medium text-amber-800">
                      {resultadoFiscal.icmsST.aplicavel ? 'ICMS-ST + FCP-ST a Estornar' : 'DIFAL + FCP a Anular'}
                    </span>
                    <div className="text-lg font-bold font-display tabular-nums tracking-tight text-amber-950 mt-1">
                      R${' '}
                      {(
                        (((resultadoFiscal.icmsST.aplicavel
                          ? resultadoFiscal.icmsST.valorICMSST + resultadoFiscal.icmsST.valorFCPST
                          : resultadoFiscal.difal.valorDifal + resultadoFiscal.difal.valorFCP) *
                          percentualDevolucao) /
                        100)
                      ).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-[10px] text-amber-700">
                      {resultadoFiscal.icmsST.aplicavel
                        ? 'Informar em Outras Despesas Acessórias (vOutro) quando não substituto'
                        : resultadoFiscal.difal.aplicavel
                        ? `Partilha anulada proporcional${resultadoFiscal.difal.valorFCP > 0 ? ` (inclui FCP ${resultadoFiscal.difal.fcp}%)` : ''}`
                        : 'Não aplicável'}
                    </span>
                  </div>
                </div>

                {/* Dados da NF-e de Devolução */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                    Parâmetros Oficiais para Emissão da NF-e de Devolução:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(() => {
                      const cfopOrigClean = resultadoFiscal.cfopRecomendado.codigo.replace(/\D/g, '');
                      const ehEntradaOrig = ['1', '2', '3'].includes(cfopOrigClean[0]);
                      const ehProdOrig = ['101', '107', '109', '401', '402'].includes(cfopOrigClean.slice(1));
                      const ehSTOrig = ['401', '402', '403', '404', '405'].includes(cfopOrigClean.slice(1));
                      const pref =
                        resultadoFiscal.cfopRecomendado.abrangencia === 'exterior'
                          ? ehEntradaOrig
                            ? '7'
                            : '3'
                          : resultadoFiscal.cfopRecomendado.abrangencia === 'estadual'
                          ? ehEntradaOrig
                            ? '5'
                            : '1'
                          : ehEntradaOrig
                          ? '6'
                          : '2';
                      const suf = ehSTOrig ? (ehProdOrig ? '410' : '411') : ehProdOrig ? '201' : '202';
                      const cfopDevCalc = `${pref}.${suf}`;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[11px] text-slate-500 font-semibold">CFOP de Devolução:</span>
                          <div className="font-mono font-bold text-blue-700 text-sm mt-0.5">
                            {cfopDevCalc}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {ehEntradaOrig
                              ? 'Devolução de compra para comercialização/industrialização'
                              : ehSTOrig
                              ? 'Devolução de venda de mercadoria sujeita à ST'
                              : ehProdOrig
                              ? 'Devolução de venda de produção do estabelecimento'
                              : 'Devolução de venda de mercadoria adquirida de terceiros'}
                          </span>
                        </div>
                      );
                    })()}

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold">Natureza da Operação:</span>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">
                        DEVOLUÇÃO DE MERCADORIA RECEBIDA DE TERCEIROS
                      </div>
                      <span className="text-[10px] text-slate-400">Finalidade de Emissão: 4 - Devolução</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold">Chave Referenciada (tag refNFe):</span>
                      <div className="font-mono text-slate-600 text-xs mt-0.5">
                        [Informar Chave de 44 dígitos da NF-e original]
                      </div>
                      <span className="text-[10px] text-slate-400">Obrigatória no MOC v7.0</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                    <strong>Texto Sugerido para Informações Complementares da NF-e:</strong><br />
                    &ldquo;Devolução {percentualDevolucao === 100 ? 'total' : 'parcial'} de mercadorias referente à NF-e nº [NÚMERO], emitida em [DATA], no valor de R$ {((etapa3.valorTotal * percentualDevolucao) / 100).toFixed(2)}. ICMS destacado nos termos do Convênio ICMS 54/2000 e Art. 4º, IV do RICMS para recuperação do crédito original.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODO 5: AUDITORIA CRUZADA DO XML DA NF-E */}
          {modoResultado === 'auditoria_xml' && nfeAuditada && (
            <div className="space-y-6">
              {/* Header do Documento Importado */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-[#A8181F] text-white rounded-xl shadow-2xs shrink-0">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8181F] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                          NF-e nº {nfeAuditada.numeroNF} • Série {nfeAuditada.serie}
                        </span>
                        <span className="text-xs text-slate-500">
                          Emissão: <strong>{nfeAuditada.dataEmissao}</strong>
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          NatOp: {nfeAuditada.naturezaOperacao}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-1 break-all flex items-center gap-2">
                        <span>Chave: {nfeAuditada.chaveAcesso || 'Chave gerada pelo arquivo XML'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsModalXMLAberta(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Trocar XML
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoResultado('executiva')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A8181F] hover:bg-[#94151B] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Ver na Visão Executiva
                    </button>
                  </div>
                </div>

                {/* Quadro de Partes Envolvidas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                        Emitente (Origem)
                      </span>
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                        CRT {nfeAuditada.emitente.crt} ({etapa1.regimeTributario.replace('_', ' ').toUpperCase()})
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{nfeAuditada.emitente.razaoSocial}</div>
                    <div className="text-slate-600 flex items-center justify-between">
                      <span>CNPJ: {nfeAuditada.emitente.cnpj}</span>
                      <strong className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        UF: {nfeAuditada.emitente.uf}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                        Destinatário (Destino)
                      </span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        {nfeAuditada.destinatario.envolveZFM ? 'ZFM / ALC Beneficiada' : 'Regime Padrão'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{nfeAuditada.destinatario.razaoSocial}</div>
                    <div className="text-slate-600 flex items-center justify-between">
                      <span>{nfeAuditada.destinatario.cnpjCpf} • IE: {nfeAuditada.destinatario.inscricaoEstadual || 'ISENTO'}</span>
                      <strong className="font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        UF: {nfeAuditada.destinatario.uf}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Seletor de Itens da Nota */}
                {nfeAuditada.itens.length > 1 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      Esta nota possui {nfeAuditada.itens.length} itens. Selecione o produto para auditar:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {nfeAuditada.itens.map((it, idx) => (
                        <button
                          key={it.nItem}
                          type="button"
                          onClick={() => {
                            handleCarregarXMLNoSimulador(nfeAuditada, idx);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                            itemNFeIndex === idx
                              ? 'bg-[#A8181F] text-white border-[#A8181F] shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Item {it.nItem}: {it.xProd.substring(0, 24)}... (NCM {it.ncm})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabela de Confronto: Declarado no XML vs Motor FiscalDesk */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Confronto de Auditoria: Declarado no XML vs Parametrização FiscalDesk
                      </h3>
                      <p className="text-xs text-slate-500">
                        Análise de conformidade tributária item a item segundo SEFAZ MOC v7.0 e legislação vigente.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Produto Ativo:</span>
                    <div className="text-xs font-bold text-slate-900 truncate max-w-xs">
                      {nfeAuditada.itens[itemNFeIndex]?.xProd}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Tributo / Parâmetro</th>
                        <th className="py-3 px-4">Declarado no XML da NF-e</th>
                        <th className="py-3 px-4">Apurado pelo Motor FiscalDesk</th>
                        <th className="py-3 px-4 text-center">Status SEFAZ</th>
                        <th className="py-3 px-4">Fundamentação Legal & Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* CFOP */}
                      {(() => {
                        const itemAtual = nfeAuditada.itens[itemNFeIndex] || nfeAuditada.itens[0];
                        const cfopXML = itemAtual.cfop;
                        const cfopMotor = resultadoFiscal.cfopRecomendado.codigo;
                        const matchCFOP = cfopXML === cfopMotor;

                        return (
                          <tr className={matchCFOP ? 'hover:bg-slate-50' : 'bg-amber-50/40 hover:bg-amber-50/60'}>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              CFOP (Código Fiscal de Operações)
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              {cfopXML}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-blue-700">
                              {cfopMotor}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {matchCFOP ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Conforme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Divergência
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">
                              {resultadoFiscal.cfopRecomendado.quandoUsar}
                            </td>
                          </tr>
                        );
                      })()}

                      {/* ICMS CST */}
                      {(() => {
                        const itemAtual = nfeAuditada.itens[itemNFeIndex] || nfeAuditada.itens[0];
                        const cstXML = itemAtual.cstICMS;
                        const cstMotor = resultadoFiscal.icms.cst;
                        const matchCST = cstXML === cstMotor;

                        return (
                          <tr className={matchCST ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/60'}>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              ICMS • CST / CSOSN
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              CST {cstXML || 'N/D'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-blue-700">
                              CST {cstMotor}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {matchCST ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Conforme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Inconsistente
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">
                              {resultadoFiscal.icms.fundamentacaoLegal}
                            </td>
                          </tr>
                        );
                      })()}

                      {/* ICMS Alíquota e Valor */}
                      {(() => {
                        const itemAtual = nfeAuditada.itens[itemNFeIndex] || nfeAuditada.itens[0];
                        const aliqXML = itemAtual.aliquotaICMS;
                        const aliqMotor = resultadoFiscal.icms.aliquota;
                        const matchAliq = aliqXML === aliqMotor;

                        return (
                          <tr className={matchAliq ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/60'}>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              ICMS • Alíquota & Valor
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              <strong>{aliqXML}%</strong> (R$ {itemAtual.valorICMS.toFixed(2)})
                            </td>
                            <td className="py-3 px-4 text-blue-700">
                              <strong>{aliqMotor}%</strong> (R$ {resultadoFiscal.icms.valorTributo.toFixed(2)})
                            </td>
                            <td className="py-3 px-4 text-center">
                              {matchAliq ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Conforme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Divergência
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">
                              Alíquota interestadual determinada pela Res. SF 22/89 (7% ou 12%) ou Res. SF 13/12 (4% importados).
                            </td>
                          </tr>
                        );
                      })()}

                      {/* DIFAL Partilha */}
                      {(() => {
                        const itemAtual = nfeAuditada.itens[itemNFeIndex] || nfeAuditada.itens[0];
                        const difalXML = itemAtual.valorDIFAL || 0;
                        const difalMotor = resultadoFiscal.difal.valorDifal;
                        const difalExigivel = resultadoFiscal.difal.aplicavel;

                        return (
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              DIFAL (Partilha Destino EC 87/15)
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {difalXML > 0 ? `R$ ${difalXML.toFixed(2)}` : 'Sem destaque'}
                            </td>
                            <td className="py-3 px-4 text-indigo-700">
                              {difalExigivel ? `R$ ${difalMotor.toFixed(2)} (${resultadoFiscal.difal.diferencial}%)` : 'Não Exigível / Isento'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {difalExigivel === (difalXML > 0) ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Conforme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Verificar DIFAL
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">
                              {resultadoFiscal.difal.baseLegal}
                            </td>
                          </tr>
                        );
                      })()}

                      {/* IPI */}
                      {(() => {
                        const itemAtual = nfeAuditada.itens[itemNFeIndex] || nfeAuditada.itens[0];
                        const cstIpiXML = (itemAtual.cstIPI || '').trim();
                        const aliqIpiXML = Number(itemAtual.aliquotaIPI || 0);
                        const aliqIpiMotor = Number(resultadoFiscal.ipi.aliquota || 0);
                        const matchIPI =
                          (!cstIpiXML || cstIpiXML === resultadoFiscal.ipi.cst) &&
                          Math.abs(aliqIpiXML - aliqIpiMotor) < 0.01;
                        return (
                          <tr className={matchIPI ? 'hover:bg-slate-50' : 'bg-amber-50/40 hover:bg-amber-50/60'}>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              IPI (Imposto sobre Produtos Industrializados)
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              CST {cstIpiXML || 'N/D'} • {aliqIpiXML}% (R$ {(itemAtual.valorIPI || 0).toFixed(2)})
                            </td>
                            <td className="py-3 px-4 text-purple-700">
                              CST {resultadoFiscal.ipi.cst} • {aliqIpiMotor}% (R$ {resultadoFiscal.ipi.valorTributo.toFixed(2)})
                            </td>
                            <td className="py-3 px-4 text-center">
                              {matchIPI ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Conforme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Divergência
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">
                              {resultadoFiscal.ipi.fundamentacaoLegal}
                            </td>
                          </tr>
                        );
                      })()}

                      {/* PIS & COFINS */}
                      {(() => {
                        const itemAtual = nfeAuditada.itens[itemNFeIndex] || nfeAuditada.itens[0];
                        const cstPisXML = (itemAtual.cstPIS || '').trim();
                        const cstCofXML = (itemAtual.cstCOFINS || '').trim();
                        const aliqPisXML = Number(itemAtual.aliquotaPIS || 0);
                        const aliqCofXML = Number(itemAtual.aliquotaCOFINS || 0);
                        const matchPisCof =
                          (!cstPisXML || cstPisXML === resultadoFiscal.pis.cst) &&
                          (!cstCofXML || cstCofXML === resultadoFiscal.cofins.cst) &&
                          Math.abs(aliqPisXML - Number(resultadoFiscal.pis.aliquota || 0)) < 0.05 &&
                          Math.abs(aliqCofXML - Number(resultadoFiscal.cofins.aliquota || 0)) < 0.05;
                        return (
                          <tr className={matchPisCof ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/60'}>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              PIS & COFINS (Contribuições Federais)
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              PIS CST {cstPisXML || 'N/D'} ({aliqPisXML}%) • COF CST {cstCofXML || 'N/D'} ({aliqCofXML}%)
                            </td>
                            <td className="py-3 px-4 text-emerald-700">
                              PIS CST {resultadoFiscal.pis.cst} ({resultadoFiscal.pis.aliquota}%) • COF CST {resultadoFiscal.cofins.cst} ({resultadoFiscal.cofins.aliquota}%)
                            </td>
                            <td className="py-3 px-4 text-center">
                              {matchPisCof ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Conforme
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Divergência
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">
                              {resultadoFiscal.pis.fundamentacaoLegal}
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopiarResumo}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copiado ? 'Copiado para Área de Transferência!' : 'Copiar Parametrização para ERP'}
              </button>
              <button
                type="button"
                onClick={handleExportarCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar para Planilha (CSV/Excel)
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-[11px]">
                <strong>Referência Oficial:</strong> MOC NF-e v7.0 • TIPI Dec. 11.158/22 • Conv. 65/88 • EC 132/23
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação e Análise de XML */}
      <ImportadorXMLModal
        isOpen={isModalXMLAberta}
        onClose={() => setIsModalXMLAberta(false)}
        onCarregarNoSimulador={(dados: DadosNFeExtraidos, itemIdx: number) => {
          handleCarregarXMLNoSimulador(dados, itemIdx);
          setIsModalXMLAberta(false);
        }}
      />
    </div>
  );
};
