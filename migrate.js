/**
 * MIGRAÇÃO RÁPIDA - Windows
 *
 * PASSO 1: Baixe o arquivo serviceAccountKey.json do Firebase
 * PASSO 2: Edite a linha 11 abaixo com o caminho do arquivo
 * PASSO 3: Execute: node migrate.js
 */

const admin = require('firebase-admin');

// EDITE AQUI - Coloque o caminho completo do seu arquivo (use / ou \\)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrate() {
  console.log('Migrando...\n');

  const reports = await db.collection('financial_reports').get();
  let migrados = 0;

  for (const report of reports.docs) {
    const data = report.data();

    if (data.userId) {
      console.log(`✓ ${report.id} já tem userId`);
      continue;
    }

    const clinic = await db.collection('clinics').doc(data.clinic_id).get();
    const userId = clinic.data().userId;

    await report.ref.update({ userId });
    console.log(`✓ ${report.id} migrado`);
    migrados++;
  }

  console.log(`\n✅ ${migrados} relatórios migrados!`);
  console.log('\nAgora execute:\n  firebase deploy --only firestore\n');
  process.exit(0);
}

migrate().catch(console.error);
