import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type ExportMode = 'standard' | 'with-dashboard' | 'complete';

interface PDFExportOptions {
  filename: string;
  elementId: string;
  mode?: ExportMode;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const { filename, elementId, mode = 'standard', onProgress, onError, onSuccess } = options;

  // Armazenar estados originais para restauração
  const originalStates = new Map<HTMLElement, string>();

  try {
    onProgress?.(10);

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento não encontrado para exportação');
    }

    onProgress?.(20);

    // Preparar conteúdo baseado no modo de exportação
    prepareContentForExport(element, mode);

    // Esconder elementos no-print, mas salvar estado original
    const elementsToHide = element.querySelectorAll('.no-print');
    elementsToHide.forEach((el) => {
      const htmlEl = el as HTMLElement;
      originalStates.set(htmlEl, htmlEl.style.display);
      htmlEl.style.display = 'none';
    });

    onProgress?.(30);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Remover gradiente de fundo no clone para melhor renderização
          clonedElement.style.background = '#ffffff';
          clonedElement.style.padding = '20px';

          // Garantir que os gráficos sejam renderizados corretamente
          const charts = clonedElement.querySelectorAll('.recharts-wrapper');
          charts.forEach(chart => {
            (chart as HTMLElement).style.width = '100%';
          });
        }
      },
    });

    onProgress?.(70);

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    onProgress?.(90);

    pdf.save(filename);

    // Restaurar estados originais dos elementos escondidos
    originalStates.forEach((originalDisplay, el) => {
      el.style.display = originalDisplay;
    });

    // Restaurar visibilidade do conteúdo
    restoreContentAfterExport(element);

    onProgress?.(100);
    onSuccess?.();
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);

    // Garantir que o conteúdo seja restaurado mesmo em caso de erro
    const element = document.getElementById(elementId);
    if (element) {
      // Restaurar estados originais
      originalStates.forEach((originalDisplay, el) => {
        el.style.display = originalDisplay;
      });
      restoreContentAfterExport(element);
    }

    onError?.(error as Error);
    throw error;
  }
}

// Preparar conteúdo para exportação baseado no modo
function prepareContentForExport(element: HTMLElement, mode: ExportMode): void {
  // Controlar visibilidade do dashboard
  const dashboardElements = element.querySelectorAll('[data-section="dashboard"]');
  dashboardElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (mode === 'with-dashboard' || mode === 'complete') {
      htmlEl.style.display = 'block';
      htmlEl.style.visibility = 'visible';
    } else {
      htmlEl.style.display = 'none';
    }
  });

  // Controlar visibilidade da tabela detalhada de despesas
  const detailedTableElements = element.querySelectorAll('[data-section="detailed-expenses"]');
  detailedTableElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (mode === 'complete') {
      htmlEl.style.display = 'block';
      htmlEl.style.visibility = 'visible';
    } else {
      htmlEl.style.display = 'none';
    }
  });
}

// Restaurar conteúdo após exportação (volta ao estado controlado pela UI)
function restoreContentAfterExport(element: HTMLElement): void {
  // Dashboard e tabela detalhada voltam a ser controlados pela UI
  // (o DREReport.tsx controla com showDashboard e showDetailedExpenses)
  const dashboardElements = element.querySelectorAll('[data-section="dashboard"]');
  dashboardElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // Não força display='none', deixa o React controlar
    htmlEl.style.visibility = '';
  });

  const detailedTableElements = element.querySelectorAll('[data-section="detailed-expenses"]');
  detailedTableElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // Não força display='none', deixa o React controlar
    htmlEl.style.visibility = '';
  });
}

export function generatePDFFilename(clinicName: string, reportMonth: string): string {
  const cleanClinicName = clinicName.replace(/[^a-zA-Z0-9]/g, '_');
  const [year, month] = reportMonth.split('-');
  return `DRE_${cleanClinicName}_${month}_${year}.pdf`;
}
