import React, { useState } from 'react';
import { CBenef, CarimboFiscal } from '../../types/fiscal';
import {
  FileCheck,
  Copy,
  CheckCircle2,
  BookOpen,
  Filter,
  Search,
  Tag,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CBenefCarimbosViewProps {
  cbenefList: CBenef[];
  carimbosList: CarimboFiscal[];
}

export const CBenefCarimbosView: React.FC<CBenefCarimbosViewProps> = ({
  cbenefList,
  carimbosList,
}) => {
  const [activeTab, setActiveTab] = useState<'carimbos' | 'cbenef'>('carimbos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedUF, setSelectedUF] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedCarimbo, setSelectedCarimbo] = useState<CarimboFiscal>(carimbosList[0]);
  const [selectedCBenef, setSelectedCBenef] = useState<CBenef>(cbenefList[0]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct categories from carimbosList
  const categories = [
    'todos',
    'Simples Nacional',
    'Substituição Tributária',
    'Devoluções & Estornos',
    'Industrialização & Terceiros',
    'Remessas, Consertos & Brindes',
    'Venda à Ordem & Entrega Futura',
    'Comércio Exterior & ZFM',
    'Benefícios, Isenções & Imunidades',
    'PIS/COFINS & Reforma Tributária',
    'Ativo Imobilizado & Baixas',
  ];

  // Filtered lists
  const filteredCarimbos = carimbosList.filter((c) => {
    const matchesCategory =
      selectedCategory === 'todos' ||
      (c.categoria && c.categoria.toLowerCase() === selectedCategory.toLowerCase()) ||
      (!c.categoria && selectedCategory === 'todos');

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      c.titulo.toLowerCase().includes(term) ||
      c.tipoOperacao.toLowerCase().includes(term) ||
      c.textoObrigatorio.toLowerCase().includes(term) ||
      c.fonteOficial.toLowerCase().includes(term) ||
      (c.categoria && c.categoria.toLowerCase().includes(term)) ||
      c.tagsNFeRelacionadas.some((t) => t.toLowerCase().includes(term));

    return matchesCategory && matchesSearch;
  });

  const filteredCBenef = cbenefList.filter((cb) => {
    const matchesUF = selectedUF === 'todos' || cb.uf === selectedUF;
    const matchesSearch =
      cb.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cb.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cb.cst.includes(searchTerm) ||
      cb.fonteOficial.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUF && matchesSearch;
  });

  const ufsWithCBenef = Array.from(new Set(cbenefList.map((cb) => cb.uf)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            cBenef (Benefício Fiscal) & Carimbos Fiscais de NF-e
          </h2>
          <p className="text-xs text-slate-500">
            Regras de uso, códigos por estado e textos legais obrigatórios para o campo de Dados Adicionais (`infCpl`)
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('carimbos');
              setSearchTerm('');
            }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'carimbos'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Carimbos Fiscais / Mensagens Obrigatórias
          </button>
          <button
            onClick={() => {
              setActiveTab('cbenef');
              setSearchTerm('');
            }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'cbenef'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tabela cBenef por UF
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CARIMBOS FISCAIS / DADOS ADICIONAIS              */}
      {/* ======================================================== */}
      {activeTab === 'carimbos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Carimbos List */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar carimbo por palavra-chave, lei, CFOP, CST (ex: Simples, Devolução, ST, Suframa, Reforma)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pb-1 border-b border-slate-100">
              {categories.map((cat) => {
                const count =
                  cat === 'todos'
                    ? carimbosList.length
                    : carimbosList.filter((c) => c.categoria && c.categoria.toLowerCase() === cat.toLowerCase()).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat === 'todos' ? 'Todas as Categorias' : cat}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Results counter */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>
                Exibindo <strong>{filteredCarimbos.length}</strong> {filteredCarimbos.length === 1 ? 'modelo' : 'modelos'} de carimbo fiscal normatizado
              </span>
              {selectedCategory !== 'todos' && (
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className="text-blue-600 hover:underline text-[10px]"
                >
                  Limpar filtro de categoria
                </button>
              )}
            </div>

            {/* Cards List */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredCarimbos.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum carimbo encontrado para os filtros selecionados.
                </div>
              ) : (
                filteredCarimbos.map((carimbo) => {
                  const isSelected = selectedCarimbo?.id === carimbo.id;
                  return (
                    <div
                      key={carimbo.id}
                      onClick={() => setSelectedCarimbo(carimbo)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{carimbo.titulo}</span>
                          {carimbo.categoria && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium">
                              {carimbo.categoria}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold shrink-0">
                          {carimbo.ufAplicavel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{carimbo.quandoUsar}</p>

                      <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] text-slate-800 line-clamp-2">
                        "{carimbo.textoObrigatorio}"
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Carimbo Inspector + Official Source Side Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
            {selectedCarimbo ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">
                        {selectedCarimbo.categoria || 'Regra de Operação Fiscal'}
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-900/80 text-blue-200 border border-blue-700/60 rounded text-[9px] font-semibold">
                        {selectedCarimbo.ufAplicavel}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm leading-tight mt-1">{selectedCarimbo.titulo}</h3>
                  </div>

                  <button
                    onClick={() => handleCopyText(selectedCarimbo.id, selectedCarimbo.textoObrigatorio)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shrink-0 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedId === selectedCarimbo.id ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {/* Ready to copy box */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 block">
                      Texto Pronto para Dados Adicionais da NF-e (`infCpl` / `infAdFisco`):
                    </label>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 leading-relaxed select-all">
                      {selectedCarimbo.textoObrigatorio}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      * Substitua os campos entre colchetes [ex: R$ VALOR] pelos valores calculados na nota.
                    </span>
                  </div>

                  {/* Quando usar */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      Quando Utilizar Esta Regra:
                    </span>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{selectedCarimbo.quandoUsar}</p>
                  </div>

                  {/* Tags XML relacionadas */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      Tags XML de NF-e Vinculadas:
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {selectedCarimbo.tagsNFeRelacionadas.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-slate-300 font-mono text-[10px] rounded text-blue-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Campo Oficial de onde buscou a informação (Obrigatório) */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                      <BookOpen className="w-4 h-4 text-blue-700" />
                      Campo Oficial de Onde Buscou a Informação:
                    </span>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-200 font-medium text-slate-800 space-y-1">
                      <p className="text-blue-950 font-bold">{selectedCarimbo.fonteOficial}</p>
                      <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        Atualizado e validado conforme Manual da SEFAZ v7.00 • Data: <strong>{selectedCarimbo.dataAtualizacao}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TABELA cBenef POR UF                             */}
      {/* ======================================================== */}
      {activeTab === 'cbenef' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Filter and Table */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por código (ex: SP020001) ou CST..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-slate-600">Filtrar por UF:</span>
                <select
                  value={selectedUF}
                  onChange={(e) => setSelectedUF(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-blue-700"
                >
                  <option value="todos">Todas as UFs com cBenef</option>
                  {ufsWithCBenef.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-16">UF</th>
                    <th className="py-2.5 px-3 w-28">cBenef</th>
                    <th className="py-2.5 px-3">Descrição do Benefício Fiscal</th>
                    <th className="py-2.5 px-3 text-center w-16">CST</th>
                    <th className="py-2.5 px-3 text-center w-24">vICMSDeson</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredCBenef.map((cb) => {
                    const isSelected = selectedCBenef?.id === cb.id;
                    return (
                      <tr
                        key={cb.id}
                        onClick={() => setSelectedCBenef(cb)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-blue-700">{cb.uf}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{cb.codigo}</td>
                        <td className="py-2.5 px-3 leading-snug">
                          <p>{cb.descricao}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{cb.tipoBeneficio}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{cb.cst}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              cb.exigeValorDesonerado
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cb.exigeValorDesonerado ? 'Exigido' : 'Dispensado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: cBenef Details with Official Source Field */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
            {selectedCBenef ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-blue-400">
                        {selectedCBenef.codigo}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                        UF: {selectedCBenef.uf}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                        CST {selectedCBenef.cst}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 block mt-1 font-medium">
                      Modalidade: {selectedCBenef.tipoBeneficio}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                      Finalidade e Hipótese de Aplicação:
                    </span>
                    <p className="text-slate-900 font-medium leading-relaxed">{selectedCBenef.descricao}</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      Exemplo Prático de Uso:
                    </span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{selectedCBenef.exemploUso}</p>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                    <span className="font-semibold text-amber-900 flex items-center gap-1.5 text-[11px]">
                      Regras de Schema XML na SEFAZ:
                    </span>
                    <p className="text-amber-950 text-[11px]">
                      Tag: <code className="font-bold bg-white px-1 py-0.5 rounded">&lt;cBenef&gt;{selectedCBenef.codigo}&lt;/cBenef&gt;</code>
                    </p>
                    <p className="text-[11px] text-amber-900">
                      Preenchimento de <code className="font-bold bg-white px-1 py-0.5 rounded">&lt;vICMSDeson&gt;</code>:{' '}
                      <strong>{selectedCBenef.exigeValorDesonerado ? 'Obrigatório calcular e subtrair o imposto desonerado' : 'Não exigido pela UF nesta hipótese'}</strong>.
                    </p>
                  </div>

                  {/* Campo Oficial de onde buscou a informação (Obrigatório) */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                      <BookOpen className="w-4 h-4 text-blue-700" />
                      Campo Oficial de Onde Buscou a Informação:
                    </span>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-200 font-medium text-slate-800 space-y-1">
                      <p className="text-blue-950 font-bold">{selectedCBenef.fonteOficial}</p>
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        Vigência: <strong>Desde {selectedCBenef.vigenciaInicio}</strong> • Atualizado em: <strong>{selectedCBenef.dataAtualizacao}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
