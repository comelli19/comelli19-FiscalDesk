import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import {
  gerarXmlGruposRTC,
  RtcRegimeRegularResponse,
  validarXmlGruposRTC,
} from '../../services/rtcCalculadoraService';

interface XmlValidadorRTCTabProps {
  ultimoResultado: RtcRegimeRegularResponse | null;
  ultimoTipoDocumento: 'NFE' | 'NFSE';
}

const XML_EXEMPLO_VALIDO = `<detributosRTC versao="1.00">
  <det nItem="1">
    <imposto>
      <IBSCBS>
        <CST>000</CST>
        <cClassTrib>000001</cClassTrib>
        <gIBSCBS>
          <vBC>10000.00</vBC>
          <gIBSUF>
            <pIBSUF>0.0500</pIBSUF>
            <vIBSUF>5.00</vIBSUF>
          </gIBSUF>
          <gIBSMun>
            <pIBSMun>0.0500</pIBSMun>
            <vIBSMun>5.00</vIBSMun>
          </gIBSMun>
          <gCBS>
            <pCBS>8.8000</pCBS>
            <vCBS>880.00</vCBS>
          </gCBS>
        </gIBSCBS>
      </IBSCBS>
    </imposto>
  </det>
</detributosRTC>`;

const XML_EXEMPLO_COM_ERRO = `<detributosRTC versao="1.00">
  <det nItem="1">
    <imposto>
      <IBSCBS>
        <CST>200</CST>
        <cClassTrib>000001</cClassTrib>
        <gIBSCBS>
          <vBC>10000.00</vBC>
          <gIBSUF>
            <pIBSUF>0.0500</pIBSUF>
            <vIBSUF>5.00</vIBSUF>
          </gIBSUF>
          <gIBSMun>
            <pIBSMun>0.0500</pIBSMun>
            <vIBSMun>5.00</vIBSMun>
          </gIBSMun>
          <gCBS>
            <pCBS>8.8000</pCBS>
            <vCBS>500.00</vCBS>
          </gCBS>
        </gIBSCBS>
      </IBSCBS>
    </imposto>
  </det>
</detributosRTC>`;

export const XmlValidadorRTCTab: React.FC<XmlValidadorRTCTabProps> = ({
  ultimoResultado,
  ultimoTipoDocumento,
}) => {
  const [tipoDoc, setTipoDoc] = useState<'NFE' | 'NFSE'>(ultimoTipoDocumento);
  const [xmlContent, setXmlContent] = useState<string>(XML_EXEMPLO_VALIDO);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ultimoResultado) {
      setTipoDoc(ultimoTipoDocumento);
      setXmlContent(gerarXmlGruposRTC(ultimoResultado, ultimoTipoDocumento));
    }
  }, [ultimoResultado, ultimoTipoDocumento]);

  const validacao = useMemo(() => validarXmlGruposRTC(xmlContent, tipoDoc), [xmlContent, tipoDoc]);

  const handleRegenerarDoCalculo = (novoTipo: 'NFE' | 'NFSE') => {
    setTipoDoc(novoTipo);
    if (ultimoResultado) {
      setXmlContent(gerarXmlGruposRTC(ultimoResultado, novoTipo));
    }
  };

  const handleUploadXml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setXmlContent(ev.target.result);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleCopiarXml = () => {
    navigator.clipboard
      .writeText(xmlContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  };

  const handleBaixarXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTC_${tipoDoc}_IBSCBS.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Editor & Gerador XML */}
      <div className="lg:col-span-7 bg-white border border-[#E4E7EC] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E7EC] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-sm text-[#111827]">
                Conferência e Geração de XML (&lt;IBSCBS&gt; / &lt;IS&gt;)
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Importe um arquivo XML, cole o trecho da sua nota ou teste os exemplos abaixo para validar contra a NT 2025.002.
              </p>
            </div>

            <div className="flex bg-[#ECEEF2] p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => handleRegenerarDoCalculo('NFE')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  tipoDoc === 'NFE' ? 'bg-white text-[#111827] font-semibold shadow-2xs' : 'text-[#4B5563]'
                }`}
              >
                NF-e
              </button>
              <button
                type="button"
                onClick={() => handleRegenerarDoCalculo('NFSE')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  tipoDoc === 'NFSE' ? 'bg-white text-[#111827] font-semibold shadow-2xs' : 'text-[#4B5563]'
                }`}
              >
                NFS-e
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={handleUploadXml}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9FAFB] hover:bg-white text-[#1F2937] border border-[#D1D5DB] rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 text-[#9E141A]" />
                <span>Abrir .xml</span>
              </button>
              <button
                type="button"
                onClick={() => setXmlContent(XML_EXEMPLO_VALIDO)}
                className="px-2.5 py-1.5 bg-[#F9FAFB] hover:bg-white text-[#374151] border border-[#E4E7EC] rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap"
              >
                Exemplo Válido
              </button>
              <button
                type="button"
                onClick={() => setXmlContent(XML_EXEMPLO_COM_ERRO)}
                className="px-2.5 py-1.5 bg-[#FDF3F3] hover:bg-[#FAE6E7] text-[#9E141A] border border-[#F3C6C8] rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap"
              >
                Simular Erro
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopiarXml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#D1D5DB] rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                onClick={handleBaixarXml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#9E141A] hover:bg-[#851015] text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar .xml</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <textarea
            value={xmlContent}
            onChange={(e) => setXmlContent(e.target.value)}
            rows={18}
            spellCheck={false}
            placeholder="Cole ou importe um XML contendo <IBSCBS> e/ou <IS> para validação instantânea..."
            className="w-full p-3.5 bg-[#16181D] text-[#E5E7EB] border border-[#2A2D36] rounded-lg font-mono text-xs leading-relaxed outline-hidden focus:border-[#9E141A]"
          />
        </div>
      </div>

      {/* Painel de Diagnóstico / Validação NT 2025.002 */}
      <div className="lg:col-span-5 bg-white border border-[#E4E7EC] rounded-xl overflow-hidden">
        <div
          className={`px-5 py-4 text-white flex items-center justify-between gap-3 ${
            validacao.valido ? 'bg-[#131417]' : 'bg-[#7F1D1D]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className={`w-5 h-5 shrink-0 ${validacao.valido ? 'text-emerald-400' : 'text-amber-300'}`} />
            <div>
              <h4 className="font-display font-semibold text-sm">
                {validacao.valido
                  ? 'Tudo certo! XML aprovado na NT 2025.002'
                  : `Encontramos ${validacao.totalErros} erro(s) para corrigir`}
              </h4>
              <p className="text-[11px] text-white/75 font-mono tabular-nums">
                {validacao.itensAnalisados} grupo(s) &lt;IBSCBS&gt; · {validacao.totalErros} erro(s) · {validacao.totalAlertas} alerta(s)
              </p>
            </div>
          </div>
        </div>

        {/* Resumo Extraído do 1º Bloco */}
        {validacao.resumoExtraido.cst && (
          <div className="grid grid-cols-3 divide-x divide-[#ECEEF2] bg-[#F9FAFB] border-b border-[#E4E7EC] text-xs">
            <div className="p-3">
              <span className="text-[10px] text-[#6B7280] block">CST / cClassTrib</span>
              <strong className="font-mono tabular-nums text-[#111827]">
                {validacao.resumoExtraido.cst} / {validacao.resumoExtraido.cClassTrib}
              </strong>
            </div>
            <div className="p-3">
              <span className="text-[10px] text-[#6B7280] block">Base (vBC)</span>
              <strong className="font-mono tabular-nums text-[#111827]">
                R$ {(validacao.resumoExtraido.vBC || 0).toFixed(2)}
              </strong>
            </div>
            <div className="p-3">
              <span className="text-[10px] text-[#6B7280] block">CBS + IBS</span>
              <strong className="font-mono tabular-nums text-[#9E141A]">
                R${' '}
                {(
                  (validacao.resumoExtraido.vCBS || 0) +
                  (validacao.resumoExtraido.vIBSUF || 0) +
                  (validacao.resumoExtraido.vIBSMun || 0)
                ).toFixed(2)}
              </strong>
            </div>
          </div>
        )}

        {/* Lista de Regras Validadas */}
        <div className="divide-y divide-[#ECEEF2] max-h-[430px] overflow-y-auto">
          {validacao.issues.map((issue, idx) => (
            <div key={idx} className="p-4 flex items-start gap-2.5 text-xs">
              {issue.severidade === 'OK' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {issue.severidade === 'ALERTA' && (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              {issue.severidade === 'ERRO' && (
                <XCircle className="w-4 h-4 text-[#9E141A] shrink-0 mt-0.5" />
              )}

              <div className="space-y-0.5 min-w-0">
                <div className="font-mono text-[11px] text-[#6B7280]">
                  <strong className="text-[#111827]">{issue.regra}</strong> · {issue.tag}
                </div>
                <p className="text-[#374151] leading-relaxed">{issue.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
