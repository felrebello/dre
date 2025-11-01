// Componente de visualização do relatório DRE
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  PieChart,
  Settings,
  BarChart3,
  ListChecks,
} from 'lucide-react';
import { DREData, ExpenseEntry, RevenueEntry, fetchExpensesForReport, fetchRevenuesForReport, updateReportDRE, extractYearMonth } from '../lib/firebase';
import { ReconciliationAnalysis, formatCurrency, formatPercent, generateDRE } from '../utils/dreGenerator';
import { exportToPDF, generatePDFFilename, ExportMode } from '../utils/pdfExporter';
import ExpenseManager from './ExpenseManager';
import FinancialDashboard from './FinancialDashboard';
import ExpenseDetailedTable from './ExpenseDetailedTable';
import ExportOptionsMenu from './ExportOptionsMenu';
import { RegimeTributario } from '../types/tax';
import { ClassifiedExpense } from './ExpenseClassification';

interface DREReportProps {
  reportId: string;
  clinicName: string;
  reportMonth: string;
  dreData: DREData;
  reconciliation: ReconciliationAnalysis | null;
  onBack: () => void;
  onNewReport: () => void;
}

export default function DREReport({
  reportId,
  clinicName,
  reportMonth,
  dreData: initialDreData,
  reconciliation,
  onBack,
  onNewReport,
}: DREReportProps) {
  const [showExpenseManager, setShowExpenseManager] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showDetailedExpenses, setShowDetailedExpenses] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [revenues, setRevenues] = useState<RevenueEntry[]>([]);
  const [dreData, setDreData] = useState<DREData>(initialDreData);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Carregar despesas e receitas do banco de dados ao montar o componente
  useEffect(() => {
    loadExpensesAndRevenues();
  }, [reportId]);

  // Função para carregar despesas e receitas do relatório
  const loadExpensesAndRevenues = async () => {
    try {
      // Extrair YYYY-MM do reportMonth
      const yearMonth = extractYearMonth(reportMonth);

      // Buscar despesas e receitas, filtrando apenas pelo mês correto
      const [expensesData, revenuesData] = await Promise.all([
        fetchExpensesForReport(reportId, yearMonth),
        fetchRevenuesForReport(reportId, yearMonth),
      ]);

      setExpenses(expensesData as ExpenseEntry[]);
      setRevenues(revenuesData as RevenueEntry[]);

      console.log('Dados carregados:', {
        despesas: expensesData.length,
        receitas: revenuesData.length,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Função para recalcular o DRE quando despesas mudarem
  const recalculateDRE = async () => {
    setIsRecalculating(true);
    try {
      // Extrair YYYY-MM do reportMonth
      const yearMonth = extractYearMonth(reportMonth);

      // Buscar dados atualizados do banco de dados
      const [freshExpenses, freshRevenues] = await Promise.all([
        fetchExpensesForReport(reportId, yearMonth),
        fetchRevenuesForReport(reportId, yearMonth),
      ]);

      console.log('Dados atualizados carregados:', {
        despesas: freshExpenses.length,
        receitas: freshRevenues.length
      });

      // Atualizar estados com dados frescos
      setExpenses(freshExpenses as ExpenseEntry[]);

      // Converter ExpenseEntry para ClassifiedExpense para o generateDRE
      const classifiedExpenses: ClassifiedExpense[] = (freshExpenses as ExpenseEntry[]).map(exp => ({
        date: exp.date,
        description: exp.description,
        category: exp.category,
        amount: exp.amount,
        tipo_despesa: exp.tipo_despesa || null,
        categoria_personalizada: exp.categoria_personalizada || undefined,
        classificacao_manual: exp.classificacao_manual || false,
        sugestao_automatica: (exp.sugestao_automatica as 'fixa' | 'variavel') || 'fixa',
        e_imposto: exp.e_imposto || false, // Preservar marcação manual de imposto
        tipo_imposto: exp.tipo_imposto || undefined, // Preservar tipo de imposto manual
        categoria_imposto: exp.categoria_imposto || undefined, // Preservar categoria de imposto manual
      }));

      // Gerar novo DRE com dados atualizados
      const newDreData = generateDRE(
        freshRevenues,
        classifiedExpenses,
        [], // Sem transações bancárias no recálculo
        RegimeTributario.SIMPLES_NACIONAL
      );

      console.log('Novo DRE calculado:', {
        receitaBruta: newDreData.receita_bruta,
        lucroLiquido: newDreData.lucro_liquido,
        despesasFixas: newDreData.despesas_fixas,
        despesasVariaveis: newDreData.despesas_variaveis,
      });

      // Atualizar estado do DRE
      setDreData(newDreData);

      // Salvar DRE atualizado no banco de dados
      await updateReportDRE(reportId, newDreData);

      console.log('DRE recalculado e salvo com sucesso');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao recalcular DRE:', error);
      throw error;
    } finally {
      setIsRecalculating(false);
    }
  };

  // Handler para quando despesas mudarem (marca como não salvo)
  const handleExpensesChanged = async () => {
    // Recarregar a lista de despesas para refletir mudanças
    await loadExpensesAndRevenues();
    // Marcar que existem mudanças não salvas
    setHasUnsavedChanges(true);
  };

  // Handler para salvar alterações e recalcular DRE
  const handleSaveAndRecalculate = async () => {
    try {
      await recalculateDRE();
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
    }
  };

  const handleExportPDF = async (mode: ExportMode) => {
    setIsExportingPDF(true);
    setExportProgress(0);

    try {
      const filename = generatePDFFilename(clinicName, reportMonth);

      await exportToPDF({
        filename,
        elementId: 'dre-report-content',
        mode,
        onProgress: (progress) => setExportProgress(progress),
        onSuccess: () => {
          console.log('PDF exportado com sucesso');
        },
        onError: (error) => {
          console.error('Erro ao exportar PDF:', error);
          alert('Erro ao exportar PDF. Por favor, tente novamente.');
        },
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsExportingPDF(false);
      setExportProgress(0);
    }
  };

  // Formatar mês para exibição
  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]} de ${year}`;
  };

  const DRELine = ({
    label,
    value,
    level = 0,
    bold = false,
    highlight = false,
    showPercent,
  }: {
    label: string;
    value: number;
    level?: number;
    bold?: boolean;
    highlight?: boolean;
    showPercent?: number;
  }) => {
    const isNegative = value < 0;
    const textColor = highlight
      ? value >= 0
        ? 'text-emerald-700'
        : 'text-red-700'
      : 'text-gray-900';
    const bgColor = highlight
      ? value >= 0
        ? 'bg-gradient-to-r from-emerald-50 to-emerald-100'
        : 'bg-gradient-to-r from-red-50 to-red-100'
      : level === 0 && bold
      ? 'bg-slate-50'
      : '';

    return (
      <div
        className={`flex justify-between items-center py-4 px-6 transition-colors hover:bg-gray-50 ${
          bgColor
        } ${
          bold ? 'font-bold text-base' : 'text-sm'
        } ${
          highlight ? 'border-l-4 ' + (value >= 0 ? 'border-emerald-500' : 'border-red-500') : ''
        }`}
        style={{ paddingLeft: `${level * 2 + 1.5}rem` }}
      >
        <span className={`${textColor} ${bold ? 'tracking-wide' : ''}`}>{label}</span>
        <div className="flex items-center gap-6">
          {showPercent !== undefined && (
            <span className="text-sm font-semibold text-gray-600 min-w-[90px] text-right bg-gray-100 px-3 py-1 rounded-full">
              {formatPercent(showPercent)}
            </span>
          )}
          <span className={`${textColor} min-w-[180px] text-right font-semibold`}>
            {isNegative && '('}
            {formatCurrency(Math.abs(value))}
            {isNegative && ')'}
          </span>
        </div>
      </div>
    );
  };

  const IndicatorCard = ({
    icon: Icon,
    label,
    value,
    trend,
    color,
  }: {
    icon: any;
    label: string;
    value: string;
    trend?: 'up' | 'down';
    color: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border-t-4" style={{ borderTopColor: color }}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-7 w-7" style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto" id="dre-report-content">
        {/* Logo - visível na tela e na impressão */}
        <div className="flex justify-center mb-8 print:mb-6">
          <img
            src="/Nort logo 2024 ok.png"
            alt="Nort Radiologia Odontológica"
            className="h-20 w-auto object-contain print:h-16"
          />
        </div>

        {/* Cabeçalho */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-800 font-semibold mb-4 flex items-center print:hidden transition-colors no-print"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Relatório DRE
              </h1>
              <p className="text-xl text-gray-600">
                {clinicName} - {formatMonth(reportMonth)}
              </p>
            </div>
            <div className="flex gap-3 print:hidden no-print">
              <button
                onClick={() => setShowExpenseManager(!showExpenseManager)}
                className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all shadow-md hover:shadow-lg flex items-center font-semibold"
              >
                <Settings className="h-5 w-5 mr-2" />
                {showExpenseManager ? 'Ocultar Gerenciador' : 'Gerenciar Despesas'}
              </button>
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg flex items-center font-semibold"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                {showDashboard ? 'Ocultar Dashboard' : 'Visualizar Dashboard'}
              </button>
              <button
                onClick={() => setShowDetailedExpenses(!showDetailedExpenses)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg flex items-center font-semibold"
              >
                <ListChecks className="h-5 w-5 mr-2" />
                {showDetailedExpenses ? 'Ocultar Despesas' : 'Detalhes de Despesas'}
              </button>
              <button
                onClick={onNewReport}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center font-semibold"
              >
                <FileText className="h-5 w-5 mr-2" />
                Novo Relatório
              </button>
              <ExportOptionsMenu
                onExport={handleExportPDF}
                isExporting={isExportingPDF}
                exportProgress={exportProgress}
              />
            </div>
          </div>
        </div>

        {/* Indicador de recálculo */}
        {isRecalculating && (
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-5 mb-6 no-print">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-cyan-600 mr-4"></div>
              <p className="text-cyan-900 font-semibold text-lg">Recalculando DRE...</p>
            </div>
          </div>
        )}

        {/* Indicador de mudanças não salvas */}
        {hasUnsavedChanges && !isRecalculating && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-6 mb-6 shadow-lg no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-amber-100 mr-4 flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-900 font-bold text-lg">Alterações Pendentes</p>
                  <p className="text-amber-800 text-sm mt-1">
                    Você adicionou ou removeu despesas. Clique em "Salvar e Recalcular" para atualizar o DRE.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSaveAndRecalculate}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg font-bold flex items-center whitespace-nowrap"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Salvar e Recalcular
              </button>
            </div>
          </div>
        )}

        {/* Indicadores principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 no-print">
          <IndicatorCard
            icon={DollarSign}
            label="Receita Bruta"
            value={formatCurrency(dreData.receita_bruta)}
            color="#059669"
          />
          <IndicatorCard
            icon={TrendingUp}
            label="Lucro Bruto"
            value={formatCurrency(dreData.lucro_bruto)}
            trend={dreData.lucro_bruto >= 0 ? 'up' : 'down'}
            color="#0891b2"
          />
          <IndicatorCard
            icon={TrendingUp}
            label="Lucro Operacional"
            value={formatCurrency(dreData.lucro_operacional)}
            trend={dreData.lucro_operacional >= 0 ? 'up' : 'down'}
            color="#4f46e5"
          />
          <IndicatorCard
            icon={PieChart}
            label="Lucro Líquido"
            value={formatCurrency(dreData.lucro_liquido)}
            trend={dreData.lucro_liquido >= 0 ? 'up' : 'down'}
            color={dreData.lucro_liquido >= 0 ? '#059669' : '#dc2626'}
          />
        </div>

        {/* Resumo de Despesas Fixas e Variáveis */}
        {(dreData.despesas_fixas > 0 || dreData.despesas_variaveis > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-slate-50">
                  <TrendingDown className="h-7 w-7 text-slate-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Despesas Totais</p>
              <p className="text-3xl font-bold text-slate-700">
                {formatCurrency(dreData.despesas_operacionais.total)}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-cyan-600">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-cyan-50">
                  <TrendingDown className="h-7 w-7 text-cyan-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Despesas Fixas</p>
              <p className="text-3xl font-bold text-cyan-700">
                {formatCurrency(dreData.despesas_fixas)}
              </p>
              <div className="mt-3 bg-cyan-50 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-cyan-700">
                  {dreData.despesas_operacionais.total > 0
                    ? `${((dreData.despesas_fixas / dreData.despesas_operacionais.total) * 100).toFixed(1)}% do total`
                    : '0%'}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-amber-600">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-amber-50">
                  <TrendingDown className="h-7 w-7 text-amber-600" />
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Despesas Variáveis</p>
              <p className="text-3xl font-bold text-amber-700">
                {formatCurrency(dreData.despesas_variaveis)}
              </p>
              <div className="mt-3 bg-amber-50 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-amber-700">
                  {dreData.despesas_operacionais.total > 0
                    ? `${((dreData.despesas_variaveis / dreData.despesas_operacionais.total) * 100).toFixed(1)}% do total`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alertas de reconciliação */}
        {reconciliation && reconciliation.alerts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-start">
              <div className="p-3 rounded-xl bg-amber-100 mr-4 flex-shrink-0">
                <AlertTriangle className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  Atenção: Inconsistências Detectadas
                </h3>
                <ul className="space-y-2">
                  {reconciliation.alerts.map((alert, idx) => (
                    <li key={idx} className="text-amber-800 font-medium flex items-start">
                      <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      <span>{alert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Relatório DRE detalhado */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8 border border-gray-200">
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-6">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Demonstração do Resultado do Exercício (DRE)
            </h2>
            <p className="text-slate-300 text-sm mt-1">Análise detalhada de receitas e despesas</p>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Receita */}
            <DRELine
              label="RECEITA BRUTA"
              value={dreData.receita_bruta}
              bold
            />

            {/* Impostos sobre Receita */}
            <DRELine
              label="(-) IMPOSTOS SOBRE RECEITA"
              value={-dreData.impostos_sobre_receita.total}
              bold
            />
            {dreData.impostos_sobre_receita.simples > 0 && (
              <DRELine
                label="Simples Nacional"
                value={-dreData.impostos_sobre_receita.simples}
                level={1}
              />
            )}
            {dreData.impostos_sobre_receita.pis > 0 && (
              <DRELine
                label="PIS"
                value={-dreData.impostos_sobre_receita.pis}
                level={1}
              />
            )}
            {dreData.impostos_sobre_receita.cofins > 0 && (
              <DRELine
                label="COFINS"
                value={-dreData.impostos_sobre_receita.cofins}
                level={1}
              />
            )}
            {dreData.impostos_sobre_receita.iss > 0 && (
              <DRELine
                label="ISS"
                value={-dreData.impostos_sobre_receita.iss}
                level={1}
              />
            )}
            {dreData.impostos_sobre_receita.icms > 0 && (
              <DRELine
                label="ICMS"
                value={-dreData.impostos_sobre_receita.icms}
                level={1}
              />
            )}
            {dreData.impostos_sobre_receita.outros > 0 && (
              <DRELine
                label="Outros Impostos"
                value={-dreData.impostos_sobre_receita.outros}
                level={1}
              />
            )}

            <DRELine
              label="RECEITA LÍQUIDA"
              value={dreData.receita_liquida}
              bold
              highlight
            />

            {/* Custos */}
            <DRELine
              label="(-) Custo dos Serviços Prestados"
              value={-dreData.custo_servicos}
              level={1}
            />
            <DRELine
              label="LUCRO BRUTO"
              value={dreData.lucro_bruto}
              bold
              highlight
              showPercent={dreData.margem_bruta_percent}
            />

            {/* Despesas Operacionais */}
            <DRELine
              label="(-) DESPESAS OPERACIONAIS"
              value={-dreData.despesas_operacionais.total}
              bold
            />
            {dreData.despesas_operacionais.pessoal > 0 && (
              <DRELine
                label="Despesas com Pessoal"
                value={-dreData.despesas_operacionais.pessoal}
                level={1}
              />
            )}
            {dreData.despesas_operacionais.administrativas > 0 && (
              <DRELine
                label="Despesas Administrativas"
                value={-dreData.despesas_operacionais.administrativas}
                level={1}
              />
            )}
            {dreData.despesas_operacionais.vendas > 0 && (
              <DRELine
                label="Despesas com Vendas e Marketing"
                value={-dreData.despesas_operacionais.vendas}
                level={1}
              />
            )}
            {dreData.despesas_operacionais.financeiras > 0 && (
              <DRELine
                label="Despesas Financeiras"
                value={-dreData.despesas_operacionais.financeiras}
                level={1}
              />
            )}
            {dreData.despesas_operacionais.outras > 0 && (
              <DRELine
                label="Outras Despesas Operacionais"
                value={-dreData.despesas_operacionais.outras}
                level={1}
              />
            )}
            <DRELine
              label="LUCRO OPERACIONAL (EBIT)"
              value={dreData.lucro_operacional}
              bold
              highlight
              showPercent={dreData.margem_operacional_percent}
            />

            {/* Outras Receitas/Despesas */}
            {dreData.outras_receitas_despesas !== 0 && (
              <DRELine
                label={
                  dreData.outras_receitas_despesas >= 0
                    ? '(+) Outras Receitas'
                    : '(-) Outras Despesas'
                }
                value={dreData.outras_receitas_despesas}
                level={1}
              />
            )}
            <DRELine
              label="LUCRO ANTES DOS IMPOSTOS (LAIR)"
              value={dreData.lucro_antes_impostos}
              bold
            />

            {/* Impostos sobre Lucro */}
            <DRELine
              label="(-) IMPOSTOS SOBRE O LUCRO"
              value={-dreData.impostos_sobre_lucro.total}
              bold
            />
            {dreData.impostos_sobre_lucro.irpj > 0 && (
              <DRELine
                label="IRPJ"
                value={-dreData.impostos_sobre_lucro.irpj}
                level={1}
              />
            )}
            {dreData.impostos_sobre_lucro.csll > 0 && (
              <DRELine
                label="CSLL"
                value={-dreData.impostos_sobre_lucro.csll}
                level={1}
              />
            )}
            {dreData.impostos_sobre_lucro.outros > 0 && (
              <DRELine
                label="Outros Impostos"
                value={-dreData.impostos_sobre_lucro.outros}
                level={1}
              />
            )}
            <DRELine
              label="LUCRO LÍQUIDO"
              value={dreData.lucro_liquido}
              bold
              highlight
              showPercent={dreData.margem_liquida_percent}
            />
          </div>
        </div>

        {/* Análise de reconciliação - apenas se houver extrato bancário */}
        {reconciliation ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="p-2 rounded-xl bg-emerald-50 mr-3">
                <CheckCircle className="h-7 w-7 text-emerald-600" />
              </div>
              Análise de Reconciliação Bancária
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Receitas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Receitas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Registrado no Sistema:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(reconciliation.totalRevenuesRecorded)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Créditos Bancários:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(reconciliation.totalBankCredits)}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between p-3 rounded-lg ${
                      Math.abs(reconciliation.revenuesDifference) < 100
                        ? 'bg-green-50'
                        : 'bg-yellow-50'
                    }`}
                  >
                    <span className="text-gray-700">Diferença:</span>
                    <span
                      className={`font-semibold ${
                        Math.abs(reconciliation.revenuesDifference) < 100
                          ? 'text-green-700'
                          : 'text-yellow-700'
                      }`}
                    >
                      {formatCurrency(Math.abs(reconciliation.revenuesDifference))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Despesas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Registrado no Sistema:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(reconciliation.totalExpensesRecorded)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Débitos Bancários:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(reconciliation.totalBankDebits)}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between p-3 rounded-lg ${
                      Math.abs(reconciliation.expensesDifference) < 100
                        ? 'bg-green-50'
                        : 'bg-yellow-50'
                    }`}
                  >
                    <span className="text-gray-700">Diferença:</span>
                    <span
                      className={`font-semibold ${
                        Math.abs(reconciliation.expensesDifference) < 100
                          ? 'text-green-700'
                          : 'text-yellow-700'
                      }`}
                    >
                      {formatCurrency(Math.abs(reconciliation.expensesDifference))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Taxa de reconciliação */}
            <div className="mt-8 p-8 bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl border-2 border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Taxa de Reconciliação</p>
                  <p className="text-5xl font-bold text-slate-800">
                    {formatPercent(reconciliation.reconciliationRate)}
                  </p>
                </div>
                <div
                  className={`px-8 py-4 rounded-2xl shadow-lg ${
                    reconciliation.reconciliationRate >= 95
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                      : reconciliation.reconciliationRate >= 85
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  }`}
                >
                  <span className="font-bold text-lg">
                    {reconciliation.reconciliationRate >= 95
                      ? 'Excelente'
                      : reconciliation.reconciliationRate >= 85
                      ? 'Bom'
                      : 'Atenção'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl p-8 mb-8">
            <div className="flex items-start">
              <div className="p-3 rounded-xl bg-slate-100 mr-4 flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Reconciliação Bancária Não Disponível
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  O relatório foi gerado apenas com as receitas e despesas do sistema.
                  Para visualizar a análise de reconciliação bancária, faça upload do
                  extrato bancário ao gerar um novo relatório.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gerenciador de Despesas */}
        {showExpenseManager && (
          <div className="mb-8 print:hidden">
            <ExpenseManager
              reportId={reportId}
              reportMonth={extractYearMonth(reportMonth)}
              expenses={expenses}
              onExpensesChanged={handleExpensesChanged}
            />
          </div>
        )}

        {/* Dashboard de Gráficos (visível na tela quando ativado, sempre incluído no PDF se modo apropriado) */}
        {showDashboard && (
          <div data-section="dashboard" className="mb-8 w-full">
            <FinancialDashboard dreData={dreData} reportMonth={reportMonth} />
          </div>
        )}

        {/* Tabela Detalhada de Despesas (visível na tela quando ativado, sempre incluído no PDF se modo complete) */}
        <div
          data-section="detailed-expenses"
          style={{ display: showDetailedExpenses ? 'block' : 'none' }}
          className="mb-8"
        >
          <ExpenseDetailedTable expenses={expenses} />
        </div>
      </div>
    </div>
  );
}
