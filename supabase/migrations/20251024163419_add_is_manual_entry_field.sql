/*
  # Adicionar campo is_manual_entry às despesas

  ## Descrição
  Esta migração adiciona o campo is_manual_entry para diferenciar despesas importadas
  de arquivos CSV de despesas adicionadas manualmente pelo usuário no sistema.

  ## Mudanças

  1. Alterações na tabela `expense_entries`:
     - Adicionar campo `is_manual_entry` (BOOLEAN) - indica se a despesa foi adicionada manualmente
     - Valor padrão: false (despesas importadas de CSV)

  2. Alterações na tabela `revenue_entries`:
     - Adicionar campo `is_manual_entry` (BOOLEAN) - indica se a receita foi adicionada manualmente
     - Valor padrão: false (receitas importadas de CSV)

  ## Notas Importantes
  - Despesas/receitas existentes serão marcadas como não manuais (is_manual_entry = false)
  - Este campo permite identificar facilmente quais entradas foram adicionadas pelo usuário
  - Útil para auditoria e rastreabilidade das modificações no relatório
*/

-- Adicionar campo is_manual_entry à tabela expense_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_entries' AND column_name = 'is_manual_entry'
  ) THEN
    ALTER TABLE expense_entries ADD COLUMN is_manual_entry BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Adicionar campo is_manual_entry à tabela revenue_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revenue_entries' AND column_name = 'is_manual_entry'
  ) THEN
    ALTER TABLE revenue_entries ADD COLUMN is_manual_entry BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Criar índice para melhorar performance de queries que filtram por tipo de entrada
CREATE INDEX IF NOT EXISTS idx_expense_entries_manual 
  ON expense_entries(report_id, is_manual_entry);

CREATE INDEX IF NOT EXISTS idx_revenue_entries_manual 
  ON revenue_entries(report_id, is_manual_entry);

-- Adicionar índice para filtrar por data (melhorar performance de queries por período)
CREATE INDEX IF NOT EXISTS idx_expense_entries_date 
  ON expense_entries(report_id, date);

CREATE INDEX IF NOT EXISTS idx_revenue_entries_date 
  ON revenue_entries(report_id, date);