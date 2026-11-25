import React, { useMemo, useState } from 'react';
import {
  X,
  ShieldCheck,
  BookOpen,
  Calculator,
  Copy,
  Check,
  FileText,
  Scale,
  Layers,
} from 'lucide-react';
import { CFOP, NCMInfo, RegimeTributarioUniversal, STRegra, UFInfo } from '../../types/fiscal';
import { OperacaoSimuladorSnapshot } from '../../types/motorRegras';
import { executarMotorFiscalInteligente } from '../../services/motorFiscalDecisao';

interface PainelAuditoriaFiscalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRegime: RegimeTributarioUniversal;
  ufs?: UFInfo[];
  ncms?: NCMInfo[];
  cfops?: CFOP[];
  stRules?: STRegra[];
  simulacaoAtiva?: OperacaoSimuladorSnapshot | null;
  operacaoAtual?: {
    ufOrigem: string;
    ufDestino: string;
    ncm: string;
    cfop: string;
    valor: number;
    destinatarioPossuiIE: boolean;
    envolveZFM: boolean;
  };
}

const fmtBRL = (val: number) =>
  `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PainelAuditoriaFiscal: React.FC<PainelAuditoriaFiscalProps> = ({
  isOpen,
  onClose,
  activeRegime,
  ufs,
  ncms,
  cfops,
  stRules,
  simulacaoAtiva = null,
  operacaoAtual = {
    ufOrigem: 'RS',
    ufDestino: 'AP',
    ncm: '39253000',
    cfop: '6.109',
    valor: 3500.0,
    destinatarioPossuiIE: true,
    envolveZFM: true,
  },
}) => {
  const [copiado, setCopiado] = useState(false);

  const snapshot = useMemo<OperacaoSimuladorSnapshot>(() => {
    if (simulacaoAtiva) return simulacaoAtiva;

    const ehInterna = operacaoAtual.ufOrigem === operacaoAtual.ufDestino;
    const ehExterior = operacaoAtual.ufDestino.includes('EX');
    const etapa1 = {
      regimeTributario: activeRegime,
      ufOrigem: operacaoAtual.ufOrigem,
      ufDestino: operacaoAtual.ufDestino,
      municipioDestino: operacaoAtual.envolveZFM ? 'Macapá' : 'Capital',
      tipoOperacao: (ehExterior ? 'exterior' : ehInterna ? 'interna' : 'interestadual') as
        | 'interna'
        | 'interestadual'
        | 'exterior',
      emissaoPropria: 'PRÓPRIA' as const,
      cfopManual: operacaoAtual.cfop,
    };
    const etapa2 = {
      finalidadeMercadoria: 'industrializacao' as const,
      destinatarioContribuinte: operacaoAtual.destinatarioPossuiIE,
      destinatarioPossuiIE: operacaoAtual.destinatarioPossuiIE,
      consumidorFinal: !operacaoAtual.destinatarioPossuiIE,
      origemMercadoria: '0',
      envolveZFMouALC: operacaoAtual.envolveZFM,
      geraFinanceiro: true,
      movimentaEstoque: true,
    };
    const etapa3 = {
      descricaoComercial: 'Operação auditada',
      ncmCodigo: operacaoAtual.ncm,
      origemMercadoria: '0',
      quantidade: 1,
      valorUnitario: operacaoAtual.valor || 3500.0,
      valorTotal: operacaoAtual.valor || 3500.0,
    };

    const resultado = executarMotorFiscalInteligente({
      etapa1,
      etapa2,
      etapa3,
      ufs,
      ncms,
      cfops,
      stRules,
    });

    return { etapa1, etapa2, etapa3, resultado };
  }, [simulacaoAtiva, operacaoAtual, activeRegime, ufs, ncms, cfops, stRules]);

  if (!isOpen) return null;

  const { etapa1, etapa2, etapa3, resultado } = snapshot;
  const mem = resultado.memoriaCalculo;

  const handleCopiarMemoria = () => {
    const linhasPassos = mem.passos
      .map((p, idx) => `${idx + 1}. ${p.tributo}: ${p.formula} => ${p.resultado} [${p.referenciaTabela}]`)
      .join('\n');

    const texto = `=== PAINEL DE AUDITORIA FISCAL & MEMÓRIA DE CÁLCULO (FISCALDESK) ===
Vigência: ${resultado.dataReferenciaLegislacao}
Rota: ${etapa1.ufOrigem} ➔ ${etapa1.ufDestino} (${etapa1.municipioDestino})
Regime Tributário Emitente: ${etapa1.regimeTributario.toUpperCase()}
CFOP: ${resultado.cfopRecomendado.codigo} | NCM: ${etapa3.ncmCodigo}
Destinatário com IE: ${etapa2.destinatarioPossuiIE ? 'SIM (Contribuinte)' : 'NÃO (Não Contribuinte)'}
Finalidade: ${etapa2.finalidadeMercadoria.toUpperCase()} | ZFM/ALC: ${etapa2.envolveZFMouALC ? 'SIM' : 'NÃO'}

MEMÓRIA DE CÁLCULO PASSO A PASSO:
${linhasPassos}

TOTAIS DA OPERAÇÃO:
- Valor dos Produtos (vProd): ${fmtBRL(mem.valorProdutos)}
- ICMS Próprio (CST/CSOSN ${resultado.icms.cst}): ${fmtBRL(mem.valorICMS)}${mem.valorICMSDesonerado > 0 ? ` | Desonerado ZFM: -${fmtBRL(mem.valorICMSDesonerado)}` : ''}
${resultado.icmsST.aplicavel ? `- ICMS-ST (MVA ${resultado.icmsST.mvaAplicada.toFixed(2)}%): ${fmtBRL(mem.valorICMSST)}${mem.valorFCPST > 0 ? ` + FCP-ST ${fmtBRL(mem.valorFCPST)}` : ''}\n` : ''}${resultado.difal.aplicavel ? `- DIFAL (${resultado.difal.diferencial}%): ${fmtBRL(mem.valorDIFAL)}${mem.valorFCP > 0 ? ` + FCP ${fmtBRL(mem.valorFCP)}` : ''} (Resp.: ${resultado.difal.responsavelRecolhimento})\n` : ''}- IPI (CST ${resultado.ipi.cst} | ${resultado.ipi.aliquota}%): ${fmtBRL(mem.valorIPI)}
- PIS (${resultado.pis.aliquota}%) + COFINS (${resultado.cofins.aliquota}%) [CST ${resultado.pis.cst}]: ${fmtBRL(mem.valorPIS + mem.valorCOFINS)}
- Total de Tributos: ${fmtBRL(mem.totalTributos)} (${mem.cargaTributariaEfetivaPercentual}%)
- Valor Total da NF-e (vNF): ${fmtBRL(mem.totalNota)}
====================================================================`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#151515] text-white flex items-center justify-between border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A8181F] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Auditoria Fiscal &amp; Memória Legal
              </h2>
              <p className="text-[11px] text-[#A0A0A0]">
                Rastreabilidade em tempo real de fórmulas, bases de cálculo e tabelas oficiais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarMemoria}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copiar memória de cálculo"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Operation Context Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center flex-wrap gap-2 text-slate-700">
            <span>
              <strong className="text-slate-900">Rota:</strong> {etapa1.ufOrigem} ➔ {etapa1.ufDestino}
            </span>
            <span className="text-slate-300">|</span>
            <span>
              <strong className="text-slate-900">CFOP:</strong>{' '}
              <span className="font-mono font-bold">{resultado.cfopRecomendado.codigo}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              <strong className="text-slate-900">NCM:</strong>{' '}
              <span className="font-mono font-bold">{etapa3.ncmCodigo}</span>
            </span>
          </div>
          <div className="font-display tabular-nums font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            Total NF-e: {fmtBRL(mem.totalNota)}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          {/* Section 1: ICMS & DIFAL */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-display font-semibold text-slate-900 flex items-center gap-1.5 text-[13px]">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                1. ICMS Próprio &amp; DIFAL
              </span>
              <span className="text-[11px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-semibold">
                {resultado.icms.csosn ? `CSOSN ${resultado.icms.csosn}` : `CST ${resultado.icms.cst}`}
              </span>
            </div>

            <div className="space-y-2 leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs tabular-nums space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-900">Regime Emitente:</span>{' '}
                  {etapa1.regimeTributario.replace('_', ' ')}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Base de Cálculo ICMS:</span>{' '}
                  {fmtBRL(resultado.icms.baseCalculo)} ·{' '}
                  <span className="font-semibold text-slate-900">Alíquota:</span> {resultado.icms.aliquota}%
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Alíquota Interestadual / Interna Destino:</span>{' '}
                  {resultado.difal.aliquotaInter}% / {resultado.difal.aliquotaDestino}%
                </div>
                {mem.valorICMSDesonerado > 0 ? (
                  <div className="text-emerald-700 font-semibold">
                    Desoneração ZFM/ALC Convênio 65/88: -{fmtBRL(mem.valorICMSDesonerado)} (abate vNF)
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-slate-900">ICMS Próprio Destacado:</span>{' '}
                    {fmtBRL(mem.valorICMS)}
                  </div>
                )}
                {resultado.difal.aplicavel && (
                  <div className="text-[#9E141A] font-semibold pt-1.5 border-t border-slate-200">
                    DIFAL ({resultado.difal.diferencial}% ·{' '}
                    {resultado.difal.responsavelRecolhimento === 'destinatario'
                      ? 'Resp. Destinatário'
                      : 'Resp. Remetente'}
                    ): {fmtBRL(mem.valorDIFAL)}
                    {mem.valorFCP > 0 ? ` + FCP (${resultado.difal.fcp}%): ${fmtBRL(mem.valorFCP)}` : ''}
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <p>{resultado.icms.motivoEnquadramento}</p>
                <div className="text-[11px] text-slate-500">
                  Base Legal: {resultado.icms.fundamentacaoLegal}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: ICMS-ST */}
          {(resultado.icmsST.aplicavel || resultado.icmsST.retidaAnteriormente) && (
            <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="font-display font-semibold text-indigo-950 flex items-center gap-1.5 text-[13px]">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  2. ICMS-ST (Substituição Tributária)
                </span>
                <span className="text-[11px] font-mono bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                  {resultado.icmsST.retidaAnteriormente
                    ? `Substituído (${resultado.icmsST.cstOuCsosn})`
                    : `MVA ${resultado.icmsST.mvaAplicada.toFixed(2)}%`}
                </span>
              </div>

              {resultado.icmsST.aplicavel ? (
                <div className="space-y-2">
                  <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-200 text-xs tabular-nums space-y-1.5">
                    <div>
                      <span className="font-semibold text-slate-900">MVA Original:</span>{' '}
                      {resultado.icmsST.mvaOriginal.toFixed(2)}% ·{' '}
                      <span className="font-semibold text-slate-900">MVA Ajustada:</span>{' '}
                      {resultado.icmsST.mvaAjustada.toFixed(2)}% ·{' '}
                      <span className="font-semibold text-slate-900">Aplicada:</span>{' '}
                      {resultado.icmsST.mvaAplicada.toFixed(2)}%
                      {resultado.icmsST.usouMvaOriginalSimples ? ' (Simples — sem ajuste)' : ''}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Base de Cálculo ST:</span>{' '}
                      {fmtBRL(resultado.icmsST.baseCalculoST)} ·{' '}
                      <span className="font-semibold text-slate-900">Alíq. Interna Destino:</span>{' '}
                      {resultado.icmsST.aliquotaInternaDestino}%
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">ICMS Próprio Deduzido:</span>{' '}
                      {fmtBRL(resultado.icmsST.icmsProprioDeduzido)}
                    </div>
                    <div className="text-indigo-950 font-semibold pt-1.5 border-t border-indigo-200">
                      Valor ICMS-ST: {fmtBRL(resultado.icmsST.valorICMSST)}
                      {resultado.icmsST.valorFCPST > 0
                        ? ` + FCP-ST (${resultado.icmsST.fcpSTAliquota}%): ${fmtBRL(resultado.icmsST.valorFCPST)}`
                        : ''}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{resultado.icmsST.motivoEnquadramento}</p>
                  <div className="text-[11px] text-slate-500">
                    Base Legal: {resultado.icmsST.fundamentacaoLegal}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600">{resultado.icmsST.motivoEnquadramento}</p>
              )}
            </div>
          )}

          {/* Section 3: PIS e COFINS */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-display font-semibold text-slate-900 flex items-center gap-1.5 text-[13px]">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                PIS e COFINS {mem.exclusaoICMSBasePISCOFINS > 0 ? '(STF Tema 69)' : ''}
              </span>
              <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                CST {resultado.pis.cst}
              </span>
            </div>

            <div className="space-y-2 leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs tabular-nums space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-900">Valor dos Produtos:</span> {fmtBRL(mem.valorProdutos)}
                </div>
                {mem.exclusaoICMSBasePISCOFINS > 0 && (
                  <div>
                    <span className="font-semibold text-slate-900">(-) Exclusão do ICMS Destacado (Tema 69 STF):</span>{' '}
                    {fmtBRL(mem.exclusaoICMSBasePISCOFINS)}
                  </div>
                )}
                <div className="font-semibold text-blue-900">
                  Base de Cálculo PIS/COFINS: {fmtBRL(mem.basePISCOFINS)}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">PIS ({resultado.pis.aliquota}%):</span>{' '}
                  {fmtBRL(mem.valorPIS)} ·{' '}
                  <span className="font-semibold text-slate-900">COFINS ({resultado.cofins.aliquota}%):</span>{' '}
                  {fmtBRL(mem.valorCOFINS)}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>{resultado.pis.motivoEnquadramento}</p>
                <div className="text-[11px] text-slate-500">
                  Base Legal: {resultado.pis.fundamentacaoLegal}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: IPI */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-display font-semibold text-slate-900 flex items-center gap-1.5 text-[13px]">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                IPI (Tabela TIPI)
              </span>
              <span className="text-[11px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold">
                CST {resultado.ipi.cst} · {resultado.ipi.aliquota}%
              </span>
            </div>

            <div className="space-y-2 leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs tabular-nums space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-900">NCM:</span>{' '}
                  <span className="font-mono">{etapa3.ncmCodigo}</span> ·{' '}
                  <span className="font-semibold text-slate-900">Base:</span> {fmtBRL(resultado.ipi.baseCalculo)}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Alíquota Aplicada:</span> {resultado.ipi.aliquota}% ·{' '}
                  <span className="font-semibold text-slate-900">Valor IPI:</span> {fmtBRL(mem.valorIPI)}
                </div>
              </div>
              <p className="text-xs text-slate-600">{resultado.ipi.motivoEnquadramento}</p>
              <div className="text-[11px] text-slate-500">
                Base Legal: {resultado.ipi.fundamentacaoLegal}
              </div>
            </div>
          </div>

          {/* Section 5: Reforma Tributária */}
          <div className="bg-white border border-[#E4E7EC] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-2">
              <span className="font-display font-semibold text-[#111827] flex items-center gap-1.5 text-[13px]">
                <Scale className="w-3.5 h-3.5 text-[#9E141A]" />
                Reforma Tributária (CBS &amp; IBS)
              </span>
              <span className="text-[11px] font-mono tabular-nums text-[#6B7280]">
                CST {resultado.cbs.cst} · cClassTrib {resultado.cbs.cClassTrib}
              </span>
            </div>

            <div className="space-y-2 leading-relaxed">
              <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E4E7EC] text-xs tabular-nums space-y-1 text-[#111827]">
                <div>
                  <span className="font-semibold">CBS ({resultado.cbs.aliquota}%):</span> {fmtBRL(mem.valorCBS)} ·{' '}
                  <span className="font-semibold">IBS ({resultado.ibs.aliquota}%):</span> {fmtBRL(mem.valorIBS)}
                </div>
              </div>
              <p className="text-xs text-[#4B5563]">{resultado.cbs.motivoEnquadramento}</p>
              <div className="text-[11px] text-[#6B7280]">
                Base Legal: {resultado.cbs.fundamentacaoLegal}
              </div>
            </div>
          </div>

          {/* Section 6: Passos Auditáveis & Referência às Tabelas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="font-display font-semibold text-slate-900 text-[13px]">
              Rastreabilidade com Tabelas de Referência
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              {mem.passos.map((passo, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900">{passo.tributo}</div>
                    <div className="text-[11px] tabular-nums text-slate-600">{passo.formula}</div>
                    <div className="text-[11px] text-slate-500">{passo.referenciaTabela}</div>
                  </div>
                  <div className="font-display tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                    {passo.resultado}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Total Tributos: <strong className="font-mono text-slate-900">{fmtBRL(mem.totalTributos)}</strong> ({mem.cargaTributariaEfetivaPercentual}%)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
