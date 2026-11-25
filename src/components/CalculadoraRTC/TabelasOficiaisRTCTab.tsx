import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  RTC_ALIQUOTAS_REFERENCIA_ANO,
  RTC_CLASSIFICACOES_TRIBUTARIAS,
  RTC_CST_CBS_IBS,
  RTC_FUNDAMENTACOES_LEGAIS,
  RTC_NBS_SERVICOS,
  RTC_NCM_CATALOGO_COMPLETO,
} from '../../data/rtcTabelasOficiais';

type TabelaKey = 'ncm' | 'cclasstrib' | 'cst' | 'nbs' | 'aliquotas' | 'fundamentacoes';
type NcmTratamentoFiltro = 'todos' | 'zero' | 'red60' | 'is' | 'mono' | 'geral';

function fmtNcmCode(ncm: string): string {
  const d = ncm.replace(/\D/g, '');
  if (d.length === 8) return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
  return ncm;
}

export const TabelasOficiaisRTCTab: React.FC = () => {
  const [tabelaAtiva, setTabelaAtiva] = useState<TabelaKey>('ncm');
  const [busca, setBusca] = useState<string>('');
  const [filtroCst, setFiltroCst] = useState<string>('');
  const [filtroNcmTipo, setFiltroNcmTipo] = useState<NcmTratamentoFiltro>('todos');

  const q = busca.trim().toLowerCase();

  const dadosCClassTrib = useMemo(
    () =>
      RTC_CLASSIFICACOES_TRIBUTARIAS.filter((item) => {
        const okCst = !filtroCst || item.cst === filtroCst;
        const okQ =
          !q ||
          item.cClassTrib.includes(q) ||
          item.cst.includes(q) ||
          item.nome.toLowerCase().includes(q) ||
          item.descricao.toLowerCase().includes(q) ||
          item.baseLegal.toLowerCase().includes(q);
        return okCst && okQ;
      }),
    [q, filtroCst]
  );

  const dadosCst = useMemo(
    () =>
      RTC_CST_CBS_IBS.filter(
        (i) => !q || i.cst.includes(q) || i.descricao.toLowerCase().includes(q) || i.baseLegal.toLowerCase().includes(q)
      ),
    [q]
  );

  const dadosNcm = useMemo(
    () =>
      RTC_NCM_CATALOGO_COMPLETO.filter((i) => {
        if (filtroNcmTipo === 'zero' && i.pRedIBS !== 100) return false;
        if (filtroNcmTipo === 'red60' && i.pRedIBS !== 60) return false;
        if (filtroNcmTipo === 'is' && !i.sujeitoIS) return false;
        if (filtroNcmTipo === 'mono' && i.cst !== '620') return false;
        if (filtroNcmTipo === 'geral' && (i.pRedIBS > 0 || i.sujeitoIS || i.cst !== '000')) return false;

        if (!q) return true;
        const digits = q.replace(/\D/g, '');
        return (
          (digits.length > 0 && i.ncm.includes(digits)) ||
          i.descricao.toLowerCase().includes(q) ||
          i.categoria.toLowerCase().includes(q) ||
          i.baseLegal.toLowerCase().includes(q)
        );
      }),
    [q, filtroNcmTipo]
  );

  const dadosNbs = useMemo(
    () =>
      RTC_NBS_SERVICOS.filter(
        (i) => !q || i.nbs.includes(q) || i.descricao.toLowerCase().includes(q) || i.categoria.toLowerCase().includes(q)
      ),
    [q]
  );

  const dadosFundamentacoes = useMemo(
    () =>
      RTC_FUNDAMENTACOES_LEGAIS.filter(
        (i) =>
          !q ||
          i.codigo.toLowerCase().includes(q) ||
          i.norma.toLowerCase().includes(q) ||
          i.tema.toLowerCase().includes(q) ||
          i.resumo.toLowerCase().includes(q)
      ),
    [q]
  );

  const descricaoTabela: Record<TabelaKey, string> = {
    ncm: `Enquadramento de ${RTC_NCM_CATALOGO_COMPLETO.length} NCMs na Reforma Tributária (Cesta Básica, reduções, monofásicos e Imposto Seletivo).`,
    cclasstrib: 'Códigos de 6 dígitos (cClassTrib) que definem o benefício ou regra de tributação na NT 2025.002.',
    cst: 'Códigos de Situação Tributária (3 dígitos) para CBS e IBS.',
    nbs: 'Serviços da Nomenclatura Brasileira de Serviços com reduções previstas na LC 214/2025.',
    aliquotas: 'Evolução oficial das alíquotas de CBS, IBS e redução gradual de ICMS/ISS de 2026 a 2033.',
    fundamentacoes: 'Artigos da Lei Complementar nº 214/2025, Portaria COTEC nº 342/2026 e NT 2025.002.',
  };

  const totalExibido =
    tabelaAtiva === 'ncm'
      ? dadosNcm.length
      : tabelaAtiva === 'cclasstrib'
        ? dadosCClassTrib.length
        : tabelaAtiva === 'cst'
          ? dadosCst.length
          : tabelaAtiva === 'nbs'
            ? dadosNbs.length
            : tabelaAtiva === 'aliquotas'
              ? RTC_ALIQUOTAS_REFERENCIA_ANO.length
              : dadosFundamentacoes.length;

  return (
    <div className="space-y-4">
      {/* Controles de Consulta */}
      <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-sm text-[#111827]">
              Tabelas Oficiais da Reforma Tributária
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">{descricaoTabela[tabelaAtiva]}</p>
          </div>

          <div className="flex flex-wrap bg-[#ECEEF2] p-1 rounded-lg text-xs font-medium">
            {(
              [
                ['ncm', `NCM (${RTC_NCM_CATALOGO_COMPLETO.length})`],
                ['cclasstrib', 'cClassTrib'],
                ['cst', 'CST CBS/IBS'],
                ['nbs', 'NBS Serviços'],
                ['aliquotas', 'Alíquotas 2026–2033'],
                ['fundamentacoes', 'Base Legal'],
              ] as [TabelaKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTabelaAtiva(key)}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  tabelaAtiva === key
                    ? 'bg-white text-[#111827] font-semibold shadow-2xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tabelaAtiva !== 'aliquotas' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por código, produto, benefício ou artigo da LC 214/2025..."
                  className="w-full pl-8 pr-3 py-2 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg text-xs text-[#111827] outline-hidden focus:border-[#9E141A] focus:bg-white"
                />
              </div>

              {tabelaAtiva === 'cclasstrib' && (
                <select
                  value={filtroCst}
                  onChange={(e) => setFiltroCst(e.target.value)}
                  className="py-2 px-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg font-mono text-xs text-[#111827] outline-hidden focus:border-[#9E141A]"
                >
                  <option value="">Todos os CSTs</option>
                  {RTC_CST_CBS_IBS.map((c) => (
                    <option key={c.cst} value={c.cst}>
                      CST {c.cst}
                    </option>
                  ))}
                </select>
              )}

              <span className="text-[11px] font-mono tabular-nums text-[#6B7280] whitespace-nowrap">
                {totalExibido} registro(s)
              </span>
            </div>

            {tabelaAtiva === 'ncm' && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(
                  [
                    ['todos', 'Todos os NCMs'],
                    ['zero', 'Alíquota Zero (100%)'],
                    ['red60', 'Redução 60%'],
                    ['is', 'Imposto Seletivo (IS)'],
                    ['mono', 'Combustíveis (Monofásico)'],
                    ['geral', 'Regra Geral (Integral)'],
                  ] as [NcmTratamentoFiltro, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFiltroNcmTipo(key)}
                    className={`px-3 py-1 rounded-md border text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      filtroNcmTipo === key
                        ? 'bg-[#FDF3F3] border-[#9E141A] text-[#9E141A] font-semibold'
                        : 'bg-[#F9FAFB] border-[#E4E7EC] text-[#4B5563] hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabela Ativa */}
      <div className="bg-white border border-[#E4E7EC] rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[560px]">
          {tabelaAtiva === 'ncm' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#4B5563]">
                  <th className="py-3 px-4">NCM</th>
                  <th className="py-3 px-4">Descrição & Categoria</th>
                  <th className="py-3 px-3">CST / cClassTrib</th>
                  <th className="py-3 px-3 text-right">Red. IBS/CBS</th>
                  <th className="py-3 px-3 text-right">Imposto Seletivo (IS)</th>
                  <th className="py-3 px-4">Base Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF2]">
                {dadosNcm.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#6B7280]">
                      Nenhum NCM encontrado com os filtros informados.
                    </td>
                  </tr>
                ) : (
                  dadosNcm.map((item) => (
                    <tr key={item.ncm} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#111827] whitespace-nowrap">
                        {fmtNcmCode(item.ncm)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#111827]">{item.descricao}</div>
                        <div className="text-[11px] text-[#6B7280] mt-0.5">{item.categoria}</div>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#374151] whitespace-nowrap">
                        {item.cst} · {item.cClassTrib}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#111827]">
                        {item.pRedIBS > 0 ? (
                          <span className="text-emerald-700">−{item.pRedIBS}%</span>
                        ) : (
                          <span>0%</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {item.sujeitoIS ? (
                          <span className="text-[#9E141A] font-semibold">{item.pISReferencia.toFixed(2)}%</span>
                        ) : (
                          <span className="text-[#9CA3AF]">Não incide</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#4B5563]">{item.baseLegal}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tabelaAtiva === 'cclasstrib' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#4B5563]">
                  <th className="py-3 px-4">cClassTrib</th>
                  <th className="py-3 px-3">CST</th>
                  <th className="py-3 px-4">Classificação e Aplicação</th>
                  <th className="py-3 px-3 text-right">Red. IBS</th>
                  <th className="py-3 px-3 text-right">Red. CBS</th>
                  <th className="py-3 px-4">Documentos</th>
                  <th className="py-3 px-4">Fundamento Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF2]">
                {dadosCClassTrib.map((item) => (
                  <tr key={item.cClassTrib} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#9E141A]">
                      {item.cClassTrib}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums font-semibold text-[#111827]">
                      {item.cst}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#111827]">{item.nome}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">{item.descricao}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#111827]">
                      {item.pRedIBS}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#111827]">
                      {item.pRedCBS}%
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#4B5563] whitespace-nowrap">
                      {[item.aplicavelNFe ? 'NF-e' : null, item.aplicavelNFSe ? 'NFS-e' : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#4B5563]">{item.baseLegal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tabelaAtiva === 'cst' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#4B5563]">
                  <th className="py-3 px-4">CST</th>
                  <th className="py-3 px-4">Descrição Oficial</th>
                  <th className="py-3 px-4">Indicadores de Regra</th>
                  <th className="py-3 px-4">Base Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF2]">
                {dadosCst.map((item) => {
                  const flags = [
                    item.indTrib ? 'Tributável' : 'Sem incidência/Desonerado',
                    item.indRedAliq ? 'Redução alíquota' : null,
                    item.indDif ? 'Diferimento' : null,
                    item.indIsencao ? 'Isenção' : null,
                    item.indImunidade ? 'Imunidade/Não incid.' : null,
                    item.indSuspensao ? 'Suspensão' : null,
                    item.indMono ? 'Monofásico' : null,
                    item.indTransfCred ? 'Gera crédito' : null,
                  ].filter(Boolean);

                  return (
                    <tr key={item.cst} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#9E141A]">
                        {item.cst}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#111827]">{item.descricao}</td>
                      <td className="py-3 px-4 text-[11px] text-[#4B5563] font-mono">
                        {flags.join(' · ')}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#4B5563]">{item.baseLegal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {tabelaAtiva === 'nbs' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#4B5563]">
                  <th className="py-3 px-4">NBS</th>
                  <th className="py-3 px-4">Descrição do Serviço</th>
                  <th className="py-3 px-3">CST / cClassTrib</th>
                  <th className="py-3 px-3 text-right">Red. IBS/CBS</th>
                  <th className="py-3 px-4">Base Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF2]">
                {dadosNbs.map((item) => (
                  <tr key={item.nbs} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#111827] whitespace-nowrap">
                      {item.nbs}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#111827]">{item.descricao}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">{item.categoria}</div>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[#374151] whitespace-nowrap">
                      {item.cst} · {item.cClassTrib}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#111827]">
                      {item.pRedIBS}%
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#4B5563]">{item.baseLegal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tabelaAtiva === 'aliquotas' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#4B5563]">
                  <th className="py-3 px-4">Ano</th>
                  <th className="py-3 px-4">Fase da Transição</th>
                  <th className="py-3 px-3 text-right">CBS União</th>
                  <th className="py-3 px-3 text-right">IBS UF</th>
                  <th className="py-3 px-3 text-right">IBS Mun</th>
                  <th className="py-3 px-3 text-right">Total IVA</th>
                  <th className="py-3 px-3 text-right">Red. ICMS/ISS</th>
                  <th className="py-3 px-4">IS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF2]">
                {RTC_ALIQUOTAS_REFERENCIA_ANO.map((a) => (
                  <tr key={a.ano} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#9E141A]">
                      {a.ano}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#111827]">{a.fase}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">{a.baseLegal}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">{a.pCBSUniao.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">{a.pIBSUF.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">{a.pIBSMun.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#111827]">
                      {(a.pCBSUniao + a.pIBSTotal).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#4B5563]">
                      −{a.fatorReducaoIcmsIss}%
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#4B5563] whitespace-nowrap">
                      {a.pISVigente ? 'Vigente' : 'Não vig.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tabelaAtiva === 'fundamentacoes' && (
            <div className="divide-y divide-[#ECEEF2]">
              {dadosFundamentacoes.map((item) => (
                <div key={item.codigo} className="p-5 space-y-1 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display font-semibold text-[#111827] text-sm">{item.tema}</span>
                    <span className="font-mono text-[11px] text-[#9E141A] font-semibold">
                      {item.codigo} · {item.artigo}
                    </span>
                  </div>
                  <div className="text-[#374151] font-medium">{item.norma}</div>
                  <p className="text-[#4B5563] leading-relaxed">{item.resumo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
