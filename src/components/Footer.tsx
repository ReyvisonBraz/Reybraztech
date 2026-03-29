import { Mail, MessageSquare, Send, Instagram } from 'lucide-react';

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
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-500">
                                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-cyan-400" />
                                </div>
                                <span className="text-base">contato@reybraz.tech</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-500">
                                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-4 h-4 text-purple-400" />
                                </div>
                                <span className="text-base">Chat Online (09h - 18h)</span>
                            </li>
                        </ul>
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
