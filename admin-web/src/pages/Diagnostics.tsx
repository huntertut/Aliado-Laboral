import { useState, useEffect } from 'react';
import { api } from '../config/axios';
import {
    Activity,
    Bell,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Users,
    CreditCard,
    Smartphone,
    Send
} from 'lucide-react';

export default function Diagnostics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Test push state
    const [testEmail, setTestEmail] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const fetchDiagnostics = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/diagnostics/health');
            setData(res.data);
        } catch (err: any) {
            console.error('Error fetching system diagnostics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiagnostics();
    }, []);

    const handleSyncFirebase = async () => {
        if (!window.confirm('¿Ejecutar sincronización completa con Firebase Auth?')) return;
        try {
            setSyncing(true);
            const res = await api.post('/admin/lawyers/sync-firebase');
            alert(`✅ ${res.data.message}`);
            fetchDiagnostics();
        } catch (err: any) {
            console.error('Error syncing Firebase:', err);
            alert('Error al sincronizar con Firebase.');
        } finally {
            setSyncing(false);
        }
    };

    const handleSendTestPush = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmail.trim()) return;
        setTestLoading(true);
        setTestResult(null);

        try {
            const res = await api.post('/admin/diagnostics/test-push', { email: testEmail.trim() });
            setTestResult({ success: true, data: res.data });
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Error al enviar notificación de prueba.';
            setTestResult({ success: false, error: msg });
        } finally {
            setTestLoading(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        if (status === 'healthy') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Óptimo
                </span>
            );
        }
        if (status === 'warning') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    Atención
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
                Error
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Activity className="w-6 h-6 mr-2 text-blue-600" />
                        Centro de Diagnóstico del Sistema
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Verifica el estado en vivo de Notificaciones Push, Firebase Auth, Stripe y Requerimientos Móviles.
                    </p>
                </div>
                <button
                    onClick={fetchDiagnostics}
                    disabled={loading}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Ejecutar Diagnóstico
                </button>
            </div>

            {/* Main Cards Grid */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 1. Push Notifications Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Bell className="w-5 h-5" />
                            </div>
                            {renderStatusBadge(data.pushNotifications.status)}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Notificaciones Push</h3>
                            <p className="text-xs text-slate-400">Tokens de dispositivos móviles</p>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Usuarios con Token:</span>
                                <span className="font-semibold text-slate-800">{data.pushNotifications.totalUsersWithPushToken}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Formato Expo Válido:</span>
                                <span className="font-semibold text-emerald-600">{data.pushNotifications.validExpoTokensCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Última Noticia:</span>
                                <span className="font-medium text-slate-700 truncate max-w-[140px]" title={data.pushNotifications.latestNewsTitle}>
                                    {data.pushNotifications.latestNewsTitle}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Firebase Auth vs SQL */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                                <Users className="w-5 h-5" />
                            </div>
                            {renderStatusBadge(data.firebaseAuth.status)}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Sincronización Firebase</h3>
                            <p className="text-xs text-slate-400">Auth Cloud vs Base SQL</p>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total en Firebase:</span>
                                <span className="font-semibold text-slate-800">{data.firebaseAuth.firebaseTotalUsers}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total en SQL:</span>
                                <span className="font-semibold text-blue-600">{data.firebaseAuth.sqlTotalUsers}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 pt-1">
                                <span>Trabajadores: {data.firebaseAuth.breakdown.workers}</span>
                                <span>Abogados: {data.firebaseAuth.breakdown.lawyers}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Stripe Payments */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            {renderStatusBadge(data.stripePayments.status)}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Pasarela Stripe</h3>
                            <p className="text-xs text-slate-400">Modo Producción Live</p>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Llave Live (`sk_live`):</span>
                                <span className={`font-semibold ${data.stripePayments.isLiveMode ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {data.stripePayments.isLiveMode ? 'Activa 🟢' : 'Pruebas 🟡'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Suscripciones Activas:</span>
                                <span className="font-semibold text-slate-800">{data.stripePayments.activeSubscriptionsCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Mobile Requirements */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            {renderStatusBadge(data.mobileApp.status)}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Versión Móvil</h3>
                            <p className="text-xs text-slate-400">Requerimiento mínimo</p>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">versionCode Mínimo:</span>
                                <span className="font-semibold text-purple-700">Build {data.mobileApp.minRequiredVersionCode}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Estado de Bloqueo:</span>
                                <span className="font-medium text-emerald-600">Activo (Builds &lt;96 bloqueadas)</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Push Tool & Recent Tokens Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Send Test Push Form */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Send className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Prueba de Notificación Push a Usuario</h2>
                            <p className="text-xs text-slate-500">Envía una notificación directa al celular de un usuario específico para validar entrega FCM.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSendTestPush} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Correo electrónico del usuario:
                            </label>
                            <input
                                type="email"
                                placeholder="ejemplo@test.com"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={testLoading}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                        >
                            {testLoading ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Enviar Notificación de Prueba
                        </button>
                    </form>

                    {testResult && (
                        <div className={`p-4 rounded-lg border text-sm mt-3 ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                            <p className="font-bold mb-1">{testResult.success ? '✅ Envio completado' : '❌ Error al enviar'}</p>
                            {testResult.success ? (
                                <div className="space-y-1 text-xs">
                                    <p>• <strong>Usuario:</strong> {testResult.data.userEmail} ({testResult.data.userRole})</p>
                                    <p>• <strong>Token:</strong> {testResult.data.pushTokenMasked}</p>
                                    <p>• <strong>Resultado:</strong> {testResult.data.message}</p>
                                </div>
                            ) : (
                                <p className="text-xs">{testResult.error}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Actions & Recent Tokens */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-800">Acciones de Mantenimiento</h2>
                    <div className="space-y-3">
                        <button
                            onClick={handleSyncFirebase}
                            disabled={syncing}
                            className="w-full p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-between border border-indigo-100"
                        >
                            <span className="flex items-center">
                                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                Sincronizar todos los usuarios con Firebase Auth
                            </span>
                            <span className="text-xs font-semibold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                                Ejecutar
                            </span>
                        </button>
                    </div>

                    {data?.pushNotifications?.recentTokens && (
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dispositivos Recientes Registrados</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {data.pushNotifications.recentTokens.map((t: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                                        <div>
                                            <p className="font-semibold text-slate-700">{t.email} ({t.role})</p>
                                            <p className="text-slate-400 font-mono">{t.tokenMasked || 'Token Nulo'}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.isValidFormat ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {t.isValidFormat ? 'VÁLIDO' : 'INVÁLIDO'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
