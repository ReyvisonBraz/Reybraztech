import { MessageSquare } from 'lucide-react';

export const FloatingWhatsApp = () => {
    return (
        <a
            href="https://wa.me/5591986450659"
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group"
        >
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="absolute right-full mr-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-slate-100 dark:border-white/10">
                Fale Conosco
            </span>
        </a>
    );
};
