import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Shield, Gift, Search, UserCog, Briefcase } from 'lucide-react';

interface UsersTableProps {
    activeTab: 'lawyers' | 'workers' | 'pymes';
    users: any[];
    loading: boolean;
    onVerify: (lawyerId: string, currentStatus: boolean) => void;
    onGift: (userId: string, name: string, lawyerId?: string) => void;
    onDelete: (userId: string, name: string) => void;
    onChangeRole?: (userId: string, name: string, newRole: 'lawyer' | 'worker' | 'pyme') => void;
}

export default function UsersTable({ activeTab, users, loading, onVerify, onGift, onDelete, onChangeRole }: UsersTableProps) {
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
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
                        <div className="flex items-center justify-end space-x-2">
                            {onChangeRole && (
                                <button
                                    onClick={() => onChangeRole(user.userId, user.fullName || 'Abogado', 'worker')}
                                    className="p-1.5 text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-md transition-colors"
                                    title="Mover a Trabajador (Cambiar rol)"
                                >
                                    <UserCog className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => onGift(user.userId, user.fullName || 'Abogado', user.id)}
                                className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                title="Regalar Acceso y Cupos"
                            >
                                <Gift className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onVerify(user.id, user.isVerified)}
                                className={`px-3 py-1 rounded-md transition-colors ${user.isVerified ? 'text-red-700 bg-red-50 hover:bg-red-100' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'}`}
                            >
                                {user.isVerified ? 'Revocar' : 'Aprobar'}
                            </button>
                            <button
                                onClick={() => onDelete(user.userId || user.id, user.fullName || 'Abogado')}
                                className="p-1.5 text-slate-700 bg-slate-100 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors"
                                title="Eliminar permanentemente a este usuario"
                            >
                                🗑️
                            </button>
                        </div>
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
                        <div className="flex items-center justify-end space-x-2">
                            {onChangeRole && (
                                <button
                                    onClick={() => onChangeRole(user.id, user.fullName || 'Trabajador', 'lawyer')}
                                    className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                    title="Mover a Abogado (Crear perfil y sincronizar Firebase)"
                                >
                                    <Briefcase className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => onGift(user.id, user.fullName || 'Trabajador')}
                                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                title="Regalar Premium"
                            >
                                <Gift className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(user.id, user.fullName || 'Trabajador')}
                                className="p-1.5 text-slate-700 bg-slate-100 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors"
                                title="Eliminar permanentemente a este usuario"
                            >
                                🗑️
                            </button>
                        </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                            {onChangeRole && (
                                <button
                                    onClick={() => onChangeRole(user.id, user.fullName || 'Representante', 'lawyer')}
                                    className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                    title="Mover a Abogado"
                                >
                                    <Briefcase className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => onGift(user.id, user.fullName || 'Representante')}
                                className="p-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                                title="Regalar Plan"
                            >
                                <Gift className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(user.id, user.fullName || 'Representante')}
                                className="p-1.5 text-slate-700 bg-slate-100 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors"
                                title="Eliminar permanentemente a este usuario"
                            >
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            );
        }
    };

    return (
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
                                <td colSpan={10} className="px-6 py-12 text-center">
                                    <div className="flex justify-center items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length > 0 ? (
                            users.map(renderTableRow)
                        ) : (
                            <tr>
                                <td colSpan={10} className="px-6 py-12 text-center">
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
                            Mostrando <span className="font-medium">{users.length}</span> resultados de usuarios
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
