import React, { useCallback, useEffect, useState } from 'react';
import { Newspaper, RefreshCw, ExternalLink, AlertTriangle, X } from 'lucide-react';
import {
  fetchKenyaPoliticalNewsLast24h,
  readNewsCache,
  formatNewsTime,
  hoursAgoLabel,
  KENYA_POLITICAL_FEEDS
} from '../../services/kenyaPoliticalNews';
import './KenyaPoliticalNews.css';

export const KenyaPoliticalNewsPanel = ({
  items = [],
  loading = false,
  fetchedAt = null,
  errors = [],
  loadError = '',
  onRefresh
}) => (
  <article className="psi-panel psi-news-panel">
    <div className="psi-panel-head psi-news-head">
      <div>
        <h2>
          <Newspaper strokeWidth={1.75} />
          Kenya political news · last 24 hours
        </h2>
        <p>
          Mainstream desk feed from {KENYA_POLITICAL_FEEDS.map((f) => f.source).join(', ')}. Only
          stories published in the past day are shown.
        </p>
      </div>
      {onRefresh ? (
        <button type="button" className="admin-btn admin-btn-ghost" onClick={onRefresh} disabled={loading}>
          <RefreshCw strokeWidth={1.75} className={loading ? 'psi-spin' : undefined} />
          Refresh
        </button>
      ) : null}
    </div>

    {fetchedAt && (
      <p className="psi-news-meta">
        Updated {formatNewsTime(fetchedAt)} · {items.length} headline{items.length === 1 ? '' : 's'}
        {errors.length ? ` · ${errors.length} source(s) unreachable` : ''}
      </p>
    )}

    {loading && !items.length ? (
      <div className="admin-empty">Fetching latest political headlines…</div>
    ) : null}

    {!loading && loadError ? (
      <div className="psi-news-error">
        <AlertTriangle strokeWidth={1.75} />
        <span>{loadError}</span>
      </div>
    ) : null}

    {!loading && !loadError && items.length === 0 ? (
      <div className="admin-empty">
        No mainstream political headlines published in the last 24 hours. Check back later.
      </div>
    ) : null}

    <div className="psi-news-list">
      {items.map((story) => (
        <a
          key={story.id}
          className="psi-news-card"
          href={story.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="psi-news-card-top">
            <span className="psi-news-source">{story.source}</span>
            <span className="psi-news-age">{hoursAgoLabel(story.publishedAt)}</span>
          </div>
          <strong>{story.title}</strong>
          {story.summary ? <p>{story.summary}</p> : null}
          <span className="psi-news-foot">
            {formatNewsTime(story.publishedAt)}
            <ExternalLink strokeWidth={1.75} />
          </span>
        </a>
      ))}
    </div>
  </article>
);

/** Global floating News control — middle-right on every authenticated page. */
export const KenyaPoliticalNewsFab = () => {
  const cached = typeof window !== 'undefined' ? readNewsCache() : null;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(!(cached?.items?.length > 0));
  const [items, setItems] = useState(cached?.items || []);
  const [fetchedAt, setFetchedAt] = useState(cached?.fetchedAt || null);
  const [errors, setErrors] = useState(cached?.errors || []);
  const [loadError, setLoadError] = useState('');

  const applyResult = useCallback((result) => {
    if (result.items?.length) {
      setItems(result.items);
      setLoadError('');
    }
    if (result.fetchedAt) setFetchedAt(result.fetchedAt);
    if (Array.isArray(result.errors)) setErrors(result.errors);
  }, []);

  const load = useCallback(
    async ({ force = false } = {}) => {
      setLoading(true);
      setLoadError('');
      try {
        const result = await fetchKenyaPoliticalNewsLast24h({
          force,
          onPartial: applyResult
        });
        applyResult(result);
        if (!result.items.length && result.errors?.length === result.sourcesTried) {
          setLoadError('Could not reach mainstream news feeds. Check your connection and try again.');
        }
      } catch (err) {
        setLoadError(err?.message || 'Failed to load political news');
      } finally {
        setLoading(false);
      }
    },
    [applyResult]
  );

  useEffect(() => {
    load({ force: false });
    const timer = setInterval(() => load({ force: true }), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const count = items.length;
  const countLabel = loading && !count ? '…' : String(count);

  return (
    <>
      <button
        type="button"
        className={`psi-news-fab${open ? ' is-open' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={`Open Kenya political news, ${count} headlines in the last 24 hours`}
      >
        <Newspaper strokeWidth={1.75} />
        <span className="psi-news-fab-copy">
          <strong>News</strong>
          <small>Last 24h</small>
        </span>
        <em className="psi-news-fab-count" aria-live="polite">
          {countLabel}
        </em>
      </button>

      {open && (
        <div className="psi-news-drawer-overlay" onClick={() => setOpen(false)}>
          <aside
            className="psi-news-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Kenya political news last 24 hours"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="psi-news-drawer-bar">
              <div>
                <strong>Political news</strong>
                <span>
                  Mainstream Kenya · last 24 hours · {count} headline{count === 1 ? '' : 's'}
                </span>
              </div>
              <button
                type="button"
                className="psi-icon-action"
                onClick={() => setOpen(false)}
                aria-label="Close news"
              >
                <X strokeWidth={1.75} />
              </button>
            </div>
            <div className="psi-news-drawer-body">
              <KenyaPoliticalNewsPanel
                items={items}
                loading={loading}
                fetchedAt={fetchedAt}
                errors={errors}
                loadError={loadError}
                onRefresh={() => load({ force: true })}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
