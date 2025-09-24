'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  assignedAcquirers: UserAcquirer[];
}

interface UserAcquirer {
  id: string;
  acquirerId: string;
  priority: number;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  isActive: boolean;
  acquirer: {
    id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
  };
}

interface Acquirer {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string | null;
}

export default function UserAcquirersPage() {
  const { backofficeUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  // Form states
  const [selectedAcquirer, setSelectedAcquirer] = useState('');
  const [priority, setPriority] = useState(0);
  const [dailyLimit, setDailyLimit] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [usersRes, acquirersRes] = await Promise.all([
        fetch('/api/backoffice/user-acquirers'),
        fetch('/api/backoffice/acquirers')
      ]);

      const usersData = await usersRes.json();
      const acquirersData = await acquirersRes.json();

      if (usersData.success) {
        setUsers(usersData.users);
      }
      if (acquirersData.success) {
        setAcquirers(acquirersData.acquirers);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAcquirer = async () => {
    if (!selectedUser || !selectedAcquirer) return;

    try {
      setAssignLoading(true);
      
      const response = await fetch('/api/backoffice/user-acquirers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          acquirerId: selectedAcquirer,
          priority: priority,
          dailyLimit: dailyLimit ? parseFloat(dailyLimit) : null,
          monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Adquirente atribuído com sucesso!');
        setShowAssignModal(false);
        resetForm();
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || 'Erro ao atribuir adquirente');
      }
    } catch (error) {
      console.error('Error assigning acquirer:', error);
      toast.error('Erro de conexão');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveAssignment = async (userAcquirerId: string) => {
    if (!confirm('Tem certeza que deseja remover esta atribuição?')) return;

    try {
      const response = await fetch(`/api/backoffice/user-acquirers/${userAcquirerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Atribuição removida com sucesso!');
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || 'Erro ao remover atribuição');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Erro de conexão');
    }
  };

  const resetForm = () => {
    setSelectedAcquirer('');
    setPriority(0);
    setDailyLimit('');
    setMonthlyLimit('');
  };

  const openAssignModal = (user: User) => {
    setSelectedUser(user);
    resetForm();
    setShowAssignModal(true);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800',
      'TESTING': 'bg-yellow-100 text-yellow-800',
      'ERROR': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      'PIX': 'bg-blue-100 text-blue-800',
      'CRYPTO': 'bg-purple-100 text-purple-800',
      'TRADITIONAL': 'bg-gray-100 text-gray-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (backofficeUser) {
      fetchData();
    }
  }, [backofficeUser]);

  if (!backofficeUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Acesso Negado</h2>
          <p className="text-gray-500">Você precisa estar logado no backoffice</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atribuição de Adquirentes</h1>
          <p className="text-gray-500">Gerencie quais adquirentes estão atribuídos a cada usuário</p>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Usuários e suas Adquirentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {user.name || user.email}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {user.email} • {user.role} • {user.status}
                  </p>
                </div>
                <button
                  onClick={() => openAssignModal(user)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Atribuir Adquirente
                </button>
              </div>

              {/* Assigned Acquirers */}
              {user.assignedAcquirers.length > 0 ? (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Adquirentes Atribuídas:</h5>
                  {user.assignedAcquirers.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {assignment.acquirer.name}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(assignment.acquirer.type)}`}>
                              {assignment.acquirer.type}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(assignment.acquirer.status)}`}>
                              {assignment.acquirer.status}
                            </span>
                            {!assignment.isActive && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                INATIVO
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Prioridade: {assignment.priority}
                            {assignment.dailyLimit && ` • Limite diário: R$ ${assignment.dailyLimit.toLocaleString('pt-BR')}`}
                            {assignment.monthlyLimit && ` • Limite mensal: R$ ${assignment.monthlyLimit.toLocaleString('pt-BR')}`}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Nenhuma adquirente atribuída</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Atribuir Adquirente
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Usuário: <strong>{selectedUser.name || selectedUser.email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adquirente
                </label>
                <select
                  value={selectedAcquirer}
                  onChange={(e) => setSelectedAcquirer(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Selecione uma adquirente</option>
                  {acquirers
                    .filter(acq => acq.status === 'ACTIVE')
                    .filter(acq => !selectedUser.assignedAcquirers.some(ua => ua.acquirerId === acq.id))
                    .map((acquirer) => (
                      <option key={acquirer.id} value={acquirer.id}>
                        {acquirer.name} ({acquirer.type})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade (0 = mais baixa, 10 = mais alta)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite Diário (R$) - Opcional
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  placeholder="Ex: 1000.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite Mensal (R$) - Opcional
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="Ex: 30000.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={assignLoading}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignAcquirer}
                disabled={assignLoading || !selectedAcquirer}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {assignLoading ? 'Atribuindo...' : 'Atribuir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}