import React, { useMemo, useRef, useState } from 'react';
import {
  FileDown,
  Printer,
  Upload,
  FileCode2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  gerarXmlExemploNFSeNacional,
  parseNFSeXmlParaDANFSe,
} from '../../services/rtcCalculadoraService';
import { gerarEBaixarDanfsePDF } from '../../services/danfsePdfGenerator';

function fmtBRL(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDoc(doc: string): string {
  const d = doc.replace(/\D/g, '');
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return doc;
}

export const GeradorDANFSeTab: React.FC = () => {
  const [xmlInput, setXmlInput] = useState<string>(() => gerarXmlExemploNFSeNacional());
  const [uploadNome, setUploadNome] = useState<string>('Exemplo_NFSe_Nacional_RTC_2026.xml');
  const [showRawXml, setShowRawXml] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dados = useMemo(() => {
    if (!xmlInput.trim()) return null;
    return parseNFSeXmlParaDANFSe(xmlInput);
  }, [xmlInput]);

  const lerArquivoXml = (file: File) => {
    setUploadNome(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setXmlInput(ev.target.result);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) lerArquivoXml(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) lerArquivoXml(file);
  };

  const handleCarregarExemplo = () => {
    setXmlInput(gerarXmlExemploNFSeNacional());
    setUploadNome('Exemplo_NFSe_Nacional_RTC_2026.xml');
  };

  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);

  const handleDownloadPDF = async () => {
    if (!dados || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      await gerarEBaixarDanfsePDF(dados);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Zona Amigável de Upload + Ações Principais */}
      <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-sm text-[#111827]">
              Gerar PDF do DANFSe a partir de XML de NFS-e
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Arraste um arquivo XML (NFS-e Padrão Nacional ou ABRASF) para visualizar e baixar o PDF oficial já com o quadro de CBS e IBS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCarregarExemplo}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#D1D5DB] rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#9E141A]" />
              <span>Carregar exemplo</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!dados}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#D1D5DB] rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={!dados}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#9E141A] hover:bg-[#851015] text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Baixar PDF (DANFSe)</span>
            </button>
          </div>
        </div>

        {/* Área de Arrastar e Soltar XML */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#9E141A] bg-[#FDF3F3]'
              : 'border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#9E141A]/60 hover:bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            onChange={handleUploadFile}
            className="hidden"
          />
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E4E7EC] flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-[#9E141A]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#111827] truncate">
                Clique ou arraste o arquivo XML da NFS-e aqui
              </div>
              <div className="text-[11px] text-[#6B7280] font-mono truncate">
                Arquivo carregado: {uploadNome}
                {dados ? ` · Padrão ${dados.padraoDetectado}` : ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowRawXml((v) => !v);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-lg text-[11px] font-medium text-[#374151] hover:text-[#111827] cursor-pointer whitespace-nowrap"
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>{showRawXml ? 'Ocultar XML bruto' : 'Ver / colar XML'}</span>
            {showRawXml ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Editor XML Colapsável (só aparece se o usuário quiser editar/colar) */}
        {showRawXml && (
          <div className="space-y-1.5">
            <textarea
              value={xmlInput}
              onChange={(e) => {
                setXmlInput(e.target.value);
                setUploadNome('XML colado manualmente');
              }}
              rows={7}
              spellCheck={false}
              placeholder="Cole aqui o XML de uma NFS-e Padrão Nacional ou ABRASF..."
              className="w-full p-3 bg-[#16181D] text-[#E5E7EB] border border-[#2A2D36] rounded-lg font-mono text-[11px] leading-relaxed outline-hidden focus:border-[#9E141A]"
            />
          </div>
        )}
      </div>

      {/* Pré-visualização Estruturada do DANFSe */}
      {dados ? (
        <div className="bg-white border border-[#D1D5DB] rounded-xl overflow-hidden shadow-xs">
          {/* Cabeçalho DANFSe */}
          <div className="bg-[#131417] text-white p-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-[#9CA3AF]">
                DOCUMENTO AUXILIAR DA NOTA FISCAL DE SERVIÇO ELETRÔNICA · PADRÃO NACIONAL (RFB)
              </div>
              <h4 className="font-display text-lg font-bold tracking-tight">
                DANFSe — Município de {dados.municipioIncidencia} / {dados.ufIncidencia}
              </h4>
              <div className="text-[11px] font-mono text-[#D1D5DB] break-all">
                Chave de Acesso: {dados.chaveAcesso}
              </div>
            </div>

            <div className="bg-[#9E141A] px-4 py-2.5 rounded-lg text-right shrink-0">
              <div className="text-[11px] font-medium text-white/85">
                Número da NFS-e
              </div>
              <div className="font-display tabular-nums tracking-tight text-xl font-bold text-white leading-tight">
                {dados.numeroNFSe}
              </div>
            </div>
          </div>

          {/* Faixa de Metadados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2] bg-[#F9FAFB] border-b border-[#E4E7EC] text-xs">
            <div className="p-3.5">
              <span className="text-[10px] font-medium text-[#6B7280] block uppercase">Data / Hora Emissão</span>
              <strong className="font-mono tabular-nums text-[#111827] mt-0.5 block">
                {dados.dataEmissao.replace('T', ' ').slice(0, 19)}
              </strong>
            </div>
            <div className="p-3.5">
              <span className="text-[10px] font-medium text-[#6B7280] block uppercase">Competência</span>
              <strong className="font-mono tabular-nums text-[#111827] mt-0.5 block">{dados.competencia}</strong>
            </div>
            <div className="p-3.5">
              <span className="text-[10px] font-medium text-[#6B7280] block uppercase">Série / Nº DPS</span>
              <strong className="font-mono tabular-nums text-[#111827] mt-0.5 block">
                {dados.serieDPS} / {dados.numeroDPS}
              </strong>
            </div>
            <div className="p-3.5">
              <span className="text-[10px] font-medium text-[#6B7280] block uppercase">Cód. Verificação</span>
              <strong className="font-mono tabular-nums text-[#111827] mt-0.5 block">
                {dados.codigoVerificacao}
              </strong>
            </div>
          </div>

          <div className="p-5 space-y-5 text-xs">
            {/* Prestador & Tomador */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[#E4E7EC] rounded-lg space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Prestador de Serviços (Emitente)
                </div>
                <div className="font-display font-semibold text-sm text-[#111827]">
                  {dados.prestador.razaoSocial}
                </div>
                <div className="text-[#4B5563] font-mono tabular-nums">
                  CNPJ/CPF: {fmtDoc(dados.prestador.cnpjCpf)} · IM: {dados.prestador.inscricaoMunicipal}
                </div>
                <div className="text-[#4B5563]">
                  {dados.prestador.endereco} — {dados.prestador.municipioUF}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  {dados.prestador.optanteSimples} · {dados.prestador.email}
                </div>
              </div>

              <div className="p-4 border border-[#E4E7EC] rounded-lg space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Tomador de Serviços
                </div>
                <div className="font-display font-semibold text-sm text-[#111827]">
                  {dados.tomador.razaoSocial}
                </div>
                <div className="text-[#4B5563] font-mono tabular-nums">
                  CNPJ/CPF: {fmtDoc(dados.tomador.cnpjCpf)} · IM: {dados.tomador.inscricaoMunicipal}
                </div>
                <div className="text-[#4B5563]">
                  {dados.tomador.endereco} — {dados.tomador.municipioUF}
                </div>
                <div className="text-[11px] text-[#6B7280]">E-mail: {dados.tomador.email}</div>
              </div>
            </div>

            {/* Discriminação do Serviço */}
            <div className="p-4 border border-[#E4E7EC] rounded-lg space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  Discriminação dos Serviços
                </span>
                <span className="font-mono text-[11px] text-[#9E141A] font-semibold">
                  cTribNac {dados.servico.codigoTributacaoNacional} · NBS {dados.servico.codigoNBS}
                </span>
              </div>
              <p className="text-[#1F2937] leading-relaxed whitespace-pre-line">
                {dados.servico.discriminacao}
              </p>
            </div>

            {/* Tributação Municipal (ISSQN) e Retenções */}
            <div className="border border-[#E4E7EC] rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-[#F4F5F7] border-b border-[#E4E7EC] text-[10px] font-semibold uppercase tracking-wider text-[#4B5563]">
                Tributação Municipal (ISSQN) e Retenções Federais
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECEEF2]">
                <div className="p-3.5">
                  <span className="text-[11px] text-[#6B7280] block">Valor dos Serviços</span>
                  <strong className="font-mono tabular-nums text-sm text-[#111827] mt-0.5 block">
                    {fmtBRL(dados.servico.valorServicos)}
                  </strong>
                </div>
                <div className="p-3.5">
                  <span className="text-[11px] text-[#6B7280] block">Base Cálculo ISS</span>
                  <strong className="font-mono tabular-nums text-sm text-[#111827] mt-0.5 block">
                    {fmtBRL(dados.servico.baseCalculoISS)}
                  </strong>
                </div>
                <div className="p-3.5">
                  <span className="text-[11px] text-[#6B7280] block">Alíquota ISS</span>
                  <strong className="font-mono tabular-nums text-sm text-[#111827] mt-0.5 block">
                    {dados.servico.aliquotaISS.toFixed(2)}%
                  </strong>
                </div>
                <div className="p-3.5">
                  <span className="text-[11px] text-[#6B7280] block">Valor ISSQN</span>
                  <strong className="font-mono tabular-nums text-sm text-[#111827] mt-0.5 block">
                    {fmtBRL(dados.servico.valorISS)}
                  </strong>
                </div>
                <div className="p-3.5">
                  <span className="text-[11px] text-[#6B7280] block">ISS Retido</span>
                  <strong className="font-mono text-sm text-[#111827] mt-0.5 block">
                    {dados.servico.issRetido ? 'Sim (Tomador)' : 'Não'}
                  </strong>
                </div>
              </div>
              <div className="px-4 py-2.5 bg-[#F9FAFB] border-t border-[#ECEEF2] font-mono tabular-nums text-[11px] text-[#4B5563]">
                Retenções Federais: IRRF {fmtBRL(dados.retencoesFederais.irrf)} · PIS {fmtBRL(dados.retencoesFederais.pis)} · COFINS {fmtBRL(dados.retencoesFederais.cofins)} · CSLL {fmtBRL(dados.retencoesFederais.csll)} · INSS {fmtBRL(dados.retencoesFederais.inss)}
              </div>
            </div>

            {/* Grupo Reforma Tributária (<IBSCBS>) */}
            <div className="border border-[#F3C6C8] rounded-lg overflow-hidden bg-[#FDF3F3]/40">
              <div className="px-4 py-2 bg-[#9E141A] text-white text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Reforma Tributária — Grupo &lt;IBSCBS&gt; (LC 214/2025 · NT 2025.002)</span>
                {dados.reformaTributariaRTC.presenteNoXml && (
                  <span className="font-mono">
                    CST {dados.reformaTributariaRTC.cst} · cClassTrib {dados.reformaTributariaRTC.cClassTrib}
                  </span>
                )}
              </div>

              {dados.reformaTributariaRTC.presenteNoXml ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#F3C6C8]">
                  <div className="p-3.5">
                    <span className="text-[11px] text-[#7F1D1D] block">Base Unificada (vBC)</span>
                    <strong className="font-mono tabular-nums text-sm text-[#111827] mt-0.5 block">
                      {fmtBRL(dados.reformaTributariaRTC.vBC)}
                    </strong>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[11px] text-[#7F1D1D] block">
                      IBS UF ({dados.reformaTributariaRTC.pIBSUF.toFixed(2)}%)
                    </span>
                    <strong className="font-mono tabular-nums text-sm text-[#111827] mt-0.5 block">
                      {fmtBRL(dados.reformaTributariaRTC.vIBSUF)}
                    </strong>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[11px] text-[#7F1D1D] block">
                      IBS Mun ({dados.reformaTributariaRTC.pIBSMun.toFixed(2)}%)
                    </span>
                    <strong className="font-mono tabular-nums text-sm text-[#111827] mt-0.5 block">
                      {fmtBRL(dados.reformaTributariaRTC.vIBSMun)}
                    </strong>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[11px] text-[#7F1D1D] block">
                      CBS ({dados.reformaTributariaRTC.pCBS.toFixed(2)}%)
                    </span>
                    <strong className="font-mono tabular-nums text-sm text-[#111827] mt-0.5 block">
                      {fmtBRL(dados.reformaTributariaRTC.vCBS)}
                    </strong>
                  </div>
                  <div className="p-3.5 bg-[#FDF3F3]">
                    <span className="text-[11px] font-semibold text-[#9E141A] block">Total IBS + CBS</span>
                    <strong className="font-mono tabular-nums text-sm text-[#9E141A] mt-0.5 block">
                      {fmtBRL(dados.reformaTributariaRTC.totalIBSCBS)}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-xs text-[#6B7280]">
                  Grupo &lt;IBSCBS&gt; não localizado no XML importado.
                </div>
              )}
            </div>

            {/* Valor Líquido e Observações */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#131417] text-white rounded-lg">
              <span className="font-display text-xs font-semibold text-[#D1D5DB]">
                Valor Líquido da NFS-e
              </span>
              <span className="font-display tabular-nums tracking-tight text-lg font-bold">
                {fmtBRL(dados.servico.valorLiquido)}
              </span>
            </div>

            <div className="p-3.5 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg text-[11px] text-[#4B5563] leading-relaxed">
              <strong className="text-[#111827] block mb-0.5">Informações Complementares:</strong>
              {dados.informacoesComplementares}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-10 text-center text-xs text-[#6B7280]">
          Importe um arquivo XML de NFS-e ou clique em <strong>Testar com Exemplo</strong> para visualizar e gerar o DANFSe em PDF.
        </div>
      )}
    </div>
  );
};
