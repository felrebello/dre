/*
  # Adicionar campos de classificação de despesas

  ## Descrição
  Esta migração adiciona campos para classificar despesas como fixas ou variáveis,
  permitir categorização personalizada e rastrear classificações manuais.

  ## Mudanças

  1. Alterações na tabela `expense_entries`:
     - Adicionar campo `tipo_despesa` (TEXT) - valores: 'fixa', 'variavel', ou NULL (não classificada)
     - Adicionar campo `categoria_personalizada` (TEXT) - categoria atribuída manualmente pelo usuário
     - Adicionar campo `classificacao_manual` (BOOLEAN) - indica se foi classificada manualmente
     - Adicionar campo `sugestao_automatica` (TEXT) - armazena a sugestão inicial do sistema

  2. Valores padrão:
     - `tipo_despesa`: NULL (permite classificação posterior)
     - `classificacao_manual`: false (padrão é classificação automática)
     - `sugestao_automatica`: NULL

  ## Notas Importantes
  - Despesas existentes não terão classificação inicial (tipo_despesa = NULL)
  - O sistema poderá sugerir classificações baseadas em regras de negócio
  - Usuários poderão reclassificar despesas a qualquer momento
*/

-- Adicionar campos de classificação à tabela expense_entries
DO $$
BEGIN
  -- Adicionar campo tipo_despesa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_entries' AND column_name = 'tipo_despesa'
  ) THEN
    ALTER TABLE expense_entries ADD COLUMN tipo_despesa TEXT CHECK (tipo_despesa IN ('fixa', 'variavel'));
  END IF;

  -- Adicionar campo categoria_personalizada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_entries' AND column_name = 'categoria_personalizada'
  ) THEN
    ALTER TABLE expense_entries ADD COLUMN categoria_personalizada TEXT;
  END IF;

  -- Adicionar campo classificacao_manual
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_entries' AND column_name = 'classificacao_manual'
  ) THEN
    ALTER TABLE expense_entries ADD COLUMN classificacao_manual BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar campo sugestao_automatica
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expense_entries' AND column_name = 'sugestao_automatica'
  ) THEN
    ALTER TABLE expense_entries ADD COLUMN sugestao_automatica TEXT;
  END IF;
END $$;

-- Criar índice para melhorar performance de queries que filtram por tipo de despesa
CREATE INDEX IF NOT EXISTS idx_expense_entries_tipo_despesa 
  ON expense_entries(tipo_despesa);

-- Criar índice para queries que buscam despesas não classificadas
CREATE INDEX IF NOT EXISTS idx_expense_entries_classificacao 
  ON expense_entries(report_id, tipo_despesa) 
  WHERE tipo_despesa IS NULL;