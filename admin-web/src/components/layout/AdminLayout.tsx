import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Wallet, Settings, LogOut, ShieldAlert } from 'lucide-react';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        // TODO: Clear tokens
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
        { name: 'Usuarios', path: '/app/users', icon: Users },
        { name: 'Contabilidad', path: '/app/finance', icon: Wallet },
        { name: 'Casos y Foro', path: '/app/cases', icon: FileText },
        { name: 'Validaciones', path: '/app/verifications', icon: ShieldAlert },
        { name: 'Configuración', path: '/app/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-blue-700 font-sans tracking-tight">Aliado Laboral</h2>
                    <p className="text-xs text-slate-400 font-medium">Panel Administrativo</p>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                            AD
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-slate-700">Super Admin</p>
                            <p className="text-xs text-slate-500">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0">
                    <h1 className="text-lg font-semibold text-slate-800">
                        {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
                    </h1>
                    <div className="flex items-center space-x-4">
                        <span className="py-1 px-2.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            Conectado a Producción
                        </span>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="flex-1 overflow-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
