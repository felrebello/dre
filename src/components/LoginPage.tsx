// Página de login com Google
import { useState } from 'react';
import { LogIn, TrendingUp, BarChart3, PieChart, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signIn();
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <TrendingUp className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            DRE Financial
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de Relatórios Gerenciais
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo!
          </h2>
          <p className="text-gray-600 mb-6">
            Faça login para acessar seus relatórios financeiros
          </p>

          {/* Recursos */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">DRE Automatizado</h3>
                <p className="text-sm text-gray-600">
                  Gere relatórios DRE completos automaticamente
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <PieChart className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Análise Visual</h3>
                <p className="text-sm text-gray-600">
                  Gráficos e dashboards interativos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Comparações</h3>
                <p className="text-sm text-gray-600">
                  Compare períodos e acompanhe tendências
                </p>
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Botão de Login */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Entrando...</span>
              </div>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Entrar com Google</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade
          </p>
        </div>

        {/* Rodapé */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Sistema desenvolvido para gestão financeira de clínicas e empresas
        </p>
      </div>
    </div>
  );
}
