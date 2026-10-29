import React from 'react';
import { Clock, ShieldAlert, LogOut } from 'lucide-react';

export const IdleTimeoutModal = ({ secondsLeft, onStayActive, onLogout }) => {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-modal-title"
        aria-describedby="idle-modal-desc"
        style={{
          maxWidth: '480px',
          background: 'var(--bg-panel, #0D1F17)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          padding: '2rem',
          borderRadius: '16px',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(230, 159, 0, 0.15)',
            color: '#E69F00',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <Clock size={32} strokeWidth={2} />
        </div>

        <h3
          id="idle-modal-title"
          style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main, #fff)' }}
        >
          Session Timeout Warning
        </h3>

        <p
          id="idle-modal-desc"
          style={{ fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '1.5rem', lineHeight: 1.5 }}
        >
          You have been inactive. For election operational security, your session will automatically terminate in:
        </p>

        <div
          style={{
            fontSize: '2.5rem',
            fontFamily: 'monospace',
            fontWeight: 900,
            color: '#E69F00',
            marginBottom: '1.75rem',
            letterSpacing: '2px'
          }}
        >
          {minutes}:{seconds}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLogout}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
          >
            <LogOut size={16} />
            Sign Out Now
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStayActive}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#006B3F',
              borderColor: '#006B3F',
              color: '#fff',
              fontWeight: 700
            }}
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
};
