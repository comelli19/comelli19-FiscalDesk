import React, { useState } from 'react';
import {
  Calculator,
  Server,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  FileText,
  BookOpen,
  FileCode2,
} from 'lucide-react';
import { RTC_VERSAO_MOTOR } from '../../data/rtcTabelasOficiais';
import { RtcRegimeRegularResponse } from '../../services/rtcCalculadoraService';
import { RegimeRegularTab } from './RegimeRegularTab';
import { SimplesNacionalTab } from './SimplesNacionalTab';
import { GeradorDANFSeTab } from './GeradorDANFSeTab';
import { TabelasOficiaisRTCTab } from './TabelasOficiaisRTCTab';
import { XmlValidadorRTCTab } from './XmlValidadorRTCTab';

type RtcTabId = 'regime_regular' | 'simples_nacional' | 'danfse' | 'tabelas' | 'xml';

interface TabItem {
  id: RtcTabId;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const RTC_TABS: TabItem[] = [
  { id: 'regime_regular', label: 'Regime Regular', icon: Calculator },
  { id: 'simples_nacional', label: 'Simples Nacional', icon: ArrowRightLeft },
  { id: 'danfse', label: 'Gerar DANFSe', icon: FileText },
  { id: 'tabelas', label: 'Tabelas Oficiais', icon: BookOpen },
  { id: 'xml', label: 'Validador XML', icon: FileCode2 },
];

export const CalculadoraRTCView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RtcTabId>('regime_regular');
  const [apiMode, setApiMode] = useState<'integrado' | 'externo'>('integrado');
  const [externalApiUrl, setExternalApiUrl] = useState<string>('http://localhost:8080/api/calculadora');
  const [showApiConfig, setShowApiConfig] = useState<boolean>(false);

  const [ultimoResultadoXml, setUltimoResultadoXml] = useState<RtcRegimeRegularResponse | null>(null);
  const [ultimoTipoDocXml, setUltimoTipoDocXml] = useState<'NFE' | 'NFSE'>('NFE');

  const handleEnviarParaXml = (resultado: RtcRegimeRegularResponse, tipo: 'NFE' | 'NFSE') => {
    setUltimoResultadoXml(resultado);
    setUltimoTipoDocXml(tipo);
    setActiveTab('xml');
  };

  return (
    <div className="space-y-5">
      {/* Barra de Navegação Limpa e Unificada */}
      <div className="bg-white border border-[#E4E7EC] rounded-xl print:hidden">
        <div className="px-4 sm:px-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7EC]">
          <nav
            className="flex items-center gap-1 overflow-x-auto -mb-px"
            aria-label="Ferramentas da Calculadora RTC"
          >
            {RTC_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-3.5 text-xs font-display whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#9E141A] text-[#9E141A] font-semibold'
                      : 'border-transparent text-[#4B5563] font-medium hover:text-[#111827] hover:border-[#D1D5DB]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#9E141A]' : 'text-[#6B7280]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 py-2 shrink-0">
            <span className="hidden xl:inline text-[11px] text-[#6B7280] tabular-nums">
              LC 214/2025 · RFB v{RTC_VERSAO_MOTOR.versoesRepositorios.regimeRegular} (HALF_EVEN)
            </span>
            <button
              type="button"
              onClick={() => setShowApiConfig((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                showApiConfig || apiMode === 'externo'
                  ? 'bg-[#FDF3F3] border-[#F3C6C8] text-[#9E141A]'
                  : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#4B5563] border-[#E4E7EC]'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{apiMode === 'integrado' ? 'Motor integrado' : 'API local RFB'}</span>
              {showApiConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Painel Técnico Opcional (recolhido por padrão) */}
        {showApiConfig && (
          <div className="p-4 sm:p-5 bg-[#F9FAFB] space-y-3 text-xs rounded-b-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display font-semibold text-[#111827]">
                Origem do cálculo (integração ERP / Docker RFB)
              </span>
              <span className="text-[11px] text-[#6B7280] tabular-nums">
                Regular v{RTC_VERSAO_MOTOR.versoesRepositorios.regimeRegular} · Simples v{RTC_VERSAO_MOTOR.versoesRepositorios.simplesNacional} · DANFSe v{RTC_VERSAO_MOTOR.versoesRepositorios.geradorDanfse} · Tabelas {RTC_VERSAO_MOTOR.ultimaAtualizacaoTabelas}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                  apiMode === 'integrado'
                    ? 'bg-white border-[#9E141A]'
                    : 'bg-[#F4F5F7] border-[#E4E7EC]'
                }`}
              >
                <input
                  type="radio"
                  name="rtc-api-mode"
                  checked={apiMode === 'integrado'}
                  onChange={() => setApiMode('integrado')}
                  className="mt-0.5 accent-[#9E141A]"
                />
                <div>
                  <div className="font-semibold text-[#111827]">Motor Integrado (Recomendado)</div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">
                    Cálculo imediato no navegador com API REST em{' '}
                    <span className="font-mono text-[#374151]">/api/calculadora/*</span> sem precisar de Docker ou Java.
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                  apiMode === 'externo'
                    ? 'bg-white border-[#9E141A]'
                    : 'bg-[#F4F5F7] border-[#E4E7EC]'
                }`}
              >
                <input
                  type="radio"
                  name="rtc-api-mode"
                  checked={apiMode === 'externo'}
                  onChange={() => setApiMode('externo')}
                  className="mt-0.5 accent-[#9E141A]"
                />
                <div className="flex-1 space-y-1.5">
                  <div className="font-semibold text-[#111827]">Servidor Local da Receita (Docker / Java)</div>
                  <input
                    type="url"
                    value={externalApiUrl}
                    onChange={(e) => setExternalApiUrl(e.target.value)}
                    disabled={apiMode !== 'externo'}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-[11px] text-[#111827] disabled:opacity-60"
                  />
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'regime_regular' && (
        <RegimeRegularTab
          apiEndpointMode={apiMode}
          externalApiUrl={externalApiUrl}
          onEnviarParaXml={handleEnviarParaXml}
        />
      )}

      {activeTab === 'simples_nacional' && <SimplesNacionalTab />}

      {activeTab === 'danfse' && <GeradorDANFSeTab />}

      {activeTab === 'tabelas' && <TabelasOficiaisRTCTab />}

      {activeTab === 'xml' && (
        <XmlValidadorRTCTab
          ultimoResultado={ultimoResultadoXml}
          ultimoTipoDocumento={ultimoTipoDocXml}
        />
      )}
    </div>
  );
};
