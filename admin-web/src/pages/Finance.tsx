import { useState, useEffect } from 'react';
import { DollarSign, ArrowDownRight, CreditCard, Activity, Calendar } from 'lucide-react';
import { api } from '../config/axios';

interface FinancialStats {
    totalRevenue: number;
    activeSubscriptions: number;
    successfulPayments: number;
    failedPayments: number;
    recentPayments: any[];
}

export default function Finance() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, logsRes] = await Promise.all([
                api.get('/admin/financials/stats'),
                api.get('/admin/financials/logs')
            ]);
            setStats(statsRes.data);
            setLogs(logsRes.data);
        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Contabilidad y Finanzas</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Métricas de ingresos, suscripciones activas y logs de transacciones vía Stripe.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : (
                <>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Ingresos Totales (MXN)</p>
                                <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(stats?.totalRevenue || 0)}</h3>
                            </div>
                            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Pagos Exitosos</p>
                                <h3 className="text-3xl font-bold text-slate-900">{stats?.successfulPayments || 0}</h3>
                            </div>
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <Activity className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Pagos Fallidos / Rechazados</p>
                                <h3 className="text-3xl font-bold text-slate-900">{stats?.failedPayments || 0}</h3>
                            </div>
                            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                                <ArrowDownRight className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Suscripciones Activas</p>
                                <h3 className="text-3xl font-bold text-slate-900">{stats?.activeSubscriptions || 0}</h3>
                            </div>
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                <CreditCard className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Transactions Log */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">Historial de Transacciones (Stripe)</h2>
                            <p className="text-sm text-slate-500">Últimos cobros registrados en el sistema.</p>
                        </div>

                        {logs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4">ID Transacción</th>
                                            <th className="px-6 py-4">Usuario</th>
                                            <th className="px-6 py-4">Monto</th>
                                            <th className="px-6 py-4">Estado</th>
                                            <th className="px-6 py-4">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.stripePaymentIntentId || log.id}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-slate-900">{log.user?.fullName || 'Desconocido'}</span>
                                                    <br />
                                                    <span className="text-xs text-slate-500">{log.user?.email || 'N/A'}</span>
                                                </td>
                                                <td className={`px-6 py-4 font-bold ${log.status === 'succeeded' ? 'text-green-600' : 'text-slate-900'}`}>
                                                    {formatCurrency(log.amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${log.status === 'succeeded' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        log.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-slate-100 text-slate-700 border-slate-200'
                                                        }`}>
                                                        {log.status ? log.status.toUpperCase() : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-16 text-center text-slate-500">
                                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p>No hay registros de transacciones en la base de datos.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
