import React, { useState } from 'react';
import { CFOP, UFInfo, STRegra, RejeicaoSEFAZ } from '../../types/fiscal';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Download,
  Shield,
  Layers,
} from 'lucide-react';

interface AdminCRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  ufs: UFInfo[];
  cfops: CFOP[];
  stRules: STRegra[];
  onSaveUF: (uf: UFInfo) => void;
  onSaveCFOP: (cfop: CFOP) => void;
  onSaveSTRule: (st: STRegra) => void;
}

export const AdminCRUDModal: React.FC<AdminCRUDModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  setIsAdmin,
  ufs,
  cfops,
  stRules,
  onSaveUF,
  onSaveCFOP,
  onSaveSTRule,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'perfil' | 'ufs' | 'cfops' | 'st'>('perfil');

  // UF edit state
  const [editingUF, setEditingUF] = useState<UFInfo | null>(null);
  const [ufAliq, setUfAliq] = useState<number>(18);
  const [ufFCP, setUfFCP] = useState<number>(0);
  const [ufFonte, setUfFonte] = useState('');

  // CFOP new/edit state
  const [newCFOPCodigo, setNewCFOPCodigo] = useState('');
  const [newCFOPDesc, setNewCFOPDesc] = useState('');
  const [newCFOPTipo, setNewCFOPTipo] = useState<'entrada' | 'saida'>('saida');
  const [newCFOPDevolucao, setNewCFOPDevolucao] = useState('');
  const [cfopSavedMessage, setCfopSavedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartEditUF = (uf: UFInfo) => {
    setEditingUF(uf);
    setUfAliq(uf.aliquotaInterna);
    setUfFCP(uf.fcp);
    setUfFonte(uf.fonte);
  };

  const handleSaveUF = () => {
    if (!editingUF) return;
    const updated: UFInfo = {
      ...editingUF,
      aliquotaInterna: ufAliq,
      fcp: ufFCP,
      fonte: ufFonte || editingUF.fonte,
      dataAtualizacao: new Date().toISOString().split('T')[0],
    };
    onSaveUF(updated);
    setEditingUF(null);
  };

  const handleCreateCFOP = () => {
    if (!newCFOPCodigo || !newCFOPDesc) return;
    const clean = newCFOPCodigo.replace(/\D/g, '');
    const firstDigit = clean.charAt(0);
    const grupo = (firstDigit + 'xxx') as any;

    const cfop: CFOP = {
      id: `cfop-${Date.now()}`,
      codigo: newCFOPCodigo,
      descricao: newCFOPDesc,
      tipo: newCFOPTipo,
      abrangencia: ['1', '5'].includes(firstDigit)
        ? 'estadual'
        : ['2', '6'].includes(firstDigit)
        ? 'interestadual'
        : 'exterior',
      grupo,
      quandoUsar: 'Cadastrado administrativamente pela equipe fiscal.',
      quandoNaoUsar: 'Conferir enquadramento e vigência legal.',
      cfopDevolucao: newCFOPDevolucao || undefined,
      geraCreditoDebitoICMS: true,
      geraCreditoDebitoIPI: false,
      geraCreditoDebitoPISCOFINS: true,
      movimentaEstoque: true,
      movimentaFinanceiro: true,
      vigenciaInicio: new Date().toISOString().split('T')[0],
      fonte: 'Administração FiscalDesk',
      dataAtualizacao: new Date().toISOString().split('T')[0],
    };

    onSaveCFOP(cfop);
    setNewCFOPCodigo('');
    setNewCFOPDesc('');
    setNewCFOPDevolucao('');
    setCfopSavedMessage(`CFOP ${cfop.codigo} cadastrado com sucesso!`);
    setTimeout(() => setCfopSavedMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Painel Administrativo & Manutenção Tributária</h3>
              <p className="text-[10px] text-slate-400">
                Atualize alíquotas de ICMS, cadastre regras de ST e mantenha o sistema aderente à legislação
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        {cfopSavedMessage && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold">
            {cfopSavedMessage}
          </div>
        )}
        <div className="flex bg-slate-100 p-1 border-b border-slate-200 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveAdminTab('perfil')}
            className={`px-4 py-2 rounded-md ${activeAdminTab === 'perfil' ? 'bg-white text-blue-700 shadow-xs' : ''}`}
          >
            Perfil de Acesso
          </button>
          <button
            onClick={() => setActiveAdminTab('ufs')}
            className={`px-4 py-2 rounded-md ${activeAdminTab === 'ufs' ? 'bg-white text-blue-700 shadow-xs' : ''}`}
          >
            Alíquotas por UF ({ufs.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('cfops')}
            className={`px-4 py-2 rounded-md ${activeAdminTab === 'cfops' ? 'bg-white text-blue-700 shadow-xs' : ''}`}
          >
            Cadastrar CFOP
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-800">
          {/* TAB: Perfil */}
          {activeAdminTab === 'perfil' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 text-sm block">Alternar Perfil do Usuário:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setIsAdmin(false)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      !isAdmin
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <strong className="block text-slate-900 font-bold">Perfil: Analista Fiscal</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Consulta tabelas, utiliza calculadoras, mapa e validador SEFAZ sem permissão de alteração da base de dados.
                    </p>
                  </div>

                  <div
                    onClick={() => setIsAdmin(true)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isAdmin
                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <strong className="block text-purple-900 font-bold">Perfil: Administrador / Gestor Fiscal</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Permissão completa de CRUD para editar alíquotas estaduais, atualizar protocolos de ST e adicionar novos CFOPs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: UFs CRUD */}
          {activeAdminTab === 'ufs' && (
            <div className="space-y-3">
              {editingUF ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <span className="font-bold text-blue-900 block">
                    Editando Regras de ICMS da UF: {editingUF.sigla} ({editingUF.nome})
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-600 block mb-1">Alíquota Interna Modal (%):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={ufAliq}
                        onChange={(e) => setUfAliq(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-blue-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-600 block mb-1">FCP (%):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={ufFCP}
                        onChange={(e) => setUfFCP(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-blue-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-600 block mb-1">Fonte / Lei Atualizada:</span>
                      <input
                        type="text"
                        value={ufFonte}
                        onChange={(e) => setUfFonte(e.target.value)}
                        className="w-full p-2 bg-white border border-blue-300 rounded text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingUF(null)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveUF}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2.5">UF</th>
                      <th className="p-2.5">Estado</th>
                      <th className="p-2.5 text-center">Interna</th>
                      <th className="p-2.5 text-center">FCP</th>
                      <th className="p-2.5">Atualizado</th>
                      <th className="p-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ufs.map((u) => (
                      <tr key={u.sigla} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-700">{u.sigla}</td>
                        <td className="p-2.5">{u.nome}</td>
                        <td className="p-2.5 text-center font-bold">{u.aliquotaInterna}%</td>
                        <td className="p-2.5 text-center font-semibold text-amber-700">
                          {u.fcp > 0 ? `${u.fcp}%` : '—'}
                        </td>
                        <td className="p-2.5 text-slate-500 text-[11px]">{u.dataAtualizacao}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleStartEditUF(u)}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-blue-700 rounded font-semibold text-[11px]"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Cadastrar CFOP */}
          {activeAdminTab === 'cfops' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-slate-900 text-sm block">Novo Código Fiscal (CFOP):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-600 block mb-1">Código (ex: 5.109):</span>
                  <input
                    type="text"
                    value={newCFOPCodigo}
                    onChange={(e) => setNewCFOPCodigo(e.target.value)}
                    placeholder="5.109"
                    className="w-full p-2 bg-white border border-slate-300 rounded font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-600 block mb-1">Tipo:</span>
                  <select
                    value={newCFOPTipo}
                    onChange={(e) => setNewCFOPTipo(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded"
                  >
                    <option value="saida">Saída</option>
                    <option value="entrada">Entrada</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-600 block mb-1">CFOP Devolução Correspondente:</span>
                  <input
                    type="text"
                    value={newCFOPDevolucao}
                    onChange={(e) => setNewCFOPDevolucao(e.target.value)}
                    placeholder="ex: 1.209"
                    className="w-full p-2 bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <span className="text-slate-600 block mb-1">Descrição Oficial:</span>
                <input
                  type="text"
                  value={newCFOPDesc}
                  onChange={(e) => setNewCFOPDesc(e.target.value)}
                  placeholder="Descrição oficial conforme Ajuste SINIEF..."
                  className="w-full p-2 bg-white border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCreateCFOP}
                  disabled={!newCFOPCodigo || !newCFOPDesc}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar e Adicionar à Base
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
