# Instruções para Executar o Sistema de Relatórios DRE

## ⚠️ IMPORTANTE: Migração de Banco de Dados Pendente

Se você encontrar o erro:
```
"Could not find the 'categoria_imposto' column of 'expense_entries' in the schema cache"
```

Você precisa aplicar a migração de impostos ao banco de dados. **Consulte o arquivo `APLICAR_MIGRACAO_IMPOSTOS.md` para instruções detalhadas.**

Resumo rápido:
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Execute o script da migração em `supabase/migrations/20251027185440_add_tax_fields.sql`

---

## Problema Comum: Relatórios Sem Formatação

Se os relatórios aparecerem sem formatação (sem cores, estilos, ou completamente "quebrados"), siga estas etapas:

### Solução 1: Limpar Cache do Navegador

1. **Chrome/Edge**: Pressione `Ctrl + Shift + Delete` (Windows/Linux) ou `Cmd + Shift + Delete` (Mac)
   - Selecione "Imagens e arquivos em cache"
   - Clique em "Limpar dados"

2. **Firefox**: Pressione `Ctrl + Shift + Delete`
   - Selecione "Cache"
   - Clique em "Limpar agora"

3. **Safari**: Pressione `Cmd + Option + E` para limpar o cache

### Solução 2: Recarregar Forçadamente a Página

1. Pressione `Ctrl + F5` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
2. Ou clique com botão direito no botão de recarregar e selecione "Recarregar sem cache"

### Solução 3: Reiniciar o Servidor de Desenvolvimento

Se você está executando o projeto localmente:

```bash
# 1. Pare o servidor (Ctrl + C no terminal)

# 2. Limpe os arquivos de build
rm -rf dist node_modules/.vite

# 3. Reinstale as dependências (se necessário)
npm install

# 4. Inicie o servidor novamente
npm run dev
```

### Solução 4: Rebuild Completo

```bash
# Limpar tudo e reconstruir
rm -rf dist node_modules/.vite
npm run build
npm run dev
```

## Execução Normal do Projeto

### Desenvolvimento Local

```bash
# 1. Instalar dependências (primeira vez ou após atualizar)
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# O servidor iniciará em http://localhost:5173
```

### Build para Produção

```bash
# Criar build de produção
npm run build

# Preview do build
npm run preview
```

## Verificação de Formatação

Se após seguir os passos acima o relatório ainda estiver sem formatação:

1. Abra as ferramentas de desenvolvedor (F12)
2. Vá para a aba "Console"
3. Procure por erros em vermelho
4. Vá para a aba "Network"
5. Recarregue a página
6. Verifique se o arquivo CSS está sendo carregado (procure por arquivos `.css`)

Se o arquivo CSS não estiver sendo carregado ou houver erro 404, o problema pode estar no servidor web ou configuração de deploy.

## Suporte

O código fonte inclui formatação completa usando Tailwind CSS com:
- Gradientes de cores
- Sombras e bordas arredondadas
- Espaçamento responsivo
- Ícones e badges coloridos
- Animações e transições

Todos os componentes principais têm formatação completa:
- `DREReport.tsx`: Relatório principal com todos os estilos
- `DashboardCharts.tsx`: Gráficos e visualizações
- `ExpenseDetailedTable.tsx`: Tabelas detalhadas formatadas

Se o problema persistir, verifique se:
1. O arquivo `src/index.css` existe e está sendo importado
2. As dependências do Tailwind CSS estão instaladas
3. O arquivo `tailwind.config.js` está presente
