import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

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

          <div className="auth-device" aria-hidden="true">
            <div className="auth-device-screen">
              <div className="auth-device-stat">22.3M</div>
              <div className="auth-device-label">Registered voters</div>
              <div className="auth-device-bars">
                <i style={{ height: '72%' }} />
                <i style={{ height: '46%' }} />
                <i style={{ height: '88%' }} />
                <i style={{ height: '38%' }} />
                <i style={{ height: '61%' }} />
                <i style={{ height: '54%' }} />
              </div>
              <div className="auth-device-rows">
                <span />
                <span />
                <span />
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
