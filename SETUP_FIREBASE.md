# Configuração do Firebase - Guia Completo

Este guia vai te ajudar a configurar o Firebase para o projeto DRE (Demonstrativo de Resultados do Exercício).

## 📋 Pré-requisitos

- Conta Google
- Node.js instalado (versão 18 ou superior)
- Firebase CLI instalado globalmente

## 🚀 Passo 1: Criar Projeto no Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"** ou **"Create a project"**
3. Digite o nome do projeto: `dre-financial-reports` (ou o nome que preferir)
4. (Opcional) Desabilite o Google Analytics se não for usar
5. Clique em **"Criar projeto"**

## 🔧 Passo 2: Configurar Firebase Authentication

1. No Firebase Console, vá em **Authentication** no menu lateral
2. Clique em **"Get Started"** ou **"Começar"**
3. Na aba **"Sign-in method"**, clique em **Google**
4. **Ative** o provedor do Google
5. Selecione um email de suporte do projeto
6. Clique em **"Salvar"**

## 💾 Passo 3: Configurar Cloud Firestore

1. No Firebase Console, vá em **Firestore Database**
2. Clique em **"Create database"** ou **"Criar banco de dados"**
3. Selecione **"Start in production mode"** (vamos usar nossas próprias regras de segurança)
4. Escolha a localização do servidor (recomendado: `southamerica-east1` para o Brasil)
5. Clique em **"Enable"** ou **"Ativar"**

## 📦 Passo 4: Configurar Cloud Storage

1. No Firebase Console, vá em **Storage**
2. Clique em **"Get Started"** ou **"Começar"**
3. Clique em **"Next"** nas regras de segurança (vamos configurar nossas próprias)
4. Escolha a mesma localização do Firestore
5. Clique em **"Done"** ou **"Concluir"**

## 🔑 Passo 5: Obter Credenciais do Firebase

1. No Firebase Console, clique no ícone de **engrenagem ⚙️** > **Project settings** (Configurações do projeto)
2. Na aba **"General"**, role até a seção **"Your apps"**
3. Clique no ícone **</>** (Web app)
4. Digite um apelido para o app: `DRE Web App`
5. **NÃO** marque "Also set up Firebase Hosting" (vamos fazer isso depois)
6. Clique em **"Register app"**
7. **COPIE** as configurações do Firebase Config que aparecem

Exemplo do que você vai copiar:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

## 📝 Passo 6: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo `.env` (copie do `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e preencha com os valores que você copiou:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
   ```

3. **IMPORTANTE**: Nunca commite o arquivo `.env` no Git (ele já está no `.gitignore`)

## 🔧 Passo 7: Instalar Firebase CLI

1. Instale o Firebase CLI globalmente:
   ```bash
   npm install -g firebase-tools
   ```

2. Faça login no Firebase:
   ```bash
   firebase login
   ```

3. Associe o projeto local ao projeto do Firebase:
   ```bash
   firebase use --add
   ```
   - Selecione o projeto que você criou
   - Digite um alias (pode ser apenas `default`)

4. Atualize o arquivo `.firebaserc` com o ID do seu projeto:
   ```json
   {
     "projects": {
       "default": "seu-projeto-id"
     }
   }
   ```

## 🛡️ Passo 8: Configurar Regras de Segurança

1. Aplique as regras do Firestore:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Aplique as regras do Storage:
   ```bash
   firebase deploy --only storage:rules
   ```

3. Crie os índices do Firestore:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## 📦 Passo 9: Instalar Dependências do Projeto

```bash
npm install
```

## 🚀 Passo 10: Executar o Projeto Localmente

### Modo Desenvolvimento (com emuladores Firebase - recomendado)

1. Inicie os emuladores do Firebase:
   ```bash
   npm run firebase:emulators
   ```
   Isso abrirá uma interface em `http://localhost:4000`

2. Em outro terminal, inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse `http://localhost:5173`

### Modo Desenvolvimento (com Firebase produção)

```bash
npm run dev
```

Acesse `http://localhost:5173`

## 🌐 Passo 11: Deploy para Produção

1. Faça o build do projeto:
   ```bash
   npm run build
   ```

2. Faça o deploy completo (hosting, regras, índices):
   ```bash
   firebase deploy
   ```

   Ou use o script npm:
   ```bash
   npm run firebase:deploy
   ```

3. Após o deploy, você receberá a URL do seu app hospedado:
   ```
   Hosting URL: https://seu-projeto.web.app
   ```

## 🔄 Comandos Úteis

### Deploy seletivo
```bash
# Apenas hosting
firebase deploy --only hosting

# Apenas regras do Firestore
firebase deploy --only firestore:rules

# Apenas regras do Storage
firebase deploy --only storage:rules

# Apenas índices
firebase deploy --only firestore:indexes
```

### Visualizar logs
```bash
firebase functions:log
```

### Abrir Firebase Console
```bash
firebase open
```

## 📊 Estrutura do Firestore

O projeto usa a seguinte estrutura de coleções:

```
📁 Firestore Database
  ├── 📁 clinics/
  │   └── {clinicId}
  │       ├── name: string
  │       ├── userId: string
  │       ├── created_at: timestamp
  │       └── updated_at: timestamp
  │
  └── 📁 financial_reports/
      └── {reportId}
          ├── clinic_id: string
          ├── report_month: string
          ├── status: string
          ├── dre_data: object
          ├── created_at: timestamp
          ├── updated_at: timestamp
          │
          ├── 📁 expense_entries/ (subcoleção)
          │   └── {expenseId}
          │       ├── date: string
          │       ├── description: string
          │       ├── category: string
          │       ├── amount: number
          │       ├── tipo_despesa: string
          │       └── ...
          │
          └── 📁 revenue_entries/ (subcoleção)
              └── {revenueId}
                  ├── date: string
                  ├── description: string
                  ├── category: string
                  └── amount: number
```

## 🔒 Segurança

As regras de segurança garantem que:
- Usuários só podem acessar suas próprias clínicas
- Usuários só podem acessar relatórios de suas clínicas
- Uploads de arquivos são limitados a 10MB
- Apenas arquivos PDF, CSV e Excel são aceitos

## ❓ Problemas Comuns

### Erro: "Missing Firebase configuration"
- Verifique se o arquivo `.env` existe e está preenchido corretamente
- Reinicie o servidor de desenvolvimento após criar/editar o `.env`

### Erro: "Firebase: Error (auth/unauthorized-domain)"
- Vá em Authentication > Settings > Authorized domains
- Adicione seu domínio (ex: `localhost`, `seu-app.web.app`)

### Erro: "Missing or insufficient permissions"
- Verifique se as regras de segurança foram aplicadas
- Execute: `firebase deploy --only firestore:rules,storage:rules`

### Emuladores não iniciam
- Verifique se as portas não estão em uso
- Tente mudar as portas em `firebase.json`

## 📚 Recursos Adicionais

- [Documentação do Firebase](https://firebase.google.com/docs)
- [Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

## 🆘 Suporte

Se encontrar problemas, verifique:
1. Console do navegador (F12) para erros
2. Firebase Console > Firestore > Regras
3. Firebase Console > Authentication > Usuários
4. Terminal para mensagens de erro

---

**Pronto!** Seu projeto está configurado com Firebase. 🎉
