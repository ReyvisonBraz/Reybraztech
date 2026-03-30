import { MessageSquare, MessageCircle, Send, Instagram } from 'lucide-react';
import { openSendPulseChat } from '../utils/openSendPulseChat';

const LOGO_URL = "/logo/logo.avif";
const LOGO_FALLBACK = "https://lh3.googleusercontent.com/aida-public/AB6AXuB_xDT_PyoMkB59P3OzTV_FbTxjdvtzFgyoxemqDJwBcszLBk9vonzWpUiC2ZVcrQvOmbqY0zjk7FdF0CSKQP2t7wS1k61vO5FQUS-5qpoyzrsYbPRE0sJvWqqkjPTTG-RVStF2gd78ThnlxpXPO4He6FboapYSBvaZ3RPBRm3USRYgxtIK3ggMuLX8nwsgytGrMmzDCFhAipovqbRi-S3ahXOqlUnnDKyJLrsIyOMUU_iAsruVUNJkCByYeE9GmQcYhNLjMlQWQxue";

export const Footer = () => {
    return (
        <footer className="border-t border-white/5 pt-20 pb-10 bg-[#020617]">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">
                    {/* Brand */}
                    <div>
                        <img
                            alt="Reybraz Tech Logo"
                            className="h-12 w-auto object-contain mb-6"
                            src={LOGO_URL}
                            onError={(e) => { (e.target as HTMLImageElement).src = LOGO_FALLBACK; }}
                        />
                        <p className="text-slate-500 leading-relaxed text-base mb-6">
                            A melhor plataforma de streaming para o seu entretenimento diário.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { icon: <Instagram className="w-4 h-4" />, hover: 'hover:bg-pink-500/15 hover:text-pink-400 hover:border-pink-500/30' },
                                { icon: <MessageSquare className="w-4 h-4" />, hover: 'hover:bg-green-500/15 hover:text-green-400 hover:border-green-500/30' },
                                { icon: <Send className="w-4 h-4" />, hover: 'hover:bg-blue-500/15 hover:text-blue-400 hover:border-blue-500/30' },
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className={`w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 transition-all duration-300 ${social.hover}`}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6">Links</h3>
                        <ul className="space-y-3">
                            {['Início', 'Planos', 'Dispositivos'].map(item => (
                                <li key={item}>
                                    <a href={item === 'Início' ? '/' : `/#${item.toLowerCase()}`} className="text-slate-500 hover:text-white transition-colors text-base">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Suporte */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6">Suporte</h3>
                        <ul className="space-y-3">
                            {['FAQ', 'Termos de Uso', 'Privacidade'].map(item => (
                                <li key={item}>
                                    <a href="#" className="text-slate-500 hover:text-white transition-colors text-base">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6">Contato</h3>
                        <div className="space-y-3">
                            <a
                                href="https://wa.me/5591986450659"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 transition-all duration-200 group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                </div>
                                <div>
                                    <p className="text-emerald-400 text-sm font-semibold">WhatsApp</p>
                                    <p className="text-slate-500 text-xs">Resposta rápida</p>
                                </div>
                            </a>
                            <button
                                type="button"
                                onClick={openSendPulseChat}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/15 hover:border-purple-500/30 transition-all duration-200 group text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    <MessageCircle className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-purple-400 text-sm font-semibold">Chat ao Vivo</p>
                                    <p className="text-slate-500 text-xs">Suporte em tempo real</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/5 pt-8 text-center">
                    <p className="text-slate-600 text-sm tracking-wide">
                        &copy; {new Date().getFullYear()} Reybraz Tech. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
};
