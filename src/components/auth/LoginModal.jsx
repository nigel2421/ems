import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, KeyRound, UserCheck } from 'lucide-react';

export const LoginModal = () => {
  const { login, users } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(email, password);
      if (!res.success) {
        setError(res.error);
      }
      setIsSubmitting(false);
    }, 300);
  };

  const handleQuickSelect = (user) => {
    setEmail(user.email);
    setPassword(user.password || 'AdminSuper2026!');
    setError('');
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(5, 7, 15, 0.94)', backdropFilter: 'blur(16px)', zIndex: 1000 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '480px', 
          padding: '2.25rem', 
          borderRadius: '24px', 
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
          background: 'linear-gradient(145deg, rgba(20, 26, 45, 0.96) 0%, rgba(13, 17, 31, 0.99) 100%)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}
          >
            <Shield style={{ width: '28px', height: '28px', color: '#818cf8' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>
            IEBC EMS Secure Login
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Session Protection & Data Integrity Enforcement
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '12px', 
              padding: '0.75rem 1rem', 
              color: '#f87171', 
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Fill Account Presets */}
        {users && users.length > 0 && (
          <div style={{ marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#a5b4fc', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <KeyRound style={{ width: '13px', height: '13px' }} />
              <span>Available Provisioned Accounts</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    border: email === u.email ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: email === u.email ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: email === u.email ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <UserCheck style={{ width: '12px', height: '12px', color: '#818cf8' }} />
                  <span>{u.name.split(' ')[0]} ({u.role})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail style={{ width: '14px', height: '14px', color: '#a5b4fc' }} />
              <span>Registered Account Email</span>
            </label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. admin.super@ems.go.ke"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock style={{ width: '14px', height: '14px', color: '#a5b4fc' }} />
              <span>Password</span>
            </label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting}
            style={{ 
              padding: '0.85rem', 
              borderRadius: '12px', 
              fontSize: '0.95rem', 
              fontWeight: '700',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              marginTop: '0.35rem'
            }}
          >
            {isSubmitting ? 'Authenticating Session...' : 'Sign In to Portal'}
            <ArrowRight style={{ width: '18px', height: '18px' }} />
          </button>
        </form>

        <div style={{ marginTop: '1.35rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <ShieldCheck style={{ width: '14px', height: '14px', color: '#10b981' }} />
          <span>Active Session Security & Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
