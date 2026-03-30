import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCcw, FileText, AlertTriangle } from 'lucide-react';
import { api } from '../config/axios';

interface SecurityLog {
    id: string;
    event: string;
    email: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    details: string | null;
    createdAt: string;
}

export default function Security() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/security/logs');
            setLogs(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching security logs:', err);
            setError('Error al cargar los registros de seguridad.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getEventBadgeClass = (event: string) => {
        if (event.includes('FAILED')) return 'bg-red-100 text-red-800';
        if (event.includes('SUCCESS')) return 'bg-green-100 text-green-800';
        return 'bg-slate-100 text-slate-800';
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                        Registros de Seguridad (Accesos Fallidos)
                    </h1>
                    <p className="text-slate-500 mt-1">Monitoreo de intentos de inicio de sesión y registros sospechosos.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Error de conexión</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha / Hora</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Evento</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuario / Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detalle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP / Agente</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                                        Cargando registros...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        No hay registros de seguridad recientes.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {new Date(log.createdAt).toLocaleString('es-MX')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventBadgeClass(log.event)}`}>
                                                {log.event}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {log.email || 'Desconocido'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900">
                                            {log.details || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                            {log.ipAddress} <br />
                                            <span className="text-xs text-slate-400" title={log.userAgent || ''}>
                                                {log.userAgent ? log.userAgent.substring(0, 30) + '...' : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
