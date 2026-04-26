import { useEffect, useState, useRef } from 'react';
import {
    Users, AlertTriangle, UserCheck, Smartphone, Mail, ShieldAlert,
    Monitor, ChevronLeft, ChevronRight, Power, PowerOff, X, RefreshCw,
    Link, Unlink, Search, KeyRound, RotateCcw, CheckCircle2,
    XCircle, Bell, TrendingUp, Clock, Gift, BellRing, SendHorizonal,
    Terminal, Minimize2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { LiveConsole } from '../components/admin/LiveConsole';
import { LoginPool } from '../components/admin/LoginPool';
import { ServiceHealthCards } from '../components/admin/ServiceHealthCards';
import { RecentActivity } from '../components/admin/RecentActivity';

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
    app_account: string | null;
    app_password: string | null;
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    expiringSoon: number;
    trials: number;
    newLast24h: number;
}

const PLANS = ['mensal', 'trimestral', 'semestral', 'anual', 'trial'];

// Etapas do modal de sync com mensagens amigáveis
type SyncPhase = 'idle' | 'waking' | 'syncing' | 'polling' | 'done' | 'error';

const SYNC_PHASE_MSG: Record<SyncPhase, { title: string; sub: string }> = {
    idle:    { title: 'Pronto',                    sub: '' },
    waking:  { title: 'Acordando o servidor...',   sub: 'O Render pode demorar até 40s para responder. Aguarde.' },
    syncing: { title: 'Conectando ao Starhome...',  sub: 'Autenticando e iniciando a varredura de clientes.' },
    polling: { title: 'Sincronizando clientes...',  sub: 'Isso pode levar alguns minutos. Não feche a janela.' },
    done:    { title: 'Sincronização concluída!',   sub: 'Os dados dos clientes foram atualizados.' },
    error:   { title: 'Falha na sincronização',     sub: 'Verifique os logs abaixo ou tente novamente.' },
};

export const AdminPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState<Stats | null>(null);

    // Filtros
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [filterExpiring, setFilterExpiring] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [daysToGrant, setDaysToGrant] = useState(30);
    const [updating, setUpdating] = useState(false);

    // Sync
    const [syncing, setSyncing] = useState(false);
    const [syncPhase, setSyncPhase] = useState<SyncPhase>('idle');
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
    const [activeTab, setActiveTab] = useState<'clients' | 'pool'>('clients');
    const [renewStatus, setRenewStatus] = useState<Record<number, 'idle' | 'running' | 'done' | 'error'>>({});
    const [renewModal, setRenewModal] = useState<{ clientId: number; clientName: string; logs: string[]; result: string } | null>(null);

    // Terminal modal/minimizável
    const [showTerminal, setShowTerminal] = useState(false);

    const renewPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const syncLogRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const verified = sessionStorage.getItem('admin_starhome_verified');
        if (verified === 'true') setIsPasswordVerified(true);
    }, []);

    useEffect(() => {
        if (syncLogRef.current) {
            syncLogRef.current.scrollTop = syncLogRef.current.scrollHeight;
        }
    }, [syncLog]);

    const fetchStats = async () => {
        const token = localStorage.getItem('reyb_token');
        try {
            const res = await fetch(`${API_URL}/api/admin/system-stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setStats(await res.json());
        } catch { /* silent */ }
    };

    const verifyPassword = async () => {
        const token = localStorage.getItem('reyb_token');
        if (!token) { navigate('/login'); return; }
        setVerifyingPassword(true);
        setPasswordError('');
        try {
            const response = await fetch(`${API_URL}/api/admin/verify-starhome`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ starhome_password: starhomePassword }),
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
        } catch { setPasswordError('Erro ao verificar senha'); }
        finally { setVerifyingPassword(false); }
    };

    const handleClientAction = (client: Client) => {
        if (!isPasswordVerified) { setShowPasswordModal(true); return; }
        handleToggleStatus(client);
    };

    // Acorda o scraper antes de sincronizar
    const handleWakeAndSync = async () => {
        if (!isPasswordVerified) { setShowPasswordModal(true); return; }
        const token = localStorage.getItem('reyb_token');
        if (!token) { navigate('/login'); return; }

        setSyncing(true);
        setSyncLog([]);
        setSyncPhase('waking');
        setShowSyncModal(true);

        // 1. Acorda o Render
        const addLog = (msg: string) => setSyncLog(prev => [...prev, msg]);
        addLog('Verificando estado do servidor Render...');
        try {
            const healthRes = await fetch(`${API_URL}/api/admin/scraper-health`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: AbortSignal.timeout(40000),
            });
            const health = await healthRes.json() as { online: boolean; sleeping?: boolean; latencyMs: number };
            if (health.online) {
                addLog(`✅ Servidor já está online (${health.latencyMs}ms). Iniciando sync...`);
            } else {
                addLog('⏳ Servidor hibernando. Aguardando acordar...');
                // Segunda tentativa após aguardar
                await new Promise(r => setTimeout(r, 5000));
                const retry = await fetch(`${API_URL}/api/admin/scraper-health`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: AbortSignal.timeout(35000),
                });
                const retryData = await retry.json() as { online: boolean; latencyMs: number };
                if (retryData.online) {
                    addLog(`✅ Servidor acordou (${retryData.latencyMs}ms). Iniciando sync...`);
                } else {
                    addLog('⚠️ Servidor não respondeu completamente, tentando sync mesmo assim...');
                }
            }
        } catch {
            addLog('⚠️ Não foi possível confirmar estado do servidor, tentando sync...');
        }

        // 2. Executa sync
        await runSync(token, addLog);
    };

    const runSync = async (token: string, addLog: (msg: string) => void) => {
        setSyncPhase('syncing');
        addLog('Iniciando sincronização com Starhome...');
        try {
            const response = await fetch(`${API_URL}/api/admin/sync-starhome`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                const err = await response.text();
                addLog(`❌ Erro ao iniciar: ${response.status} — ${err.slice(0, 200)}`);
                setSyncPhase('error');
                return;
            }
            const data = await response.json() as { jobId?: string; mode?: string; success?: boolean; error?: string };

            if (data.mode === 'sync') {
                if (data.success) {
                    addLog('✅ Sincronização concluída!');
                    setSyncPhase('done');
                    fetchClients(page);
                    fetchStats();
                } else {
                    addLog(`❌ Falha: ${data.error || 'Erro desconhecido'}`);
                    setSyncPhase('error');
                }
                return;
            }

            const jobId = data.jobId;
            if (!jobId) {
                addLog('❌ Resposta inesperada do servidor.');
                setSyncPhase('error');
                return;
            }

            addLog(`Job iniciado (ID: ${jobId}). Acompanhando progresso...`);
            setSyncPhase('polling');

            let pollCount = 0;
            const maxPolls = 150;
            let lastLogCount = 0;

            while (pollCount < maxPolls) {
                await new Promise(r => setTimeout(r, 4000));
                pollCount++;
                try {
                    const r = await fetch(`${API_URL}/api/admin/sync-poll/${jobId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        signal: AbortSignal.timeout(8000),
                    });
                    if (!r.ok) { addLog('Job não encontrado (servidor pode ter reiniciado).'); break; }

                    const jobData = await r.json() as {
                        status: string;
                        logs?: string[];
                        result?: { success: boolean; clients?: number; error?: string };
                        dbStats?: { total?: number; active?: number };
                    };

                    // Exibe apenas logs novos
                    if (jobData.logs && jobData.logs.length > lastLogCount) {
                        const newLines = jobData.logs.slice(lastLogCount);
                        lastLogCount = jobData.logs.length;
                        for (const line of newLines) addLog(line);
                    }

                    if (jobData.status === 'done') {
                        const count = jobData.result?.clients ?? 0;
                        addLog(`✅ ${count} clientes sincronizados com sucesso.`);
                        if (jobData.dbStats) addLog(`📊 Base: ${jobData.dbStats.total} total · ${jobData.dbStats.active} ativos`);
                        setSyncPhase('done');
                        fetchClients(page);
                        fetchStats();
                        return;
                    }
                    if (jobData.status === 'error') {
                        addLog(`❌ ${jobData.result?.error || 'Erro desconhecido'}`);
                        setSyncPhase('error');
                        return;
                    }

                    // Mensagem de progresso a cada minuto
                    if (pollCount % 15 === 0) {
                        addLog(`⏳ Ainda em execução (${Math.round(pollCount * 4 / 60)} min)...`);
                    }
                } catch {
                    addLog(`Sem resposta na tentativa ${pollCount}, tentando novamente...`);
                }
            }
            addLog('⏱️ Tempo limite atingido. Verifique pelo Telegram.');
            setSyncPhase('error');
        } catch (err: any) {
            addLog(`❌ Erro: ${err.message}`);
            setSyncPhase('error');
        } finally {
            setSyncing(false);
        }
    };

    const buildQuery = (pageNum: number, searchStr: string, status: string, plan: string, expiring: boolean) => {
        const params = new URLSearchParams({ page: String(pageNum), limit: '20', search: searchStr });
        if (status) params.set('status', status);
        if (plan) params.set('plan', plan);
        if (expiring) params.set('expiring', 'true');
        return params.toString();
    };

    const fetchClients = async (
        pageNum: number,
        searchStr: string = searchQuery,
        status: string = filterStatus,
        plan: string = filterPlan,
        expiring: boolean = filterExpiring,
    ) => {
        const token = localStorage.getItem('reyb_token');
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        try {
            const qs = buildQuery(pageNum, searchStr, status, plan, expiring);
            const response = await fetch(`${API_URL}/api/admin/clients?${qs}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.status === 403 || response.status === 401) {
                setError('Acesso negado. Você não tem permissões de administrador.');
                setLoading(false);
                return;
            }
            if (!response.ok) throw new Error('Falha ao carregar clientes');
            const data = await response.json();
            setClients(data.clients);
            setTotal(data.total);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } catch { setError('Erro de conexão ao carregar dados do servidor.'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchClients(1);
        fetchStats();
    }, [navigate]);

    const applyFilter = (status: string, plan: string, expiring: boolean) => {
        setFilterStatus(status);
        setFilterPlan(plan);
        setFilterExpiring(expiring);
        fetchClients(1, searchQuery, status, plan, expiring);
    };

    const handleToggleStatus = async (client: Client) => {
        const newStatus = client.status === 'Ativo' ? 'Inativo' : 'Ativo';
        if (newStatus === 'Inativo') {
            const token = localStorage.getItem('reyb_token');
            setUpdating(true);
            try {
                await fetch(`${API_URL}/api/admin/clients/${client.id}/status`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Inativo', days_remaining: 0 }),
                });
                setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: 'Inativo', days_remaining: 0 } : c));
                fetchStats();
            } catch (err) { console.error(err); }
            finally { setUpdating(false); }
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
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Ativo', days_remaining: daysToGrant }),
            });
            setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, status: 'Ativo', days_remaining: daysToGrant } : c));
            setShowModal(false);
            setSelectedClient(null);
            setDaysToGrant(30);
            fetchStats();
        } catch (err) { console.error(err); }
        finally { setUpdating(false); }
    };

    const handleLinkStarhome = (client: Client) => {
        if (!isPasswordVerified) { setShowPasswordModal(true); return; }
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
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ starhome_account: starhomeCode.trim() }),
            });
            if (response.ok) {
                setClients(prev => prev.map(c => c.id === linkClient.id ? { ...c, starhome_account: starhomeCode.trim() } : c));
                setShowLinkModal(false);
                setLinkClient(null);
                setStarhomeCode('');
            }
        } catch (err) { console.error(err); }
        finally { setLinking(false); }
    };

    const handleRenewClient = async (client: Client) => {
        if (!isPasswordVerified) { setShowPasswordModal(true); return; }
        const token = localStorage.getItem('reyb_token');
        if (!token) { navigate('/login'); return; }
        setRenewStatus(prev => ({ ...prev, [client.id]: 'running' }));
        setRenewModal({ clientId: client.id, clientName: client.name, logs: ['Iniciando renovação...'], result: '' });
        try {
            const res = await fetch(`${API_URL}/api/admin/renew-client`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName: client.name }),
            });
            const data = await res.json() as { jobId?: string; waking?: boolean; error?: string };
            if (data.waking) {
                setRenewModal(prev => prev ? { ...prev, logs: [...prev.logs, '⏳ Scraper hibernando — acorde o servidor primeiro.'] } : prev);
                setRenewStatus(prev => ({ ...prev, [client.id]: 'error' }));
                return;
            }
            if (!res.ok || !data.jobId) {
                setRenewModal(prev => prev ? { ...prev, logs: [...prev.logs, `❌ ${data.error || 'Erro ao iniciar'}`], result: 'error' } : prev);
                setRenewStatus(prev => ({ ...prev, [client.id]: 'error' }));
                return;
            }
            const jobId = data.jobId;
            setRenewModal(prev => prev ? { ...prev, logs: [...prev.logs, `Processando renovação...`] } : prev);
            let polls = 0;
            const maxPolls = 60;
            if (renewPollRef.current) clearInterval(renewPollRef.current);
            renewPollRef.current = setInterval(async () => {
                polls++;
                if (polls > maxPolls) {
                    clearInterval(renewPollRef.current!);
                    setRenewStatus(prev => ({ ...prev, [client.id]: 'error' }));
                    setRenewModal(prev => prev ? { ...prev, logs: [...prev.logs, '⏱️ Tempo limite. Verifique pelo Telegram.'], result: 'error' } : prev);
                    return;
                }
                try {
                    const pr = await fetch(`${API_URL}/api/admin/sync-poll/${jobId}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        signal: AbortSignal.timeout(5000),
                    });
                    if (!pr.ok) return;
                    const pd = await pr.json() as { status: string; logs?: string[]; result?: { success: boolean; account?: string; clientName?: string; error?: string } };
                    if (pd.logs && pd.logs.length > 0) setRenewModal(prev => prev ? { ...prev, logs: [...prev.logs, ...pd.logs!.slice(-3)] } : prev);
                    if (pd.status === 'done') {
                        clearInterval(renewPollRef.current!);
                        const success = pd.result?.success;
                        setRenewStatus(prev => ({ ...prev, [client.id]: success ? 'done' : 'error' }));
                        const msg = success
                            ? `✅ Renovado com sucesso — ${pd.result?.clientName || client.name}`
                            : `❌ Falha: ${pd.result?.error || 'Erro desconhecido'}`;
                        setRenewModal(prev => prev ? { ...prev, logs: [...prev.logs, msg], result: success ? 'done' : 'error' } : prev);
                        if (success) fetchClients(page);
                        setTimeout(() => setRenewStatus(prev => ({ ...prev, [client.id]: 'idle' })), 5000);
                    } else if (pd.status === 'error') {
                        clearInterval(renewPollRef.current!);
                        setRenewStatus(prev => ({ ...prev, [client.id]: 'error' }));
                        setRenewModal(prev => prev ? { ...prev, logs: [...prev.logs, `❌ ${pd.result?.error || 'Erro'}`], result: 'error' } : prev);
                        setTimeout(() => setRenewStatus(prev => ({ ...prev, [client.id]: 'idle' })), 5000);
                    }
                } catch { /* timeout de rede, tenta novamente */ }
            }, 2000);
        } catch (err: any) {
            setRenewStatus(prev => ({ ...prev, [client.id]: 'error' }));
            setRenewModal(prev => prev ? { ...prev, logs: [...prev.logs, `❌ ${err.message}`], result: 'error' } : prev);
        }
    };

    const handleChargeClient = (client: Client) => {
        const days = client.days_remaining;
        const msg = days <= 0
            ? `Olá ${client.name}! 👋\n\nSeu plano *${client.plan}* expirou. Renove agora para continuar usando nossos serviços!\n\nFale comigo para renovar. 🚀`
            : `Olá ${client.name}! 👋\n\nSeu plano *${client.plan}* vence em *${days} dia${days === 1 ? '' : 's'}*. Renove com antecedência e não perca o acesso!\n\nFale comigo para renovar. 🚀`;
        const number = client.whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleSendCredentials = (client: Client) => {
        if (!client.app_account || !client.app_password) {
            alert('Este cliente não possui credenciais cadastradas.');
            return;
        }
        const msg = `Olá ${client.name}! 👋\n\nSeguem suas credenciais de acesso:\n\n👤 *Usuário:* ${client.app_account}\n🔐 *Senha:* ${client.app_password}\n\nGuarde em local seguro e não compartilhe com ninguém. 🔒`;
        const number = client.whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (loading && clients.length === 0) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="glass border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
                    <h2 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">Acesso Bloqueado</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>
                    <button onClick={() => navigate('/dashboard')}
                        className="btn-shimmer w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-2xl transition-all border-none">
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const phaseMsg = SYNC_PHASE_MSG[syncPhase];

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

            {/* ── Modais ──────────────────────────────────────────────────── */}

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-yellow-500/30 rounded-3xl p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-yellow-400" /> Verificação Admin
                            </h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-slate-300 mb-4">Digite a senha do painel Starhome para continuar.</p>
                        <input type="password" value={starhomePassword}
                            onChange={e => setStarhomePassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && verifyPassword()}
                            placeholder="Senha do Starhome"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 mb-2 focus:outline-none focus:border-yellow-500" />
                        {passwordError && <p className="text-red-400 text-sm mb-4">{passwordError}</p>}
                        <button onClick={verifyPassword} disabled={verifyingPassword || !starhomePassword}
                            className="btn-shimmer w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-4 rounded-2xl border-none disabled:opacity-50">
                            {verifyingPassword ? 'Verificando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Sync — com fases e mensagens claras */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full flex flex-col gap-4">
                        {/* Cabeçalho com fase */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                    <RefreshCw className={`w-5 h-5 text-purple-400 ${syncing ? 'animate-spin' : ''}`} />
                                    {phaseMsg.title}
                                </h3>
                                {phaseMsg.sub && <p className="text-sm text-slate-400 mt-0.5">{phaseMsg.sub}</p>}
                            </div>
                            <button onClick={() => setShowSyncModal(false)} disabled={syncing}
                                className="text-slate-500 hover:text-slate-300 disabled:opacity-30 shrink-0 mt-0.5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Barra de progresso visual */}
                        {syncing && (
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: syncPhase === 'waking' ? '20%' : syncPhase === 'syncing' ? '45%' : '75%' }} />
                            </div>
                        )}
                        {syncPhase === 'done' && (
                            <div className="w-full h-1 bg-emerald-500/40 rounded-full">
                                <div className="h-full w-full bg-emerald-500 rounded-full" />
                            </div>
                        )}

                        {/* Log stream */}
                        <div ref={syncLogRef} className="bg-black/40 rounded-xl p-3 font-mono text-xs text-slate-300 max-h-52 overflow-y-auto space-y-0.5">
                            {syncLog.length === 0
                                ? <span className="text-slate-600">Aguardando...</span>
                                : syncLog.map((line, i) => {
                                    const color = line.startsWith('✅') ? 'text-emerald-400'
                                        : line.startsWith('❌') ? 'text-red-400'
                                        : line.startsWith('⚠️') || line.startsWith('⏳') ? 'text-yellow-400'
                                        : line.startsWith('📊') ? 'text-cyan-400'
                                        : 'text-slate-300';
                                    return <div key={i} className={color}>{line}</div>;
                                })}
                        </div>

                        <button onClick={() => setShowSyncModal(false)} disabled={syncing}
                            className={`btn-shimmer w-full text-white font-bold py-3 px-4 rounded-2xl border-none disabled:opacity-50 bg-gradient-to-r ${
                                syncPhase === 'done' ? 'from-emerald-500 to-cyan-500'
                                : syncPhase === 'error' ? 'from-red-500 to-rose-600'
                                : 'from-slate-600 to-slate-700'
                            }`}>
                            {syncing ? 'Aguarde...' : syncPhase === 'done' ? 'Fechar' : 'Fechar'}
                        </button>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100">Ativar Cliente</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-slate-300 mb-4">Quantos dias deseja conceder a <strong>{selectedClient?.name}</strong>?</p>
                        <input type="number" value={daysToGrant}
                            onChange={e => setDaysToGrant(parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 mb-4 focus:outline-none focus:border-cyan-500" min="1" />
                        <button onClick={confirmActivation} disabled={updating || daysToGrant < 1}
                            className="btn-shimmer w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-2xl border-none disabled:opacity-50">
                            {updating ? 'Ativando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}

            {showLinkModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <Link className="w-5 h-5 text-cyan-400" /> Vincular Starhome
                            </h3>
                            <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-slate-300 mb-4">Vincular código ao cliente: <strong>{linkClient?.name}</strong></p>
                        <input type="text" value={starhomeCode}
                            onChange={e => setStarhomeCode(e.target.value)}
                            placeholder="Código Starhome (ex: gqbdjd)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 mb-4 focus:outline-none focus:border-cyan-500" />
                        <button onClick={confirmLinkStarhome} disabled={linking || !starhomeCode.trim()}
                            className="btn-shimmer w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-2xl border-none disabled:opacity-50">
                            {linking ? 'Vinculando...' : 'Vincular'}
                        </button>
                    </div>
                </div>
            )}

            {renewModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="glass border border-orange-500/30 rounded-3xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <RotateCcw className={`w-5 h-5 text-orange-400 ${renewStatus[renewModal.clientId] === 'running' ? 'animate-spin' : ''}`} />
                                Renovar: {renewModal.clientName}
                            </h3>
                            <button onClick={() => { setRenewModal(null); if (renewPollRef.current) clearInterval(renewPollRef.current); }}
                                disabled={renewStatus[renewModal.clientId] === 'running'}
                                className="text-slate-400 hover:text-slate-200 disabled:opacity-30"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-4 font-mono text-sm text-slate-300 max-h-[50vh] space-y-1">
                            {renewModal.logs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                        {renewModal.result && (
                            <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${
                                renewModal.result === 'done' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                                {renewModal.result === 'done' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                                {renewModal.result === 'done' ? 'Renovação concluída!' : 'Falha na renovação. Verifique os logs.'}
                            </div>
                        )}
                        <button onClick={() => { setRenewModal(null); if (renewPollRef.current) clearInterval(renewPollRef.current); }}
                            disabled={renewStatus[renewModal.clientId] === 'running'}
                            className="mt-4 btn-shimmer w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-4 rounded-2xl border-none disabled:opacity-50">
                            {renewStatus[renewModal.clientId] === 'running' ? 'Aguarde...' : 'Fechar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Terminal modal flutuante */}
            {showTerminal && (
                <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="w-full sm:max-w-4xl sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/10 bg-black/90 backdrop-blur-xl">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5 shrink-0">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-bold text-slate-300">Console Admin</span>
                            </div>
                            <button onClick={() => setShowTerminal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                                <Minimize2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden" style={{ minHeight: 400, maxHeight: '70vh' }}>
                            <LiveConsole />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Users className="w-7 h-7 text-cyan-400" />
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gradient tracking-tight">Painel Admin</h1>
                    </div>
                    <p className="text-slate-400 text-sm">Gerencie clientes, serviços e sincronização Starhome.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowTerminal(true)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-2.5 px-4 rounded-2xl border border-white/10 transition-all text-sm">
                        <Terminal className="w-4 h-4 text-emerald-400" /> Console
                    </button>
                    <button onClick={handleWakeAndSync} disabled={syncing}
                        className="btn-shimmer flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2.5 px-4 rounded-2xl border-none disabled:opacity-50 text-sm">
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Sincronizando...' : 'Acordar + Sincronizar'}
                    </button>
                </div>
            </div>

            {/* ── Tab Bar ───────────────────────────────────────────────── */}
            <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-2xl w-fit">
                <button onClick={() => setActiveTab('clients')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'clients' ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Users className="w-4 h-4" /> Clientes
                </button>
                <button onClick={() => setActiveTab('pool')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'pool' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                    <KeyRound className="w-4 h-4" /> Pool de Logins
                </button>
            </div>

            {/* ── Tab Pool ──────────────────────────────────────────────── */}
            {activeTab === 'pool' ? <LoginPool /> : (

            <div className="space-y-6">
                {/* Métricas clicáveis */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'Total',      value: stats?.total ?? 0,        icon: Users,         color: 'border-white/5 text-slate-200',         filter: () => applyFilter('', '', false) },
                        { label: 'Ativos',     value: stats?.active ?? 0,       icon: UserCheck,     color: 'border-emerald-500/20 text-emerald-400', filter: () => applyFilter('Ativo', filterPlan, false) },
                        { label: 'Inativos',   value: stats?.inactive ?? 0,     icon: AlertTriangle, color: 'border-red-500/20 text-red-400',         filter: () => applyFilter('Inativo', filterPlan, false) },
                        { label: 'Venc. 7d',   value: stats?.expiringSoon ?? 0, icon: Clock,         color: 'border-yellow-500/20 text-yellow-400',   filter: () => applyFilter('Ativo', '', false) },
                        { label: 'Em Trial',   value: stats?.trials ?? 0,       icon: Gift,          color: 'border-purple-500/20 text-purple-400',   filter: () => applyFilter('', 'trial', false) },
                        { label: 'Novos 24h',  value: stats?.newLast24h ?? 0,   icon: TrendingUp,    color: 'border-cyan-500/20 text-cyan-400',       filter: () => applyFilter('', '', false) },
                    ].map(({ label, value, icon: Icon, color, filter }) => (
                        <button key={label} onClick={filter}
                            className={`glass rounded-2xl p-4 border flex flex-col gap-1 text-left hover:brightness-110 transition-all ${color}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
                                <Icon className="w-3.5 h-3.5 opacity-50" />
                            </div>
                            <p className="text-2xl font-black">{value}</p>
                        </button>
                    ))}
                </div>

                {/* Linha: Saúde dos Serviços + Atividade Recente */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="glass rounded-3xl p-5 border border-white/5">
                        <ServiceHealthCards onWakeAndSync={handleWakeAndSync} syncing={syncing} />
                    </div>
                    <div className="glass rounded-3xl p-5 border border-white/5">
                        <RecentActivity />
                    </div>
                </div>

                {/* Tabela de clientes */}
                <div className="glass rounded-3xl overflow-hidden">
                    {/* Barra de busca e filtros */}
                    <div className="p-4 border-b border-white/5 bg-white/5 space-y-3">
                        <div className="flex gap-3 items-center">
                            <div className="flex-1 relative">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Buscar por Nome, WhatsApp ou Account..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && fetchClients(1, searchQuery)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500" />
                            </div>
                            <button onClick={() => fetchClients(1, searchQuery)}
                                className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 font-bold py-3 px-5 rounded-xl transition-all">
                                Buscar
                            </button>
                        </div>

                        {/* Filtros rápidos */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Status:</span>
                            {(['', 'Ativo', 'Inativo'] as const).map(s => (
                                <button key={s || 'todos'} onClick={() => applyFilter(s, filterPlan, filterExpiring)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                                        filterStatus === s
                                            ? s === 'Ativo' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                            : s === 'Inativo' ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                                    {s === '' ? 'Todos' : s}
                                </button>
                            ))}

                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-2 mr-1">Plano:</span>
                            {(['', ...PLANS] as const).map(p => (
                                <button key={p || 'todos'} onClick={() => applyFilter(filterStatus, p, filterExpiring)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all capitalize ${
                                        filterPlan === p ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                                    {p === '' ? 'Todos' : p}
                                </button>
                            ))}

                            <button onClick={() => applyFilter(filterStatus, filterPlan, !filterExpiring)}
                                className={`ml-2 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                                    filterExpiring ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                                <BellRing className="w-3 h-3" /> Venc. 3 dias
                            </button>

                            {(filterStatus || filterPlan || filterExpiring) && (
                                <button onClick={() => applyFilter('', '', false)}
                                    className="ml-auto text-xs text-slate-500 hover:text-slate-300 underline">
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile: cards */}
                    <div className="block md:hidden divide-y divide-white/5">
                        {clients.length === 0 ? (
                            <div className="px-6 py-12 text-center text-slate-500">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                Nenhum cliente encontrado.
                            </div>
                        ) : clients.map(client => {
                            const isExpiringSoon = client.days_remaining <= 3 && client.days_remaining >= 0 && client.status === 'Ativo';
                            return (
                                <div key={client.id} className={`p-4 ${isExpiringSoon ? 'bg-yellow-500/5' : ''}`}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border font-bold text-sm ${
                                                isExpiringSoon ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                                                    : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/20 text-cyan-400'}`}>
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-slate-200 font-semibold text-sm truncate">{client.name}</p>
                                                <p className="text-slate-500 text-xs">{client.whatsapp}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                client.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{client.status}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                client.days_remaining > 10 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : client.days_remaining > 3 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{client.days_remaining}d</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{client.plan}</span>
                                        {client.device && <span className="bg-white/5 text-slate-400 border border-white/10 px-2 py-0.5 rounded text-[10px] capitalize">{client.device}</span>}
                                        {isExpiringSoon && (
                                            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                                <Bell className="w-2.5 h-2.5" /> Vence em breve
                                            </span>
                                        )}
                                        {client.app_account && (
                                            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                                <KeyRound className="w-2.5 h-2.5" /> {client.app_account}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button onClick={() => handleLinkStarhome(client)}
                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                client.starhome_account ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                            {client.starhome_account ? <><Link className="w-3 h-3" />{client.starhome_account}</> : <><Unlink className="w-3 h-3" />Vincular</>}
                                        </button>
                                        <button onClick={() => handleClientAction(client)} disabled={updating}
                                            className={`p-2 rounded-lg transition-all disabled:opacity-50 ${client.status === 'Ativo' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}
                                            title={client.status === 'Ativo' ? 'Desativar' : 'Ativar'}>
                                            {client.status === 'Ativo' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => handleRenewClient(client)} disabled={renewStatus[client.id] === 'running'}
                                            className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                                renewStatus[client.id] === 'done' ? 'bg-emerald-500/10 text-emerald-400'
                                                    : renewStatus[client.id] === 'error' ? 'bg-red-500/10 text-red-400'
                                                    : 'bg-orange-500/10 text-orange-400'}`} title="Renovar">
                                            {renewStatus[client.id] === 'running' ? <RotateCcw className="w-4 h-4 animate-spin" />
                                                : renewStatus[client.id] === 'done' ? <CheckCircle2 className="w-4 h-4" />
                                                : renewStatus[client.id] === 'error' ? <XCircle className="w-4 h-4" />
                                                : <RotateCcw className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => handleChargeClient(client)} disabled={false}
                                            className={`p-2 rounded-lg transition-all ${isExpiringSoon ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40' : 'bg-white/5 text-slate-400'}`}
                                            title="Cobrar via WhatsApp">
                                            <Bell className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleSendCredentials(client)} disabled={!client.app_account}
                                            className={`p-2 rounded-lg transition-all disabled:opacity-40 ${client.app_account ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-slate-600'}`}
                                            title="Enviar credenciais via WhatsApp">
                                            <SendHorizonal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop: tabela */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white/5 text-slate-300 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Cliente</th>
                                    <th className="px-6 py-4 font-semibold">Contato</th>
                                    <th className="px-6 py-4 font-semibold">Dispositivo</th>
                                    <th className="px-6 py-4 font-semibold">Starhome</th>
                                    <th className="px-6 py-4 font-semibold">Dias Rest.</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Cadastro</th>
                                    <th className="px-6 py-4 font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {clients.length === 0 ? (
                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                        Nenhum cliente encontrado.
                                    </td></tr>
                                ) : clients.map(client => {
                                    const isExpiringSoon = client.days_remaining <= 3 && client.days_remaining >= 0 && client.status === 'Ativo';
                                    return (
                                        <tr key={client.id} className={`transition-colors ${isExpiringSoon ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-white/5'}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-sm shrink-0 ${
                                                        isExpiringSoon ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                                                            : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/20 text-cyan-400'}`}>
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-200 font-medium flex items-center gap-1.5 flex-wrap">
                                                            {client.name}
                                                            {client.is_admin && <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border border-yellow-500/20">Admin</span>}
                                                            {isExpiringSoon && <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-500/20 flex items-center gap-1"><Bell className="w-2.5 h-2.5" />Vence em breve</span>}
                                                        </p>
                                                        <p className="text-slate-500 text-xs">ID {client.id} · {client.plan}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-300"><Smartphone className="w-3.5 h-3.5 text-slate-500" />{client.whatsapp}</div>
                                                    {client.email && <div className="flex items-center gap-2 text-slate-400 text-xs"><Mail className="w-3 h-3 text-slate-500" />{client.email}</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Monitor className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="capitalize">{client.device || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleLinkStarhome(client)}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                                                        client.starhome_account ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                                                    {client.starhome_account ? <><Link className="w-3 h-3" />{client.starhome_account}</> : <><Unlink className="w-3 h-3" />Vincular</>}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                                                    client.days_remaining > 10 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : client.days_remaining > 3 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {client.days_remaining} dias
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                                                    client.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {client.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-xs">
                                                {new Date(client.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => handleClientAction(client)} disabled={updating}
                                                        className={`p-2 rounded-lg transition-all disabled:opacity-50 ${client.status === 'Ativo' ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'}`}
                                                        title={client.status === 'Ativo' ? 'Desativar' : 'Ativar'}>
                                                        {client.status === 'Ativo' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => handleRenewClient(client)} disabled={renewStatus[client.id] === 'running'}
                                                        className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                                            renewStatus[client.id] === 'done' ? 'bg-emerald-500/10 text-emerald-400'
                                                                : renewStatus[client.id] === 'error' ? 'bg-red-500/10 text-red-400'
                                                                : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400'}`}
                                                        title="Renovar no Starhome">
                                                        {renewStatus[client.id] === 'running' ? <RotateCcw className="w-4 h-4 animate-spin" />
                                                            : renewStatus[client.id] === 'done' ? <CheckCircle2 className="w-4 h-4" />
                                                            : renewStatus[client.id] === 'error' ? <XCircle className="w-4 h-4" />
                                                            : <RotateCcw className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => handleChargeClient(client)}
                                                        className={`p-2 rounded-lg transition-all ${isExpiringSoon ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 ring-1 ring-yellow-500/40' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                                                        title="Cobrar via WhatsApp">
                                                        <Bell className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleSendCredentials(client)} disabled={!client.app_account}
                                                        className={`p-2 rounded-lg transition-all disabled:opacity-40 ${client.app_account ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-600'}`}
                                                        title={client.app_account ? 'Enviar credenciais via WhatsApp' : 'Sem credenciais'}>
                                                        <SendHorizonal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                            <p className="text-sm text-slate-400">
                                Mostrando {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} de {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => fetchClients(page - 1)} disabled={page === 1 || loading}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-50 transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-slate-300 px-2">Pág. {page} / {totalPages}</span>
                                <button onClick={() => fetchClients(page + 1)} disabled={page === totalPages || loading}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-50 transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>
    );
};
