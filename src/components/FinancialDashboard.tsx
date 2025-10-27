import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DREData } from '../lib/firebase';
import { formatCurrency } from '../utils/dreGenerator';

interface FinancialDashboardProps {
  dreData: DREData;
  reportMonth: string;
}

// Cores do dashboard
const COLORS = {
  primary: '#00BFA5',    // Verde (receitas/positivo)
  danger: '#FF6B6B',     // Vermelho (despesas/negativo)
  light: '#F5F5F5',      // Cinza claro (backgrounds)
  accent: '#00ACC1',     // Azul/Turquesa (destaques)
  warning: '#FFA726',    // Laranja
  success: '#66BB6A',    // Verde claro
};

export default function FinancialDashboard({ dreData, reportMonth }: FinancialDashboardProps) {
  // Dados mockados para gráficos mensais (em produção, viriam do backend)
  const monthlyData = useMemo(() => {
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    return months.map((month) => ({
      month,
      receita: dreData.receita_bruta * (0.8 + Math.random() * 0.4),
      despesa: dreData.despesas_operacionais.total * (0.8 + Math.random() * 0.4),
      saldo: dreData.lucro_liquido * (0.7 + Math.random() * 0.6),
    }));
  }, [dreData]);

  // Dados para cards KPI com comparativos (mock)
  const kpiCards = useMemo(() => [
    {
      title: 'Total Receita',
      value: dreData.receita_bruta,
      comparison: 12.5,
      isPositive: true,
    },
    {
      title: 'Total Despesas',
      value: dreData.despesas_operacionais.total,
      comparison: -3.2,
      isPositive: false,
    },
    {
      title: 'Contas a Receber',
      value: dreData.receita_bruta * 0.15,
      comparison: 8.1,
      isPositive: true,
    },
    {
      title: 'Contas a Pagar',
      value: dreData.despesas_operacionais.total * 0.20,
      comparison: -5.7,
      isPositive: false,
    },
  ], [dreData]);

  // Dados para cards de métricas secundárias
  const metricsCards = useMemo(() => {
    const liquidezReduzida = (dreData.receita_liquida / dreData.despesas_operacionais.total) || 0;
    const liquidez = (dreData.receita_bruta / dreData.despesas_operacionais.total) || 0;

    return [
      {
        title: 'Lucro Líquido',
        value: dreData.lucro_liquido,
        comparison: 15.3,
        target: null,
      },
      {
        title: 'Saldo no final do mês',
        value: dreData.lucro_liquido * 1.2,
        comparison: 9.8,
        target: null,
      },
      {
        title: 'Índice Liquidez Reduzida',
        value: liquidezReduzida,
        comparison: null,
        target: '1 ou mais',
        isRatio: true,
      },
      {
        title: 'Índice de Liquidez',
        value: liquidez,
        comparison: null,
        target: '3 ou mais',
        isRatio: true,
      },
    ];
  }, [dreData]);

  // Dados para gráfico de margem de lucro (circular)
  const marginData = useMemo(() => {
    const percentage = dreData.margem_liquida_percent;
    return [
      { name: 'Margem', value: percentage, fill: COLORS.accent },
      { name: 'Restante', value: 100 - percentage, fill: COLORS.light },
    ];
  }, [dreData]);

  // Dados para gráficos de rosca de orçamento
  const budgetRevenueData = useMemo(() => {
    const orcamento = dreData.receita_bruta * 1.09;
    const percentage = (dreData.receita_bruta / orcamento) * 100;

    return {
      percentage,
      orcamento,
      realizado: dreData.receita_bruta,
      data: [
        { name: 'Realizado', value: percentage, fill: COLORS.primary },
        { name: 'Restante', value: 100 - percentage, fill: COLORS.light },
      ],
    };
  }, [dreData]);

  const budgetExpenseData = useMemo(() => {
    const orcamento = dreData.despesas_operacionais.total * 1.08;
    const percentage = (dreData.despesas_operacionais.total / orcamento) * 100;

    return {
      percentage,
      orcamento,
      realizado: dreData.despesas_operacionais.total,
      data: [
        { name: 'Realizado', value: percentage, fill: COLORS.danger },
        { name: 'Restante', value: 100 - percentage, fill: COLORS.light },
      ],
    };
  }, [dreData]);

  // Dados para tabela de demonstração
  const demonstrationData = useMemo(() => {
    const total = dreData.receita_bruta;

    return [
      {
        label: 'Total Receita',
        value: dreData.receita_bruta,
        percentage: 100,
      },
      {
        label: 'Custo de bens vendidos',
        value: dreData.custo_servicos,
        percentage: (dreData.custo_servicos / total) * 100,
      },
      {
        label: 'Lucro Bruto',
        value: dreData.lucro_bruto,
        percentage: (dreData.lucro_bruto / total) * 100,
        highlight: true,
      },
      {
        label: 'Total Despesas Operacionais',
        value: dreData.despesas_operacionais.total,
        percentage: (dreData.despesas_operacionais.total / total) * 100,
      },
      {
        label: 'Lucro Operacional',
        value: dreData.lucro_operacional,
        percentage: (dreData.lucro_operacional / total) * 100,
        highlight: true,
      },
    ];
  }, [dreData]);

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(monthNum) - 1]}/${year}`;
  };

  return (
    <div className="w-full bg-white p-6 space-y-6">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">3. Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Último mês com dados: <span className="font-semibold">Total</span>
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option>{formatMonth(reportMonth)}</option>
          </select>
        </div>
      </div>

      {/* CARDS DE KPIs PRINCIPAIS */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-600 mb-2">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(card.value)}
            </p>
            <div className="flex items-center gap-1 text-sm">
              {card.comparison > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    +{card.comparison.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 font-medium">
                    {card.comparison.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-gray-500 ml-1">vs mês anterior</span>
            </div>
          </div>
        ))}
      </div>

      {/* CARDS DE MÉTRICAS SECUNDÁRIAS */}
      <div className="grid grid-cols-4 gap-4">
        {metricsCards.map((card, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm"
          >
            <p className="text-sm text-gray-700 font-medium mb-2">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {card.isRatio ? card.value.toFixed(2) : formatCurrency(card.value)}
            </p>
            {card.comparison !== null && (
              <div className="flex items-center gap-1 text-sm">
                {card.comparison > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      +{card.comparison.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">
                      {card.comparison.toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            )}
            {card.target && (
              <p className="text-xs text-gray-600 mt-1">
                Objetivo: <span className="font-semibold">{card.target}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* GRID DE GRÁFICOS */}
      <div className="grid grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA - Gráfico Circular (Margem Lucro) */}
        <div className="col-span-4 space-y-6">
          {/* Gráfico Circular Central */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Margem Lucro Líquido</h3>
            <div className="relative" style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marginData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {marginData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold" style={{ color: COLORS.accent }}>
                    {dreData.margem_liquida_percent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">% Margem Lucro Líquido</p>
              <p className="text-xs text-gray-500 mt-1">Objetivo: 12,0%</p>
            </div>
          </div>

          {/* Dois Gráficos de Rosca (Orçamento) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Orçamento Receita */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-bold text-gray-800 mb-3 text-center">
                Orçamento Receita
              </h4>
              <div className="relative" style={{ height: '120px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetRevenueData.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {budgetRevenueData.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xl font-bold text-green-600">
                    {budgetRevenueData.percentage.toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Orçamento:</span>
                  <span className="font-semibold">{formatCurrency(budgetRevenueData.orcamento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balanço:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(budgetRevenueData.orcamento - budgetRevenueData.realizado)}
                  </span>
                </div>
              </div>
            </div>

            {/* Orçamento Despesas */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-bold text-gray-800 mb-3 text-center">
                Orçamento Despesas
              </h4>
              <div className="relative" style={{ height: '120px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetExpenseData.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {budgetExpenseData.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xl font-bold text-red-600">
                    {budgetExpenseData.percentage.toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Orçamento:</span>
                  <span className="font-semibold">{formatCurrency(budgetExpenseData.orcamento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balanço:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(budgetExpenseData.orcamento - budgetExpenseData.realizado)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA CENTRAL - Gráfico de Barras e Linha */}
        <div className="col-span-5 space-y-6">
          {/* Gráfico de Barras - Receitas e Despesas */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Receitas e Despesas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="receita" fill={COLORS.primary} name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" fill={COLORS.danger} name="Despesa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Linha - Saldo no final do mês */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Saldo no final do mês</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke={COLORS.accent}
                  strokeWidth={3}
                  dot={{ fill: COLORS.accent, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* COLUNA DIREITA - Tabela de Demonstração */}
        <div className="col-span-3">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Demonstração de Resultado</h3>
            <div className="space-y-3">
              {demonstrationData.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center py-2 ${
                    item.highlight ? 'border-t border-b border-gray-300 bg-blue-50 px-2 rounded' : ''
                  }`}
                >
                  <div className="flex-1">
                    <p className={`text-sm ${item.highlight ? 'font-bold' : 'font-medium'} text-gray-800`}>
                      {item.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm ${item.highlight ? 'font-bold' : 'font-medium'} text-gray-900`}>
                      {formatCurrency(item.value)}
                    </p>
                    <p className="text-xs text-gray-600 w-12 text-right">
                      {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Lucro Líquido - Destaque Final */}
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <div className="flex justify-between items-center bg-green-50 p-3 rounded">
                <p className="text-base font-bold text-gray-900">Lucro Líquido</p>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(dreData.lucro_liquido)}
                  </p>
                  <p className="text-sm text-gray-700 w-12 text-right">
                    {dreData.margem_liquida_percent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
