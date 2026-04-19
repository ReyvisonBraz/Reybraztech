import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, EyeOff, Trash2, Plus, RefreshCw, AlertTriangle,
  CheckCircle2, Users, Unlock, X, Loader2,
} from 'lucide-react';
import { API_URL } from '../../config/api';

interface PoolEntry {
  id: number;
  app_account: string;
  app_password: string;
  status: 'disponivel' | 'em_uso';
  client_id: number | null;
  client_name: string | null;
  assigned_at: string | null;
  created_at: string;
}

interface PoolStats {
  disponivel: number;
  em_uso: number;
  total: number;
}

export function LoginPool() {
  const [entries, setEntries] = useState<PoolEntry[]>([]);
  const [stats, setStats] = useState<PoolStats>({ disponivel: 0, em_uso: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<{ added: number; errors: string[] } | null>(null);

  const token = () => localStorage.getItem('reyb_token') || '';

  const fetchPool = async () => {
    setLoading(true);
    setError('');
    try {
      const [poolRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/login-pool`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API_URL}/api/admin/login-pool/stats`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      if (!poolRes.ok) throw new Error('Erro ao carregar pool');
      const poolData = await poolRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : { disponivel: 0, em_uso: 0, total: 0 };
      setEntries(poolData.entries || poolData);
      setStats(statsData);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar pool de logins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPool(); }, []);

  const togglePassword = (id: number) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este login do pool?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/login-pool/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || 'Erro ao remover');
        return;
      }
      setEntries(prev => prev.filter(e => e.id !== id));
      setStats(prev => ({ ...prev, disponivel: Math.max(0, prev.disponivel - 1), total: Math.max(0, prev.total - 1) }));
    } finally {
      setDeleting(null);
    }
  };

  const handleAdd = async () => {
    const lines = bulkInput.trim().split('\n').filter(l => l.includes(':'));
    if (!lines.length) return;
    setAdding(true);
    setAddResult(null);
    try {
      const logins = lines.map(line => {
        const idx = line.indexOf(':');
        return { app_account: line.slice(0, idx).trim(), app_password: line.slice(idx + 1).trim() };
      }).filter(l => l.app_account && l.app_password);

      const res = await fetch(`${API_URL}/api/admin/login-pool`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ logins }),
      });
      const data = await res.json();
      setAddResult({ added: data.added || 0, errors: data.errors || [] });
      setBulkInput('');
      fetchPool();
    } catch {
      setAddResult({ added: 0, errors: ['Erro de conexão'] });
    } finally {
      setAdding(false);
    }
  };

  const isLow = stats.disponivel < 3 && stats.total > 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 border border-emerald-500/20"
        >
          <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
            <Unlock className="w-3 h-3 text-emerald-400" /> Disponíveis
          </p>
          <p className="text-3xl font-black text-emerald-400">{stats.disponivel}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-5 border border-cyan-500/20"
        >
          <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-cyan-400" /> Em Uso
          </p>
          <p className="text-3xl font-black text-cyan-400">{stats.em_uso}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 border border-white/10 col-span-2 sm:col-span-1"
        >
          <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Total</p>
          <p className="text-3xl font-black text-white">{stats.total}</p>
        </motion.div>
      </div>

      {/* Alerta pool baixo */}
      <AnimatePresence>
        {isLow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border-2 border-red-500/50 bg-red-500/10 p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-red-300 font-black text-sm">⚠️ Pool baixo! Apenas {stats.disponivel} login(s) disponível(is).</p>
              <p className="text-red-400/70 text-xs">Adicione mais logins para não deixar clientes sem acesso.</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-sm hover:bg-red-500/30 transition-all"
            >
              Adicionar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header da tabela + botões */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <h3 className="text-lg font-black text-white">Logins no Pool</h3>
        <div className="flex gap-2">
          <button
            onClick={fetchPool}
            disabled={loading}
            className="p-2.5 rounded-xl glass border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-shimmer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm border-none"
          >
            <Plus className="w-4 h-4" />
            Adicionar Logins
          </button>
        </div>
      </div>

      {/* Formulário de adição em bulk */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl border border-cyan-500/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-white">Adicionar Logins ao Pool</h4>
                <button onClick={() => { setShowAddForm(false); setAddResult(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Cole um login por linha no formato <code className="text-cyan-400 bg-white/5 px-1 rounded">conta:senha</code></p>
                <textarea
                  value={bulkInput}
                  onChange={e => setBulkInput(e.target.value)}
                  placeholder={'login001:senha123\nlogin002:senha456\nlogin003:senha789'}
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono text-sm focus:border-cyan-500 outline-none transition-all resize-none placeholder:text-slate-600"
                />
              </div>
              {addResult && (
                <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${addResult.added > 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {addResult.added > 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {addResult.added > 0 ? `${addResult.added} login(s) adicionado(s) com sucesso!` : 'Nenhum login adicionado.'}
                  {addResult.errors.length > 0 && <span className="text-slate-400 font-normal ml-1">({addResult.errors.length} erro(s))</span>}
                </div>
              )}
              <button
                onClick={handleAdd}
                disabled={adding || !bulkInput.trim()}
                className="btn-shimmer w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl border-none flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {adding ? 'Adicionando...' : 'Adicionar ao Pool'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="glass rounded-2xl p-8 text-center text-red-400 border border-red-500/20">{error}</div>
      ) : entries.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Unlock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-bold">Nenhum login no pool ainda.</p>
          <p className="text-slate-600 text-sm mt-1">Clique em "Adicionar Logins" para começar.</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {entries.map(entry => (
              <div key={entry.id} className={`glass rounded-2xl p-4 border ${entry.status === 'em_uso' ? 'border-cyan-500/20' : 'border-emerald-500/20'}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg ${entry.status === 'em_uso' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {entry.status === 'em_uso' ? 'Em Uso' : 'Disponível'}
                  </span>
                  {entry.status === 'disponivel' && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      {deleting === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className="text-white font-bold font-mono text-sm mb-1">{entry.app_account}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 font-mono">
                    {visiblePasswords.has(entry.id) ? entry.app_password : '••••••••'}
                  </span>
                  <button onClick={() => togglePassword(entry.id)} className="text-slate-500 hover:text-cyan-400 transition-colors">
                    {visiblePasswords.has(entry.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {entry.client_name && (
                  <p className="text-slate-500 text-xs mt-2">Cliente: <span className="text-slate-300">{entry.client_name}</span></p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden md:block overflow-hidden rounded-2xl glass border border-white/5">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/3">
                  <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Conta</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Senha</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Atribuído em</th>
                  <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4 font-mono text-white font-bold">{entry.app_account}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">
                          {visiblePasswords.has(entry.id) ? entry.app_password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePassword(entry.id)}
                          className="text-slate-500 hover:text-cyan-400 transition-colors"
                        >
                          {visiblePasswords.has(entry.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${entry.status === 'em_uso' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {entry.status === 'em_uso' ? 'Em Uso' : 'Disponível'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{entry.client_name || '—'}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {entry.assigned_at ? new Date(entry.assigned_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {entry.status === 'disponivel' && (
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          {deleting === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
