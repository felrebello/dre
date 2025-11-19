// Gerador de relatório DRE (Demonstração do Resultado do Exercício)
import { DREData } from '../lib/firebase';
import {
  ParsedRevenue,
  ParsedExpense,
  BankTransaction,
  categorizeDespesa,
  categorizeReceita,
} from './csvParser';
import { ClassifiedExpense } from '../components/ExpenseClassification';
import {
  ImpostosReceita,
  ImpostosLucro,
  identificarImposto,
  RegimeTributario,
  calcularImpostosAutomaticos,
} from '../types/tax';

// Interface para organizar despesas por categoria
interface CategorizedExpenses {
  [key: string]: number;
}

// Interface para despesas separadas por tipo (impostos, operacionais, etc.)
interface SeparatedExpenses {
  impostosReceita: ParsedExpense[];
  impostosLucro: ParsedExpense[];
  custosServicos: ParsedExpense[];
  despesasOperacionais: ParsedExpense[];
  outrasReceitas: ParsedExpense[];
}

// Gerar relatório DRE completo com despesas classificadas
export function generateDRE(
  revenues: ParsedRevenue[],
  expenses: ParsedExpense[] | ClassifiedExpense[],
  bankTransactions: BankTransaction[],
  regimeTributario: RegimeTributario = RegimeTributario.SIMPLES_NACIONAL
): DREData {
  // Calcular total de receitas
  const receitaBruta = revenues.reduce((sum, rev) => sum + rev.amount, 0);

  // Separar despesas por tipo
  const separatedExpenses = separateExpensesByType(expenses);

  // Calcular impostos sobre receita
  const impostosReceita = calculateImpostosReceita(
    separatedExpenses.impostosReceita,
    receitaBruta,
    regimeTributario
  );

  // Receita líquida
  const receitaLiquida = receitaBruta - impostosReceita.total;

  // Custo dos serviços prestados
  const custoServicos = separatedExpenses.custosServicos.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  // Lucro bruto
  const lucroBruto = receitaLiquida - custoServicos;

  // Calcular despesas operacionais detalhadas
  const despesasOperacionais = calculateDespesasOperacionais(
    separatedExpenses.despesasOperacionais
  );

  // Calcular totais de despesas fixas e variáveis
  const { fixas: despesasFixas, variaveis: despesasVariaveis } =
    calculateTotalExpenses(expenses);

  // Lucro operacional (EBIT)
  const lucroOperacional = lucroBruto - despesasOperacionais.total;

  // Calcular depreciação e amortização
  const { depreciacao, amortizacao } = calculateDepreciacaoAmortizacao(
    separatedExpenses.despesasOperacionais
  );

  // EBITDA = EBIT + Depreciação + Amortização
  const ebitda = lucroOperacional + depreciacao + amortizacao;

  // Outras receitas e despesas não operacionais
  const outrasReceitasDespesas = separatedExpenses.outrasReceitas.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  // Lucro antes dos impostos (LAIR)
  const lucroAntesImpostos = lucroOperacional + outrasReceitasDespesas;

  // Calcular impostos sobre lucro
  const impostosLucro = calculateImpostosLucro(
    separatedExpenses.impostosLucro,
    lucroAntesImpostos,
    receitaBruta,
    regimeTributario
  );

  // Lucro líquido
  const lucroLiquido = lucroAntesImpostos - impostosLucro.total;

  // Calcular margens
  const margemBrutaPercent = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
  const margemOperacionalPercent =
    receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;
  const margemEbitdaPercent = receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0;
  const margemLiquidaPercent = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

  return {
    receita_bruta: receitaBruta,
    impostos_sobre_receita: impostosReceita,
    receita_liquida: receitaLiquida,
    custo_servicos: custoServicos,
    lucro_bruto: lucroBruto,
    despesas_operacionais: despesasOperacionais,
    despesas_fixas: despesasFixas,
    despesas_variaveis: despesasVariaveis,
    lucro_operacional: lucroOperacional,
    depreciacao: depreciacao,
    amortizacao: amortizacao,
    ebitda: ebitda,
    outras_receitas_despesas: outrasReceitasDespesas,
    lucro_antes_impostos: lucroAntesImpostos,
    impostos_sobre_lucro: impostosLucro,
    lucro_liquido: lucroLiquido,
    margem_bruta_percent: margemBrutaPercent,
    margem_operacional_percent: margemOperacionalPercent,
    margem_ebitda_percent: margemEbitdaPercent,
    margem_liquida_percent: margemLiquidaPercent,
  };
}

// Separar despesas por tipo (impostos receita, impostos lucro, operacionais, etc.)
function separateExpensesByType(
  expenses: ParsedExpense[] | ClassifiedExpense[]
): SeparatedExpenses {
  const result: SeparatedExpenses = {
    impostosReceita: [],
    impostosLucro: [],
    custosServicos: [],
    despesasOperacionais: [],
    outrasReceitas: [],
  };

  expenses.forEach((expense) => {
    const isClassifiedExpense = 'e_imposto' in expense;
    const eImpostoManual = isClassifiedExpense ? (expense as ClassifiedExpense).e_imposto : undefined;
    const tipoImpostoManual = isClassifiedExpense && (expense as ClassifiedExpense).tipo_imposto
      ? (expense as ClassifiedExpense).tipo_imposto
      : null;

    // Se foi marcada EXPLICITAMENTE como imposto (e_imposto === true), usar essa classificação
    if (eImpostoManual === true) {
      if (tipoImpostoManual === 'receita') {
        result.impostosReceita.push(expense);
        return;
      } else if (tipoImpostoManual === 'lucro') {
        result.impostosLucro.push(expense);
        return;
      } else {
        // Se não especificou tipo, considerar como imposto sobre receita por padrão
        result.impostosReceita.push(expense);
        return;
      }
    }

    // Se foi EXPLICITAMENTE desmarcada como imposto (e_imposto === false),
    // NÃO fazer verificação automática - respeitar a escolha manual do usuário
    if (eImpostoManual === false) {
      // Continuar para classificação normal (não é imposto)
      // Não fazer return aqui, deixar o código continuar para as próximas verificações
    } else {
      // Se e_imposto é undefined (não foi definido manualmente),
      // verificar automaticamente se é imposto pela descrição
      const impostoInfo = identificarImposto(expense.description);
      if (impostoInfo) {
        if (impostoInfo.tipo === 'receita') {
          result.impostosReceita.push(expense);
          return;
        } else if (impostoInfo.tipo === 'lucro') {
          result.impostosLucro.push(expense);
          return;
        }
      }
    }

    // Verificar se é custo de serviço
    const category = expense.category || categorizeDespesa(expense.description, '');
    if (category === 'Custo dos Serviços') {
      result.custosServicos.push(expense);
      return;
    }

    // Verificar se é receita não operacional (valores negativos podem indicar estornos/receitas)
    if (expense.amount < 0) {
      result.outrasReceitas.push(expense);
      return;
    }

    // Caso contrário, é despesa operacional
    result.despesasOperacionais.push(expense);
  });

  return result;
}

// Calcular impostos sobre receita detalhados
function calculateImpostosReceita(
  impostosExpenses: ParsedExpense[],
  receitaBruta: number,
  regime: RegimeTributario
): ImpostosReceita {
  const result: ImpostosReceita = {
    pis: 0,
    cofins: 0,
    iss: 0,
    icms: 0,
    simples: 0,
    outros: 0,
    total: 0,
  };

  // Somar impostos identificados nas despesas
  impostosExpenses.forEach((expense) => {
    // Verificar se é uma despesa classificada manualmente
    const isClassifiedExpense = 'categoria_imposto' in expense;
    const categoriaManual = isClassifiedExpense
      ? (expense as ClassifiedExpense).categoria_imposto
      : null;

    // Se foi classificado manualmente, usar essa categoria
    if (categoriaManual) {
      const categoriaLower = categoriaManual.toLowerCase();
      if (categoriaLower === 'pis') {
        result.pis += expense.amount;
      } else if (categoriaLower === 'cofins') {
        result.cofins += expense.amount;
      } else if (categoriaLower === 'iss' || categoriaLower === 'issqn') {
        result.iss += expense.amount;
      } else if (categoriaLower === 'icms') {
        result.icms += expense.amount;
      } else if (categoriaLower === 'simples' || categoriaLower === 'simples_nacional') {
        result.simples += expense.amount;
      } else {
        result.outros += expense.amount;
      }
      return; // Já processado, pular para próxima despesa
    }

    // Se não foi classificado manualmente, tentar identificar automaticamente
    const impostoInfo = identificarImposto(expense.description);
    if (!impostoInfo) {
      // Se não conseguiu identificar automaticamente, somar em "outros"
      result.outros += expense.amount;
      return;
    }

    const desc = expense.description.toLowerCase();
    if (desc.includes('pis')) {
      result.pis += expense.amount;
    } else if (desc.includes('cofins')) {
      result.cofins += expense.amount;
    } else if (desc.includes('iss') || desc.includes('issqn')) {
      result.iss += expense.amount;
    } else if (desc.includes('icms')) {
      result.icms += expense.amount;
    } else if (desc.includes('simples') || desc.includes('das')) {
      result.simples += expense.amount;
    } else {
      result.outros += expense.amount;
    }
  });

  result.total =
    result.pis + result.cofins + result.iss + result.icms + result.simples + result.outros;

  // Se não houver impostos registrados, calcular automaticamente
  if (result.total === 0) {
    const calculado = calcularImpostosAutomaticos(regime, receitaBruta);
    return calculado.impostosReceita;
  }

  return result;
}

// Calcular impostos sobre lucro detalhados
function calculateImpostosLucro(
  impostosExpenses: ParsedExpense[],
  lucroAntesImpostos: number,
  receitaBruta: number,
  regime: RegimeTributario
): ImpostosLucro {
  const result: ImpostosLucro = {
    irpj: 0,
    csll: 0,
    outros: 0,
    total: 0,
  };

  // Somar impostos sobre lucro identificados nas despesas
  impostosExpenses.forEach((expense) => {
    // Verificar se é uma despesa classificada manualmente
    const isClassifiedExpense = 'categoria_imposto' in expense;
    const categoriaManual = isClassifiedExpense
      ? (expense as ClassifiedExpense).categoria_imposto
      : null;

    // Se foi classificado manualmente, usar essa categoria
    if (categoriaManual) {
      const categoriaLower = categoriaManual.toLowerCase();
      if (categoriaLower === 'irpj') {
        result.irpj += expense.amount;
      } else if (categoriaLower === 'csll') {
        result.csll += expense.amount;
      } else {
        result.outros += expense.amount;
      }
      return; // Já processado, pular para próxima despesa
    }

    // Se não foi classificado manualmente, tentar identificar automaticamente
    const impostoInfo = identificarImposto(expense.description);
    if (!impostoInfo || impostoInfo.tipo !== 'lucro') {
      // Se não conseguiu identificar automaticamente ou não é imposto sobre lucro, somar em "outros"
      result.outros += expense.amount;
      return;
    }

    const desc = expense.description.toLowerCase();
    if (desc.includes('irpj')) {
      result.irpj += expense.amount;
    } else if (desc.includes('csll')) {
      result.csll += expense.amount;
    } else {
      result.outros += expense.amount;
    }
  });

  result.total = result.irpj + result.csll + result.outros;

  // Se não houver impostos sobre lucro registrados e não for Simples Nacional, calcular
  if (result.total === 0 && regime !== RegimeTributario.SIMPLES_NACIONAL) {
    const calculado = calcularImpostosAutomaticos(regime, receitaBruta, lucroAntesImpostos);
    return calculado.impostosLucro;
  }

  return result;
}

// Calcular despesas operacionais categorizadas
function calculateDespesasOperacionais(despesas: ParsedExpense[]): {
  pessoal: number;
  administrativas: number;
  vendas: number;
  financeiras: number;
  outras: number;
  total: number;
} {
  const result = {
    pessoal: 0,
    administrativas: 0,
    vendas: 0,
    financeiras: 0,
    outras: 0,
    total: 0,
  };

  despesas.forEach((expense) => {
    const category = categorizeDespesa(expense.description, expense.category);

    if (category === 'Pessoal') {
      result.pessoal += expense.amount;
    } else if (category === 'Administrativas') {
      result.administrativas += expense.amount;
    } else if (category === 'Vendas e Marketing') {
      result.vendas += expense.amount;
    } else if (category === 'Despesas Financeiras') {
      result.financeiras += expense.amount;
    } else {
      result.outras += expense.amount;
    }
  });

  result.total =
    result.pessoal + result.administrativas + result.vendas + result.financeiras + result.outras;

  return result;
}

// Calcular depreciação e amortização
function calculateDepreciacaoAmortizacao(despesas: ParsedExpense[]): {
  depreciacao: number;
  amortizacao: number;
} {
  const result = {
    depreciacao: 0,
    amortizacao: 0,
  };

  despesas.forEach((expense) => {
    const desc = expense.description.toLowerCase();

    // Identificar depreciação
    if (desc.includes('deprecia') || desc.includes('depreciação')) {
      result.depreciacao += expense.amount;
    }

    // Identificar amortização
    if (desc.includes('amortiza') || desc.includes('amortização')) {
      result.amortizacao += expense.amount;
    }
  });

  return result;
}

// Calcular total de despesas fixas e variáveis (excluindo impostos)
function calculateTotalExpenses(expenses: ParsedExpense[] | ClassifiedExpense[]): {
  fixas: number;
  variaveis: number;
} {
  let fixas = 0;
  let variaveis = 0;

  expenses.forEach((expense) => {
    // Pular impostos - eles não são classificados como fixos/variáveis
    const isClassifiedExpense = 'e_imposto' in expense;
    const eImpostoManual = isClassifiedExpense ? expense.e_imposto : undefined;

    // Se foi marcada explicitamente como imposto, pular
    if (eImpostoManual === true) {
      return; // Pular impostos
    }

    // Se foi explicitamente desmarcada como imposto (e_imposto === false),
    // NÃO verificar automaticamente - respeitar escolha manual
    // Se e_imposto é undefined, verificar automaticamente
    if (eImpostoManual !== false) {
      const impostoInfo = identificarImposto(expense.description);
      if (impostoInfo) {
        return; // Pular impostos detectados automaticamente
      }
    }

    // Verificar se é ClassifiedExpense com tipo_despesa
    if ('tipo_despesa' in expense && expense.tipo_despesa) {
      if (expense.tipo_despesa === 'fixa') {
        fixas += expense.amount;
      } else if (expense.tipo_despesa === 'variavel') {
        variaveis += expense.amount;
      }
    }
  });

  return { fixas, variaveis };
}

// Análise de reconciliação bancária
export interface ReconciliationAnalysis {
  totalRevenuesRecorded: number;
  totalExpensesRecorded: number;
  totalBankCredits: number;
  totalBankDebits: number;
  revenuesDifference: number;
  expensesDifference: number;
  reconciliationRate: number;
  alerts: string[];
}

// Realizar análise de reconciliação
export function analyzeReconciliation(
  revenues: ParsedRevenue[],
  expenses: ParsedExpense[],
  bankTransactions: BankTransaction[]
): ReconciliationAnalysis {
  // Somar receitas registradas
  const totalRevenuesRecorded = revenues.reduce((sum, rev) => sum + rev.amount, 0);

  // Somar despesas registradas
  const totalExpensesRecorded = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Somar créditos bancários
  const totalBankCredits = bankTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Somar débitos bancários
  const totalBankDebits = bankTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calcular diferenças
  const revenuesDifference = totalBankCredits - totalRevenuesRecorded;
  const expensesDifference = totalBankDebits - totalExpensesRecorded;

  // Taxa de reconciliação (percentual de correspondência)
  const revenueRate =
    totalBankCredits > 0 ? (totalRevenuesRecorded / totalBankCredits) * 100 : 100;
  const expenseRate = totalBankDebits > 0 ? (totalExpensesRecorded / totalBankDebits) * 100 : 100;
  const reconciliationRate = (revenueRate + expenseRate) / 2;

  // Gerar alertas
  const alerts: string[] = [];

  if (Math.abs(revenuesDifference) > totalBankCredits * 0.05) {
    alerts.push(
      `Diferença significativa nas receitas: ${formatCurrency(Math.abs(revenuesDifference))} ${
        revenuesDifference > 0 ? 'a mais no banco' : 'a menos no banco'
      }`
    );
  }

  if (Math.abs(expensesDifference) > totalBankDebits * 0.05) {
    alerts.push(
      `Diferença significativa nas despesas: ${formatCurrency(Math.abs(expensesDifference))} ${
        expensesDifference > 0 ? 'a mais no banco' : 'a menos no banco'
      }`
    );
  }

  if (reconciliationRate < 90) {
    alerts.push('Taxa de reconciliação abaixo de 90% - revisar lançamentos');
  }

  return {
    totalRevenuesRecorded,
    totalExpensesRecorded,
    totalBankCredits,
    totalBankDebits,
    revenuesDifference,
    expensesDifference,
    reconciliationRate,
    alerts,
  };
}

// Formatar valor em moeda brasileira
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formatar percentual
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Agregar despesas por categoria para gráficos
export interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export function aggregateExpensesByCategory(
  expenses: ParsedExpense[] | ClassifiedExpense[]
): CategoryTotal[] {
  const categoryMap = new Map<string, { total: number; count: number }>();

  expenses.forEach((expense) => {
    // Pular impostos
    const isClassifiedExpense = 'e_imposto' in expense;
    const eImpostoManual = isClassifiedExpense ? expense.e_imposto : undefined;

    // Se foi marcada explicitamente como imposto, pular
    if (eImpostoManual === true) return;

    // Se foi explicitamente desmarcada como imposto (e_imposto === false),
    // NÃO verificar automaticamente - respeitar escolha manual
    // Se e_imposto é undefined, verificar automaticamente
    if (eImpostoManual !== false) {
      const impostoInfo = identificarImposto(expense.description);
      if (impostoInfo) return;
    }

    const category = expense.category || categorizeDespesa(expense.description, '');
    const current = categoryMap.get(category) || { total: 0, count: 0 };
    categoryMap.set(category, {
      total: current.total + expense.amount,
      count: current.count + 1,
    });
  });

  const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);
}

// Agregar receitas por categoria para gráficos
export function aggregateRevenuesByCategory(
  revenues: ParsedRevenue[]
): CategoryTotal[] {
  const categoryMap = new Map<string, { total: number; count: number }>();

  revenues.forEach((revenue) => {
    const category = revenue.category || categorizeReceita(revenue.description, '');
    const current = categoryMap.get(category) || { total: 0, count: 0 };
    categoryMap.set(category, {
      total: current.total + revenue.amount,
      count: current.count + 1,
    });
  });

  const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);
}

// Obter as N maiores despesas
export interface TopExpense {
  description: string;
  category: string;
  amount: number;
  date: string;
}

export function getTopExpenses(
  expenses: (ParsedExpense | ClassifiedExpense)[],
  limit: number = 10
): TopExpense[] {
  return expenses
    .filter((expense) => {
      // Pular impostos
      const isClassifiedExpense = 'e_imposto' in expense;
      const eImpostoManual = isClassifiedExpense ? expense.e_imposto : undefined;

      // Se foi marcada explicitamente como imposto, pular
      if (eImpostoManual === true) return false;

      // Se foi explicitamente desmarcada como imposto (e_imposto === false),
      // NÃO verificar automaticamente - respeitar escolha manual
      // Se e_imposto é undefined, verificar automaticamente
      if (eImpostoManual !== false) {
        const impostoInfo = identificarImposto(expense.description);
        if (impostoInfo) return false;
      }

      return true;
    })
    .map((expense) => ({
      description: expense.description,
      category: expense.category || categorizeDespesa(expense.description, ''),
      amount: expense.amount,
      date: expense.date,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}
