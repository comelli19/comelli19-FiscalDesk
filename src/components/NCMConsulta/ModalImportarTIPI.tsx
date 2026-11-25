import React, { useEffect, useState } from 'react';
import {
  X,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Database,
  Trash2,
} from 'lucide-react';
import {
  importarCatalogoTIPIRemoto,
  limparCacheLocalNCM,
  sincronizarCatalogoTIPI,
  StatusCatalogoTIPI,
} from '../../services/ncmAsyncService';
import { FiscalCacheStats, getFiscalCacheStats } from '../../services/fiscalIndexedDBCache';
import {
  assinarProgressoHidratacaoNCM,
  iniciarHidratacaoPreguicosaNCM,
  obterProgressoHidratacaoNCM,
  ProgressoHidratacaoNCM,
} from '../../services/ncmLazyCacheHydrator';

interface ModalImportarTIPIProps {
  isOpen: boolean;
  onClose: () => void;
  statusAtual?: StatusCatalogoTIPI | null;
  onSuccess: () => void;
}

export const ModalImportarTIPI: React.FC<ModalImportarTIPIProps> = ({
  isOpen,
  onClose,
  statusAtual,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'sincronizar' | 'arquivo' | 'manual'>('sincronizar');
  const [carregando, setCarregando] = useState(false);
  const [textoManual, setTextoManual] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<FiscalCacheStats | null>(null);
  const [progressoHidratacao, setProgressoHidratacao] = useState<ProgressoHidratacaoNCM | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    getFiscalCacheStats().then(setCacheStats).catch(() => {});
    obterProgressoHidratacaoNCM().then(setProgressoHidratacao).catch(() => {});
    const unsub = assinarProgressoHidratacaoNCM((prog) => {
      setProgressoHidratacao(prog);
      if (prog.completed || prog.lastCompletedPage % 3 === 0) {
        getFiscalCacheStats().then(setCacheStats).catch(() => {});
      }
    });
    return () => {
      unsub();
    };
  }, [isOpen, mensagemSucesso]);

  if (!isOpen) return null;

  const handleLimparCacheLocal = async () => {
    setCarregando(true);
    setErro(null);
    setMensagemSucesso(null);
    try {
      await limparCacheLocalNCM();
      const updated = await getFiscalCacheStats();
      setCacheStats(updated);
      setMensagemSucesso('Cache local IndexedDB de NCMs limpo. A próxima busca consultará o servidor.');
      onSuccess();
    } catch {
      setErro('Não foi possível limpar o cache local.');
    } finally {
      setCarregando(false);
    }
  };

  // Sincronização automática
  const handleSincronizarReceita = async () => {
    setCarregando(true);
    setErro(null);
    setMensagemSucesso(null);

    try {
      const resp = await sincronizarCatalogoTIPI();
      setMensagemSucesso(
        resp.mensagem ||
          `Catálogo sincronizado com sucesso! Total de ${resp.status.totalRegistros.toLocaleString('pt-BR')} códigos indexados em ${resp.status.totalCapitulos} Capítulos.`
      );
      onSuccess();
    } catch (e: any) {
      setErro(e.message || 'Erro ao sincronizar com a base remota da Receita Federal.');
    } finally {
      setCarregando(false);
    }
  };

  // Importação manual via JSON/CSV
  const handleImportarManual = async () => {
    if (!textoManual.trim()) {
      setErro('Cole o conteúdo no formato JSON ou CSV antes de importar.');
      return;
    }

    setCarregando(true);
    setErro(null);
    setMensagemSucesso(null);

    try {
      let itensParaImportar: any[] = [];

      if (textoManual.trim().startsWith('[') || textoManual.trim().startsWith('{')) {
        // Tenta JSON
        const parsed = JSON.parse(textoManual);
        itensParaImportar = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Tenta CSV (delimitado por ponto e vírgula ou vírgula)
        const linhas = textoManual.split('\n').filter((l) => l.trim().length > 0);
        if (linhas.length < 2) {
          throw new Error('O CSV deve conter cabeçalho e ao menos uma linha de dados.');
        }

        const separador = linhas[0].includes(';') ? ';' : ',';
        const cabecalho = linhas[0].split(separador).map((c) => c.trim().toLowerCase());
        const idxCodigo = cabecalho.findIndex((c) => c.includes('cod') || c.includes('ncm'));
        const idxDescricao = cabecalho.findIndex((c) => c.includes('desc'));
        const idxIPI = cabecalho.findIndex((c) => c.includes('ipi') || c.includes('aliq'));

        if (idxCodigo === -1) {
          throw new Error('Cabeçalho do CSV deve conter a coluna "codigo" ou "ncm".');
        }

        for (let i = 1; i < linhas.length; i++) {
          const colunas = linhas[i].split(separador).map((c) => c.trim());
          if (colunas[idxCodigo]) {
            itensParaImportar.push({
              codigo: colunas[idxCodigo],
              descricao: idxDescricao !== -1 ? colunas[idxDescricao] : 'Importado via CSV',
              aliquotaIPI: idxIPI !== -1 ? parseFloat(colunas[idxIPI].replace(',', '.')) || 0 : 0,
            });
          }
        }
      }

      const res = await importarCatalogoTIPIRemoto(itensParaImportar);
      setMensagemSucesso(
        `Importação concluída! ${res.importados} novos NCMs inseridos e ${res.atualizados} atualizados. Total ativo: ${res.totalAtual} registros.`
      );
      setTextoManual('');
      onSuccess();
    } catch (e: any) {
      setErro(e.message || 'Falha ao processar dados informados. Verifique o formato.');
    } finally {
      setCarregando(false);
    }
  };

  // Upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextoManual(content);
      setActiveTab('manual');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#A8181F] text-white rounded-xl shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Gestão do Catálogo TIPI da Receita Federal
              </h2>
              <p className="text-xs text-slate-300">
                Sincronização remota e importação de bases de NCM (Decreto nº 11.158/2022)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong>Base Ativa:</strong>{' '}
              {(statusAtual?.totalRegistros || 244).toLocaleString('pt-BR')} NCMs indexados em{' '}
              {statusAtual?.totalCapitulos || 96} Capítulos
              {statusAtual?.totalCurados ? ` (${statusAtual.totalCurados} curados com IPI/CEST)` : ''}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Fonte:{' '}
            <strong>
              {statusAtual?.fonteAtiva === 'siscomex'
                ? `Siscomex (${statusAtual.atoLegal || 'Vigente'})`
                : statusAtual?.fonteAtiva === 'brasilapi'
                ? 'BrasilAPI (Oficial)'
                : 'Base Local Curada'}
            </strong>
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sincronizar')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sincronizar'
                ? 'border-[#A8181F] text-[#A8181F]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronização Automática
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('arquivo')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'arquivo'
                ? 'border-[#A8181F] text-[#A8181F]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload de Arquivo (CSV/JSON)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-[#A8181F] text-[#A8181F]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Colar Dados em Lote
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4">
          {mensagemSucesso && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {erro && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {activeTab === 'sincronizar' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#A8181F]" />
                  Sincronizar Tabela Oficial Vigente (Portal Único Siscomex)
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Consulta diretamente a API pública oficial do <strong>Portal Único Siscomex</strong> (com fallback automático para <strong>BrasilAPI</strong>) no servidor, carregando todos os <strong>~10.516 códigos NCM vigentes</strong> sob demanda com paginação, mantendo os <strong>244 NCMs curados</strong> com alíquotas exatas de IPI, CEST e ST sem pesar no navegador.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-slate-500 text-[11px]">
                  <span>• Portal Único Siscomex (Governo Federal)</span>
                  <span>• Fallback BrasilAPI + Cache 24h</span>
                  <span>• 96 Capítulos Ativos (SH Mercosul)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSincronizarReceita}
                  disabled={carregando}
                  className="flex-1 py-3 bg-[#A8181F] hover:bg-[#94151B] disabled:bg-slate-400 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
                  {carregando ? 'Sincronizando Catálogo TIPI...' : 'Iniciar Sincronização Completa'}
                </button>

                {cacheStats?.available && (
                  <button
                    type="button"
                    onClick={handleLimparCacheLocal}
                    disabled={carregando}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Limpar registros e consultas NCM salvas no IndexedDB do navegador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Cache ({cacheStats.ncmCount.toLocaleString('pt-BR')})
                  </button>
                )}
              </div>

              {cacheStats?.available && (
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span>
                      Cache persistente (IndexedDB):{' '}
                      <strong>{cacheStats.ncmCount.toLocaleString('pt-BR')} NCMs</strong> salvos em disco ·{' '}
                      <strong>{cacheStats.queryCount}</strong> consultas em cache
                    </span>
                    {progressoHidratacao?.estado === 'hydrating' ? (
                      <span className="text-[#9E141A] font-semibold">
                        Lote {progressoHidratacao.lastCompletedPage}/{progressoHidratacao.totalPages || '?'} ({progressoHidratacao.percentual}%)
                      </span>
                    ) : progressoHidratacao?.completed ? (
                      <span className="text-emerald-700 font-semibold">100% offline pronto</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void iniciarHidratacaoPreguicosaNCM({ atrasoInicialMs: 50 })}
                        className="text-[#9E141A] font-semibold hover:underline cursor-pointer"
                      >
                        Carregar base offline
                      </button>
                    )}
                  </div>

                  {progressoHidratacao &&
                    (progressoHidratacao.estado === 'hydrating' || progressoHidratacao.percentual > 0) &&
                    !progressoHidratacao.completed && (
                      <progress
                        value={progressoHidratacao.percentual}
                        max={100}
                        aria-label="Progresso da carga paginada no IndexedDB"
                        className="w-full h-1.5 rounded-full overflow-hidden accent-[#9E141A]"
                      />
                    )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'arquivo' && (
            <div className="space-y-4 text-xs">
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-3">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <label className="font-bold text-[#A8181F] cursor-pointer hover:underline">
                    Clique para selecionar um arquivo
                    <input
                      type="file"
                      accept=".json,.csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formatos aceitos: <strong>.JSON</strong> ou <strong>.CSV</strong> contendo NCMs, descrições e alíquotas da TIPI.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                <strong>Dica de formato CSV:</strong><br />
                <code>codigo;descricao;aliquotaIPI;regimePISCOFINS</code><br />
                <code>8471.30.12;Computadores portáteis tipo notebook;15.0;geral</code>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-800">
                Cole abaixo a lista em formato JSON ou CSV:
              </label>
              <textarea
                value={textoManual}
                onChange={(e) => setTextoManual(e.target.value)}
                rows={8}
                placeholder={`[
  {
    "codigo": "8471.30.12",
    "descricao": "Computadores portáteis pesando não mais de 10 kg",
    "aliquotaIPI": 15.0,
    "regimePISCOFINS": "geral",
    "temST": false
  }
]`}
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#A8181F] text-slate-900"
              />

              <button
                type="button"
                onClick={handleImportarManual}
                disabled={carregando || !textoManual.trim()}
                className="w-full py-2.5 bg-[#A8181F] hover:bg-[#94151B] disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {carregando ? 'Processando e Importando...' : 'Importar e Mesclar ao Catálogo'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
