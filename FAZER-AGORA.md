# ⚡ FAÇA ISTO AGORA

## 1. Baixe a chave do Firebase

Abra: https://console.firebase.google.com/project/nort-dre/settings/serviceaccounts/adminsdk

Clique em **"Gerar nova chave privada"**

Salve o arquivo como `serviceAccountKey.json` na pasta do projeto.

---

## 2. Instale dependência

```bash
npm install firebase-admin
```

---

## 3. Execute a migração

```bash
node migrate.js
```

**Se der erro "Cannot find module":**
- Abra o arquivo `migrate.js`
- Na linha 11, mude de `./serviceAccountKey.json` para o caminho completo:
  ```javascript
  const serviceAccount = require('C:/Users/felli/Downloads/Nort DRE/project/serviceAccountKey.json');
  ```

---

## 4. Deploy

```bash
firebase login
firebase deploy --only firestore
```

---

## 5. Espere 10 minutos

Os índices precisam ser criados. Aguarde.

---

## 6. Teste

Recarregue a aplicação (Ctrl+F5). Pronto!

---

**ACABOU!** 🎉
