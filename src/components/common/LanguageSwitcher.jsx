import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Languages } from 'lucide-react';

export const LanguageSwitcher = ({ compact = false, className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const options = [
    { id: 'en', label: 'EN', fullLabel: 'English', flag: '🇬🇧' },
    { id: 'sw', label: 'SW', fullLabel: 'Kiswahili', flag: '🇰🇪' }
  ];

  return (
    <div
      className={`language-switcher-pill ${className}`}
      role="radiogroup"
      aria-label="Language Selector"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-canvas, rgba(0, 0, 0, 0.05))',
        border: '1px solid var(--border-color, rgba(0, 0, 0, 0.12))',
        borderRadius: '9999px',
        padding: '2px 4px',
        gap: '2px'
      }}
    >
      <Languages size={14} style={{ margin: '0 4px', opacity: 0.6 }} />
      {options.map((opt) => {
        const isActive = language === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setLanguage(opt.id)}
            title={`Switch to ${opt.fullLabel}`}
            aria-label={`${opt.fullLabel}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: compact ? '3px 7px' : '3px 9px',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'inherit',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              background: isActive ? 'var(--iebc-green, #006B3F)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-main, #475569)',
              boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.15)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <span>{opt.flag}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
