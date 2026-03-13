// Real cryptocurrency icons via CDN
const BASE = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';

const ICON_MAP: Record<string, string> = {
  BTC:  `${BASE}/btc.svg`,
  ETH:  `${BASE}/eth.svg`,
  USDT: `${BASE}/usdt.svg`,
  USDC: `${BASE}/usdc.svg`,
  XRP:  `${BASE}/xrp.svg`,
  SOL:  `${BASE}/sol.svg`,
  BNB:  `${BASE}/bnb.svg`,
  ADA:  `${BASE}/ada.svg`,
};

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export default function CryptoIcon({ symbol, size = 32, className = '' }: CryptoIconProps) {
  const src = ICON_MAP[symbol.toUpperCase()];

  if (!src) {
    // Fallback: colored letter badge
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full font-bold text-xs ${className}`}
        style={{ width: size, height: size, background: 'rgba(0,235,255,0.12)', color: '#00EBFF', flexShrink: 0 }}
      >
        {symbol[0]}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => {
        // Fallback on load error
        const el = e.currentTarget;
        el.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.textContent = symbol[0];
        fallback.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:rgba(0,235,255,0.12);color:#00EBFF;font-weight:700;font-size:${Math.round(size * 0.38)}px;flex-shrink:0`;
        el.parentNode?.insertBefore(fallback, el);
      }}
    />
  );
}
