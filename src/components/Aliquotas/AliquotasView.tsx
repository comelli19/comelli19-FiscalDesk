import React, { useState } from 'react';
import { UFInfo } from '../../types/fiscal';
import { getAliquotaInterestadual } from '../../data/ufs';
import {
  Percent,
  Table,
  Search,
  Calendar,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AliquotasViewProps {
  ufs: UFInfo[];
  ufOrigem: string;
  setUfOrigem: (uf: string) => void;
  ufDestino: string;
  setUfDestino: (uf: string) => void;
}

export const AliquotasView: React.FC<AliquotasViewProps> = ({
  ufs,
  ufOrigem,
  setUfOrigem,
  ufDestino,
  setUfDestino,
}) => {
  const [activeTab, setActiveTab] = useState<'interna' | 'matriz' | 'ipi_pis_cofins'>('interna');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataVigencia, setSelectedDataVigencia] = useState('2026-02-01');

  const filteredUFs = ufs.filter(
    (u) =>
      u.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.regiao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Percent className="w-5 h-5 text-blue-600" />
            Tabelas de Alíquotas Fiscais
          </h2>
          <p className="text-xs text-slate-500">
            ICMS interno por UF, Matriz interestadual oficial 4%/7%/12%, IPI e PIS/COFINS por regime
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('interna')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'interna' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ICMS Interno por UF
          </button>
          <button
            onClick={() => setActiveTab('matriz')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'matriz' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriz Interestadual 27×27
          </button>
          <button
            onClick={() => setActiveTab('ipi_pis_cofins')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'ipi_pis_cofins' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            IPI, PIS & COFINS
          </button>
        </div>
      </div>

      {/* TAB 1: ICMS Interno por UF */}
      {activeTab === 'interna' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por UF ou estado..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Data de Vigência da Consulta:</span>
              <input
                type="date"
                value={selectedDataVigencia}
                onChange={(e) => setSelectedDataVigencia(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-16">UF</th>
                  <th className="py-2.5 px-4">Estado / Região</th>
                  <th className="py-2.5 px-3 text-center">Alíquota Interna Modal</th>
                  <th className="py-2.5 px-3 text-center">FCP (Combate Pobreza)</th>
                  <th className="py-2.5 px-3 text-center">Carga Total Modal</th>
                  <th className="py-2.5 px-3">Vigência</th>
                  <th className="py-2.5 px-4">Legislação / Fonte Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredUFs.map((uf) => {
                  const cargaEfetiva = uf.aliquotaInterna + uf.fcp;
                  return (
                    <tr key={uf.sigla} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-blue-700">
                        <span className="px-2 py-0.5 bg-blue-50 rounded">{uf.sigla}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-900">{uf.nome}</span>
                        <span className="text-[11px] text-slate-500 block">{uf.regiao}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 text-sm">
                        {uf.aliquotaInterna.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-amber-700">
                        {uf.fcp > 0 ? `${uf.fcp.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-sm">
                          {cargaEfetiva.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        Desde {uf.vigenciaInicio}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px] leading-snug">
                        {uf.fonte}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Matriz Interestadual 27x27 */}
      {activeTab === 'matriz' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong className="text-blue-900 block font-semibold">Regra Constitucional da Matriz Interestadual (CF/88 art. 155):</strong>
              <p className="text-blue-800 text-[11px] mt-0.5">
                • Origem Sul/Sudeste (exceto ES) ➔ Norte, Nordeste, Centro-Oeste e ES: <strong>7%</strong>
                <br />
                • Demais operações interestaduais: <strong>12%</strong>
                <br />
                • Mercadorias com Conteúdo de Importação superior a 40% (Res. Senado 13/2012): <strong>4%</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Testar rota:</span>
              <select
                value={ufOrigem}
                onChange={(e) => setUfOrigem(e.target.value)}
                className="bg-white border border-slate-300 font-bold text-blue-700 rounded px-2 py-1 text-xs"
              >
                {ufs.map((u) => (
                  <option key={`orig-mat-${u.sigla}`} value={u.sigla}>
                    {u.sigla}
                  </option>
                ))}
              </select>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={ufDestino}
                onChange={(e) => setUfDestino(e.target.value)}
                className="bg-white border border-slate-300 font-bold text-emerald-700 rounded px-2 py-1 text-xs"
              >
                {ufs.map((u) => (
                  <option key={`dest-mat-${u.sigla}`} value={u.sigla}>
                    {u.sigla}
                  </option>
                ))}
              </select>
              <span className="px-3 py-1 bg-slate-900 text-white font-bold rounded text-xs">
                {getAliquotaInterestadual(ufOrigem, ufDestino)}%
              </span>
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto p-2">
            <table className="text-center text-[10px] border-collapse w-full">
              <thead>
                <tr>
                  <th className="p-1 text-slate-400 font-medium">Orig\Dest</th>
                  {ufs.map((dest) => (
                    <th
                      key={`th-${dest.sigla}`}
                      className={`p-1 font-bold ${dest.sigla === ufDestino ? 'bg-emerald-100 text-emerald-900 rounded' : 'text-slate-600'}`}
                    >
                      {dest.sigla}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ufs.map((orig) => (
                  <tr key={`row-${orig.sigla}`} className="hover:bg-slate-50">
                    <td className={`p-1 font-bold ${orig.sigla === ufOrigem ? 'bg-blue-100 text-blue-900 rounded' : 'text-slate-600'}`}>
                      {orig.sigla}
                    </td>
                    {ufs.map((dest) => {
                      const rate = getAliquotaInterestadual(orig.sigla, dest.sigla);
                      const isSelectedPair = orig.sigla === ufOrigem && dest.sigla === ufDestino;
                      const isInternal = orig.sigla === dest.sigla;

                      let cellBg = 'bg-white';
                      if (isSelectedPair) cellBg = 'bg-purple-600 text-white font-bold ring-2 ring-purple-400';
                      else if (isInternal) cellBg = 'bg-slate-100 text-slate-400 font-medium';
                      else if (rate === 7) cellBg = 'bg-emerald-50 text-emerald-800 font-semibold';
                      else if (rate === 12) cellBg = 'bg-blue-50 text-blue-800 font-semibold';

                      return (
                        <td
                          key={`cell-${orig.sigla}-${dest.sigla}`}
                          onClick={() => {
                            setUfOrigem(orig.sigla);
                            setUfDestino(dest.sigla);
                          }}
                          className={`p-1 border border-slate-100 cursor-pointer transition-colors ${cellBg}`}
                          title={`${orig.sigla} ➔ ${dest.sigla}: ${rate}%`}
                        >
                          {rate}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: IPI, PIS & COFINS */}
      {activeTab === 'ipi_pis_cofins' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="font-bold text-slate-900 text-sm block">1. Simples Nacional</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Empresas optantes pelo Simples recolhem IPI, PIS, COFINS e ICMS de forma unificada pelo DAS, conforme as faixas de receita bruta anual dos Anexos da Lei Complementar nº 123/2006.
              </p>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                <strong>Anexo I (Comércio):</strong> 4,00% a 19,00%
                <br />
                <strong>Anexo II (Indústria):</strong> 4,50% a 30,00%
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="font-bold text-slate-900 text-sm block">2. Lucro Presumido (Cumulativo)</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Regime cumulativo instituído pela Lei nº 9.718/1998. Não gera direito a créditos de PIS/COFINS sobre insumos da cadeia anterior.
              </p>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1">
                <p><strong>PIS:</strong> 0,65%</p>
                <p><strong>COFINS:</strong> 3,00%</p>
                <p><strong>Total PIS/COFINS:</strong> 3,65%</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="font-bold text-slate-900 text-sm block">3. Lucro Real (Não-Cumulativo)</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Regime não-cumulativo regido pelas Leis nº 10.637/2002 e 10.833/2003. Gera créditos sobre insumos, fretes e energia elétrica.
              </p>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1">
                <p><strong>PIS:</strong> 1,65%</p>
                <p><strong>COFINS:</strong> 7,60%</p>
                <p className="text-emerald-700 font-semibold">★ Aplica Tese do Século (STF Tema 69) com exclusão do ICMS destacado da base de cálculo.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <span className="font-bold text-slate-900 text-sm block">IPI — Tabela TIPI Exemplificativa</span>
            <p className="text-slate-600 text-[11px]">
              Alíquotas médias para os principais capítulos da Tabela de Incidência do IPI (Decreto nº 11.158/2022):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Capítulo 84/85 (Máquinas/Eletrônicos)</span>
                <strong className="text-slate-900">0% a 15%</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Capítulo 87 (Autopeças e Veículos)</span>
                <strong className="text-slate-900">5% a 25%</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Capítulo 39 (Plásticos e Tubos)</span>
                <strong className="text-slate-900">3,25% a 9,75%</strong>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Capítulo 22 (Bebidas Alcoólicas)</span>
                <strong className="text-slate-900">10% a 30%</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
