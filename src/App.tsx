import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
import {
  CFOP,
  UFInfo,
  STRegra,
  RegimeTributarioUniversal,
} from './types/fiscal';
import { INITIAL_CFOPS } from './data/cfops';
import { INITIAL_UFS } from './data/ufs';
import { INITIAL_NCMS } from './data/ncms';
import { INITIAL_CBENEF, INITIAL_CARIMBOS_FISCAIS } from './data/cbenefAndCarimbos';
import { INITIAL_ST_REGRAS, INITIAL_SUFRAMA_REGRAS } from './data/stAndSuframa';
import { INITIAL_SEFAZ_REJEICOES } from './data/sefazRejections';

import { CorporateSidebar, CorporateModule } from './components/Sidebar/CorporateSidebar';
import { CorporateTopBar } from './components/Header/CorporateTopBar';
import { FiscalDashboard } from './components/Dashboard/FiscalDashboard';
import type { SubTabSimulacoes } from './components/Hubs/HubSimulacoes';
import type { SubTabTabelas } from './components/Hubs/HubTabelas';
import type { DadosNFeExtraidos } from './services/xmlNFeParser';
import type { OperacaoSimuladorSnapshot } from './types/motorRegras';
import {
  getCFOPUserPrefsMap,
  putCFOPRecords,
  saveCFOPUserPref,
} from './services/fiscalIndexedDBCache';

// Code-splitting por módulo para carregamento inicial ultrarrápido na Vercel
const HubSimulacoes = lazy(() =>
  import('./components/Hubs/HubSimulacoes').then((m) => ({ default: m.HubSimulacoes }))
);
const HubTabelas = lazy(() =>
  import('./components/Hubs/HubTabelas').then((m) => ({ default: m.HubTabelas }))
);
const BrazilMap = lazy(() =>
  import('./components/FiscalMap/BrazilMap').then((m) => ({ default: m.BrazilMap }))
);
const ReformaTributariaView = lazy(() =>
  import('./components/ReformaTributaria/ReformaTributariaView').then((m) => ({
    default: m.ReformaTributariaView,
  }))
);
const CalculadoraRTCView = lazy(() =>
  import('./components/CalculadoraRTC/CalculadoraRTCView').then((m) => ({
    default: m.CalculadoraRTCView,
  }))
);
const ComparativoXMLView = lazy(() =>
  import('./components/ComparativoXML/ComparativoXMLView').then((m) => ({
    default: m.ComparativoXMLView,
  }))
);
const PainelAuditoriaFiscal = lazy(() =>
  import('./components/Auditoria/PainelAuditoriaFiscal').then((m) => ({
    default: m.PainelAuditoriaFiscal,
  }))
);
const AdminCRUDModal = lazy(() =>
  import('./components/AdminCRUD/AdminCRUDModal').then((m) => ({ default: m.AdminCRUDModal }))
);
const GlobalSearchModal = lazy(() =>
  import('./components/GlobalSearchModal').then((m) => ({ default: m.GlobalSearchModal }))
);
const ImportadorXMLModal = lazy(() =>
  import('./components/ImportadorXML/ImportadorXMLModal').then((m) => ({
    default: m.ImportadorXMLModal,
  }))
);

const ModuleLoadingFallback: React.FC = () => (
  <div className="bg-white border border-[#E4E7EC] rounded-xl p-10 text-center text-xs text-[#6B7280]">
    Carregando módulo...
  </div>
);

export default function App() {
  // Navigation State
  const [currentModule, setCurrentModule] = useState<CorporateModule>('dashboard');
  const [subTabSimulacoes, setSubTabSimulacoes] = useState<SubTabSimulacoes>('simulador_guiado');
  const [subTabTabelas, setSubTabTabelas] = useState<SubTabTabelas>('cfops');
  const [isAdmin, setIsAdmin] = useState(false);

  // Layout & Drawer States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Active Tax Profile (Regime Tributário Corporativo)
  const [activeRegime, setActiveRegime] = useState<RegimeTributarioUniversal>('lucro_presumido');

  // Core Fiscal Data
  const [cfops, setCfops] = useState<CFOP[]>(INITIAL_CFOPS);
  const [ufs, setUfs] = useState<UFInfo[]>(INITIAL_UFS);
  const [stRules, setStRules] = useState<STRegra[]>(INITIAL_ST_REGRAS);

  // Global State for Origin & Destination (siglas UF válidas de 2 letras)
  const [ufOrigem, setUfOrigem] = useState('RS');
  const [ufDestino, setUfDestino] = useState('AP');

  // Modals
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGlobalXMLOpen, setIsGlobalXMLOpen] = useState(false);
  const [importedXMLData, setImportedXMLData] = useState<DadosNFeExtraidos | null>(null);
  const [simulacaoAtiva, setSimulacaoAtiva] = useState<OperacaoSimuladorSnapshot | null>(null);

  // Navigation router for global search & cross-links
  const handleSelectSpecificTool = (tool: string) => {
    if (
      tool === 'simulador_guiado' ||
      tool === 'motor_universal' ||
      tool === 'simulador_nfe' ||
      tool === 'calculadora' ||
      tool === 'comparador'
    ) {
      setCurrentModule('simulador');
      setSubTabSimulacoes(tool as SubTabSimulacoes);
    } else if (
      tool === 'cfops' ||
      tool === 'ncms' ||
      tool === 'aliquotas' ||
      tool === 'cbenef'
    ) {
      setCurrentModule('tabelas');
      setSubTabTabelas(tool as SubTabTabelas);
    } else if (tool === 'mapa') {
      setCurrentModule('mapa');
    } else if (tool === 'reforma') {
      setCurrentModule('reforma');
    } else if (tool === 'calculadora_rtc') {
      setCurrentModule('calculadora_rtc');
    } else if (tool === 'dashboard') {
      setCurrentModule('dashboard');
    } else if (tool === 'sefaz') {
      setCurrentModule('tabelas');
    }
  };

  // Hidrata preferências persistidas de CFOP (favoritos/anotações) do IndexedDB sem requisições pesadas na abertura
  useEffect(() => {
    let active = true;

    getCFOPUserPrefsMap()
      .then((prefs) => {
        if (!active || !prefs || Object.keys(prefs).length === 0) return;
        setCfops((prev) =>
          prev.map((c) => {
            const p = prefs[c.id];
            if (!p) return c;
            return {
              ...c,
              favorito: p.favorito !== undefined ? p.favorito : c.favorito,
              anotacoes: p.anotacoes !== undefined ? p.anotacoes : c.anotacoes,
            };
          })
        );
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleFavorito = (id: string) => {
    setCfops((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextFav = !c.favorito;
        void saveCFOPUserPref(id, { favorito: nextFav });
        return { ...c, favorito: nextFav };
      })
    );
  };

  const handleSalvarAnotacaoCFOP = (id: string, anotacao: string) => {
    setCfops((prev) =>
      prev.map((c) => (c.id === id ? { ...c, anotacoes: anotacao } : c))
    );
    void saveCFOPUserPref(id, { anotacoes: anotacao });
  };

  const handleSaveUF = (updatedUF: UFInfo) => {
    setUfs((prev) => prev.map((u) => (u.sigla === updatedUF.sigla ? updatedUF : u)));
    fetch(`/api/ufs/${updatedUF.sigla}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUF),
    }).catch(() => {});
  };

  const handleSaveCFOP = (newCFOP: CFOP) => {
    setCfops((prev) => [newCFOP, ...prev]);
    void putCFOPRecords([newCFOP]);
    fetch('/api/cfops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCFOP),
    }).catch(() => {});
  };

  const handleSaveSTRule = (newST: STRegra) => {
    setStRules((prev) => [newST, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-row font-sans text-[#14171F] antialiased selection:bg-[#9E141A] selection:text-white">
      {/* 1. Corporate Collapsible Sidebar */}
      <CorporateSidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
        onGlobalSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Corporate Header */}
        <CorporateTopBar
          currentModule={currentModule}
          activeRegime={activeRegime}
          onChangeRegime={setActiveRegime}
          onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
          onGlobalSearch={() => setIsSearchOpen(true)}
          onOpenImportXML={() => setIsGlobalXMLOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Módulo 1: Dashboard Fiscal Executivo (eager para first paint instantâneo) */}
          {currentModule === 'dashboard' && (
            <FiscalDashboard
              onNavigateModule={setCurrentModule}
              activeRegime={activeRegime}
              onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
              onOpenImportXML={() => setIsGlobalXMLOpen(true)}
            />
          )}

          {/* Demais módulos sob demanda via code-splitting */}
          <Suspense fallback={<ModuleLoadingFallback />}>
            {currentModule === 'simulador' && (
              <HubSimulacoes
                subTab={subTabSimulacoes}
                setSubTab={setSubTabSimulacoes}
                ufs={ufs}
                ncms={INITIAL_NCMS}
                cfops={cfops}
                stRules={stRules}
                ufOrigem={ufOrigem}
                setUfOrigem={setUfOrigem}
                ufDestino={ufDestino}
                setUfDestino={setUfDestino}
                onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
                onSimulationChange={setSimulacaoAtiva}
                externalXMLData={importedXMLData}
                onClearExternalXML={() => setImportedXMLData(null)}
              />
            )}

            {currentModule === 'mapa' && (
              <BrazilMap
                ufs={ufs}
                stRules={stRules}
                suframaRules={INITIAL_SUFRAMA_REGRAS}
                cfops={cfops}
                ufOrigem={ufOrigem}
                setUfOrigem={setUfOrigem}
                ufDestino={ufDestino}
                setUfDestino={setUfDestino}
                onNavigateToCalculator={(orig, dest) => {
                  setUfOrigem(orig);
                  setUfDestino(dest);
                  setCurrentModule('simulador');
                }}
                onNavigateToSefaz={() => {
                  setCurrentModule('tabelas');
                }}
              />
            )}

            {currentModule === 'tabelas' && (
              <HubTabelas
                subTab={subTabTabelas}
                setSubTab={setSubTabTabelas}
                cfops={cfops}
                ncms={INITIAL_NCMS}
                ufs={ufs}
                cbenefList={INITIAL_CBENEF}
                carimbosList={INITIAL_CARIMBOS_FISCAIS}
                ufOrigem={ufOrigem}
                setUfOrigem={setUfOrigem}
                ufDestino={ufDestino}
                setUfDestino={setUfDestino}
                onToggleFavoritoCFOP={handleToggleFavorito}
                onSalvarAnotacaoCFOP={handleSalvarAnotacaoCFOP}
                isAdmin={isAdmin}
                onNovoCFOP={() => setIsAdminOpen(true)}
                onSelectNCMForCalculator={() => {
                  setCurrentModule('simulador');
                }}
              />
            )}

            {currentModule === 'reforma' && (
              <ReformaTributariaView onOpenCalculadoraRTC={() => setCurrentModule('calculadora_rtc')} />
            )}

            {currentModule === 'analise_xml' && <ComparativoXMLView />}

            {currentModule === 'calculadora_rtc' && <CalculadoraRTCView />}
          </Suspense>
        </main>

        {/* Corporate Footer */}
        <footer className="bg-white border-t border-[#E4E7EC] py-3 px-6 text-xs text-[#6B7280] print:hidden mt-auto">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <span>
              FiscalDesk · Inteligência Tributária Nacional
              <span className="text-[#D1D5DB] mx-1.5" aria-hidden="true">|</span>
              <span className="text-[#6B7280]">Idealizado &amp; desenvolvido por</span>{' '}
              <strong className="font-display font-semibold tracking-wide text-[#111827]">
                Leonardo Comelli
              </strong>
            </span>
            <span className="text-[#9CA3AF] text-[11px] font-mono tabular-nums">
              MOC v7.0 · RICMS · TIPI · EC 132/23 · LC 214/25
            </span>
          </div>
        </footer>
      </div>

      {/* 3. Modais e Drawer montados apenas quando abertos */}
      {isAuditDrawerOpen && (
        <Suspense fallback={null}>
          <PainelAuditoriaFiscal
            isOpen={isAuditDrawerOpen}
            onClose={() => setIsAuditDrawerOpen(false)}
            activeRegime={activeRegime}
            ufs={ufs}
            ncms={INITIAL_NCMS}
            cfops={cfops}
            stRules={stRules}
            simulacaoAtiva={simulacaoAtiva}
            operacaoAtual={{
              ufOrigem,
              ufDestino,
              ncm: '39253000',
              cfop: '6.109',
              valor: 3500.0,
              destinatarioPossuiIE: true,
              envolveZFM: ufDestino.includes('AM') || ufDestino.includes('AP') || ufDestino.includes('MANAUS'),
            }}
          />
        </Suspense>
      )}

      {isAdminOpen && (
        <Suspense fallback={null}>
          <AdminCRUDModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            ufs={ufs}
            cfops={cfops}
            stRules={stRules}
            onSaveUF={handleSaveUF}
            onSaveCFOP={handleSaveCFOP}
            onSaveSTRule={handleSaveSTRule}
          />
        </Suspense>
      )}

      {isSearchOpen && (
        <Suspense fallback={null}>
          <GlobalSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            cfops={cfops}
            ufs={ufs}
            rejeicoes={INITIAL_SEFAZ_REJEICOES}
            ncms={INITIAL_NCMS}
            onSelectCFOP={() => {
              setCurrentModule('tabelas');
              setSubTabTabelas('cfops');
            }}
            onSelectUF={(uf) => {
              setUfDestino(uf);
              setCurrentModule('mapa');
            }}
            onSelectRejeicao={() => {
              setCurrentModule('tabelas');
            }}
            onSelectNCM={() => {
              setCurrentModule('tabelas');
              setSubTabTabelas('ncms');
            }}
            setActiveView={handleSelectSpecificTool}
          />
        </Suspense>
      )}

      {isGlobalXMLOpen && (
        <Suspense fallback={null}>
          <ImportadorXMLModal
            isOpen={isGlobalXMLOpen}
            onClose={() => setIsGlobalXMLOpen(false)}
            onCarregarNoSimulador={(dados: DadosNFeExtraidos) => {
              setImportedXMLData(dados);
              setCurrentModule('simulador');
              setSubTabSimulacoes('simulador_guiado');
              setIsGlobalXMLOpen(false);
            }}
          />
        </Suspense>
      )}

      <Analytics />
    </div>
  );
}
