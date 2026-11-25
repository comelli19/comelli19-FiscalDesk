import React from 'react';
import { UFInfo, NCMInfo, CFOP, STRegra } from '../../types/fiscal';
import { OperacaoSimuladorSnapshot } from '../../types/motorRegras';
import { SimuladorGuiadoView } from '../SimuladorInteligente/SimuladorGuiadoView';
import { DadosNFeExtraidos } from '../../services/xmlNFeParser';

export type SubTabSimulacoes =
  | 'simulador_guiado'
  | 'simulador_nfe'
  | 'motor_universal'
  | 'calculadora'
  | 'comparador';

interface HubSimulacoesProps {
  subTab: SubTabSimulacoes;
  setSubTab: (tab: SubTabSimulacoes) => void;
  ufs: UFInfo[];
  ncms: NCMInfo[];
  cfops: CFOP[];
  stRules?: STRegra[];
  ufOrigem: string;
  setUfOrigem: (uf: string) => void;
  ufDestino: string;
  setUfDestino: (uf: string) => void;
  onOpenAuditDrawer?: () => void;
  onSimulationChange?: (snapshot: OperacaoSimuladorSnapshot) => void;
  externalXMLData?: DadosNFeExtraidos | null;
  onClearExternalXML?: () => void;
}

export const HubSimulacoes: React.FC<HubSimulacoesProps> = ({
  ufs,
  ncms,
  cfops,
  stRules,
  ufOrigem,
  setUfOrigem,
  ufDestino,
  setUfDestino,
  onOpenAuditDrawer,
  onSimulationChange,
  externalXMLData,
  onClearExternalXML,
}) => {
  return (
    <div className="space-y-4">
      <SimuladorGuiadoView
        ufs={ufs}
        ncms={ncms}
        cfops={cfops}
        stRules={stRules}
        ufOrigem={ufOrigem}
        setUfOrigem={setUfOrigem}
        ufDestino={ufDestino}
        setUfDestino={setUfDestino}
        onOpenAuditDrawer={onOpenAuditDrawer}
        onSimulationChange={onSimulationChange}
        externalXMLData={externalXMLData}
        onClearExternalXML={onClearExternalXML}
      />
    </div>
  );
};
