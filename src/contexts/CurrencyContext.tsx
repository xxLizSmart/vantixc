import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';

export type CurrencyCode =
  | 'USD' | 'GBP' | 'AED'
  | 'EUR'
  | 'TRY' | 'PLN' | 'UAH' | 'RON' | 'HUF' | 'CZK'
  | 'SEK' | 'RSD';

export interface CurrencyDef {
  code: CurrencyCode;
  symbol: string;
  rate: number;          // multiplier vs USD
  symbolAfter?: boolean; // e.g. "100 lei" vs "$100"
}

export const currencies: CurrencyDef[] = [
  { code: 'USD', symbol: '$',    rate: 1       },
  { code: 'GBP', symbol: '£',    rate: 0.79    },
  { code: 'AED', symbol: 'د.إ',  rate: 3.67    },
  { code: 'EUR', symbol: '€',    rate: 0.92    },
  { code: 'TRY', symbol: '₺',    rate: 32.10   },
  { code: 'PLN', symbol: 'zł',   rate: 3.98    },
  { code: 'UAH', symbol: '₴',    rate: 37.80   },
  { code: 'RON', symbol: 'lei',  rate: 4.58,  symbolAfter: true },
  { code: 'HUF', symbol: 'Ft',   rate: 363.50, symbolAfter: true },
  { code: 'CZK', symbol: 'Kč',   rate: 23.10,  symbolAfter: true },
  { code: 'SEK', symbol: 'kr',   rate: 10.45,  symbolAfter: true },
  { code: 'RSD', symbol: 'din.', rate: 108.50, symbolAfter: true },
];

// ── Context type ──────────────────────────────────────────────────────────────
interface CurrencyContextType {
  currency: CurrencyDef;
  setCurrency: (code: string) => void;
  convert: (amountUSD: number) => number;
  formatAmount: (amountUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'vantix_currency';

function findCurrency(code: string): CurrencyDef {
  return currencies.find(c => c.code === code) ?? currencies[0];
}

function getInitialCurrency(): CurrencyDef {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return findCurrency(saved);
  } catch { /* ignore */ }
  return currencies[0];
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyDef>(getInitialCurrency);

  // When locale changes, auto-switch to locale's default currency
  // (Only if user hasn't manually overridden — tracked by localStorage)
  const { locale } = useLanguage();
  useEffect(() => {
    const manual = localStorage.getItem(STORAGE_KEY);
    if (!manual) {
      // Auto-follow locale default
      setCurrencyState(findCurrency(locale.currency));
    }
  }, [locale.currency]);

  const setCurrency = (code: string) => {
    const next = findCurrency(code);
    setCurrencyState(next);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  };

  const convert = (amountUSD: number): number =>
    amountUSD * currency.rate;

  const formatAmount = (amountUSD: number): string => {
    const converted = convert(amountUSD);
    // Use locale-aware number formatting
    const localeStr = locale.numberLocale;
    const formatted = new Intl.NumberFormat(localeStr, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);

    return currency.symbolAfter
      ? `${formatted} ${currency.symbol}`
      : `${currency.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
}
