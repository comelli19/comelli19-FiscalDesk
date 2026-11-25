import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NCMInfo } from '../../types/fiscal';
import {
  Tag,
  Search,
  BookOpen,
  Copy,
  Layers,
  Filter,
  CheckCircle2,
  RefreshCw,
  Database,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  buscarNCMsRemoto,
  obterStatusCatalogoRemoto,
  StatusCatalogoTIPI,
} from '../../services/ncmAsyncService';
import {
  assinarProgressoHidratacaoNCM,
  iniciarHidratacaoPreguicosaNCM,
  obterProgressoHidratacaoNCM,
  ProgressoHidratacaoNCM,
} from '../../services/ncmLazyCacheHydrator';
import { ModalImportarTIPI } from './ModalImportarTIPI';

interface NCMConsultaProps {
  ncms: NCMInfo[];
  onSelectNCMForCalculator?: (ncm: string, ipi: number) => void;
}

export const NCMConsulta: React.FC<NCMConsultaProps> = ({
  ncms: initialNCMs,
  onSelectNCMForCalculator,
}) => {
  // Filters & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [selectedCapitulo, setSelectedCapitulo] = useState<string>('todos');
  const [onlyST, setOnlyST] = useState<boolean>(false);
  const [onlyMonofasico, setOnlyMonofasico] = useState<boolean>(false);

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(30);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRegistros, setTotalRegistros] = useState<number>(initialNCMs.length);

  // Remote data states
  const [ncmList, setNcmList] = useState<NCMInfo[]>(initialNCMs);
  const [selectedNCM, setSelectedNCM] = useState<NCMInfo>(initialNCMs[0]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [statusCatalogo, setStatusCatalogo] = useState<StatusCatalogoTIPI | null>(null);
  const [capitulosDisponiveis, setCapitulosDisponiveis] = useState<
    { capitulo: string; titulo: string }[]
  >([]);
  const [setoresDisponiveis, setSetoresDisponiveis] = useState<string[]>([]);

  // UI state
  const [copied, setCopied] = useState(false);
  const [isModalImportOpen, setIsModalImportOpen] = useState(false);
  const [progressoCache, setProgressoCache] = useState<ProgressoHidratacaoNCM | null>(null);

  // Timer para debounce na busca digitada
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearchRef = useRef(true);

  // Carrega status inicial do catálogo TIPI e acompanha hidratação lazy no IndexedDB
  useEffect(() => {
    obterStatusCatalogoRemoto().then((st) => {
      if (st) setStatusCatalogo(st);
    });
    obterProgressoHidratacaoNCM().then(setProgressoCache).catch(() => {});
    const unsubscribe = assinarProgressoHidratacaoNCM(setProgressoCache);
    void iniciarHidratacaoPreguicosaNCM({ atrasoInicialMs: 600 });
    return () => {
      unsubscribe();
    };
  }, []);

  // Executa busca remota assíncrona com filtros e paginação
  const carregarNCMsRemoto = async (
    termo: string,
    cap: string,
    set: string,
    st: boolean,
    mono: boolean,
    pagina: number
  ) => {
    setCarregando(true);
    try {
      const resp = await buscarNCMsRemoto({
        q: termo,
        capitulo: cap,
        setor: set,
        onlyST: st,
        onlyMonofasico: mono,
        page: pagina,
        limit,
      });

      setNcmList(resp.data);
      setTotalRegistros(resp.total);
      setTotalPages(resp.totalPages);
      if (resp.capitulosDisponiveis?.length > 0) {
        setCapitulosDisponiveis(resp.capitulosDisponiveis);
      }
      if (resp.setoresDisponiveis?.length > 0) {
        setSetoresDisponiveis(resp.setoresDisponiveis);
      }

      // Se o selecionado não estiver na lista nova, seleciona o primeiro
      if (resp.data.length > 0) {
        const jaSelecionadoNaLista = resp.data.some(
          (n) => n.codigo === selectedNCM?.codigo
        );
        if (!jaSelecionadoNaLista) {
          setSelectedNCM(resp.data[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar NCMs remotamente:', err);
    } finally {
      setCarregando(false);
    }
  };

  // Efeito disparado na alteração de filtros imediatos (capítulo, setor, flags, página)
  useEffect(() => {
    carregarNCMsRemoto(searchTerm, selectedCapitulo, selectedSector, onlyST, onlyMonofasico, page);
  }, [selectedCapitulo, selectedSector, onlyST, onlyMonofasico, page]);

  // Efeito disparado ao digitar na barra de pesquisa (com debounce de 350ms, ignorando 1ª montagem)
  useEffect(() => {
    if (isFirstSearchRef.current) {
      isFirstSearchRef.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setPage(1); // Volta para a página 1 ao pesquisar
      carregarNCMsRemoto(searchTerm, selectedCapitulo, selectedSector, onlyST, onlyMonofasico, 1);
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  const handleCopyCode = (codigo: string) => {
    navigator.clipboard.writeText(codigo.replace(/\D/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Corporativo do Catálogo TIPI */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E7EC] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#9E141A] text-white rounded-lg shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-base font-semibold text-[#111827]">
                Catálogo NCM & Tabela TIPI da Receita Federal
              </h2>
              <span className="text-xs text-[#6B7280] font-medium">
                ·{' '}
                {statusCatalogo?.fonteAtiva === 'siscomex'
                  ? `Portal Único Siscomex (${statusCatalogo.totalRegistros.toLocaleString('pt-BR')} NCMs)`
                  : statusCatalogo?.fonteAtiva === 'brasilapi'
                  ? `BrasilAPI Oficial (${statusCatalogo.totalRegistros.toLocaleString('pt-BR')} NCMs)`
                  : 'Consulta remota paginada'}
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Tabela NCM vigente ({statusCatalogo?.atoLegal || 'Decreto nº 11.158/2022'}): 96 Capítulos ativos, descrições oficiais sob demanda, IPI, PIS/COFINS e CEST.
            </p>
          </div>
        </div>

        {/* Action Buttons: Sync & Import */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsModalImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#131417] hover:bg-[#1E2028] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            title="Sincronizar base completa ou importar arquivo de NCMs"
          >
            <Database className="w-4 h-4 text-[#EF888D]" />
            <span>Sincronizar / Importar TIPI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              obterStatusCatalogoRemoto().then((st) => st && setStatusCatalogo(st));
              carregarNCMsRemoto(searchTerm, selectedCapitulo, selectedSector, onlyST, onlyMonofasico, page);
            }}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin text-[#A8181F]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisa remota: digite o código NCM (ex: 8504.40.10, 3925, 1006), mercadoria (arroz, transformador, tubo, plástico), CEST ou capítulo..."
            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#A8181F] text-slate-900 outline-hidden"
          />
          {carregando && (
            <div className="absolute right-3 top-3">
              <RefreshCw className="w-4 h-4 text-[#A8181F] animate-spin" />
            </div>
          )}
        </div>

        {/* Filter Selectors Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Seletor de Capítulos TIPI (01 a 97) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Capítulo Oficial TIPI (01 a 97)
            </label>
            <select
              value={selectedCapitulo}
              onChange={(e) => {
                setSelectedCapitulo(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 cursor-pointer"
            >
              <option value="todos">Todos os 96 Capítulos Ativos</option>
              {capitulosDisponiveis.map((c) => (
                <option key={c.capitulo} value={c.capitulo}>
                  {c.titulo}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Setores Econômicos */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Setor Econômico
            </label>
            <select
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 cursor-pointer"
            >
              <option value="todos">Todos os Setores</option>
              {setoresDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes de Filtro Tributário */}
          <div className="md:col-span-2 flex items-center justify-end gap-5 pt-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={onlyST}
                onChange={(e) => {
                  setOnlyST(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-300 text-[#A8181F] focus:ring-[#A8181F]"
              />
              <span className="font-bold text-[11px]">Apenas com ST (Substituição Tributária)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900">
              <input
                type="checkbox"
                checked={onlyMonofasico}
                onChange={(e) => {
                  setOnlyMonofasico(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-300 text-[#A8181F] focus:ring-[#A8181F]"
              />
              <span className="font-bold text-[11px]">Apenas PIS/COFINS Monofásico</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Layout: List Table + Official Source Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Search & Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col space-y-3 p-4">
          <div className="text-xs text-slate-500 flex justify-between items-center flex-wrap gap-2">
            <span>
              Exibindo <strong>{ncmList.length.toLocaleString('pt-BR')}</strong> de{' '}
              <strong>{totalRegistros.toLocaleString('pt-BR')}</strong> NCMs encontrados no catálogo remoto
            </span>
            {progressoCache?.estado === 'hydrating' ? (
              <span className="text-[11px] text-slate-500 flex items-center gap-2">
                <progress
                  value={progressoCache.percentual}
                  max={100}
                  aria-label="Progresso da indexação local de NCMs"
                  className="w-20 h-1.5 rounded-full overflow-hidden accent-[#9E141A]"
                />
                <span>
                  Indexando cache local ({progressoCache.percentual}%)
                </span>
              </span>
            ) : progressoCache?.completed ? (
              <span className="text-[11px] text-emerald-700 font-medium">
                Cache local completo ({progressoCache.totalSynced.toLocaleString('pt-BR')} NCMs)
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Clique na linha para inspecionar alíquotas e fontes legais
              </span>
            )}
          </div>

          {/* Tabela com Scroll */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-28">NCM</th>
                  <th className="py-2.5 px-3">Mercadoria / Segmento</th>
                  <th className="py-2.5 px-3 text-center w-16">IPI</th>
                  <th className="py-2.5 px-3 text-center w-24">PIS/COF</th>
                  <th className="py-2.5 px-3 text-center w-16">ST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {carregando && ncmList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-[#A8181F] animate-spin" />
                        <span>Consultando catálogo remoto da Receita Federal...</span>
                      </div>
                    </td>
                  </tr>
                ) : ncmList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      Nenhum NCM encontrado para os filtros selecionados. Digite o código de 8 dígitos para dedução automática.
                    </td>
                  </tr>
                ) : (
                  ncmList.map((n, idx) => {
                    const isSelected = selectedNCM?.codigo === n.codigo;
                    return (
                      <tr
                        key={`${n.codigo}-${idx}`}
                        onClick={() => setSelectedNCM(n)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-rose-50/80 font-medium border-l-4 border-[#A8181F]'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {n.codigo}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="line-clamp-2 leading-snug">{n.descricao}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {n.setor && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                {n.setor}
                              </span>
                            )}
                            {n.cestPadrao && (
                              <span className="text-[10px] text-purple-700 font-semibold">
                                CEST: {n.cestPadrao}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                          {n.aliquotaIPI.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              n.regimePISCOFINS === 'monofasico'
                                ? 'bg-amber-100 text-amber-900'
                                : n.regimePISCOFINS === 'aliquota_zero'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {n.regimePISCOFINS === 'monofasico'
                              ? 'Monofásico'
                              : n.regimePISCOFINS === 'aliquota_zero'
                              ? 'Alíq. Zero'
                              : 'Geral'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-semibold text-[11px] ${
                              n.temST ? 'text-purple-700 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {n.temST ? 'Sim' : 'Não'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação Assíncrona */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Página <strong>{page.toLocaleString('pt-BR')}</strong> de{' '}
              <strong>{totalPages.toLocaleString('pt-BR')}</strong> ({totalRegistros.toLocaleString('pt-BR')} itens)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1 || carregando}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>

              <button
                type="button"
                disabled={page >= totalPages || carregando}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
              >
                Próxima
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Inspector with Official Source Field */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col sticky top-4">
          {selectedNCM ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-blue-400">
                      {selectedNCM.codigo}
                    </span>
                    <button
                      onClick={() => handleCopyCode(selectedNCM.codigo)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                      title="Copiar código sem pontuação"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copied && <span className="text-[10px] text-emerald-400 font-bold">Copiado!</span>}
                  </div>
                  <span className="text-xs text-slate-300 block mt-0.5 font-medium">
                    Unidade de Medida Comex: <strong>{selectedNCM.unidadeTributavel}</strong>
                    {selectedNCM.setor && ` • ${selectedNCM.setor}`}
                  </span>
                </div>

                {onSelectNCMForCalculator && (
                  <button
                    onClick={() => onSelectNCMForCalculator(selectedNCM.codigo, selectedNCM.aliquotaIPI)}
                    className="px-3 py-1.5 bg-[#A8181F] hover:bg-[#94151B] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Usar na Calculadora
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4 text-xs">
                {/* Chapter & Description */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  {selectedNCM.capitulo && (
                    <span className="text-[10px] text-[#A8181F] font-bold uppercase block">
                      {selectedNCM.capitulo}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Descrição Oficial (TIPI / Siscomex):
                  </span>
                  <p className="text-slate-900 font-medium leading-relaxed">{selectedNCM.descricao}</p>
                </div>

                {/* Tax Breakdown Matrix */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Alíquota IPI</span>
                    <strong className="text-base text-slate-900 font-bold">{selectedNCM.aliquotaIPI}%</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">PIS / COFINS</span>
                    <strong className="text-xs text-blue-800 font-bold block mt-1">
                      {selectedNCM.aliquotaPIS}% / {selectedNCM.aliquotaCOFINS}%
                    </strong>
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">
                      {selectedNCM.regimePISCOFINS}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">CEST Padrão ST</span>
                    <strong className="text-xs text-purple-800 font-bold block mt-1">
                      {selectedNCM.cestPadrao || 'Sem CEST'}
                    </strong>
                    <span className="text-[9px] text-slate-500 font-semibold">
                      {selectedNCM.temST ? 'Sujeito à ST' : 'Sem ST'}
                    </span>
                  </div>
                </div>

                {/* Tributação Aproximada IBPT */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-semibold text-slate-800 flex items-center justify-between text-[11px]">
                    <span>Carga Tributária Média Estimada (IBPT):</span>
                    <span className="font-bold text-slate-900">
                      Total ~{(selectedNCM.tributacaoAproximadaIBPT.federal + selectedNCM.tributacaoAproximadaIBPT.estadual).toFixed(1)}%
                    </span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                    <div>Tributos Federais: <strong>{selectedNCM.tributacaoAproximadaIBPT.federal}%</strong></div>
                    <div>Tributos Estaduais (ICMS): <strong>{selectedNCM.tributacaoAproximadaIBPT.estadual}%</strong></div>
                  </div>
                </div>

                {/* Campo Oficial de onde buscou a informação (Obrigatório) */}
                <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    Campo Oficial de Origem da Informação Legal:
                  </span>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 font-medium text-slate-800 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Dispositivo Legal / Fonte:</span>
                        <p className="text-slate-900 font-bold text-xs">{selectedNCM.fonteOficial}</p>
                      </div>
                    </div>
                    {selectedNCM.observacao && (
                      <div className="pt-1.5 border-t border-slate-100">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Regra Prática & Particularidades:</span>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{selectedNCM.observacao}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                      Última conferência da legislação: <strong>{selectedNCM.dataAtualizacao}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Selecione um NCM na tabela ao lado para visualizar os detalhes e fontes oficiais.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Sincronização & Importação TIPI */}
      <ModalImportarTIPI
        isOpen={isModalImportOpen}
        onClose={() => setIsModalImportOpen(false)}
        statusAtual={statusCatalogo}
        onSuccess={() => {
          obterStatusCatalogoRemoto().then((st) => st && setStatusCatalogo(st));
          carregarNCMsRemoto(searchTerm, selectedCapitulo, selectedSector, onlyST, onlyMonofasico, page);
        }}
      />
    </div>
  );
};
