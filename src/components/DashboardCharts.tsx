// Componente de dashboard com gráficos para análise visual do DRE
import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DREData, ExpenseEntry, RevenueEntry } from '../lib/supabase';
import { aggregateExpensesByCategory, aggregateRevenuesByCategory, getTopExpenses, formatCurrency } from '../utils/dreGenerator';

interface DashboardChartsProps {
  dreData: DREData;
  expenses: ExpenseEntry[];
  revenues: RevenueEntry[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function DashboardCharts({ dreData, expenses, revenues }: DashboardChartsProps) {
  // Agregar dados para gráficos
  const expensesByCategory = useMemo(() => aggregateExpensesByCategory(expenses), [expenses]);
  const revenuesByCategory = useMemo(() => aggregateRevenuesByCategory(revenues), [revenues]);
  const topExpenses = useMemo(() => getTopExpenses(expenses, 10), [expenses]);

  // Dados para gráfico de despesas fixas vs variáveis
  const fixedVsVariableData = useMemo(() => [
    {
      name: 'Despesas Fixas',
      value: dreData.despesas_fixas,
      percentage: dreData.despesas_operacionais.total > 0
        ? (dreData.despesas_fixas / dreData.despesas_operacionais.total) * 100
        : 0,
    },
    {
      name: 'Despesas Variáveis',
      value: dreData.despesas_variaveis,
      percentage: dreData.despesas_operacionais.total > 0
        ? (dreData.despesas_variaveis / dreData.despesas_operacionais.total) * 100
        : 0,
    },
  ], [dreData]);

  // Dados para gráfico de margens
  const marginsData = useMemo(() => [
    { name: 'Margem Bruta', value: dreData.margem_bruta_percent },
    { name: 'Margem Operacional', value: dreData.margem_operacional_percent },
    { name: 'Margem Líquida', value: dreData.margem_liquida_percent },
  ], [dreData]);

  // Dados para gráfico de composição de receitas e despesas
  const revenueExpenseComparison = useMemo(() => [
    {
      name: 'Valores',
      'Receita Bruta': dreData.receita_bruta,
      'Impostos': dreData.impostos_sobre_receita.total + dreData.impostos_sobre_lucro.total,
      'Despesas Operacionais': dreData.despesas_operacionais.total,
      'Lucro Líquido': dreData.lucro_liquido,
    },
  ], [dreData]);

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-700">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload.percentage !== undefined && (
            <p className="text-xs text-gray-600">
              {payload[0].payload.percentage.toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 print-only">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard de Análise Financeira</h2>
        <p className="text-gray-600 mt-2">Visualizações e indicadores chave de desempenho</p>
      </div>

      {/* Gráfico de Despesas por Categoria (Pizza) */}
      {expensesByCategory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Distribuição de Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                labelLine={true}
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Despesas Fixas vs Variáveis */}
      {(dreData.despesas_fixas > 0 || dreData.despesas_variaveis > 0) && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Despesas Fixas vs Variáveis</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={fixedVsVariableData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" fill="#0088FE" name="Valor" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-cyan-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Despesas Fixas</p>
              <p className="text-2xl font-bold text-cyan-700">{formatCurrency(dreData.despesas_fixas)}</p>
              <p className="text-sm text-cyan-600 mt-1">
                {fixedVsVariableData[0].percentage.toFixed(1)}% do total
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Despesas Variáveis</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(dreData.despesas_variaveis)}</p>
              <p className="text-sm text-amber-600 mt-1">
                {fixedVsVariableData[1].percentage.toFixed(1)}% do total
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Top 10 Maiores Despesas */}
      {topExpenses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top 10 Maiores Despesas</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topExpenses}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
              <YAxis
                type="category"
                dataKey="description"
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="amount" fill="#FF8042" name="Valor" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Margens (%) */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Análise de Margens (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={marginsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="value" fill="#82ca9d" name="Percentual" />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Margem Bruta</p>
            <p className="text-3xl font-bold text-emerald-700">
              {dreData.margem_bruta_percent.toFixed(1)}%
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Margem Operacional</p>
            <p className="text-3xl font-bold text-blue-700">
              {dreData.margem_operacional_percent.toFixed(1)}%
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Margem Líquida</p>
            <p className="text-3xl font-bold text-green-700">
              {dreData.margem_liquida_percent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Receitas por Categoria */}
      {revenuesByCategory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Distribuição de Receitas por Categoria</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={revenuesByCategory}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                labelLine={true}
              >
                {revenuesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparação Visual Receitas vs Despesas */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Composição Financeira</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={revenueExpenseComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="Receita Bruta" fill="#10b981" name="Receita Bruta" />
            <Bar dataKey="Impostos" fill="#ef4444" name="Impostos" />
            <Bar dataKey="Despesas Operacionais" fill="#f59e0b" name="Despesas Operacionais" />
            <Bar dataKey="Lucro Líquido" fill="#3b82f6" name="Lucro Líquido" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
