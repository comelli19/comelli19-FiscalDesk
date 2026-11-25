import React, { useState, useEffect, useRef } from 'react';
import { CFOP } from '../../types/fiscal';
import {
  Search,
  Filter,
  Star,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Calendar,
  FileSpreadsheet,
  FileText,
  Tag,
  Share2,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  buscarCFOPsRemoto,
  obterStatusCFOPRemoto,
  StatusCatalogoCFOP,
} from '../../services/cfopAsyncService';
import { ModalImportarCFOP } from './ModalImportarCFOP';

interface CFOPConsultaProps {
  cfops: CFOP[];
  onToggleFavorito: (id: string) => void;
  onSalvarAnotacao: (id: string, anotacao: string) => void;
  isAdmin: boolean;
  onEditCFOP?: (cfop: CFOP) => void;
  onNovoCFOP?: () => void;
}

export const CFOPConsulta: React.FC<CFOPConsultaProps> = ({
  cfops: initialCFOPs,
  onToggleFavorito,
  onSalvarAnotacao,
  isAdmin,
  onEditCFOP,
  onNovoCFOP,
}) => {
  // Filters & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [abrangenciaFiltro, setAbrangenciaFiltro] = useState<'todos' | 'estadual' | 'interestadual' | 'exterior'>('todos');
  const [grupoFiltro, setGrupoFiltro] = useState<string>('todos');
  const [apenasFavoritos, setApenasFavoritos] = useState(false);

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(30);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRegistros, setTotalRegistros] = useState<number>(initialCFOPs.length);

  // Data states
  const [cfopList, setCfopList] = useState<CFOP[]>(initialCFOPs);
  const [selectedCFOP, setSelectedCFOP] = useState<CFOP | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [statusCatalogo, setStatusCatalogo] = useState<StatusCatalogoCFOP | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // UI state
  const [isModalImportOpen, setIsModalImportOpen] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearchRef = useRef(true);

  // Carrega status inicial do catálogo SINIEF
  const carregarStatus = () => {
    obterStatusCFOPRemoto().then((st) => {
      if (st) setStatusCatalogo(st);
    });
  };

  useEffect(() => {
    carregarStatus();
  }, []);

  // Executa busca remota assíncrona
  const carregarCFOPsRemoto = async (
    termo: string,
    tipo: 'todos' | 'entrada' | 'saida',
    abrangencia: 'todos' | 'estadual' | 'interestadual' | 'exterior',
    grupo: string,
    favoritos: boolean,
    pagina: number
  ) => {
    setCarregando(true);
    try {
      const resp = await buscarCFOPsRemoto({
        q: termo,
        tipo,
        abrangencia,
        grupo,
        apenasFavoritos: favoritos,
        page: pagina,
        limit,
      });

      setCfopList(resp.data);
      setTotalRegistros(resp.total);
      setTotalPages(resp.totalPages);
    } catch (err) {
      console.error('Erro ao buscar CFOPs remotamente:', err);
    } finally {
      setCarregando(false);
    }
  };

  // Efeito disparado na alteração de filtros imediatos
  useEffect(() => {
    carregarCFOPsRemoto(searchTerm, tipoFiltro, abrangenciaFiltro, grupoFiltro, apenasFavoritos, page);
  }, [tipoFiltro, abrangenciaFiltro, grupoFiltro, apenasFavoritos, page]);

  // Efeito disparado ao digitar na busca (debounce de 350ms, ignorando 1ª montagem)
  useEffect(() => {
    if (isFirstSearchRef.current) {
      isFirstSearchRef.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setPage(1);
      carregarCFOPsRemoto(searchTerm, tipoFiltro, abrangenciaFiltro, grupoFiltro, apenasFavoritos, 1);
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  const handleOpenDetail = (cfop: CFOP) => {
    setSelectedCFOP(cfop);
    setEditingNote(cfop.anotacoes || '');
  };

  const handleExportCSV = () => {
    const headers = [
      'Código',
      'Descrição',
      'Tipo',
      'Abrangência',
      'Grupo',
      'CFOP Devolução',
      'ICMS Crédito/Débito',
      'IPI',
      'PIS/COFINS',
      'Estoque',
      'Financeiro',
      'Vigência Início',
      'Fonte',
    ];
    const rows = cfopList.map((c) => [
      `"${c.codigo}"`,
      `"${c.descricao.replace(/"/g, '""')}"`,
      `"${c.tipo}"`,
      `"${c.abrangencia}"`,
      `"${c.grupo}"`,
      `"${c.cfopDevolucao || ''}"`,
      c.geraCreditoDebitoICMS ? 'Sim' : 'Não',
      c.geraCreditoDebitoIPI ? 'Sim' : 'Não',
      c.geraCreditoDebitoPISCOFINS ? 'Sim' : 'Não',
      c.movimentaEstoque ? 'Sim' : 'Não',
      c.movimentaFinanceiro ? 'Sim' : 'Não',
      `"${c.vigenciaInicio}"`,
      `"${c.fonte}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `tabela_cfops_sinief_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Status Banner & Management Action */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E7EC] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-[#9E141A] text-white rounded-lg shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-base font-semibold text-[#111827]">
                Catálogo Dinâmico de CFOPs (SINIEF / SEFAZ)
              </h2>
              <span className="text-xs text-[#6B7280] font-medium">
                · Busca assíncrona ativa
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Tabela oficial do Convênio SINIEF S/Nº 1970 com motor de resolução universal para qualquer operação fiscal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-right hidden sm:block pr-1">
            <span className="text-[11px] text-[#6B7280] block">Base indexada</span>
            <span className="font-mono tabular-nums text-xs font-semibold text-[#111827]">
              {statusCatalogo?.totalRegistros || totalRegistros} códigos
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#9E141A] hover:bg-[#851015] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar / Importar CFOPs</span>
          </button>

          {isAdmin && onNovoCFOP && (
            <button
              type="button"
              onClick={onNovoCFOP}
              className="px-3 py-2 bg-white hover:bg-[#F9FAFB] text-[#111827] rounded-lg text-xs font-semibold border border-[#D1D5DB] transition-colors cursor-pointer whitespace-nowrap"
            >
              + Novo CFOP
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-xs font-medium transition-colors border border-[#D1D5DB] cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por CFOP (ex: 5.102, 6.949) ou termo..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#A8181F] focus:border-transparent text-slate-800"
            />
            {carregando && (
              <RefreshCw className="w-3.5 h-3.5 absolute right-3 top-3 text-[#A8181F] animate-spin" />
            )}
          </div>

          {/* Type Filter */}
          <div className="md:col-span-2">
            <select
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value as any);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#A8181F]"
            >
              <option value="todos">Entrada e Saída</option>
              <option value="entrada">Apenas Entradas (1, 2, 3)</option>
              <option value="saida">Apenas Saídas (5, 6, 7)</option>
            </select>
          </div>

          {/* Scope Filter */}
          <div className="md:col-span-2">
            <select
              value={abrangenciaFiltro}
              onChange={(e) => {
                setAbrangenciaFiltro(e.target.value as any);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#A8181F]"
            >
              <option value="todos">Todas Abrangências</option>
              <option value="estadual">Estaduais (1xxx / 5xxx)</option>
              <option value="interestadual">Interestaduais (2xxx / 6xxx)</option>
              <option value="exterior">Exterior / Import / Export (3xxx / 7xxx)</option>
            </select>
          </div>

          {/* Group Filter */}
          <div className="md:col-span-2">
            <select
              value={grupoFiltro}
              onChange={(e) => {
                setGrupoFiltro(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#A8181F]"
            >
              <option value="todos">Todos os Grupos</option>
              <option value="1xxx">Grupo 1xxx (Entradas Internas)</option>
              <option value="2xxx">Grupo 2xxx (Entradas Interestaduais)</option>
              <option value="3xxx">Grupo 3xxx (Importações)</option>
              <option value="5xxx">Grupo 5xxx (Saídas Internas)</option>
              <option value="6xxx">Grupo 6xxx (Saídas Interestaduais)</option>
              <option value="7xxx">Grupo 7xxx (Exportações)</option>
            </select>
          </div>

          {/* Favorites Switch */}
          <div className="md:col-span-2 flex items-center">
            <button
              onClick={() => {
                setApenasFavoritos(!apenasFavoritos);
                setPage(1);
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border ${
                apenasFavoritos
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  apenasFavoritos ? 'fill-amber-500 text-amber-500' : ''
                }`}
              />
              Favoritos
            </button>
          </div>
        </div>

        {/* Counter and Pagination Top Bar */}
        <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>
            Exibindo <strong>{cfopList.length}</strong> de <strong>{totalRegistros}</strong> CFOPs
            encontrados (Página {page} de {totalPages || 1})
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || carregando}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Página Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700">
              {page} / {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || carregando}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Próxima Página"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CFOP List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">Fav</th>
                <th className="py-2.5 px-3 w-24">Código</th>
                <th className="py-2.5 px-4">Descrição Oficial SINIEF</th>
                <th className="py-2.5 px-3 w-28">Operação</th>
                <th className="py-2.5 px-3 w-32">Devolução</th>
                <th className="py-2.5 px-3 text-center w-28">ICMS / IPI</th>
                <th className="py-2.5 px-3 text-center w-28">PIS / COFINS</th>
                <th className="py-2.5 px-3 text-center w-24">Estoque</th>
                <th className="py-2.5 px-3 w-28">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {cfopList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">Nenhum CFOP encontrado para os filtros selecionados.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tente digitar apenas o número do código ou use a sincronização automática.
                    </p>
                  </td>
                </tr>
              ) : (
                cfopList.map((cfop, idx) => {
                  const isEntrada = cfop.tipo === 'entrada';
                  return (
                    <tr
                      key={`${cfop.codigo}-${cfop.id || idx}`}
                      onClick={() => handleOpenDetail(cfop)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorito(cfop.id);
                        }}
                      >
                        <button className="text-slate-300 hover:text-amber-500">
                          <Star
                            className={`w-4 h-4 ${
                              cfop.favorito ? 'fill-amber-400 text-amber-500' : ''
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#A8181F] whitespace-nowrap">
                        {cfop.codigo}
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-slate-900 leading-snug">{cfop.descricao}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {cfop.quandoUsar}
                        </p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isEntrada ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isEntrada ? 'Entrada' : 'Saída'} • {cfop.abrangencia}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {cfop.cfopDevolucao ? (
                          <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[11px]">
                            {cfop.cfopDevolucao}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px]">
                          <span
                            title={
                              cfop.geraCreditoDebitoICMS
                                ? 'Gera Crédito/Débito ICMS'
                                : 'Sem incidência de ICMS'
                            }
                            className={`font-semibold px-1 rounded ${
                              cfop.geraCreditoDebitoICMS
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-slate-400'
                            }`}
                          >
                            ICMS
                          </span>
                          <span
                            title={
                              cfop.geraCreditoDebitoIPI
                                ? 'Gera Crédito/Débito IPI'
                                : 'Sem incidência de IPI'
                            }
                            className={`font-semibold px-1 rounded ${
                              cfop.geraCreditoDebitoIPI
                                ? 'text-amber-700 bg-amber-50'
                                : 'text-slate-400'
                            }`}
                          >
                            IPI
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                            cfop.geraCreditoDebitoPISCOFINS
                              ? 'text-blue-700 bg-blue-50'
                              : 'text-slate-400'
                          }`}
                        >
                          {cfop.geraCreditoDebitoPISCOFINS ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                            cfop.movimentaEstoque
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-slate-400'
                          }`}
                        >
                          {cfop.movimentaEstoque ? 'Movimenta' : 'Não'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(cfop)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded text-[11px]"
                          >
                            Detalhes
                          </button>
                          {isAdmin && onEditCFOP && (
                            <button
                              onClick={() => onEditCFOP(cfop)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px]"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Total de <strong>{totalRegistros}</strong> CFOPs no catálogo oficial SINIEF
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || carregando}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Página {page} de {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || carregando}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Próxima <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Drawer for CFOP Detail */}
      {selectedCFOP && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#A8181F]">{selectedCFOP.codigo}</span>
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md text-xs font-semibold">
                    {selectedCFOP.tipo === 'entrada' ? 'Entrada' : 'Saída'} •{' '}
                    {selectedCFOP.abrangencia.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-medium">
                    Grupo {selectedCFOP.grupo}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mt-1">
                  {selectedCFOP.descricao}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCFOP(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Quando Usar e Quando Não Usar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Quando Usar:
                  </span>
                  <p className="text-emerald-950 leading-relaxed">{selectedCFOP.quandoUsar}</p>
                </div>

                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Quando NÃO Usar:
                  </span>
                  <p className="text-rose-950 leading-relaxed">{selectedCFOP.quandoNaoUsar}</p>
                </div>
              </div>

              {/* Indicadores Fiscais & Operacionais */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#A8181F]" />
                  Indicadores de Incidência e Movimentação:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">ICMS Déb/Créd</span>
                    <strong
                      className={
                        selectedCFOP.geraCreditoDebitoICMS ? 'text-emerald-600' : 'text-slate-400'
                      }
                    >
                      {selectedCFOP.geraCreditoDebitoICMS ? 'SIM' : 'NÃO'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">IPI Déb/Créd</span>
                    <strong
                      className={
                        selectedCFOP.geraCreditoDebitoIPI ? 'text-emerald-600' : 'text-slate-400'
                      }
                    >
                      {selectedCFOP.geraCreditoDebitoIPI ? 'SIM' : 'NÃO'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">PIS / COFINS</span>
                    <strong
                      className={
                        selectedCFOP.geraCreditoDebitoPISCOFINS
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }
                    >
                      {selectedCFOP.geraCreditoDebitoPISCOFINS ? 'SIM' : 'NÃO'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Estoque</span>
                    <strong
                      className={
                        selectedCFOP.movimentaEstoque ? 'text-emerald-600' : 'text-slate-400'
                      }
                    >
                      {selectedCFOP.movimentaEstoque ? 'SIM' : 'NÃO'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Financeiro</span>
                    <strong
                      className={
                        selectedCFOP.movimentaFinanceiro ? 'text-emerald-600' : 'text-slate-400'
                      }
                    >
                      {selectedCFOP.movimentaFinanceiro ? 'SIM' : 'NÃO'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* CFOP de Devolução Correspondente */}
              {selectedCFOP.cfopDevolucao && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-purple-900 block">
                      CFOP de Devolução Correspondente:
                    </span>
                    <p className="text-purple-950 font-bold text-sm mt-0.5">
                      {selectedCFOP.cfopDevolucao}
                    </p>
                  </div>
                  <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                </div>
              )}

              {/* Anotação do Analista */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 block">
                  Anotações Internas da Sua Equipe Fiscal para o CFOP {selectedCFOP.codigo}:
                </label>
                <textarea
                  rows={3}
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  placeholder="Ex: Em nossa empresa, usamos este CFOP apenas para compras do fornecedor X..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#A8181F] text-slate-900"
                />
                <div className="flex items-center justify-end gap-3">
                  {noteSaved && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Anotação salva com sucesso!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onSalvarAnotacao(selectedCFOP.id, editingNote);
                      setNoteSaved(true);
                      setTimeout(() => setNoteSaved(false), 2500);
                    }}
                    className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Salvar Anotação
                  </button>
                </div>
              </div>

              {/* Metadados Legais */}
              <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap justify-between gap-2">
                <span>
                  Vigência: <strong>{selectedCFOP.vigenciaInicio}</strong>
                </span>
                <span>
                  Fonte: <strong>{selectedCFOP.fonte}</strong>
                </span>
                <span>
                  Atualizado em: <strong>{selectedCFOP.dataAtualizacao}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação e Sincronização */}
      <ModalImportarCFOP
        isOpen={isModalImportOpen}
        onClose={() => setIsModalImportOpen(false)}
        statusAtual={statusCatalogo}
        onSuccess={() => {
          carregarStatus();
          carregarCFOPsRemoto(searchTerm, tipoFiltro, abrangenciaFiltro, grupoFiltro, apenasFavoritos, 1);
        }}
      />
    </div>
  );
};
