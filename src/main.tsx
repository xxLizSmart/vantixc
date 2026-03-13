import { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CryptoPriceProvider } from './contexts/CryptoPriceContext';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#1a1a1a', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32, fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</div>
          <div style={{ color: '#f87171', fontSize: 14, maxWidth: 500, textAlign: 'center', wordBreak: 'break-word' }}>
            {(this.state.error as Error).message}
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 24px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element #root not found in DOM');
  createRoot(rootElement).render(
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CryptoPriceProvider>
            <LanguageProvider>
              <CurrencyProvider>
                <App />
              </CurrencyProvider>
            </LanguageProvider>
          </CryptoPriceProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} catch (e) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="background:#1a1a1a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:32px;font-family:sans-serif;"><div style="font-size:48px">⚠️</div><div style="font-size:20px;font-weight:700">Startup Error</div><pre style="color:#f87171;background:#111;padding:16px;border-radius:8px;font-size:13px;max-width:600px;overflow:auto;word-break:break-word;">${String(e)}\n${e instanceof Error ? e.stack || '' : ''}</pre><button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;background:#0d9488;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:15px">Reload</button></div>`;
  }
}
