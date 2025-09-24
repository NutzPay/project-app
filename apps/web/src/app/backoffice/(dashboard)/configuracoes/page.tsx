export default function ConfiguracoesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-600">
          Parâmetros e configurações do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Configurações PIX</h3>
            <p className="text-sm text-gray-600 mt-1">Parâmetros para transações PIX</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Taxa PIX (%)</label>
              <input 
                type="number" 
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                defaultValue="2.5"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor Mínimo (R$)</label>
              <input 
                type="number" 
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                defaultValue="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor Máximo (R$)</label>
              <input 
                type="number" 
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                defaultValue="50000"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Configurações USDT</h3>
            <p className="text-sm text-gray-600 mt-1">Parâmetros para investimentos USDT</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Taxa USDT (%)</label>
              <input 
                type="number" 
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                defaultValue="0.8"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor Mínimo (USDT)</label>
              <input 
                type="number" 
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                defaultValue="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rentabilidade Diária (%)</label>
              <input 
                type="number" 
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                defaultValue="1.2"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Configurações do Sistema</h3>
            <p className="text-sm text-gray-600 mt-1">Parâmetros gerais da plataforma</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                defaultChecked
              />
              <label className="ml-2 block text-sm text-gray-900">
                Ativar notificações por email
              </label>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                defaultChecked
              />
              <label className="ml-2 block text-sm text-gray-900">
                Logs de auditoria detalhados
              </label>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Modo de manutenção
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Backup e Segurança</h3>
            <p className="text-sm text-gray-600 mt-1">Configurações de backup e segurança</p>
          </div>
          <div className="p-6 space-y-4">
            <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
              Fazer Backup Agora
            </button>
            <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
              Verificar Integridade
            </button>
            <button className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
              Exportar Logs
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-4">
        <button className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
          Salvar Configurações
        </button>
        </div>
      </div>
    </div>
  );
}