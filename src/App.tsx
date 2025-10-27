// Aplicação principal do sistema de relatório DRE
import { useState } from 'react';
import ClinicSelector from './components/ClinicSelector';
import FileUpload, { UploadedFile } from './components/FileUpload';
import ExpenseClassification, { ClassifiedExpense } from './components/ExpenseClassification';
import DREReport from './components/DREReport';
import SavedReportsList from './components/SavedReportsList';
import ReportsComparison from './components/ReportsComparison';
import { supabase, DREData, fetchReportById, deleteReport, duplicateReport } from './lib/supabase';
import {
  parseRevenuesCSV,
  parseExpensesCSV,
  parseBankStatement,
  ParsedRevenue,
  ParsedExpense,
  BankTransaction,
} from './utils/csvParser';
import { generateDRE, analyzeReconciliation, ReconciliationAnalysis } from './utils/dreGenerator';
import { RegimeTributario } from './types/tax';

type AppState = 'clinic-selection' | 'file-upload' | 'expense-classification' | 'report-view' | 'processing' | 'saved-reports-list' | 'reports-comparison' | 'loading-report' | 'duplicate-modal';

interface ReportData {
  reportId: string;
  dreData: DREData;
  reconciliation: ReconciliationAnalysis | null;
  reportMonth: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>('clinic-selection');
  const [selectedClinic, setSelectedClinic] = useState<{ id: string; name: string } | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Armazenar dados temporários durante o fluxo
  const [tempData, setTempData] = useState<{
    revenues: ParsedRevenue[];
    expenses: ParsedExpense[];
    bankTransactions: BankTransaction[];
    reportMonth: string;
    files: UploadedFile[];
  } | null>(null);

  // Handler: Clínica selecionada
  const handleClinicSelected = (clinicId: string, clinicName: string) => {
    setSelectedClinic({ id: clinicId, name: clinicName });
    setAppState('file-upload');
  };

  // Estado para duplicação de relatório
  const [duplicateReportId, setDuplicateReportId] = useState<string | null>(null);
  const [duplicateMonth, setDuplicateMonth] = useState('');

  // Handler: Voltar para seleção de clínica
  const handleBackToClinicSelection = () => {
    setSelectedClinic(null);
    setReportData(null);
    setTempData(null);
    setError(null);
    setAppState('clinic-selection');
  };

  // Handler: Ir para lista de relatórios salvos
  const handleViewSavedReports = () => {
    setAppState('saved-reports-list');
  };

  // Handler: Voltar da lista de relatórios para seleção de clínica
  const handleBackFromReportsList = () => {
    setAppState('clinic-selection');
  };

  // Handler: Visualizar relatório salvo
  const handleViewSavedReport = async (reportId: string) => {
    setAppState('loading-report');
    setError(null);

    try {
      // Carregar relatório do banco de dados
      const report = await fetchReportById(reportId);

      if (!report.dre_data) {
        throw new Error('Dados do DRE não encontrados no relatório');
      }

      // Definir dados do relatório e clínica
      setSelectedClinic({
        id: report.clinic_id,
        name: report.clinic_name,
      });

      setReportData({
        reportId: report.id,
        dreData: report.dre_data,
        reconciliation: null,
        reportMonth: report.report_month.substring(0, 7),
      });

      setAppState('report-view');
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar relatório. Tente novamente.'
      );
      setAppState('saved-reports-list');
    }
  };

  // Handler: Duplicar relatório
  const handleDuplicateReport = (reportId: string) => {
    setDuplicateReportId(reportId);
    setDuplicateMonth('');
    setAppState('duplicate-modal');
  };

  // Handler: Confirmar duplicação
  const handleConfirmDuplicate = async () => {
    if (!duplicateReportId || !duplicateMonth) {
      setError('Selecione um mês para duplicar o relatório');
      return;
    }

    setAppState('loading-report');
    setError(null);

    try {
      await duplicateReport(duplicateReportId, duplicateMonth);
      setDuplicateReportId(null);
      setDuplicateMonth('');
      setAppState('saved-reports-list');
    } catch (err) {
      console.error('Erro ao duplicar relatório:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao duplicar relatório. Tente novamente.'
      );
      setAppState('saved-reports-list');
    }
  };

  // Handler: Cancelar duplicação
  const handleCancelDuplicate = () => {
    setDuplicateReportId(null);
    setDuplicateMonth('');
    setAppState('saved-reports-list');
  };

  // Handler: Deletar relatório
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.')) {
      return;
    }

    setError(null);

    try {
      await deleteReport(reportId);

      // Se estamos visualizando este relatório, voltar para lista
      if (reportData?.reportId === reportId) {
        setReportData(null);
        setSelectedClinic(null);
        setAppState('saved-reports-list');
      }
    } catch (err) {
      console.error('Erro ao deletar relatório:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao deletar relatório. Tente novamente.'
      );
    }
  };

  // Handler: Ir para comparação de relatórios
  const handleCompareReports = () => {
    setAppState('reports-comparison');
  };

  // Handler: Voltar da visualização para lista de relatórios
  const handleBackToReportsList = () => {
    setReportData(null);
    setSelectedClinic(null);
    setAppState('saved-reports-list');
  };

  // Handler: Novo relatório (mantém mesma clínica)
  const handleNewReport = () => {
    setReportData(null);
    setTempData(null);
    setError(null);
    setAppState('file-upload');
  };

  // Handler: Voltar da classificação para upload
  const handleBackToUpload = () => {
    setTempData(null);
    setError(null);
    setAppState('file-upload');
  };

  // Handler: Arquivos enviados - ir para classificação
  const handleFilesUploaded = async (files: UploadedFile[]) => {
    if (!selectedClinic) return;

    setError(null);

    try {
      // Extrair arquivos por tipo
      const bankFile = files.find((f) => f.type === 'bank');
      const revenuesFile = files.find((f) => f.type === 'revenues');
      const expensesFile = files.find((f) => f.type === 'expenses');

      if (!revenuesFile || !expensesFile) {
        throw new Error('Arquivos de receitas e despesas são obrigatórios');
      }

      // Parsear CSVs
      const revenues = parseRevenuesCSV(revenuesFile.content);
      const expenses = parseExpensesCSV(expensesFile.content);
      const bankTransactions = bankFile ? parseBankStatement(bankFile.content) : [];

      // Obter mês do primeiro registro ou usar atual
      const reportMonth =
        revenues[0]?.date?.substring(0, 7) ||
        new Date().toISOString().substring(0, 7);

      // Armazenar dados temporários e ir para tela de classificação
      setTempData({
        revenues,
        expenses,
        bankTransactions,
        reportMonth,
        files,
      });
      setAppState('expense-classification');
    } catch (err) {
      console.error('Erro ao processar arquivos:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao processar arquivos. Verifique o formato dos CSVs.'
      );
    }
  };

  // Handler: Classificação de despesas completa - gerar DRE
  const handleClassificationComplete = async (classifiedExpenses: ClassifiedExpense[]) => {
    if (!selectedClinic || !tempData) {
      console.error('Dados ausentes:', { selectedClinic, tempData });
      setError('Dados da clínica ou arquivos não encontrados. Por favor, tente novamente.');
      return;
    }

    // Validar que todas as despesas operacionais estão classificadas
    const despesasNaoClassificadas = classifiedExpenses.filter(
      (exp) => !exp.e_imposto && !exp.tipo_despesa
    );

    if (despesasNaoClassificadas.length > 0) {
      console.error('Despesas não classificadas encontradas:', despesasNaoClassificadas.length);
      setError(
        `Existem ${despesasNaoClassificadas.length} despesa(s) operacional(is) sem classificação. Por favor, classifique todas antes de continuar.`
      );
      return;
    }

    console.log('Iniciando geração do DRE...', {
      totalDespesas: classifiedExpenses.length,
      despesasComImposto: classifiedExpenses.filter((e) => e.e_imposto).length,
      despesasFixas: classifiedExpenses.filter((e) => e.tipo_despesa === 'fixa').length,
      despesasVariaveis: classifiedExpenses.filter((e) => e.tipo_despesa === 'variavel').length,
    });

    setAppState('processing');
    setError(null);

    try {
      const { revenues, bankTransactions, reportMonth, files } = tempData;
      const bankFile = files.find((f) => f.type === 'bank');
      const revenuesFile = files.find((f) => f.type === 'revenues');
      const expensesFile = files.find((f) => f.type === 'expenses');

      if (!revenuesFile || !expensesFile) {
        throw new Error('Arquivos de receitas ou despesas não encontrados');
      }

      // Gerar DRE com despesas classificadas (usando Simples Nacional como padrão)
      console.log('Gerando DRE com os dados:', {
        receitas: revenues.length,
        despesas: classifiedExpenses.length,
        transacoesBancarias: bankTransactions.length,
      });

      const dreData = generateDRE(
        revenues,
        classifiedExpenses,
        bankTransactions,
        RegimeTributario.SIMPLES_NACIONAL
      );

      console.log('DRE gerado com sucesso:', {
        receitaBruta: dreData.receita_bruta,
        lucroLiquido: dreData.lucro_liquido,
        despesasFixas: dreData.despesas_fixas,
        despesasVariaveis: dreData.despesas_variaveis,
      });

      // Análise de reconciliação (apenas se houver extrato bancário)
      const reconciliation = bankFile
        ? analyzeReconciliation(revenues, classifiedExpenses, bankTransactions)
        : null;

      // Salvar no banco de dados
      console.log('Salvando relatório no banco de dados...');

      const { data: reportRecord, error: reportError } = await supabase
        .from('financial_reports')
        .insert([
          {
            clinic_id: selectedClinic.id,
            report_month: `${reportMonth}-01`,
            bank_statement_file: bankFile?.name || null,
            revenues_file: revenuesFile.name,
            expenses_file: expensesFile.name,
            status: 'completed',
            dre_data: dreData,
          },
        ])
        .select()
        .single();

      if (reportError) {
        console.error('Erro ao salvar relatório:', reportError);
        throw reportError;
      }

      console.log('Relatório salvo com sucesso, ID:', reportRecord.id);

      // Salvar receitas
      if (revenues.length > 0) {
        console.log('Salvando receitas:', revenues.length);

        const revenueEntries = revenues.map((rev) => ({
          report_id: reportRecord.id,
          date: rev.date,
          description: rev.description,
          category: rev.category,
          amount: rev.amount,
        }));

        const { error: revenuesError } = await supabase
          .from('revenue_entries')
          .insert(revenueEntries);

        if (revenuesError) {
          console.error('Erro ao salvar receitas:', revenuesError);
          throw revenuesError;
        }

        console.log('Receitas salvas com sucesso');
      }

      // Salvar despesas com classificação
      if (classifiedExpenses.length > 0) {
        console.log('Salvando despesas:', classifiedExpenses.length);

        const expenseEntries = classifiedExpenses.map((exp) => ({
          report_id: reportRecord.id,
          date: exp.date,
          description: exp.description,
          category: exp.categoria_personalizada || exp.category,
          amount: exp.amount,
          tipo_despesa: exp.tipo_despesa,
          categoria_personalizada: exp.categoria_personalizada || null,
          classificacao_manual: exp.classificacao_manual,
          sugestao_automatica: exp.sugestao_automatica,
          is_manual_entry: false,
        }));

        const { error: expensesError } = await supabase
          .from('expense_entries')
          .insert(expenseEntries);

        if (expensesError) {
          console.error('Erro ao salvar despesas:', expensesError);
          throw expensesError;
        }

        console.log('Despesas salvas com sucesso');
      }

      // Definir dados do relatório e mudar para visualização
      console.log('Processo completo! Mostrando relatório DRE...');

      setReportData({
        reportId: reportRecord.id,
        dreData,
        reconciliation,
        reportMonth,
      });
      setTempData(null);
      setAppState('report-view');
    } catch (err) {
      console.error('Erro ao processar e salvar relatório:', err);

      // Mensagens de erro mais específicas
      let errorMessage = 'Erro desconhecido ao processar relatório.';

      if (err instanceof Error) {
        errorMessage = err.message;

        // Erros específicos do Supabase
        if (errorMessage.includes('foreign key')) {
          errorMessage = 'Erro de referência no banco de dados. Verifique se a clínica existe.';
        } else if (errorMessage.includes('unique')) {
          errorMessage = 'Já existe um relatório para este mês. Por favor, exclua o anterior primeiro.';
        } else if (errorMessage.includes('null value')) {
          errorMessage = 'Dados obrigatórios ausentes. Verifique os arquivos enviados.';
        }
      }

      setError(errorMessage);
      setAppState('expense-classification');
    }
  };

  // Renderizar tela de carregamento de relatório
  if (appState === 'loading-report') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Carregando Relatório...
          </h2>
        </div>
      </div>
    );
  }

  // Renderizar modal de duplicação
  if (appState === 'duplicate-modal') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Duplicar Relatório</h2>
          <p className="text-gray-600 mb-6">
            Selecione o mês para o qual deseja duplicar este relatório:
          </p>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mês de Referência
            </label>
            <input
              type="month"
              value={duplicateMonth}
              onChange={(e) => setDuplicateMonth(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleCancelDuplicate}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDuplicate}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Duplicar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar tela de processamento
  if (appState === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processando Arquivos...
          </h2>
          <p className="text-gray-600">
            Gerando relatório DRE e analisando dados financeiros
          </p>
        </div>
      </div>
    );
  }

  // Renderizar lista de relatórios salvos
  if (appState === 'saved-reports-list') {
    return (
      <SavedReportsList
        onViewReport={handleViewSavedReport}
        onDuplicateReport={handleDuplicateReport}
        onDeleteReport={handleDeleteReport}
        onCompareReports={handleCompareReports}
        onBack={handleBackFromReportsList}
        onNewReport={() => setAppState('clinic-selection')}
      />
    );
  }

  // Renderizar tela de comparação de relatórios
  if (appState === 'reports-comparison') {
    return (
      <ReportsComparison
        onBack={() => setAppState('saved-reports-list')}
      />
    );
  }

  // Renderizar tela de seleção de clínica
  if (appState === 'clinic-selection') {
    return <ClinicSelector onClinicSelected={handleClinicSelected} onViewSavedReports={handleViewSavedReports} />;
  }

  // Renderizar tela de upload de arquivos
  if (appState === 'file-upload' && selectedClinic) {
    return (
      <>
        <FileUpload
          clinicName={selectedClinic.name}
          onFilesUploaded={handleFilesUploaded}
          onBack={handleBackToClinicSelection}
        />
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md">
            <p className="font-semibold mb-1">Erro ao processar arquivos</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </>
    );
  }

  // Renderizar tela de classificação de despesas
  if (appState === 'expense-classification' && tempData) {
    return (
      <ExpenseClassification
        expenses={tempData.expenses}
        onClassificationComplete={handleClassificationComplete}
        onBack={handleBackToUpload}
      />
    );
  }

  // Renderizar relatório DRE
  if (appState === 'report-view' && selectedClinic && reportData) {
    return (
      <DREReport
        reportId={reportData.reportId}
        clinicName={selectedClinic.name}
        reportMonth={reportData.reportMonth}
        dreData={reportData.dreData}
        reconciliation={reportData.reconciliation}
        onBack={handleBackToReportsList}
        onNewReport={handleNewReport}
      />
    );
  }

  return null;
}

export default App;
