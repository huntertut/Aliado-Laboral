import { useState, useEffect } from 'react';
import { api } from '../config/axios';
import { Settings as SettingsIcon, Save, Gift, AlertCircle, ShieldAlert, Lock, CheckCircle } from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [promoActive, setPromoActive] = useState(false);
    const [trialDays, setTrialDays] = useState('30');
    const [bannerText, setBannerText] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    // Password Update State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get('/system/public');
                const { promoActive, trialDays, bannerText } = response.data;
                setPromoActive(promoActive || false);
                setTrialDays(String(trialDays || 30));
                setBannerText(bannerText || '');
            } catch (error) {
                console.error('Error fetching config:', error);
                setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await api.put('/system/update', {
                promoActive,
                trialDays: parseInt(trialDays),
                bannerText
            });
            setMessage({ type: 'success', text: 'Configuración de promoción actualizada correctamente.' });
            // Hide message after 3 seconds
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', text: 'No se pudo guardar la configuración. Revisa que tu administrador tenga permisos completos.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMsg({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        try {
            setPasswordLoading(true);
            await api.put('/admin/security/password', { currentPassword, newPassword });
            setPasswordMsg({ type: 'success', text: '¡Contraseña de administrador actualizada con éxito!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error updating password:', error);
            const msg = error.response?.data?.error || 'No se pudo actualizar la contraseña.';
            setPasswordMsg({ type: 'error', text: msg });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <SettingsIcon className="w-6 h-6 mr-2 text-slate-500" />
                    Configuración del Sistema
                </h1>
                <p className="text-slate-500">Administra las ofertas, banners y parámetros globales de la plataforma.</p>
            </div>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'}`}>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 p-6 bg-slate-50">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <Gift className="w-5 h-5 mr-2 text-blue-600" />
                        Gestión de Ofertas (Promoción Abogados)
                    </h2>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                            <h3 className="font-medium text-slate-800">Motor Avanzado de Promociones</h3>
                            <p className="text-sm text-slate-500">Las promociones, descuentos y regalias han sido movidas a su propio panel dedicado.</p>
                        </div>
                        <a href="/app/promotions" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition">
                            Ir a Promociones
                        </a>
                    </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center disabled:opacity-70"
                    >
                        {saving ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>

            {/* Account Security Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8 mb-12">
                <div className="border-b border-slate-100 p-6 bg-slate-50">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                        <ShieldAlert className="w-5 h-5 mr-2 text-red-600" />
                        Seguridad de la Cuenta Admin
                    </h2>
                </div>

                <div className="p-6">
                    {passwordMsg.text && (
                        <div className={`p-4 mb-6 rounded-lg flex items-center ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'}`}>
                            {passwordMsg.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                            {passwordMsg.text}
                        </div>
                    )}

                    <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Actual</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                placeholder="Escribe la contraseña vigente"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                placeholder="Escribe la nueva contraseña"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                placeholder="Repite la nueva contraseña"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                            >
                                {passwordLoading ? (
                                    <span className="flex items-center">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                        Actualizando...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <Lock className="w-5 h-5 mr-2" />
                                        Cambiar Contraseña
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
