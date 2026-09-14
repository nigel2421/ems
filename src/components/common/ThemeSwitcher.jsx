import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeSwitcher = ({ compact = false, className = '' }) => {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor }
  ];

  return (
    <div 
      className={`theme-switcher-pill ${className}`}
      role="radiogroup"
      aria-label="Color Theme Switcher"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-full)',
        padding: '3px',
        gap: '2px'
      }}
    >
      {options.map((opt) => {
        const IconComp = opt.icon;
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.id)}
            title={`Switch to ${opt.label} Theme`}
            aria-label={`${opt.label} Theme`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? '0' : '0.35rem',
              padding: compact ? '0.35rem' : '0.35rem 0.65rem',
              minWidth: compact ? '36px' : 'auto',
              minHeight: '36px',
              borderRadius: 'var(--radius-full)',
              border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
              background: isActive ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: isActive ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <IconComp style={{ width: '14px', height: '14px', flexShrink: 0, stroke: 'currentColor', fill: 'none' }} />
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
