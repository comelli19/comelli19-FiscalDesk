import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Zap,
  MapPin,
  TableProperties,
  Scale,
  ArrowRight,
  FileSpreadsheet,
  UploadCloud,
} from 'lucide-react';
import { RegimeTributarioUniversal } from '../../types/fiscal';
import { CorporateModule } from '../Sidebar/CorporateSidebar';
import { INITIAL_CFOPS } from '../../data/cfops';
import { obterStatusCatalogoRemoto } from '../../services/ncmAsyncService';

interface FiscalDashboardProps {
  onNavigateModule: (module: CorporateModule) => void;
  activeRegime: RegimeTributarioUniversal;
  onOpenAuditDrawer: () => void;
  onOpenImportXML?: () => void;
}

export const FiscalDashboard: React.FC<FiscalDashboardProps> = ({
  onNavigateModule,
  activeRegime,
  onOpenAuditDrawer,
  onOpenImportXML,
}) => {
  const [totalNcmsOficiais, setTotalNcmsOficiais] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    obterStatusCatalogoRemoto().then((st) => {
      if (active && st && st.totalRegistros > 0) {
        setTotalNcmsOficiais(st.totalRegistros);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const regimeNomes: Record<RegimeTributarioUniversal, string> = {
    lucro_presumido: 'Lucro Presumido (Cumulativo · Lei 9.718/98)',
    lucro_real: 'Lucro Real (Não-Cumulativo · Leis 10.637 e 10.833)',
    simples_nacional: 'Simples Nacional (LC 123/06)',
    mei: 'MEI (Microempreendedor Individual)',
    regime_especial: 'Regime Especial / Diferenciado',
  };

  return (
    <div className="space-y-6">
      {/* Executive Workspace Header */}
      <section className="bg-white rounded-xl border border-[#E4E7EC] p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
            <span className="font-medium text-[#9E141A]">FiscalDesk</span>
            <span aria-hidden="true">·</span>
            <span>Vigência 2026</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{regimeNomes[activeRegime]}</span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#111827] leading-tight">
            Central de Parametrização e Auditoria Tributária
          </h2>

          <p className="text-sm text-[#4B5563] leading-relaxed">
            Determinação determinística de CFOP, CST, ICMS, IPI, PIS, COFINS, CBS e IBS com rastreabilidade legal para operações estaduais, interestaduais, ZFM e conferência direta de XML.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateModule('simulador')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#9E141A] hover:bg-[#851015] text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-4 h-4" />
            <span>Nova Simulação Fiscal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2">
            {onOpenImportXML && (
              <button
                type="button"
                onClick={onOpenImportXML}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#D1D5DB] rounded-lg font-medium text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#9E141A]" />
                <span>Importar XML</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAuditDrawer}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#D1D5DB] rounded-lg font-medium text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auditoria</span>
            </button>
          </div>
        </div>
      </section>

      {/* Unified 4-Column Ledger KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateModule('mapa')}
          className="bg-white p-5 rounded-xl border border-[#E4E7EC] hover:border-[#9E141A]/50 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Abrangência territorial</span>
            <MapPin className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] transition-colors" />
          </div>
          <div className="font-display tabular-nums text-2xl font-bold tracking-tight text-[#111827] mt-2.5">
            27 UFs + ZFM
          </div>
          <div className="text-xs text-[#6B7280] mt-2 pt-2.5 border-t border-[#F1F3F6] flex items-center justify-between">
            <span>Matriz 4%, 7%, 12% e DIFAL</span>
            <span className="text-[#9E141A] font-semibold">Mapa →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule('tabelas')}
          className="bg-white p-5 rounded-xl border border-[#E4E7EC] hover:border-[#9E141A]/50 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Tabela CFOP oficial</span>
            <FileSpreadsheet className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] transition-colors" />
          </div>
          <div className="font-display tabular-nums text-2xl font-bold tracking-tight text-[#111827] mt-2.5">
            {INITIAL_CFOPS.length} códigos
          </div>
          <div className="text-xs text-[#6B7280] mt-2 pt-2.5 border-t border-[#F1F3F6] flex items-center justify-between">
            <span>Tabela CONFAZ vigente completa</span>
            <span className="text-[#9E141A] font-semibold">Catálogo →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule('tabelas')}
          className="bg-white p-5 rounded-xl border border-[#E4E7EC] hover:border-[#9E141A]/50 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">NCM & Tabela TIPI</span>
            <TableProperties className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] transition-colors" />
          </div>
          <div className="font-display tabular-nums text-2xl font-bold tracking-tight text-[#111827] mt-2.5">
            {totalNcmsOficiais ? `${totalNcmsOficiais.toLocaleString('pt-BR')} NCMs` : '10.516 NCMs'}
          </div>
          <div className="text-xs text-[#6B7280] mt-2 pt-2.5 border-t border-[#F1F3F6] flex items-center justify-between">
            <span>96 capítulos · Siscomex, IPI e CEST</span>
            <span className="text-[#9E141A] font-semibold">Consultar →</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule('reforma')}
          className="bg-white p-5 rounded-xl border border-[#E4E7EC] hover:border-[#9E141A]/50 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span className="font-medium">Transição 2026</span>
            <Scale className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] transition-colors" />
          </div>
          <div className="font-display tabular-nums text-2xl font-bold tracking-tight text-[#111827] mt-2.5">
            0,9% · 0,1%
          </div>
          <div className="text-xs text-[#6B7280] mt-2 pt-2.5 border-t border-[#F1F3F6] flex items-center justify-between">
            <span>CBS e IBS teste (LC 214/25)</span>
            <span className="text-[#9E141A] font-semibold">Detalhar →</span>
          </div>
        </button>
      </section>

      {/* Two Column Operational Workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Diretrizes de Conformidade */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-[#111827]">
              Diretrizes de conformidade e regras-chave
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#6B7280]">
              MOC v7.0
            </span>
          </div>

          <div className="divide-y divide-[#ECEEF2]">
            <div className="p-5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display font-semibold text-[13px] text-[#111827]">
                  DIFAL Não Contribuinte
                </h4>
                <span className="text-xs font-mono tabular-nums text-[#4B5563]">
                  EC 87/2015 · LC 190/2022 · 100% Destino
                </span>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Nas operações interestaduais com consumidor final sem Inscrição Estadual ativa, o remetente recolhe a diferença entre a alíquota interna do destino e a alíquota interestadual aplicável.
              </p>
            </div>

            <div className="p-5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display font-semibold text-[13px] text-[#111827]">
                  Desoneração Zona Franca de Manaus e ALC
                </h4>
                <span className="text-xs font-mono tabular-nums text-[#4B5563]">
                  Convênio ICMS 65/88 · CST 40
                </span>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Remessa de mercadoria nacional para destinatário habilitado na ZFM ou ALC conta com isenção de ICMS, abatimento obrigatório no total da NF-e e alíquota zero de PIS/COFINS (Lei 10.996/04).
              </p>
            </div>

            <div className="p-5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display font-semibold text-[13px] text-[#111827]">
                  Exclusão do ICMS da Base de PIS/COFINS
                </h4>
                <span className="text-xs font-mono tabular-nums text-[#4B5563]">
                  STF Tema 69 · Base Líquida
                </span>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                O ICMS destacado na nota fiscal de saída é excluído da base de cálculo de PIS e COFINS no regime não-cumulativo e cumulativo, conforme tese de repercussão geral do STF.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Módulos Operacionais */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-[#111827]">
              Estações de trabalho
            </h3>
            <span className="text-xs text-[#6B7280]">Acesso direto</span>
          </div>

          <div className="divide-y divide-[#ECEEF2]">
            <button
              type="button"
              onClick={() => onNavigateModule('simulador')}
              className="w-full px-5 py-4 hover:bg-[#F9FAFB] text-left transition-colors group flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-display text-[13px] font-semibold text-[#111827] group-hover:text-[#9E141A] transition-colors">
                  Simulador Fiscal em 4 Etapas
                </div>
                <div className="text-xs text-[#6B7280] truncate">
                  Operação, destino por município, NCM/CFOP e planilha NF-e
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] shrink-0 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('analise_xml')}
              className="w-full px-5 py-4 hover:bg-[#F9FAFB] text-left transition-colors group flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-display text-[13px] font-semibold text-[#111827] group-hover:text-[#9E141A] transition-colors">
                  Comparativo XML (2026 × 2027)
                </div>
                <div className="text-xs text-[#6B7280] truncate">
                  Importação de NF-e, créditos e custo líquido por kg ou unidade
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] shrink-0 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('mapa')}
              className="w-full px-5 py-4 hover:bg-[#F9FAFB] text-left transition-colors group flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-display text-[13px] font-semibold text-[#111827] group-hover:text-[#9E141A] transition-colors">
                  Mapa Fiscal do Brasil
                </div>
                <div className="text-xs text-[#6B7280] truncate">
                  Alíquotas internas por UF, rotas interestaduais e SUFRAMA
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] shrink-0 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('tabelas')}
              className="w-full px-5 py-4 hover:bg-[#F9FAFB] text-left transition-colors group flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-display text-[13px] font-semibold text-[#111827] group-hover:text-[#9E141A] transition-colors">
                  Tabelas CFOP, NCM/TIPI e cBenef
                </div>
                <div className="text-xs text-[#6B7280] truncate">
                  Consulta dinâmica oficial e carimbos de observação fiscal
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] shrink-0 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('reforma')}
              className="w-full px-5 py-4 hover:bg-[#F9FAFB] text-left transition-colors group flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-display text-[13px] font-semibold text-[#111827] group-hover:text-[#9E141A] transition-colors">
                  Reforma Tributária (CBS & IBS)
                </div>
                <div className="text-xs text-[#6B7280] truncate">
                  Cronograma de transição 2026–2033 e regimes diferenciados
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#9E141A] shrink-0 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateModule('calculadora_rtc')}
              className="w-full px-5 py-4 hover:bg-[#F9FAFB] text-left transition-colors group flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="font-display text-[13px] font-semibold text-[#9E141A] group-hover:text-[#851015] transition-colors">
                  Calculadora RTC Offline (Receita Federal)
                </div>
                <div className="text-xs text-[#6B7280] truncate">
                  Regime Regular, Simples Nacional (DAS × Por Fora), XML &lt;IBSCBS&gt; e Gerador DANFSe PDF
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9E141A] shrink-0 transition-colors" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
