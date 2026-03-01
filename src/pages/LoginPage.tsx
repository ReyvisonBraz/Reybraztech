import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:3001';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || 'Erro ao fazer login.');
                return;
            }

            // Salvar token JWT no localStorage
            localStorage.setItem('reyb_token', data.token);
            localStorage.setItem('reyb_user', JSON.stringify(data.user));

            // Redirecionar para o dashboard
            navigate('/dashboard');

        } catch {
            setErrorMsg('Não foi possível conectar ao servidor. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent pt-20 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glow-card neon-border-cyan p-6 md:p-12 rounded-3xl md:rounded-[3rem] max-w-md w-full text-center border-2"
            >
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Área do <span className="text-gradient">Cliente</span></h2>
                <p className="text-slate-400 mb-10">Acesse sua conta para gerenciar sua assinatura.</p>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            required
                            type="email"
                            placeholder="Seu e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            required
                            type="password"
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                        />
                    </div>

                    {/* Mensagem de erro */}
                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {errorMsg}
                        </motion.div>
                    )}

                    <button
                        disabled={loading}
                        className="glow-button w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400 disabled:opacity-60"
                    >
                        {loading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                            />
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Entrar na Conta
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5">
                    <p className="text-slate-500 mb-4">Ainda não tem uma conta?</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center text-cyan-400 font-bold hover:text-cyan-300 transition-colors group"
                    >
                        <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        Cadastre-se Agora
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
