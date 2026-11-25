import React, { useState } from 'react';
import { UFInfo, STRegra, SuframaRegra, CFOP } from '../../types/fiscal';
import { BRAZIL_UF_PATHS } from './brazilSvgPaths';
import { getAliquotaInterestadual } from '../../data/ufs';
import {
  MapPin,
  Layers,
  FileText,
  Percent,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Info,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface BrazilMapProps {
  ufs: UFInfo[];
  stRules: STRegra[];
  suframaRules: SuframaRegra[];
  cfops: CFOP[];
  ufOrigem: string;
  setUfOrigem: (uf: string) => void;
  ufDestino: string;
  setUfDestino: (uf: string) => void;
  onNavigateToCalculator?: (origem: string, destino: string) => void;
  onNavigateToSefaz?: (codigo: number) => void;
}

type MapLayer = 'interestadual' | 'interna' | 'st' | 'suframa' | 'difal';
type SidePanelTab = 'cfops' | 'icms' | 'st' | 'outros' | 'suframa' | 'notas' | 'rejeicoes';

export const BrazilMap: React.FC<BrazilMapProps> = ({
  ufs,
  stRules,
  suframaRules,
  cfops,
  ufOrigem,
  setUfOrigem,
  ufDestino,
  setUfDestino,
  onNavigateToCalculator,
  onNavigateToSefaz,
}) => {
  const [activeLayer, setActiveLayer] = useState<MapLayer>('interestadual');
  const [hoveredUF, setHoveredUF] = useState<UFInfo | null>(null);
  const [activeTab, setActiveTab] = useState<SidePanelTab>('icms');
  const [searchNCM, setSearchNCM] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  const [userNote, setUserNote] = useState('');
  const [lastCheckDate, setLastCheckDate] = useState('2026-02-01');
  const [noteSaved, setNoteSaved] = useState(false);

  const normSigla = (val: string) =>
    val.includes('/') ? val.split('/').pop()!.trim().slice(0, 2).toUpperCase() : val.trim().slice(0, 2).toUpperCase();
  const origemSigla = normSigla(ufOrigem);
  const destinoSigla = normSigla(ufDestino);

  const selectedUFInfo = ufs.find((u) => u.sigla === destinoSigla) || ufs[0];
  const origemUFInfo = ufs.find((u) => u.sigla === origemSigla) || ufs[0];

  // Rates
  const isMesmaUF = ufOrigem === ufDestino;
  const aliqInterestadual = getAliquotaInterestadual(ufOrigem, ufDestino, false);
  const aliqInternaDestino = selectedUFInfo ? selectedUFInfo.aliquotaInterna : 18;
  const fcpDestino = selectedUFInfo ? selectedUFInfo.fcp : 0;
  const difalPercent = isMesmaUF ? 0 : Math.max(0, aliqInternaDestino - aliqInterestadual);

  // Municipalities for special regime
  const specialMunicipalities = selectedUFInfo.municipiosRegimeEspecial || [];
  const currentMunicipio = selectedMunicipio || specialMunicipalities[0] || '';
  const suframaInfo = suframaRules.find(
    (s) => s.uf === ufDestino && (!currentMunicipio || s.municipio.includes(currentMunicipio.split(' ')[0]))
  );

  // Filter ST rules for this pair
  const currentSTRules = stRules.filter(
    (r) =>
      (r.ufOrigem === ufOrigem && r.ufDestino === ufDestino) ||
      (r.ufDestino === ufDestino && (!searchNCM || r.ncm.includes(searchNCM) || r.descricaoProduto.toLowerCase().includes(searchNCM.toLowerCase())))
  );

  // Color generator for each UF based on active layer
  const getUFColor = (sigla: string) => {
    const uf = ufs.find((u) => u.sigla === sigla);
    if (!uf) return '#cbd5e1';

    if (sigla === ufOrigem) {
      return '#9E141A'; // Destaque para UF de Origem
    }

    if (activeLayer === 'interestadual') {
      const rate = getAliquotaInterestadual(ufOrigem, sigla, false);
      if (sigla === ufOrigem) return '#94151B';
      if (rate === 7) return '#059669'; // Emerald 7%
      if (rate === 12) return '#0d9488'; // Teal 12%
      if (rate === 4) return '#8b5cf6'; // Violet 4%
      return '#64748b';
    }

    if (activeLayer === 'interna') {
      const rate = uf.aliquotaInterna;
      if (rate >= 21) return '#dc2626'; // Red high (21% - 22%)
      if (rate >= 19.5) return '#ea580c'; // Orange medium-high (19.5% - 20.5%)
      if (rate >= 18) return '#d97706'; // Amber (18% - 19%)
      return '#16a34a'; // Green standard (17%)
    }

    if (activeLayer === 'st') {
      const hasST = stRules.some((r) => r.ufDestino === sigla);
      return hasST ? '#7c3aed' : '#e2e8f0';
    }

    if (activeLayer === 'suframa') {
      return uf.temSuframaOuALC ? '#0284c7' : '#f1f5f9';
    }

    if (activeLayer === 'difal') {
      if (sigla === ufOrigem) return '#94a3b8';
      const rateInter = getAliquotaInterestadual(ufOrigem, sigla, false);
      const diff = uf.aliquotaInterna - rateInter;
      if (diff >= 12) return '#b91c1c';
      if (diff >= 8) return '#c2410c';
      if (diff > 0) return '#b45309';
      return '#15803d';
    }

    return '#94a3b8';
  };

  const handleUFClick = (sigla: string) => {
    setUfDestino(sigla);
    const uf = ufs.find((u) => u.sigla === sigla);
    if (uf?.municipiosRegimeEspecial && uf.municipiosRegimeEspecial.length > 0) {
      setSelectedMunicipio(uf.municipiosRegimeEspecial[0]);
    } else {
      setSelectedMunicipio('');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Mapa Fiscal Interativo do Brasil</h2>
            <p className="text-xs text-slate-500">
              Clique em qualquer UF para inspecionar a operação interestadual completa
            </p>
          </div>
        </div>

        {/* Origin and Destination Quick Selectors */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs">
          <span className="font-medium text-slate-600 pl-2">Origem:</span>
          <select
            value={ufOrigem}
            onChange={(e) => setUfOrigem(e.target.value)}
            className="bg-white border border-slate-300 font-semibold text-blue-700 rounded px-2.5 py-1 focus:ring-2 focus:ring-blue-500"
          >
            {ufs.map((u) => (
              <option key={`orig-${u.sigla}`} value={u.sigla}>
                {u.sigla} - {u.nome}
              </option>
            ))}
          </select>

          <ArrowRight className="w-4 h-4 text-slate-400 mx-1" />

          <span className="font-medium text-slate-600">Destino:</span>
          <select
            value={ufDestino}
            onChange={(e) => handleUFClick(e.target.value)}
            className="bg-white border border-slate-300 font-semibold text-emerald-700 rounded px-2.5 py-1 focus:ring-2 focus:ring-emerald-500"
          >
            {ufs.map((u) => (
              <option key={`dest-${u.sigla}`} value={u.sigla}>
                {u.sigla} - {u.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Layer Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveLayer('interestadual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeLayer === 'interestadual'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alíq. Interestadual
          </button>
          <button
            onClick={() => setActiveLayer('interna')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeLayer === 'interna'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alíq. Interna
          </button>
          <button
            onClick={() => setActiveLayer('st')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeLayer === 'st'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Regime ST
          </button>
          <button
            onClick={() => setActiveLayer('suframa')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeLayer === 'suframa'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suframa / ALC
          </button>
          <button
            onClick={() => setActiveLayer('difal')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeLayer === 'difal'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DIFAL
          </button>
        </div>
      </div>

      {/* Main Grid: Map + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive Map SVG Canvas */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative flex flex-col items-center">
          {/* Layer Legend */}
          <div className="w-full mb-3 flex flex-wrap items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Camada: {activeLayer.toUpperCase()}
            </span>
            <div className="flex items-center gap-3">
              {activeLayer === 'interestadual' && (
                <>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Sua UF ({ufOrigem})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> 7%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" /> 12%
                  </span>
                </>
              )}
              {activeLayer === 'interna' && (
                <>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> 17%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" /> 18-19%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-orange-600 inline-block" /> 19.5-20.5%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> 21-22%
                  </span>
                </>
              )}
              {activeLayer === 'suframa' && (
                <span className="flex items-center gap-1 text-sky-700 font-medium">
                  <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" /> ZFM / Áreas de Livre Comércio
                </span>
              )}
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative w-full aspect-4/3 max-w-[540px] flex items-center justify-center">
            <svg
              viewBox="0 0 580 580"
              className="w-full h-full drop-shadow-sm select-none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}
            >
              {BRAZIL_UF_PATHS.map((item) => {
                const ufData = ufs.find((u) => u.sigla === item.sigla);
                const isOrigin = item.sigla === ufOrigem;
                const isSelected = item.sigla === ufDestino;
                const fillColor = getUFColor(item.sigla);

                return (
                  <g key={item.sigla} className="cursor-pointer transition-all duration-150">
                    <path
                      d={item.path}
                      fill={fillColor}
                      stroke={isSelected ? '#1e293b' : isOrigin ? '#1d4ed8' : '#ffffff'}
                      strokeWidth={isSelected ? 3 : isOrigin ? 2.5 : 1.2}
                      className="hover:opacity-85 transition-opacity"
                      onMouseEnter={() => setHoveredUF(ufData || null)}
                      onMouseLeave={() => setHoveredUF(null)}
                      onClick={() => handleUFClick(item.sigla)}
                    />
                    <text
                      x={item.labelX}
                      y={item.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isOrigin || isSelected ? '#ffffff' : '#1e293b'}
                      fontSize={item.sigla === 'DF' ? '7' : '9.5'}
                      fontWeight="700"
                      className="pointer-events-none drop-shadow-xs"
                    >
                      {item.sigla}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredUF && (
              <div className="absolute top-2 right-2 bg-slate-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-lg backdrop-blur-xs pointer-events-none border border-slate-700/50">
                <p className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  {hoveredUF.sigla} — {hoveredUF.nome}
                </p>
                <div className="mt-1 space-y-0.5 text-slate-300">
                  <p>Alíquota Interna: <span className="font-semibold text-emerald-400">{hoveredUF.aliquotaInterna}%</span></p>
                  <p>Alíquota da sua UF ({ufOrigem} ➔ {hoveredUF.sigla}): <span className="font-semibold text-blue-300">{getAliquotaInterestadual(ufOrigem, hoveredUF.sigla)}%</span></p>
                  {hoveredUF.fcp > 0 && <p>FCP: <span className="text-amber-400">{hoveredUF.fcp}%</span></p>}
                  {hoveredUF.temSuframaOuALC && <p className="text-sky-300 font-medium">★ Suframa / ALC Ativo</p>}
                </div>
              </div>
            )}
          </div>

          <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Dica: Clique no estado para carregar os CFOPs, ST e regras municipais.</span>
            <span className="font-medium text-slate-700">Origem: <strong className="text-blue-600">{ufOrigem}</strong> | Destino: <strong className="text-emerald-600">{ufDestino}</strong></span>
          </div>
        </div>

        {/* Right Column: 7-Tab Fiscal Side Panel */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          {/* Header of Side Panel */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                  {ufOrigem}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                  {selectedUFInfo.sigla} - {selectedUFInfo.nome}
                </span>
                {selectedUFInfo.temSuframaOuALC && (
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-xs font-semibold rounded">
                    Suframa / ALC
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Região {selectedUFInfo.regiao} • Vigência: {selectedUFInfo.vigenciaInicio} • Atualizado em {selectedUFInfo.dataAtualizacao}
              </p>
            </div>
          </div>

          {/* Tab Navigation (7 Tabs) */}
          <div className="flex overflow-x-auto bg-slate-100/80 border-b border-slate-200 p-1 text-xs font-medium scrollbar-thin">
            <button
              onClick={() => setActiveTab('icms')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'icms' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. ICMS & DIFAL
            </button>
            <button
              onClick={() => setActiveTab('cfops')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'cfops' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. CFOPs ({isMesmaUF ? '5xxx' : '6xxx'})
            </button>
            <button
              onClick={() => setActiveTab('st')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'st' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Substituição Trib. (ST)
            </button>
            <button
              onClick={() => setActiveTab('suframa')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'suframa' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Suframa / ALC
            </button>
            <button
              onClick={() => setActiveTab('outros')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'outros' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. Outros Impostos
            </button>
            <button
              onClick={() => setActiveTab('notas')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'notas' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6. Notas & Anotações
            </button>
            <button
              onClick={() => setActiveTab('rejeicoes')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'rejeicoes' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7. Rejeições SEFAZ
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[520px] text-slate-800 text-sm">
            {/* TAB 1: ICMS */}
            {activeTab === 'icms' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">Alíquota Interna ({selectedUFInfo.sigla})</span>
                    <strong className="text-xl text-slate-900 font-bold">{selectedUFInfo.aliquotaInterna}%</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Operações internas</span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <span className="text-xs text-blue-700 block">Alíq. Interestadual</span>
                    <strong className="text-xl text-blue-900 font-bold">{aliqInterestadual}%</strong>
                    <span className="text-[10px] text-blue-600 block mt-0.5">{ufOrigem} ➔ {selectedUFInfo.sigla}</span>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <span className="text-xs text-amber-700 block">FCP (Pobreza)</span>
                    <strong className="text-xl text-amber-900 font-bold">{selectedUFInfo.fcp > 0 ? `${selectedUFInfo.fcp}%` : 'Não possui'}</strong>
                    <span className="text-[10px] text-amber-600 block mt-0.5">Fundo estadual</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <span className="text-xs text-emerald-700 block">DIFAL Estimado</span>
                    <strong className="text-xl text-emerald-900 font-bold">{isMesmaUF ? '0%' : `${difalPercent}%`}</strong>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">{isMesmaUF ? 'Mesma UF' : 'Não contribuinte'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Info className="w-4 h-4 text-blue-600" />
                    Regras e Fundamentação Legal:
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Fonte Legal:</strong> {selectedUFInfo.fonte}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Observações do Fisco:</strong> {selectedUFInfo.observacoesFiscais}
                  </p>
                </div>

                {onNavigateToCalculator && (
                  <button
                    onClick={() => onNavigateToCalculator(ufOrigem, ufDestino)}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    Simular Cálculo Completo {ufOrigem} ➔ {ufDestino}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: CFOPS */}
            {activeTab === 'cfops' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>CFOPs sugeridos para saída ({isMesmaUF ? 'Grupo 5xxx - Operação Interna' : 'Grupo 6xxx - Interestadual'}):</span>
                  <span className="font-semibold text-blue-700">{isMesmaUF ? 'Mesmo Estado' : 'Outro Estado'}</span>
                </div>

                <div className="space-y-2">
                  {cfops
                    .filter((c) => (isMesmaUF ? c.grupo === '5xxx' : c.grupo === '6xxx'))
                    .slice(0, 5)
                    .map((c) => (
                      <div key={c.codigo} className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-700 text-xs">{c.codigo}</span>
                          <span className="text-[11px] text-slate-500">Devolução: <strong>{c.cfopDevolucao || 'N/A'}</strong></span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 mt-1">{c.descricao}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{c.quandoUsar}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 3: SUBSTITUIÇÃO TRIBUTÁRIA (ST) */}
            {activeTab === 'st' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por NCM ou descrição do produto..."
                      value={searchNCM}
                      onChange={(e) => setSearchNCM(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {currentSTRules.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">Nenhum protocolo de ST cadastrado para este filtro</p>
                    <p className="mt-1 text-slate-400">Verifique se o NCM possui convênio CONFAZ ativo ou utilize o CRUD administrativo.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentSTRules.map((st) => (
                      <div key={st.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-700">NCM: {st.ncm} | CEST: {st.cest}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-semibold rounded text-[10px]">
                            MVA Orig: {st.mvaOriginal}%
                          </span>
                        </div>
                        <p className="font-medium text-slate-800">{st.descricaoProduto}</p>
                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4">
                          <span><strong>Protocolo:</strong> {st.protocoloConvenio}</span>
                          <span><strong>Adesão:</strong> {st.aderiu ? 'Sim' : 'Não'}</span>
                          <span><strong>Vigência:</strong> {st.vigenciaInicio}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SUFRAMA / ÁREAS DE LIVRE COMÉRCIO */}
            {activeTab === 'suframa' && (
              <div className="space-y-3">
                {selectedUFInfo.temSuframaOuALC ? (
                  <div className="space-y-3">
                    {/* Municipality selector */}
                    <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg text-xs space-y-2">
                      <label className="font-semibold text-sky-900 block">
                        Município com Regime Especial ({selectedUFInfo.sigla}):
                      </label>
                      <select
                        value={currentMunicipio}
                        onChange={(e) => setSelectedMunicipio(e.target.value)}
                        className="w-full bg-white border border-sky-300 text-sky-950 font-medium rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500"
                      >
                        {specialMunicipalities.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-sky-800">
                        O regime de benefícios fiscais da Suframa e Áreas de Livre Comércio varia por município dentro da UF.
                      </p>
                    </div>

                    {suframaInfo ? (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
                            <span className="text-[10px] text-slate-500 block">ICMS Entrada</span>
                            <strong className="text-emerald-700 font-bold">{suframaInfo.isencaoICMS ? 'Isenção / Deson.' : 'Normal'}</strong>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
                            <span className="text-[10px] text-slate-500 block">PIS / COFINS</span>
                            <strong className="text-emerald-700 font-bold">{suframaInfo.aliquotaZeroPISCOFINS ? 'Alíquota Zero' : 'Normal'}</strong>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
                            <span className="text-[10px] text-slate-500 block">IPI</span>
                            <strong className="text-emerald-700 font-bold">{suframaInfo.reducaoOuIsencaoIPI ? 'Isenção / Redução' : 'Normal'}</strong>
                          </div>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                          <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                            Exigências e Alertas Obrigatórios:
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-amber-900 text-[11px]">
                            {suframaInfo.alertasObrigatorios.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                          <span className="font-semibold text-slate-800">Documentação e Procedimento:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                            {suframaInfo.documentosExigidos.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                          <p className="text-[10px] text-slate-500 mt-2">
                            <strong>Base Legal:</strong> {suframaInfo.fonte}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Informação municipal em conferência na legislação.</p>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                    <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">Estado de {selectedUFInfo.nome} não possui Zona Franca ou Área de Livre Comércio</p>
                    <p className="mt-1 text-slate-400">Benefícios Suframa são exclusivos de AM e das ALCs de RR, AP, RO e AC.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: OUTROS IMPOSTOS */}
            {activeTab === 'outros' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <h4 className="font-semibold text-slate-900">PIS / COFINS por Regime Tributário</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <strong className="block text-slate-800">Lucro Real (Não-Cumulativo)</strong>
                      <p className="text-slate-500 text-[11px] mt-0.5">PIS: 1,65% | COFINS: 7,60%</p>
                      <span className="text-[10px] text-emerald-700 font-medium">Exclui ICMS destacado da base (STF Tema 69)</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <strong className="block text-slate-800">Lucro Presumido (Cumulativo)</strong>
                      <p className="text-slate-500 text-[11px] mt-0.5">PIS: 0,65% | COFINS: 3,00%</p>
                      <span className="text-[10px] text-slate-500">Sem créditos da cadeia anterior</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <h4 className="font-semibold text-slate-900">IPI (Imposto sobre Produtos Industrializados)</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    A alíquota de IPI varia de acordo com a classificação fiscal do NCM na Tabela TIPI (Decreto nº 11.158/2022). Em compras para revenda (comércio puro), a alíquota é 0% ou não incide. Em devoluções por não-contribuintes de IPI, o imposto deve ser indicado no campo de Outras Despesas ou em tag própria de IPI devolvido.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 6: NOTAS & ANOTAÇÕES */}
            {activeTab === 'notas' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Anotações do Analista Fiscal para a UF {selectedUFInfo.sigla}:
                  </label>
                  <textarea
                    rows={4}
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Adicione observações da sua empresa, particularidades de clientes nesta UF, despachos ou regimes especiais..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 gap-2">
                  <span>
                    Última conferência da legislação: <strong>{lastCheckDate}</strong>
                    {noteSaved && (
                      <span className="ml-2 text-emerald-700 font-semibold">· Salvo com sucesso!</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLastCheckDate(new Date().toISOString().split('T')[0]);
                      setNoteSaved(true);
                      setTimeout(() => setNoteSaved(false), 2500);
                    }}
                    className="px-3 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 cursor-pointer"
                  >
                    Salvar Nota
                  </button>
                </div>
              </div>
            )}

            {/* TAB 7: REJEIÇÕES SEFAZ */}
            {activeTab === 'rejeicoes' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Rejeições frequentes em operações envolvendo <strong>{selectedUFInfo.sigla}</strong>:
                </p>
                <div className="space-y-2">
                  <div
                    onClick={() => onNavigateToSefaz && onNavigateToSefaz(693)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-red-300 cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-red-700">Rejeição 693</span>
                    <p className="text-slate-700 font-medium">Alíquota interestadual incompatível</p>
                    <p className="text-[11px] text-slate-500">Ocorre ao emitir de {ufOrigem} para {selectedUFInfo.sigla} com alíquota divergente da tabela de 7% ou 12%.</p>
                  </div>
                  <div
                    onClick={() => onNavigateToSefaz && onNavigateToSefaz(805)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-red-300 cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-red-700">Rejeição 805</span>
                    <p className="text-slate-700 font-medium">SEFAZ não aceita Contribuinte Isento de IE</p>
                    <p className="text-[11px] text-slate-500">{selectedUFInfo.sigla} não permite indIEDest = 2 para empresas.</p>
                  </div>
                  <div
                    onClick={() => onNavigateToSefaz && onNavigateToSefaz(694)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-red-300 cursor-pointer transition-colors"
                  >
                    <span className="font-bold text-red-700">Rejeição 694 / 695</span>
                    <p className="text-slate-700 font-medium">Grupo ou total de FCP não informado</p>
                    <p className="text-[11px] text-slate-500">Exigência do Fundo de Pobreza em vendas a consumidor final.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
