import React, { useState, useEffect } from 'react';
import { CFOP, UFInfo, RejeicaoSEFAZ, NCMInfo } from '../types/fiscal';
import { Search, X, FileSpreadsheet, MapPin, ShieldAlert, Tag, ArrowRight } from 'lucide-react';
export type ActiveView =
  | 'simulador_guiado'
  | 'motor_universal'
  | 'simulador_nfe'
  | 'mapa'
  | 'cfops'
  | 'ncms'
  | 'cbenef'
  | 'aliquotas'
  | 'calculadora'
  | 'comparador'
  | 'reforma'
  | 'calculadora_rtc'
  | 'sefaz'
  | 'dashboard';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cfops: CFOP[];
  ufs: UFInfo[];
  rejeicoes: RejeicaoSEFAZ[];
  ncms: NCMInfo[];
  onSelectCFOP: (cfop: CFOP) => void;
  onSelectUF: (uf: string) => void;
  onSelectRejeicao: (codigo: number) => void;
  onSelectNCM: (ncm: string) => void;
  setActiveView: (view: ActiveView) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  cfops,
  ufs,
  rejeicoes,
  ncms,
  onSelectCFOP,
  onSelectUF,
  onSelectRejeicao,
  onSelectNCM,
  setActiveView,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();
  const cleanDigits = cleanQuery.replace(/\D/g, '');

  const matchedCFOPs = cleanQuery
    ? cfops
        .filter(
          (c) =>
            c.codigo.toLowerCase().includes(cleanQuery) ||
            (cleanDigits.length >= 3 && c.codigo.replace(/\D/g, '').includes(cleanDigits)) ||
            c.descricao.toLowerCase().includes(cleanQuery)
        )
        .slice(0, 4)
    : [];

  const matchedNCMs = cleanQuery
    ? ncms
        .filter(
          (n) =>
            n.codigo.toLowerCase().includes(cleanQuery) ||
            n.descricao.toLowerCase().includes(cleanQuery)
        )
        .slice(0, 4)
    : [];

  const matchedUFs = cleanQuery
    ? ufs
        .filter(
          (u) =>
            u.sigla.toLowerCase().includes(cleanQuery) ||
            u.nome.toLowerCase().includes(cleanQuery)
        )
        .slice(0, 3)
    : [];

  const matchedRejeicoes = cleanQuery
    ? rejeicoes
        .filter(
          (r) =>
            r.codigo.toString().includes(cleanQuery) ||
            r.descricao.toLowerCase().includes(cleanQuery)
        )
        .slice(0, 3)
    : [];

  const hasResults =
    matchedCFOPs.length > 0 ||
    matchedNCMs.length > 0 ||
    matchedUFs.length > 0 ||
    matchedRejeicoes.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-start justify-center pt-20 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar CFOP (5.102), NCM (8504.40.10), UF (SP, RJ), Rejeição (233, 854)..."
            className="w-full text-sm font-medium text-slate-900 bg-transparent outline-hidden placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-semibold px-2 py-1 bg-slate-100"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {!cleanQuery && (
            <div className="text-center py-8 text-slate-400 space-y-1">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium text-slate-600">Busca Rápida em Toda a Base Fiscal</p>
              <p className="text-[11px]">Digite um código de CFOP, NCM, sigla de UF ou código de rejeição.</p>
            </div>
          )}

          {cleanQuery && !hasResults && (
            <div className="text-center py-8 text-slate-400">
              <p className="font-semibold text-slate-700">Nenhum resultado encontrado para "{query}"</p>
              <p className="text-[11px] mt-1">Tente pesquisar por código numérico ou termo mais genérico.</p>
            </div>
          )}

          {/* NCMs */}
          {matchedNCMs.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-display font-semibold text-slate-500 text-xs flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                NCMs &amp; TIPI ({matchedNCMs.length})
              </span>
              <div className="space-y-1">
                {matchedNCMs.map((n, idx) => (
                  <div
                    key={`${n.codigo}-${idx}`}
                    onClick={() => {
                      onSelectNCM(n.codigo);
                      setActiveView('ncms');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-blue-50/70 border border-slate-100 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700 mr-2">{n.codigo}</span>
                      <span className="font-medium text-slate-800">{n.descricao}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CFOPs */}
          {matchedCFOPs.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="font-display font-semibold text-slate-500 text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                CFOPs ({matchedCFOPs.length})
              </span>
              <div className="space-y-1">
                {matchedCFOPs.map((c, idx) => (
                  <div
                    key={`${c.codigo}-${idx}`}
                    onClick={() => {
                      onSelectCFOP(c);
                      setActiveView('cfops');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-blue-50/70 border border-slate-100 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="font-bold text-blue-700 mr-2">{c.codigo}</span>
                      <span className="font-medium text-slate-800">{c.descricao}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UFs */}
          {matchedUFs.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="font-display font-semibold text-slate-500 text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Estados &amp; Regras Regionais ({matchedUFs.length})
              </span>
              <div className="space-y-1">
                {matchedUFs.map((u) => (
                  <div
                    key={u.sigla}
                    onClick={() => {
                      onSelectUF(u.sigla);
                      setActiveView('mapa');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-emerald-50/70 border border-slate-100 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="font-bold text-emerald-800 mr-2">{u.sigla}</span>
                      <span className="font-medium text-slate-800">{u.nome} ({u.regiao})</span>
                      <span className="text-slate-500 text-[11px] ml-2">— Alíquota: {u.aliquotaInterna}%</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejeições */}
          {matchedRejeicoes.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="font-display font-semibold text-slate-500 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                Rejeições SEFAZ ({matchedRejeicoes.length})
              </span>
              <div className="space-y-1">
                {matchedRejeicoes.map((r) => (
                  <div
                    key={r.codigo}
                    onClick={() => {
                      onSelectRejeicao(r.codigo);
                      setActiveView('sefaz');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-red-50/70 border border-slate-100 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="font-bold text-red-700 mr-2">Rejeição {r.codigo}</span>
                      <span className="font-medium text-slate-800">{r.descricao}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
