import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../config/axios';
import logo from '../assets/logo.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });

            const { user, token } = response.data;

            // Access Control: Only allow Admin, Supervisor, or Accountant
            if (!['admin', 'supervisor', 'accountant'].includes(user.role)) {
                throw new Error('No tienes privilegios administrativos para acceder a este portal.');
            }

            login(token, { id: user.id, email: user.email, role: user.role });
            navigate('/app');

        } catch (err: any) {
            if (err.message === 'No tienes privilegios administrativos para acceder a este portal.') {
                setError(err.message);
            } else {
                const serverError = err.response?.data?.error || '';
                if (serverError.toLowerCase().includes('not found') || serverError.toLowerCase().includes('user')) {
                    setError('Este correo no está registrado en el sistema.');
                } else if (serverError.toLowerCase().includes('password') || serverError.toLowerCase().includes('credentials') || serverError.toLowerCase().includes('invalid')) {
                    setError('Contraseña incorrecta. Verifica tus datos e intenta de nuevo.');
                } else {
                    setError('Error de conexión al servidor. Intenta más tarde.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <div className="text-center mb-8">
                    <img src={logo} alt="Aliado Laboral" className="h-16 w-auto mx-auto mb-4 rounded-xl object-contain" />
                    <h1 className="text-2xl font-bold text-slate-800">Aliado Laboral</h1>
                    <p className="text-slate-500 mt-1">Portal Administrativo Oficial</p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Correo Corporativo</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border bg-slate-50 outline-none transition-all"
                            placeholder="admin@cibertmx.org"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña de Acceso</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border bg-slate-50 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-bold shadow-md shadow-blue-500/30 disabled:opacity-70"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Autorizar Ingreso'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">Sistema Seguro Restringido. Todo acceso es monitoreado.</p>
                </div>
            </div>
        </div>
    );
}
