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
    Send,
    Trash2,
    X,
    Info,
    Copy,
    Check
} from 'lucide-react';

export default function Diagnostics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [purging, setPurging] = useState(false);

    // Test push state
    const [testEmail, setTestEmail] = useState('');
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    // Selected device modal state
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [copied, setCopied] = useState(false);

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

    const handlePurgeTokens = async () => {
        if (!window.confirm('¿Depurar tokens corruptos de la base de datos SQL?\nEsto eliminará los valores con error para que los usuarios puedan volver a registrar su token limpio al abrir la app.')) return;
        try {
            setPurging(true);
            const res = await api.post('/admin/diagnostics/purge-invalid-tokens');
            alert(`🧹 ${res.data.message}`);
            fetchDiagnostics();
        } catch (err: any) {
            console.error('Error purging tokens:', err);
            alert('Error al depurar tokens.');
        } finally {
            setPurging(false);
        }
    };

    const handleSendTestPush = async (e?: React.FormEvent, customEmail?: string) => {
        if (e) e.preventDefault();
        const target = customEmail || testEmail;
        if (!target.trim()) return;

        setTestLoading(true);
        setTestResult(null);

        try {
            const res = await api.post('/admin/diagnostics/test-push', { email: target.trim() });
            setTestResult({ success: true, data: res.data });
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Error al enviar notificación de prueba.';
            setTestResult({ success: false, error: msg });
        } finally {
            setTestLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                                <span className="text-slate-500">Tokens Corruptos:</span>
                                <span className={`font-semibold ${data.pushNotifications.invalidTokensCount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                    {data.pushNotifications.invalidTokensCount}
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
                                <span className="font-medium text-emerald-600">Activo (Builds &lt;97 bloqueadas)</span>
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
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Acciones de Mantenimiento</h2>
                        <span className="text-xs text-slate-400">Haz clic en un dispositivo para ver detalles</span>
                    </div>
                    <div className="space-y-2">
                        <button
                            onClick={handleSyncFirebase}
                            disabled={syncing}
                            className="w-full p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-between border border-indigo-100"
                        >
                            <span className="flex items-center">
                                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                Sincronizar todos los usuarios con Firebase Auth
                            </span>
                            <span className="text-xs font-semibold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                                Ejecutar
                            </span>
                        </button>
                        <button
                            onClick={handlePurgeTokens}
                            disabled={purging}
                            className="w-full p-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-between border border-red-100"
                        >
                            <span className="flex items-center">
                                <Trash2 className={`w-4 h-4 mr-2 ${purging ? 'animate-spin' : ''}`} />
                                Limpiar Tokens de Error Corruptos (`__ERROR__`)
                            </span>
                            <span className="text-xs font-semibold bg-red-200 text-red-800 px-2 py-0.5 rounded">
                                Limpiar
                            </span>
                        </button>
                    </div>

                    {data?.pushNotifications?.recentTokens && (
                        <div className="pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Dispositivos Recientes Registrados (Clic para inspeccionar)
                                </h3>
                            </div>
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {data.pushNotifications.recentTokens.map((t: any, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedDevice(t)}
                                        className="flex items-center justify-between text-xs p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-lg cursor-pointer transition-all shadow-2xs group"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-800 group-hover:text-blue-700 flex items-center">
                                                {t.email}
                                                <span className="ml-1.5 font-normal text-[10px] text-slate-400">({t.role})</span>
                                            </p>
                                            <p className="text-slate-500 font-mono text-[11px] truncate max-w-[220px]">
                                                {t.tokenMasked || 'Token Nulo'}
                                            </p>
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

            {/* Selected Device Inspection Modal */}
            {selectedDevice && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 relative">
                        <button
                            onClick={() => setSelectedDevice(null)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-3">
                            <div className={`p-3 rounded-xl ${selectedDevice.isValidFormat ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {selectedDevice.isValidFormat ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Detalle de Dispositivo</h3>
                                <p className="text-xs text-slate-500">{selectedDevice.email} ({selectedDevice.role})</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    Token Push / Cadena de Error en BD:
                                </label>
                                <div className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg break-all relative group">
                                    {selectedDevice.fullToken || 'null'}
                                    {selectedDevice.fullToken && (
                                        <button
                                            onClick={() => copyToClipboard(selectedDevice.fullToken)}
                                            className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Diagnosis Box */}
                            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${selectedDevice.isValidFormat ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                                <p className="font-bold flex items-center mb-1">
                                    <Info className="w-4 h-4 mr-1.5 shrink-0" />
                                    {selectedDevice.isValidFormat ? 'Token de Expo Activo y Válido' : 'Diagnóstico de Token Inválido:'}
                                </p>
                                {selectedDevice.isValidFormat ? (
                                    <p>Este token tiene un formato `ExponentPushToken[...]` perfecto. Puedes enviarle una notificación de prueba directamente.</p>
                                ) : (
                                    <div className="space-y-1 mt-1">
                                        <p>• La columna `pushToken` en la base de datos contiene una cadena de error obtenida al arrancar la app en el celular.</p>
                                        <p>• <strong>Causa habitual:</strong> Permisos denegados en el dispositivo o app corrida en emulador/versión antigua.</p>
                                        <p>• <strong>Solución:</strong> Da clic en "Limpiar Tokens Corruptos" y pide al usuario abrir la app móvil con el Build 96 instalado.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                            <button
                                onClick={() => {
                                    setTestEmail(selectedDevice.email);
                                    setSelectedDevice(null);
                                    handleSendTestPush(undefined, selectedDevice.email);
                                }}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Probar Envio Push a {selectedDevice.email.split('@')[0]}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
