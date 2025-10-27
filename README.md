# 📊 DRE Financial Reports - Sistema de Relatórios Gerenciais

Sistema completo para geração automatizada de Demonstrativos de Resultados do Exercício (DRE) com análise financeira detalhada, desenvolvido com **React**, **TypeScript** e **Firebase**.

## 🚀 Funcionalidades Principais

### 📈 Geração Automática de DRE
- Upload de arquivos CSV (receitas, despesas, extrato bancário)
- Processamento automático e categorização de transações
- Cálculo de margens (bruta, operacional, líquida)
- Classificação de despesas (fixas vs. variáveis)
- Identificação automática de impostos
- Reconciliação bancária

### 📊 Dashboards e Visualizações
- Gráficos interativos (linha, barra, pizza)
- Comparação entre períodos
- Análise de tendências
- Indicadores de desempenho (KPIs)
- Exportação de relatórios em PDF

### 🔐 Autenticação e Segurança
- Login com Google (Firebase Authentication)
- Controle de acesso por usuário
- Regras de segurança no Firestore e Storage
- Dados isolados por clínica/empresa

### 💾 Armazenamento em Nuvem
- **Firestore**: Banco de dados NoSQL escalável
- **Firebase Storage**: Armazenamento seguro de arquivos
- **Firebase Hosting**: Hospedagem com CDN global

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Ícones modernos
- **Recharts** - Gráficos e visualizações
- **jsPDF** - Geração de PDFs
- **XLSX** - Processamento de planilhas

### Backend/Infraestrutura
- **Firebase 10** - Backend as a Service (BaaS)
  - Authentication (Google Auth)
  - Firestore Database
  - Cloud Storage
  - Hosting
- **Firestore Rules** - Segurança e validação de dados
- **Storage Rules** - Controle de upload de arquivos

### Ferramentas de Desenvolvimento
- **ESLint** - Linting de código
- **PostCSS** - Processamento CSS
- **Autoprefixer** - Compatibilidade entre navegadores

## 📁 Estrutura do Projeto

```
dre/
├── src/
│   ├── components/          # Componentes React
│   │   ├── AuthProvider.tsx      # Contexto de autenticação
│   │   ├── LoginPage.tsx         # Página de login
│   │   ├── ClinicSelector.tsx    # Seleção de clínicas
│   │   ├── FileUpload.tsx        # Upload de arquivos
│   │   ├── ExpenseClassification.tsx  # Classificação de despesas
│   │   ├── ExpenseManager.tsx    # Gerenciamento de despesas
│   │   ├── DREReport.tsx         # Visualização do DRE
│   │   ├── DashboardCharts.tsx   # Gráficos e dashboards
│   │   ├── SavedReportsList.tsx  # Lista de relatórios
│   │   └── ReportsComparison.tsx # Comparação de períodos
│   ├── lib/
│   │   └── firebase.ts      # Configuração e funções do Firebase
│   ├── types/
│   │   └── tax.ts           # Tipos de impostos
│   ├── utils/
│   │   ├── csvParser.ts     # Processamento de CSVs
│   │   ├── dreGenerator.ts  # Geração do DRE
│   │   ├── excelParser.ts   # Processamento de Excel
│   │   └── pdfExporter.ts   # Exportação para PDF
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Ponto de entrada
├── public/                  # Arquivos estáticos
├── firestore.rules          # Regras de segurança do Firestore
├── storage.rules            # Regras de segurança do Storage
├── firebase.json            # Configuração do Firebase
├── firestore.indexes.json   # Índices do Firestore
├── .firebaserc              # Projeto Firebase ativo
├── .env.example             # Exemplo de variáveis de ambiente
├── package.json             # Dependências do projeto
├── vite.config.ts           # Configuração do Vite
├── tailwind.config.js       # Configuração do Tailwind
├── tsconfig.json            # Configuração do TypeScript
├── SETUP_FIREBASE.md        # Guia completo de configuração
└── README.md                # Este arquivo
```

## 🚦 Como Começar

### Pré-requisitos

- **Node.js** 18+ e npm
- Conta Google (para Firebase)
- Firebase CLI (instalação abaixo)

### 1. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/dre-financial-reports.git
cd dre-financial-reports

# Instale as dependências
npm install

# Instale o Firebase CLI globalmente
npm install -g firebase-tools
```

### 2. Configuração do Firebase

⚠️ **IMPORTANTE**: Siga o guia completo em [`SETUP_FIREBASE.md`](./SETUP_FIREBASE.md) para:

1. Criar projeto no Firebase Console
2. Ativar Authentication (Google)
3. Criar banco Firestore
4. Configurar Storage
5. Obter credenciais

### 3. Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais do Firebase
# (obtidas no Firebase Console > Project Settings)
```

Exemplo de `.env`:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Configurar Projeto Firebase

```bash
# Faça login no Firebase
firebase login

# Associe o projeto local ao projeto do Firebase
firebase use --add

# Atualize o .firebaserc com o ID do seu projeto
# {
#   "projects": {
#     "default": "seu-projeto-id"
#   }
# }
```

### 5. Deploy de Regras de Segurança

```bash
# Aplique as regras do Firestore
firebase deploy --only firestore:rules

# Aplique as regras do Storage
firebase deploy --only storage:rules

# Crie os índices do Firestore
firebase deploy --only firestore:indexes
```

### 6. Executar Localmente

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Acesse http://localhost:5173
```

### 7. Deploy para Produção

```bash
# Build + Deploy
npm run firebase:deploy

# Ou separadamente:
npm run build
firebase deploy --only hosting
```

## 📖 Como Usar

### Fluxo de Trabalho

1. **Login**: Entre com sua conta Google
2. **Selecionar/Criar Clínica**: Escolha ou crie uma clínica/empresa
3. **Upload de Arquivos**: Envie CSVs de receitas e despesas
   - Receitas: `data, descrição, categoria, valor`
   - Despesas: `data, descrição, categoria, valor`
   - Extrato Bancário (opcional): `data, descrição, valor`
4. **Classificar Despesas**: Classifique como fixas ou variáveis
5. **Visualizar DRE**: Analise o relatório gerado automaticamente
6. **Gerenciar**: Edite despesas, adicione manualmente, exporte PDF

### Formato dos CSVs

**Receitas (revenues.csv)**:
```csv
data,descrição,categoria,valor
2025-01-15,Consulta Médica,Serviços,350.00
2025-01-20,Procedimento,Serviços,1200.00
```

**Despesas (expenses.csv)**:
```csv
data,descrição,categoria,valor
2025-01-05,Aluguel,Administrativas,3000.00
2025-01-10,Energia Elétrica,Administrativas,450.00
2025-01-15,Salário Recepcionista,Pessoal,2500.00
```

**Extrato Bancário (bank_statement.csv)** - Opcional:
```csv
data,descrição,valor
2025-01-15,Recebimento Consulta,350.00
2025-01-05,Pagamento Aluguel,-3000.00
```

## 🔐 Segurança

### Regras do Firestore
- Usuários só acessam suas próprias clínicas
- Isolamento completo de dados entre usuários
- Validação de tipos e campos obrigatórios

### Regras do Storage
- Upload limitado a 10MB
- Apenas arquivos PDF, CSV e Excel permitidos
- Armazenamento isolado por usuário

### Autenticação
- Google OAuth 2.0
- Tokens JWT gerenciados automaticamente
- Sessões seguras com refresh automático

## 📊 Estrutura do Firestore

```
📁 clinics/
  └── {clinicId}
      ├── name: string
      ├── userId: string
      └── ...

📁 financial_reports/
  └── {reportId}
      ├── clinic_id: string
      ├── report_month: string (YYYY-MM-DD)
      ├── dre_data: object
      ├── status: 'completed' | 'processing' | 'error'
      └── ...
      │
      ├── 📁 revenue_entries/
      │   └── {revenueId}
      │       ├── date, description, category, amount
      │
      └── 📁 expense_entries/
          └── {expenseId}
              ├── date, description, category, amount
              ├── tipo_despesa: 'fixa' | 'variavel'
              ├── e_imposto: boolean
              └── ...
```

## 🧪 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor dev (http://localhost:5173)

# Build
npm run build            # Cria build de produção
npm run preview          # Preview do build

# Firebase
npm run firebase:deploy  # Build + deploy completo
firebase emulators:start # Emuladores locais do Firebase

# Qualidade de Código
npm run lint             # ESLint
npm run typecheck        # Verificação de tipos TypeScript
```

### Emuladores do Firebase

Para desenvolvimento local sem afetar produção:

```bash
firebase emulators:start
```

Acesse:
- Firestore UI: http://localhost:4000
- Auth: http://localhost:9099
- Storage: http://localhost:9199

## 🐛 Problemas Comuns

### Erro: "Missing Firebase configuration"
- Verifique se o `.env` existe e está preenchido
- Reinicie o servidor após editar o `.env`

### Erro: "Permission denied"
- Verifique se está autenticado
- Confirme que as regras do Firestore foram aplicadas

### Erro: "Network request failed"
- Verifique sua conexão com a internet
- Certifique-se de que o Firebase está configurado corretamente

## 📝 Licença

Este projeto é privado. Todos os direitos reservados.

## 👥 Contribuindo

Para contribuir:

1. Faça fork do projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

- 📧 Email: suporte@seu-dominio.com
- 📚 Documentação: [SETUP_FIREBASE.md](./SETUP_FIREBASE.md)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/dre-financial-reports/issues)

---

**Desenvolvido com ❤️ usando React, TypeScript e Firebase**
