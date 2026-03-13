import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I create a Vantix account?',
    a: 'Click the "Login" button in the top navigation and select "Sign Up". Enter your email and a strong password. Your account will be created immediately — no email confirmation required.',
  },
  {
    q: 'What is KYC and why is it required?',
    a: 'KYC (Know Your Customer) is a regulatory process to verify your identity. Completing KYC is required to unlock withdrawal capabilities and higher deposit limits. It helps us prevent fraud and comply with financial regulations.',
  },
  {
    q: 'How do I deposit cryptocurrency?',
    a: 'Navigate to the Deposit page from the top menu. Select your preferred cryptocurrency, and you will be provided with a unique wallet address. Send your crypto to that address — deposits typically confirm within 10–60 minutes depending on the blockchain.',
  },
  {
    q: 'How long do withdrawals take?',
    a: 'Withdrawal requests are reviewed by our team and typically processed within 1–24 hours. Processing times may vary based on network congestion and verification status. You will receive a notification once the withdrawal is processed.',
  },
  {
    q: 'What cryptocurrencies does Vantix support?',
    a: 'Vantix supports Bitcoin (BTC), Ethereum (ETH), USDT, BNB, XRP, USDC, Solana (SOL), and many more. The full list of supported assets is available on the Deposit page.',
  },
  {
    q: 'Is my account secure?',
    a: 'Yes. Vantix uses industry-standard encryption for all data at rest and in transit. We strongly recommend using a unique, complex password. Two-factor authentication (2FA) is available in Profile Settings.',
  },
  {
    q: 'How are crypto prices determined on the platform?',
    a: 'All displayed prices are sourced directly from our verified market data feed and updated in real time. The same prices are used for portfolio valuations across your dashboard and trading interface.',
  },
  {
    q: 'What trading options are available?',
    a: 'Vantix offers spot trading and a range of configurable trade durations. Visit the Trading page to explore available pairs, leverage settings, and trade options.',
  },
  {
    q: 'How do I contact support?',
    a: 'For account issues, compliance inquiries, or technical support, email us at support@vantix.com. Our team responds within 24 hours on business days.',
  },
  {
    q: 'Can I change my account email or password?',
    a: 'Yes. Visit Profile Settings from the user dropdown in the top navigation to update your account details, change your password, and manage your profile.',
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#F5F5F0' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <HelpCircle className="w-7 h-7" style={{ color: '#00EBFF', filter: 'drop-shadow(0 0 8px rgba(0,235,255,0.6))' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#00EBFF' }}>Frequently Asked Questions</h1>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: isOpen ? 'rgba(26,20,20,0.9)' : 'rgba(15,13,13,0.8)',
                  border: isOpen ? '1px solid rgba(0,235,255,0.25)' : '1px solid rgba(0,235,255,0.08)',
                }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="text-sm font-medium" style={{ color: isOpen ? '#00EBFF' : '#F5F5F0' }}>
                    {faq.q}
                  </span>
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#00EBFF' }} />
                    : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#6B6363' }} />
                  }
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-sm leading-relaxed" style={{ color: '#C0B8B8' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
