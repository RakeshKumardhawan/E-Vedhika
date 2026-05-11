import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';

// Automatically check for updates and update the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.update();
    }
  });

  registerSW({
    immediate: true,
    onNeedRefresh() {
      if (confirm('E-Vedhika కొత్త అప్‌డేట్ మరియు కొత్త లోగో వచ్చింది! యాప్ ను రీస్టార్ట్ చేయమంటారా? (New update available, refresh now?)')) {
        window.location.reload();
      }
    }
  });
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, countdown: number}> {
  private timer: any;
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, countdown: 5 };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, countdown: 5 };
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
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d3b66', color: '#fff', fontFamily: 'Poppins, sans-serif', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'spin 4s linear infinite' }}>🤖</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px', color: '#fbbf24' }}>E-Vedhika Auto Recovery Bot</h1>
          <p style={{ fontSize: '16px', maxWidth: '400px', lineHeight: '1.6', marginBottom: '20px', color: '#e2e8f0' }}>హలో! సిస్టమ్‌లో చిన్న లోపం (Error) వచ్చింది. నేను దాన్ని క్లియర్ చేసి మరల స్టార్ట్ చేస్తున్నాను... దయచేసి వేచి ఉండండి.</p>
          <div style={{ padding: '15px 30px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold' }}>
            రీస్టార్ట్ అవుతోంది... {this.state.countdown}s
          </div>
          <button onClick={() => window.location.href = '/'} style={{ marginTop: '30px', background: '#fbbf24', color: '#0d3b66', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ఇప్పుడే రిఫ్రెష్ చెయ్యండి (Refresh Now)</button>
          
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            body { margin: 0; background: #0d3b66; overflow: hidden; }
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
