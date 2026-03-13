import { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'vantix_maintenance_dismissed';

export default function MaintenanceModal() {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setShow(true));
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setShow(false);
    setTimeout(() => setVisible(false), 350);
    sessionStorage.setItem(STORAGE_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          background: 'rgba(8,8,8,0.92)',
          border: '1px solid rgba(0,235,255,0.35)',
          boxShadow: '0 0 40px rgba(0,235,255,0.08), 0 24px 60px rgba(0,0,0,0.7)',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          padding: '32px',
          position: 'relative',
          transform: show ? 'scale(1)' : 'scale(0.95)',
          opacity: show ? 1 : 0,
          transition: 'transform 500ms cubic-bezier(0.16,1,0.3,1), opacity 500ms ease',
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close announcement"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0,235,255,0.08)',
            border: '1px solid rgba(0,235,255,0.2)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#C0B8B8',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,235,255,0.18)';
            (e.currentTarget as HTMLButtonElement).style.color = '#00EBFF';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,235,255,0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = '#C0B8B8';
          }}
          onFocus={e => { (e.currentTarget as HTMLButtonElement).style.outline = '2px solid #00EBFF'; }}
          onBlur={e => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; }}
        >
          <X size={15} />
        </button>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(0,235,255,0.08)',
            border: '1px solid rgba(0,235,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={28} color="#00EBFF" />
          </div>
        </div>

        {/* Headline */}
        <h2
          id="modal-title"
          style={{
            color: '#F5F5F0',
            fontWeight: 700,
            fontSize: '18px',
            textAlign: 'center',
            marginBottom: '16px',
            letterSpacing: '-0.01em',
          }}
        >
          System Maintenance & Security Optimization
        </h2>

        {/* Iridescent divider */}
        <div style={{
          height: '2px',
          borderRadius: '2px',
          background: 'linear-gradient(90deg, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66)',
          marginBottom: '16px',
        }} />

        {/* Body */}
        <p style={{ color: '#C0B8B8', fontSize: '14px', lineHeight: '1.65', marginBottom: '16px' }}>
          Vantix Pro is currently undergoing critical bug fixes and essential security infrastructure
          upgrades to ensure a superior trading experience.
        </p>
        <p style={{ color: '#C0B8B8', fontSize: '14px', lineHeight: '1.65', marginBottom: '20px' }}>
          You may experience minor service <em>hiccups</em> or data latency during this window. We
          anticipate full stability by{' '}
          <span style={{ color: '#F5F5F0', fontWeight: 600 }}>March 14, 2026 – 11:00 PM (GMT+1)</span>.
        </p>

        {/* Security note */}
        <div style={{
          background: 'rgba(0,235,255,0.06)',
          border: '1px solid rgba(0,235,255,0.2)',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '24px',
        }}>
          <p style={{ color: '#00EBFF', fontSize: '13px', fontWeight: 600, margin: 0 }}>
            🔒 Security Note:{' '}
            <span style={{ color: '#F5F5F0', fontWeight: 400 }}>
              Your personal data and digital assets remain fully secured and unaffected by these updates.
            </span>
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={dismiss}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(0,235,255,0.35)',
            background: 'rgba(0,235,255,0.10)',
            color: '#00EBFF',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,235,255,0.18)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,235,255,0.10)'; }}
          onFocus={e => { (e.currentTarget as HTMLButtonElement).style.outline = '2px solid #00EBFF'; }}
          onBlur={e => { (e.currentTarget as HTMLButtonElement).style.outline = 'none'; }}
        >
          I Understand — Continue to App
        </button>
      </div>
    </div>
  );
}
