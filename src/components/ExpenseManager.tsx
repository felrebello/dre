// Componente para gerenciar despesas do relatório (adicionar, remover, visualizar)
import { useState, useMemo } from 'react';
import { Trash2, Plus, X, Calendar, DollarSign, FileText, AlertCircle, Tag, Edit } from 'lucide-react';
import { ExpenseEntry, deleteExpense, addManualExpense, updateExpense, extractYearMonth } from '../lib/firebase';
import { identificarImposto, ImpostoReceita, ImpostoLucro } from '../types/tax';

interface ExpenseManagerProps {
  reportId: string;
  reportMonth: string; // Formato: YYYY-MM
  expenses: ExpenseEntry[];
  onExpensesChanged: () => void; // Callback para quando despesas são modificadas
}

export default function ExpenseManager({
  reportId,
  reportMonth,
  expenses,
  onExpensesChanged,
}: ExpenseManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'imported'>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtrar despesas baseado no filtro selecionado
  const filteredExpenses = useMemo(() => {
    if (filterType === 'manual') {
      return expenses.filter(exp => exp.is_manual_entry);
    } else if (filterType === 'imported') {
      return expenses.filter(exp => !exp.is_manual_entry);
    }
    return expenses;
  }, [expenses, filterType]);

  // Calcular totais
  const totals = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const manual = expenses.filter(exp => exp.is_manual_entry).reduce((sum, exp) => sum + exp.amount, 0);
    const imported = expenses.filter(exp => !exp.is_manual_entry).reduce((sum, exp) => sum + exp.amount, 0);
    return { total, manual, imported };
  }, [expenses]);

  // Função para excluir despesa
  const handleDeleteExpense = async (expenseId: string) => {
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      await deleteExpense(reportId, expenseId);
      setSuccess('Despesa excluída com sucesso! Clique em "Salvar e Recalcular" para atualizar o DRE.');
      setDeleteConfirm(null);
      setTimeout(() => setSuccess(null), 5000);
      onExpensesChanged(); // Notificar mudança
    } catch (err) {
      console.error('Erro ao excluir despesa:', err);
      setError('Erro ao excluir despesa. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatar valor em moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Identificar se é imposto (verificar marcação manual ou identificação automática)
  const isExpenseTax = (expense: ExpenseEntry) => {
    return expense.e_imposto || identificarImposto(expense.description) !== null;
  };

  // Verificar se despesa está fora do mês do relatório
  const isExpenseOutOfMonth = (expense: ExpenseEntry) => {
    return extractYearMonth(expense.date) !== reportMonth;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Gerenciar Despesas</h2>
            <p className="text-blue-100 text-sm mt-1">
              Adicione ou remova despesas do relatório
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Despesa
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total de Despesas</p>
          <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
          <p className="text-lg text-gray-700 mt-1">{formatCurrency(totals.total)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Despesas Importadas</p>
          <p className="text-2xl font-bold text-blue-700">
            {expenses.filter(exp => !exp.is_manual_entry).length}
          </p>
          <p className="text-lg text-blue-600 mt-1">{formatCurrency(totals.imported)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Despesas Manuais</p>
          <p className="text-2xl font-bold text-green-700">
            {expenses.filter(exp => exp.is_manual_entry).length}
          </p>
          <p className="text-lg text-green-600 mt-1">{formatCurrency(totals.manual)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas ({expenses.length})
          </button>
          <button
            onClick={() => setFilterType('imported')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'imported'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Importadas ({expenses.filter(exp => !exp.is_manual_entry).length})
          </button>
          <button
            onClick={() => setFilterType('manual')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Manuais ({expenses.filter(exp => exp.is_manual_entry).length})
          </button>
        </div>
      </div>

      {/* Tabela de despesas */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoria</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Origem</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma despesa encontrada.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => {
                const isOutOfMonth = isExpenseOutOfMonth(expense);
                const isTax = isExpenseTax(expense);

                return (
                  <tr
                    key={expense.id}
                    className={`hover:bg-gray-50 ${isOutOfMonth ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        {formatDate(expense.date)}
                        {isOutOfMonth && (
                          <span title="Despesa fora do mês do relatório">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {expense.categoria_personalizada || expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isTax ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 w-fit">
                          <Tag className="h-3 w-3" />
                          Imposto
                        </span>
                      ) : expense.tipo_despesa ? (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            expense.tipo_despesa === 'fixa'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {expense.tipo_despesa === 'fixa' ? 'Fixa' : 'Variável'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          expense.is_manual_entry
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {expense.is_manual_entry ? 'Manual' : 'Importada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {deleteConfirm === expense.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={isProcessing}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={isProcessing}
                            className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar despesa"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(expense.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Excluir despesa"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de adicionar despesa */}
      {showAddModal && (
        <AddExpenseModal
          reportId={reportId}
          reportMonth={reportMonth}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            setSuccess('Despesa adicionada com sucesso! Clique em "Salvar e Recalcular" para atualizar o DRE.');
            setTimeout(() => setSuccess(null), 5000);
            onExpensesChanged();
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {/* Modal de editar despesa */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          reportId={reportId}
          reportMonth={reportMonth}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null);
            setSuccess('Despesa atualizada com sucesso! Clique em "Salvar e Recalcular" para atualizar o DRE.');
            setTimeout(() => setSuccess(null), 5000);
            onExpensesChanged();
          }}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}

// Modal para adicionar nova despesa
interface AddExpenseModalProps {
  reportId: string;
  reportMonth: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function AddExpenseModal({
  reportId,
  reportMonth,
  onClose,
  onSuccess,
  onError,
}: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    date: `${reportMonth}-01`, // Data padrão: primeiro dia do mês
    description: '',
    category: 'Outras Despesas Operacionais',
    amount: '',
    tipo_despesa: 'fixa' as 'fixa' | 'variavel',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar que a data está no mês correto
      if (extractYearMonth(formData.date) !== reportMonth) {
        onError(
          `A data da despesa deve estar no mês do relatório (${reportMonth}). Data informada: ${extractYearMonth(formData.date)}`
        );
        setIsSubmitting(false);
        return;
      }

      // Validar valor
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        onError('Por favor, informe um valor válido maior que zero.');
        setIsSubmitting(false);
        return;
      }

      // Adicionar despesa
      await addManualExpense(reportId, {
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount,
        tipo_despesa: formData.tipo_despesa,
        classificacao_manual: true,
        sugestao_automatica: formData.tipo_despesa,
      });

      onSuccess();
    } catch (err) {
      console.error('Erro ao adicionar despesa:', err);
      onError('Erro ao adicionar despesa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Adicionar Despesa Manual</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Data */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Data da Despesa
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mês do relatório: {reportMonth}
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Descrição
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Ex: Aluguel escritório, Energia elétrica..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Tag className="h-4 w-4 inline mr-2" />
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Pessoal">Pessoal</option>
              <option value="Administrativas">Administrativas</option>
              <option value="Vendas e Marketing">Vendas e Marketing</option>
              <option value="Despesas Financeiras">Despesas Financeiras</option>
              <option value="Custo dos Serviços">Custo dos Serviços</option>
              <option value="Outras Despesas Operacionais">Outras Despesas Operacionais</option>
            </select>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0,00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tipo de Despesa */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Despesa
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo_despesa: 'fixa' })}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  formData.tipo_despesa === 'fixa'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Fixa
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo_despesa: 'variavel' })}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  formData.tipo_despesa === 'variavel'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Variável
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Fixa:</strong> Não varia com o volume de atendimentos (ex: aluguel, salários)
              <br />
              <strong>Variável:</strong> Proporcional ao volume de atendimentos (ex: materiais, comissões)
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Adicionando...' : 'Adicionar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para editar despesa existente
interface EditExpenseModalProps {
  expense: ExpenseEntry;
  reportId: string;
  reportMonth: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function EditExpenseModal({
  expense,
  reportId,
  reportMonth,
  onClose,
  onSuccess,
  onError,
}: EditExpenseModalProps) {
  const [formData, setFormData] = useState({
    date: expense.date,
    description: expense.description,
    category: expense.category,
    amount: expense.amount.toString(),
    tipo_despesa: (expense.tipo_despesa || 'fixa') as 'fixa' | 'variavel',
    e_imposto: expense.e_imposto || false,
    tipo_imposto: expense.tipo_imposto || null,
    categoria_imposto: expense.categoria_imposto || null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar IDs necessários
      if (!expense.id) {
        onError('Erro: ID da despesa não encontrado.');
        setIsSubmitting(false);
        return;
      }

      if (!reportId) {
        onError('Erro: ID do relatório não encontrado.');
        setIsSubmitting(false);
        return;
      }

      // Validar que a data está no mês correto
      if (extractYearMonth(formData.date) !== reportMonth) {
        onError(
          `A data da despesa deve estar no mês do relatório (${reportMonth}). Data informada: ${extractYearMonth(formData.date)}`
        );
        setIsSubmitting(false);
        return;
      }

      // Validar valor
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        onError('Por favor, informe um valor válido maior que zero.');
        setIsSubmitting(false);
        return;
      }

      // Atualizar despesa
      await updateExpense(expense.id, reportId, {
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount,
        tipo_despesa: formData.e_imposto ? null : formData.tipo_despesa,
        e_imposto: formData.e_imposto,
        tipo_imposto: formData.e_imposto ? formData.tipo_imposto : null,
        categoria_imposto: formData.e_imposto ? formData.categoria_imposto : null,
      });

      onSuccess();
    } catch (err) {
      console.error('Erro ao atualizar despesa:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar despesa. Tente novamente.';
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Editar Despesa</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Data */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Data da Despesa
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mês do relatório: {reportMonth}
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Descrição
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Ex: Aluguel escritório, Energia elétrica..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Tag className="h-4 w-4 inline mr-2" />
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Pessoal">Pessoal</option>
              <option value="Administrativas">Administrativas</option>
              <option value="Vendas e Marketing">Vendas e Marketing</option>
              <option value="Despesas Financeiras">Despesas Financeiras</option>
              <option value="Custo dos Serviços">Custo dos Serviços</option>
              <option value="Outras Despesas Operacionais">Outras Despesas Operacionais</option>
            </select>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0,00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* É Imposto? */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.e_imposto}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFormData({
                    ...formData,
                    e_imposto: isChecked,
                    tipo_imposto: isChecked ? 'receita' : null,
                    categoria_imposto: null,
                  });
                }}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Esta despesa é um imposto
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              Impostos não precisam ser classificados como fixos ou variáveis
            </p>
          </div>

          {/* Campos de Imposto - só aparecem se e_imposto = true */}
          {formData.e_imposto && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
              {/* Tipo de Imposto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Imposto
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      tipo_imposto: 'receita',
                      categoria_imposto: null,
                    })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.tipo_imposto === 'receita'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Sobre Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      tipo_imposto: 'lucro',
                      categoria_imposto: null,
                    })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.tipo_imposto === 'lucro'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Sobre Lucro
                  </button>
                </div>
              </div>

              {/* Categoria de Imposto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Categoria do Imposto
                </label>
                <select
                  value={formData.categoria_imposto || ''}
                  onChange={(e) => setFormData({ ...formData, categoria_imposto: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="">Selecione uma categoria</option>
                  {formData.tipo_imposto === 'receita' ? (
                    <>
                      <option value={ImpostoReceita.PIS}>PIS</option>
                      <option value={ImpostoReceita.COFINS}>COFINS</option>
                      <option value={ImpostoReceita.ISS}>ISS</option>
                      <option value={ImpostoReceita.ICMS}>ICMS</option>
                      <option value={ImpostoReceita.SIMPLES}>SIMPLES Nacional</option>
                      <option value="outros">Outros</option>
                    </>
                  ) : (
                    <>
                      <option value={ImpostoLucro.IRPJ}>IRPJ</option>
                      <option value={ImpostoLucro.CSLL}>CSLL</option>
                      <option value="outros">Outros</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Tipo de Despesa - só aparece se NÃO for imposto */}
          {!formData.e_imposto && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Despesa
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo_despesa: 'fixa' })}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  formData.tipo_despesa === 'fixa'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Fixa
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo_despesa: 'variavel' })}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  formData.tipo_despesa === 'variavel'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Variável
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Fixa:</strong> Não varia com o volume de atendimentos (ex: aluguel, salários)
              <br />
              <strong>Variável:</strong> Proporcional ao volume de atendimentos (ex: materiais, comissões)
            </p>
          </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
