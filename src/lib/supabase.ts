// Configuração do cliente Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o banco de dados
export interface Clinic {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialReport {
  id: string;
  clinic_id: string;
  report_month: string;
  bank_statement_file: string | null;
  revenues_file: string | null;
  expenses_file: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  dre_data: DREData | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueEntry {
  id: string;
  report_id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  created_at: string;
}

export interface ExpenseEntry {
  id: string;
  report_id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  tipo_despesa?: 'fixa' | 'variavel' | null;
  categoria_personalizada?: string | null;
  classificacao_manual?: boolean;
  sugestao_automatica?: string | null;
  is_manual_entry?: boolean;
  created_at: string;
}

// Importar tipos de impostos
import { ImpostosReceita, ImpostosLucro } from '../types/tax';

export interface DREData {
  receita_bruta: number;
  impostos_sobre_receita: ImpostosReceita;
  receita_liquida: number;
  custo_servicos: number;
  lucro_bruto: number;
  despesas_operacionais: {
    pessoal: number;
    administrativas: number;
    vendas: number;
    financeiras: number;
    outras: number;
    total: number;
  };
  despesas_fixas: number;
  despesas_variaveis: number;
  lucro_operacional: number;
  outras_receitas_despesas: number;
  lucro_antes_impostos: number;
  impostos_sobre_lucro: ImpostosLucro;
  lucro_liquido: number;
  margem_bruta_percent: number;
  margem_operacional_percent: number;
  margem_liquida_percent: number;
}

// Função auxiliar para extrair ano-mês de uma data no formato YYYY-MM-DD
export function extractYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7); // Retorna YYYY-MM
}

// Função para buscar despesas de um relatório (com filtro opcional por mês)
export async function fetchExpensesForReport(reportId: string, filterByMonth?: string) {
  let query = supabase
    .from('expense_entries')
    .select('*')
    .eq('report_id', reportId)
    .order('date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar despesas:', error);
    throw error;
  }

  // Se filterByMonth foi especificado, filtrar localmente por mês (YYYY-MM)
  if (filterByMonth && data) {
    return data.filter(expense => extractYearMonth(expense.date) === filterByMonth);
  }

  return data || [];
}

// Função para buscar receitas de um relatório (com filtro opcional por mês)
export async function fetchRevenuesForReport(reportId: string, filterByMonth?: string) {
  let query = supabase
    .from('revenue_entries')
    .select('*')
    .eq('report_id', reportId)
    .order('date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar receitas:', error);
    throw error;
  }

  // Se filterByMonth foi especificado, filtrar localmente por mês (YYYY-MM)
  if (filterByMonth && data) {
    return data.filter(revenue => extractYearMonth(revenue.date) === filterByMonth);
  }

  return data || [];
}

// Função para adicionar despesa manual
export async function addManualExpense(
  reportId: string,
  expense: Omit<ExpenseEntry, 'id' | 'created_at' | 'report_id' | 'is_manual_entry'>
) {
  const { data, error } = await supabase
    .from('expense_entries')
    .insert([
      {
        report_id: reportId,
        ...expense,
        is_manual_entry: true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar despesa manual:', error);
    throw error;
  }

  return data;
}

// Função para deletar despesa
export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from('expense_entries')
    .delete()
    .eq('id', expenseId);

  if (error) {
    console.error('Erro ao deletar despesa:', error);
    throw error;
  }
}

// Função para atualizar DRE no relatório
export async function updateReportDRE(reportId: string, dreData: DREData) {
  const { error } = await supabase
    .from('financial_reports')
    .update({
      dre_data: dreData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    console.error('Erro ao atualizar DRE:', error);
    throw error;
  }
}

// Interface para resumo de relatório na listagem
export interface ReportSummary {
  id: string;
  clinic_id: string;
  clinic_name: string;
  report_month: string;
  receita_bruta: number;
  lucro_liquido: number;
  margem_liquida_percent: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Função para buscar todos os relatórios com informações da clínica
export async function fetchAllReports(): Promise<ReportSummary[]> {
  const { data, error } = await supabase
    .from('financial_reports')
    .select(`
      id,
      clinic_id,
      report_month,
      status,
      dre_data,
      created_at,
      updated_at,
      clinics (name)
    `)
    .order('report_month', { ascending: false });

  if (error) {
    console.error('Erro ao buscar relatórios:', error);
    throw error;
  }

  // Transformar dados para formato de resumo
  return (data || []).map(report => ({
    id: report.id,
    clinic_id: report.clinic_id,
    clinic_name: (report.clinics as any)?.name || 'Clínica desconhecida',
    report_month: report.report_month,
    receita_bruta: report.dre_data?.receita_bruta || 0,
    lucro_liquido: report.dre_data?.lucro_liquido || 0,
    margem_liquida_percent: report.dre_data?.margem_liquida_percent || 0,
    status: report.status,
    created_at: report.created_at,
    updated_at: report.updated_at,
  }));
}

// Função para buscar relatório completo por ID
export async function fetchReportById(reportId: string) {
  const { data, error } = await supabase
    .from('financial_reports')
    .select(`
      *,
      clinics (name)
    `)
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar relatório:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Relatório não encontrado');
  }

  return {
    ...data,
    clinic_name: (data.clinics as any)?.name || 'Clínica desconhecida',
  };
}

// Função para buscar relatórios com filtros
export async function searchReports(filters: {
  clinicId?: string;
  startMonth?: string;
  endMonth?: string;
  searchTerm?: string;
}): Promise<ReportSummary[]> {
  let query = supabase
    .from('financial_reports')
    .select(`
      id,
      clinic_id,
      report_month,
      status,
      dre_data,
      created_at,
      updated_at,
      clinics (name)
    `);

  // Aplicar filtro de clínica
  if (filters.clinicId) {
    query = query.eq('clinic_id', filters.clinicId);
  }

  // Aplicar filtro de período
  if (filters.startMonth) {
    query = query.gte('report_month', `${filters.startMonth}-01`);
  }
  if (filters.endMonth) {
    query = query.lte('report_month', `${filters.endMonth}-01`);
  }

  query = query.order('report_month', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar relatórios:', error);
    throw error;
  }

  // Transformar dados para formato de resumo
  let reports = (data || []).map(report => ({
    id: report.id,
    clinic_id: report.clinic_id,
    clinic_name: (report.clinics as any)?.name || 'Clínica desconhecida',
    report_month: report.report_month,
    receita_bruta: report.dre_data?.receita_bruta || 0,
    lucro_liquido: report.dre_data?.lucro_liquido || 0,
    margem_liquida_percent: report.dre_data?.margem_liquida_percent || 0,
    status: report.status,
    created_at: report.created_at,
    updated_at: report.updated_at,
  }));

  // Filtrar por termo de busca (nome da clínica)
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    reports = reports.filter(r => r.clinic_name.toLowerCase().includes(term));
  }

  return reports;
}

// Função para buscar múltiplos relatórios para comparação
export async function fetchReportsForComparison(reportIds: string[]) {
  const { data, error } = await supabase
    .from('financial_reports')
    .select(`
      *,
      clinics (name)
    `)
    .in('id', reportIds)
    .order('report_month', { ascending: true });

  if (error) {
    console.error('Erro ao buscar relatórios para comparação:', error);
    throw error;
  }

  return (data || []).map(report => ({
    ...report,
    clinic_name: (report.clinics as any)?.name || 'Clínica desconhecida',
  }));
}

// Função para deletar relatório (cascade irá deletar entradas relacionadas)
export async function deleteReport(reportId: string) {
  const { error } = await supabase
    .from('financial_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Erro ao deletar relatório:', error);
    throw error;
  }
}

// Função para duplicar relatório
export async function duplicateReport(reportId: string, newMonth: string) {
  // Buscar relatório original
  const originalReport = await fetchReportById(reportId);
  const [revenues, expenses] = await Promise.all([
    fetchRevenuesForReport(reportId),
    fetchExpensesForReport(reportId),
  ]);

  // Criar novo relatório
  const { data: newReport, error: reportError } = await supabase
    .from('financial_reports')
    .insert([{
      clinic_id: originalReport.clinic_id,
      report_month: `${newMonth}-01`,
      bank_statement_file: originalReport.bank_statement_file,
      revenues_file: originalReport.revenues_file,
      expenses_file: originalReport.expenses_file,
      status: 'completed',
      dre_data: originalReport.dre_data,
    }])
    .select()
    .single();

  if (reportError) {
    console.error('Erro ao duplicar relatório:', reportError);
    throw reportError;
  }

  // Copiar receitas
  if (revenues.length > 0) {
    const newRevenues = revenues.map(r => ({
      report_id: newReport.id,
      date: r.date.replace(extractYearMonth(r.date), newMonth),
      description: r.description,
      category: r.category,
      amount: r.amount,
    }));

    const { error: revenuesError } = await supabase
      .from('revenue_entries')
      .insert(newRevenues);

    if (revenuesError) {
      console.error('Erro ao copiar receitas:', revenuesError);
      throw revenuesError;
    }
  }

  // Copiar despesas
  if (expenses.length > 0) {
    const newExpenses = expenses.map(e => ({
      report_id: newReport.id,
      date: e.date.replace(extractYearMonth(e.date), newMonth),
      description: e.description,
      category: e.category,
      amount: e.amount,
      tipo_despesa: e.tipo_despesa,
      categoria_personalizada: e.categoria_personalizada,
      classificacao_manual: e.classificacao_manual,
      sugestao_automatica: e.sugestao_automatica,
      is_manual_entry: e.is_manual_entry,
    }));

    const { error: expensesError } = await supabase
      .from('expense_entries')
      .insert(newExpenses);

    if (expensesError) {
      console.error('Erro ao copiar despesas:', expensesError);
      throw expensesError;
    }
  }

  return newReport;
}
