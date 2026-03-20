import { useState, useEffect } from 'react';
import { api } from '../config/axios';
import { Settings as SettingsIcon, Save, Gift, AlertCircle } from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [promoActive, setPromoActive] = useState(false);
    const [trialDays, setTrialDays] = useState('30');
    const [bannerText, setBannerText] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

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
                    {/* Toggle Active */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                            <h3 className="font-medium text-slate-800">Activar Promoción de Bienvenida</h3>
                            <p className="text-sm text-slate-500">Habilita el periodo de prueba gratuito para los nuevos registros de abogados.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={promoActive}
                                onChange={(e) => setPromoActive(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {promoActive && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Días de Prueba (Gratis)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={trialDays}
                                    onChange={(e) => setTrialDays(e.target.value)}
                                    placeholder="Ej. 30"
                                />
                                <p className="mt-1 text-xs text-slate-500">Los abogados recibirán estos días de gracia antes de su primer cobro.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Texto del Banner Promocional
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={bannerText}
                                    onChange={(e) => setBannerText(e.target.value)}
                                    placeholder="Ej. ¡Aprovecha nuestro Buen Fin! 30 días Gratis"
                                />
                            </div>

                            {/* Banner Preview */}
                            {bannerText && (
                                <div className="mt-4">
                                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vista Previa Mobile</span>
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-3 text-center shadow-inner flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-white mr-2" />
                                        <span className="text-white font-bold">{bannerText}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
        </div>
    );
}
