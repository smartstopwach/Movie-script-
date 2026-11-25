import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 32,
            fontFamily: 'Inter, sans-serif',
            maxWidth: 480,
            margin: '60px auto',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: 8 }}>Movie Script Writer</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
            Something went wrong: {this.state.message}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#b45309',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset Studio & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
