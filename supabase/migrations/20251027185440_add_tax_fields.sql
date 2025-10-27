/*
  # Adicionar campos de imposto

  ## Descrição
  Esta migração adiciona campos para identificar e classificar despesas como impostos.

  ## Mudanças

  1. Alterações na tabela `expense_entries`:
     - Adicionar campo `e_imposto` (BOOLEAN) - indica se a despesa é um imposto
     - Adicionar campo `tipo_imposto` (TEXT) - valores: 'receita', 'lucro', ou NULL
     - Adicionar campo `categoria_imposto` (TEXT) - categoria específica do imposto (ex: PIS, COFINS, ISS, etc.)

  2. Valores padrão:
     - `e_imposto`: false (padrão não é imposto)
     - `tipo_imposto`: NULL
     - `categoria_imposto`: NULL

  ## Notas Importantes
  - Despesas existentes serão marcadas como não-imposto por padrão
  - Quando e_imposto = true, não é necessário classificar como fixa/variável
  - O sistema poderá identificar automaticamente impostos baseado na descrição
*/

-- Adicionar campos de imposto à tabela expense_entries
DO $$
BEGIN
  -- Adicionar campo e_imposto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_entries' AND column_name = 'e_imposto'
  ) THEN
    ALTER TABLE expense_entries ADD COLUMN e_imposto BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar campo tipo_imposto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_entries' AND column_name = 'tipo_imposto'
  ) THEN
    ALTER TABLE expense_entries ADD COLUMN tipo_imposto TEXT CHECK (tipo_imposto IN ('receita', 'lucro'));
  END IF;

  -- Adicionar campo categoria_imposto
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_entries' AND column_name = 'categoria_imposto'
  ) THEN
    ALTER TABLE expense_entries ADD COLUMN categoria_imposto TEXT;
  END IF;
END $$;

-- Criar índice para melhorar performance de queries que filtram por imposto
CREATE INDEX IF NOT EXISTS idx_expense_entries_e_imposto
  ON expense_entries(e_imposto);

-- Criar índice para queries que buscam impostos por tipo
CREATE INDEX IF NOT EXISTS idx_expense_entries_tipo_imposto
  ON expense_entries(report_id, tipo_imposto)
  WHERE e_imposto = true;
