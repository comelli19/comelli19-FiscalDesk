import React, { useEffect } from 'react';
import { CFOP, NCMInfo, UFInfo, CBenef, CarimboFiscal } from '../../types/fiscal';
import { CFOPConsulta } from '../CFOPConsulta/CFOPConsulta';
import { NCMConsulta } from '../NCMConsulta/NCMConsulta';
import { AliquotasView } from '../Aliquotas/AliquotasView';
import { CBenefCarimbosView } from '../CBenefCarimbos/CBenefCarimbosView';
import { ListFilter, Tag, Percent, FileCheck } from 'lucide-react';
import {
  iniciarHidratacaoPreguicosaNCM,
  pausarHidratacaoPreguicosaNCM,
} from '../../services/ncmLazyCacheHydrator';

export type SubTabTabelas = 'cfops' | 'ncms' | 'aliquotas' | 'cbenef';

interface HubTabelasProps {
  subTab: SubTabTabelas;
  setSubTab: (tab: SubTabTabelas) => void;
  cfops: CFOP[];
  ncms: NCMInfo[];
  ufs: UFInfo[];
  cbenefList: CBenef[];
  carimbosList: CarimboFiscal[];
  ufOrigem: string;
  setUfOrigem: (uf: string) => void;
  ufDestino: string;
  setUfDestino: (uf: string) => void;
  onToggleFavoritoCFOP: (id: string) => void;
  onSalvarAnotacaoCFOP: (id: string, anotacao: string) => void;
  isAdmin: boolean;
  onNovoCFOP: () => void;
  onSelectNCMForCalculator?: (ncmCode: string) => void;
}

export const HubTabelas: React.FC<HubTabelasProps> = ({
  subTab,
  setSubTab,
  cfops,
  ncms,
  ufs,
  cbenefList,
  carimbosList,
  ufOrigem,
  setUfOrigem,
  ufDestino,
  setUfDestino,
  onToggleFavoritoCFOP,
  onSalvarAnotacaoCFOP,
  isAdmin,
  onNovoCFOP,
  onSelectNCMForCalculator,
}) => {
  // Inicia lazy-loading paginado dos ~10.516 NCMs no IndexedDB apenas após a abertura do módulo
  // e em períodos ociosos (requestIdleCallback), pausando ao sair sem perder o checkpoint.
  useEffect(() => {
    void iniciarHidratacaoPreguicosaNCM({ atrasoInicialMs: 1200 });
    return () => {
      pausarHidratacaoPreguicosaNCM();
    };
  }, []);

  const tabs: Array<{
    id: SubTabTabelas;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'cfops',
      label: 'Catálogo de CFOPs',
      subtitle: 'SINIEF · Entradas, saídas e exterior',
      icon: ListFilter,
    },
    {
      id: 'ncms',
      label: 'NCM & Tabela TIPI',
      subtitle: '96 capítulos · IPI, PIS/COFINS e CEST',
      icon: Tag,
    },
    {
      id: 'aliquotas',
      label: 'Alíquotas ICMS 27×27',
      subtitle: 'Alíquotas internas, FCP e matriz',
      icon: Percent,
    },
    {
      id: 'cbenef',
      label: 'cBenef & Carimbos',
      subtitle: 'Textos legais para infCpl / infAdFisco',
      icon: FileCheck,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-navigation bar inside Hub Tabelas */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] p-1.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-lg text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#131417] text-white'
                    : 'bg-transparent text-[#374151] hover:bg-[#F4F5F7]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isSelected ? 'text-[#EF888D]' : 'text-[#6B7280]'
                  }`}
                />
                <div className="min-w-0">
                  <div className="font-display font-semibold text-xs leading-tight truncate">
                    {tab.label}
                  </div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      isSelected ? 'text-[#9CA3AF]' : 'text-[#6B7280]'
                    }`}
                  >
                    {tab.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render active sub-view */}
      <div>
        {subTab === 'cfops' && (
          <CFOPConsulta
            cfops={cfops}
            onToggleFavorito={onToggleFavoritoCFOP}
            onSalvarAnotacao={onSalvarAnotacaoCFOP}
            isAdmin={isAdmin}
            onNovoCFOP={onNovoCFOP}
          />
        )}

        {subTab === 'ncms' && (
          <NCMConsulta
            ncms={ncms}
            onSelectNCMForCalculator={onSelectNCMForCalculator}
          />
        )}

        {subTab === 'aliquotas' && (
          <AliquotasView
            ufs={ufs}
            ufOrigem={ufOrigem}
            setUfOrigem={setUfOrigem}
            ufDestino={ufDestino}
            setUfDestino={setUfDestino}
          />
        )}

        {subTab === 'cbenef' && (
          <CBenefCarimbosView
            cbenefList={cbenefList}
            carimbosList={carimbosList}
          />
        )}
      </div>
    </div>
  );
};
