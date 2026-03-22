import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { API_URL } from '../config/api';

const WHATSAPP_BOT_NUMBER = '559191715764';
const WHATSAPP_ACTIVATION_MESSAGE = 'Olá! Quero solicitar meu código de verificação 🔐';

interface PasswordRecoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PasswordRecoveryModal = ({ isOpen, onClose }: PasswordRecoveryModalProps) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [whatsapp, setWhatsapp] = useState('');
    const [countryCode, setCountryCode] = useState('55');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [whatsappSent, setWhatsappSent] = useState(false);

    const whatsappLink = `https://wa.me/${WHATSAPP_BOT_NUMBER}?text=${encodeURIComponent(WHATSAPP_ACTIVATION_MESSAGE)}`;

    const resetState = () => {
        setStep(1);
        setWhatsapp('');
        setToken('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(false);
        setWhatsappSent(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const fullNumber = `${countryCode}${whatsapp.replace(/\D/g, '')}`;
            const response = await fetch(`${API_URL}/api/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whatsapp: fullNumber, type: 'reset_password' }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || 'Erro ao enviar código.');
                return;
            }

            setStep(2);
        } catch {
            setErrorMsg('Não foi possível conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const fullNumber = `${countryCode}${whatsapp.replace(/\D/g, '')}`;
            const response = await fetch(`${API_URL}/api/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whatsapp: fullNumber, token, type: 'reset_password' }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || 'Código inválido.');
                return;
            }

            setStep(2); // Vai pro passo 3
            setStep(3);
        } catch {
            setErrorMsg('Erro ao verificar código.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg('As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const fullNumber = `${countryCode}${whatsapp.replace(/\D/g, '')}`;
            const response = await fetch(`${API_URL}/api/otp/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whatsapp: fullNumber, token, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.error || 'Erro ao redefinir senha.');
                return;
            }

            setSuccessMsg('Senha alterada com sucesso! Você já pode entrar.');

            setTimeout(() => {
                handleClose();
            }, 2500);

        } catch {
            setErrorMsg('Erro ao redefinir senha.');
        } finally {
            setLoading(false);
        }
    };

    const stepHeaders = {
        1: { title: "Ativar Recuperação", desc: "Abra o WhatsApp abaixo para inciar" },
        2: { title: "Verificar Código", desc: `Código enviado para +${countryCode} ${whatsapp}` },
        3: { title: "Nova Senha", desc: "Crie sua nova senha de acesso" }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        className="relative w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 overflow-hidden"
                    >
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full filter blur-[80px] -z-1" />
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full filter blur-[80px] -z-1" />

                        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all">
                            <X className="size-5" />
                        </button>

                        {successMsg ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center py-6">
                                <div className="size-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                                    <CheckCircle2 className="size-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Sucesso!</h3>
                                <p className="text-slate-300 text-sm">{successMsg}</p>
                            </motion.div>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-black text-white">{stepHeaders[step].title}</h3>
                                    <p className="text-slate-400 text-sm mt-1">{stepHeaders[step].desc}</p>
                                </div>

                                {step === 1 && (
                                    <form onSubmit={handleSendOtp} className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                                            <p className="text-emerald-300/90 text-xs font-bold mb-2 flex items-center gap-1">
                                                <AlertCircle className="size-4 shrink-0" /> IMPORTANTE: Leia com atenção
                                            </p>
                                            <p className="text-slate-300 text-xs mb-3 leading-relaxed">
                                                Para obeter o código, você primeiro precisa enviar uma mensagem em nosso whatsapp, do seu celular.
                                                <br /><br />
                                                1. Clique no botão verde abaixo para abrir o chat.
                                                <br />
                                                2. Envie o texto já preenchido.
                                                <br />
                                                3. <strong className="text-emerald-400">O celular que enviar a mensagem deve ser o mesmo número que você digitar abaixo!</strong>
                                            </p>
                                             <Button asChild className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 font-black transition-all shadow-lg hover:shadow-emerald-500/20 border border-emerald-400">
                                                <a
                                                    href={whatsappLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setWhatsappSent(true)}
                                                >
                                                    <svg viewBox="0 0 24 24" className="size-5 fill-white">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                    1. Enviar Código no WhatsApp <ExternalLink className="size-3" />
                                                </a>
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm">2. Digite seu WhatsApp de Cadastro</Label>
                                            <div 
                                                className="flex gap-2 relative"
                                                onClickCapture={() => {
                                                    if (!whatsappSent) {
                                                        setErrorMsg("⚠️ Ação Requerida: Você precisa clicar no botão verde e enviar a mensagem no WhatsApp antes de digitar.");
                                                    }
                                                }}
                                            >
                                                {/* Escudo invisível para capturar o clique quando estiver desabilitado */}
                                                {!whatsappSent && <div className="absolute inset-0 z-10 cursor-not-allowed" />}
                                                
                                                <select
                                                    className={`h-11 px-3 bg-slate-800 border rounded-xl text-white outline-none focus:border-cyan-500 text-sm ${!whatsappSent ? 'opacity-50 border-transparent cursor-not-allowed' : 'border-white/10'}`}
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                    disabled={!whatsappSent}
                                                >
                                                    <option value="55">🇧🇷 +55</option>
                                                    <option value="351">🇵🇹 +351</option>
                                                    <option value="1">🇺🇸 +1</option>
                                                </select>
                                                <Input
                                                    type="tel"
                                                    placeholder="Ex: 91988887777"
                                                    value={whatsapp}
                                                    onChange={(e) => setWhatsapp(e.target.value)}
                                                    required
                                                    className={`h-11 bg-white/5 text-white rounded-xl ${!whatsappSent ? 'opacity-50 border-transparent cursor-not-allowed' : 'border-white/10 focus:border-cyan-500'}`}
                                                    disabled={!whatsappSent}
                                                />
                                            </div>
                                        </div>
                                        {errorMsg && (
                                            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <AlertCircle className="size-4 shrink-0" /> {errorMsg}
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={!whatsappSent || loading}
                                            className={`w-full h-11 font-black rounded-xl transition-all ${whatsappSent
                                                    ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                                                    : 'bg-white/5 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {loading ? "Processando..." : "Já enviei a mensagem"}
                                        </Button>
                                    </form>
                                )}

                                {step === 2 && (
                                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4 text-xs text-amber-300 flex items-start gap-3">
                                            <AlertCircle className="size-5 shrink-0 mt-0.5 text-amber-400" />
                                            <div>
                                                 🚨 <strong className="text-white">LEMBRETE IMPORTANTE:</strong>
                                                 <br/>
                                                 O código que você vai receber só funcionará se você enviou a mensagem do número <strong className="text-cyan-400 font-bold">+{countryCode} {whatsapp}</strong>.
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm">Código de 6 dígitos</Label>
                                            <Input
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                                required
                                                className="h-11 text-center tracking-widest text-lg font-bold bg-white/5 border-white/10 focus:border-cyan-500 text-white rounded-xl"
                                            />
                                        </div>
                                        {errorMsg && (
                                            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <AlertCircle className="size-4 shrink-0" /> {errorMsg}
                                            </div>
                                        )}
                                        <Button type="submit" disabled={loading} className="w-full h-11 font-bold bg-cyan-500 hover:bg-cyan-600 text-slate-900 rounded-xl">
                                            {loading ? "Verificando..." : "Verificar Código"}
                                        </Button>
                                        <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs text-slate-400 hover:text-cyan-400 transition-colors">Voltar e alterar número</button>
                                    </form>
                                )}

                                {step === 3 && (
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm">Nova Senha</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    className="h-11 pr-10 bg-white/5 border-white/10 focus:border-cyan-500 text-white rounded-xl"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
                                                >
                                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm">Confirmar Senha</Label>
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="h-11 bg-white/5 border-white/10 focus:border-cyan-500 text-white rounded-xl"
                                            />
                                        </div>

                                        {errorMsg && (
                                            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <AlertCircle className="size-4 shrink-0" /> {errorMsg}
                                            </div>
                                        )}

                                        <Button type="submit" disabled={loading} className="w-full h-11 font-bold bg-cyan-500 hover:bg-cyan-600 text-slate-900 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                            {loading ? "Salvando..." : "Salvar Nova Senha"}
                                        </Button>
                                    </form>
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

