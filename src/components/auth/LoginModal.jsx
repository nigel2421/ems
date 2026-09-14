import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

const formatCount = (value) => Number(value || 0).toLocaleString('en-KE');

export const LoginModal = () => {
  const { login } = useAuth();
  const { geography } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

            {error && (
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
              onChange={(e) => setEmail(e.target.value)}
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

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
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
