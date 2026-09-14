import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Sparkles, 
  Flag, 
  AlertCircle, 
  Maximize2, 
  Minimize2,
  CheckCircle2,
  Hourglass
} from 'lucide-react';
import { 
  calculateTimeRemaining, 
  DEFAULT_ELECTION_DATE, 
  ELECTION_MILESTONES 
} from '../../utils/countdownUtils.js';

export const ElectionCountdown = ({ 
  targetDate = DEFAULT_ELECTION_DATE, 
  title = "Next General Election",
  variant = "floating", // 'navbar' | 'floating' | 'card'
  className = "" 
}) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(targetDate));
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem('ems_countdown_minimized') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isClosed, setIsClosed] = useState(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);

  // Synchronize 1-second ticking countdown timer safely
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const toggleMinimize = (e) => {
    e?.stopPropagation();
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    try {
      localStorage.setItem('ems_countdown_minimized', String(nextState));
    } catch (err) {
      // localStorage fallback
    }
  };

  const formattedDate = useMemo(() => {
    try {
      return new Date(targetDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return "August 10, 2027";
    }
  }, [targetDate]);

  if (isClosed && variant === 'floating') {
    return null;
  }

  // --- NAVBAR VARIANT (Top Header Badge) ---
  if (variant === 'navbar') {
    return (
      <>
        <button
          onClick={() => setShowMilestonesModal(true)}
          className={`countdown-navbar-btn ${className}`}
          style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '9999px', padding: '0.3rem 0.65rem' }}
          title={`Election Day: ${formattedDate}. Click for Election Roadmap & Key Milestones`}
          aria-label={`Election Countdown: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds remaining`}
          role="timer"
          aria-live="polite"
        >
          <div className="countdown-pulse-dot"></div>
          <Clock style={{ width: '13px', height: '13px', color: '#F59E0B' }} />
          <span className="countdown-navbar-label">Election:</span>
          {timeLeft.isCompleted ? (
            <span className="countdown-navbar-value completed">Election Day!</span>
          ) : (
            <span className="countdown-navbar-value font-mono" style={{ color: '#FCD34D' }}>
              <strong className="text-amber">{timeLeft.days}d</strong> {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          )}
        </button>

        {showMilestonesModal && (
          <MilestonesModal 
            targetDate={targetDate} 
            timeLeft={timeLeft}
            onClose={() => setShowMilestonesModal(false)} 
          />
        )}
      </>
    );
  }

  // --- CARD VARIANT (Inline Dashboard Component) ---
  if (variant === 'card') {
    return (
      <div 
        className={`glass-card countdown-card ${className}`}
        style={{ background: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="countdown-pulse-dot"></div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formattedDate}</span>
        </div>

        {/* 4-Column Compact Grid */}
        <div className="countdown-grid" role="timer" aria-live="polite" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <div className="countdown-unit" style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.6rem 0.4rem', textAlign: 'center' }}>
            <div className="countdown-num font-mono" style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>{timeLeft.days}</div>
            <div className="countdown-lbl" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Days</div>
          </div>
          <div className="countdown-unit" style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.6rem 0.4rem', textAlign: 'center' }}>
            <div className="countdown-num font-mono" style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="countdown-lbl" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Hours</div>
          </div>
          <div className="countdown-unit" style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.6rem 0.4rem', textAlign: 'center' }}>
            <div className="countdown-num font-mono" style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="countdown-lbl" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Mins</div>
          </div>
          <div className="countdown-unit" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '8px', padding: '0.6rem 0.4rem', textAlign: 'center' }}>
            <div className="countdown-num font-mono" style={{ fontSize: '1.35rem', fontWeight: '800', color: '#F59E0B' }}>{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="countdown-lbl" style={{ fontSize: '0.65rem', color: '#FCD34D', textTransform: 'uppercase', fontWeight: '700' }}>Secs</div>
          </div>
        </div>

        <button 
          className="btn btn-secondary btn-sm" 
          style={{ width: '100%', marginTop: '0.85rem', fontSize: '0.78rem', minHeight: '40px', background: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}
          onClick={() => setShowMilestonesModal(true)}
        >
          <Calendar style={{ width: '13px', height: '13px', color: '#3B82F6' }} />
          View Election Roadmap & Milestones
        </button>

        {showMilestonesModal && (
          <MilestonesModal 
            targetDate={targetDate} 
            timeLeft={timeLeft}
            onClose={() => setShowMilestonesModal(false)} 
          />
        )}
      </div>
    );
  }

  // --- FLOATING VARIANT (Sticky Bottom Widget Container) ---
  return (
    <>
      <div 
        className={`countdown-floating-widget ${isMinimized ? 'minimized' : ''} ${className}`}
        role="timer"
        aria-live="polite"
        aria-label="Election Countdown Timer"
        style={{ background: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}
      >
        {isMinimized ? (
          <div className="countdown-minimized-bar" onClick={toggleMinimize} style={{ padding: '0.4rem 0.75rem', background: 'var(--bg-surface-card)' }}>
            <div className="countdown-pulse-dot"></div>
            <Clock style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#FCD34D' }}>
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </span>
            <button 
              className="countdown-icon-btn" 
              onClick={toggleMinimize} 
              title="Expand Countdown Widget"
            >
              <Maximize2 style={{ width: '12px', height: '12px' }} />
            </button>
          </div>
        ) : (
          <div className="countdown-expanded-content" style={{ padding: '0.75rem 0.85rem' }}>
            {/* Header / Controls */}
            <div className="countdown-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setShowMilestonesModal(true)}>
                <div className="countdown-pulse-dot"></div>
                <span className="countdown-title" style={{ color: 'var(--text-primary)', fontSize: '0.78rem' }}>{title}</span>
                <span className="countdown-date-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D' }}>Aug 10</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <button 
                  className="countdown-icon-btn" 
                  onClick={() => setShowMilestonesModal(true)}
                  title="View Election Roadmap & Milestones"
                >
                  <Calendar style={{ width: '13px', height: '13px' }} />
                </button>
                <button 
                  className="countdown-icon-btn" 
                  onClick={toggleMinimize}
                  title="Minimize Widget"
                >
                  <Minimize2 style={{ width: '13px', height: '13px' }} />
                </button>
                <button 
                  className="countdown-icon-btn close" 
                  onClick={() => setIsClosed(true)}
                  title="Dismiss Countdown Widget"
                >
                  <X style={{ width: '13px', height: '13px' }} />
                </button>
              </div>
            </div>

            {/* Timer Ticker Box */}
            <div className="countdown-body" onClick={() => setShowMilestonesModal(true)} style={{ paddingTop: '0.35rem' }}>
              {timeLeft.isCompleted ? (
                <div className="countdown-completed-banner">
                  <Flag style={{ width: '16px', height: '16px', color: '#10B981' }} />
                  <span>Election Day Has Arrived!</span>
                </div>
              ) : (
                <div className="countdown-digits-row font-mono">
                  <div className="digit-box" style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                    <span className="digit-val" style={{ color: 'var(--text-primary)' }}>{timeLeft.days}</span>
                    <span className="digit-lbl" style={{ color: 'var(--text-muted)' }}>DAYS</span>
                  </div>
                  <span className="digit-colon" style={{ color: 'var(--text-muted)' }}>:</span>
                  <div className="digit-box" style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                    <span className="digit-val" style={{ color: 'var(--text-primary)' }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="digit-lbl" style={{ color: 'var(--text-muted)' }}>HRS</span>
                  </div>
                  <span className="digit-colon" style={{ color: 'var(--text-muted)' }}>:</span>
                  <div className="digit-box" style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
                    <span className="digit-val" style={{ color: 'var(--text-primary)' }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="digit-lbl" style={{ color: 'var(--text-muted)' }}>MIN</span>
                  </div>
                  <span className="digit-colon" style={{ color: 'var(--text-muted)' }}>:</span>
                  <div className="digit-box highlight" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                    <span className="digit-val" style={{ color: '#F59E0B' }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="digit-lbl" style={{ color: '#FCD34D' }}>SEC</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showMilestonesModal && (
        <MilestonesModal 
          targetDate={targetDate} 
          timeLeft={timeLeft}
          onClose={() => setShowMilestonesModal(false)} 
        />
      )}
    </>
  );
};

// --- ELECTION ROADMAP & MILESTONES MODAL ---
const MilestonesModal = ({ targetDate, timeLeft, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        style={{ maxWidth: '640px', background: 'var(--bg-surface-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hourglass style={{ width: '20px', height: '20px', color: '#F59E0B' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>General Election Countdown & Roadmap</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Target Election Day: August 10th, 2027 (06:00 AM EAT)</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.3rem 0.5rem', background: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Live Ticker Hero Banner inside Modal */}
        <div className="glass-card" style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', textAlign: 'center', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#60A5FA' }}>
            TIME REMAINING UNTIL POLLS OPEN
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginTop: '0.5rem' }} className="font-mono">
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{timeLeft.days}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>DAYS</div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>:</div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{String(timeLeft.hours).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>HOURS</div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>:</div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>MINUTES</div>
            </div>
            <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>:</div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#F59E0B' }}>{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.68rem', color: '#FCD34D', fontWeight: '600' }}>SECONDS</div>
            </div>
          </div>
        </div>

        {/* Milestone Timeline List */}
        <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Flag style={{ width: '15px', height: '15px', color: '#06B6D4' }} />
          Key Campaign & Statutory Milestones
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ELECTION_MILESTONES.map((ms, index) => {
            const msRemaining = calculateTimeRemaining(ms.date);
            const isPast = msRemaining.isCompleted;

            return (
              <div 
                key={ms.id} 
                className="glass-card" 
                style={{ 
                  padding: '0.85rem 1rem', 
                  background: isPast ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-canvas)',
                  borderColor: isPast ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  borderRadius: '12px'
                }}
              >
                <div style={{ marginTop: '0.15rem' }}>
                  {isPast ? (
                    <CheckCircle2 style={{ width: '18px', height: '18px', color: '#10B981' }} />
                  ) : (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800', color: '#F59E0B' }}>
                      {index + 1}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.88rem', color: isPast ? '#10B981' : 'var(--text-primary)' }}>
                      {ms.title}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: isPast ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isPast ? '#059669' : '#F59E0B', fontWeight: '600' }}>
                      {isPast ? 'Completed' : `${msRemaining.days}d ${msRemaining.hours}h remaining`}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                    {ms.description}
                  </p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar style={{ width: '11px', height: '11px' }} />
                    Target: {new Date(ms.date).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ background: 'var(--bg-canvas)', borderColor: 'var(--border-subtle)' }}>
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElectionCountdown;
