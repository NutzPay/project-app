export default function WebhooksPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Webhooks
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Sistema de notificações
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sistema de Webhooks
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configuração e monitoramento de notificações automáticas
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
              <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.636 4H20a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1.172a4 4 0 01.656-.172z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              Página de Webhooks
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aguardando dados live dos webhooks configurados no sistema
            </p>
            <div className="mt-6">
              <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800">
                Em desenvolvimento
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}