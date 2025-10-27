// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  CollectionReference,
  DocumentData,
  writeBatch
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Configuração do Firebase (variáveis de ambiente)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validar configuração
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing Firebase configuration. Please check your .env file.');
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Provider do Google
const googleProvider = new GoogleAuthProvider();

// Tipos para o banco de dados
export interface Clinic {
  id: string;
  name: string;
  userId: string; // ID do usuário dono da clínica
  created_at: Date;
  updated_at: Date;
}

export interface FinancialReport {
  id: string;
  clinic_id: string;
  report_month: string; // YYYY-MM-DD
  bank_statement_file: string | null;
  revenues_file: string | null;
  expenses_file: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  dre_data: DREData | null;
  created_at: Date;
  updated_at: Date;
}

export interface RevenueEntry {
  id: string;
  report_id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  created_at: Date;
}

export interface ExpenseEntry {
  id: string;
  report_id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  tipo_despesa?: 'fixa' | 'variavel' | null;
  categoria_personalizada?: string | null;
  classificacao_manual?: boolean;
  sugestao_automatica?: string | null;
  is_manual_entry?: boolean;
  e_imposto?: boolean;
  tipo_imposto?: 'receita' | 'lucro' | null;
  categoria_imposto?: string | null;
  created_at: Date;
}

// Importar tipos de impostos
import { ImpostosReceita, ImpostosLucro } from '../types/tax';

export interface DREData {
  receita_bruta: number;
  impostos_sobre_receita: ImpostosReceita;
  receita_liquida: number;
  custo_servicos: number;
  lucro_bruto: number;
  despesas_operacionais: {
    pessoal: number;
    administrativas: number;
    vendas: number;
    financeiras: number;
    outras: number;
    total: number;
  };
  despesas_fixas: number;
  despesas_variaveis: number;
  lucro_operacional: number;
  outras_receitas_despesas: number;
  lucro_antes_impostos: number;
  impostos_sobre_lucro: ImpostosLucro;
  lucro_liquido: number;
  margem_bruta_percent: number;
  margem_operacional_percent: number;
  margem_liquida_percent: number;
}

// ==================== AUTENTICAÇÃO ====================

// Login com Google
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

// Logout
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

// Observar mudanças no estado de autenticação
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ==================== HELPERS ====================

// Função auxiliar para extrair ano-mês de uma data no formato YYYY-MM-DD
export function extractYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7); // Retorna YYYY-MM
}

// Converter Timestamp do Firebase para Date
function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
}

// ==================== CLÍNICAS ====================

// Buscar clínicas do usuário
export async function fetchUserClinics(userId: string): Promise<Clinic[]> {
  try {
    const clinicsRef = collection(db, 'clinics');
    const q = query(clinicsRef, where('userId', '==', userId), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: timestampToDate(doc.data().created_at),
      updated_at: timestampToDate(doc.data().updated_at),
    })) as Clinic[];
  } catch (error) {
    console.error('Erro ao buscar clínicas:', error);
    throw error;
  }
}

// Criar nova clínica
export async function createClinic(name: string, userId: string): Promise<Clinic> {
  try {
    const clinicsRef = collection(db, 'clinics');
    const docRef = await addDoc(clinicsRef, {
      name,
      userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...docSnap.data(),
      created_at: timestampToDate(docSnap.data()?.created_at),
      updated_at: timestampToDate(docSnap.data()?.updated_at),
    } as Clinic;
  } catch (error) {
    console.error('Erro ao criar clínica:', error);
    throw error;
  }
}

// ==================== DESPESAS ====================

// Buscar despesas de um relatório
export async function fetchExpensesForReport(reportId: string, filterByMonth?: string): Promise<ExpenseEntry[]> {
  try {
    const expensesRef = collection(db, 'financial_reports', reportId, 'expense_entries');
    const q = query(expensesRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);

    let expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: timestampToDate(doc.data().created_at),
    })) as ExpenseEntry[];

    // Filtrar por mês se especificado
    if (filterByMonth) {
      expenses = expenses.filter(expense => extractYearMonth(expense.date) === filterByMonth);
    }

    return expenses;
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    throw error;
  }
}

// Adicionar despesa manual
export async function addManualExpense(
  reportId: string,
  expense: Omit<ExpenseEntry, 'id' | 'created_at' | 'report_id' | 'is_manual_entry'>
): Promise<ExpenseEntry> {
  try {
    const expensesRef = collection(db, 'financial_reports', reportId, 'expense_entries');
    const docRef = await addDoc(expensesRef, {
      ...expense,
      report_id: reportId,
      is_manual_entry: true,
      created_at: serverTimestamp(),
    });

    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...docSnap.data(),
      created_at: timestampToDate(docSnap.data()?.created_at),
    } as ExpenseEntry;
  } catch (error) {
    console.error('Erro ao adicionar despesa manual:', error);
    throw error;
  }
}

// Atualizar despesa
export async function updateExpense(
  expenseId: string,
  reportId: string,
  expense: Partial<Omit<ExpenseEntry, 'id' | 'created_at' | 'report_id'>>
): Promise<void> {
  try {
    const expenseRef = doc(db, 'financial_reports', reportId, 'expense_entries', expenseId);
    await updateDoc(expenseRef, expense);
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    throw error;
  }
}

// Deletar despesa
export async function deleteExpense(reportId: string, expenseId: string): Promise<void> {
  try {
    const expenseRef = doc(db, 'financial_reports', reportId, 'expense_entries', expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    throw error;
  }
}

// ==================== RECEITAS ====================

// Buscar receitas de um relatório
export async function fetchRevenuesForReport(reportId: string, filterByMonth?: string): Promise<RevenueEntry[]> {
  try {
    const revenuesRef = collection(db, 'financial_reports', reportId, 'revenue_entries');
    const q = query(revenuesRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);

    let revenues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: timestampToDate(doc.data().created_at),
    })) as RevenueEntry[];

    // Filtrar por mês se especificado
    if (filterByMonth) {
      revenues = revenues.filter(revenue => extractYearMonth(revenue.date) === filterByMonth);
    }

    return revenues;
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    throw error;
  }
}

// ==================== RELATÓRIOS ====================

// Interface para resumo de relatório
export interface ReportSummary {
  id: string;
  clinic_id: string;
  clinic_name: string;
  report_month: string;
  receita_bruta: number;
  lucro_liquido: number;
  margem_liquida_percent: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

// Buscar relatório por ID
export async function fetchReportById(reportId: string): Promise<any> {
  try {
    const reportRef = doc(db, 'financial_reports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      throw new Error('Relatório não encontrado');
    }

    const reportData = reportSnap.data();
    const clinicRef = doc(db, 'clinics', reportData.clinic_id);
    const clinicSnap = await getDoc(clinicRef);

    return {
      id: reportSnap.id,
      ...reportData,
      clinic_name: clinicSnap.exists() ? clinicSnap.data().name : 'Clínica desconhecida',
      created_at: timestampToDate(reportData.created_at),
      updated_at: timestampToDate(reportData.updated_at),
    };
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    throw error;
  }
}

// Buscar todos os relatórios de uma clínica
export async function fetchAllReports(clinicId?: string): Promise<ReportSummary[]> {
  try {
    const reportsRef = collection(db, 'financial_reports');
    let q = query(reportsRef, orderBy('report_month', 'desc'));

    if (clinicId) {
      q = query(reportsRef, where('clinic_id', '==', clinicId), orderBy('report_month', 'desc'));
    }

    const snapshot = await getDocs(q);

    // Buscar informações das clínicas
    const reports = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const reportData = docSnap.data();
        const clinicRef = doc(db, 'clinics', reportData.clinic_id);
        const clinicSnap = await getDoc(clinicRef);

        return {
          id: docSnap.id,
          clinic_id: reportData.clinic_id,
          clinic_name: clinicSnap.exists() ? clinicSnap.data().name : 'Clínica desconhecida',
          report_month: reportData.report_month,
          receita_bruta: reportData.dre_data?.receita_bruta || 0,
          lucro_liquido: reportData.dre_data?.lucro_liquido || 0,
          margem_liquida_percent: reportData.dre_data?.margem_liquida_percent || 0,
          status: reportData.status,
          created_at: timestampToDate(reportData.created_at),
          updated_at: timestampToDate(reportData.updated_at),
        };
      })
    );

    return reports;
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    throw error;
  }
}

// Atualizar DRE no relatório
export async function updateReportDRE(reportId: string, dreData: DREData): Promise<void> {
  try {
    const reportRef = doc(db, 'financial_reports', reportId);
    await updateDoc(reportRef, {
      dre_data: dreData,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erro ao atualizar DRE:', error);
    throw error;
  }
}

// Deletar relatório
export async function deleteReport(reportId: string): Promise<void> {
  try {
    // Deletar subcoleções (receitas e despesas)
    const expensesRef = collection(db, 'financial_reports', reportId, 'expense_entries');
    const revenuesRef = collection(db, 'financial_reports', reportId, 'revenue_entries');

    const [expensesSnap, revenuesSnap] = await Promise.all([
      getDocs(expensesRef),
      getDocs(revenuesRef),
    ]);

    const batch = writeBatch(db);

    expensesSnap.docs.forEach(doc => batch.delete(doc.ref));
    revenuesSnap.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    // Deletar o relatório
    const reportRef = doc(db, 'financial_reports', reportId);
    await deleteDoc(reportRef);
  } catch (error) {
    console.error('Erro ao deletar relatório:', error);
    throw error;
  }
}

// Buscar relatórios com filtros
export async function searchReports(filters: {
  clinicId?: string;
  startMonth?: string;
  endMonth?: string;
  searchTerm?: string;
}): Promise<ReportSummary[]> {
  try {
    const reportsRef = collection(db, 'financial_reports');
    let q = query(reportsRef, orderBy('report_month', 'desc'));

    if (filters.clinicId) {
      q = query(reportsRef, where('clinic_id', '==', filters.clinicId), orderBy('report_month', 'desc'));
    }

    const snapshot = await getDocs(q);

    let reports = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const reportData = docSnap.data();
        const clinicRef = doc(db, 'clinics', reportData.clinic_id);
        const clinicSnap = await getDoc(clinicRef);

        return {
          id: docSnap.id,
          clinic_id: reportData.clinic_id,
          clinic_name: clinicSnap.exists() ? clinicSnap.data().name : 'Clínica desconhecida',
          report_month: reportData.report_month,
          receita_bruta: reportData.dre_data?.receita_bruta || 0,
          lucro_liquido: reportData.dre_data?.lucro_liquido || 0,
          margem_liquida_percent: reportData.dre_data?.margem_liquida_percent || 0,
          status: reportData.status,
          created_at: timestampToDate(reportData.created_at),
          updated_at: timestampToDate(reportData.updated_at),
        };
      })
    );

    // Filtrar por período
    if (filters.startMonth) {
      reports = reports.filter(r => r.report_month >= `${filters.startMonth}-01`);
    }
    if (filters.endMonth) {
      reports = reports.filter(r => r.report_month <= `${filters.endMonth}-01`);
    }

    // Filtrar por termo de busca
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      reports = reports.filter(r => r.clinic_name.toLowerCase().includes(term));
    }

    return reports;
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    throw error;
  }
}

// Buscar múltiplos relatórios para comparação
export async function fetchReportsForComparison(reportIds: string[]): Promise<any[]> {
  try {
    const reports = await Promise.all(
      reportIds.map(id => fetchReportById(id))
    );

    return reports.sort((a, b) => a.report_month.localeCompare(b.report_month));
  } catch (error) {
    console.error('Erro ao buscar relatórios para comparação:', error);
    throw error;
  }
}

// Duplicar relatório
export async function duplicateReport(reportId: string, newMonth: string): Promise<any> {
  try {
    const originalReport = await fetchReportById(reportId);
    const [revenues, expenses] = await Promise.all([
      fetchRevenuesForReport(reportId),
      fetchExpensesForReport(reportId),
    ]);

    // Criar novo relatório
    const reportsRef = collection(db, 'financial_reports');
    const newReportRef = await addDoc(reportsRef, {
      clinic_id: originalReport.clinic_id,
      report_month: `${newMonth}-01`,
      bank_statement_file: originalReport.bank_statement_file,
      revenues_file: originalReport.revenues_file,
      expenses_file: originalReport.expenses_file,
      status: 'completed',
      dre_data: originalReport.dre_data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Copiar receitas
    if (revenues.length > 0) {
      const revenuesRef = collection(db, 'financial_reports', newReportRef.id, 'revenue_entries');
      await Promise.all(
        revenues.map(r =>
          addDoc(revenuesRef, {
            date: r.date.replace(extractYearMonth(r.date), newMonth),
            description: r.description,
            category: r.category,
            amount: r.amount,
            created_at: serverTimestamp(),
          })
        )
      );
    }

    // Copiar despesas
    if (expenses.length > 0) {
      const expensesRef = collection(db, 'financial_reports', newReportRef.id, 'expense_entries');
      await Promise.all(
        expenses.map(e =>
          addDoc(expensesRef, {
            date: e.date.replace(extractYearMonth(e.date), newMonth),
            description: e.description,
            category: e.category,
            amount: e.amount,
            tipo_despesa: e.tipo_despesa,
            categoria_personalizada: e.categoria_personalizada,
            classificacao_manual: e.classificacao_manual,
            sugestao_automatica: e.sugestao_automatica,
            is_manual_entry: e.is_manual_entry,
            e_imposto: e.e_imposto,
            tipo_imposto: e.tipo_imposto,
            categoria_imposto: e.categoria_imposto,
            created_at: serverTimestamp(),
          })
        )
      );
    }

    return fetchReportById(newReportRef.id);
  } catch (error) {
    console.error('Erro ao duplicar relatório:', error);
    throw error;
  }
}

// Criar novo relatório com receitas e despesas
export async function createReport(
  clinicId: string,
  reportMonth: string,
  dreData: DREData,
  revenues: any[],
  expenses: any[],
  files: {
    bankStatementFile?: string;
    revenuesFile: string;
    expensesFile: string;
  }
): Promise<string> {
  try {
    // Criar relatório
    const reportsRef = collection(db, 'financial_reports');
    const reportDoc = await addDoc(reportsRef, {
      clinic_id: clinicId,
      report_month: `${reportMonth}-01`,
      bank_statement_file: files.bankStatementFile || null,
      revenues_file: files.revenuesFile,
      expenses_file: files.expensesFile,
      status: 'completed',
      dre_data: dreData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    const reportId = reportDoc.id;

    // Salvar receitas
    if (revenues.length > 0) {
      const revenuesRef = collection(db, 'financial_reports', reportId, 'revenue_entries');
      await Promise.all(
        revenues.map(r =>
          addDoc(revenuesRef, {
            date: r.date,
            description: r.description,
            category: r.category,
            amount: r.amount,
            created_at: serverTimestamp(),
          })
        )
      );
    }

    // Salvar despesas
    if (expenses.length > 0) {
      const expensesRef = collection(db, 'financial_reports', reportId, 'expense_entries');
      await Promise.all(
        expenses.map(e =>
          addDoc(expensesRef, {
            date: e.date,
            description: e.description,
            category: e.categoria_personalizada || e.category,
            amount: e.amount,
            tipo_despesa: e.tipo_despesa,
            categoria_personalizada: e.categoria_personalizada || null,
            classificacao_manual: e.classificacao_manual,
            sugestao_automatica: e.sugestao_automatica,
            is_manual_entry: false,
            e_imposto: e.e_imposto || false,
            tipo_imposto: e.tipo_imposto || null,
            categoria_imposto: e.categoria_imposto || null,
            created_at: serverTimestamp(),
          })
        )
      );
    }

    return reportId;
  } catch (error) {
    console.error('Erro ao criar relatório:', error);
    throw error;
  }
}

// ==================== STORAGE ====================

// Upload de arquivo
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}

// Deletar arquivo
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    throw error;
  }
}
