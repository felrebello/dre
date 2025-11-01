# Guia de Migração - Campo userId em Relatórios

## Visão Geral

Este guia descreve como migrar os relatórios financeiros existentes para adicionar o campo `userId`, que é necessário para as novas regras de segurança do Firestore.

## Por que essa mudança?

Anteriormente, os relatórios não tinham um campo `userId` direto, e as regras do Firestore precisavam fazer uma chamada adicional para verificar se o usuário era dono da clínica associada ao relatório. Isso causava problemas ao buscar múltiplos relatórios.

Com o campo `userId` adicionado diretamente aos relatórios, as regras de segurança ficam mais eficientes e as queries funcionam corretamente.

## Passos para Migração

### 1. **NÃO faça deploy das novas regras ainda!**

É importante migrar os dados ANTES de fazer deploy das novas regras, caso contrário os relatórios existentes ficarão inacessíveis.

### 2. Instalar dependências necessárias

```bash
npm install -g firebase-tools
npm install firebase-admin
```

### 3. Configurar credenciais do Firebase

Você precisa configurar as credenciais do Firebase Admin SDK:

**Opção A: Usar Application Default Credentials (recomendado)**
```bash
firebase login
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
```

Para obter o service account key:
1. Vá para o Firebase Console
2. Configurações do projeto > Contas de serviço
3. Clique em "Gerar nova chave privada"
4. Salve o arquivo JSON em um local seguro
5. Configure a variável de ambiente acima

**Opção B: Modificar o script**
Edite o arquivo `migrate-reports.js` e substitua:
```javascript
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
```

Por:
```javascript
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
```

### 4. Executar o script de migração

```bash
node migrate-reports.js
```

O script irá:
- Buscar todos os relatórios financeiros
- Para cada relatório sem `userId`:
  - Buscar a clínica associada
  - Adicionar o `userId` da clínica ao relatório
- Exibir um resumo da migração

### 5. Verificar os resultados

Após executar o script, verifique se não houve erros. O script mostrará um resumo como:

```
============================================================
RESUMO DA MIGRAÇÃO
============================================================
Total de relatórios: 15
✅ Migrados: 12
⏭️  Pulados (já tinham userId): 3
❌ Erros: 0
============================================================
```

### 6. Fazer deploy das novas regras do Firestore

Após a migração bem-sucedida, faça deploy das novas regras:

```bash
firebase deploy --only firestore:rules
```

### 7. Testar a aplicação

Acesse a aplicação e verifique se os relatórios salvos estão sendo exibidos corretamente.

## O que mudou?

### Código

1. **Função `createReport` (firebase.ts:612)**
   - Agora busca o `userId` da clínica e adiciona ao relatório

2. **Função `duplicateReport` (firebase.ts:542)**
   - Também adiciona o `userId` ao duplicar relatórios

3. **Função `fetchAllReports` (firebase.ts:386)**
   - Agora aceita `userId` como parâmetro
   - Filtra relatórios por `userId` quando não especificar `clinicId`

4. **Função `searchReports` (firebase.ts:473)**
   - Também aceita `userId` como parâmetro

5. **Componente SavedReportsList (SavedReportsList.tsx:74)**
   - Passa o `userId` ao buscar relatórios

6. **Componente ReportsComparison (ReportsComparison.tsx:54)**
   - Passa o `userId` ao buscar relatórios

### Regras do Firestore

Antes:
```javascript
function isClinicOwner() {
  return isAuthenticated() &&
         get(/databases/$(database)/documents/clinics/$(resource.data.clinic_id)).data.userId == request.auth.uid;
}

allow read: if isClinicOwner();
```

Depois:
```javascript
function isReportOwner() {
  return isAuthenticated() && resource.data.userId == request.auth.uid;
}

allow read: if isReportOwner();
```

As novas regras são mais simples e eficientes, pois não precisam fazer uma chamada adicional ao banco de dados.

## Troubleshooting

### Erro: "Failed to authenticate"
Execute `firebase login` novamente e siga os passos de autenticação.

### Erro: "Clínica não encontrada"
Isso significa que há relatórios órfãos (sem clínica associada). Você pode:
1. Deletar esses relatórios manualmente
2. Modificar o script para lidar com esse caso

### Erro de permissão ao executar o script
Certifique-se de que o service account tem permissões de leitura e escrita no Firestore.

### Relatórios não aparecem após deploy
1. Verifique se a migração foi concluída com sucesso (sem erros)
2. Verifique se o deploy das regras foi bem-sucedido
3. Verifique o console do navegador para ver se há erros de permissão

## Rollback

Se algo der errado, você pode fazer rollback das regras do Firestore:

```bash
# Restaurar regras antigas
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

Note que isso não reverterá os dados (campo userId adicionado aos relatórios), mas os relatórios continuarão funcionando com as regras antigas.

## Suporte

Se encontrar problemas durante a migração, verifique:
1. Logs do script de migração
2. Console do Firebase (Firestore)
3. Console do navegador (erros de JavaScript)
