import { useState, useEffect } from 'react';
import { api } from '../config/axios';
import { Users as UsersIcon, Search, Shield, Briefcase, Building2, CheckCircle, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type TabType = 'lawyers' | 'workers' | 'pymes';

export default function Users() {
    const [activeTab, setActiveTab] = useState<TabType>('lawyers');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterActiveCases, setFilterActiveCases] = useState(false);

    // Gift Modal State
    const [giftModal, setGiftModal] = useState({ isOpen: false, userId: '', lawyerId: '', name: '', currentQuota: 0 });
    const [giftMonths, setGiftMonths] = useState<string>('');
    const [giftQuota, setGiftQuota] = useState<string>('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (activeTab === 'lawyers') endpoint = '/admin/lawyers';
            else if (activeTab === 'workers') endpoint = '/admin/workers';
            else if (activeTab === 'pymes') endpoint = '/admin/pymes';

            const response = await api.get(endpoint);
            setUsers(response.data);
        } catch (error: any) {
            console.error(`Error fetching ${activeTab}:`, error);
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                 localStorage.removeItem('admin_token');
                 localStorage.removeItem('admin_user');
                 window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
            
        if (filterActiveCases && (!u.activeCasesCount || u.activeCasesCount === 0)) {
            return false;
        }
        
        return matchesSearch;
    });

    const toggleLawyerVerification = async (lawyerId: string, currentStatus: boolean) => {
        try {
            await api.put(`/admin/lawyers/${lawyerId}/verify`, { isVerified: !currentStatus });
            // Update local state
            setUsers(users.map(u => u.id === lawyerId ? { ...u, isVerified: !currentStatus } : u));
        } catch (error) {
            console.error('Error verifying lawyer:', error);
            alert('Error al cambiar el estado de verificación. Revisa permisos.');
        }
    };

    const handleGrantFreeLeads = (userId: string, name: string, currentQuota: number, lawyerId?: string) => {
        setGiftModal({ isOpen: true, userId, lawyerId: lawyerId || '', name, currentQuota });
        setGiftMonths(''); // Start empty to force user to type if they want, 0 is valid to disable.
        setGiftQuota(currentQuota.toString());
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${name} y todos sus datos asociados?\nEsta acción NO se puede deshacer.`)) {
            try {
                setLoading(true);
                await api.delete(`/admin/users/${userId}`);
                alert(`✅ Usuario ${name} eliminado correctamente.`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Ocurrió un error al eliminar el usuario. Es posible que tenga datos muy arraigados vinculados y deba eliminarse de la Base de Datos directamente.');
                setLoading(false);
            }
        }
    };

    const submitGiftConfig = async () => {
        const quota = parseInt(giftQuota, 10);
        let months = parseInt(giftMonths, 10);

        if (isNaN(quota) || quota < 0) {
            alert('Por favor ingresa un número de casos gratuito válido (>= 0).');
            return;
        }

        try {
            setLoading(true);
            
            // 1. Update Free Leads Quota (ONLY for Lawyers)
            if (activeTab === 'lawyers' && giftModal.lawyerId) {
                await api.post(`/admin/lawyers/${giftModal.lawyerId}/free-leads-quota`, { freeLeadsMonthly: quota });
            }
            
            // 2. Update Subscription Months (Only if provided and valid)
            if (!isNaN(months) && months > 0) {
                // Map activeTab to backend role
                const targetRole = activeTab === 'lawyers' ? 'lawyer' : activeTab === 'workers' ? 'worker' : 'pyme';
                
                await api.put(`/admin/users/${giftModal.userId}/subscription`, {
                    plan: targetRole === 'lawyer' ? 'pro' : 'premium',
                    role: targetRole,
                    durationMonths: months,
                });
            }

            alert(`✅ Configuración de regalo actualizada para ${giftModal.name}.`);
            
            setGiftModal({ ...giftModal, isOpen: false });
            fetchUsers();
        } catch (error) {
            console.error('Error updating gift config:', error);
            alert('Ocurrió un error al actualizar los beneficios. Revisa los permisos.');
        } finally {
            setLoading(false);
        }
    };

    const renderTableHeaders = () => {
        if (activeTab === 'lawyers') {
            return (
                <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Abogado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Licencia / Cédula</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">🎁 Cupo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Casos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </>
            );
        } else if (activeTab === 'workers') {
            return (
                <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trabajador</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Suscripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Casos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tickets Enviados</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registro</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </>
            );
        } else {
            return (
                <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Razón Social</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Industria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Casos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Registro</th>
                </>
            );
        }
    };

    const renderTableRow = (user: any) => {
        if (activeTab === 'lawyers') {
            return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-bold text-sm w-full text-center">{user.fullName?.charAt(0) || 'A'}</span>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">{user.fullName || 'Abogado S/N'}</div>
                                <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{user.licenseNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                            {user.subscriptionStatus === 'active' ? 'Suscrito' : 'Inactivo'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {user.freeLeadsMonthly > 0 ? (
                            <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                🎁 {(user.freeLeadsMonthly - (user.freeLeadsUsed || 0))}/{user.freeLeadsMonthly}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400">—</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.planExpiresAt ? format(new Date(user.planExpiresAt), "d 'de' MMM, yyyy", { locale: es }) : 'No Asignado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {user.activeCasesCount > 0 ? (
                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {user.activeCasesCount} Activo
                            </span>
                        ) : (
                            <span className="text-sm text-slate-400 font-medium">0</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.createdAt ? format(new Date(user.createdAt), "d 'de' MMM, yyyy", { locale: es }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {user.isVerified ? (
                            <span className="flex items-center text-sm text-green-600 font-medium">
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Verificado
                            </span>
                        ) : (
                            <span className="flex items-center text-sm text-amber-600 font-medium">
                                <Shield className="w-4 h-4 mr-1.5" /> Pendiente
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            onClick={() => handleGrantFreeLeads(user.userId, user.fullName || 'Abogado', user.freeLeadsMonthly || 0, user.id)}
                            className="mr-2 px-3 py-1 rounded-md transition-colors text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                            🎁 Cupo
                        </button>
                        <button
                            onClick={() => toggleLawyerVerification(user.id, user.isVerified)}
                            className={`px-3 py-1 rounded-md transition-colors ${user.isVerified ? 'text-red-700 bg-red-50 hover:bg-red-100' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'}`}
                        >
                            {user.isVerified ? 'Revocar' : 'Aprobar'}
                        </button>
                        <button
                            onClick={() => handleDeleteUser(user.id, user.fullName || 'Abogado')}
                            className="px-3 py-1 rounded-md transition-colors text-slate-700 bg-slate-100 hover:bg-red-100 hover:text-red-700 ml-2"
                            title="Eliminar permanentemente a este usuario"
                        >
                            🗑️
                        </button>
                    </td>
                </tr>
            );
        } else if (activeTab === 'workers') {
            return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-emerald-700 font-bold text-sm w-full text-center">{user.fullName?.charAt(0) || 'T'}</span>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">{user.fullName || 'Usuario Trabajador'}</div>
                                <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                            {user.subscriptionStatus === 'active' ? 'Premium' : 'Gratuito'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.planExpiresAt ? format(new Date(user.planExpiresAt), "d 'de' MMM, yyyy", { locale: es }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {user.activeCasesCount > 0 ? (
                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {user.activeCasesCount} Activo
                            </span>
                        ) : (
                            <span className="text-sm text-slate-400 font-medium">0</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.contactRequests || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.createdAt ? format(new Date(user.createdAt), "d 'de' MMM, yyyy", { locale: es }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            onClick={() => handleGrantFreeLeads(user.id, user.fullName || 'Trabajador', user.freeLeadsMonthly || 0)}
                            className="mr-2 px-3 py-1 rounded-md transition-colors text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                            🎁 Regalar PRO
                        </button>
                        <button
                            onClick={() => handleDeleteUser(user.id, user.fullName || 'Trabajador')}
                            className="px-3 py-1 rounded-md transition-colors text-slate-700 bg-slate-100 hover:bg-red-100 hover:text-red-700 ml-2"
                            title="Eliminar permanentemente a este usuario"
                        >
                            🗑️
                        </button>
                    </td>
                </tr>
            );
        } else {
            return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-700 font-bold text-sm w-full text-center">{user.fullName?.charAt(0) || 'P'}</span>
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">{user.fullName || 'Representante'}</div>
                                <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{user.companyName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.industry || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.planExpiresAt ? format(new Date(user.planExpiresAt), "d 'de' MMM, yyyy", { locale: es }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {user.activeCasesCount > 0 ? (
                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {user.activeCasesCount} Activo
                            </span>
                        ) : (
                            <span className="text-sm text-slate-400 font-medium">0</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.createdAt ? format(new Date(user.createdAt), "d 'de' MMM, yyyy", { locale: es }) : 'N/A'}
                    </td>
                </tr>
            );
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="mb-6 shrink-0">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <UsersIcon className="w-6 h-6 mr-2 text-slate-500" />
                    Directorio de Usuarios
                </h1>
                <p className="text-slate-500">Supervisa las cuentas de abogados verificados, trabajadores y empresas PyMES.</p>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 shrink-0">
                <div className="inline-flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('lawyers')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'lawyers' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Abogados
                    </button>
                    <button
                        onClick={() => setActiveTab('workers')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'workers' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Trabajadores
                    </button>
                    <button
                        onClick={() => setActiveTab('pymes')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pymes' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <Building2 className="w-4 h-4 mr-2" />
                        PyMES
                    </button>
                </div>

                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <label className="flex items-center ml-4 space-x-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                        type="checkbox" 
                        checked={filterActiveCases} 
                        onChange={(e) => setFilterActiveCases(e.target.checked)} 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" 
                    />
                    <span className="font-medium">Filtrar Activos</span>
                </label>
                
                <button
                    onClick={fetchUsers}
                    className="ml-3 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex shrink-0"
                    title="Recargar Datos"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                {renderTableHeaders()}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(renderTableRow)
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="text-slate-500 flex flex-col items-center">
                                            <Search className="w-12 h-12 text-slate-300 mb-3" />
                                            <p className="text-lg font-medium text-slate-900">No se encontraron resultados</p>
                                            <p>Intenta con otros términos de búsqueda.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6 shrink-0">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                Mostrando <span className="font-medium">{filteredUsers.length}</span> resultados de usuarios
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gift Modal */}
            {giftModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                🎁 Regalos y Beneficios
                            </h3>
                            <button
                                onClick={() => setGiftModal({ ...giftModal, isOpen: false })}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">{activeTab === 'lawyers' ? 'Abogado' : activeTab === 'workers' ? 'Trabajador' : 'Usuario'} Seleccionado:</p>
                                <p className="text-base font-semibold text-slate-900">{giftModal.name}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        Tiempo de Plan PRO Gratuito (Meses)
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">Deja en blanco si no deseas dar u otorgar meses PRO.</p>
                                    <input
                                        type="number"
                                        min="0"
                                        value={giftMonths}
                                        onChange={(e) => setGiftMonths(e.target.value)}
                                        placeholder="Ej. 1, 3, 6"
                                        className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border outline-none"
                                    />
                                </div>

                                {activeTab === 'lawyers' && (
                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            Cupo de Casos Gratuitos (Mensual)
                                        </label>
                                        <p className="text-xs text-slate-500 mb-2">Cupo actual: <span className="font-bold">{giftModal.currentQuota}</span> casos/mes.</p>
                                        <input
                                            type="number"
                                            min="0"
                                            value={giftQuota}
                                            onChange={(e) => setGiftQuota(e.target.value)}
                                            placeholder="Ej. 10, 15"
                                            className="w-full rounded-lg border-slate-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2.5 border outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setGiftModal({ ...giftModal, isOpen: false })}
                                className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                disabled={loading}
                                onClick={submitGiftConfig}
                                className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-all disabled:opacity-70"
                            >
                                {loading ? 'Guardando...' : 'Aplicar Beneficios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
