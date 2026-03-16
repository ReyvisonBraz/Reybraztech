import { useEffect, useState } from 'react';
import { Users, AlertTriangle, UserCheck, Smartphone, Mail, ShieldAlert, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Client {
    id: number;
    name: string;
    whatsapp: string;
    email: string | null;
    plan: string;
    status: string;
    is_admin: boolean;
    device: string;
    created_at: string;
}

export const AdminPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClients = async () => {
            const token = localStorage.getItem('reyb_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('/api/admin/clients', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 403 || response.status === 401) {
                    setError('Acesso negado. Você não tem permissões de administrador.');
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    throw new Error('Falha ao carregar clientes');
                }

                const data = await response.json();
                setClients(data.clients);
            } catch (err: any) {
                console.error(err);
                setError('Erro de conexão ao carregar dados do servidor.');
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-red-500/10">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
                    <h2 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">Acesso Bloqueado</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        {error}
                    </p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl transition-all duration-300 ring-1 ring-slate-700/50"
                    >
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <Users className="w-8 h-8 text-cyan-400" />
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                            Gestão de Clientes
                        </h1>
                    </div>
                    <p className="text-slate-400 max-w-2xl text-lg">
                        Administre e visualize todos os cadastros ativos na plataforma Reybraztech.
                    </p>
                </div>
                
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-4 shrink-0 shadow-xl shadow-cyan-900/10">
                    <p className="text-sm font-medium text-slate-400 mb-1 flex items-center justify-center md:justify-start gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-400" /> Total de Clientes
                    </p>
                    <p className="text-3xl font-bold text-slate-100 text-center md:text-left">
                        {clients.length}
                    </p>
                </div>
            </div>

            {/* Tabela de Clientes */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl shadow-slate-900/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-900/80 text-slate-300 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5 font-semibold">Cliente</th>
                                <th className="px-6 py-5 font-semibold">Contato</th>
                                <th className="px-6 py-5 font-semibold">Dispositivo</th>
                                <th className="px-6 py-5 font-semibold">Plano</th>
                                <th className="px-6 py-5 font-semibold">Status</th>
                                <th className="px-6 py-5 font-semibold">Data Cadastro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {clients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20 font-bold text-cyan-400">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-slate-200 font-medium flex items-center gap-2">
                                                        {client.name}
                                                        {client.is_admin && (
                                                            <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-yellow-500/20">
                                                                Admin
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-slate-500 text-xs mt-0.5">ID: {client.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Smartphone className="w-4 h-4 text-slate-500" />
                                                    {client.whatsapp}
                                                </div>
                                                {client.email && (
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                        <Mail className="w-3 h-3 text-slate-500" />
                                                        {client.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Monitor className="w-4 h-4 text-slate-500" />
                                                <span className="capitalize">{client.device || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                                                {client.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                                                client.status === 'Ativo' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(client.created_at).toLocaleDateString('pt-BR')}
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
};
