export default function SellersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Sellers
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerenciamento completo de sellers e suas operações
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lista de Sellers
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visualização e gerenciamento de todos os sellers cadastrados
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
              <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              Página de Sellers
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aguardando dados live dos sellers cadastrados no sistema
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