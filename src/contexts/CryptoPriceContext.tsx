import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface CryptoPrice {
  symbol: string;
  name: string;
  price_usd: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply: number;
  last_updated: string;
}

interface CryptoPriceContextType {
  prices: Record<string, CryptoPrice>;
  getPrice: (symbol: string) => number;
  getPriceFormatted: (symbol: string) => string;
  loading: boolean;
  error: string | null;
  refreshPrices: () => Promise<void>;
}

const CryptoPriceContext = createContext<CryptoPriceContextType | undefined>(undefined);

export function CryptoPriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_prices')
        .select('*');

      if (error) throw error;

      if (data) {
        const pricesMap: Record<string, CryptoPrice> = {};
        data.forEach((price) => {
          pricesMap[price.symbol] = price;
        });
        setPrices(pricesMap);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching crypto prices:', err);
      setError('Failed to fetch cryptocurrency prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    const channel = supabase
      .channel('crypto_prices_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crypto_prices',
        },
        () => {
          fetchPrices();
        }
      )
      .subscribe();

    const interval = setInterval(fetchPrices, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getPrice = (symbol: string): number => {
    return prices[symbol]?.price_usd || 0;
  };

  const getPriceFormatted = (symbol: string): string => {
    const price = getPrice(symbol);

    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(8)}`;
    }
  };

  const refreshPrices = async () => {
    setLoading(true);
    await fetchPrices();
  };

  return (
    <CryptoPriceContext.Provider
      value={{
        prices,
        getPrice,
        getPriceFormatted,
        loading,
        error,
        refreshPrices,
      }}
    >
      {children}
    </CryptoPriceContext.Provider>
  );
}

export function useCryptoPrices() {
  const context = useContext(CryptoPriceContext);
  if (context === undefined) {
    throw new Error('useCryptoPrices must be used within a CryptoPriceProvider');
  }
  return context;
}
