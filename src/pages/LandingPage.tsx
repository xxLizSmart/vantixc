import { useLanguage } from '../contexts/LanguageContext';
import { TrendingUp, Shield, Zap, Users, Star, Globe, Award, BarChart3, Lock, Coins, CheckCircle, ArrowUpRight, ArrowDownRight, DollarSign, LineChart, PieChart, Activity, Wallet, CreditCard } from 'lucide-react';
import FloatingIconsHero from '../components/FloatingIconsHero';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const demoIcons = [
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Lock,
  Coins,
  Globe,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  LineChart,
  PieChart,
  Activity,
  Wallet,
  CreditCard,
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <FloatingIconsHero
        title="Bitget Trading"
        subtitle="Trade with Confidence, Scale with Bitget. The most secure platform to track and manage your digital assets."
        ctaText="Start Trading Now"
        onCtaClick={() => onNavigate('login')}
        icons={demoIcons}
      />

      <section className="py-24 px-4 border-t border-light-border dark:border-dark-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { value: '50K+', label: 'Active Traders' },
              { value: '$10M+', label: 'Daily Volume' },
              { value: '99.9%', label: 'Uptime' },
              { value: '150+', label: 'Countries' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-bitget-cyan mb-3">{stat.value}</div>
                <div className="text-light-text-secondary dark:text-dark-text-secondary text-sm md:text-base font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-light-surface dark:bg-dark-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-light-text dark:text-dark-text">
            Why Choose Bitget Trading
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Advanced Trading',
                description: 'Real-time charts and precision trading tools for professional traders',
              },
              {
                icon: Shield,
                title: 'Secure Platform',
                description: 'Bank-level security with multi-layer encryption and KYC verification',
              },
              {
                icon: Zap,
                title: 'Instant Execution',
                description: 'Lightning-fast trade execution with multiple duration options',
              },
              {
                icon: Users,
                title: '24/7 Support',
                description: 'Round-the-clock customer support for all your trading needs',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-light-bg dark:bg-dark-surface-light p-8 rounded-lg border border-light-border dark:border-dark-border hover:border-bitget-cyan hover:shadow-xl transition-all"
              >
                <feature.icon className="w-14 h-14 text-bitget-cyan mb-6" />
                <h3 className="text-xl font-semibold text-light-text dark:text-dark-text mb-3">{feature.title}</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-light-text dark:text-dark-text">
            Platform Benefits
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Low Minimum Capital',
                description: 'Start trading with as little as 100 USDT',
              },
              {
                title: 'High Returns',
                description: 'Earn up to 50% profit on successful trades',
              },
              {
                title: 'Multiple Cryptocurrencies',
                description: 'Trade Bitcoin, Ethereum, USDC, XRP, Solana and more',
              },
              {
                title: 'Easy Deposits',
                description: 'Support for TRC20, ERC20, BTC, and ETH networks',
              },
              {
                title: 'Quick Verification',
                description: 'Fast KYC verification process within 3-6 hours',
              },
              {
                title: 'Multi-Language',
                description: 'Available in 15+ languages worldwide',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg border border-light-border dark:border-dark-border hover:border-bitget-cyan hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-bitget-cyan rounded-lg flex items-center justify-center mb-6 text-black font-bold text-2xl">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-light-text dark:text-dark-text mb-3">{item.title}</h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-light-surface dark:bg-dark-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-light-text dark:text-dark-text">
            Supported Cryptocurrencies
          </h2>
          <p className="text-center text-light-text-secondary dark:text-dark-text-secondary mb-16 text-lg">Trade the most popular digital assets</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {[
              { name: 'Bitcoin', symbol: 'BTC', color: 'bg-orange-500' },
              { name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
              { name: 'USD Coin', symbol: 'USDC', color: 'bg-blue-400' },
              { name: 'Tether', symbol: 'USDT', color: 'bg-green-500' },
              { name: 'Ripple', symbol: 'XRP', color: 'bg-gray-400' },
              { name: 'Solana', symbol: 'SOL', color: 'bg-purple-500' },
            ].map((crypto, index) => (
              <div
                key={index}
                className="bg-light-bg dark:bg-dark-surface-light p-6 rounded-lg border border-light-border dark:border-dark-border hover:border-bitget-cyan hover:shadow-lg transition-all text-center group"
              >
                <div className={`w-16 h-16 ${crypto.color} rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform`}>
                  {crypto.symbol[0]}
                </div>
                <div className="text-light-text dark:text-dark-text font-semibold">{crypto.symbol}</div>
                <div className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{crypto.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-light-text dark:text-dark-text">
            What Our Traders Say
          </h2>
          <p className="text-center text-light-text-secondary dark:text-dark-text-secondary mb-16 text-lg">Join thousands of satisfied traders</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah M.',
                country: 'United States',
                text: 'Best trading platform I have used. Fast execution and great support team!',
                rating: 5,
              },
              {
                name: 'Chen W.',
                country: 'Singapore',
                text: 'The KYC process was quick and easy. Already made my first profitable trades!',
                rating: 5,
              },
              {
                name: 'Ahmed R.',
                country: 'UAE',
                text: 'Professional platform with excellent features. Highly recommend for beginners.',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-light-surface dark:bg-dark-surface p-8 rounded-lg border border-light-border dark:border-dark-border hover:border-bitget-cyan hover:shadow-xl transition-all"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 leading-relaxed">&quot;{testimonial.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-bitget-cyan rounded-full flex items-center justify-center text-black font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="text-light-text dark:text-dark-text font-semibold">{testimonial.name}</div>
                    <div className="text-light-text-secondary dark:text-dark-text-secondary text-sm">{testimonial.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-light-surface dark:bg-dark-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-light-text dark:text-dark-text">
            How It Works
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up with your email and complete KYC verification',
              },
              {
                step: '02',
                title: 'Deposit Funds',
                description: 'Add funds using crypto wallets (TRC20, ERC20, BTC, ETH)',
              },
              {
                step: '03',
                title: 'Start Trading',
                description: 'Choose your trade duration and amount, then predict market direction',
              },
              {
                step: '04',
                title: 'Earn Profits',
                description: 'Win trades and earn up to 50% profit on your investment',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start space-x-8 bg-light-bg dark:bg-dark-surface-light p-8 rounded-lg border border-light-border dark:border-dark-border hover:border-bitget-cyan hover:shadow-lg transition-all"
              >
                <div className="text-6xl font-bold text-bitget-cyan">{item.step}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-light-text dark:text-dark-text mb-3">{item.title}</h3>
                  <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-light-text dark:text-dark-text">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'What is the minimum deposit?',
                a: 'The minimum deposit is 100 USDT across all supported networks.',
              },
              {
                q: 'How long does KYC verification take?',
                a: 'KYC verification typically takes 3 to 6 hours after submission.',
              },
              {
                q: 'What cryptocurrencies can I trade?',
                a: 'You can trade Bitcoin, Ethereum, USDC, USDT, XRP, and Solana.',
              },
              {
                q: 'How do I withdraw my funds?',
                a: 'Navigate to the Withdraw page, enter your wallet address and amount, then wait for admin approval.',
              },
              {
                q: 'Are there any trading fees?',
                a: 'No, we do not charge trading fees. Profits and losses are based on the trade outcome percentages.',
              },
            ].map((item, index) => (
              <details
                key={index}
                className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg overflow-hidden hover:border-bitget-cyan transition-all"
              >
                <summary className="px-8 py-6 cursor-pointer text-lg font-semibold text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-surface-light transition-colors">
                  {item.q}
                </summary>
                <div className="px-8 py-6 bg-light-bg dark:bg-dark-surface-light text-light-text-secondary dark:text-dark-text-secondary border-t border-light-border dark:border-dark-border leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-bitget-cyan/5 via-light-bg to-bitget-cyan/5 dark:from-bitget-cyan/10 dark:via-dark-bg dark:to-bitget-cyan/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-light-text dark:text-dark-text mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of traders worldwide and start earning with crypto trading
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto btn-primary text-lg shadow-xl"
            >
              Create Free Account
            </button>
            <div className="flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary">
              <CheckCircle className="w-5 h-5 text-bitget-cyan" />
              <span>No credit card required</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { icon: Lock, label: 'Secure & Safe' },
              { icon: Coins, label: 'Low Fees' },
              { icon: Globe, label: 'Global Access' },
              { icon: Award, label: 'Licensed' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-3">
                <item.icon className="w-10 h-10 text-bitget-cyan" />
                <span className="text-light-text dark:text-dark-text font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            © 2024 Bitget Trading. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
