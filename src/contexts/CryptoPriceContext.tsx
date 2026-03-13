import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ── Canonical name map (DB table has no name column) ─────────────────────────
export const COIN_NAMES: Record<string, string> = {
  BTC:  'Bitcoin',
  ETH:  'Ethereum',
  USDT: 'Tether',
  BNB:  'BNB',
  XRP:  'XRP',
  USDC: 'USD Coin',
  SOL:  'Solana',
  TRX:  'TRON',
  DOGE: 'Dogecoin',
  ADA:  'Cardano',
  BCH:  'Bitcoin Cash',
  LEO:  'LEO Token',
  HYPE: 'Hyperliquid',
  XMR:  'Monero',
  LINK: 'Chainlink',
  USDE: 'Ethena USDe',
  CC:   'Canton',
  DAI:  'Dai',
  XLM:  'Stellar',
  USD1: 'World Liberty Financial USD',
};

export interface CryptoPrice {
  symbol: string;
  name: string;
  price_usd: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
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

export function formatCryptoPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1)    return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

export function CryptoPriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, CryptoPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('crypto_prices')
        .select('*')
        .order('market_cap', { ascending: false });

      if (dbError) throw dbError;

      if (data) {
        const map: Record<string, CryptoPrice> = {};
        data.forEach(row => {
          map[row.symbol] = {
            ...row,
            name: COIN_NAMES[row.symbol] ?? row.symbol,
          };
        });
        setPrices(map);
        setError(null);
      }
    } catch (err: any) {
      console.error('[CryptoPriceContext] fetch error:', err?.message ?? err);
      setError('Failed to fetch cryptocurrency prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    const channel = supabase
      .channel('crypto_prices_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_prices' }, fetchPrices)
      .subscribe();

    const interval = setInterval(fetchPrices, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getPrice          = (symbol: string): number => prices[symbol]?.price_usd ?? 0;
  const getPriceFormatted = (symbol: string): string  => formatCryptoPrice(getPrice(symbol));
  const refreshPrices     = async () => { setLoading(true); await fetchPrices(); };

  return (
    <CryptoPriceContext.Provider value={{ prices, getPrice, getPriceFormatted, loading, error, refreshPrices }}>
      {children}
    </CryptoPriceContext.Provider>
  );
}

export function useCryptoPrices() {
  const context = useContext(CryptoPriceContext);
  if (!context) throw new Error('useCryptoPrices must be used within a CryptoPriceProvider');
  return context;
}
