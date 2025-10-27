// Componente de seleção de clínica (página inicial)
import { useState, useEffect } from 'react';
import { Building2, Plus, ArrowRight, FileText } from 'lucide-react';
import { supabase, Clinic } from '../lib/supabase';

interface ClinicSelectorProps {
  onClinicSelected: (clinicId: string, clinicName: string) => void;
  onViewSavedReports: () => void;
}

export default function ClinicSelector({ onClinicSelected, onViewSavedReports }: ClinicSelectorProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [adding, setAdding] = useState(false);

  // Carregar clínicas do banco de dados
  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova clínica
  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName.trim()) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('clinics')
        .insert([{ name: newClinicName.trim() }]);

      if (error) throw error;

      setNewClinicName('');
      setShowAddForm(false);
      await loadClinics();
    } catch (error) {
      console.error('Erro ao adicionar clínica:', error);
      alert('Erro ao adicionar clínica. Tente novamente.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando clínicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/Nort logo 2024 ok.png"
            alt="Nort Radiologia Odontológica"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sistema de Relatório DRE
          </h1>
          <p className="text-lg text-gray-600">
            Selecione a unidade da clínica para gerar o relatório financeiro
          </p>
        </div>

        {/* Botão para ver relatórios salvos */}
        <div className="mb-8">
          <button
            onClick={onViewSavedReports}
            className="w-full max-w-md mx-auto flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FileText className="h-6 w-6 mr-3" />
            <span className="text-lg font-semibold">Ver Meus Relatórios Salvos</span>
          </button>
        </div>

        {/* Lista de clínicas */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {clinics.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma clínica cadastrada
              </h3>
              <p className="text-gray-500 mb-6">
                Adicione sua primeira unidade para começar
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Clínica
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {clinics.map((clinic) => (
                  <button
                    key={clinic.id}
                    onClick={() => onClinicSelected(clinic.id, clinic.name)}
                    className="group flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all border-2 border-transparent hover:border-blue-200"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg mr-4 group-hover:bg-blue-200 transition-colors">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-lg font-medium text-gray-900">
                        {clinic.name}
                      </span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Nova Clínica
              </button>
            </>
          )}

          {/* Formulário de adicionar clínica */}
          {showAddForm && (
            <form onSubmit={handleAddClinic} className="mt-6 p-6 bg-blue-50 rounded-lg">
              <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Clínica
              </label>
              <div className="flex gap-3">
                <input
                  id="clinicName"
                  type="text"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  placeholder="Ex: Unidade Centro"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={adding || !newClinicName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {adding ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewClinicName('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
