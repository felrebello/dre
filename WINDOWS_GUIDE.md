# 🪟 Guia para Windows - Migração e Deploy

Este guia é específico para usuários do **Windows**.

---

## 📋 Passo a Passo Completo

### **Passo 1: Instalar Dependências**

Abra o **PowerShell** ou **CMD** na pasta do projeto e execute:

```bash
npm install firebase-admin
```

---

### **Passo 2: Obter Credenciais do Firebase**

1. Acesse: https://console.firebase.google.com/project/nort-dre/settings/serviceaccounts/adminsdk

2. Clique em **"Gerar nova chave privada"**

3. Um arquivo JSON será baixado. **Renomeie** para `serviceAccountKey.json`

4. **Mova** o arquivo para a pasta do projeto:
   ```
   C:\Users\felli\Downloads\Nort DRE\project\serviceAccountKey.json
   ```

5. ⚠️ **IMPORTANTE:** Nunca faça commit desse arquivo no Git!

---

### **Passo 3: Executar Migração de Dados**

#### Opção A: Script Simplificado (RECOMENDADO para Windows)

Use o script especial para Windows:

```bash
node migrate-reports-windows.js
```

**Se der erro "Cannot find module":**

1. Abra o arquivo `migrate-reports-windows.js` em um editor de texto
2. Encontre a linha 16:
   ```javascript
   const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
   ```
3. Edite com o caminho completo (use uma destas opções):

   **Opção 1 - Barra normal (mais fácil):**
   ```javascript
   const SERVICE_ACCOUNT_PATH = 'C:/Users/felli/Downloads/Nort DRE/project/serviceAccountKey.json';
   ```

   **Opção 2 - Barra dupla invertida:**
   ```javascript
   const SERVICE_ACCOUNT_PATH = 'C:\\Users\\felli\\Downloads\\Nort DRE\\project\\serviceAccountKey.json';
   ```

4. Salve o arquivo e execute novamente

#### Opção B: Script Original com Variável de Ambiente

Se preferir usar o script original:

**No PowerShell:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\felli\Downloads\Nort DRE\project\serviceAccountKey.json"
node migrate-reports.js
```

**No CMD:**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\Users\felli\Downloads\Nort DRE\project\serviceAccountKey.json
node migrate-reports.js
```

---

### **Passo 4: Verificar Resultado da Migração**

Você deve ver algo assim:

```
🚀 Iniciando migração de relatórios...

📊 Encontrados 15 relatórios para verificar.

✅ Relatório abc123 migrado com sucesso (userId: user123)
✅ Relatório def456 migrado com sucesso (userId: user123)
...

============================================================
📋 RESUMO DA MIGRAÇÃO
============================================================
Total de relatórios: 15
✅ Migrados: 15
⏭️  Pulados (já tinham userId): 0
❌ Erros: 0
============================================================

🎉 Migração concluída com sucesso!
```

**Se houver erros:**
- Verifique se o caminho do arquivo está correto
- Verifique se o arquivo JSON é válido
- Certifique-se de ter permissões no Firestore

---

### **Passo 5: Fazer Deploy no Firebase**

#### 5.1 Fazer Login

```bash
firebase login
```

Isso abrirá o navegador para autenticação. Siga as instruções.

#### 5.2 Verificar Projeto

```bash
firebase use
```

Deve mostrar: `Active Project: nort-dre`

Se não estiver correto:
```bash
firebase use nort-dre
```

#### 5.3 Deploy das Regras e Índices

```bash
firebase deploy --only firestore
```

**Aguarde a conclusão!** Pode levar alguns minutos.

---

### **Passo 6: Aguardar Criação dos Índices**

1. Acesse: https://console.firebase.google.com/project/nort-dre/firestore/indexes

2. Você verá um índice sendo criado:
   ```
   Collection: financial_reports
   Fields: userId (Asc), report_month (Desc)
   Status: Building... → Enabled
   ```

3. **Aguarde** até o status mudar para **"Enabled"** (5-10 minutos)

---

### **Passo 7: Testar a Aplicação**

1. Recarregue a página da aplicação (Ctrl+F5)
2. Vá para "Meus Relatórios"
3. ✅ Os relatórios devem aparecer!

**Teste também:**
- [ ] Abrir um relatório individual
- [ ] Criar novo relatório
- [ ] Duplicar relatório
- [ ] Deletar relatório
- [ ] Comparar relatórios

---

## 🔧 Troubleshooting Windows

### Erro: "node" não é reconhecido

**Solução:** Instale o Node.js

1. Baixe de: https://nodejs.org/
2. Instale a versão LTS
3. Reinicie o PowerShell/CMD
4. Teste: `node --version`

### Erro: "firebase" não é reconhecido

**Solução:** Instale Firebase CLI

```bash
npm install -g firebase-tools
```

Reinicie o terminal e tente novamente.

### Erro: Cannot find module './serviceAccountKey.json'

**Solução 1:** Verifique se o arquivo está na pasta certa
```bash
dir serviceAccountKey.json
```

Se não aparecer, mova o arquivo para a pasta do projeto.

**Solução 2:** Use o caminho completo no script

Edite `migrate-reports-windows.js` linha 16:
```javascript
const SERVICE_ACCOUNT_PATH = 'C:/Users/felli/Downloads/Nort DRE/project/serviceAccountKey.json';
```

### Erro: Caminho com espaços não funciona

**No PowerShell, use aspas:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\felli\Downloads\Nort DRE\project\serviceAccountKey.json"
```

**No CMD, use aspas:**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS="C:\Users\felli\Downloads\Nort DRE\project\serviceAccountKey.json"
```

### Erro: Permission denied

Execute o PowerShell/CMD como **Administrador**:
1. Clique com botão direito no PowerShell/CMD
2. Selecione "Executar como administrador"
3. Execute os comandos novamente

---

## 📁 Estrutura de Arquivos

Sua pasta do projeto deve ficar assim:

```
C:\Users\felli\Downloads\Nort DRE\project\
├── node_modules/
├── src/
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── migrate-reports.js
├── migrate-reports-windows.js          ← Use este no Windows!
├── serviceAccountKey.json              ← Arquivo que você baixou
├── package.json
└── ...
```

---

## ✅ Checklist

- [ ] Instalei `firebase-admin`
- [ ] Baixei o `serviceAccountKey.json`
- [ ] Coloquei o arquivo na pasta do projeto
- [ ] Executei `node migrate-reports-windows.js`
- [ ] A migração foi concluída com sucesso
- [ ] Fiz `firebase login`
- [ ] Executei `firebase deploy --only firestore`
- [ ] Aguardei os índices serem criados
- [ ] Testei a aplicação
- [ ] Os relatórios aparecem corretamente

---

## 🆘 Ainda com Problemas?

1. **Verifique se o Node.js está instalado:**
   ```bash
   node --version
   npm --version
   ```

2. **Verifique se está na pasta certa:**
   ```bash
   cd "C:\Users\felli\Downloads\Nort DRE\project"
   ```

3. **Verifique se o arquivo existe:**
   ```bash
   dir serviceAccountKey.json
   ```

4. **Use o script Windows:**
   ```bash
   node migrate-reports-windows.js
   ```

5. **Verifique os logs do console** para erros específicos

---

## 📞 Comandos Úteis no Windows

```bash
# Ver pasta atual
cd

# Listar arquivos
dir

# Mudar de pasta (use aspas se tiver espaços)
cd "C:\Users\felli\Downloads\Nort DRE\project"

# Ver versão do Node
node --version

# Ver versão do npm
npm --version

# Limpar tela
cls
```

---

**Pronto! Siga os passos acima e tudo deve funcionar! 🎉**
