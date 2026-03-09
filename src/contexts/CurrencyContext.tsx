import { createContext, useContext, useState, ReactNode } from 'react';

type Currency = {
  code: string;
  symbol: string;
  rate: number;
};

const currencies: Currency[] = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'JPY', symbol: '¥', rate: 149.50 },
  { code: 'CNY', symbol: '¥', rate: 7.24 },
  { code: 'KRW', symbol: '₩', rate: 1308.50 },
  { code: 'INR', symbol: '₹', rate: 83.12 },
  { code: 'AUD', symbol: 'A$', rate: 1.52 },
  { code: 'CAD', symbol: 'C$', rate: 1.36 },
  { code: 'CHF', symbol: 'Fr', rate: 0.88 },
  { code: 'RUB', symbol: '₽', rate: 92.50 },
  { code: 'BRL', symbol: 'R$', rate: 4.97 },
  { code: 'MXN', symbol: 'Mex$', rate: 17.15 },
  { code: 'TRY', symbol: '₺', rate: 28.75 },
  { code: 'AED', symbol: 'د.إ', rate: 3.67 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (code: string) => void;
  convert: (amount: number) => number;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]);

  const setCurrency = (code: string) => {
    const newCurrency = currencies.find(c => c.code === code);
    if (newCurrency) {
      setCurrencyState(newCurrency);
    }
  };

  const convert = (amount: number): number => {
    return amount * currency.rate;
  };

  const formatAmount = (amount: number): string => {
    const converted = convert(amount);
    return `${currency.symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export { currencies };
