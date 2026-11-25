import React, { useState } from 'react';
import {
  X,
  FileCode,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Building2,
  Package,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { parseXMLNFe, DadosNFeExtraidos, gerarXMLExemplo } from '../../services/xmlNFeParser';

interface ImportadorXMLModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarregarNoSimulador: (dados: DadosNFeExtraidos, itemSelecionadoIndex: number) => void;
}

export const ImportadorXMLModal: React.FC<ImportadorXMLModalProps> = ({
  isOpen,
  onClose,
  onCarregarNoSimulador,
}) => {
  const [xmlTexto, setXmlTexto] = useState('');
  const [arquivoNome, setArquivoNome] = useState('');
  const [resultadoParse, setResultadoParse] = useState<{
    sucesso: boolean;
    dados?: DadosNFeExtraidos;
    erro?: string;
  } | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState(0);

  if (!isOpen) return null;

  const handleProcessarXML = (conteudo: string) => {
    if (!conteudo.trim()) {
      setResultadoParse(null);
      return;
    }
    const res = parseXMLNFe(conteudo);
    setResultadoParse(res);
    setItemSelecionado(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivoNome(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setXmlTexto(text);
      handleProcessarXML(text);
    };
    reader.readAsText(file);
  };

  const handleCarregarExemplo = (tipo: 'zfm_rs_ap' | 'difal_sp_rj' | 'simples_nacional') => {
    const exemplo = gerarXMLExemplo(tipo);
    setXmlTexto(exemplo);
    setArquivoNome(`exemplo_${tipo}.xml`);
    handleProcessarXML(exemplo);
  };

  const handleConfirmarImportacao = () => {
    if (!resultadoParse?.dados) return;
    onCarregarNoSimulador(resultadoParse.dados, itemSelecionado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#151515] text-white flex items-center justify-between border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A8181F] flex items-center justify-center text-white shadow-xs">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Importação & Auditoria de XML da NF-e
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#EF888D] bg-[#A8181F]/30 px-2 py-0.5 rounded border border-[#A8181F]/40">
                  SEFAZ v4.00
                </span>
              </div>
              <p className="text-[11px] text-[#A0A0A0]">
                Faça upload ou cole o XML da nota fiscal para dar entrada direta no Simulador e auditar regras
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#212121] hover:bg-[#2B2B2B] text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* Quick Examples Toolbar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#A8181F]" />
              Carregar XML de Demonstração Rápida:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleCarregarExemplo('zfm_rs_ap')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-300 font-semibold text-[11px] transition-colors"
              >
                1. RS ➔ AP (ZFM / Isenção)
              </button>
              <button
                type="button"
                onClick={() => handleCarregarExemplo('difal_sp_rj')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-300 font-semibold text-[11px] transition-colors"
              >
                2. SP ➔ RJ (DIFAL EC 87/15)
              </button>
              <button
                type="button"
                onClick={() => handleCarregarExemplo('simples_nacional')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-300 font-semibold text-[11px] transition-colors"
              >
                3. Simples Nacional (MG ➔ MG)
              </button>
            </div>
          </div>

          {/* Upload Area & Text Paste Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left: Drag & Drop */}
            <div className="md:col-span-5 flex flex-col">
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Arquivo XML da NF-e
              </label>
              <label className="flex-1 min-h-[140px] border-2 border-dashed border-slate-300 hover:border-[#A8181F] bg-slate-50 hover:bg-[#FDF2F2]/30 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                <Upload className="w-7 h-7 text-slate-400 group-hover:text-[#A8181F] transition-colors mb-2" />
                <span className="font-bold text-slate-700 text-xs group-hover:text-[#A8181F]">
                  Clique para selecionar arquivo .xml
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  ou arraste e solte o arquivo aqui
                </span>
                {arquivoNome && (
                  <span className="mt-2 text-[10px] font-mono font-bold text-[#A8181F] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                    {arquivoNome}
                  </span>
                )}
                <input
                  type="file"
                  accept=".xml,text/xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Right: Paste Text */}
            <div className="md:col-span-7 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-900">
                  Ou Cole o Conteúdo do XML
                </label>
                {xmlTexto && (
                  <button
                    type="button"
                    onClick={() => {
                      setXmlTexto('');
                      setArquivoNome('');
                      setResultadoParse(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-red-600 font-semibold"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <textarea
                value={xmlTexto}
                onChange={(e) => {
                  setXmlTexto(e.target.value);
                  handleProcessarXML(e.target.value);
                }}
                placeholder="Cole aqui o texto completo do XML da NF-e (começando com <nfeProc> ou <NFe>)..."
                className="w-full flex-1 min-h-[140px] p-3 font-mono text-[11px] text-slate-800 bg-white border border-slate-300 rounded-xl outline-hidden focus:border-[#A8181F] shadow-2xs resize-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {resultadoParse && !resultadoParse.sucesso && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Erro na Leitura do XML:</strong> {resultadoParse.erro}
              </div>
            </div>
          )}

          {/* Success Preview & Product Selector */}
          {resultadoParse?.sucesso && resultadoParse.dados && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-xs">
                    XML Identificado com Sucesso • NF-e nº {resultadoParse.dados.numeroNF || 'S/N'} (Série {resultadoParse.dados.serie || '1'})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Emissão: {resultadoParse.dados.dataEmissao}
                </span>
              </div>

              {/* Grid Context */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Emitente */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Emitente ({resultadoParse.dados.emitente.uf})
                  </div>
                  <div className="font-bold text-slate-900 truncate">
                    {resultadoParse.dados.emitente.razaoSocial}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    CNPJ: {resultadoParse.dados.emitente.cnpj}
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold">
                    Regime: {resultadoParse.dados.emitente.crt === '1' ? 'Simples Nacional' : 'Regime Normal (Lucro Presumido/Real)'}
                  </div>
                </div>

                {/* Destinatário */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Destinatário ({resultadoParse.dados.destinatario.uf})
                  </div>
                  <div className="font-bold text-slate-900 truncate">
                    {resultadoParse.dados.destinatario.razaoSocial}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {resultadoParse.dados.destinatario.possuiIE ? '✓ Contribuinte com IE' : '⚠ Consumidor Final (DIFAL)'}
                  </div>
                  <div className="text-[10px] text-purple-700 font-semibold">
                    Operação: {resultadoParse.dados.tipoOperacao.toUpperCase()}
                    {resultadoParse.dados.destinatario.envolveZFM ? ' (ZFM/ALC)' : ''}
                  </div>
                </div>

                {/* Total da Nota */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Valores da Nota
                  </div>
                  <div className="text-base font-bold font-display tabular-nums tracking-tight text-[#A8181F]">
                    R$ {resultadoParse.dados.totais.valorTotalNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-600 tabular-nums">
                    Itens no XML: <strong>{resultadoParse.dados.itens.length}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    ICMS Declarado: R$ {resultadoParse.dados.totais.valorICMS.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Product Selector if multiple items */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Selecione o Item da NF-e para alimentar o Simulador Fiscal:</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    Item {itemSelecionado + 1} de {resultadoParse.dados.itens.length}
                  </span>
                </label>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto">
                  {resultadoParse.dados.itens.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setItemSelecionado(idx)}
                      className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        itemSelecionado === idx
                          ? 'bg-[#FDF2F2] text-[#94151B] font-bold border-l-4 border-[#A8181F]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5 truncate max-w-lg">
                        <div className="truncate">
                          #{item.nItem} - {item.xProd}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                          <span>NCM: <strong>{item.ncm}</strong></span>
                          <span>CFOP: <strong>{item.cfop}</strong></span>
                          <span>CST: <strong>{item.cstICMS || item.csosn}</strong></span>
                          <span>Qtd: {item.qCom} {item.uCom}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <div className="font-bold text-slate-900">
                          R$ {item.vProd.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          (R$ {item.vUnCom.toFixed(2)} un)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            A importação preenche automaticamente as 4 etapas do Simulador com os dados reais do XML.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!resultadoParse?.sucesso || !resultadoParse?.dados}
              onClick={handleConfirmarImportacao}
              className="flex items-center gap-2 px-5 py-2 bg-[#A8181F] hover:bg-[#94151B] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xs shadow-xs transition-all"
            >
              Dar Entrada no Simulador & Auditar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
