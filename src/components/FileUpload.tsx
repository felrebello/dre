// Componente de upload de arquivos (extrato, receitas e despesas)
import { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { parseRevenuesCSV, parseExpensesCSV, parseBankStatement } from '../utils/csvParser';
import {
  readExcelFile,
  parseRevenuesExcel,
  parseExpensesExcel,
  parseBankStatementExcel,
  isExcelFile
} from '../utils/excelParser';

export interface UploadedFile {
  name: string;
  content: string;
  type: 'bank' | 'revenues' | 'expenses';
}

interface FileUploadProps {
  clinicName: string;
  onFilesUploaded: (files: UploadedFile[]) => void;
  onBack: () => void;
}

export default function FileUpload({ clinicName, onFilesUploaded, onBack }: FileUploadProps) {
  const [bankFile, setBankFile] = useState<UploadedFile | null>(null);
  const [revenuesFile, setRevenuesFile] = useState<UploadedFile | null>(null);
  const [expensesFile, setExpensesFile] = useState<UploadedFile | null>(null);
  const [reportMonth, setReportMonth] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    revenues: number;
    expenses: number;
    revenuesTotal: number;
    expensesTotal: number;
    bankCredits: number;
    bankDebits: number;
  } | null>(null);

  // Função para ler arquivo CSV
  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  // Função para processar arquivo (CSV ou Excel)
  const processFile = async (file: File): Promise<{ content: string; isExcel: boolean }> => {
    if (isExcelFile(file.name)) {
      console.log('Arquivo Excel detectado:', file.name);
      // Para Excel, vamos converter para CSV-like string para manter compatibilidade
      const rows = await readExcelFile(file);
      // Converter array de arrays em string CSV
      const csvContent = rows.map(row => row.join(',')).join('\n');
      return { content: csvContent, isExcel: true };
    } else {
      console.log('Arquivo CSV/TXT detectado:', file.name);
      const content = await readFile(file);
      return { content, isExcel: false };
    }
  };

  // Handler para upload de arquivo
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'bank' | 'revenues' | 'expenses'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validExtensions = ['.csv', '.txt', '.xlsx', '.xls'];
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValid) {
      setError('Por favor, selecione apenas arquivos CSV, TXT ou Excel (.xlsx, .xls)');
      return;
    }

    setError(null);

    try {
      const { content } = await processFile(file);
      const uploadedFile: UploadedFile = {
        name: file.name,
        content,
        type,
      };

      // Atualizar estado baseado no tipo
      if (type === 'bank') setBankFile(uploadedFile);
      else if (type === 'revenues') setRevenuesFile(uploadedFile);
      else if (type === 'expenses') setExpensesFile(uploadedFile);
    } catch (err) {
      setError('Erro ao ler o arquivo. Tente novamente.');
      console.error('Erro ao ler arquivo:', err);
    }
  };

  // Remover arquivo
  const removeFile = (type: 'bank' | 'revenues' | 'expenses') => {
    if (type === 'bank') setBankFile(null);
    else if (type === 'revenues') setRevenuesFile(null);
    else if (type === 'expenses') setExpensesFile(null);
  };

  // Visualizar prévia dos dados
  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportMonth) {
      setError('Por favor, selecione o mês de referência');
      return;
    }

    if (!revenuesFile || !expensesFile) {
      setError('Por favor, faça upload dos arquivos de receitas e despesas');
      return;
    }

    try {
      console.log('\n\n====================================');
      console.log('INICIANDO PRÉVIA DOS DADOS');
      console.log('====================================\n');

      const revenues = parseRevenuesCSV(revenuesFile.content);
      const expenses = parseExpensesCSV(expensesFile.content);
      const bankTransactions = bankFile ? parseBankStatement(bankFile.content) : [];

      const revenuesTotal = revenues.reduce((sum, r) => sum + r.amount, 0);
      const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
      const bankCredits = bankTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      const bankDebits = bankTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      console.log('\n====================================');
      console.log('RESUMO DA PRÉVIA');
      console.log('====================================');
      console.log('Receitas:', revenues.length, 'registros, Total:', revenuesTotal);
      console.log('Despesas:', expenses.length, 'registros, Total:', expensesTotal);
      console.log('Transações bancárias:', bankTransactions.length);
      console.log('  - Créditos:', bankCredits);
      console.log('  - Débitos:', bankDebits);
      console.log('====================================\n\n');

      setPreviewData({
        revenues: revenues.length,
        expenses: expenses.length,
        revenuesTotal,
        expensesTotal,
        bankCredits,
        bankDebits,
      });
      setShowPreview(true);
      setError(null);
    } catch (err) {
      console.error('Erro ao gerar prévia:', err);
      setError('Erro ao processar arquivos. Verifique o console do navegador (F12) para mais detalhes.');
    }
  };

  // Processar arquivos
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!revenuesFile || !expensesFile) {
      setError('Por favor, faça upload dos arquivos de receitas e despesas');
      return;
    }

    console.log('\n\n====================================');
    console.log('PROCESSANDO ARQUIVOS PARA GERAR DRE');
    console.log('====================================\n');

    const files: UploadedFile[] = [revenuesFile, expensesFile];
    if (bankFile) {
      files.unshift(bankFile);
    }
    onFilesUploaded(files);
  };

  // Componente de card de arquivo
  const FileCard = ({
    title,
    description,
    file,
    type,
    accept,
  }: {
    title: string;
    description: string;
    file: UploadedFile | null;
    type: 'bank' | 'revenues' | 'expenses';
    accept: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <FileText className="h-8 w-8 text-blue-600" />
      </div>

      {file ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-700 truncate">{file.name}</span>
          </div>
          <button
            type="button"
            onClick={() => removeFile(type)}
            className="ml-2 p-1 hover:bg-green-100 rounded transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">Clique para fazer upload</span>
          <span className="text-xs text-gray-500 mt-1">CSV, TXT ou Excel</span>
          <input
            type="file"
            accept={accept}
            onChange={(e) => handleFileUpload(e, type)}
            className="hidden"
          />
        </label>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/Nort logo 2024 ok.png"
            alt="Nort Radiologia Odontológica"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Cabeçalho */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center"
          >
            ← Voltar para seleção de clínicas
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload de Arquivos Financeiros
          </h1>
          <p className="text-lg text-gray-600">
            Clínica: <span className="font-semibold text-gray-900">{clinicName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seletor de mês */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
            <label htmlFor="reportMonth" className="block text-lg font-semibold text-gray-900 mb-2">
              Mês de Referência
            </label>
            <input
              id="reportMonth"
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              required
            />
          </div>

          {/* Cards de upload */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FileCard
              title="Extrato Bancário (Opcional)"
              description="CSV, TXT ou Excel - para reconciliação"
              file={bankFile}
              type="bank"
              accept=".csv,.txt,.xlsx,.xls"
            />
            <FileCard
              title="Receitas do Sistema"
              description="CSV ou Excel (.xlsx, .xls)"
              file={revenuesFile}
              type="revenues"
              accept=".csv,.xlsx,.xls"
            />
            <FileCard
              title="Despesas do Sistema"
              description="CSV ou Excel (.xlsx, .xls)"
              file={expensesFile}
              type="expenses"
              accept=".csv,.xlsx,.xls"
            />
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Preview dos dados */}
          {showPreview && previewData && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-blue-600" />
                Prévia dos Dados Carregados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Receitas</p>
                  <p className="text-2xl font-bold text-green-700">
                    {previewData.revenues} registros
                  </p>
                  <p className="text-lg text-green-600 mt-2">
                    R$ {previewData.revenuesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Despesas</p>
                  <p className="text-2xl font-bold text-red-700">
                    {previewData.expenses} registros
                  </p>
                  <p className="text-lg text-red-600 mt-2">
                    R$ {previewData.expensesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Extrato Bancário</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Créditos: <span className="font-semibold text-green-700">
                      R$ {previewData.bankCredits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Débitos: <span className="font-semibold text-red-700">
                      R$ {previewData.bankDebits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              </div>
              {(previewData.revenues === 0 || previewData.expenses === 0 ||
                previewData.revenuesTotal === 0 || previewData.expensesTotal === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-semibold mb-2">⚠️ Atenção!</p>
                  <p className="text-sm text-yellow-700">
                    Alguns arquivos estão sem dados ou com valores zerados.
                    Verifique o console do navegador (pressione F12) para ver detalhes do processamento.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    <strong>Formato esperado dos CSVs:</strong><br/>
                    - Linha 1: Cabeçalho (será ignorada)<br/>
                    - Demais linhas: Data, Descrição, Categoria, Valor<br/>
                    - Separador: vírgula (,) ou ponto-e-vírgula (;)<br/>
                    - Valores: podem usar vírgula ou ponto como decimal
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!revenuesFile || !expensesFile || !reportMonth}
              className="px-6 py-3 bg-gray-600 text-white text-lg font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl flex items-center"
            >
              <Eye className="h-5 w-5 mr-2" />
              Visualizar Prévia
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!revenuesFile || !expensesFile || !reportMonth}
              className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
            >
              Processar e Gerar DRE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
