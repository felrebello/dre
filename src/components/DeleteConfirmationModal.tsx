// Modal de confirmação para exclusão de relatórios
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  reportName: string;
  reportMonth: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  reportName,
  reportMonth,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  // Função para formatar mês
  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]} de ${year}`;
  };

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== 'excluir') {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      setConfirmText('');
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Esta ação não pode ser desfeita
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Você está prestes a excluir o seguinte relatório:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="font-semibold text-gray-900">{reportName}</p>
              <p className="text-sm text-gray-600">{formatMonth(reportMonth)}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">Atenção:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Todas as receitas deste relatório serão excluídas</li>
                  <li>Todas as despesas deste relatório serão excluídas</li>
                  <li>Os dados do DRE serão perdidos permanentemente</li>
                  <li>Esta ação não pode ser revertida</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex gap-3 p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText.toLowerCase() !== 'excluir' || isDeleting}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Excluindo...
              </>
            ) : (
              'Excluir Relatório'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
