import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, MessageCircle, Shield, FileText, HelpCircle } from 'lucide-react';

type Tab = 'faq' | 'termos' | 'privacidade';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

const FAQ_CONTENT = [
  {
    q: 'Como funciona o teste gratuito?',
    a: 'Ao solicitar o trial, você tem 3 dias de acesso completo a todos os canais. Após esse período, você pode assinar um dos nossos planos para continuar assistindo.',
  },
  {
    q: 'Em quais dispositivos posso assistir?',
    a: 'Nosso conteúdo funciona em TV Box Android, Amazon Fire Stick, Smart TV Android, Celulares Android e muito mais. Qualquer dispositivo que suporte o app UNITV pode ser usado.',
  },
  {
    q: 'Como instalo o aplicativo?',
    a: 'Após fazer seu cadastro, basta clicar em "Baixar UNITV" no seu painel e seguir o tutorial de instalação. Você precisará permitir fontes desconhecidas no seu dispositivo.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim! Não há fidelidade. Você pode cancelar sua assinatura quando quiser e não será cobrado novamente.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'Aceitamos cartão de crédito através do Mercado Pago. O pagamento é seguro e você recebe confirmação instantânea.',
  },
  {
    q: 'O que acontece se meu pagamento falhar?',
    a: 'Não se preocupe! Seu acesso permanece ativo por 24 horas mesmo se o pagamento demorar para processar. Entre em contato pelo WhatsApp se precisar de ajuda.',
  },
  {
    q: 'Posso mudar de plano?',
    a: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Entre em contato com nosso suporte.',
  },
  {
    q: 'Como contato o suporte?',
    a: 'Você pode falar conosco pelo WhatsApp (5591986450659) ou pelo chat ao vivo no site. Respondemos rapidamente!',
  },
];

const TERMOS_CONTENT = `
**TERMOS DE USO - REYBRAZ TECH**

Última atualização: Janeiro 2024

**1. Aceitação dos Termos**

Ao acessar e utilizar os serviços da Reybraz Tech, você concorda com estes termos de uso. Se você não concorda com algum dos termos, não utilize nossos serviços.

**2. Descrição do Serviço**

A Reybraz Tech oferece acesso a conteúdo de entretenimento via IPTV. Nosso serviço inclui:
- Acesso a listagem de canais
- Suporte técnico via WhatsApp ou chat
- Painel de controle do cliente
- Teste gratuito de 3 dias

**3. Elegibilidade**

Para utilizar nossos serviços, você deve:
- Ter pelo menos 18 anos de idade
- Ter capacidade legal para celebrar contratos
- Fornecer informações verdadeiras no cadastro

**4. Planos e Pagamentos**

- Os preços dos planos estão disponíveis no site
- Pagamentos são processados via Mercado Pago
- A assinatura renova automaticamente ao final do período, a menos que cancelada
- Não há reembolso para períodos já utilizados

**5. Uso Aceitável**

Você se compromete a:
- Não compartilhar suas credenciais com terceiros
- Não revender ou redistribuir nosso conteúdo
- Não usar para fins ilegais
- Respeitar todos os direitos de propriedade intelectual

**6. Isenção de Responsabilidade**

O serviço é fornecido "como está". Não garantimos disponibilidade 100% dos canais, pois dependemos de fontes externas.

**7. Limitação de Responsabilidade**

A Reybraz Tech não se responsabiliza por:
- Interrupções de serviço por causas externas
- Perdas decorrentes do uso do serviço
- Conteúdo de terceiros

**8. Cancelamento**

Você pode cancelar sua assinatura a qualquer momento através do painel ou entrando em contato com suporte.

**9. Alterações dos Termos**

Reservamos o direito de alterar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou pelo site.

**10. Lei Aplicável**

Estes termos são regidos pelas leis brasileiras. Qualquer dispute será resolvida nos tribunais brasileiros.

**Contato:**
WhatsApp: 5591986450659
E-mail: suporte@reybraztech.com
`;

const PRIVACIDADE_CONTENT = `
**POLÍTICA DE PRIVACIDADE - REYBRAZ TECH**

Última atualização: Janeiro 2024

**1. Introdução**

A Reybraz Tech valoriza sua privacidade. Esta política explica como coletamos, usamos e protegemos suas informações pessoais.

**2. Informações que Coletamos**

Coletamos as seguintes informações:
- Nome completo
- Número de WhatsApp
- E-mail (opcional)
- Informações de pagamento (processadas pelo Mercado Pago)
- Dados de uso do serviço

**3. Como Usamos suas Informações**

Utilizamos suas informações para:
- Criar e gerenciar sua conta
- Processar pagamentos
- Enviar notificações sobre sua assinatura
- Fornecer suporte técnico
- Melhorar nossos serviços

**4. Compartilhamento de Dados**

Não vendemos seus dados pessoais. Compartilhamos informações apenas:
- Com processadores de pagamento (Mercado Pago)
- Quando exigido por lei
- Para proteção de nossos direitos

**5. Armazenamento de Dados**

Seus dados são armazenados em servidores seguros. Mantemos:
- Dados de conta: enquanto sua conta estiver ativa
- Logs de acesso: por 12 meses
- Dados de pagamento: conforme exigência legal

**6. Seus Direitos**

Você tem direito a:
- Acessar seus dados pessoais
- Corrigir dados incorretos
- Solicitar exclusão de sua conta
- Exportar seus dados

**7. Segurança**

Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado.

**8. Cookies**

Utilizamos cookies para:
- Manter sua sessão ativa
- Lembrar suas preferências
- Analisar uso do site

**9. Crianças**

Nosso serviço não é direcionado a menores de 18 anos. Não coletamos intencionalmente informações de crianças.

**10. Alterações**

Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas.

**11. Contato**

Para questões sobre privacidade:
WhatsApp: 5591986450659
E-mail: suporte@reybraztech.com
`;

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-bold text-white pr-4">{q}</span>
        <ChevronRight className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-slate-400 text-sm leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function parseMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h3 key={i} className="font-black text-white text-lg mt-6 mb-3">{line.replace(/\*\*/g, '')}</h3>;
    }
    if (line.startsWith('- ')) {
      return <li key={i} className="text-slate-400 text-sm ml-4">{line.substring(2)}</li>;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-slate-400 text-sm leading-relaxed">{line}</p>;
  });
}

export function LegalModal({ isOpen, onClose, initialTab = 'faq' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const tabs = [
    { id: 'faq' as Tab, label: 'FAQ', icon: HelpCircle },
    { id: 'termos' as Tab, label: 'Termos', icon: FileText },
    { id: 'privacidade' as Tab, label: 'Privacidade', icon: Shield },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass border-cyan-500/30 rounded-3xl border-2 w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-white text-xl">Informações Legais</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'faq' && (
                <div className="space-y-2">
                  {FAQ_CONTENT.map((item, idx) => {
                    const el = <FAQItem q={item.q} a={item.a} />;
                    return <div key={idx}>{el}</div>;
                  })}
                </div>
              )}

              {activeTab === 'termos' && (
                <div className="prose prose-invert max-w-none">
                  {parseMarkdown(TERMOS_CONTENT)}
                </div>
              )}

              {activeTab === 'privacidade' && (
                <div className="prose prose-invert max-w-none">
                  {parseMarkdown(PRIVACIDADE_CONTENT)}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
