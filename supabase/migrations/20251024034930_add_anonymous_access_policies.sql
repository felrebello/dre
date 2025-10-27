/*
  # Adicionar Políticas de Acesso Anônimo

  1. Alterações de Segurança
    - Adicionar políticas RLS para permitir acesso anônimo (público) a todas as tabelas
    - Manter políticas de usuários autenticados como fallback
    - Permite que a aplicação funcione sem sistema de autenticação
  
  2. Tabelas Afetadas
    - `clinics` - Permitir operações CRUD para usuários anônimos
    - `financial_reports` - Permitir operações CRUD para usuários anônimos
    - `revenue_entries` - Permitir operações CRUD para usuários anônimos
    - `expense_entries` - Permitir operações CRUD para usuários anônimos
  
  3. Nota de Segurança
    - Esta configuração é adequada para ambientes de desenvolvimento e testes
    - Para produção, recomenda-se implementar autenticação completa
    - Os dados ficam acessíveis publicamente através da API do Supabase
*/

-- Políticas de acesso público para clinics
CREATE POLICY "Allow public to view all clinics"
  ON clinics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public to insert clinics"
  ON clinics FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public to update clinics"
  ON clinics FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete clinics"
  ON clinics FOR DELETE
  TO anon
  USING (true);

-- Políticas de acesso público para financial_reports
CREATE POLICY "Allow public to view all reports"
  ON financial_reports FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public to insert reports"
  ON financial_reports FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public to update reports"
  ON financial_reports FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete reports"
  ON financial_reports FOR DELETE
  TO anon
  USING (true);

-- Políticas de acesso público para revenue_entries
CREATE POLICY "Allow public to view all revenue entries"
  ON revenue_entries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public to insert revenue entries"
  ON revenue_entries FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public to update revenue entries"
  ON revenue_entries FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete revenue entries"
  ON revenue_entries FOR DELETE
  TO anon
  USING (true);

-- Políticas de acesso público para expense_entries
CREATE POLICY "Allow public to view all expense entries"
  ON expense_entries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public to insert expense entries"
  ON expense_entries FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public to update expense entries"
  ON expense_entries FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to delete expense entries"
  ON expense_entries FOR DELETE
  TO anon
  USING (true);