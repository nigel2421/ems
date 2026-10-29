import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { ArrowRight, AlertCircle, Eye, EyeOff, ShieldAlert, Lock } from 'lucide-react';
import { formatRetry } from '../../utils/loginThrottle';
import './LoginPage.css';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const LoginModal = () => {
  const { login, logoutReason, clearLogoutReason, getAccountLockState } = useAuth();
  const { geography } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [isPermanentLock, setIsPermanentLock] = useState(false);

  // Check lock status for current email
  useEffect(() => {
    if (!email) {
      setLockCountdown(0);
      setIsPermanentLock(false);
      return;
    }
    const state = getAccountLockState(email);
    if (state.locked) {
      setIsPermanentLock(!!state.permanent);
      setLockCountdown(state.retryInMs ? Math.ceil(state.retryInMs / 1000) : 0);
    } else {
      setLockCountdown(0);
      setIsPermanentLock(false);
    }
  }, [email, getAccountLockState]);

  // Live countdown timer ticker for active temporary lock
  useEffect(() => {
    if (lockCountdown <= 0) return;
    const interval = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockCountdown]);

  const registerStats = useMemo(() => {
    const counties = geography?.counties || [];
    const stations = geography?.pollingStations || [];
    const totalVoters = counties.reduce((sum, county) => sum + (Number(county.registeredVoters) || 0), 0);
    const maxCountyVoters = Math.max(...counties.map((county) => Number(county.registeredVoters) || 0), 1);
    const bars = [...counties]
      .sort((a, b) => (Number(b.registeredVoters) || 0) - (Number(a.registeredVoters) || 0))
      .slice(0, 6)
      .map((county) => ({
        id: county.id,
        pct: Math.max(12, Math.round(((Number(county.registeredVoters) || 0) / maxCountyVoters) * 100))
      }));

    return {
      totalVoters,
      stationCount: stations.length,
      countyCount: counties.length,
      bars
    };
  }, [geography]);

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
    }, 280);
  };

  return (
    <div className="auth-shell">
      <div className="auth-frame">
        <aside className="auth-brand">
          <p className="auth-brand-kicker">
            Authorised officer access — polling operations, field reporting, and election-day results.
          </p>

          <h1>
            Election
            <span>Management</span>
          </h1>

          <div className="auth-device">
            <div className="auth-device-screen">
              <div className="auth-device-stat">{formatCount(registerStats.totalVoters)}</div>
              <div className="auth-device-label">Registered voters</div>
              <div className="auth-device-bars" aria-hidden="true">
                {registerStats.bars.map((bar) => (
                  <i key={bar.id} style={{ height: `${bar.pct}%` }} />
                ))}
              </div>
              <div className="auth-device-rows">
                <div className="auth-device-metric">
                  <strong>{formatCount(registerStats.stationCount)}</strong>
                  <span>Polling stations</span>
                </div>
                <div className="auth-device-metric">
                  <strong>{formatCount(registerStats.countyCount)}</strong>
                  <span>Counties</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="auth-panel">
          <header className="auth-panel-top">
            <div className="auth-wordmark">
              <span className="auth-wordmark-dot" />
              EMS
            </div>
            <ThemeSwitcher compact={true} />
          </header>

          <div className="auth-mobile-stats" aria-label="Register summary">
            <div>
              <strong>{formatCount(registerStats.totalVoters)}</strong>
              <span>Registered voters</span>
            </div>
            <div>
              <strong>{formatCount(registerStats.stationCount)}</strong>
              <span>Polling stations</span>
            </div>
            <div>
              <strong>{formatCount(registerStats.countyCount)}</strong>
              <span>Counties</span>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <h2>Sign In</h2>

            {logoutReason === 'inactivity' && (
              <div className="auth-alert" role="status" style={{ background: 'rgba(230, 159, 0, 0.15)', borderColor: '#E69F00', color: '#E69F00' }}>
                <AlertCircle strokeWidth={1.75} />
                <span>You were signed out after 15 minutes of inactivity for operational security.</span>
              </div>
            )}

            {isPermanentLock && (
              <div className="auth-alert" role="alert" style={{ background: 'rgba(187, 10, 33, 0.15)', borderColor: '#BB0A21', color: '#ff6b6b' }}>
                <Lock strokeWidth={1.75} />
                <span>Account locked after repeated failed sign-in attempts. Please contact a system administrator to restore access.</span>
              </div>
            )}

            {!isPermanentLock && lockCountdown > 0 && (
              <div className="auth-alert" role="alert" style={{ background: 'rgba(230, 159, 0, 0.15)', borderColor: '#E69F00', color: '#E69F00' }}>
                <ShieldAlert strokeWidth={1.75} />
                <span>Too many attempts. Sign in locked for <strong>{formatRetry(lockCountdown * 1000)}</strong>.</span>
              </div>
            )}

            {error && !isPermanentLock && lockCountdown <= 0 && (
              <div className="auth-alert" role="alert">
                <AlertCircle strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            )}

            <label className="auth-sr-only" htmlFor="auth-email">Official email</label>
            <input
              id="auth-email"
              className="auth-input"
              type="email"
              autoComplete="username"
              placeholder="Official email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (logoutReason) clearLogoutReason();
              }}
              required
            />

            <label className="auth-sr-only" htmlFor="auth-password">Password</label>
            <div className="auth-password">
              <input
                id="auth-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPermanentLock || lockCountdown > 0}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff strokeWidth={1.75} /> : <Eye strokeWidth={1.75} />}
              </button>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting || isPermanentLock || lockCountdown > 0}
            >
              {isSubmitting
                ? 'Signing in…'
                : isPermanentLock
                ? 'Account Locked'
                : lockCountdown > 0
                ? `Locked (${formatRetry(lockCountdown * 1000)})`
                : 'Sign In'}
              <ArrowRight strokeWidth={1.75} />
            </button>
          </form>

          {!import.meta.env?.PROD && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                DEMO PERSONAS (STAGING ONLY)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => { setEmail('admin.super@ems.go.ke'); setPassword('dev-local-only-password'); }}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('governor.nairobi@ems.go.ke'); setPassword('dev-local-only-password'); }}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', cursor: 'pointer' }}
                >
                  Gov Nairobi
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('mp.westlands@ems.go.ke'); setPassword('dev-local-only-password'); }}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', cursor: 'pointer' }}
                >
                  MP Westlands (Nairobi)
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('mp.nyali@ems.go.ke'); setPassword('dev-local-only-password'); }}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer' }}
                >
                  MP Nyali (Mombasa)
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('governor.mombasa@ems.go.ke'); setPassword('dev-local-only-password'); }}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer' }}
                >
                  Gov Mombasa
                </button>
              </div>
            </div>
          )}

          <footer className="auth-panel-foot">
            <span>Official election operations portal</span>
            <span>Authorised officers only</span>
          </footer>
        </main>
      </div>
    </div>
  );
};
