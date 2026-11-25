import React, { useMemo, useState } from 'react';
import {
  RTC_ALIQUOTAS_REFERENCIA_ANO,
  RTC_CLASSIFICACOES_TRIBUTARIAS,
  RTC_SIMPLES_ANEXOS,
} from '../../data/rtcTabelasOficiais';
import { calcularSimplesNacionalRTC } from '../../services/rtcCalculadoraService';
import { CheckCircle2 } from 'lucide-react';

interface PerfilSimplesPreset {
  id: string;
  titulo: string;
  anexo: 'I' | 'II' | 'III' | 'IV' | 'V';
  rbt12: number;
  receitaMensal: number;
  valorInsumosComCredito: number;
  percentualVendasB2B: number;
  cClassTrib: string;
}

const PERFIS_PRONTOS: PerfilSimplesPreset[] = [
  {
    id: 'varejo_b2c',
    titulo: 'Comércio Varejista (B2C)',
    anexo: 'I',
    rbt12: 480000,
    receitaMensal: 40000,
    valorInsumosComCredito: 18000,
    percentualVendasB2B: 10,
    cClassTrib: '000001',
  },
  {
    id: 'atacado_b2b',
    titulo: 'Atacadista / Distribuidor (B2B)',
    anexo: 'I',
    rbt12: 1500000,
    receitaMensal: 125000,
    valorInsumosComCredito: 75000,
    percentualVendasB2B: 90,
    cClassTrib: '000001',
  },
  {
    id: 'industria_b2b',
    titulo: 'Indústria (B2B)',
    anexo: 'II',
    rbt12: 2200000,
    receitaMensal: 180000,
    valorInsumosComCredito: 110000,
    percentualVendasB2B: 85,
    cClassTrib: '000001',
  },
  {
    id: 'servicos_b2b',
    titulo: 'Serviços / Consultoria (B2B)',
    anexo: 'III',
    rbt12: 900000,
    receitaMensal: 75000,
    valorInsumosComCredito: 10000,
    percentualVendasB2B: 95,
    cClassTrib: '200052',
  },
];

function fmtBRL(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const SimplesNacionalTab: React.FC = () => {
  const [presetAtivo, setPresetAtivo] = useState<string>('atacado_b2b');
  const [anexo, setAnexo] = useState<'I' | 'II' | 'III' | 'IV' | 'V'>('I');
  const [rbt12, setRbt12] = useState<number>(1500000);
  const [receitaMensal, setReceitaMensal] = useState<number>(125000);
  const [anoVigencia, setAnoVigencia] = useState<number>(2033);
  const [cClassTrib, setCClassTrib] = useState<string>('000001');
  const [valorInsumosComCredito, setValorInsumosComCredito] = useState<number>(75000);
  const [percentualVendasB2B, setPercentualVendasB2B] = useState<number>(90);

  const handleAplicarPerfil = (p: PerfilSimplesPreset) => {
    setPresetAtivo(p.id);
    setAnexo(p.anexo);
    setRbt12(p.rbt12);
    setReceitaMensal(p.receitaMensal);
    setValorInsumosComCredito(p.valorInsumosComCredito);
    setPercentualVendasB2B(p.percentualVendasB2B);
    setCClassTrib(p.cClassTrib);
  };

  const resultado = useMemo(
    () =>
      calcularSimplesNacionalRTC({
        anexo,
        rbt12,
        receitaMensal,
        anoVigencia,
        cClassTrib,
        valorInsumosComCredito,
        percentualVendasB2B,
      }),
    [anexo, rbt12, receitaMensal, anoVigencia, cClassTrib, valorInsumosComCredito, percentualVendasB2B]
  );

  const anexoSelecionado = RTC_SIMPLES_ANEXOS.find((a) => a.codigo === anexo) || RTC_SIMPLES_ANEXOS[0];

  const recomendaPorFora =
    resultado.comparativo.diferencaDesembolsoEmpresa <= 0 ||
    (percentualVendasB2B >= 60 &&
      resultado.comparativo.ganhoCreditoClienteB2B > resultado.comparativo.diferencaDesembolsoEmpresa);

  return (
    <div className="space-y-4">
      {/* Faixa compacta de perfis de exemplo */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[#6B7280] mr-1">Perfis rápidos:</span>
          {PERFIS_PRONTOS.map((p) => {
            const active = presetAtivo === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAplicarPerfil(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#FDF3F3] border-[#9E141A] text-[#9E141A] font-semibold'
                    : 'bg-white border-[#E4E7EC] text-[#374151] hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
                }`}
              >
                {p.titulo}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-[#6B7280]">
          Simples Híbrido · LC 214/2025 Art. 41 § 3º
        </span>
      </div>

      {/* Layout Split-Screen: Parâmetros à esquerda, Comparativo ao vivo à direita */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* COLUNA ESQUERDA — PARÂMETROS DA EMPRESA */}
        <div className="xl:col-span-5 bg-white border border-[#E4E7EC] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#ECEEF2]">
            <h3 className="font-display font-semibold text-sm text-[#111827]">
              Dados da empresa
            </h3>
            <span className="text-xs tabular-nums text-[#6B7280]">
              Faixa {resultado.faixaEnquadrada} · DAS {resultado.aliquotaEfetivaDAS.toFixed(2)}%
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#374151] mb-1.5">
                Atividade / Anexo (LC 123/2006)
              </label>
              <select
                value={anexo}
                onChange={(e) => {
                  setPresetAtivo('');
                  setAnexo(e.target.value as 'I' | 'II' | 'III' | 'IV' | 'V');
                }}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[#111827] font-medium outline-hidden focus:border-[#9E141A] focus:bg-white"
              >
                {RTC_SIMPLES_ANEXOS.map((a) => (
                  <option key={a.codigo} value={a.codigo}>
                    {a.nome}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#6B7280] mt-1">{anexoSelecionado.descricao}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium text-[#374151] mb-1.5">
                  Receita últimos 12 meses (R$)
                </label>
                <input
                  type="number"
                  min={1}
                  max={4800000}
                  step={10000}
                  value={rbt12}
                  onChange={(e) => {
                    setPresetAtivo('');
                    setRbt12(parseFloat(e.target.value) || 0);
                  }}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg tabular-nums font-semibold text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1.5">
                  Receita mensal (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={receitaMensal}
                  onChange={(e) => {
                    setPresetAtivo('');
                    setReceitaMensal(parseFloat(e.target.value) || 0);
                  }}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg tabular-nums font-semibold text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-medium text-[#374151] mb-1.5">
                  Compras com crédito (R$/mês)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={valorInsumosComCredito}
                  onChange={(e) => {
                    setPresetAtivo('');
                    setValorInsumosComCredito(parseFloat(e.target.value) || 0);
                  }}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg tabular-nums font-semibold text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1.5">
                  Ano de referência
                </label>
                <select
                  value={anoVigencia}
                  onChange={(e) => setAnoVigencia(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg tabular-nums font-medium text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                >
                  {RTC_ALIQUOTAS_REFERENCIA_ANO.filter((a) => a.ano >= 2027).map((a) => (
                    <option key={a.ano} value={a.ano}>
                      {a.ano} (CBS {a.pCBSUniao}% + IBS {a.pIBSTotal}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-[#374151]">
                  Participação de vendas para empresas (B2B)
                </label>
                <span className="font-display font-semibold tabular-nums text-[#9E141A]">
                  {percentualVendasB2B}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={percentualVendasB2B}
                onChange={(e) => {
                  setPresetAtivo('');
                  setPercentualVendasB2B(Number(e.target.value));
                }}
                className="w-full accent-[#9E141A] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#6B7280] mt-0.5">
                <span>0% (Consumidor final)</span>
                <span>100% (Empresas B2B)</span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#374151] mb-1.5">
                Tratamento tributário (cClassTrib)
              </label>
              <select
                value={cClassTrib}
                onChange={(e) => {
                  setPresetAtivo('');
                  setCClassTrib(e.target.value);
                }}
                className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
              >
                {RTC_CLASSIFICACOES_TRIBUTARIAS.filter((c) => ['000', '200'].includes(c.cst)).map((c) => (
                  <option key={c.cClassTrib} value={c.cClassTrib}>
                    {c.pRedIBS > 0 ? `Redução ${c.pRedIBS}%` : 'Alíquota integral'} — {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA — RESULTADO E TABELA COMPARATIVA UNIFICADA */}
        <div className="xl:col-span-7 xl:sticky xl:top-20 space-y-4">
          {/* Veredito Executivo */}
          <div
            className={`rounded-xl p-5 border space-y-4 ${
              recomendaPorFora
                ? 'bg-[#131417] text-white border-[#252832]'
                : 'bg-white text-[#111827] border-[#E4E7EC]'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-display font-semibold">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${recomendaPorFora ? 'text-emerald-400' : 'text-emerald-600'}`}
                />
                <span className={recomendaPorFora ? 'text-emerald-400' : 'text-emerald-700'}>
                  {recomendaPorFora
                    ? 'Recomendação: Apurar IBS e CBS "Por Fora" (Simples Híbrido)'
                    : 'Recomendação: Manter IBS e CBS dentro do DAS'}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${recomendaPorFora ? 'text-[#D1D5DB]' : 'text-[#4B5563]'}`}>
                {resultado.comparativo.recomendacaoTecnica}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <div
                className={`px-3.5 py-2.5 rounded-lg border ${
                  recomendaPorFora ? 'bg-[#1C1F27] border-[#2C303B]' : 'bg-[#F9FAFB] border-[#ECEEF2]'
                }`}
              >
                <div className={`text-[11px] ${recomendaPorFora ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                  Diferença de caixa mensal (Por Fora vs DAS)
                </div>
                <div
                  className={`font-display tabular-nums tracking-tight text-lg font-bold mt-0.5 ${
                    resultado.comparativo.diferencaDesembolsoEmpresa <= 0
                      ? recomendaPorFora
                        ? 'text-emerald-400'
                        : 'text-emerald-700'
                      : recomendaPorFora
                        ? 'text-amber-300'
                        : 'text-[#9E141A]'
                  }`}
                >
                  {resultado.comparativo.diferencaDesembolsoEmpresa <= 0
                    ? `−${fmtBRL(Math.abs(resultado.comparativo.diferencaDesembolsoEmpresa))}`
                    : `+${fmtBRL(resultado.comparativo.diferencaDesembolsoEmpresa)}`}
                </div>
              </div>

              <div
                className={`px-3.5 py-2.5 rounded-lg border ${
                  recomendaPorFora ? 'bg-[#1C1F27] border-[#2C303B]' : 'bg-[#F9FAFB] border-[#ECEEF2]'
                }`}
              >
                <div className={`text-[11px] ${recomendaPorFora ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                  Crédito extra gerado ao comprador B2B
                </div>
                <div
                  className={`font-display tabular-nums tracking-tight text-lg font-bold mt-0.5 ${
                    recomendaPorFora ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  +{fmtBRL(resultado.comparativo.ganhoCreditoClienteB2B)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabela Comparativa Única: Dentro do DAS × Por Fora */}
          <div className="bg-white border border-[#E4E7EC] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E4E7EC] flex items-center justify-between gap-2">
              <h4 className="font-display font-semibold text-sm text-[#111827]">
                Comparativo mensal detalhado ({anoVigencia})
              </h4>
              <span className="text-[11px] text-[#6B7280] tabular-nums">
                Receita: {fmtBRL(receitaMensal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[#4B5563]">
                    <th className="py-3 px-4 font-semibold">Composição</th>
                    <th className="py-3 px-4 text-right font-semibold">Dentro do DAS</th>
                    <th className="py-3 px-4 text-right font-semibold text-[#9E141A]">Por Fora (Híbrido)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F6] tabular-nums">
                  <tr>
                    <td className="py-2.5 px-4 text-[#4B5563]">IRPJ, CSLL, CPP e IPI (DAS)</td>
                    <td className="py-2.5 px-4 text-right text-[#111827]">
                      {fmtBRL(resultado.cenarioIntegradoDAS.parcelaIRPJ_CSLL_CPP_IPI)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#111827]">
                      {fmtBRL(resultado.cenarioPorFora.dasSemIbsCbs)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-[#4B5563]">CBS + IBS sobre as vendas</td>
                    <td className="py-2.5 px-4 text-right text-[#111827]">
                      {fmtBRL(
                        resultado.cenarioIntegradoDAS.parcelaCBSNoDAS +
                          resultado.cenarioIntegradoDAS.parcelaIBSNoDAS
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#111827]">
                      {fmtBRL(
                        resultado.cenarioPorFora.debitoCBSBruto + resultado.cenarioPorFora.debitoIBSBruto
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-emerald-700">(−) Créditos sobre compras/insumos</td>
                    <td className="py-2.5 px-4 text-right text-[#9CA3AF]">Não aproveita</td>
                    <td className="py-2.5 px-4 text-right font-medium text-emerald-700">
                      − {fmtBRL(resultado.cenarioPorFora.creditoSobreInsumos)}
                    </td>
                  </tr>

                  <tr className="bg-[#F9FAFB] font-semibold">
                    <td className="py-3 px-4 text-[#111827]">Total a pagar no mês</td>
                    <td className="py-3 px-4 text-right font-display text-sm text-[#111827]">
                      {fmtBRL(resultado.cenarioIntegradoDAS.valorTotalDAS)}
                      <span className="block text-[11px] font-sans font-normal text-[#6B7280]">
                        {resultado.aliquotaEfetivaDAS.toFixed(2)}% efetivo
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-display text-sm text-[#9E141A]">
                      {fmtBRL(resultado.cenarioPorFora.desembolsoTotalEmpresa)}
                      <span className="block text-[11px] font-sans font-normal text-[#6B7280]">
                        {resultado.cenarioPorFora.aliquotaEfetivaTotal.toFixed(2)}% efetivo
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-[#4B5563]">Crédito transferido ao cliente B2B</td>
                    <td className="py-2.5 px-4 text-right text-[#111827]">
                      {fmtBRL(resultado.cenarioIntegradoDAS.creditoTransferivelB2B)}{' '}
                      <span className="text-[#6B7280]">
                        ({resultado.cenarioIntegradoDAS.aliquotaCreditoB2B.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                      {fmtBRL(resultado.cenarioPorFora.creditoTransferivelB2B)}{' '}
                      <span className="font-normal">
                        ({resultado.cenarioPorFora.aliquotaCreditoB2B.toFixed(2)}%)
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-[#4B5563]">Custo líquido para o comprador B2B</td>
                    <td className="py-2.5 px-4 text-right font-medium text-[#111827]">
                      {fmtBRL(resultado.comparativo.custoLiquidoParaCompradorDAS)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                      {fmtBRL(resultado.comparativo.custoLiquidoParaCompradorPorFora)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
