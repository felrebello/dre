// Componente para listar e gerenciar relatórios salvos
import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Eye,
  Copy,
  Trash2,
  Calendar,
  DollarSign,
  BarChart3,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import {
  fetchAllReports,
  searchReports,
  ReportSummary,
  supabase,
  Clinic,
} from '../lib/firebase';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface SavedReportsListProps {
  onViewReport: (reportId: string) => void;
  onDuplicateReport: (reportId: string) => void;
  onDeleteReport: (reportId: string) => void;
  onCompareReports: () => void;
  onBack: () => void;
  onNewReport: () => void;
}

export default function SavedReportsList({
  onViewReport,
  onDuplicateReport,
  onDeleteReport,
  onCompareReports,
  onBack,
  onNewReport,
}: SavedReportsListProps) {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportSummary[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado do modal de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ReportSummary | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Carregar clínicas e relatórios ao montar componente
  useEffect(() => {
    loadData();
  }, []);

  // Aplicar filtros sempre que mudarem
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedClinic, startMonth, endMonth, reports]);

  // Função para carregar dados
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Carregar clínicas
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('*')
        .order('name');

      if (clinicsError) throw clinicsError;
      setClinics(clinicsData || []);

      // Carregar relatórios
      const reportsData = await fetchAllReports();
      setReports(reportsData);
      setFilteredReports(reportsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar relatórios. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para aplicar filtros
  const applyFilters = async () => {
    try {
      const filters = {
        clinicId: selectedClinic !== 'all' ? selectedClinic : undefined,
        startMonth: startMonth || undefined,
        endMonth: endMonth || undefined,
        searchTerm: searchTerm || undefined,
      };

      const filtered = await searchReports(filters);
      setFilteredReports(filtered);
    } catch (err) {
      console.error('Erro ao filtrar relatórios:', err);
    }
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClinic('all');
    setStartMonth('');
    setEndMonth('');
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

  // Calcular estatísticas
  const stats = {
    totalReports: filteredReports.length,
    totalRevenue: filteredReports.reduce((sum, r) => sum + r.receita_bruta, 0),
    totalProfit: filteredReports.reduce((sum, r) => sum + r.lucro_liquido, 0),
    averageMargin: filteredReports.length > 0
      ? filteredReports.reduce((sum, r) => sum + r.margem_liquida_percent, 0) / filteredReports.length
      : 0,
  };

  // Estado de carregamento
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
                Meus Relatórios
              </h1>
              <p className="text-xl text-gray-600">
                Gerencie e compare seus relatórios DRE
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCompareReports}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Comparar Relatórios
              </button>
              <button
                onClick={onNewReport}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Relatório
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total de Relatórios</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReports}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Lucro Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalProfit)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-8 w-8 text-indigo-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Margem Média</p>
            <p className="text-3xl font-bold text-gray-900">{stats.averageMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtros e Busca</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-700 flex items-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>

          {/* Campo de busca sempre visível */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome da clínica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clínica
                </label>
                <select
                  value={selectedClinic}
                  onChange={(e) => setSelectedClinic(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as Clínicas</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período Inicial
                </label>
                <input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período Final
                </label>
                <input
                  type="month"
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Lista de relatórios */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum relatório encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {reports.length === 0
                ? 'Comece criando seu primeiro relatório DRE.'
                : 'Tente ajustar os filtros de busca.'}
            </p>
            <button
              onClick={onNewReport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeiro Relatório
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Cabeçalho do card */}
                <div className={`p-4 ${
                  report.lucro_liquido >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {report.clinic_name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatMonth(report.report_month)}
                      </div>
                    </div>
                    {report.lucro_liquido >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Corpo do card */}
                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Receita Bruta</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(report.receita_bruta)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lucro Líquido</span>
                      <span className={`font-semibold ${
                        report.lucro_liquido >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(report.lucro_liquido)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Margem Líquida</span>
                      <span className={`font-semibold ${
                        report.margem_liquida_percent >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {report.margem_liquida_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewReport(report.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </button>
                    <button
                      onClick={() => onDuplicateReport(report.id)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                      title="Duplicar relatório"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setReportToDelete(report);
                        setDeleteModalOpen(true);
                      }}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                      title="Excluir relatório"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Rodapé do card */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Atualizado em {new Date(report.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {reportToDelete && (
          <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            reportName={reportToDelete.clinic_name}
            reportMonth={reportToDelete.report_month}
            onConfirm={async () => {
              try {
                await onDeleteReport(reportToDelete.id);
                setDeleteModalOpen(false);
                setReportToDelete(null);
                // Recarregar lista de relatórios
                await loadData();
              } catch (err) {
                console.error('Erro ao excluir relatório:', err);
                setError('Erro ao excluir relatório. Tente novamente.');
              }
            }}
            onCancel={() => {
              setDeleteModalOpen(false);
              setReportToDelete(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
