import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { API_URL } from '../config/api';

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

    const resetState = () => {
        setStep(1);
        setWhatsapp('');
        setToken('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(false);
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
            
            // Auto close after 2 seconds
            setTimeout(() => {
                handleClose();
            }, 2500);

        } catch {
            setErrorMsg('Erro ao redefinir senha.');
        } finally {
            setLoading(false);
        }
    };

    // Formatação visual do passo a passo
    const stepHeaders = {
        1: { title: "Recuperar Senha", desc: "Insira seu WhatsApp para receber o código" },
        2: { title: "Verificar Código", desc: `Código enviado para +${countryCode} ${whatsapp}` },
        3: { title: "Nova Senha", desc: "Crie sua nova senha de acesso" }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        className="relative w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 overflow-hidden"
                    >
                        {/* Decorative background gradients */}
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full filter blur-[80px] -z-1" />
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full filter blur-[80px] -z-1" />

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
                        >
                            <X className="size-5" />
                        </button>

                        {/* Success Message Header */}
                        {successMsg ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center text-center py-6"
                            >
                                <div className="size-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                                    <CheckCircle2 className="size-8 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Sucesso!</h3>
                                <p className="text-slate-300 text-sm">{successMsg}</p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-black text-white">{stepHeaders[step].title}</h3>
                                    <p className="text-slate-400 text-sm mt-1">{stepHeaders[step].desc}</p>
                                </div>

                                {/* Step 1: Send OTP */}
                                {step === 1 && (
                                    <form onSubmit={handleSendOtp} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300 text-sm">WhatsApp</Label>
                                            <div className="flex gap-2">
                                                <select
                                                    className="h-11 px-3 bg-slate-800 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500 text-sm"
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
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
                                                    className="h-11 bg-white/5 border-white/10 focus:border-cyan-500 text-white rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        {errorMsg && (
                                            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <AlertCircle className="size-4 shrink-0" /> {errorMsg}
                                            </div>
                                        )}
                                        <Button type="submit" disabled={loading} className="w-full h-11 font-bold bg-cyan-500 hover:bg-cyan-600 text-slate-900 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                            {loading ? "Enviando..." : "Enviar Código"}
                                        </Button>
                                    </form>
                                )}

                                {/* Step 2: Verify OTP */}
                                {step === 2 && (
                                    <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                                        <button 
                                            type="button" 
                                            onClick={() => setStep(1)} 
                                            className="w-full text-center text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                                        >
                                            Voltar e alterar número
                                        </button>
                                    </form>
                                )}

                                {/* Step 3: Reset Password */}
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
