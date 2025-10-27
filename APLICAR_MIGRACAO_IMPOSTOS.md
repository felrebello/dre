# Como Aplicar a Migração de Impostos

## Problema Identificado

A aplicação está tentando salvar dados na coluna `categoria_imposto` da tabela `expense_entries`, mas essa coluna não existe no banco de dados porque a migração SQL não foi aplicada.

## Erro Observado

```
"Could not find the 'categoria_imposto' column of 'expense_entries' in the schema cache"
```

## Solução: Aplicar a Migração

### Opção 1: Via Console do Supabase (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Cole o seguinte código SQL:

```sql
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
```

6. Clique em **Run** (ou pressione `Ctrl + Enter`)
7. Aguarde a confirmação de sucesso

### Opção 2: Via Supabase CLI (Se instalado)

Se você tiver o Supabase CLI instalado, execute:

```bash
# Aplicar migrações pendentes
supabase db push

# Ou aplicar uma migração específica
supabase migration up
```

## Verificação

Para verificar se a migração foi aplicada corretamente:

1. No **SQL Editor** do Supabase, execute:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expense_entries'
  AND column_name IN ('e_imposto', 'tipo_imposto', 'categoria_imposto')
ORDER BY column_name;
```

2. Você deve ver as três colunas listadas:
   - `categoria_imposto` (text, YES)
   - `e_imposto` (boolean, YES)
   - `tipo_imposto` (text, YES)

## Após Aplicar a Migração

1. Recarregue a aplicação no navegador (`Ctrl + F5` ou `Cmd + Shift + R`)
2. Tente editar uma despesa novamente
3. O erro deve ter sido resolvido

## Notas Importantes

- Esta migração é **segura** e **idempotente** (pode ser executada múltiplas vezes sem problemas)
- Não afeta dados existentes
- Adiciona apenas novas colunas à tabela `expense_entries`
- O script verifica se as colunas já existem antes de tentar criá-las

## Em Caso de Dúvidas

Se o erro persistir após aplicar a migração:

1. Verifique se você está conectado ao banco de dados correto
2. Limpe o cache do navegador
3. Verifique os logs do Supabase para erros adicionais
