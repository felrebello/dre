// Componente para comparação histórica de relatórios DRE
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  Download,
} from 'lucide-react';
import {
  fetchAllReports,
  ReportSummary,
  fetchReportById,
  extractYearMonth,
} from '../lib/supabase';

interface ReportsComparisonProps {
  onBack: () => void;
}

interface ComparisonData {
  id: string;
  clinic_name: string;
  month: string;
  receita_bruta: number;
  receita_liquida: number;
  lucro_bruto: number;
  lucro_operacional: number;
  lucro_liquido: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  despesas_totais: number;
  margem_bruta: number;
  margem_operacional: number;
  margem_liquida: number;
}

export default function ReportsComparison({ onBack }: ReportsComparisonProps) {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  // Carregar relatórios disponíveis
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await fetchAllReports();
      setReports(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar mês
  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para selecionar/desselecionar relatório
  const toggleReportSelection = (reportId: string) => {
    if (selectedReports.includes(reportId)) {
      setSelectedReports(selectedReports.filter((id) => id !== reportId));
    } else {
      if (selectedReports.length >= 24) {
        alert('Você pode comparar no máximo 24 relatórios');
        return;
      }
      setSelectedReports([...selectedReports, reportId]);
    }
  };

  // Função para comparar relatórios selecionados
  const handleCompare = async () => {
    if (selectedReports.length < 2) {
      alert('Selecione pelo menos 2 relatórios para comparar');
      return;
    }

    setComparing(true);
    try {
      const dataPromises = selectedReports.map(async (reportId) => {
        const report = await fetchReportById(reportId);
        return {
          id: report.id,
          clinic_name: report.clinic_name,
          month: extractYearMonth(report.report_month),
          receita_bruta: report.dre_data?.receita_bruta || 0,
          receita_liquida: report.dre_data?.receita_liquida || 0,
          lucro_bruto: report.dre_data?.lucro_bruto || 0,
          lucro_operacional: report.dre_data?.lucro_operacional || 0,
          lucro_liquido: report.dre_data?.lucro_liquido || 0,
          despesas_fixas: report.dre_data?.despesas_fixas || 0,
          despesas_variaveis: report.dre_data?.despesas_variaveis || 0,
          despesas_totais: report.dre_data?.despesas_operacionais.total || 0,
          margem_bruta: report.dre_data?.margem_bruta_percent || 0,
          margem_operacional: report.dre_data?.margem_operacional_percent || 0,
          margem_liquida: report.dre_data?.margem_liquida_percent || 0,
        };
      });

      const data = await Promise.all(dataPromises);

      // Ordenar por mês
      data.sort((a, b) => a.month.localeCompare(b.month));

      setComparisonData(data);
    } catch (error) {
      console.error('Erro ao comparar relatórios:', error);
      alert('Erro ao carregar dados para comparação');
    } finally {
      setComparing(false);
    }
  };

  // Função para calcular variação percentual
  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Carregando Relatórios...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Comparação de Relatórios
              </h1>
              <p className="text-xl text-gray-600">
                Compare até 24 relatórios para análise de tendências
              </p>
            </div>
          </div>
        </div>

        {comparisonData.length === 0 ? (
          <>
            {/* Informações */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Selecionados: {selectedReports.length} / 24 relatórios
                  </h3>
                  <p className="text-blue-800">
                    Selecione pelo menos 2 relatórios para começar a comparação.
                    Você pode comparar até 24 relatórios simultaneamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de relatórios para seleção */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Selecione os Relatórios
                </h2>
                <button
                  onClick={handleCompare}
                  disabled={selectedReports.length < 2 || comparing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {comparing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Carregando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Comparar Selecionados
                    </>
                  )}
                </button>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Nenhum relatório disponível para comparação.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((report) => (
                    <label
                      key={report.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedReports.includes(report.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => toggleReportSelection(report.id)}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">
                            {report.clinic_name}
                          </span>
                          {report.lucro_liquido >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatMonth(report.report_month)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Botão para nova comparação */}
            <div className="mb-8 flex justify-end">
              <button
                onClick={() => {
                  setComparisonData([]);
                  setSelectedReports([]);
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Nova Comparação
              </button>
            </div>

            {/* Tabela de comparação */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                        Métrica
                      </th>
                      {comparisonData.map((report) => (
                        <th
                          key={report.id}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div>{report.clinic_name}</div>
                          <div className="text-gray-400 font-normal">
                            {formatMonth(report.month)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Receita Bruta */}
                    <tr className="bg-green-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-green-50">
                        Receita Bruta
                      </td>
                      {comparisonData.map((report, idx) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="font-semibold text-green-700">
                            {formatCurrency(report.receita_bruta)}
                          </div>
                          {idx > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {calculateVariation(
                                report.receita_bruta,
                                comparisonData[idx - 1].receita_bruta
                              ).toFixed(1)}%
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Receita Líquida */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        Receita Líquida
                      </td>
                      {comparisonData.map((report, idx) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="font-semibold">
                            {formatCurrency(report.receita_liquida)}
                          </div>
                          {idx > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {calculateVariation(
                                report.receita_liquida,
                                comparisonData[idx - 1].receita_liquida
                              ).toFixed(1)}%
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Despesas Fixas */}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-blue-50">
                        Despesas Fixas
                      </td>
                      {comparisonData.map((report, idx) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="font-semibold text-blue-700">
                            {formatCurrency(report.despesas_fixas)}
                          </div>
                          {idx > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {calculateVariation(
                                report.despesas_fixas,
                                comparisonData[idx - 1].despesas_fixas
                              ).toFixed(1)}%
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Despesas Variáveis */}
                    <tr className="bg-orange-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-orange-50">
                        Despesas Variáveis
                      </td>
                      {comparisonData.map((report, idx) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="font-semibold text-orange-700">
                            {formatCurrency(report.despesas_variaveis)}
                          </div>
                          {idx > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {calculateVariation(
                                report.despesas_variaveis,
                                comparisonData[idx - 1].despesas_variaveis
                              ).toFixed(1)}%
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Lucro Bruto */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        Lucro Bruto
                      </td>
                      {comparisonData.map((report, idx) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className={`font-semibold ${report.lucro_bruto >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(report.lucro_bruto)}
                          </div>
                          {idx > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {calculateVariation(
                                report.lucro_bruto,
                                comparisonData[idx - 1].lucro_bruto
                              ).toFixed(1)}%
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Lucro Operacional */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        Lucro Operacional
                      </td>
                      {comparisonData.map((report, idx) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className={`font-semibold ${report.lucro_operacional >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(report.lucro_operacional)}
                          </div>
                          {idx > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {calculateVariation(
                                report.lucro_operacional,
                                comparisonData[idx - 1].lucro_operacional
                              ).toFixed(1)}%
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Lucro Líquido */}
                    <tr className="bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-gray-100">
                        Lucro Líquido
                      </td>
                      {comparisonData.map((report, idx) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className={`font-bold text-lg ${report.lucro_liquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(report.lucro_liquido)}
                          </div>
                          {idx > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {calculateVariation(
                                report.lucro_liquido,
                                comparisonData[idx - 1].lucro_liquido
                              ).toFixed(1)}%
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Margem Bruta */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        Margem Bruta (%)
                      </td>
                      {comparisonData.map((report) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold">
                          {report.margem_bruta.toFixed(1)}%
                        </td>
                      ))}
                    </tr>

                    {/* Margem Operacional */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        Margem Operacional (%)
                      </td>
                      {comparisonData.map((report) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold">
                          {report.margem_operacional.toFixed(1)}%
                        </td>
                      ))}
                    </tr>

                    {/* Margem Líquida */}
                    <tr className="bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-gray-100">
                        Margem Líquida (%)
                      </td>
                      {comparisonData.map((report) => (
                        <td key={report.id} className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-lg">
                          {report.margem_liquida.toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumo da análise */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Análise de Tendências</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Melhor performance */}
                <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Melhor Performance
                  </h3>
                  {(() => {
                    const best = [...comparisonData].sort((a, b) => b.lucro_liquido - a.lucro_liquido)[0];
                    return (
                      <div>
                        <p className="text-green-800 mb-2">
                          <strong>{best.clinic_name}</strong> - {formatMonth(best.month)}
                        </p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(best.lucro_liquido)}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Margem Líquida: {best.margem_liquida.toFixed(1)}%
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Maior crescimento */}
                <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Maior Crescimento
                  </h3>
                  {(() => {
                    if (comparisonData.length < 2) {
                      return <p className="text-blue-800">Não há dados suficientes</p>;
                    }
                    let maxGrowth = -Infinity;
                    let maxGrowthIndex = 1;
                    for (let i = 1; i < comparisonData.length; i++) {
                      const growth = calculateVariation(
                        comparisonData[i].lucro_liquido,
                        comparisonData[i - 1].lucro_liquido
                      );
                      if (growth > maxGrowth) {
                        maxGrowth = growth;
                        maxGrowthIndex = i;
                      }
                    }
                    const report = comparisonData[maxGrowthIndex];
                    return (
                      <div>
                        <p className="text-blue-800 mb-2">
                          <strong>{report.clinic_name}</strong> - {formatMonth(report.month)}
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          +{maxGrowth.toFixed(1)}%
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          vs mês anterior
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
