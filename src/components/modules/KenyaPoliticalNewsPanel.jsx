import React, { useCallback, useEffect, useState } from 'react';
import { Newspaper, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  fetchKenyaPoliticalNewsLast24h,
  formatNewsTime,
  hoursAgoLabel,
  KENYA_POLITICAL_FEEDS
} from '../../services/kenyaPoliticalNews';

export const KenyaPoliticalNewsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await fetchKenyaPoliticalNewsLast24h();
      setItems(result.items);
      setFetchedAt(result.fetchedAt);
      setErrors(result.errors || []);
      if (!result.items.length && result.errors?.length === result.sourcesTried) {
        setLoadError('Could not reach mainstream news feeds. Check your connection and try again.');
      }
    } catch (err) {
      setLoadError(err?.message || 'Failed to load political news');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  return (
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
        <button type="button" className="admin-btn admin-btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw strokeWidth={1.75} className={loading ? 'psi-spin' : undefined} />
          Refresh
        </button>
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
};
