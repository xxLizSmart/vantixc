import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function SupportChat() {
  const [showLabel, setShowLabel] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show the label after 3 seconds, auto-hide after 6 seconds
  useEffect(() => {
    const show = setTimeout(() => setShowLabel(true), 3000);
    const hide = setTimeout(() => setShowLabel(false), 9000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  return (
    <div
      className="fixed flex items-center gap-3"
      style={{ bottom: 88, right: 16, zIndex: 9999 }}
    >
      {/* "Having trouble?" label */}
      {showLabel && !dismissed && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap"
          style={{
            background: 'rgba(15,13,13,0.95)',
            border: '1px solid rgba(0,235,255,0.25)',
            color: '#F5F5F0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 16px rgba(0,235,255,0.08)',
            animation: 'slideInLabel 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <span>Having trouble? <span style={{ color: '#00EBFF' }}>Contact us</span></span>
          <button
            onClick={e => { e.preventDefault(); setDismissed(true); }}
            className="flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 transition-colors"
            style={{ color: '#5A6677' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5A6677')}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating button */}
      <a
        href="https://direct.lc.chat/19575289/"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 52,
          height: 52,
          background: 'linear-gradient(135deg, #00EBFF 0%, #00b8cc 100%)',
          boxShadow: '0 0 0 3px rgba(0,235,255,0.2), 0 0 24px rgba(0,235,255,0.45), 0 8px 24px rgba(0,0,0,0.4)',
          textDecoration: 'none',
          animation: 'floatBounce 3s ease-in-out infinite',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,235,255,0.35), 0 0 36px rgba(0,235,255,0.65), 0 8px 24px rgba(0,0,0,0.4)';
          e.currentTarget.style.animationPlayState = 'paused';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,235,255,0.2), 0 0 24px rgba(0,235,255,0.45), 0 8px 24px rgba(0,0,0,0.4)';
          e.currentTarget.style.animationPlayState = 'running';
        }}
      >
        <MessageCircle className="w-5 h-5" style={{ color: '#080808' }} />

        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-full"
          style={{ animation: 'pulseRing 2.5s ease-out infinite', border: '2px solid rgba(0,235,255,0.6)' }}
        />
      </a>

      <style>{`
        @keyframes floatBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes slideInLabel {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
