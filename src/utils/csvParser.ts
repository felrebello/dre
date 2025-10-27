// Utilitário para parsear arquivos CSV e processar dados financeiros

export interface ParsedRevenue {
  date: string;
  description: string;
  category: string;
  amount: number;
}

export interface ParsedExpense {
  date: string;
  description: string;
  category: string;
  amount: number;
}

export interface BankTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
}

// Parser genérico de CSV
export function parseCSV(content: string): string[][] {
  if (!content || content.trim().length === 0) {
    console.warn('Conteúdo CSV vazio ou inválido');
    return [];
  }

  // Remover BOM (Byte Order Mark) se presente
  content = content.replace(/^\uFEFF/, '');

  // Separar linhas - suporta tanto \n quanto \r\n
  const lines = content.trim().split(/\r?\n/);
  console.log(`CSV parser: ${lines.length} linhas encontradas`);

  return lines
    .filter(line => line.trim().length > 0) // Ignorar linhas vazias
    .map((line, index) => {
      // Detectar separador (ponto-e-vírgula tem prioridade sobre vírgula)
      const separator = line.includes(';') ? ';' : ',';

      // Separar células e limpar
      const cells = line.split(separator).map(cell => {
        // Remover aspas no início e fim
        let cleaned = cell.trim().replace(/^["']|["']$/g, '');
        return cleaned;
      });

      console.log(`Linha ${index}: ${cells.length} colunas`);
      return cells;
    });
}

// Parsear arquivo de receitas
export function parseRevenuesCSV(content: string): ParsedRevenue[] {
  console.log('=== PARSEANDO RECEITAS ===');
  console.log('Conteúdo recebido (primeiros 500 caracteres):', content.substring(0, 500));

  const rows = parseCSV(content);
  console.log('Total de linhas encontradas:', rows.length);
  console.log('Primeira linha (cabeçalho):', rows[0]);
  if (rows.length > 1) {
    console.log('Segunda linha (primeiro dado):', rows[1]);
  }

  const revenues: ParsedRevenue[] = [];

  // Assumir que a primeira linha é cabeçalho
  // Formato esperado: Data, Descrição, Categoria, Valor OU Data, Descrição, Valor
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Verificar se tem pelo menos 3 colunas
    if (row.length < 3) {
      console.log(`Linha ${i} ignorada - menos de 3 colunas:`, row);
      continue;
    }

    let dateStr: string;
    let description: string;
    let category: string;
    let amountStr: string;

    if (row.length === 3) {
      // Formato com 3 colunas: Data, Descrição/Histórico, Valor
      [dateStr, description, amountStr] = row;
      category = description; // Usar a descrição como categoria também
      console.log(`Linha ${i} (3 cols): data="${dateStr}", desc="${description}", valor="${amountStr}"`);
    } else {
      // Formato com 4 colunas: Data, Descrição, Categoria, Valor
      [dateStr, description, category, amountStr] = row;
      console.log(`Linha ${i} (4 cols): data="${dateStr}", desc="${description}", cat="${category}", valor="${amountStr}"`);
    }

    // Converter valor (aceita formatos com vírgula ou ponto)
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

// Parsear arquivo de despesas
export function parseExpensesCSV(content: string): ParsedExpense[] {
  console.log('=== PARSEANDO DESPESAS ===');
  console.log('Conteúdo recebido (primeiros 500 caracteres):', content.substring(0, 500));

  const rows = parseCSV(content);
  console.log('Total de linhas encontradas:', rows.length);
  console.log('Primeira linha (cabeçalho):', rows[0]);
  if (rows.length > 1) {
    console.log('Segunda linha (primeiro dado):', rows[1]);
  }

  const expenses: ParsedExpense[] = [];

  // Assumir que a primeira linha é cabeçalho
  // Formato esperado: Data, Descrição, Categoria, Valor OU Data, Descrição, Valor
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Verificar se tem pelo menos 3 colunas
    if (row.length < 3) {
      console.log(`Linha ${i} ignorada - menos de 3 colunas:`, row);
      continue;
    }

    let dateStr: string;
    let description: string;
    let category: string;
    let amountStr: string;

    if (row.length === 3) {
      // Formato com 3 colunas: Data, Descrição/Histórico, Valor
      [dateStr, description, amountStr] = row;
      category = description; // Usar a descrição como categoria também
      console.log(`Linha ${i} (3 cols): data="${dateStr}", desc="${description}", valor="${amountStr}"`);
    } else {
      // Formato com 4 colunas: Data, Descrição, Categoria, Valor
      [dateStr, description, category, amountStr] = row;
      console.log(`Linha ${i} (4 cols): data="${dateStr}", desc="${description}", cat="${category}", valor="${amountStr}"`);
    }

    // Converter valor (aceita formatos com vírgula ou ponto)
    // Para despesas, valores negativos também são válidos
    const amount = Math.abs(parseAmount(amountStr));
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

// Parsear extrato bancário
export function parseBankStatement(content: string): BankTransaction[] {
  console.log('=== PARSEANDO EXTRATO BANCÁRIO ===');
  console.log('Conteúdo recebido (primeiros 500 caracteres):', content.substring(0, 500));

  const rows = parseCSV(content);
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
    if (row.length < 3) continue;

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
    } else {
      // Formato: Data, Descrição, Tipo, Valor
      [date, description] = row;
      const typeStr = row[2].toLowerCase();
      amount = Math.abs(parseAmount(row[3]));
      type = typeStr.includes('créd') || typeStr.includes('cred') || typeStr === 'c'
        ? 'credit'
        : 'debit';
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

// Converter string de valor em número
export function parseAmount(value: string): number {
  if (!value || typeof value !== 'string') {
    console.log('parseAmount: valor vazio ou inválido:', value);
    return 0;
  }

  const original = value;

  // Remove espaços em branco e outros caracteres invisíveis
  value = value.trim();

  // Remove símbolos de moeda comuns (R$, $, €, etc)
  value = value.replace(/[R\$\u20ac\u00a3\u00a5]/gi, '');

  // Remove espaços
  value = value.replace(/\s/g, '');

  // Remover caracteres que não são dígitos, vírgula, ponto ou sinal negativo
  let cleaned = value.replace(/[^\d,.-]/g, '');

  if (!cleaned) {
    console.log(`parseAmount: nenhum número encontrado em "${original}"`);
    return 0;
  }

  // Detectar se usa vírgula ou ponto como decimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  // Contar quantas vírgulas e pontos existem
  const commaCount = (cleaned.match(/,/g) || []).length;
  const dotCount = (cleaned.match(/\./g) || []).length;

  if (lastComma > lastDot) {
    // Formato brasileiro: 1.234,56 ou apenas vírgula como decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Formato internacional: 1,234.56 ou apenas ponto como decimal
    cleaned = cleaned.replace(/,/g, '');
  } else if (commaCount === 1 && dotCount === 0) {
    // Apenas uma vírgula, provavelmente decimal
    cleaned = cleaned.replace(',', '.');
  } else if (dotCount === 1 && commaCount === 0) {
    // Apenas um ponto, pode ser decimal ou milhar
    // Se houver apenas 1 ou 2 dígitos após o ponto, é decimal
    const afterDot = cleaned.split('.')[1];
    if (!afterDot || afterDot.length <= 2) {
      // É decimal
    } else {
      // É milhar, remover o ponto
      cleaned = cleaned.replace('.', '');
    }
  }

  const result = parseFloat(cleaned) || 0;
  console.log(`parseAmount: "${original}" -> "${cleaned}" -> ${result}`);
  return result;
}

// Normalizar formato de data
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // Remover espaços
  dateStr = dateStr.trim();

  // Tentar diferentes formatos
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD (já normalizado)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\//g, '-');
  }

  // Tentar converter com Date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Fallback: data atual
  return new Date().toISOString().split('T')[0];
}

// Categorizar despesas automaticamente
export function categorizeDespesa(description: string, category?: string): string {
  // Se uma categoria válida já foi fornecida, usá-la
  if (category && category !== 'Não categorizado') {
    // Mapear variações comuns de nomes de categorias
    const normalizedCategory = category.toLowerCase().trim();

    if (normalizedCategory.includes('admin')) return 'Administrativas';
    if (normalizedCategory.includes('venda') || normalizedCategory.includes('marketing')) return 'Vendas e Marketing';
    if (normalizedCategory.includes('pessoa') || normalizedCategory.includes('salário') || normalizedCategory.includes('folha')) return 'Pessoal';
    if (normalizedCategory.includes('impost') || normalizedCategory.includes('taxa')) return 'Impostos e Taxas';
    if (normalizedCategory.includes('custo') || normalizedCategory.includes('csp') || normalizedCategory.includes('material')) return 'Custo dos Serviços';

    return category; // Retornar categoria original se não houver mapeamento
  }

  const desc = description.toLowerCase();

  // Custo dos Serviços Prestados (CSP) - materiais diretos
  if (desc.includes('material médico') || desc.includes('material medico') ||
      desc.includes('medicamento') || desc.includes('insumo') ||
      desc.includes('equipamento médico') || desc.includes('equipamento medico') ||
      desc.includes('instrumental') || desc.includes('descartável') || desc.includes('descartavel') ||
      desc.includes('reagente') || desc.includes('sutura') || desc.includes('luva') ||
      desc.includes('seringa') || desc.includes('gaze') || desc.includes('algodão')) {
    return 'Custo dos Serviços';
  }

  // Despesas com pessoal
  if (desc.includes('salário') || desc.includes('salario') || desc.includes('folha') ||
      desc.includes('inss') || desc.includes('fgts') || desc.includes('vale') ||
      desc.includes('pró-labore') || desc.includes('prolabore') || desc.includes('pro labore') ||
      desc.includes('férias') || desc.includes('ferias') || desc.includes('13º') || desc.includes('13o') ||
      desc.includes('beneficio') || desc.includes('benefício') ||
      desc.includes('plano de saúde') || desc.includes('plano de saude') ||
      desc.includes('convênio') || desc.includes('convenio') || desc.includes('vale transporte') ||
      desc.includes('vale refeição') || desc.includes('vale refeicao') || desc.includes('vr') || desc.includes('vt')) {
    return 'Pessoal';
  }

  // Despesas administrativas
  if (desc.includes('aluguel') || desc.includes('aluguél') || desc.includes('água') || desc.includes('agua') ||
      desc.includes('luz') || desc.includes('energia') || desc.includes('elétrica') || desc.includes('eletrica') ||
      desc.includes('telefone') || desc.includes('celular') || desc.includes('internet') ||
      desc.includes('contabilidade') || desc.includes('contábil') || desc.includes('contabil') ||
      desc.includes('advogado') || desc.includes('advocacia') || desc.includes('jurídico') || desc.includes('juridico') ||
      desc.includes('escritório') || desc.includes('escritorio') || desc.includes('office') ||
      desc.includes('manutenção') || desc.includes('manutencao') || desc.includes('reparo') ||
      desc.includes('limpeza') || desc.includes('higienização') || desc.includes('higienizacao') ||
      desc.includes('segurança') || desc.includes('seguranca') || desc.includes('alarme') ||
      desc.includes('condomínio') || desc.includes('condominio') || desc.includes('iptu') ||
      desc.includes('material de expediente') || desc.includes('papelaria') ||
      desc.includes('xerox') || desc.includes('impressora') || desc.includes('toner')) {
    return 'Administrativas';
  }

  // Despesas com vendas/marketing
  if (desc.includes('marketing') || desc.includes('publicidade') || desc.includes('propaganda') ||
      desc.includes('google ads') || desc.includes('facebook ads') || desc.includes('instagram') ||
      desc.includes('site') || desc.includes('website') || desc.includes('redes sociais') ||
      desc.includes('anúncio') || desc.includes('anuncio') || desc.includes('mídia') || desc.includes('midia') ||
      desc.includes('promoção') || desc.includes('promocao') || desc.includes('desconto') ||
      desc.includes('campanha') || desc.includes('seo') || desc.includes('design gráfico') ||
      desc.includes('cartão de visita') || desc.includes('cartao de visita') || desc.includes('folder')) {
    return 'Vendas e Marketing';
  }

  // Impostos e taxas
  if (desc.includes('imposto') || desc.includes('taxa') || desc.includes('tributo') ||
      desc.includes('irpj') || desc.includes('csll') || desc.includes('pis') ||
      desc.includes('cofins') || desc.includes('iss') || desc.includes('issqn') ||
      desc.includes('simples') || desc.includes('simples nacional') ||
      desc.includes('darf') || desc.includes('gps') || desc.includes('das') ||
      desc.includes('contribuição') || desc.includes('contribuicao')) {
    return 'Impostos e Taxas';
  }

  // Despesas financeiras
  if (desc.includes('juros') || desc.includes('multa') || desc.includes('tarifa bancária') ||
      desc.includes('tarifa bancaria') || desc.includes('banco') || desc.includes('cartão de crédito') ||
      desc.includes('cartao de credito') || desc.includes('empréstimo') || desc.includes('emprestimo') ||
      desc.includes('financiamento')) {
    return 'Despesas Financeiras';
  }

  return 'Outras Despesas Operacionais';
}

// Categorizar receitas automaticamente
export function categorizeReceita(description: string, category?: string): string {
  // Se uma categoria válida já foi fornecida, usá-la
  if (category && category !== 'Não categorizado') {
    // Mapear variações comuns de nomes de categorias
    const normalizedCategory = category.toLowerCase().trim();

    if (normalizedCategory.includes('serviço') || normalizedCategory.includes('servico') ||
        normalizedCategory.includes('consulta') || normalizedCategory.includes('atendimento')) {
      return 'Receita de Serviços';
    }
    if (normalizedCategory.includes('produto') || normalizedCategory.includes('venda') ||
        normalizedCategory.includes('mercadoria')) {
      return 'Receita de Produtos';
    }
    if (normalizedCategory.includes('financeira') || normalizedCategory.includes('juros') ||
        normalizedCategory.includes('rendimento')) {
      return 'Receitas Financeiras';
    }

    return category; // Retornar categoria original se não houver mapeamento
  }

  const desc = description.toLowerCase();

  // Receita de serviços
  if (desc.includes('consulta') || desc.includes('atendimento') || desc.includes('procedimento') ||
      desc.includes('exame') || desc.includes('tratamento') || desc.includes('sessão') || desc.includes('sessao') ||
      desc.includes('cirurgia') || desc.includes('avaliação') || desc.includes('avaliacao') ||
      desc.includes('terapia') || desc.includes('acompanhamento') || desc.includes('retorno') ||
      desc.includes('diagnóstico') || desc.includes('diagnostico') || desc.includes('checkup')) {
    return 'Receita de Serviços';
  }

  // Receita de produtos
  if (desc.includes('venda') || desc.includes('produto') || desc.includes('medicamento') ||
      desc.includes('material') || desc.includes('suplemento') || desc.includes('ortese') ||
      desc.includes('prótese') || desc.includes('protese') || desc.includes('equipamento')) {
    return 'Receita de Produtos';
  }

  // Receitas financeiras
  if (desc.includes('rendimento') || desc.includes('juros recebidos') || desc.includes('juros') ||
      desc.includes('aplicação') || desc.includes('aplicacao') || desc.includes('investimento')) {
    return 'Receitas Financeiras';
  }

  return 'Receita de Serviços';
}
