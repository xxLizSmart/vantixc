import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#F5F5F0' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <FileText className="w-7 h-7" style={{ color: '#00EBFF', filter: 'drop-shadow(0 0 8px rgba(0,235,255,0.6))' }} />
          <h1 className="text-3xl font-bold" style={{ color: '#00EBFF' }}>Terms of Service</h1>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#C0B8B8' }}>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>1. Acceptance of Terms</h2>
            <p>By accessing or using the Vantix Trading platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>2. Eligibility</h2>
            <p>You must be at least 18 years old and legally permitted to trade digital assets in your jurisdiction. By creating an account, you represent that you meet these requirements. Vantix reserves the right to restrict access in jurisdictions where cryptocurrency trading is prohibited.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>3. Account Responsibilities</h2>
            <p>You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to immediately notify Vantix of any unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>4. KYC & AML Compliance</h2>
            <p>To comply with anti-money laundering (AML) and know-your-customer (KYC) regulations, you may be required to submit identity verification documents before accessing full platform features including withdrawals. Failure to complete verification may result in account restrictions.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>5. Trading Risks</h2>
            <p>Cryptocurrency trading carries significant financial risk. The value of digital assets can decrease rapidly. Vantix does not provide financial advice. Past performance is not indicative of future results. You acknowledge that you trade at your own risk.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>6. Prohibited Activities</h2>
            <p>You agree not to use the platform for money laundering, fraud, market manipulation, or any illegal activity. Automated bots or scrapers are prohibited without written consent. Vantix reserves the right to freeze accounts and report suspicious activity to authorities.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>7. Fees</h2>
            <p>Vantix may charge fees for certain transactions. Current fee schedules are displayed at the time of transaction. We reserve the right to modify fees with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>8. Limitation of Liability</h2>
            <p>Vantix is not liable for any indirect, incidental, or consequential damages arising from platform use, including losses due to system downtime, errors, or market volatility. Our total liability is limited to fees paid in the preceding 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#F5F5F0' }}>9. Termination</h2>
            <p>Vantix reserves the right to suspend or terminate your account at any time for violation of these terms or for any reason deemed necessary to protect the platform or its users.</p>
          </section>

          <p className="text-xs pt-4" style={{ color: '#6B6363', borderTop: '1px solid rgba(0,235,255,0.08)' }}>
            Effective date: March 2026 &nbsp;·&nbsp; Vantix Trading Platform
          </p>
        </div>
      </div>
    </div>
  );
}
