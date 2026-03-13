import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#F5F5F0' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <Lock className="w-7 h-7" style={{ color: '#00EBFF', filter: 'drop-shadow(0 0 8px rgba(0,235,255,0.6))' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#00EBFF' }}>Privacy Policy</h1>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#C0B8B8' }}>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>1. Information We Collect</h2>
            <p>Vantix Trading collects information you provide directly to us, such as when you create an account, complete KYC verification, initiate a transaction, or contact support. This includes personal identifiers (name, email address), financial data (transaction history, wallet addresses), and device/usage information collected automatically.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>2. How We Use Your Information</h2>
            <p>We use collected information to operate and improve the platform, process transactions, comply with legal obligations (AML/KYC), send account notifications, and protect against fraudulent or unauthorized activity.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>3. Data Sharing</h2>
            <p>We do not sell your personal data. We may share information with regulated third-party service providers who assist in platform operations, identity verification partners, and law enforcement or regulatory bodies when legally required.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>4. Data Security</h2>
            <p>Vantix employs industry-standard encryption, access controls, and monitoring to protect your data. All sensitive data is stored in encrypted form. You are responsible for maintaining the confidentiality of your account credentials.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>5. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict the processing of your personal data. To exercise these rights, contact us at privacy@vantix.com.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>6. Cookies</h2>
            <p>We use essential session cookies to maintain your authenticated state. No third-party advertising cookies are used. You may disable cookies in your browser settings, though this may affect platform functionality.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>7. Updates to This Policy</h2>
            <p>We may update this policy periodically. Changes will be posted on this page with an updated effective date. Continued use of the platform after changes constitutes acceptance.</p>
          </section>

          <p className="text-xs pt-4" style={{ color: '#6B6363', borderTop: '1px solid rgba(0,235,255,0.08)' }}>
            Effective date: March 2026 &nbsp;·&nbsp; Vantix Trading Platform
          </p>
        </div>
      </div>
    </div>
  );
}
