// Menu de opções de exportação de relatório PDF
import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, PieChart, List } from 'lucide-react';

export type ExportMode = 'standard' | 'with-dashboard' | 'complete';

interface ExportOptionsMenuProps {
  onExport: (mode: ExportMode) => void;
  isExporting: boolean;
  exportProgress: number;
}

export default function ExportOptionsMenu({ onExport, isExporting, exportProgress }: ExportOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = (mode: ExportMode) => {
    setIsOpen(false);
    onExport(mode);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Gerando PDF... {exportProgress}%
          </>
        ) : (
          <>
            <Download className="h-5 w-5 mr-2" />
            Exportar PDF
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Menu Dropdown */}
      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Opção 1: Relatório Padrão */}
          <button
            onClick={() => handleExport('standard')}
            className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-200"
          >
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-blue-50 mr-4 flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Relatório Padrão</p>
                <p className="text-sm text-gray-600">
                  Exporta apenas o DRE detalhado com indicadores principais
                </p>
              </div>
            </div>
          </button>

          {/* Opção 2: Relatório com Dashboard */}
          <button
            onClick={() => handleExport('with-dashboard')}
            className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-200"
          >
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-purple-50 mr-4 flex-shrink-0">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Relatório com Dashboard</p>
                <p className="text-sm text-gray-600">
                  Inclui gráficos e visualizações de análise financeira
                </p>
              </div>
            </div>
          </button>

          {/* Opção 3: Relatório Completo */}
          <button
            onClick={() => handleExport('complete')}
            className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-start">
              <div className="p-2 rounded-lg bg-emerald-50 mr-4 flex-shrink-0">
                <List className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Relatório Completo</p>
                <p className="text-sm text-gray-600">
                  DRE + Dashboard + Lista detalhada de todas as despesas
                </p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
