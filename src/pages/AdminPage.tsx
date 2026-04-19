import { useEffect, useState, useRef } from 'react';
import { Users, AlertTriangle, UserCheck, Smartphone, Mail, ShieldAlert, Monitor, ChevronLeft, ChevronRight, Power, PowerOff, X, RefreshCw, Link, Unlink, Activity, Search, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { SystemMonitor } from '../components/admin/SystemMonitor';
import { LoginPool } from '../components/admin/LoginPool';

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
    days_remaining: number;
    starhome_account: string | null;
}

export const AdminPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [daysToGrant, setDaysToGrant] = useState(30);
    const [updating, setUpdating] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncLog, setSyncLog] = useState<string[]>([]);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [starhomePassword, setStarhomePassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [verifyingPassword, setVerifyingPassword] = useState(false);
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkClient, setLinkClient] = useState<Client | null>(null);
    const [starhomeCode, setStarhomeCode] = useState('');
    const [linking, setLinking] = useState(false);
    const [activeTab, setActiveTab] = useState<'clients' | 'monitor' | 'pool'>('clients');
    const navigate = useNavigate();

    useEffect(() => {
        const verified = sessionStorage.getItem('admin_starhome_verified');
        if (verified === 'true') {
            setIsPasswordVerified(true);
        }
    }, []);

    const verifyPassword = async () => {
        const token = localStorage.getItem('reyb_token');
        if (!token) {
            navigate('/login');
            return;
        }

        setVerifyingPassword(true);
        setPasswordError('');

        try {
            const response = await fetch(`${API_URL}/api/admin/verify-starhome`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ starhome_password: starhomePassword })
            });

            if (response.ok) {
                sessionStorage.setItem('admin_starhome_verified', 'true');
                setIsPasswordVerified(true);
                setShowPasswordModal(false);
                setStarhomePassword('');
            } else {
                const data = await response.json();
                setPasswordError(data.error || 'Senha incorreta');
            }
        } catch (err) {
            setPasswordError('Erro ao verificar senha');
        } finally {
            setVerifyingPassword(false);
        }
    };

    const handleClientAction = (client: Client) => {
        if (!isPasswordVerified) {
            setShowPasswordModal(true);
            return;
        }
        handleToggleStatus(client);
    };

    const handleSyncClick = () => {
        if (!isPasswordVerified) {
            setShowPasswordModal(true);
            return;
        }
        handleSyncStarhome();
    };

    const handleSyncStarhome = async () => {
        const token = localStorage.getItem('reyb_token');
        if (!token) {
            navigate('/login');
            return;
        }

        setSyncing(true);
        setSyncLog(['Iniciando sincronização com StarHome...']);
        setShowSyncModal(true);

        try {
            const response = await fetch(`${API_URL}/api/admin/sync-starhome`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const err = await response.text();
                setSyncLog(prev => [...prev, `Erro ao iniciar: ${response.status} — ${err.slice(0, 200)}`]);
                return;
            }

            const data = await response.json() as { jobId?: string; mode?: string; success?: boolean; error?: string };

            if (data.mode === 'sync' && data.success) {
                setSyncLog(prev => [...prev, 'Sincronização concluída com sucesso!']);
                fetchClients(page);
                return;
            }

            if (data.mode === 'sync' && !data.success) {
                setSyncLog(prev => [...prev, `Falha: ${data.error || 'Erro desconhecido'}`]);
                return;
            }

            const jobId = data.jobId;
            if (!jobId) {
                setSyncLog(prev => [...prev, 'Resposta inesperada do servidor.']);
                return;
            }

            setSyncLog(prev => [...prev, `Job iniciado: ${jobId}. Aguardando...`]);

            let pollCount = 0;
            const maxPolls = 150;
            let finished = false;

            while (pollCount < maxPolls && !finished) {
                await new Promise(r => setTimeout(r, 4000));
                pollCount++;

                try {
                    const r = await fetch(`${API_URL}/api/admin/sync-poll/${jobId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        signal: AbortSignal.timeout(8000),
                    });
                    if (!r.ok) {
                        setSyncLog(prev => [...prev, `Job não encontrado (Render pode ter reiniciado).`]);
                        break;
                    }
                    const jobData = await r.json() as { status: string; logs?: string[]; result?: { success: boolean; clients?: number; error?: string }; dbStats?: { total?: number; active?: number } };

                    if (jobData.logs && jobData.logs.length > 0) {
                        const newLogs = jobData.logs.slice(-5);
                        setSyncLog(prev => [...prev, ...newLogs]);
                    }

                    if (jobData.status === 'done') {
                        finished = true;
                        setSyncLog(prev => [...prev, `✅ Sincronização concluída! ${jobData.result?.clients || 0} clientes.`]);
                        if (jobData.dbStats) {
                            setSyncLog(prev => [...prev, `Banco: ${jobData.dbStats.total} total | ${jobData.dbStats.active} ativos`]);
                        }
                        fetchClients(page);
                    } else if (jobData.status === 'error') {
                        finished = true;
                        setSyncLog(prev => [...prev, `❌ Falha: ${jobData.result?.error || 'Erro desconhecido'}`]);
                    }
                } catch (err: any) {
                    setSyncLog(prev => [...prev, `Timeout ao consultar job (tentativa ${pollCount})`]);
                }
            }

            if (!finished) {
                setSyncLog(prev => [...prev, '⏱️ Timeout de polling. Verifique via Telegram.']);
            }
        } catch (err: any) {
            setSyncLog(prev => [...prev, `Erro: ${err.message}`]);
        } finally {
            setSyncing(false);
        }
    };

    const fetchClients = async (pageNum: number, searchStr: string = searchQuery) => {
        const token = localStorage.getItem('reyb_token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/clients?page=${pageNum}&limit=20&search=${encodeURIComponent(searchStr)}`, {
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
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } catch (err: any) {
            console.error(err);
            setError('Erro de conexão ao carregar dados do servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients(1);
    }, [navigate]);

    const handleToggleStatus = async (client: Client) => {
        const newStatus = client.status === 'Ativo' ? 'Inativo' : 'Ativo';
        
        if (newStatus === 'Inativo') {
            const token = localStorage.getItem('reyb_token');
            setUpdating(true);
            try {
                await fetch(`${API_URL}/api/admin/clients/${client.id}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'Inativo', days_remaining: 0 })
                });
                setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: 'Inativo', days_remaining: 0 } : c));
            } catch (err) {
                console.error(err);
            } finally {
                setUpdating(false);
            }
        } else {
            setSelectedClient(client);
            setShowModal(true);
        }
    };

    const confirmActivation = async () => {
        if (!selectedClient) return;
        const token = localStorage.getItem('reyb_token');
        setUpdating(true);
        try {
            await fetch(`${API_URL}/api/admin/clients/${selectedClient.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'Ativo', days_remaining: daysToGrant })
            });
            setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, status: 'Ativo', days_remaining: daysToGrant } : c));
            setShowModal(false);
            setSelectedClient(null);
            setDaysToGrant(30);
        } catch (err) {
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    const handleLinkStarhome = (client: Client) => {
        if (!isPasswordVerified) {
            setShowPasswordModal(true);
            return;
        }
        setLinkClient(client);
        setStarhomeCode(client.starhome_account || '');
        setShowLinkModal(true);
    };

    const confirmLinkStarhome = async () => {
        if (!linkClient || !starhomeCode.trim()) return;
        const token = localStorage.getItem('reyb_token');
        setLinking(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/clients/${linkClient.id}/starhome`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ starhome_account: starhomeCode.trim() })
            });
            
            if (response.ok) {
                setClients(prev => prev.map(c => c.id === linkClient.id ? { ...c, starhome_account: starhomeCode.trim() } : c));
                setShowLinkModal(false);
                setLinkClient(null);
                setStarhomeCode('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLinking(false);
        }
    };

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
                <div className="glass border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
                    <h2 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">Acesso Bloqueado</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        {error}
                    </p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="btn-shimmer w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 border-none"
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
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gradient tracking-tight">
                            Gestão de Clientes
                        </h1>
                    </div>
                    <p className="text-slate-400 max-w-2xl text-lg">
                        Administre e visualize todos os cadastros ativos na plataforma Reybraztech.
                    </p>
                </div>
                
                <div className="glass rounded-2xl p-5 shrink-0">
                    <p className="text-sm font-medium text-slate-400 mb-1 flex items-center justify-center md:justify-start gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-400" /> Total de Clientes
                    </p>
                    <p className="text-3xl font-bold text-slate-100 text-center md:text-left">
                        {total}
                    </p>
                </div>

                <button
                    onClick={handleSyncClick}
                    disabled={syncing}
                    className="btn-shimmer flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-5 rounded-2xl transition-all duration-300 border-none disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Sincronizando...' : 'Sincronizar Starhome'}
                </button>
            </div>

            {/* Modal de Verificação de Senha Starhome */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-yellow-500/30 rounded-3xl p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-yellow-400" />
                                Verificação Admin
                            </h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-300 mb-4">
                            Digite a senha do painel Starhome para continuar.
                        </p>
                        <input
                            type="password"
                            value={starhomePassword}
                            onChange={(e) => setStarhomePassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                            placeholder="Senha do Starhome"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 mb-2 focus:outline-none focus:border-yellow-500"
                        />
                        {passwordError && (
                            <p className="text-red-400 text-sm mb-4">{passwordError}</p>
                        )}
                        <button
                            onClick={verifyPassword}
                            disabled={verifyingPassword || !starhomePassword}
                            className="btn-shimmer w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 border-none disabled:opacity-50"
                        >
                            {verifyingPassword ? 'Verificando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Sincronização */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-purple-500/30 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                                Sincronização Starhome
                            </h3>
                            <button 
                                onClick={() => setShowSyncModal(false)} 
                                className="text-slate-400 hover:text-slate-200"
                                disabled={syncing}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-4 font-mono text-sm text-slate-300 max-h-[60vh]">
                            {syncLog.map((log, i) => (
                                <div key={i} className="mb-1">{log}</div>
                            ))}
                            {syncLog.length === 0 && <span className="text-slate-500">Aguardando início...</span>}
                        </div>
                        <button
                            onClick={() => setShowSyncModal(false)}
                            disabled={syncing}
                            className="mt-4 btn-shimmer w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 border-none disabled:opacity-50"
                        >
                            {syncing ? 'Aguarde...' : 'Fechar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal para Ativar Cliente */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100">Ativar Cliente</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-300 mb-4">
                            Quantos dias deseja conceder a <strong>{selectedClient?.name}</strong>?
                        </p>
                        <input
                            type="number"
                            value={daysToGrant}
                            onChange={(e) => setDaysToGrant(parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 mb-4 focus:outline-none focus:border-cyan-500"
                            min="1"
                        />
                        <button
                            onClick={confirmActivation}
                            disabled={updating || daysToGrant < 1}
                            className="btn-shimmer w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 border-none disabled:opacity-50"
                        >
                            {updating ? 'Ativando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Vincular Starhome */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <Link className="w-5 h-5 text-cyan-400" />
                                Vincular Starhome
                            </h3>
                            <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-300 mb-4">
                            Vincular código Starhome ao cliente: <strong>{linkClient?.name}</strong>
                        </p>
                        <input
                            type="text"
                            value={starhomeCode}
                            onChange={(e) => setStarhomeCode(e.target.value)}
                            placeholder="Código Starhome (ex: gqbdjd)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 mb-4 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                            onClick={confirmLinkStarhome}
                            disabled={linking || !starhomeCode.trim()}
                            className="btn-shimmer w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 border-none disabled:opacity-50"
                        >
                            {linking ? 'Vinculando...' : 'Vincular'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Bar */}
            <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'clients'
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Gestão de Clientes
                </button>
                <button
                    onClick={() => setActiveTab('monitor')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'monitor'
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    {activeTab === 'monitor' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                    Monitor do Sistema
                </button>
                <button
                    onClick={() => setActiveTab('pool')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'pool'
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30'
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <KeyRound className="w-4 h-4" />
                    Pool de Logins
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'monitor' ? (
                <SystemMonitor />
            ) : activeTab === 'pool' ? (
                <LoginPool />
            ) : (
                <div className="glass rounded-3xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex gap-4 items-center bg-white/5">
                        <div className="flex-1 relative">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por Nome, WhatsApp ou Account..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchClients(1, searchQuery)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-slate-100 mb-0 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500"
                            />
                        </div>
                        <button
                            onClick={() => fetchClients(1, searchQuery)}
                            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            Buscar
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white/5 text-slate-300 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-5 font-semibold">Cliente</th>
                                <th className="px-6 py-5 font-semibold">Contato</th>
                                <th className="px-6 py-5 font-semibold">Dispositivo</th>
                                <th className="px-6 py-5 font-semibold">Plano</th>
                                <th className="px-6 py-5 font-semibold">Starhome</th>
                                <th className="px-6 py-5 font-semibold">Dias Rest.</th>
                                <th className="px-6 py-5 font-semibold">Status</th>
                                <th className="px-6 py-5 font-semibold">Data Cadastro</th>
                                <th className="px-6 py-5 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {clients.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-white/5 transition-colors">
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
                                            <button
                                                onClick={() => handleLinkStarhome(client)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                                    client.starhome_account
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                        : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-300'
                                                }`}
                                                title={client.starhome_account ? 'Código vinculado' : 'Vincular código Starhome'}
                                            >
                                                {client.starhome_account ? (
                                                    <>
                                                        <Link className="w-3 h-3" />
                                                        {client.starhome_account}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlink className="w-3 h-3" />
                                                        Vincular
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                                                client.days_remaining > 10 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                client.days_remaining > 3 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                                {client.days_remaining} dias
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
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleClientAction(client)}
                                                disabled={updating}
                                                className={`p-2 rounded-lg transition-all duration-200 ${
                                                    client.status === 'Ativo'
                                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                                } disabled:opacity-50`}
                                                title={client.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                                            >
                                                {client.status === 'Ativo' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                        <p className="text-sm text-slate-400">
                            Mostrando {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} de {total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchClients(page - 1)}
                                disabled={page === 1 || loading}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm text-slate-300 px-3">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                onClick={() => fetchClients(page + 1)}
                                disabled={page === totalPages || loading}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};
