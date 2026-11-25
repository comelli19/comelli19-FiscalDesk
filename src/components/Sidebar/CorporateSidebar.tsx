import React from 'react';
import {
  LayoutDashboard,
  Zap,
  MapPin,
  TableProperties,
  Scale,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  FileSpreadsheet,
  Calculator,
} from 'lucide-react';
import { FiscalDeskLogo } from './FiscalDeskLogo';

export type CorporateModule =
  | 'dashboard'
  | 'simulador'
  | 'analise_xml'
  | 'mapa'
  | 'tabelas'
  | 'reforma'
  | 'calculadora_rtc';

interface CorporateSidebarProps {
  currentModule: CorporateModule;
  onSelectModule: (module: CorporateModule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAuditDrawer: () => void;
  onGlobalSearch: () => void;
}

export const CorporateSidebar: React.FC<CorporateSidebarProps> = ({
  currentModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  onOpenAuditDrawer,
  onGlobalSearch,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as CorporateModule,
      label: 'Visão Geral',
      description: 'Painel executivo & indicadores',
      icon: LayoutDashboard,
    },
    {
      id: 'simulador' as CorporateModule,
      label: 'Simulador Fiscal',
      description: 'Assistente 4 etapas & Planilha NF-e',
      icon: Zap,
    },
    {
      id: 'analise_xml' as CorporateModule,
      label: 'Comparativo XML',
      description: 'Custo líquido 2026 × 2027 por NF-e',
      icon: FileSpreadsheet,
    },
    {
      id: 'mapa' as CorporateModule,
      label: 'Mapa Fiscal',
      description: '27 UFs, ZFM & Rotas DIFAL',
      icon: MapPin,
    },
    {
      id: 'tabelas' as CorporateModule,
      label: 'Tabelas Fiscais',
      description: 'CFOP, NCM/TIPI, CST & CEST',
      icon: TableProperties,
    },
    {
      id: 'reforma' as CorporateModule,
      label: 'Reforma Tributária',
      description: 'CBS & IBS (EC 132/23 & LC 214)',
      icon: Scale,
    },
    {
      id: 'calculadora_rtc' as CorporateModule,
      label: 'Calculadora RTC (RFB)',
      description: 'CBS, IBS, IS, Simples & DANFSe (COTEC 342)',
      icon: Calculator,
    },
  ];

  return (
    <aside
      className={`bg-[#131417] text-[#F3F4F6] flex flex-col border-r border-[#22242C] transition-all duration-200 z-30 shrink-0 ${
        isCollapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#22242C]">
        {!isCollapsed && <FiscalDeskLogo collapsed={false} />}
        {isCollapsed && <FiscalDeskLogo collapsed={true} />}

        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className="text-[#8E94A0] hover:text-white p-1.5 rounded-md hover:bg-[#1E2028] transition-colors cursor-pointer shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Search Trigger */}
      <div className="p-3 border-b border-[#22242C]">
        <button
          type="button"
          onClick={onGlobalSearch}
          className={`w-full flex items-center gap-2 py-2 px-2.5 bg-[#1B1D23] hover:bg-[#23262F] text-[#D1D5DB] rounded-lg text-xs font-medium border border-[#2A2D36] transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
          title="Pesquisa rápida (Ctrl+K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[#8E94A0] shrink-0" />
            {!isCollapsed && <span className="text-[#9CA3AF] truncate">Buscar código ou regra...</span>}
          </div>
          {!isCollapsed && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#131417] text-[#8E94A0] rounded border border-[#2E313B] shrink-0">
              Ctrl K
            </kbd>
          )}
        </button>
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto" aria-label="Navegação principal">
        {!isCollapsed && (
          <div className="px-2.5 pb-1.5 text-[11px] font-medium text-[#7B818E]">
            Módulos
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectModule(item.id)}
              title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#9E141A] text-white font-semibold'
                  : 'text-[#C6CBD4] font-medium hover:text-white hover:bg-[#1D1F26]'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-[#8E94A0]'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}

        {/* Audit Drawer Shortcut */}
        <div className="pt-4 mt-4 border-t border-[#22242C]">
          {!isCollapsed && (
            <div className="px-2.5 pb-1.5 text-[11px] font-medium text-[#7B818E]">
              Conformidade
            </div>
          )}

          <button
            type="button"
            onClick={onOpenAuditDrawer}
            title="Abrir painel de auditoria e memória de cálculo"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#D1D5DB] hover:text-white hover:bg-[#1D1F26] border border-[#262932] transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left truncate">
                <div className="font-medium text-[#E5E7EB] leading-tight">Auditoria Fiscal</div>
                <div className="text-[11px] text-[#8E94A0] truncate mt-0.5">Memória de cálculo e base legal</div>
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* Compact Sidebar Footer */}
      <div className="px-3.5 py-3 border-t border-[#22242C] bg-[#17191E]">
        {!isCollapsed ? (
          <div className="space-y-1">
            <div className="text-[9px] uppercase tracking-[0.14em] text-[#7B818E] font-medium">
              Idealizado &amp; desenvolvido por
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-xs font-semibold tracking-wide text-[#F3F4F6]">
                Leonardo Comelli
              </span>
              <span className="text-[10px] font-mono tabular-nums text-[#7B818E]">
                MOC 7.0 · 2026
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center" title="Idealizado & desenvolvido por Leonardo Comelli">
            <span className="font-display text-[10px] font-semibold tracking-wider text-[#C6CBD4]">LC</span>
            <span className="text-[9px] font-mono tabular-nums text-[#7B818E]">2026</span>
          </div>
        )}
      </div>
    </aside>
  );
};
