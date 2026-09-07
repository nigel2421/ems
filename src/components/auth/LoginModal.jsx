import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export const LoginModal = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="modal-overlay" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', zIndex: 1000 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '480px', 
          padding: '2.25rem', 
          borderRadius: '24px', 
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-main)',
          background: 'var(--bg-surface-card)',
          position: 'relative'
        }}
      >
        {/* Top Right Corner Theme Switcher */}
        <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
          <ThemeSwitcher compact={true} />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '16px', 
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid var(--border-glow)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}
          >
            <Shield style={{ width: '28px', height: '28px', color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
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
              color: '#EF4444', 
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Mail style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
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
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Lock style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
              <span>Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: '2.6rem', width: '100%' }}
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide Password' : 'Show Password'}
                aria-label={showPassword ? 'Hide Password' : 'Show Password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? (
                  <EyeOff style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
                ) : (
                  <Eye style={{ width: '18px', height: '18px' }} />
                )}
              </button>
            </div>
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
              marginTop: '0.35rem',
              minHeight: '48px'
            }}
          >
            {isSubmitting ? 'Authenticating Session...' : 'Sign In to Portal'}
            <ArrowRight style={{ width: '18px', height: '18px' }} />
          </button>
        </form>

        <div style={{ marginTop: '1.35rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <ShieldCheck style={{ width: '14px', height: '14px', color: 'var(--accent-success)' }} />
          <span>Active Session Security & Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
