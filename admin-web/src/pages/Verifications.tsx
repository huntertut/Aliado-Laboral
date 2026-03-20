import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, History, AlertTriangle, Search } from 'lucide-react';
import { api } from '../config/axios';

interface Alert {
    id: string;
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    isResolved: boolean;
    createdAt: string;
}

interface LogEntry {
    id: string;
    action: string;
    user: { email: string } | null;
    createdAt: string;
}

export default function Verifications() {
    const [activeTab, setActiveTab] = useState<'alerts' | 'logs'>('alerts');
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'alerts') {
                const response = await api.get('/admin/security/alerts');
                setAlerts(response.data);
            } else {
                const response = await api.get('/admin/security/logs');
                setLogs(response.data);
            }
        } catch (error) {
            console.error('Error fetching security data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleResolveAlert = async (alertId: string) => {
        try {
            await api.put(`/admin/security/alerts/${alertId}/resolve`);
            fetchData();
        } catch (error) {
            alert('No se pudo resolver la alerta');
        }
    };

    const filteredAlerts = alerts.filter(a =>
        a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredLogs = logs.filter(l =>
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Validaciones y Seguridad</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Centro de monitoreo de alertas críticas y bitácora del sistema.
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'alerts' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Alertas
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <History className="w-4 h-4 mr-2" />
                        Bitácora (Logs)
                    </button>
                </div>
            </div>

            <div className="bg-white px-4 py-3 border border-slate-200 rounded-xl flex items-center shadow-sm">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input
                    type="text"
                    placeholder="Buscar alertas o acciones..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-700 focus:ring-0 placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {activeTab === 'alerts' ? (
                        filteredAlerts.length > 0 ? (
                            <ul className="divide-y divide-slate-200">
                                {filteredAlerts.map(alert => (
                                    <li key={alert.id} className="p-5 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                        <div className={`p-2 rounded-full mt-1 shrink-0 ${alert.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase">{alert.type.replace(/_/g, ' ')}</h3>
                                                <span className="text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-slate-700 text-sm mb-3">{alert.message}</p>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs font-bold px-2 py-1 rounded border ${alert.isResolved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                    {alert.isResolved ? 'RESUELTA' : 'PENDIENTE'}
                                                </span>
                                                {!alert.isResolved && (
                                                    <button
                                                        onClick={() => handleResolveAlert(alert.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                                    >
                                                        Marcar como Resuelta
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="py-16 text-center text-slate-500">
                                <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-3" />
                                <p>No hay alertas pendientes en el sistema. Todo está en orden.</p>
                            </div>
                        )
                    ) : (
                        filteredLogs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4">Acción</th>
                                            <th className="px-6 py-4">Usuario</th>
                                            <th className="px-6 py-4">Fecha y Hora</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {filteredLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                                                <td className="px-6 py-4">{log.user?.email || 'Sistema (Automático)'}</td>
                                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-16 text-center text-slate-500">
                                <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p>No hay registros en la bitácora aún.</p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
