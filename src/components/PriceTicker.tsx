import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCryptoPrices, formatCryptoPrice } from '../contexts/CryptoPriceContext';

export default function PriceTicker() {
  const { prices, loading } = useCryptoPrices();

  const coins = Object.values(prices);
  if (loading || coins.length === 0) return null;

  // Duplicate so the scroll loop is seamless
  const items = [...coins, ...coins];

  return (
    <div className="overflow-hidden" style={{ background: '#0a0808', borderBottom: '1px solid rgba(0,235,255,0.12)' }}>
      <div className="flex gap-8 py-2.5 animate-ticker whitespace-nowrap">
        {items.map((coin, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold" style={{ color: '#00EBFF' }}>{coin.symbol}</span>
            <span className="text-xs font-semibold" style={{ color: '#F5F5F0' }}>
              {formatCryptoPrice(coin.price_usd)}
            </span>
            <span
              className="flex items-center gap-0.5 text-xs font-medium"
              style={{ color: coin.price_change_24h >= 0 ? '#4ADE80' : '#EF4444' }}
            >
              {coin.price_change_24h >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {Math.abs(coin.price_change_24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 50s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
