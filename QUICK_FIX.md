# 🚨 SOLUÇÃO RÁPIDA - Erros de Permissões e Índices

## 🔍 Problema Identificado

Você está vendo dois tipos de erros:

### 1. Missing or insufficient permissions
```
FirebaseError: Missing or insufficient permissions.
```
**Causa:** Os relatórios existentes não têm o campo `userId`, e as novas regras exigem esse campo.

### 2. The query requires an index
```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```
**Causa:** As queries que filtram por `userId` + `report_month` precisam de um índice composto.

---

## ✅ SOLUÇÃO COMPLETA (Execute nesta ordem!)

### Passo 1: Instalar Dependências

```bash
npm install firebase-admin
```

### Passo 2: Executar Migração de Dados

**IMPORTANTE:** Faça isso ANTES de fazer deploy das regras!

#### 2.1 Configure as Credenciais do Firebase

**Obter o Service Account Key:**
1. Acesse https://console.firebase.google.com/
2. Selecione seu projeto: **nort-dre**
3. Vá em **Configurações do Projeto** (ícone de engrenagem) → **Contas de serviço**
4. Clique em **Gerar nova chave privada**
5. Salve o arquivo JSON baixado em um local seguro (ex: `~/serviceAccountKey.json`)

**⚠️ IMPORTANTE:** Nunca faça commit desse arquivo! Ele contém credenciais sensíveis.

#### 2.2 Configure a Variável de Ambiente

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/serviceAccountKey.json"
```

Ou substitua `$HOME` pelo caminho completo onde salvou o arquivo.

#### 2.3 Execute o Script de Migração

```bash
node migrate-reports.js
```

Você verá uma saída como:
```
Iniciando migração de relatórios...

Encontrados 15 relatórios para verificar.

✅ Relatório abc123 migrado com sucesso (userId: user123)
✅ Relatório def456 migrado com sucesso (userId: user123)
...

============================================================
RESUMO DA MIGRAÇÃO
============================================================
Total de relatórios: 15
✅ Migrados: 15
⏭️  Pulados (já tinham userId): 0
❌ Erros: 0
============================================================

✅ Migração concluída com sucesso!
```

**Se houver erros:**
- Verifique se as credenciais estão corretas
- Verifique se o arquivo de service account está no caminho certo
- Consulte o arquivo `MIGRATION_GUIDE.md` para mais detalhes

---

### Passo 3: Fazer Deploy das Regras e Índices

#### 3.1 Fazer Login no Firebase

```bash
firebase login
```

Siga as instruções para autenticar no navegador.

#### 3.2 Verificar o Projeto Ativo

```bash
firebase use
```

Deve mostrar: `Active Project: nort-dre`

Se não estiver correto:
```bash
firebase use nort-dre
```

#### 3.3 Deploy das Regras e Índices

```bash
firebase deploy --only firestore
```

Isso vai fazer deploy de:
- ✅ Regras de segurança (`firestore.rules`)
- ✅ Índices compostos (`firestore.indexes.json`)

**Aguarde a conclusão!** Pode levar alguns minutos para os índices serem criados.

---

### Passo 4: Verificar no Console

#### 4.1 Verificar Regras

1. Acesse https://console.firebase.google.com/
2. Selecione o projeto **nort-dre**
3. Vá em **Firestore Database** → **Rules**
4. Verifique se não há erros de compilação

#### 4.2 Verificar Índices

1. No Console do Firebase, vá em **Firestore Database** → **Indexes**
2. Você deve ver um índice sendo criado:
   ```
   Collection: financial_reports
   Fields: userId (Asc), report_month (Desc)
   Status: Building... ou Enabled
   ```

**Aguarde até o status mudar para "Enabled" (pode levar 5-10 minutos)**

---

### Passo 5: Testar a Aplicação

1. Recarregue a página da aplicação (Ctrl+F5 ou Cmd+Shift+R)
2. Vá para **"Meus Relatórios"**
3. Verifique se os relatórios aparecem sem erros

**Testes a fazer:**
- [ ] Ver lista de relatórios salvos
- [ ] Abrir um relatório individual
- [ ] Criar um novo relatório
- [ ] Duplicar um relatório
- [ ] Deletar um relatório
- [ ] Comparar relatórios

---

## 🔧 Troubleshooting

### Erro: "Failed to authenticate"

```bash
firebase logout
firebase login
```

### Erro: "permission-denied" ao executar migrate-reports.js

Verifique se:
- O arquivo de service account está no caminho correto
- A variável `GOOGLE_APPLICATION_CREDENTIALS` está definida
- O service account tem permissões de admin no Firestore

### Erro: "The query requires an index" ainda persiste

- Aguarde alguns minutos (índices levam tempo para serem criados)
- Verifique se os índices foram criados no Console
- Tente limpar o cache do navegador
- Faça um hard refresh (Ctrl+F5)

### Erro: "Missing or insufficient permissions" ainda persiste

Isso significa que a migração não foi executada ou falhou:
1. Execute `node migrate-reports.js` novamente
2. Verifique os logs para ver se há erros
3. Certifique-se de que todos os relatórios foram migrados com sucesso

---

## 📊 O Que Mudou?

### Antes
```javascript
// Relatórios não tinham userId
{
  clinic_id: "abc123",
  report_month: "2024-10-01",
  dre_data: {...}
}

// Regras faziam query aninhada
get(/databases/.../clinics/$(resource.data.clinic_id)).data.userId == request.auth.uid

// Sem índice composto
```

### Depois
```javascript
// Relatórios agora têm userId
{
  clinic_id: "abc123",
  userId: "user123",  // ← NOVO!
  report_month: "2024-10-01",
  dre_data: {...}
}

// Regras verificam diretamente
resource.data.userId == request.auth.uid

// Índice composto criado
{ userId: ASC, report_month: DESC }
```

---

## ⚠️ Avisos Importantes

1. **NÃO faça deploy das regras antes da migração!**
   - Primeiro: Migração de dados
   - Depois: Deploy das regras
   - Se inverter a ordem, os relatórios ficarão inacessíveis temporariamente

2. **Aguarde os índices serem criados**
   - Após o deploy, os índices levam tempo para serem construídos
   - Não se preocupe se vir "Building..." no Console
   - A aplicação funcionará normalmente após a conclusão

3. **Mantenha o arquivo de service account seguro**
   - Nunca faça commit no git
   - Adicione ao `.gitignore`
   - Armazene em local seguro

---

## 📚 Documentação Relacionada

- **MIGRATION_GUIDE.md** - Guia completo de migração
- **FIRESTORE_RULES_FIX.md** - Como resolver conflitos nas regras
- **migrate-reports.js** - Script de migração automatizado

---

## 🆘 Precisa de Ajuda?

Se após seguir todos os passos ainda houver problemas:

1. Verifique os logs do navegador (Console do Desenvolvedor)
2. Verifique os logs do Firebase Console
3. Execute o script de migração novamente
4. Verifique se os índices foram criados
5. Consulte os guias de documentação

---

## ✅ Checklist Final

- [ ] Instalou `firebase-admin`
- [ ] Obteve o service account key
- [ ] Configurou `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] Executou `node migrate-reports.js` com sucesso
- [ ] Fez `firebase login`
- [ ] Executou `firebase deploy --only firestore`
- [ ] Verificou que as regras foram publicadas
- [ ] Aguardou os índices serem criados
- [ ] Testou a aplicação
- [ ] Todos os relatórios aparecem corretamente

---

**Pronto! Depois de seguir esses passos, tudo deve funcionar perfeitamente! 🎉**
