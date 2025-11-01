// Componente para classificação de despesas (fixas vs variáveis) e identificação de impostos
import { useState, useMemo } from 'react';
import { CheckCircle, DollarSign, TrendingDown, AlertCircle, ArrowRight, Tag } from 'lucide-react';
import { ParsedExpense } from '../utils/csvParser';
import { identificarImposto } from '../types/tax';

// Interface para despesa com classificação
export interface ClassifiedExpense extends ParsedExpense {
  tipo_despesa: 'fixa' | 'variavel' | null;
  categoria_personalizada?: string;
  classificacao_manual: boolean;
  sugestao_automatica: 'fixa' | 'variavel';
  e_imposto: boolean;
  tipo_imposto?: 'receita' | 'lucro';
}

interface ExpenseClassificationProps {
  expenses: ParsedExpense[];
  onClassificationComplete: (classifiedExpenses: ClassifiedExpense[]) => void;
  onBack: () => void;
}

// Função auxiliar para normalizar texto (remove acentos, pontuação e converte para minúsculas)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

// Função para verificar se um texto contém alguma das palavras-chave
function containsAnyKeyword(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some(keyword => normalized.includes(normalizeText(keyword)));
}

// Função para analisar padrão temporal de recorrência
function analyzeRecurrence(
  expense: ParsedExpense,
  allExpenses: ParsedExpense[]
): { isRecurrent: boolean; avgAmount: number; occurrences: number } {
  const normalizedDesc = normalizeText(expense.description);

  // Encontrar despesas similares (mesma descrição normalizada)
  const similarExpenses = allExpenses.filter(e => {
    const similarity = normalizeText(e.description);
    // Considerar similar se tiver pelo menos 70% de palavras em comum
    const words1 = normalizedDesc.split(' ');
    const words2 = similarity.split(' ');
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);
    return commonWords.length >= Math.min(words1.length, words2.length) * 0.7;
  });

  const occurrences = similarExpenses.length;
  const avgAmount = similarExpenses.reduce((sum, e) => sum + e.amount, 0) / occurrences;
  const stdDeviation = Math.sqrt(
    similarExpenses.reduce((sum, e) => sum + Math.pow(e.amount - avgAmount, 2), 0) / occurrences
  );

  // É recorrente se aparecer 2+ vezes e variação for baixa (< 30%)
  const isRecurrent = occurrences >= 2 && (stdDeviation / avgAmount) < 0.3;

  return { isRecurrent, avgAmount, occurrences };
}

// Função aprimorada para sugerir classificação automática
function suggestExpenseType(expense: ParsedExpense, allExpenses: ParsedExpense[]): 'fixa' | 'variavel' {
  const category = expense.category;
  const description = expense.description;

  // Sistema de pontuação: positivo = fixa, negativo = variável
  let score = 0;

  // ========== PALAVRAS-CHAVE PARA DESPESAS FIXAS ==========
  const fixedKeywords = [
    // Pessoal e folha de pagamento
    'salario', 'salário', 'ordenado', 'vencimento', 'remuneracao',
    'pro labore', 'pró-labore', 'prolabore', 'honorario', 'honorário',
    'rescisao', 'rescisão', 'ferias', 'férias', '13 salario', 'decimo terceiro',
    'vale transporte', 'vale alimentacao', 'vale refeicao', 'plano saude',
    'plano odontologico', 'seguro vida', 'fgts', 'inss empregador',

    // Ocupação e infraestrutura
    'aluguel', 'locacao', 'locação', 'arrendamento', 'condominio', 'condomínio',
    'iptu', 'ipva', 'taxa condominio', 'seguro imovel', 'seguro imóvel',

    // Utilidades e serviços fixos
    'agua', 'água', 'esgoto', 'luz', 'energia eletrica', 'energia elétrica',
    'telefone', 'internet', 'banda larga', 'fibra optica', 'linha telefonica',
    'telefonia', 'celular corporativo', 'pacote dados',

    // Serviços profissionais fixos
    'contador', 'contabilidade', 'assessoria contabil', 'escritorio contabil',
    'advogado', 'consultoria juridica', 'assessoria juridica',
    'auditoria', 'consultoria', 'assessoria',

    // Seguros
    'seguro', 'apolice', 'apólice', 'premio seguro', 'prêmio seguro',
    'seguro responsabilidade', 'seguro equipamento',

    // Licenças e autorizações
    'licenca', 'licença', 'alvara', 'alvará', 'anuidade', 'mensalidade',
    'registro profissional', 'conselho classe', 'cro', 'crm', 'coren',
    'anvisa', 'vigilancia sanitaria', 'vigilância sanitária',

    // Manutenção preventiva e contratos
    'manutencao preventiva', 'manutenção preventiva', 'contrato manutencao',
    'manutencao mensal', 'assistencia tecnica', 'assistência técnica',

    // Software e sistemas
    'software', 'sistema', 'licenca software', 'licença software',
    'assinatura', 'saas', 'cloud', 'nuvem', 'hospedagem',

    // Depreciação e amortização
    'depreciacao', 'depreciação', 'amortizacao', 'amortização',

    // Limpeza e conservação
    'limpeza', 'faxina', 'servico limpeza', 'material limpeza fixo',
    'higienizacao', 'higienização',
  ];

  // ========== PALAVRAS-CHAVE PARA DESPESAS VARIÁVEIS ==========
  const variableKeywords = [
    // Materiais médicos/odontológicos
    'material medico', 'material médico', 'mat medico', 'mat. med.',
    'material odontologico', 'material odontológico', 'mat odonto', 'mat. odonto',
    'insumo', 'insumos', 'descartavel', 'descartável', 'consumivel', 'consumível',

    // Medicamentos e fármacos
    'medicamento', 'farmaco', 'fármaco', 'droga', 'remedio', 'remédio',
    'anestesico', 'anestésico', 'antibiotico', 'antibiótico',

    // Materiais específicos
    'luva', 'mascara', 'máscara', 'avental', 'touca', 'capote',
    'seringa', 'agulha', 'cateter', 'sonda', 'gaze', 'atadura',
    'algodao', 'algodão', 'alcool', 'álcool', 'antisseptico', 'antisséptico',
    'fio cirurgico', 'fio cirúrgico', 'sutura', 'bisturi', 'lamina', 'lâmina',

    // Odontologia específico
    'resina', 'ionomer', 'ionomero', 'amalgama', 'amálgama',
    'anestesico odontologico', 'broca', 'lixa', 'disco', 'mandril',
    'profilaxia', 'fluor', 'fluoreto', 'selante', 'clareador',
    'moldeira', 'alginato', 'silicone', 'gesso', 'cimento',

    // Radiologia
    'filme radiografico', 'filme radiográfico', 'sensor digital',
    'revelador', 'fixador', 'solucao reveladora', 'solução reveladora',

    // Laboratório
    'reagente', 'teste', 'kit', 'analise', 'análise', 'exame',
    'amostra', 'cultura', 'meio cultura', 'placa petri',

    // Custos variáveis operacionais
    'custo variavel', 'custo variável', 'cmv', 'custo mercadoria',
    'custo servico', 'custo serviço', 'custo procedimento',

    // Comissões e variáveis de vendas
    'comissao', 'comissão', 'bonus', 'bônus', 'premiacao', 'premiação',
    'incentivo', 'participacao resultado', 'participação resultado',

    // Marketing e publicidade variável
    'marketing', 'publicidade', 'propaganda', 'anuncio', 'anúncio',
    'divulgacao', 'divulgação', 'ads', 'google ads', 'facebook ads',
    'instagram', 'redes sociais', 'influencer', 'influenciador',
    'panfleto', 'folder', 'banner', 'outdoor',

    // Despesas financeiras variáveis
    'juros', 'juro', 'multa', 'tarifa bancaria', 'tarifa bancária',
    'iof', 'desconto duplicata', 'antecipacao', 'antecipação',
    'taxa cartao', 'taxa cartão', 'maquininha', 'tef', 'credito', 'crédito',

    // Frete e logística
    'frete', 'entrega', 'correio', 'sedex', 'pac', 'transporte',
    'logistica', 'logística', 'despacho', 'envio',

    // Embalagens e descartáveis
    'embalagem', 'sacola', 'saco', 'caixa', 'envelope',
    'etiqueta', 'rotulo', 'rótulo',

    // Manutenção corretiva (variável)
    'manutencao corretiva', 'manutenção corretiva', 'reparo', 'conserto',
    'pecas', 'peças', 'componente', 'substituicao', 'substituição',

    // Terceirização de serviços variáveis
    'terceirizado', 'freelancer', 'autonomo', 'autônomo', 'temporario', 'temporário',
    'servico terceiro', 'serviço terceiro', 'prestador servico', 'prestador serviço',
  ];

  // Análise de palavras-chave
  if (containsAnyKeyword(description, fixedKeywords) || containsAnyKeyword(category, fixedKeywords)) {
    score += 3;
  }

  if (containsAnyKeyword(description, variableKeywords) || containsAnyKeyword(category, variableKeywords)) {
    score -= 3;
  }

  // ========== ANÁLISE DE PADRÃO TEMPORAL ==========
  const recurrence = analyzeRecurrence(expense, allExpenses);

  if (recurrence.isRecurrent) {
    // Se é recorrente e o valor atual é similar à média (±20%), forte indicador de despesa fixa
    const deviation = Math.abs(expense.amount - recurrence.avgAmount) / recurrence.avgAmount;
    if (deviation < 0.2) {
      score += 2;
    } else if (deviation < 0.5) {
      score += 1;
    }
  }

  // Se aparece 3+ vezes, tende a ser fixa
  if (recurrence.occurrences >= 3) {
    score += 1;
  }

  // ========== ANÁLISE DE VALOR ==========
  // Valores muito altos e esporádicos tendem a ser variáveis (equipamentos, grandes compras)
  if (expense.amount > 10000 && recurrence.occurrences === 1) {
    score -= 1;
  }

  // ========== ANÁLISE DE CATEGORIA ==========
  const categoryNormalized = normalizeText(category);

  // Categorias tipicamente fixas
  if (categoryNormalized.includes('pessoal') ||
      categoryNormalized.includes('administrativa') ||
      categoryNormalized.includes('folha') ||
      categoryNormalized.includes('rh')) {
    score += 2;
  }

  // Categorias tipicamente variáveis
  if (categoryNormalized.includes('custo') ||
      categoryNormalized.includes('cmv') ||
      categoryNormalized.includes('variavel')) {
    score -= 2;
  }

  // ========== DECISÃO FINAL ==========
  // Se score > 0: fixa, se score < 0: variável
  // Se score = 0: analisar contexto adicional

  if (score === 0) {
    // Critério de desempate: despesas recorrentes são fixas, demais são variáveis
    return recurrence.isRecurrent ? 'fixa' : 'variavel';
  }

  return score > 0 ? 'fixa' : 'variavel';
}

export default function ExpenseClassification({
  expenses,
  onClassificationComplete,
  onBack,
}: ExpenseClassificationProps) {
  // Inicializar despesas com sugestão automática e identificação de impostos
  const [classifiedExpenses, setClassifiedExpenses] = useState<ClassifiedExpense[]>(() =>
    expenses.map((expense) => {
      const impostoInfo = identificarImposto(expense.description);
      const eImposto = impostoInfo !== null;
      const sugestao = suggestExpenseType(expense, expenses);
      return {
        ...expense,
        tipo_despesa: sugestao,
        classificacao_manual: false,
        sugestao_automatica: sugestao,
        e_imposto: eImposto,
        tipo_imposto: impostoInfo?.tipo,
      };
    })
  );

  const [showOnlyUnclassified, setShowOnlyUnclassified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calcular totais
  const totals = useMemo(() => {
    const total = classifiedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const fixas = classifiedExpenses
      .filter((exp) => exp.tipo_despesa === 'fixa' && !exp.e_imposto)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const variaveis = classifiedExpenses
      .filter((exp) => exp.tipo_despesa === 'variavel' && !exp.e_imposto)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const impostos = classifiedExpenses
      .filter((exp) => exp.e_imposto)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const naoClassificadas = classifiedExpenses
      .filter((exp) => exp.tipo_despesa === null && !exp.e_imposto)
      .reduce((sum, exp) => sum + exp.amount, 0);

    return { total, fixas, variaveis, impostos, naoClassificadas };
  }, [classifiedExpenses]);

  // Calcular percentual classificado: considerar despesas fixas, variáveis E impostos como classificadas
  // Impostos não precisam de classificação fixa/variável, então são considerados 100% classificados
  const percentualClassificado = totals.total > 0
    ? ((totals.fixas + totals.variaveis + totals.impostos) / totals.total) * 100
    : 0;

  // Verificar se há despesas operacionais (não impostos) sem classificação
  const despesasOperacionaisSemClassificacao = classifiedExpenses.filter(
    (exp) => !exp.e_imposto && !exp.tipo_despesa
  ).length;

  // O botão deve estar habilitado se todas as despesas operacionais estiverem classificadas
  // Impostos já são considerados classificados automaticamente
  const podeAvancar = despesasOperacionaisSemClassificacao === 0;

  // Debug: log para verificar os valores
  console.log('Debug classificação:', {
    total: totals.total,
    fixas: totals.fixas,
    variaveis: totals.variaveis,
    impostos: totals.impostos,
    naoClassificadas: totals.naoClassificadas,
    percentual: percentualClassificado,
    totalDespesas: classifiedExpenses.length,
    despesasComImposto: classifiedExpenses.filter(e => e.e_imposto).length,
    despesasFixas: classifiedExpenses.filter(e => e.tipo_despesa === 'fixa').length,
    despesasVariaveis: classifiedExpenses.filter(e => e.tipo_despesa === 'variavel').length,
    despesasSemClassificacao: classifiedExpenses.filter(e => !e.e_imposto && !e.tipo_despesa).length
  });

  // Handler para alterar classificação de uma despesa
  const handleClassificationChange = (index: number, tipo: 'fixa' | 'variavel' | null) => {
    setClassifiedExpenses((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        tipo_despesa: tipo,
        classificacao_manual: true,
      };
      return updated;
    });
  };

  // Handler para marcar/desmarcar como imposto
  const handleToggleImposto = (index: number) => {
    setClassifiedExpenses((prev) => {
      const updated = [...prev];
      const current = updated[index];
      updated[index] = {
        ...updated[index],
        e_imposto: !current.e_imposto,
        tipo_imposto: !current.e_imposto ? 'receita' : undefined,
        classificacao_manual: true,
      };
      return updated;
    });
  };

  // Handler para alterar categoria personalizada
  const handleCategoryChange = (index: number, newCategory: string) => {
    setClassifiedExpenses((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        categoria_personalizada: newCategory,
        classificacao_manual: true,
      };
      return updated;
    });
  };

  // Aplicar classificação automática para todas
  const handleAutoClassifyAll = () => {
    setClassifiedExpenses((prev) =>
      prev.map((expense) => ({
        ...expense,
        tipo_despesa: expense.sugestao_automatica,
        classificacao_manual: false,
      }))
    );
  };

  // Filtrar despesas para exibição: se mostrar apenas não classificadas, excluir impostos também
  const displayedExpenses = showOnlyUnclassified
    ? classifiedExpenses.filter((exp) => exp.tipo_despesa === null && !exp.e_imposto)
    : classifiedExpenses;

  // Formatar valor em moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Classificação de Despesas
          </h1>
          <p className="text-lg text-gray-600">
            Classifique as despesas como fixas ou variáveis para gerar um DRE mais detalhado
          </p>
        </div>

        {/* Card de resumo e progresso */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Total de Despesas</p>
              <p className="text-2xl font-bold text-gray-900">{classifiedExpenses.length}</p>
              <p className="text-lg text-gray-700 mt-1">{formatCurrency(totals.total)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Despesas Fixas</p>
              <p className="text-2xl font-bold text-blue-700">
                {classifiedExpenses.filter((e) => e.tipo_despesa === 'fixa' && !e.e_imposto).length}
              </p>
              <p className="text-lg text-blue-600 mt-1">{formatCurrency(totals.fixas)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Despesas Variáveis</p>
              <p className="text-2xl font-bold text-orange-700">
                {classifiedExpenses.filter((e) => e.tipo_despesa === 'variavel' && !e.e_imposto).length}
              </p>
              <p className="text-lg text-orange-600 mt-1">{formatCurrency(totals.variaveis)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Impostos</p>
              <p className="text-2xl font-bold text-purple-700">
                {classifiedExpenses.filter((e) => e.e_imposto).length}
              </p>
              <p className="text-lg text-purple-600 mt-1">{formatCurrency(totals.impostos)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Progresso</p>
              <p className="text-2xl font-bold text-green-700">
                {percentualClassificado.toFixed(0)}%
              </p>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${percentualClassificado}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {despesasOperacionaisSemClassificacao > 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-yellow-800 font-medium">
                    Existem {despesasOperacionaisSemClassificacao}{' '}
                    despesa{despesasOperacionaisSemClassificacao !== 1 ? 's' : ''} operacional{despesasOperacionaisSemClassificacao !== 1 ? 'is' : ''} não classificada{despesasOperacionaisSemClassificacao !== 1 ? 's' : ''} ({formatCurrency(totals.naoClassificadas)})
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Classifique-as como fixas ou variáveis para continuar. Impostos já estão classificados automaticamente.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                <p className="text-green-800 font-medium">
                  Todas as despesas operacionais foram classificadas! Você pode gerar o DRE agora.
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={handleAutoClassifyAll}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Aplicar Classificação Automática
              </button>
              <button
                onClick={() => setShowOnlyUnclassified(!showOnlyUnclassified)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {showOnlyUnclassified ? 'Mostrar Todas' : 'Mostrar Não Classificadas'}
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setErrorMessage(null);
                  if (!podeAvancar) {
                    setErrorMessage(
                      `Por favor, classifique as ${despesasOperacionaisSemClassificacao} despesa${despesasOperacionaisSemClassificacao !== 1 ? 's' : ''} operacional${despesasOperacionaisSemClassificacao !== 1 ? 'is' : ''} pendente${despesasOperacionaisSemClassificacao !== 1 ? 's' : ''} antes de continuar.`
                    );
                    return;
                  }
                  onClassificationComplete(classifiedExpenses);
                }}
                disabled={!podeAvancar}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center font-semibold"
                title={
                  !podeAvancar
                    ? `Classifique todas as despesas operacionais para continuar (${despesasOperacionaisSemClassificacao} pendente${despesasOperacionaisSemClassificacao !== 1 ? 's' : ''})`
                    : 'Gerar relatório DRE'
                }
              >
                Continuar e Gerar DRE
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
              {!podeAvancar && (
                <p className="text-xs text-gray-600 mt-2 text-right">
                  {despesasOperacionaisSemClassificacao} despesa{despesasOperacionaisSemClassificacao !== 1 ? 's' : ''} operacional{despesasOperacionaisSemClassificacao !== 1 ? 'is' : ''} sem classificação
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Legenda e Instruções */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Legenda e Instruções:</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-700">
                  <strong>Despesas Fixas:</strong> Não variam com o volume de atendimentos
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                <span className="text-gray-700">
                  <strong>Despesas Variáveis:</strong> Proporcionais ao volume de atendimentos
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                <span className="text-gray-700">
                  <strong>Impostos:</strong> Identificados automaticamente e separados no DRE
                </span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Dica:</strong> Impostos identificados automaticamente já contam como classificados
              e não precisam ser marcados como fixos ou variáveis. Se alguma despesa foi classificada
              incorretamente como imposto, clique no "X" ao lado para desmarcar. Se alguma despesa deveria
              ser um imposto, clique em "É imposto?" para marcá-la.
            </div>
          </div>
        </div>

        {/* Tabela de despesas */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Descrição</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Categoria</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Valor</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Classificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedExpenses.map((expense, index) => {
                  const originalIndex = classifiedExpenses.findIndex((e) => e === expense);
                  return (
                    <tr key={originalIndex} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {expense.categoria_personalizada || expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {expense.e_imposto ? (
                          <div className="flex items-center justify-center gap-2">
                            <Tag className="h-4 w-4 text-purple-600" />
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                              Imposto {expense.tipo_imposto === 'receita' ? '(Receita)' : '(Lucro)'}
                            </span>
                            <button
                              onClick={() => handleToggleImposto(originalIndex)}
                              className="text-xs text-red-600 hover:text-red-800 underline"
                              title="Desmarcar como imposto"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-gray-500">Despesa</span>
                            <button
                              onClick={() => handleToggleImposto(originalIndex)}
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                              title="Marcar como imposto"
                            >
                              É imposto?
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {expense.e_imposto ? (
                          <div className="flex justify-center">
                            <span className="text-xs text-gray-500 italic">Automático</span>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleClassificationChange(originalIndex, 'fixa')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              expense.tipo_despesa === 'fixa'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Fixa
                          </button>
                          <button
                            onClick={() => handleClassificationChange(originalIndex, 'variavel')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              expense.tipo_despesa === 'variavel'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Variável
                          </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
