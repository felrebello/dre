/**
 * Script para migrar relatórios existentes adicionando o campo userId
 * VERSÃO WINDOWS - Mais fácil de usar no Windows!
 *
 * IMPORTANTE: Execute este script ANTES de fazer deploy das novas regras do Firestore!
 *
 * Como usar no Windows:
 * 1. Edite a linha 16 abaixo com o caminho do seu serviceAccountKey.json
 * 2. Execute: node migrate-reports-windows.js
 */

const admin = require('firebase-admin');

// ============================================================================
// EDITE AQUI: Coloque o caminho do seu arquivo serviceAccountKey.json
// Exemplo: C:\\Users\\felli\\Downloads\\Nort DRE\\project\\serviceAccountKey.json
// IMPORTANTE: Use \\\\ (barra dupla invertida) ou / (barra normal)
// ============================================================================
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
// ============================================================================

try {
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin inicializado com sucesso!\n');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
  console.log('\n📝 Instruções:');
  console.log('1. Certifique-se de que o arquivo serviceAccountKey.json está no mesmo diretório que este script');
  console.log('   OU edite a linha 16 deste arquivo com o caminho correto');
  console.log('\n2. Use um destes formatos de caminho:');
  console.log('   - Caminho relativo: ./serviceAccountKey.json');
  console.log('   - Caminho absoluto com barra normal: C:/Users/felli/Downloads/Nort DRE/project/serviceAccountKey.json');
  console.log('   - Caminho absoluto com barra dupla: C:\\\\Users\\\\felli\\\\Downloads\\\\Nort DRE\\\\project\\\\serviceAccountKey.json');
  console.log('\n3. Execute novamente: node migrate-reports-windows.js');
  process.exit(1);
}

const db = admin.firestore();

async function migrateReports() {
  console.log('🚀 Iniciando migração de relatórios...\n');

  try {
    // Buscar todos os relatórios
    const reportsSnapshot = await db.collection('financial_reports').get();

    console.log(`📊 Encontrados ${reportsSnapshot.size} relatórios para verificar.\n`);

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
    console.log('📋 RESUMO DA MIGRAÇÃO');
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
      console.log('\n🎉 Migração concluída com sucesso!');
      console.log('\n📝 Próximos passos:');
      console.log('1. Execute: firebase login');
      console.log('2. Execute: firebase deploy --only firestore');
      console.log('3. Aguarde os índices serem criados (5-10 minutos)');
      console.log('4. Teste a aplicação!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar migração
migrateReports();
