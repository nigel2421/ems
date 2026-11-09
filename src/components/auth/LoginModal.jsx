import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { ArrowRight, AlertCircle, Eye, EyeOff, ShieldAlert, Lock, Map, ShieldCheck, Users, ClipboardCheck } from 'lucide-react';
import { formatRetry } from '../../utils/loginThrottle';
import './LoginPage.css';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const LoginModal = ({ isAdminConsole = false }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password, { isAdminConsole });
      if (res && res.success) {
        if (res.redirectTo && typeof window !== 'undefined' && !window.location.pathname.endsWith(res.redirectTo)) {
          window.location.href = res.redirectTo;
          return;
        }
        if ((res.user?.role === 'Super Admin' || res.user?.role === 'Admin') &&
            typeof window !== 'undefined' &&
            !window.location.pathname.includes('admin.html')) {
          window.location.href = '/admin.html';
          return;
        }
      } else if (!res?.success) {
        setError(res?.error || 'Invalid email address or password credentials.');
        if (res?.locked) {
          setIsPermanentLock(!!res.permanent);
          if (res.retryInMs) setLockCountdown(Math.ceil(res.retryInMs / 1000));
        }
      }
    } catch {
      setError('An unexpected error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-frame">
        <aside className="auth-brand">
          <div className="auth-brand-heading">
            <div className="auth-brand-mark"><Map size={19} /></div>
            <div><strong>CI-EMS</strong><span>Election operations platform</span></div>
          </div>

          <div className="auth-brand-copy">
            <span className="auth-eyebrow">Campaign intelligence · Field operations · Results</span>
            <h1>One clear view of every election operation.</h1>
            <p>Coordinate teams, monitor polling readiness and review results through a secure command workspace.</p>
          </div>

          <div className="auth-preview" aria-label="Election operations overview">
            <div className="auth-preview-head">
              <div><span className="auth-live-dot" /><strong>National register</strong></div>
              <span>Kenya · 47 counties</span>
            </div>
            <div className="auth-preview-total">
              <strong>{formatCount(registerStats.totalVoters)}</strong>
              <span>registered voters</span>
            </div>
            <div className="auth-preview-chart" aria-hidden="true">
              {registerStats.bars.map((bar) => <i key={bar.id} style={{ height: `${bar.pct}%` }} />)}
            </div>
            <div className="auth-preview-foot">
              <span><Map size={14} /> {formatCount(registerStats.stationCount)} polling stations</span>
              <span><Users size={14} /> {formatCount(registerStats.countyCount)} counties</span>
            </div>
          </div>

          <div className="auth-capabilities">
            <span><ClipboardCheck size={15} /> Field readiness</span>
            <span><Map size={15} /> Geographic intelligence</span>
            <span><ShieldCheck size={15} /> Verified results</span>
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
            <span className="auth-form-kicker">Secure workspace</span>
            <h2>Welcome back</h2>
            <p className="auth-form-intro">Sign in with your authorised officer account to continue.</p>

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

          <footer className="auth-panel-foot">
            <span>Official election operations portal</span>
            <span>Authorised officers only</span>
          </footer>
        </main>
      </div>
    </div>
  );
};
