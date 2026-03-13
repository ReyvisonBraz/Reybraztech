import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Smartphone, MessageSquare, CheckCircle2, Mail, Lock, AlertCircle, ExternalLink } from 'lucide-react';

const API_URL = 'http://localhost:3001';
const WHATSAPP_BOT_NUMBER = '559191715764';
const WHATSAPP_ACTIVATION_MESSAGE = 'Olá! Quero solicitar meu código de verificação 🔐';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    device: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const whatsappLink = `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${encodeURIComponent(WHATSAPP_ACTIVATION_MESSAGE)}`;

  const handleNext = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Passo 1 → Passo 2 (ativação WhatsApp)
    if (step === 1) {
      setStep(2);
      return;
    }

    // Passo 2 → Passo 3 (não chega aqui via form submit, é via botão direto)

    // Passo 3 → Finalizar cadastro
    if (step === 3) {
      if (formData.password.length < 6) {
        setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            whatsapp: formData.whatsapp,
            device: formData.device,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrorMsg(data.error || 'Erro ao cadastrar.');
          return;
        }

        // Sucesso → ir para login com mensagem
        navigate('/login?registered=true');

      } catch {
        setErrorMsg('Não foi possível conectar ao servidor. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-20 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link to="/login" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Já tem uma conta? Entrar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glow-card neon-border-cyan p-6 md:p-10 rounded-3xl md:rounded-[3rem] relative overflow-hidden border-2"
        >
          {/* Barra de progresso */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <motion.div
              className="h-full bg-cyan-500"
              initial={{ width: '33%' }}
              animate={{ width: progressWidth }}
            />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Criar <span className="text-gradient">Conta</span></h2>
            <p className="text-slate-400">
              {step === 1 && 'Junte-se à Reybraz Tech hoje.'}
              {step === 2 && 'Ative seu WhatsApp para receber códigos.'}
              {step === 3 && 'Quase lá! Crie sua senha.'}
            </p>
          </div>

          <form onSubmit={handleNext} className="space-y-6">
            {/* ─── PASSO 1: Nome, Dispositivo e WhatsApp ─── */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="text"
                    placeholder="Nome"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="text"
                    placeholder="Sobrenome"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <select
                    required
                    className="w-full p-4 pl-12 bg-slate-900 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all appearance-none"
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  >
                    <option value="" disabled>Selecione seu dispositivo</option>
                    <option value="tvbox">TV Box / Fire Stick</option>
                    <option value="android">Celular Android</option>
                    <option value="smarttv">Smart TV Android</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="tel"
                    placeholder="WhatsApp (com DDD)"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="glow-button w-full py-4 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(14,165,233,0.5)] border-2 border-cyan-400"
                >
                  Próximo Passo
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* ─── PASSO 2: Ativação WhatsApp ─── */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                {/* Card informativo */}
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-emerald-400">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-emerald-400 font-bold text-base mb-1">Ative seu WhatsApp</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Para receber códigos de verificação, envie uma mensagem para nosso bot. 
                        Clique no botão abaixo — a mensagem já vai pronta, é só apertar <strong className="text-emerald-300">Enviar</strong>!
                      </p>
                    </div>
                  </div>

                  {/* Botão WhatsApp verde */}
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWhatsappSent(true)}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Enviar mensagem no WhatsApp
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Botão "Já enviei" */}
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!whatsappSent}
                  className={`glow-button w-full py-4 font-black rounded-2xl flex items-center justify-center gap-2 border-2 transition-all ${
                    whatsappSent
                      ? 'bg-primary text-white shadow-[0_0_30px_rgba(14,165,233,0.5)] border-cyan-400'
                      : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                  }`}
                >
                  {whatsappSent ? (
                    <>
                      Já enviei a mensagem
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  ) : (
                    <span className="text-sm">Clique no botão verde acima primeiro</span>
                  )}
                </button>

                {/* Link para pular */}
                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline"
                  >
                    Pular esta etapa (não recomendado)
                  </button>
                </p>
              </motion.div>
            )}

            {/* ─── PASSO 3: E-mail e Senha ─── */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="E-mail (opcional)"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="password"
                    placeholder="Crie uma senha (mín. 6 caracteres)"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    required
                    type="password"
                    placeholder="Confirme a senha"
                    className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-cyan-500 outline-none transition-all"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
                <p className="text-xs text-slate-500 text-center px-4">
                  Use seu WhatsApp e senha para acessar o painel. E-mail é opcional.
                </p>

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
                  type="submit"
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
                      Finalizar Cadastro
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </form>

          {/* Indicadores de passo */}
          <div className="mt-8 flex justify-center gap-2">
            <div className={`h-1.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-cyan-500' : 'bg-white/10'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-emerald-500' : 'bg-white/10'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-all ${step === 3 ? 'bg-cyan-500' : 'bg-white/10'}`} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
