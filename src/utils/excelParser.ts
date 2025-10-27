// Utilitário para parsear arquivos Excel (.xlsx, .xls)
import * as XLSX from 'xlsx';
import {
  ParsedRevenue,
  ParsedExpense,
  BankTransaction,
  parseAmount,
  normalizeDate,
  categorizeReceita,
  categorizeDespesa
} from './csvParser';

// Ler arquivo Excel e converter para array de arrays (similar ao CSV)
export function readExcelFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Não foi possível ler o arquivo'));
          return;
        }

        // Ler o arquivo Excel
        const workbook = XLSX.read(data, { type: 'array' });

        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converter para array de arrays
        // raw: false para manter valores formatados
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: ''
        });

        console.log('Excel parseado:', jsonData.length, 'linhas');

        // Converter para string[][]
        const stringData: string[][] = jsonData.map(row =>
          row.map(cell => {
            if (cell === null || cell === undefined) return '';
            return String(cell).trim();
          })
        );

        resolve(stringData);
      } catch (error) {
        console.error('Erro ao parsear Excel:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Parsear Excel de receitas
export function parseRevenuesExcel(rows: string[][]): ParsedRevenue[] {
  console.log('=== PARSEANDO RECEITAS DO EXCEL ===');
  console.log('Total de linhas encontradas:', rows.length);
  console.log('Primeira linha (cabeçalho):', rows[0]);
  if (rows.length > 1) {
    console.log('Segunda linha (primeiro dado):', rows[1]);
  }

  const revenues: ParsedRevenue[] = [];

  // Assumir que a primeira linha é cabeçalho
  // Formato esperado: Data, Descrição, Categoria, Valor
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 4 || !row[0]) {
      console.log(`Linha ${i} ignorada - menos de 4 colunas ou vazia:`, row);
      continue;
    }

    const [dateStr, description, category, amountStr] = row;
    console.log(`Linha ${i}: data="${dateStr}", desc="${description}", cat="${category}", valor="${amountStr}"`);

    // Converter valor
    const amount = parseAmount(amountStr);
    console.log(`  -> Valor parseado: ${amount}`);

    if (amount > 0) {
      revenues.push({
        date: normalizeDate(dateStr),
        description: description || 'Receita sem descrição',
        category: categorizeReceita(description, category),
        amount,
      });
    } else {
      console.log(`  -> Linha ignorada - valor inválido ou zero`);
    }
  }

  console.log(`Total de receitas parseadas: ${revenues.length}`);
  console.log('Soma total:', revenues.reduce((sum, r) => sum + r.amount, 0));
  return revenues;
}

// Parsear Excel de despesas
export function parseExpensesExcel(rows: string[][]): ParsedExpense[] {
  console.log('=== PARSEANDO DESPESAS DO EXCEL ===');
  console.log('Total de linhas encontradas:', rows.length);
  console.log('Primeira linha (cabeçalho):', rows[0]);
  if (rows.length > 1) {
    console.log('Segunda linha (primeiro dado):', rows[1]);
  }

  const expenses: ParsedExpense[] = [];

  // Assumir que a primeira linha é cabeçalho
  // Formato esperado: Data, Descrição, Categoria, Valor
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 4 || !row[0]) {
      console.log(`Linha ${i} ignorada - menos de 4 colunas ou vazia:`, row);
      continue;
    }

    const [dateStr, description, category, amountStr] = row;
    console.log(`Linha ${i}: data="${dateStr}", desc="${description}", cat="${category}", valor="${amountStr}"`);

    // Converter valor
    const amount = parseAmount(amountStr);
    console.log(`  -> Valor parseado: ${amount}`);

    if (amount > 0) {
      expenses.push({
        date: normalizeDate(dateStr),
        description: description || 'Despesa sem descrição',
        category: categorizeDespesa(description, category),
        amount,
      });
    } else {
      console.log(`  -> Linha ignorada - valor inválido ou zero`);
    }
  }

  console.log(`Total de despesas parseadas: ${expenses.length}`);
  console.log('Soma total:', expenses.reduce((sum, e) => sum + e.amount, 0));
  return expenses;
}

// Parsear Excel de extrato bancário
export function parseBankStatementExcel(rows: string[][]): BankTransaction[] {
  console.log('=== PARSEANDO EXTRATO BANCÁRIO DO EXCEL ===');
  console.log('Total de linhas encontradas:', rows.length);
  console.log('Primeira linha (cabeçalho):', rows[0]);
  if (rows.length > 1) {
    console.log('Segunda linha (primeiro dado):', rows[1]);
  }

  const transactions: BankTransaction[] = [];

  // Formato esperado: Data, Descrição, Valor (positivo para crédito, negativo para débito)
  // ou: Data, Descrição, Tipo, Valor
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3 || !row[0]) {
      console.log(`Linha ${i} ignorada - menos de 3 colunas ou vazia:`, row);
      continue;
    }

    let date: string;
    let description: string;
    let amount: number;
    let type: 'credit' | 'debit';

    if (row.length === 3) {
      // Formato: Data, Descrição, Valor
      [date, description] = row;
      const valueStr = row[2];
      amount = Math.abs(parseAmount(valueStr));
      type = parseAmount(valueStr) >= 0 ? 'credit' : 'debit';
      console.log(`Linha ${i}: formato 3 colunas - data="${date}", desc="${description}", valor="${valueStr}" -> ${amount} (${type})`);
    } else {
      // Formato: Data, Descrição, Tipo, Valor
      [date, description] = row;
      const typeStr = row[2].toLowerCase();
      amount = Math.abs(parseAmount(row[3]));
      type = typeStr.includes('créd') || typeStr.includes('cred') || typeStr === 'c'
        ? 'credit'
        : 'debit';
      console.log(`Linha ${i}: formato 4 colunas - data="${date}", desc="${description}", tipo="${typeStr}", valor="${row[3]}" -> ${amount} (${type})`);
    }

    if (amount > 0) {
      transactions.push({
        date: normalizeDate(date),
        description: description || 'Transação sem descrição',
        amount,
        type,
      });
      console.log(`  -> Transação adicionada: ${type} de ${amount}`);
    } else {
      console.log(`  -> Transação ignorada - valor inválido`);
    }
  }

  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  console.log(`Total de transações parseadas: ${transactions.length}`);
  console.log(`Total créditos: ${totalCredits}`);
  console.log(`Total débitos: ${totalDebits}`);
  return transactions;
}

// Detectar se o arquivo é Excel
export function isExcelFile(filename: string): boolean {
  const ext = filename.toLowerCase();
  return ext.endsWith('.xlsx') || ext.endsWith('.xls');
}
