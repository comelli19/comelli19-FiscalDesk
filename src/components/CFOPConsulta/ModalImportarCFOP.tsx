import React, { useEffect, useState } from 'react';
import {
  X,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import {
  importarCFOPsRemoto,
  limparCacheLocalCFOP,
  sincronizarCFOPs,
  StatusCatalogoCFOP,
} from '../../services/cfopAsyncService';
import { FiscalCacheStats, getFiscalCacheStats } from '../../services/fiscalIndexedDBCache';

interface ModalImportarCFOPProps {
  isOpen: boolean;
  onClose: () => void;
  statusAtual?: StatusCatalogoCFOP | null;
  onSuccess: () => void;
}

export const ModalImportarCFOP: React.FC<ModalImportarCFOPProps> = ({
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

  useEffect(() => {
    if (!isOpen) return;
    getFiscalCacheStats().then(setCacheStats).catch(() => {});
  }, [isOpen, mensagemSucesso]);

  if (!isOpen) return null;

  const handleLimparCacheLocal = async () => {
    setCarregando(true);
    setErro(null);
    setMensagemSucesso(null);
    try {
      await limparCacheLocalCFOP();
      const updated = await getFiscalCacheStats();
      setCacheStats(updated);
      setMensagemSucesso('Cache local IndexedDB de CFOPs limpo. A próxima busca consultará o servidor.');
      onSuccess();
    } catch {
      setErro('Não foi possível limpar o cache local.');
    } finally {
      setCarregando(false);
    }
  };

  // Sincronização automática SINIEF / SEFAZ
  const handleSincronizarSEFAZ = async () => {
    setCarregando(true);
    setErro(null);
    setMensagemSucesso(null);

    try {
      const resp = await sincronizarCFOPs();
      setMensagemSucesso(
        `Catálogo de CFOPs sincronizado com sucesso! Total de ${resp.status.totalRegistros} códigos indexados (${resp.status.totalEntradas} entradas e ${resp.status.totalSaidas} saídas).`
      );
      onSuccess();
    } catch (e: any) {
      setErro(e.message || 'Erro ao sincronizar com a base de CFOPs do SINIEF/SEFAZ.');
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
        const idxCodigo = cabecalho.findIndex((c) => c.includes('cod') || c.includes('cfop'));
        const idxDescricao = cabecalho.findIndex((c) => c.includes('desc'));
        const idxAplicacao = cabecalho.findIndex((c) => c.includes('apli') || c.includes('obs'));
        const idxTipo = cabecalho.findIndex((c) => c.includes('tipo'));

        if (idxCodigo === -1) {
          throw new Error('Cabeçalho do CSV deve conter a coluna "codigo" ou "cfop".');
        }

        for (let i = 1; i < linhas.length; i++) {
          const colunas = linhas[i].split(separador).map((c) => c.trim());
          if (colunas[idxCodigo]) {
            const rawCodigo = colunas[idxCodigo];
            itensParaImportar.push({
              codigo: rawCodigo,
              descricao: idxDescricao !== -1 ? colunas[idxDescricao] : 'Importado via CSV',
              aplicacao: idxAplicacao !== -1 ? colunas[idxAplicacao] : undefined,
              tipo: idxTipo !== -1 ? colunas[idxTipo] : undefined,
            });
          }
        }
      }

      const res = await importarCFOPsRemoto(itensParaImportar);
      setMensagemSucesso(
        `Importação concluída! ${res.importados} novos CFOPs inseridos e ${res.atualizados} atualizados. Total ativo: ${res.totalAtual} códigos.`
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
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Gestão da Tabela de CFOPs do SINIEF / SEFAZ
              </h2>
              <p className="text-xs text-slate-300">
                Sincronização remota e importação de Códigos Fiscais (Convênio S/Nº 1970)
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
              <strong>Base Ativa:</strong> {statusAtual?.totalRegistros || '580+'} códigos ({statusAtual?.totalEntradas || '290'} Entradas, {statusAtual?.totalSaidas || '290'} Saídas)
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Vigência: <strong>Tabela SINIEF / Ajustes SINIEF 2026</strong>
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
                  Atualizar com a Tabela Oficial SINIEF / SEFAZ
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Essa operação recarrega e valida todos os códigos de operações fiscais do <strong>Convênio SINIEF S/Nº de 1970</strong> e seus Ajustes vigentes, abrangendo entradas estaduais (1.xxx), interestaduais (2.xxx) e importações (3.xxx), bem como saídas estaduais (5.xxx), interestaduais (6.xxx) e exportações (7.xxx), incluindo regras de apropriação de créditos, movimentação física e CFOPs simétricos de devolução.
                </p>
                <div className="pt-2 flex items-center gap-4 text-slate-500 text-[11px]">
                  <span>• Grupos 1, 2, 3 (Entradas)</span>
                  <span>• Grupos 5, 6, 7 (Saídas)</span>
                  <span>• Mapeamento de CFOP de Devolução</span>
                  <span>• Indicadores de Crédito e Estoque</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSincronizarSEFAZ}
                  disabled={carregando}
                  className="flex-1 py-3 bg-[#A8181F] hover:bg-[#94151B] disabled:bg-slate-400 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
                  {carregando ? 'Sincronizando Catálogo de CFOPs...' : 'Iniciar Sincronização Completa'}
                </button>

                {cacheStats?.available && (
                  <button
                    type="button"
                    onClick={handleLimparCacheLocal}
                    disabled={carregando}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Limpar registros e consultas CFOP salvas no IndexedDB do navegador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Cache ({cacheStats.cfopCount.toLocaleString('pt-BR')})
                  </button>
                )}
              </div>

              {cacheStats?.available && (
                <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    Cache persistente (IndexedDB):{' '}
                    <strong>{cacheStats.cfopCount.toLocaleString('pt-BR')} CFOPs</strong> salvos em disco ·{' '}
                    <strong>{cacheStats.queryCount}</strong> consultas em cache
                  </span>
                  <span className="text-emerald-700 font-semibold">Ativo</span>
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
                    Formatos aceitos: <strong>.JSON</strong> ou <strong>.CSV</strong> contendo códigos CFOP e descrições oficiais.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                <strong>Dica de formato CSV:</strong><br />
                <code>codigo;descricao;aplicacao;tipo</code><br />
                <code>5.102;Venda de mercadoria adquirida ou recebida de terceiros;Classificam-se neste código...;saida</code>
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
    "codigo": "5.102",
    "descricao": "Venda de mercadoria adquirida ou recebida de terceiros",
    "aplicacao": "Classificam-se neste código as vendas de mercadorias adquiridas de terceiros...",
    "tipo": "saida",
    "permiteCreditoICMS": false,
    "movimentaEstoque": true,
    "geraFinanceiro": true
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
