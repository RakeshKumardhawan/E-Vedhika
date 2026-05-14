import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

// Automatically check for updates and update the service worker
if ('serviceWorker' in navigator) {
  let refreshing = false;
  
  // When the service worker updates and takes control, reload the page instantly
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  // Check for updates proactively when the app is resumed (opened again)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }
  });

  // Also check for updates every 5 minutes automatically in the background
  setInterval(() => {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration) {
        registration.update();
      }
    });
  }, 5 * 60 * 1000); // 5 minutes

  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Auto skip waiting and refresh - no confirmation needed
      // With registerType: 'autoUpdate', this is usually handled automatically, 
      // but if it ever triggers, we force a silent reload to ensure they get the update.
    }
  });
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, countdown: number}> {
  private timer: any;
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, countdown: 2 };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, countdown: 2 };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Auto-recovery mechanism
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach(name => caches.delete(name));
        });
      }
    } catch(e) {}

    this.timer = setInterval(() => {
      this.setState(s => {
        if (s.countdown <= 1) {
          clearInterval(this.timer);
          window.location.href = '/';
          return { ...s, countdown: 0 };
        }
        return { ...s, countdown: s.countdown - 1 };
      });
    }, 1000);
  }
  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px', textAlign: 'center' }}>
          <div style={{ padding: '40px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '48px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}>
              <span style={{ fontSize: '40px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🤖</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>E-Vedhika Auto Recovery</h1>
            <p style={{ fontSize: '16px', fontWeight: '500', lineHeight: '1.6', marginBottom: '24px', color: '#94a3b8' }}>
              హలో! సిస్టమ్‌లో చిన్న లోపం (Error) వచ్చింది. నేను దాన్ని క్లియర్ చేసి మరల స్టార్ట్ చేస్తున్నాను... దయచేసి వేచి ఉండండి.
            </p>
            <div style={{ padding: '16px 32px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: '800', color: '#60a5fa', marginBottom: '32px' }}>
              <div style={{ width: '8px', height: '8px', background: '#60a5fa', borderRadius: '50%', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              Restarting in {this.state.countdown}s...
            </div>
            <button 
              onClick={() => window.location.href = '/'} 
              style={{ width: '100%', background: '#fff', color: '#020617', border: 'none', padding: '18px 24px', borderRadius: '18px', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(255, 255, 255, 0.1)' }}
            >
              Refresh Now (వెంటనే రిఫ్రెష్ చెయ్యండి)
            </button>
          </div>
          
          <style>{`
            @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
            body { margin: 0; background: #020617; overflow: hidden; }
          `}</style>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
);
