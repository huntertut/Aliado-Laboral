import { useState, useEffect } from 'react';
import { Search, FolderOpen, MessageSquare, Trash2, ShieldOff, EyeOff } from 'lucide-react';
import { api } from '../config/axios';

interface Case {
    id: string;
    workerName: string;
    lawyerName: string;
    caseType: string;
    status: 'pending' | 'accepted' | 'completed' | 'rejected';
    createdAt: string;
    bothPaymentsSucceeded: boolean;
}

interface ForumPost {
    id: string;
    title: string;
    content: string;
    topic: string;
    status: string;
    views: number;
    createdAt: string;
    _count?: { answers: number };
}

export default function Cases() {
    const [activeTab, setActiveTab] = useState<'cases' | 'forum'>('cases');
    const [cases, setCases] = useState<Case[]>([]);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'cases') {
                const response = await api.get('/admin/cases');
                setCases(response.data);
            } else {
                const response = await api.get('/forum/posts');
                setPosts(response.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handlePurgeData = async (requestId: string) => {
        if (!window.confirm('¿Estás seguro de purgar los datos sensibles de este caso? Esta acción es irreversible.')) return;
        try {
            await api.post(`/admin/cases/${requestId}/purge`);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'No se pudo purgar la información');
        }
    };

    const handleHidePost = async (postId: string) => {
        if (!window.confirm('¿Deseas ocultar esta publicación del foro público?')) return;
        try {
            await api.put(`/forum/posts/${postId}/hide`);
            fetchData();
        } catch (error) {
            alert('Error ocultando la publicación');
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm('¿Eliminar permanentemente este post?')) return;
        try {
            await api.delete(`/forum/posts/${postId}`);
            fetchData();
        } catch (error) {
            alert('Error eliminando la publicación');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'accepted': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const filteredCases = cases.filter(c =>
        c.workerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lawyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.caseType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPosts = posts.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Casos y Foro</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestión de expedientes (Match) y moderación del foro laboral anónimo.
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                        onClick={() => setActiveTab('cases')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'cases' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Expedientes / Match
                    </button>
                    <button
                        onClick={() => setActiveTab('forum')}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'forum' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Foro Anónimo
                    </button>
                </div>
            </div>

            <div className="bg-white px-4 py-3 border border-slate-200 rounded-xl flex items-center shadow-sm">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input
                    type="text"
                    placeholder={activeTab === 'cases' ? "Buscar por trabajador, abogado o tipo..." : "Buscar temas en el foro..."}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeTab === 'cases' ? (
                        filteredCases.length > 0 ? (
                            filteredCases.map(c => (
                                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">ID: {c.id.slice(0, 8)}</span>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(c.status)}`}>
                                                {c.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-3">{c.caseType}</h3>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm text-slate-600">
                                                <span className="w-20 font-semibold text-slate-700">Trabajador:</span>
                                                <span className="truncate flex-1">{c.workerName}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-slate-600">
                                                <span className="w-20 font-semibold text-slate-700">Abogado:</span>
                                                <span className="truncate flex-1">{c.lawyerName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center mt-auto">
                                        <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                                        {c.status === 'accepted' && c.bothPaymentsSucceeded && (
                                            <button
                                                onClick={() => handlePurgeData(c.id)}
                                                className="text-xs flex items-center text-red-600 hover:text-red-800 font-semibold bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                            >
                                                <ShieldOff className="w-3 h-3 mr-1" /> Purgar Datos
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                                <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p>No hay casos registrados con esos parámetros.</p>
                            </div>
                        )
                    ) : (
                        filteredPosts.length > 0 ? (
                            filteredPosts.map(p => (
                                <div key={p.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative flex flex-col ${p.status === 'hidden' ? 'opacity-70 bg-slate-50' : ''}`}>
                                    {p.status === 'hidden' && (
                                        <div className="absolute top-4 right-4 rotate-12 bg-red-100 text-red-700 font-bold text-xs px-2 py-1 rounded border border-red-200 z-10">
                                            OCULTO
                                        </div>
                                    )}
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase tracking-wider">{p.topic}</span>
                                            <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-2">{p.title}</h3>
                                        <p className="text-sm text-slate-600 line-clamp-3 mb-4">{p.content}</p>

                                        <div className="flex items-center text-xs text-slate-500 space-x-4 mt-auto">
                                            <span className="flex items-center"><EyeOff className="w-3.5 h-3.5 mr-1" /> {p.views}</span>
                                            <span className="flex items-center"><MessageSquare className="w-3.5 h-3.5 mr-1" /> {p._count?.answers || 0}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end items-center space-x-2 mt-auto">
                                        {p.status !== 'hidden' && (
                                            <button onClick={() => handleHidePost(p.id)} className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors" title="Ocultar del público">
                                                <EyeOff className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button onClick={() => handleDeletePost(p.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar Post">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p>No hay preguntas / posts en el foro.</p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
