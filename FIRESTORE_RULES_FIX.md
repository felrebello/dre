# Como Resolver Erros de Compilação no firestore.rules

## 🔍 Problema Identificado

Você está vendo erros de compilação no Firebase Console:
```
[E] 31:11 - Missing 'match' keyword before path.
[E] 32:1 - Unexpected '<'.
[E] 32:1 - mismatched input '<' expecting {'{', '/', PATH_SEGMENT}
[E] 44:1 - Unexpected '=='.
[E] 66:1 - Unexpected '>'.
[E] 88:1 - Unexpected '}'.
```

Esses erros indicam que há **marcadores de conflito de merge** no arquivo de regras que está no Firebase Console.

## ✅ Arquivo Local está Correto

O arquivo `firestore.rules` local está **correto e sem erros**. O problema está apenas no Firebase Console.

## 🛠️ Solução

### Opção 1: Deploy via Firebase CLI (Recomendado)

Esta é a forma mais simples e segura de resolver:

#### Passo 1: Fazer Login no Firebase

```bash
firebase login
```

Isso abrirá seu navegador para autenticação. Siga as instruções.

#### Passo 2: Verificar Projeto

```bash
firebase use
```

Isso mostrará qual projeto está ativo. Se necessário, altere com:

```bash
firebase use SEU_PROJECT_ID
```

#### Passo 3: Fazer Deploy das Regras

```bash
firebase deploy --only firestore:rules
```

Isso vai:
- ✅ Substituir as regras com conflito no Console
- ✅ Usar o arquivo `firestore.rules` local (que está correto)
- ✅ Resolver todos os erros de compilação

#### Passo 4: Verificar no Console

Acesse o [Firebase Console](https://console.firebase.google.com/) e vá em:
**Firestore Database → Rules**

As regras devem estar limpas e sem erros.

### Opção 2: Resolver Manualmente no Console

Se preferir resolver diretamente no Console:

#### Passo 1: Acessar o Firebase Console

1. Vá para https://console.firebase.google.com/
2. Selecione seu projeto
3. Clique em **Firestore Database** no menu lateral
4. Clique em **Rules** (Regras)

#### Passo 2: Identificar os Conflitos

Você verá algo assim:

```
<<<<<<< HEAD
    // Regras para Relatórios Financeiros
    match /financial_reports/{reportId} {
      function isClinicOwner() {
        return isAuthenticated() &&
               get(/databases/$(database)/documents/clinics/$(resource.data.clinic_id)).data.userId == request.auth.uid;
      }
=======
    // Regras para Relatórios Financeiros
    match /financial_reports/{reportId} {
      function isReportOwner() {
        return isAuthenticated() && resource.data.userId == request.auth.uid;
      }
>>>>>>> claude/fix-saved-reports-display
```

#### Passo 3: Limpar o Arquivo

**OPÇÃO A: Copiar do Arquivo Local**

1. Copie TODO o conteúdo do arquivo `firestore.rules` local
2. Cole no Console, substituindo tudo
3. Clique em **Publicar** (Publish)

**OPÇÃO B: Resolver os Conflitos Manualmente**

1. Delete todas as linhas com marcadores:
   - `<<<<<<< HEAD`
   - `=======`
   - `>>>>>>> nome-do-branch`

2. Escolha qual versão do código manter (mantenha a versão mais recente, geralmente a que está após `=======`)

3. Clique em **Publicar** (Publish)

## 📝 Conteúdo Correto das Regras

Se você quiser copiar e colar as regras corretas diretamente no Console, use este conteúdo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Função auxiliar para verificar autenticação
    function isAuthenticated() {
      return request.auth != null;
    }

    // Função auxiliar para verificar se o usuário é o dono
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Regras para Clínicas
    match /clinics/{clinicId} {
      // Permitir leitura se o usuário é o dono da clínica
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;

      // Permitir criação se o userId corresponde ao usuário autenticado
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;

      // Permitir atualização se o usuário é o dono
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;

      // Permitir exclusão se o usuário é o dono
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Regras para Relatórios Financeiros
    match /financial_reports/{reportId} {
      // Função auxiliar para verificar se o usuário é dono do relatório
      function isReportOwner() {
        return isAuthenticated() && resource.data.userId == request.auth.uid;
      }

      function isReportOwnerCreate() {
        return isAuthenticated() && request.resource.data.userId == request.auth.uid;
      }

      // Permitir leitura se o usuário é dono do relatório
      allow read: if isReportOwner();

      // Permitir criação se o userId corresponde ao usuário autenticado
      allow create: if isReportOwnerCreate();

      // Permitir atualização se o usuário é dono do relatório
      allow update: if isReportOwner();

      // Permitir exclusão se o usuário é dono do relatório
      allow delete: if isReportOwner();

      // Subcoleção de Despesas
      match /expense_entries/{expenseId} {
        allow read, write: if isReportOwner();
      }

      // Subcoleção de Receitas
      match /revenue_entries/{revenueId} {
        allow read, write: if isReportOwner();
      }
    }
  }
}
```

## 🚨 Importante

**ATENÇÃO:** Estas novas regras exigem que os relatórios tenham um campo `userId`.

Antes de publicar as regras, você DEVE:

1. ✅ Executar o script de migração: `node migrate-reports.js`
2. ✅ Verificar que todos os relatórios foram migrados com sucesso
3. ✅ Só então fazer deploy/publicar as novas regras

Caso contrário, os relatórios existentes ficarão inacessíveis!

Consulte o arquivo `MIGRATION_GUIDE.md` para instruções detalhadas de migração.

## 🔍 Verificação

Após fazer o deploy/publicar:

1. Verifique se não há erros de compilação no Console
2. Teste a aplicação para ver se consegue:
   - ✅ Ver a lista de relatórios salvos
   - ✅ Abrir um relatório
   - ✅ Criar um novo relatório
   - ✅ Deletar um relatório

## 🆘 Troubleshooting

### Erro: "Failed to authenticate, have you run firebase login?"

Execute:
```bash
firebase login
```

### Erro: "Permission denied" após publicar regras

Isso significa que a migração não foi feita. Execute:
```bash
node migrate-reports.js
```

### Erro: "firebase: command not found"

Instale o Firebase CLI:
```bash
npm install -g firebase-tools
```

### Regras publicadas mas continuam com erro

1. Limpe o cache do navegador
2. Aguarde alguns minutos (pode haver delay na propagação)
3. Force refresh (Ctrl+F5 ou Cmd+Shift+R)

## 📚 Documentação Relacionada

- `MIGRATION_GUIDE.md` - Guia completo de migração
- `migrate-reports.js` - Script de migração de dados
- `firestore.rules` - Arquivo local com regras corretas

## ✅ Checklist

- [ ] Executar `firebase login`
- [ ] Executar migração de dados: `node migrate-reports.js`
- [ ] Fazer deploy: `firebase deploy --only firestore:rules`
- [ ] Verificar no Console que não há erros
- [ ] Testar a aplicação
