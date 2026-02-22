import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // FUNÇÃO DE LOGIN REESTRUTURADA PARA O FUTURO
    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Quando você tiver o banco de dados e a API prontos, o código ficará parecido com isto:
            /*
            const response = await fetch('http://sua-api.com/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });
            
            if (!response.ok) {
              throw new Error('Falha no login');
            }
            
            const data = await response.json();
            // Salvar token, etc.
            // localStorage.setItem('token', data.token);
            */

            // Por enquanto, usaremos este Timeout como "simulador" da rede:
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Se deu tudo certo, enviamos o usuário para o dashboard
            navigate('/dashboard');

        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("Erro ao entrar. Verifique suas credenciais e tente novamente.");
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

                    <button
                        disabled={loading}
                        className="glow-button w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400"
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
