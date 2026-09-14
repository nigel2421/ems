import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  MapPin,
  Vote,
  BadgeCheck
} from 'lucide-react';
import './LoginPage.css';

const CommissionMark = () => (
  <svg viewBox="0 0 40 40" className="auth-mark" aria-hidden="true">
    <rect width="40" height="40" rx="8" fill="#0A3D28" />
    <rect x="8" y="8" width="24" height="5" fill="#141414" />
    <rect x="8" y="13" width="24" height="2" fill="#F4F1EA" />
    <rect x="8" y="15" width="24" height="8" fill="#BB0A21" />
    <rect x="8" y="23" width="24" height="2" fill="#F4F1EA" />
    <rect x="8" y="25" width="24" height="7" fill="#006B3F" />
    <path
      d="M20 11.2l1.55 4.76h5.01l-4.05 2.94 1.55 4.76L20 20.72l-4.06 2.94 1.55-4.76-4.05-2.94h5.01z"
      fill="#C9A227"
    />
  </svg>
);

export const LoginModal = () => {
  const { login, users } = useAuth();
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

  const handleWorkspaceSelect = (user) => {
    setEmail(user.email);
    setPassword(user.password || '');
    setError('');
  };

  return (
    <div className="auth-shell">
      <div className="auth-flag" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="auth-layout">
        <aside className="auth-brand">
          <div>
            <div className="auth-brand-kicker">Republic of Kenya</div>
            <CommissionMark />
            <h1>
              Independent Electoral and Boundaries Commission
              <span>Election Management System</span>
            </h1>
            <p className="auth-brand-copy">
              Secure access for authorised officers managing polling intelligence,
              field operations, and election-day results.
            </p>
            <ul className="auth-points">
              <li>
                <MapPin strokeWidth={1.75} />
                National coverage across 47 counties
              </li>
              <li>
                <Vote strokeWidth={1.75} />
                Results, agents, and station intelligence
              </li>
              <li>
                <BadgeCheck strokeWidth={1.75} />
                Role-based access and session controls
              </li>
            </ul>
          </div>
          <div className="auth-brand-foot">IEBC · Official election operations portal</div>
        </aside>

        <main className="auth-panel">
          <div className="auth-panel-top">
            <ThemeSwitcher compact={true} />
          </div>

          <form className="auth-card" onSubmit={handleSubmit}>
            <h2>Sign in</h2>
            <p className="auth-lead">Use your provisioned officer credentials to continue.</p>

            {error && (
              <div className="auth-alert" role="alert">
                <AlertCircle strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            )}

            {users?.length > 0 && (
              <div className="auth-workspaces">
                <div className="auth-workspaces-label">Workspace</div>
                <div className="auth-workspaces-row">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className={`auth-chip${email === user.email ? ' is-active' : ''}`}
                      onClick={() => handleWorkspaceSelect(user)}
                    >
                      {user.role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">
                <Mail strokeWidth={1.75} />
                Official email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="username"
                placeholder="name@iebc.or.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">
                <Lock strokeWidth={1.75} />
                Password
              </label>
              <div className="auth-password">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter password"
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
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Continue'}
              <ArrowRight strokeWidth={1.75} />
            </button>

            <div className="auth-secure">
              <ShieldCheck strokeWidth={1.75} />
              Encrypted session · authorised officers only
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
