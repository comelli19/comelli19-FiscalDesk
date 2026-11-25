import React from 'react';
import {
  Search,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { RegimeTributarioUniversal } from '../../types/fiscal';
import { CorporateModule } from '../Sidebar/CorporateSidebar';

interface CorporateTopBarProps {
  currentModule: CorporateModule;
  activeRegime: RegimeTributarioUniversal;
  onChangeRegime: (regime: RegimeTributarioUniversal) => void;
  onOpenAuditDrawer: () => void;
  onGlobalSearch: () => void;
  onOpenImportXML?: () => void;
}

export const CorporateTopBar: React.FC<CorporateTopBarProps> = ({
  currentModule,
  onOpenAuditDrawer,
  onGlobalSearch,
  onOpenImportXML,
}) => {
  const moduleTitles: Record<CorporateModule, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Visão Geral Fiscal',
      subtitle: 'Operações, conformidade SEFAZ e parametrizações tributárias',
    },
    simulador: {
      title: 'Simulador Fiscal & Matriz NF-e',
      subtitle: 'Determinação automática de CFOP, CST, ICMS, IPI, PIS, COFINS, CBS e IBS',
    },
    analise_xml: {
      title: 'Comparativo XML — 2026 × 2027',
      subtitle: 'Composição tributária, créditos aproveitáveis, custo líquido e valor unitário',
    },
    mapa: {
      title: 'Mapa Fiscal do Brasil',
      subtitle: 'Alíquotas internas, interestaduais (4%, 7% e 12%), DIFAL e ZFM',
    },
    tabelas: {
      title: 'Tabelas Fiscais & Legislação',
      subtitle: 'Catálogos de CFOP, NCM/TIPI, CST, CSOSN, CEST e cBenef vigentes',
    },
    reforma: {
      title: 'Reforma Tributária',
      subtitle: 'Transição EC 132/2023 e LC 214/2025 (CBS, IBS e Imposto Seletivo)',
    },
    calculadora_rtc: {
      title: 'Calculadora RTC Offline (RFB)',
      subtitle: 'Portaria COTEC nº 342/2026 — Regime Regular, Simples Nacional, XML e DANFSe',
    },
  };

  const currentInfo = moduleTitles[currentModule];

  return (
    <header className="h-14 bg-white border-b border-[#E4E7EC] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 print:hidden">
      {/* Module Title & Quiet Breadcrumb */}
      <div className="min-w-0 flex items-center gap-2.5">
        <span className="text-xs font-medium text-[#6B7280] whitespace-nowrap hidden sm:inline">
          FiscalDesk
        </span>
        <span className="text-[#D1D5DB] hidden sm:inline" aria-hidden="true">/</span>
        <h1 className="font-display text-sm sm:text-[15px] font-semibold text-[#111827] truncate">
          {currentInfo.title}
        </h1>
        <span className="text-[#E5E7EB] hidden lg:inline" aria-hidden="true">·</span>
        <p className="text-xs text-[#6B7280] truncate hidden lg:block">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onGlobalSearch}
          className="flex items-center gap-2 py-1.5 px-3 bg-white hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-xs font-medium border border-[#D1D5DB] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Busca rápida em CFOP, NCM, UFs e regras (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#6B7280]" />
          <span className="hidden sm:inline">Pesquisar</span>
          <kbd className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.2 bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] rounded">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={onOpenAuditDrawer}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#D1D5DB] rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Abrir painel lateral de memória de cálculo e fundamentação jurídica"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">Auditoria</span>
        </button>

        {onOpenImportXML && (
          <button
            type="button"
            onClick={onOpenImportXML}
            className="flex items-center gap-1.5 py-1.5 px-3.5 bg-[#9E141A] hover:bg-[#851015] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Importar arquivo XML de NF-e para auditoria e simulação"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importar XML</span>
          </button>
        )}
      </div>
    </header>
  );
};
