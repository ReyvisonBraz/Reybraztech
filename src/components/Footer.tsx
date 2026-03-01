import { Mail, MessageSquare, Send, Instagram } from 'lucide-react';

// ► Para trocar a logo: substitua o arquivo  public/logo/logo.png
// ► Formatos aceitos: PNG, JPG, SVG, WEBP
const LOGO_URL = "/logo/logo.png";
const LOGO_FALLBACK = "https://lh3.googleusercontent.com/aida-public/AB6AXuB_xDT_PyoMkB59P3OzTV_FbTxjdvtzFgyoxemqDJwBcszLBk9vonzWpUiC2ZVcrQvOmbqY0zjk7FdF0CSKQP2t7wS1k61vO5FQUS-5qpoyzrsYbPRE0sJvWqqkjPTTG-RVStF2gd78ThnlxpXPO4He6FboapYSBvaZ3RPBRm3USRYgxtIK3ggMuLX8nwsgytGrMmzDCFhAipovqbRi-S3ahXOqlUnnDKyJLrsIyOMUU_iAsruVUNJkCByYeE9GmQcYhNLjMlQWQxue";

export const Footer = () => {
    return (
        <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-20">
                    <div className="col-span-1 md:col-span-1">
                        <img
                            alt="Reybraz Tech Logo"
                            className="h-14 w-auto mb-8 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                            src={LOGO_URL}
                            onError={(e) => { (e.target as HTMLImageElement).src = LOGO_FALLBACK; }}
                        />
                        <p className="text-slate-400 leading-relaxed text-lg">
                            A melhor plataforma de streaming para o seu entretenimento diário. Qualidade, estabilidade e variedade.
                        </p>
                        <div className="mt-8 flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer">
                                <Instagram className="w-5 h-5 text-slate-300" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-green-500/20 hover:border-green-500/50 transition-all cursor-pointer">
                                <MessageSquare className="w-5 h-5 text-slate-300" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer">
                                <Send className="w-5 h-5 text-slate-300" />
                            </a>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8">Links Rápidos</h3>
                        <ul className="space-y-4">
                            {['Início', 'Planos', 'Dispositivos'].map(item => (
                                <li key={item}><a href={item === 'Início' ? '/' : `/#${item.toLowerCase()}`} className="text-slate-400 hover:text-cyan-400 transition-colors text-lg">{item}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8">Suporte</h3>
                        <ul className="space-y-4">
                            {['FAQ', 'Termos de Uso', 'Política de Privacidade'].map(item => (
                                <li key={item}><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-lg">{item}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8">Contato</h3>
                        <ul className="space-y-6">
                            <li className="flex items-center text-slate-400 text-lg">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mr-4">
                                    <Mail className="w-5 h-5 text-cyan-400" />
                                </div>
                                contato@reybraz.tech
                            </li>
                            <li className="flex items-center text-slate-400 text-lg">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mr-4">
                                    <MessageSquare className="w-5 h-5 text-purple-400" />
                                </div>
                                Chat Online (09h - 18h)
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-12 text-center">
                    <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">© 2023 Reybraz Tech. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
};
