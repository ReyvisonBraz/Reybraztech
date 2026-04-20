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

Última atualização: Abril 2025

**1. Aceitação dos Termos**

Ao acessar e utilizar os serviços da Reybraz Tech, você concorda com estes Termos de Uso. Caso não concorde com qualquer disposição aqui contida, não utilize nossos serviços.

**2. Natureza do Serviço**

A Reybraz Tech é uma plataforma de intermediação tecnológica que comercializa credenciais de acesso ao aplicativo UNITV, desenvolvido e mantido por terceiros independentes. A Reybraz Tech não produz, hospeda, armazena, transmite nem distribui qualquer conteúdo audiovisual. Todo o conteúdo exibido pelo aplicativo UNITV é de exclusiva responsabilidade dos respectivos desenvolvedores e das fontes de origem disponibilizadas publicamente na internet. Nosso papel se limita a: gerenciar contas de usuário, processar pagamentos e fornecer suporte técnico de acesso.

**3. Isenção de Responsabilidade sobre Conteúdo**

A Reybraz Tech não é titular, licenciada, produtora nem distribuidora de qualquer conteúdo audiovisual acessível pelo aplicativo. O conteúdo exibido é proveniente de streams e fontes públicas disponíveis na internet, sendo de responsabilidade exclusiva dos provedores dessas fontes. O usuário reconhece que a Reybraz Tech atua exclusivamente como intermediadora de acesso a um aplicativo de terceiros, sem qualquer controle editorial sobre o conteúdo disponibilizado.

**4. Elegibilidade**

Para utilizar nossos serviços, você deve:
- Ter pelo menos 18 anos de idade
- Ter capacidade legal para celebrar contratos
- Fornecer informações verídicas no cadastro

**5. Planos e Pagamentos**

- Os valores dos planos estão disponíveis no site
- Pagamentos são processados com segurança via Mercado Pago
- A assinatura se renova automaticamente ao término do período contratado, salvo cancelamento prévio
- Não são realizados reembolsos por períodos já utilizados

**6. Uso Aceitável**

O usuário se compromete a:
- Não compartilhar suas credenciais de acesso com terceiros
- Não revender, redistribuir ou comercializar as credenciais fornecidas
- Não utilizar o serviço para fins que violem a legislação brasileira vigente
- Utilizar o serviço exclusivamente para uso pessoal e privado

**7. Limitação de Responsabilidade**

A Reybraz Tech não se responsabiliza por:
- Disponibilidade, qualidade ou conteúdo do aplicativo UNITV ou de suas fontes
- Interrupções decorrentes de fatores externos ou de terceiros
- Quaisquer perdas ou danos relacionados ao uso do aplicativo
- Conteúdo de propriedade ou responsabilidade de terceiros

**8. Cancelamento**

Você pode cancelar sua assinatura a qualquer momento pelo painel de controle ou pelo suporte.

**9. Alterações dos Termos**

Reservamo-nos o direito de atualizar estes termos. Mudanças relevantes serão comunicadas via e-mail ou pelo site.

**10. Lei Aplicável**

Estes termos são regidos pela legislação brasileira. Eventuais disputas serão submetidas ao foro da comarca competente no Brasil.

**Contato:**
WhatsApp: 5591986450659
E-mail: suporte@reybraztech.com
`;

const PRIVACIDADE_CONTENT = `
**POLÍTICA DE PRIVACIDADE - REYBRAZ TECH**

Última atualização: Abril 2025

**1. Introdução**

A Reybraz Tech está comprometida com a proteção dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Esta política descreve quais dados coletamos, como os utilizamos e como os protegemos.

**2. Dados que Coletamos**

Coletamos apenas os dados estritamente necessários para a prestação do serviço:
- Nome completo
- Número de WhatsApp (utilizado para autenticação via OTP)
- E-mail (opcional, para comunicações)
- Dados de pagamento (processados integralmente pelo Mercado Pago — não armazenamos dados de cartão)
- Logs técnicos de acesso ao painel (endereço IP, data/hora)

**3. Finalidade do Tratamento**

Seus dados são utilizados exclusivamente para:
- Criar e gerenciar sua conta de acesso
- Autenticar sua identidade com segurança
- Processar e registrar pagamentos
- Enviar comunicações sobre sua assinatura
- Fornecer suporte técnico
- Cumprir obrigações legais e regulatórias

**4. Base Legal (LGPD)**

O tratamento de dados realizado pela Reybraz Tech é fundamentado em:
- Execução de contrato (Art. 7º, V da LGPD): para viabilizar o acesso ao serviço contratado
- Legítimo interesse (Art. 7º, IX da LGPD): para comunicações relacionadas à assinatura
- Cumprimento de obrigação legal (Art. 7º, II da LGPD): quando exigido por autoridade competente

**5. Compartilhamento de Dados**

Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins comerciais. Compartilhamos dados apenas:
- Com o Mercado Pago, para processamento seguro de pagamentos
- Mediante ordem judicial ou requisição de autoridade competente
- Para exercício regular de direitos em processos judiciais ou administrativos

**6. Armazenamento e Segurança**

Seus dados são armazenados em servidores com acesso restrito e protegidos por criptografia. Os prazos de retenção são:
- Dados de conta: enquanto a conta estiver ativa ou até solicitação de exclusão
- Logs de acesso: por até 12 meses
- Registros financeiros: conforme exigência da legislação fiscal e tributária

**7. Seus Direitos como Titular (LGPD)**

Conforme a LGPD, você tem direito a:
- Confirmar a existência de tratamento dos seus dados
- Acessar seus dados pessoais
- Corrigir dados incompletos, inexatos ou desatualizados
- Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários
- Solicitar a portabilidade dos seus dados
- Revogar o consentimento a qualquer momento
- Solicitar a exclusão completa da sua conta e dados associados

**8. Cookies e Tecnologias de Rastreamento**

Utilizamos cookies essenciais para:
- Manter sua sessão autenticada
- Garantir a segurança do acesso
- Lembrar preferências básicas de navegação

Não utilizamos cookies de rastreamento publicitário ou de terceiros.

**9. Menores de Idade**

Nosso serviço é destinado exclusivamente a maiores de 18 anos. Não coletamos intencionalmente dados de menores. Caso identifiquemos tal situação, os dados serão imediatamente excluídos.

**10. Alterações desta Política**

Esta política pode ser atualizada periodicamente. Mudanças relevantes serão comunicadas pelo site ou por e-mail com antecedência razoável.

**11. Encarregado de Dados (DPO) e Contato**

Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:
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
