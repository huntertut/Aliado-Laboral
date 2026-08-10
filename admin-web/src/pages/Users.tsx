import { useState, useEffect } from 'react';
import { api } from '../config/axios';
import { Users as UsersIcon, Search, RefreshCw, Briefcase, Building2, Bell } from 'lucide-react';
import GiftModal from '../components/users/GiftModal';
import UsersTable from '../components/users/UsersTable';

type TabType = 'lawyers' | 'workers' | 'pymes';

export default function Users() {
    const [activeTab, setActiveTab] = useState<TabType>('lawyers');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterActiveCases, setFilterActiveCases] = useState(false);

    // Gift Modal State
    const [giftModal, setGiftModal] = useState({ isOpen: false, userId: '', name: '' });

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
            setUsers(users.map(u => u.id === lawyerId ? { ...u, isVerified: !currentStatus } : u));
        } catch (error) {
            console.error('Error verifying lawyer:', error);
            alert('Error al cambiar el estado de verificación. Revisa permisos.');
        }
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

    const handleSyncFirebase = async () => {
        if (window.confirm('¿Sincronizar todos los usuarios desde Firebase Auth? Esto restaurará trabajadores, abogados y PyMEs manteniendo sus roles intactos.')) {
            try {
                setLoading(true);
                const res = await api.post('/admin/lawyers/sync-firebase');
                const stats = res.data.stats || {};
                alert(`✅ ${res.data.message || 'Sincronización completada.'}\n\n` +
                      `• Total Firebase Auth: ${stats.totalFirebaseUsers || 0}\n` +
                      `• Trabajadores nuevos: ${stats.newWorkers || 0}\n` +
                      `• Abogados nuevos: ${stats.newLawyers || 0}\n` +
                      `• Perfiles reparados: ${stats.repairedProfiles || 0}`);
                fetchUsers();
            } catch (error) {
                console.error('Error syncing firebase:', error);
                alert('Ocurrió un error al sincronizar con Firebase.');
                setLoading(false);
            }
        }
    };

    const handleBroadcastNews = async () => {
        if (window.confirm('¿Enviar la última noticia laboral publicada como notificación push a todos los usuarios activos?')) {
            try {
                const res = await api.post('/admin/notifications/broadcast-latest');
                const d = res.data;
                let details = `📢 ${d.message || 'Notificación procesada.'}\n\n` +
                              `• Noticia: "${d.newsTitle || 'N/A'}"\n` +
                              `• Usuarios con token en BD: ${d.activeTokensCount || 0}\n` +
                              `• Tokens Expo válidos: ${d.validExpoTokensCount || 0}\n` +
                              `• Entregadas con éxito: ${d.okTicketsCount || 0}`;

                if (d.errorTicketsCount > 0) {
                    details += `\n• Errores en Expo: ${d.errorTicketsCount}`;
                    if (d.errorDetails && d.errorDetails.length > 0) {
                        details += ` (${d.errorDetails[0]?.message || d.errorDetails[0]?.details?.error || 'Token expirado/inválido'})`;
                    }
                }
                alert(details);
            } catch (error: any) {
                console.error('Error broadcasting news:', error);
                const msg = error?.response?.data?.error || 'Error al enviar la notificación.';
                alert(`❌ ${msg}`);
            }
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
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900"
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
                
                <div className="flex items-center space-x-3 ml-3 shrink-0">
                    <button
                        onClick={handleSyncFirebase}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center shadow-sm"
                        title="Sincronizar todos los usuarios desde Firebase Auth"
                    >
                        <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        <span className="font-medium text-sm hidden sm:inline">Sincronizar Firebase</span>
                    </button>
                    <button
                        onClick={handleBroadcastNews}
                        className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors flex items-center shadow-sm"
                        title="Enviar última noticia como Push Notification a todos los usuarios"
                    >
                        <Bell className="w-5 h-5 mr-2" />
                        <span className="font-medium text-sm hidden sm:inline">Enviar Notificación</span>
                    </button>
                    <button
                        onClick={fetchUsers}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center shadow-sm"
                        title="Recargar Datos"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <UsersTable
                activeTab={activeTab}
                users={filteredUsers}
                loading={loading}
                onVerify={toggleLawyerVerification}
                onGift={(userId, name) => setGiftModal({ isOpen: true, userId, name })}
                onDelete={handleDeleteUser}
            />

            {/* Gift Modal Component */}
            <GiftModal
                isOpen={giftModal.isOpen}
                userId={giftModal.userId}
                name={giftModal.name}
                activeTab={activeTab}
                onClose={() => setGiftModal({ isOpen: false, userId: '', name: '' })}
                onSuccess={fetchUsers}
            />
        </div>
    );
}
