import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCryptoPrices } from '../contexts/CryptoPriceContext';

export default function PriceTicker() {
  const { prices } = useCryptoPrices();

  const displayPrices = Object.values(prices).slice(0, 8);

  if (displayPrices.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0a0a0a] border-b border-bitget-cyan/20 overflow-hidden">
      <div className="animate-ticker flex space-x-8 py-3">
        {[...displayPrices, ...displayPrices].map((crypto, index) => (
          <div key={index} className="flex items-center space-x-2 whitespace-nowrap">
            <span className="text-bitget-cyan font-bold">{crypto.symbol}</span>
            <span className="text-white font-semibold">
              {crypto.price_usd >= 1000
                ? `$${crypto.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : crypto.price_usd >= 1
                ? `$${crypto.price_usd.toFixed(2)}`
                : crypto.price_usd >= 0.01
                ? `$${crypto.price_usd.toFixed(4)}`
                : `$${crypto.price_usd.toFixed(8)}`
              }
            </span>
            <span className={`flex items-center text-sm ${crypto.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {crypto.price_change_24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(crypto.price_change_24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
