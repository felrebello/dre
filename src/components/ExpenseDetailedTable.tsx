// Componente de tabela detalhada de todas as despesas do relatório
import { useMemo } from 'react';
import { ExpenseEntry } from '../lib/firebase';
import { formatCurrency } from '../utils/dreGenerator';
import { identificarImposto } from '../types/tax';
import { Tag } from 'lucide-react';

interface ExpenseDetailedTableProps {
  expenses: ExpenseEntry[];
}

export default function ExpenseDetailedTable({ expenses }: ExpenseDetailedTableProps) {
  // Calcular totais por categoria
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    expenses.forEach((expense) => {
      const category = expense.categoria_personalizada || expense.category;
      totals.set(category, (totals.get(category) || 0) + expense.amount);
    });
    return totals;
  }, [expenses]);

  // Calcular totais gerais
  const totals = useMemo(() => {
    const impostos = expenses.filter((exp) => exp.e_imposto || identificarImposto(exp.description));
    const operacionais = expenses.filter((exp) => !exp.e_imposto && !identificarImposto(exp.description));
    const fixas = expenses.filter((exp) => exp.tipo_despesa === 'fixa');
    const variaveis = expenses.filter((exp) => exp.tipo_despesa === 'variavel');
    const manuais = expenses.filter((exp) => exp.is_manual_entry);
    const importadas = expenses.filter((exp) => !exp.is_manual_entry);

    return {
      total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      impostos: impostos.reduce((sum, exp) => sum + exp.amount, 0),
      operacionais: operacionais.reduce((sum, exp) => sum + exp.amount, 0),
      fixas: fixas.reduce((sum, exp) => sum + exp.amount, 0),
      variaveis: variaveis.reduce((sum, exp) => sum + exp.amount, 0),
      manuais: manuais.reduce((sum, exp) => sum + exp.amount, 0),
      importadas: importadas.reduce((sum, exp) => sum + exp.amount, 0),
      countImpostos: impostos.length,
      countOperacionais: operacionais.length,
      countFixas: fixas.length,
      countVariaveis: variaveis.length,
      countManuais: manuais.length,
      countImportadas: importadas.length,
    };
  }, [expenses]);

  // Agrupar despesas por categoria
  const expensesByCategory = useMemo(() => {
    const grouped = new Map<string, ExpenseEntry[]>();
    expenses.forEach((expense) => {
      const category = expense.categoria_personalizada || expense.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(expense);
    });
    return Array.from(grouped.entries()).sort((a, b) => {
      const totalA = a[1].reduce((sum, exp) => sum + exp.amount, 0);
      const totalB = b[1].reduce((sum, exp) => sum + exp.amount, 0);
      return totalB - totalA;
    });
  }, [expenses]);

  // Formatar data
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Verificar se é imposto (verificar marcação manual ou identificação automática)
  const isExpenseTax = (expense: ExpenseEntry) => {
    return expense.e_imposto || identificarImposto(expense.description) !== null;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Detalhamento de Despesas</h2>
        <p className="text-gray-600 mt-2">Lista completa de todas as despesas do período</p>
      </div>

      {/* Resumo de Totais */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total de Despesas</p>
            <p className="text-2xl font-bold text-slate-700">{formatCurrency(totals.total)}</p>
            <p className="text-xs text-slate-600 mt-1">{expenses.length} lançamentos</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Impostos</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(totals.impostos)}</p>
            <p className="text-xs text-purple-600 mt-1">{totals.countImpostos} lançamentos</p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Despesas Fixas</p>
            <p className="text-2xl font-bold text-cyan-700">{formatCurrency(totals.fixas)}</p>
            <p className="text-xs text-cyan-600 mt-1">{totals.countFixas} lançamentos</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Despesas Variáveis</p>
            <p className="text-2xl font-bold text-amber-700">{formatCurrency(totals.variaveis)}</p>
            <p className="text-xs text-amber-600 mt-1">{totals.countVariaveis} lançamentos</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Despesas Manuais</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.manuais)}</p>
            <p className="text-xs text-green-600 mt-1">{totals.countManuais} lançamentos</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Despesas Importadas</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totals.importadas)}</p>
            <p className="text-xs text-blue-600 mt-1">{totals.countImportadas} lançamentos</p>
          </div>
        </div>
      </div>

      {/* Tabelas por Categoria */}
      {expensesByCategory.map(([category, categoryExpenses]) => {
        const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        return (
          <div key={category} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            {/* Cabeçalho da Categoria */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{category}</h3>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">{formatCurrency(categoryTotal)}</p>
                  <p className="text-slate-300 text-sm">{categoryExpenses.length} lançamentos</p>
                </div>
              </div>
            </div>

            {/* Tabela de Despesas da Categoria */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Descrição</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Origem</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categoryExpenses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((expense, index) => {
                      const isTax = isExpenseTax(expense);

                      return (
                        <tr key={expense.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-900">
                            {expense.description}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isTax ? (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded inline-flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Imposto
                              </span>
                            ) : expense.tipo_despesa ? (
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  expense.tipo_despesa === 'fixa'
                                    ? 'bg-cyan-100 text-cyan-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {expense.tipo_despesa === 'fixa' ? 'Fixa' : 'Variável'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                expense.is_manual_entry
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {expense.is_manual_entry ? 'Manual' : 'Importada'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-right font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                {/* Subtotal da Categoria */}
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      Subtotal {category}:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      {formatCurrency(categoryTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}

      {/* Total Geral Final */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Total Geral de Despesas</h3>
            <p className="text-slate-300 mt-1">{expenses.length} lançamentos no período</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-white">{formatCurrency(totals.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
