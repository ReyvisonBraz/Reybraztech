import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, User, Phone, Gift, Loader2, Clock, CheckCircle2, Tv, Monitor } from 'lucide-react';
import { API_URL } from '../config/api';

const DEVICE_OPTIONS = [
  { value: '', label: 'Selecione o dispositivo' },
  { value: 'tvbox', label: 'TV Box Android' },
  { value: 'firestick', label: 'Fire Stick' },
  { value: 'smarttv', label: 'Smart TV Android' },
  { value: 'celular', label: 'Celular Android' },
  { value: 'outro', label: 'Outro' },
];

export const TrialPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [countryCode] = useState('55');
  const [phone, setPhone] = useState('');
  const [device, setDevice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const whatsapp = `${countryCode}${phone.replace(/\D/g, '')}`;

    if (whatsapp.length < 12) {
      setError('Numero de WhatsApp invalido. Inclua o DDD.');
      return;
    }

    if (!device) {
      setError('Selecione o dispositivo.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/orders/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, device }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar teste gratuito.');
        setSubmitting(false);
        return;
      }

      // Abrir WhatsApp para confirmar solicitação
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      }

      // Mostrar instrução para continuar após enviar msg no WhatsApp
      setSubmitting(false);
      navigate(`/complete-registration?order=${data.orderId}`);
    } catch {
      setError('Erro de conexao. Tente novamente.');
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-transparent">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <Link to="/" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors group font-bold">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para o inicio
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border-emerald-500/20 p-6 md:p-8 rounded-3xl border-2"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                <Gift className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Teste Gratuito</h2>
            <p className="text-slate-400 text-sm">
              Experimente nosso servico de 3 a 7 dias, sem compromisso.
            </p>
          </div>

          {/* Beneficios */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: Tv, text: '+500 Canais UHD' },
              { icon: Clock, text: '3 a 7 Dias' },
              { icon: CheckCircle2, text: 'Sem Cartao' },
              { icon: Gift, text: '100% Gratuito' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl text-sm text-slate-300">
                <item.icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {item.text}
              </div>
            ))}
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                required
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <select
                required
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all appearance-none"
              >
                {DEVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-1 px-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 text-sm font-mono min-w-[72px] justify-center">
                +{countryCode}
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  required
                  type="tel"
                  placeholder="WhatsApp (com DDD)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center font-bold">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-shimmer w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 transition-all text-lg border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Gift className="w-6 h-6" />
                  Ativar Teste Gratuito
                </>
              )}
            </button>

            <p className="text-center text-slate-500 text-xs px-4">
              Você será redirecionado para o WhatsApp. Envie a mensagem para confirmar e receber seu acesso.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
