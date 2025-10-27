// Tipos e enums relacionados a impostos e regime tributário

// Enum para tipos de impostos sobre receita
export enum ImpostoReceita {
  PIS = 'PIS',
  COFINS = 'COFINS',
  ISS = 'ISS',
  ICMS = 'ICMS',
  SIMPLES = 'SIMPLES',
}

// Enum para tipos de impostos sobre lucro
export enum ImpostoLucro {
  IRPJ = 'IRPJ',
  CSLL = 'CSLL',
}

// Enum para regime tributário
export enum RegimeTributario {
  SIMPLES_NACIONAL = 'simples_nacional',
  LUCRO_PRESUMIDO = 'lucro_presumido',
  LUCRO_REAL = 'lucro_real',
}

// Interface para detalhamento de impostos sobre receita
export interface ImpostosReceita {
  pis: number;
  cofins: number;
  iss: number;
  icms: number;
  simples: number;
  outros: number;
  total: number;
}

// Interface para detalhamento de impostos sobre lucro
export interface ImpostosLucro {
  irpj: number;
  csll: number;
  outros: number;
  total: number;
}

// Interface para classificação de imposto
export interface ClassificacaoImposto {
  tipo: 'receita' | 'lucro';
  categoria: ImpostoReceita | ImpostoLucro | 'outros';
  aliquota?: number;
}

// Alíquotas padrão por regime tributário
export const ALIQUOTAS_PADRAO = {
  [RegimeTributario.SIMPLES_NACIONAL]: {
    // Alíquota média do Simples Nacional para serviços de saúde (Anexo III)
    simples: 0.06, // 6% a 33% - usando 6% como base inicial
  },
  [RegimeTributario.LUCRO_PRESUMIDO]: {
    pis: 0.0065, // 0.65%
    cofins: 0.03, // 3%
    iss: 0.05, // 5% (varia por município, 2% a 5%)
    irpj: 0.048, // 4.8% (15% sobre 32% de presunção)
    csll: 0.0288, // 2.88% (9% sobre 32% de presunção)
  },
  [RegimeTributario.LUCRO_REAL]: {
    pis: 0.0165, // 1.65%
    cofins: 0.076, // 7.6%
    iss: 0.05, // 5% (varia por município)
    irpj: 0.15, // 15% sobre lucro real (+ 10% adicional acima de R$ 20k/mês)
    csll: 0.09, // 9% sobre lucro real
  },
};

// Função para identificar tipo de imposto pela descrição
export function identificarImposto(descricao: string): ClassificacaoImposto | null {
  const desc = descricao.toLowerCase();

  // Impostos sobre receita
  if (desc.includes('pis')) {
    return { tipo: 'receita', categoria: ImpostoReceita.PIS };
  }
  if (desc.includes('cofins')) {
    return { tipo: 'receita', categoria: ImpostoReceita.COFINS };
  }
  if (desc.includes('iss') || desc.includes('issqn')) {
    return { tipo: 'receita', categoria: ImpostoReceita.ISS };
  }
  if (desc.includes('icms')) {
    return { tipo: 'receita', categoria: ImpostoReceita.ICMS };
  }
  if (desc.includes('simples nacional') || desc.includes('das') || desc.includes('simples')) {
    return { tipo: 'receita', categoria: ImpostoReceita.SIMPLES };
  }

  // Impostos sobre lucro
  if (desc.includes('irpj') || desc.includes('imposto de renda pessoa juridica') || desc.includes('imposto de renda pj')) {
    return { tipo: 'lucro', categoria: ImpostoLucro.IRPJ };
  }
  if (desc.includes('csll') || desc.includes('contribuicao social sobre lucro')) {
    return { tipo: 'lucro', categoria: ImpostoLucro.CSLL };
  }

  // Outros impostos específicos sobre receita
  if (
    desc.includes('darf') ||
    desc.includes('guia de imposto') ||
    desc.includes('inss patronal') ||
    desc.includes('fgts')
  ) {
    return { tipo: 'receita', categoria: 'outros' };
  }

  // Não classificar automaticamente como imposto
  // Apenas se tiver palavras-chave muito específicas
  return null;
}

// Função para calcular impostos automaticamente baseado no regime
export function calcularImpostosAutomaticos(
  regime: RegimeTributario,
  receitaBruta: number,
  lucroReal?: number
): { impostosReceita: ImpostosReceita; impostosLucro: ImpostosLucro } {
  const aliquotas = ALIQUOTAS_PADRAO[regime];

  let impostosReceita: ImpostosReceita = {
    pis: 0,
    cofins: 0,
    iss: 0,
    icms: 0,
    simples: 0,
    outros: 0,
    total: 0,
  };

  let impostosLucro: ImpostosLucro = {
    irpj: 0,
    csll: 0,
    outros: 0,
    total: 0,
  };

  if (regime === RegimeTributario.SIMPLES_NACIONAL) {
    const aliq = aliquotas as { simples: number };
    impostosReceita.simples = receitaBruta * aliq.simples;
    impostosReceita.total = impostosReceita.simples;
  }

  else if (regime === RegimeTributario.LUCRO_PRESUMIDO) {
    const aliq = aliquotas as { pis: number; cofins: number; iss: number; irpj: number; csll: number };
    impostosReceita.pis = receitaBruta * aliq.pis;
    impostosReceita.cofins = receitaBruta * aliq.cofins;
    impostosReceita.iss = receitaBruta * aliq.iss;
    impostosReceita.total =
      impostosReceita.pis + impostosReceita.cofins + impostosReceita.iss;

    impostosLucro.irpj = receitaBruta * aliq.irpj;
    impostosLucro.csll = receitaBruta * aliq.csll;
    impostosLucro.total = impostosLucro.irpj + impostosLucro.csll;
  }

  else if (regime === RegimeTributario.LUCRO_REAL) {
    const aliq = aliquotas as { pis: number; cofins: number; iss: number; irpj: number; csll: number };
    impostosReceita.pis = receitaBruta * aliq.pis;
    impostosReceita.cofins = receitaBruta * aliq.cofins;
    impostosReceita.iss = receitaBruta * aliq.iss;
    impostosReceita.total =
      impostosReceita.pis + impostosReceita.cofins + impostosReceita.iss;

    if (lucroReal && lucroReal > 0) {
      impostosLucro.irpj = lucroReal * aliq.irpj;
      if (lucroReal > 20000) {
        impostosLucro.irpj += (lucroReal - 20000) * 0.1;
      }
      impostosLucro.csll = lucroReal * aliq.csll;
      impostosLucro.total = impostosLucro.irpj + impostosLucro.csll;
    }
  }

  return { impostosReceita, impostosLucro };
}
