# Instruções para Executar o Sistema DRE com Firebase

## ⚠️ IMPORTANTE: Configuração Inicial Obrigatória

Antes de executar o projeto pela primeira vez, você **DEVE** configurar o Firebase.

**Siga o guia completo em [`SETUP_FIREBASE.md`](./SETUP_FIREBASE.md)**

Resumo rápido:
1. Criar projeto no Firebase Console
2. Ativar Authentication com Google
3. Criar banco Firestore
4. Configurar Storage
5. Copiar credenciais para `.env`
6. Aplicar regras de segurança

---

## 🚀 Execução Rápida

### Primeira Vez

```bash
# 1. Instalar dependências
npm install

# 2. Instalar Firebase CLI
npm install -g firebase-tools

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Firebase

# 4. Fazer login no Firebase
firebase login

# 5. Associar ao projeto
firebase use --add

# 6. Aplicar regras de segurança
firebase deploy --only firestore:rules,storage:rules,firestore:indexes

# 7. Iniciar aplicação
npm run dev
```

### Execuções Seguintes

```bash
# Apenas inicie o servidor
npm run dev
```

Acesse: **http://localhost:5173**

---

## 📦 Instalação Detalhada

### 1. Instalar Dependências do Projeto

```bash
npm install
```

Isso instalará todas as dependências listadas em `package.json`:
- React, TypeScript, Vite
- Firebase SDK
- Tailwind CSS, Recharts, jsPDF, etc.

### 2. Instalar Firebase CLI (Globalmente)

```bash
npm install -g firebase-tools
```

Ou com Yarn:
```bash
yarn global add firebase-tools
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o `.env` e preencha com as credenciais do seu projeto Firebase (obtidas no Firebase Console):

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Autenticar no Firebase

```bash
firebase login
```

Isso abrirá seu navegador para fazer login com sua conta Google.

### 5. Associar Projeto Local ao Firebase

```bash
firebase use --add
```

Selecione o projeto que você criou no Firebase Console e dê um alias (pode ser `default`).

### 6. Aplicar Configurações do Firebase

```bash
# Aplicar regras de segurança e índices
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

Isso aplicará:
- **Firestore Rules**: Controle de acesso aos dados
- **Storage Rules**: Controle de upload de arquivos
- **Firestore Indexes**: Otimização de queries

---

## 🖥️ Modos de Execução

### Modo Desenvolvimento (Local)

```bash
npm run dev
```

Inicia o servidor de desenvolvimento em **http://localhost:5173** com:
- Hot Module Replacement (HMR)
- Recarga automática ao salvar arquivos
- Mensagens de erro detalhadas

### Modo Desenvolvimento com Emuladores Firebase

Para desenvolver sem afetar o banco de produção:

**Terminal 1** - Emuladores:
```bash
firebase emulators:start
```

**Terminal 2** - Aplicação:
```bash
npm run dev
```

Acesse:
- App: http://localhost:5173
- Firestore UI: http://localhost:4000
- Authentication: http://localhost:9099

### Modo Produção (Build Local)

```bash
# Criar build otimizado
npm run build

# Testar o build
npm run preview
```

O build fica na pasta `dist/`.

---

## 🌐 Deploy para Produção

### Deploy Completo

```bash
npm run firebase:deploy
```

Ou manualmente:

```bash
# 1. Criar build
npm run build

# 2. Deploy no Firebase Hosting
firebase deploy --only hosting

# 3. (Opcional) Deploy de regras também
firebase deploy
```

Após o deploy, você receberá a URL pública:
```
Hosting URL: https://seu-projeto.web.app
```

### Deploy Seletivo

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

---

## 🔧 Resolução de Problemas

### Problema: Tela branca ou erros de autenticação

**Solução**:
1. Verifique se o `.env` existe e está preenchido corretamente
2. Reinicie o servidor de desenvolvimento (`Ctrl + C` e `npm run dev` novamente)
3. Limpe o cache do navegador (`Ctrl + Shift + Delete`)
4. Verifique se o domínio está autorizado no Firebase:
   - Firebase Console > Authentication > Settings > Authorized domains
   - Adicione `localhost` se estiver ausente

### Problema: Erro "Missing Firebase configuration"

**Solução**:
```bash
# 1. Verifique se o .env existe
ls -la .env

# 2. Se não existir, crie:
cp .env.example .env

# 3. Edite com as credenciais corretas
nano .env  # ou vim, code, etc.

# 4. Reinicie o servidor
npm run dev
```

### Problema: Erro "Permission denied" ao acessar Firestore

**Solução**:
```bash
# Aplicar regras de segurança
firebase deploy --only firestore:rules

# Verificar se as regras foram aplicadas
# Firebase Console > Firestore Database > Rules
```

### Problema: Build falha ou componentes não aparecem

**Solução**:
```bash
# 1. Limpar cache e node_modules
rm -rf node_modules/.vite dist

# 2. Reinstalar dependências
npm install

# 3. Verificar tipos TypeScript
npm run typecheck

# 4. Tentar build novamente
npm run build
```

### Problema: Firebase CLI não encontrado

**Solução**:
```bash
# Instalar globalmente
npm install -g firebase-tools

# Ou usar npx (sem instalar globalmente)
npx firebase login
npx firebase deploy
```

### Problema: Emuladores não iniciam

**Solução**:
```bash
# Verificar se as portas estão livres
# Se alguma porta estiver ocupada, edite firebase.json

# Matar processos que podem estar usando as portas
# macOS/Linux:
lsof -ti:4000,8080,9099,9199 | xargs kill -9

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000,8080,9099,9199).OwningProcess | Stop-Process
```

### Problema: CSVs não são processados corretamente

**Verifique o formato**:
- Encoding: UTF-8
- Separador: vírgula (,)
- Colunas obrigatórias: data, descrição, categoria, valor
- Formato de data: YYYY-MM-DD
- Formato de valor: números com ponto decimal (ex: 1234.56)

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor dev com HMR
npm run preview          # Preview do build de produção

# Build
npm run build            # Build otimizado para produção
npm run typecheck        # Verificar tipos TypeScript

# Linting
npm run lint             # Executar ESLint

# Firebase
npm run firebase:deploy  # Build + deploy completo
firebase emulators:start # Iniciar emuladores locais
firebase deploy          # Deploy manual
firebase login           # Login no Firebase
firebase logout          # Logout do Firebase
firebase use             # Trocar projeto ativo
```

---

## 🗂️ Estrutura de Pastas

```
dre/
├── src/                 # Código fonte
├── public/              # Arquivos estáticos
├── dist/                # Build de produção (gerado)
├── node_modules/        # Dependências (gerado)
├── .env                 # Variáveis de ambiente (NÃO commitar)
├── .env.example         # Exemplo de variáveis
├── firebase.json        # Configuração do Firebase
├── firestore.rules      # Regras de segurança do Firestore
├── storage.rules        # Regras de segurança do Storage
├── .firebaserc          # Projeto Firebase ativo
├── package.json         # Dependências e scripts
└── vite.config.ts       # Configuração do Vite
```

---

## ✅ Checklist Pré-Deploy

Antes de fazer deploy para produção:

- [ ] Todas as variáveis do `.env` estão configuradas
- [ ] Regras do Firestore foram aplicadas
- [ ] Regras do Storage foram aplicadas
- [ ] Índices do Firestore foram criados
- [ ] Build local funciona (`npm run build && npm run preview`)
- [ ] Testes manuais realizados
- [ ] Domínio personalizado configurado (opcional)
- [ ] Analytics configurado (opcional)

---

## 📚 Recursos Adicionais

- 📖 [Guia de Setup Completo](./SETUP_FIREBASE.md)
- 📖 [README do Projeto](./README.md)
- 🔥 [Documentação do Firebase](https://firebase.google.com/docs)
- ⚡ [Documentação do Vite](https://vitejs.dev/)
- ⚛️ [Documentação do React](https://react.dev/)

---

## 🆘 Suporte

Se os problemas persistirem:

1. **Console do Navegador**: Pressione F12 e verifique a aba Console
2. **Logs do Firebase**: Firebase Console > Firestore > Logs
3. **Logs do Terminal**: Verifique mensagens de erro no terminal
4. **Documentação**: Consulte SETUP_FIREBASE.md e README.md

---

**Pronto para começar? Execute `npm run dev` e boa codificação! 🚀**
