/*
  # Sistema de Relatório DRE - Schema Inicial

  1. Novas Tabelas
    - `clinics`
      - `id` (uuid, primary key) - Identificador único da clínica
      - `name` (text) - Nome da unidade/clínica
      - `created_at` (timestamptz) - Data de criação do registro
      - `updated_at` (timestamptz) - Data da última atualização
    
    - `financial_reports`
      - `id` (uuid, primary key) - Identificador único do relatório
      - `clinic_id` (uuid, foreign key) - Referência à clínica
      - `report_month` (date) - Mês/ano de referência do relatório
      - `bank_statement_file` (text) - Nome do arquivo de extrato bancário
      - `revenues_file` (text) - Nome do arquivo CSV de receitas
      - `expenses_file` (text) - Nome do arquivo CSV de despesas
      - `status` (text) - Status do processamento (pending, processing, completed, error)
      - `dre_data` (jsonb) - Dados processados do DRE em formato JSON
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização
    
    - `revenue_entries`
      - `id` (uuid, primary key) - Identificador único
      - `report_id` (uuid, foreign key) - Referência ao relatório
      - `date` (date) - Data da receita
      - `description` (text) - Descrição da receita
      - `category` (text) - Categoria da receita
      - `amount` (decimal) - Valor da receita
      - `created_at` (timestamptz) - Data de criação
    
    - `expense_entries`
      - `id` (uuid, primary key) - Identificador único
      - `report_id` (uuid, foreign key) - Referência ao relatório
      - `date` (date) - Data da despesa
      - `description` (text) - Descrição da despesa
      - `category` (text) - Categoria da despesa
      - `amount` (decimal) - Valor da despesa
      - `created_at` (timestamptz) - Data de criação

  2. Segurança (RLS)
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados poderem acessar todos os dados
    - Estrutura preparada para futura implementação de controle por usuário/clínica

  3. Índices
    - Índice em clinic_id para otimizar buscas de relatórios por clínica
    - Índice em report_id para otimizar buscas de entradas por relatório
    - Índice em report_month para facilitar consultas por período
*/

-- Criar tabela de clínicas
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de relatórios financeiros
CREATE TABLE IF NOT EXISTS financial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  report_month date NOT NULL,
  bank_statement_file text,
  revenues_file text,
  expenses_file text,
  status text DEFAULT 'pending' NOT NULL,
  dre_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de receitas
CREATE TABLE IF NOT EXISTS revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES financial_reports(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount decimal(15, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de despesas
CREATE TABLE IF NOT EXISTS expense_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES financial_reports(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount decimal(15, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_financial_reports_clinic_id ON financial_reports(clinic_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_month ON financial_reports(report_month);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_report_id ON revenue_entries(report_id);
CREATE INDEX IF NOT EXISTS idx_expense_entries_report_id ON expense_entries(report_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;

-- Políticas para clinics
CREATE POLICY "Users can view all clinics"
  ON clinics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert clinics"
  ON clinics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update clinics"
  ON clinics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete clinics"
  ON clinics FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para financial_reports
CREATE POLICY "Users can view all reports"
  ON financial_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert reports"
  ON financial_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update reports"
  ON financial_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete reports"
  ON financial_reports FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para revenue_entries
CREATE POLICY "Users can view all revenue entries"
  ON revenue_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert revenue entries"
  ON revenue_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update revenue entries"
  ON revenue_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete revenue entries"
  ON revenue_entries FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para expense_entries
CREATE POLICY "Users can view all expense entries"
  ON expense_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert expense entries"
  ON expense_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update expense entries"
  ON expense_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete expense entries"
  ON expense_entries FOR DELETE
  TO authenticated
  USING (true);