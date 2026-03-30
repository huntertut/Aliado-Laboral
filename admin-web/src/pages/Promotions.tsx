import { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../config/axios';

interface Promotion {
    id: string;
    title: string;
    description: string | null;
    targetRole: string;
    type: string;
    value: number;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    maxUses: number | null;
    currentUses: number;
}

export default function Promotions() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Promotion>>({
        targetRole: 'ALL',
        type: 'FREE_TRIAL',
        isActive: true,
        value: 15,
        startDate: '',
        endDate: ''
    });

    // Auto-calculate 'value' based on dates
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate).getTime();
            const end = new Date(formData.endDate).getTime();
            if (end > start) {
                const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                setFormData(prev => ({ ...prev, value: diffDays }));
            }
        }
    }, [formData.startDate, formData.endDate]);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/promotions');
            setPromotions(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching promotions:', err);
            setError('Error al cargar las promociones. Revisa la conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api.put(`/admin/promotions/${formData.id}`, formData);
            } else {
                await api.post('/admin/promotions', formData);
            }
            setShowForm(false);
            setFormData({ targetRole: 'ALL', type: 'FREE_TRIAL', isActive: true, value: 15, startDate: '', endDate: '' });
            fetchPromotions();
        } catch (err) {
            console.error('Error saving promotion:', err);
            alert('Error al guardar la promoción');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta promoción?')) return;
        try {
            await api.delete(`/admin/promotions/${id}`);
            fetchPromotions();
        } catch (err) {
            console.error('Error deleting promotion:', err);
            alert('Error al eliminar');
        }
    };

    const handleEdit = (promo: Promotion) => {
        setFormData(promo);
        setShowForm(true);
    };

    if (loading && promotions.length === 0) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Gift className="w-6 h-6 mr-2 text-indigo-500" />
                        Motor de Promociones
                    </h1>
                    <p className="text-slate-500">Configura días de prueba o descuentos para tus usuarios.</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ targetRole: 'ALL', type: 'FREE_TRIAL', isActive: true, value: 15 });
                        setShowForm(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-1" />
                    Nueva Promo
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center shadow-sm">
                    <XCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold mb-4">{formData.id ? 'Editar Promoción' : 'Crear Promoción'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                                <input required type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Buen Fin" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
                                <input type="text" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Audiencia</label>
                                <select value={formData.targetRole} onChange={e => setFormData({ ...formData, targetRole: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                                    <option value="ALL">Todos los usuarios</option>
                                    <option value="lawyer">Abogados</option>
                                    <option value="worker">Trabajadores</option>
                                    <option value="pyme">Pymes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Días Regalados</label>
                                <input required type="number" min="1" value={formData.value || ''} onChange={e => setFormData({ ...formData, value: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50 font-bold" />
                                <p className="text-xs text-slate-400 mt-1">Se auto-calcula si eliges fechas</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Válida Desde (Opcional)</label>
                                <input type="datetime-local" value={formData.startDate ? formData.startDate.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Válida Hasta (Opcional)</label>
                                <input type="datetime-local" value={formData.endDate ? formData.endDate.slice(0, 16) : ''} onChange={e => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">Guardar Promoción</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-600">Título</th>
                                <th className="p-4 font-semibold text-slate-600">Audiencia</th>
                                <th className="p-4 font-semibold text-slate-600">Días Gratis</th>
                                <th className="p-4 font-semibold text-slate-600">Vigencia</th>
                                <th className="p-4 font-semibold text-slate-600">Estado</th>
                                <th className="p-4 font-semibold text-slate-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {promotions.map((promo) => (
                                <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-medium text-slate-900">{promo.title}</p>
                                        {promo.description && <p className="text-xs text-slate-500">{promo.description}</p>}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {promo.targetRole === 'ALL' ? 'Todos' : promo.targetRole}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-slate-700">{promo.value} días</td>
                                    <td className="p-4 text-xs text-slate-500">
                                        {promo.startDate && promo.endDate ? (
                                            <>
                                                <div><span className="font-semibold text-slate-700">De:</span> {new Date(promo.startDate).toLocaleDateString()}</div>
                                                <div><span className="font-semibold text-slate-700">Al:</span> {new Date(promo.endDate).toLocaleDateString()}</div>
                                            </>
                                        ) : (
                                            <span className="text-slate-400 italic">Siempre activa</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {promo.isActive ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Activa
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                                <XCircle className="w-3 h-3 mr-1" /> Inactiva
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleEdit(promo)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(promo.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {promotions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No hay promociones registradas aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
