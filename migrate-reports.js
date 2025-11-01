/**
 * Script para migrar relatórios existentes adicionando o campo userId
 *
 * IMPORTANTE: Execute este script ANTES de fazer deploy das novas regras do Firestore!
 *
 * Como usar:
 * 1. Certifique-se de que suas credenciais do Firebase estão configuradas
 * 2. Execute: node migrate-reports.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
// NOTA: Você precisa configurar suas credenciais do Firebase
// Opção 1: Usar variáveis de ambiente
// Opção 2: Usar arquivo de service account (não recomendado para commit)

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin:', error.message);
  console.log('\nPara usar este script, você precisa configurar as credenciais do Firebase.');
  console.log('Execute: export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"');
  process.exit(1);
}

const db = admin.firestore();

async function migrateReports() {
  console.log('Iniciando migração de relatórios...\n');

  try {
    // Buscar todos os relatórios
    const reportsSnapshot = await db.collection('financial_reports').get();

    console.log(`Encontrados ${reportsSnapshot.size} relatórios para verificar.\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Processar cada relatório
    for (const reportDoc of reportsSnapshot.docs) {
      const reportData = reportDoc.data();
      const reportId = reportDoc.id;

      // Verificar se já tem userId
      if (reportData.userId) {
        console.log(`⏭️  Relatório ${reportId} já tem userId, pulando...`);
        skippedCount++;
        continue;
      }

      // Verificar se tem clinic_id
      if (!reportData.clinic_id) {
        console.error(`❌ Relatório ${reportId} não tem clinic_id, não é possível migrar.`);
        errorCount++;
        continue;
      }

      try {
        // Buscar a clínica para obter o userId
        const clinicDoc = await db.collection('clinics').doc(reportData.clinic_id).get();

        if (!clinicDoc.exists) {
          console.error(`❌ Clínica ${reportData.clinic_id} não encontrada para relatório ${reportId}`);
          errorCount++;
          continue;
        }

        const clinicData = clinicDoc.data();

        if (!clinicData.userId) {
          console.error(`❌ Clínica ${reportData.clinic_id} não tem userId`);
          errorCount++;
          continue;
        }

        // Atualizar o relatório com o userId
        await db.collection('financial_reports').doc(reportId).update({
          userId: clinicData.userId,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Relatório ${reportId} migrado com sucesso (userId: ${clinicData.userId})`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Erro ao migrar relatório ${reportId}:`, error.message);
        errorCount++;
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de relatórios: ${reportsSnapshot.size}`);
    console.log(`✅ Migrados: ${migratedCount}`);
    console.log(`⏭️  Pulados (já tinham userId): ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Atenção: Alguns relatórios não foram migrados. Verifique os erros acima.');
      process.exit(1);
    } else {
      console.log('\n✅ Migração concluída com sucesso!');
      console.log('\nAgora você pode fazer deploy das novas regras do Firestore:');
      console.log('  firebase deploy --only firestore:rules');
      process.exit(0);
    }

  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar migração
migrateReports();
