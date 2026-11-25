import React, { useState } from 'react';
import { CRONOGRAMA_REFORMA_TRIBUTARIA, REGIMES_DIFERENCIADOS_REFORMA } from '../../data/reformaTributaria';
import {
  Calendar,
  BookOpen,
  Scale,
  Calculator,
} from 'lucide-react';

interface ReformaTributariaViewProps {
  onOpenCalculadoraRTC?: () => void;
}

export const ReformaTributariaView: React.FC<ReformaTributariaViewProps> = ({
  onOpenCalculadoraRTC,
}) => {
  const [activeTab, setActiveTab] = useState<'simulador' | 'cronograma' | 'regimes'>('simulador');
  const [selectedAno, setSelectedAno] = useState<number>(2026);
  const [valorOperacao, setValorOperacao] = useState<number>(10000);
  const [categoriaOperacao, setCategoriaOperacao] = useState<'padrao' | 'cesta_basica' | 'saude_educacao'>('padrao');

  const selectedCronograma =
    CRONOGRAMA_REFORMA_TRIBUTARIA.find((c) => c.ano === selectedAno) ||
    CRONOGRAMA_REFORMA_TRIBUTARIA[0];

  // Simulator calculations
  let fatorReducao = 1.0;
  if (categoriaOperacao === 'cesta_basica') fatorReducao = 0.0;
  if (categoriaOperacao === 'saude_educacao') fatorReducao = 0.40;

  const aliqCBSPlena = 8.8 * fatorReducao;
  const aliqIBSPlena = 17.7 * fatorReducao;
  const aliqTotalReforma = aliqCBSPlena + aliqIBSPlena;

  const valorCBS = Number(((valorOperacao * aliqCBSPlena) / 100).toFixed(2));
  const valorIBS = Number(((valorOperacao * aliqIBSPlena) / 100).toFixed(2));
  const totalImpostosReforma = Number((valorCBS + valorIBS).toFixed(2));

  const aliqAtualBaseline = categoriaOperacao === 'cesta_basica' ? 7.0 : 27.25;
  const totalImpostosAtual = Number(((valorOperacao * aliqAtualBaseline) / 100).toFixed(2));
  const diferencaReforma = Number((totalImpostosReforma - totalImpostosAtual).toFixed(2));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E7EC] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="font-display text-base font-semibold text-[#111827] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#9E141A]" />
            <span>Reforma Tributária — IBS e CBS</span>
          </h2>
          <p className="text-xs text-[#6B7280]">
            Regras de transição (2026–2033), simulador comparativo de carga tributária e regimes favorecidos da EC 132/2023
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#ECEEF2] p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('simulador')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'simulador'
                ? 'bg-white text-[#111827] font-semibold shadow-2xs'
                : 'text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Simulador Comparativo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cronograma')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cronograma'
                ? 'bg-white text-[#111827] font-semibold shadow-2xs'
                : 'text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Cronograma de Transição
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('regimes')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'regimes'
                ? 'bg-white text-[#111827] font-semibold shadow-2xs'
                : 'text-[#4B5563] hover:text-[#111827]'
            }`}
          >
            Regimes Diferenciados
          </button>
          {onOpenCalculadoraRTC && (
            <button
              type="button"
              onClick={onOpenCalculadoraRTC}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#9E141A] hover:bg-[#851015] text-white font-semibold transition-colors cursor-pointer whitespace-nowrap ml-1"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculadora RTC (RFB)</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: SIMULADOR COMPARATIVO IBS/CBS */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Simulator Inputs & Comparison */}
          <div className="lg:col-span-7 bg-white border border-[#E4E7EC] rounded-xl p-5 space-y-5">
            <h3 className="font-display font-semibold text-[#111827] text-sm">
              Simulação de Impacto Financeiro
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-medium text-[#374151] block mb-1.5">
                  Valor da Operação / Faturamento (R$)
                </label>
                <input
                  type="number"
                  min={1}
                  value={valorOperacao}
                  onChange={(e) => setValorOperacao(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg font-mono tabular-nums font-semibold text-[#111827] focus:border-[#9E141A] outline-hidden"
                />
              </div>

              <div>
                <label className="font-medium text-[#374151] block mb-1.5">
                  Enquadramento do Produto / Serviço
                </label>
                <select
                  value={categoriaOperacao}
                  onChange={(e) => setCategoriaOperacao(e.target.value as 'padrao' | 'cesta_basica' | 'saude_educacao')}
                  className="w-full p-2.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[#111827] font-medium focus:border-[#9E141A] outline-hidden"
                >
                  <option value="padrao">Alíquota Padrão (Geral - Bens e Serviços)</option>
                  <option value="cesta_basica">Cesta Básica Nacional (Alíquota Zero - 100% Redução)</option>
                  <option value="saude_educacao">Saúde / Educação (Redução de 60%)</option>
                </select>
              </div>
            </div>

            {/* Side-by-side Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E4E7EC] space-y-2.5">
                <span className="text-[11px] font-medium text-[#6B7280] block">
                  Sistema Tributário Atual
                </span>
                <strong className="font-display text-[#111827] font-semibold text-sm block">
                  ICMS + PIS + COFINS (+ IPI/ISS)
                </strong>
                <div className="space-y-1.5 text-[#4B5563] pt-2 border-t border-[#E4E7EC]">
                  <div className="flex justify-between">
                    <span>Alíquota estimada</span>
                    <strong className="font-mono tabular-nums text-[#111827]">{aliqAtualBaseline.toFixed(2)}%</strong>
                  </div>
                  <div className="flex justify-between text-[#111827] font-semibold pt-1">
                    <span>Total a recolher</span>
                    <span className="font-mono tabular-nums">R$ {totalImpostosAtual.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#6B7280] pt-1">
                  Cumulatividade parcial e guerra fiscal entre os estados.
                </p>
              </div>

              <div className="p-4 bg-[#FDF3F3]/60 rounded-xl border border-[#F3C6C8] space-y-2.5">
                <span className="text-[11px] font-semibold text-[#9E141A] block">
                  Novo Modelo (IVA Dual Pleno)
                </span>
                <strong className="font-display text-[#111827] font-semibold text-sm block">
                  CBS (8,8%) + IBS (17,7%)
                </strong>
                <div className="space-y-1.5 text-[#374151] pt-2 border-t border-[#F3C6C8]">
                  <div className="flex justify-between">
                    <span>Alíquota efetiva</span>
                    <strong className="font-mono tabular-nums text-[#111827]">{aliqTotalReforma.toFixed(2)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>CBS (Federal)</span>
                    <span className="font-mono tabular-nums">R$ {valorCBS.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IBS (Estados/Municípios)</span>
                    <span className="font-mono tabular-nums">R$ {valorIBS.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#9E141A] font-semibold pt-1.5 border-t border-[#F3C6C8]">
                    <span>Total a recolher</span>
                    <span className="font-mono tabular-nums">R$ {totalImpostosReforma.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Banner */}
            <div className="p-3.5 bg-[#F4F5F7] rounded-xl border border-[#E4E7EC] flex items-center justify-between text-xs">
              <span className="text-[#374151] font-medium">Variação na carga tributária nominal</span>
              <strong
                className={`font-mono tabular-nums font-semibold ${
                  diferencaReforma <= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {diferencaReforma <= 0
                  ? `Redução de R$ ${Math.abs(diferencaReforma).toFixed(2)}`
                  : `Diferença de R$ ${diferencaReforma.toFixed(2)}`}
              </strong>
            </div>
          </div>

          {/* Right Column: Official Sources Panel */}
          <div className="lg:col-span-5 bg-white border border-[#E4E7EC] rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-[#131417] text-white flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#EF888D] shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-sm">Base Normativa Oficial</h3>
                <p className="text-[11px] text-[#9CA3AF]">Fontes primárias da Reforma Tributária</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#374151]">
              <div className="space-y-1.5">
                <span className="font-semibold text-[#111827] block">
                  Legislação Constitucional e Complementar
                </span>
                <p className="text-[#111827] font-medium leading-relaxed">
                  Emenda Constitucional nº 132, de 20 de dezembro de 2023 (DOU 21/12/2023)
                </p>
                <p className="text-[#4B5563] leading-relaxed">
                  Regulamentação geral: <strong>PLP 68/2024 / LC 214/2025</strong> — institui o Imposto sobre Bens e Serviços (IBS), a Contribuição sobre Bens e Serviços (CBS) e o Imposto Seletivo (IS).
                </p>
              </div>

              <div className="pt-3 border-t border-[#ECEEF2] space-y-1.5">
                <span className="font-semibold text-[#111827] block">
                  Princípios do Novo Modelo
                </span>
                <ul className="list-disc pl-4 space-y-1.5 text-[#4B5563] leading-relaxed">
                  <li><strong>Tributação no Destino:</strong> Arrecadação pertencente ao estado e município de consumo.</li>
                  <li><strong>Não-Cumulatividade Plena:</strong> Crédito financeiro amplo sobre insumos, ativo imobilizado, fretes e serviços.</li>
                  <li><strong>Fim da Guerra Fiscal:</strong> Extinção gradual dos benefícios unilaterais de ICMS até 2032.</li>
                  <li><strong>Cashback:</strong> Devolução parcial de IBS/CBS para famílias de baixa renda no CadÚnico.</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-[#ECEEF2] text-[11px] text-[#6B7280] font-mono tabular-nums">
                Parâmetros referenciais · Nota Técnica MF/SPE 01/2024
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CRONOGRAMA DE TRANSIÇÃO (2026 A 2033) */}
      {activeTab === 'cronograma' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Timeline */}
          <div className="lg:col-span-7 bg-white border border-[#E4E7EC] rounded-xl p-5 space-y-3">
            <h3 className="font-display font-semibold text-[#111827] text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#9E141A]" />
              <span>Linha do Tempo da Transição Tributária</span>
            </h3>

            <div className="divide-y divide-[#ECEEF2] border border-[#E4E7EC] rounded-xl overflow-hidden">
              {CRONOGRAMA_REFORMA_TRIBUTARIA.map((item) => {
                const isSelected = selectedAno === item.ano;
                return (
                  <button
                    key={item.ano}
                    type="button"
                    onClick={() => setSelectedAno(item.ano)}
                    className={`w-full p-4 text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#FDF3F3]'
                        : 'bg-white hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-mono tabular-nums font-semibold text-xs px-2 py-0.5 rounded ${
                            isSelected
                              ? 'bg-[#9E141A] text-white'
                              : 'bg-[#ECEEF2] text-[#111827]'
                          }`}
                        >
                          {item.ano}
                        </span>
                        <span className="font-display font-semibold text-[#111827] text-xs">
                          {item.fase}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#6B7280]">
                        CBS {item.aliquotaCBS}% · IBS {item.aliquotaIBS}%
                      </span>
                    </div>

                    <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                      {item.descricaoTransicao}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Year Inspector */}
          <div className="lg:col-span-5 bg-white border border-[#E4E7EC] rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 bg-[#131417] text-white">
              <span className="text-[#EF888D] font-medium text-[11px] block">
                Detalhamento do exercício
              </span>
              <h3 className="font-display font-semibold text-base mt-0.5">
                Ano {selectedCronograma.ano}
              </h3>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#374151]">
              <div className="space-y-1">
                <span className="font-semibold text-[#111827] block">Resumo da fase</span>
                <p className="text-[#4B5563] leading-relaxed">
                  {selectedCronograma.descricaoTransicao}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg">
                  <span className="text-[11px] text-[#6B7280] block">Alíquota CBS</span>
                  <strong className="font-mono tabular-nums text-[#111827] font-semibold text-base mt-0.5 block">
                    {selectedCronograma.aliquotaCBS}%
                  </strong>
                </div>
                <div className="p-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg">
                  <span className="text-[11px] text-[#6B7280] block">Alíquota IBS</span>
                  <strong className="font-mono tabular-nums text-[#111827] font-semibold text-base mt-0.5 block">
                    {selectedCronograma.aliquotaIBS}%
                  </strong>
                </div>
              </div>

              <div className="p-3.5 bg-[#F4F5F7] border border-[#E4E7EC] rounded-xl space-y-1">
                <span className="font-semibold text-[#111827] flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-[#9E141A]" />
                  <span>Base normativa</span>
                </span>
                <p className="text-[#111827] font-medium">{selectedCronograma.fonteOficial}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGIMES DIFERENCIADOS DA REFORMA */}
      {activeTab === 'regimes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REGIMES_DIFERENCIADOS_REFORMA.map((regime, i) => (
            <div key={i} className="bg-white border border-[#E4E7EC] rounded-xl p-5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-display font-semibold text-[#111827] text-sm">{regime.categoria}</h4>
                <span className="font-mono tabular-nums text-[#9E141A] font-semibold text-xs whitespace-nowrap">
                  {regime.reducao}
                </span>
              </div>

              <p className="text-[#4B5563] leading-relaxed">
                <strong className="text-[#111827]">Produtos / Serviços:</strong> {regime.itens}
              </p>

              <div className="pt-2.5 border-t border-[#ECEEF2] text-[11px] text-[#6B7280]">
                <strong>Fonte oficial:</strong> {regime.fonteOficial}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
