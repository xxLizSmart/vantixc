import { useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { useLanguage, localeOptions, type LocaleCode } from '../contexts/LanguageContext';
import { useCurrency, currencies } from '../contexts/CurrencyContext';

interface LocaleModalProps {
  onClose: () => void;
}

export default function LocaleModal({ onClose }: LocaleModalProps) {
  const { locale, setLocale, t } = useLanguage();
  const { setCurrency } = useCurrency();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSelect = (code: LocaleCode) => {
    setLocale(code);
    // Remove manual currency override so it auto-follows locale
    try { localStorage.removeItem('vantix_currency'); } catch { /* ignore */ }
    // Also set the matching currency immediately
    const localeData = localeOptions.find(l => l.code === code);
    if (localeData) setCurrency(localeData.currency);
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 flex items-center justify-center z-[200] px-4"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Modal panel ─────────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15,11,11,0.92)',
          border: '1px solid rgba(0,235,255,0.18)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,235,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Iridescent top stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,192,203,0.4), rgba(230,230,250,0.5), rgba(176,224,230,0.6), rgba(0,235,255,0.4), transparent)',
          }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(0,235,255,0.1)' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#F5F5F0' }}>
              {t('selectLanguage')}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#5A6677' }}>
              Select your language and region
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
            style={{ color: '#5A6677', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F0'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#5A6677'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable grid */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {localeOptions.map((opt) => {
              const isActive = locale.code === opt.code;
              const matchedCurrency = currencies.find(c => c.code === opt.currency);
              return (
                <button
                  key={opt.code}
                  onClick={() => handleSelect(opt.code)}
                  className="relative flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group"
                  style={{
                    background: isActive
                      ? 'rgba(0,235,255,0.08)'
                      : 'rgba(255,255,255,0.02)',
                    border: isActive
                      ? '1px solid rgba(0,235,255,0.45)'
                      : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isActive
                      ? '0 0 16px rgba(0,235,255,0.12), inset 0 0 12px rgba(0,235,255,0.04)'
                      : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      const el = e.currentTarget;
                      el.style.background = 'rgba(255,255,255,0.04)';
                      el.style.border = '1px solid rgba(0,235,255,0.18)';
                      // iridescent shimmer overlay via pseudo-element alternative: inline box-shadow
                      el.style.boxShadow = '0 0 20px rgba(0,235,255,0.06), inset 0 0 0 1px rgba(176,224,230,0.08)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      const el = e.currentTarget;
                      el.style.background = 'rgba(255,255,255,0.02)';
                      el.style.border = '1px solid rgba(255,255,255,0.05)';
                      el.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Flag */}
                  <span className="text-2xl leading-none shrink-0">{opt.flag}</span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: isActive ? '#00EBFF' : '#C0B8B8' }}
                    >
                      {opt.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#5A6677' }}>
                      {opt.currency}
                      {matchedCurrency ? ` · ${matchedCurrency.symbol}` : ''}
                    </div>
                  </div>

                  {/* Active check */}
                  {isActive && (
                    <span
                      className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full"
                      style={{ background: '#00EBFF' }}
                    >
                      <Check className="w-3 h-3" style={{ color: '#080808' }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <div
          className="px-6 py-3 text-center shrink-0"
          style={{ borderTop: '1px solid rgba(0,235,255,0.08)' }}
        >
          <p className="text-[11px]" style={{ color: '#3A4455' }}>
            Exchange rates are approximate. Currency preference saves automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
