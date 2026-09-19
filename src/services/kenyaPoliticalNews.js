/**
 * Fast Kenyan political headlines (last 24 hours).
 * Short timeouts, parallel proxy race, and local cache for instant UI.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const FETCH_MS = 4000;
const CACHE_KEY = 'ems_kenya_political_news_v2';
const CACHE_TTL_MS = 3 * 60 * 1000;

/** Fast, reliable mainstream feeds only (slow/flaky sources dropped). */
export const KENYA_POLITICAL_FEEDS = [
  {
    source: 'The Standard',
    url: 'https://www.standardmedia.co.ke/rss/politics.php',
    politicalOnly: false
  },
  {
    source: 'Capital FM',
    url: 'https://www.capitalfm.co.ke/news/feed/',
    politicalOnly: true
  }
];

const POLITICAL_RE =
  /\b(politics?|political|parliament|senate|national assembly|iebc|election|campaign|governor|senator|\bmp\b|\bmca\b|cabinet|ruto|raila|gachagua|karua|\buda\b|\bodm\b|azimio|kenya kwanza|wiper|jubilee|ford kenya|dap-?k|coalition|nomination|ballot|form 34|state house|county assembly|impeach|byelection|by-election|kanu|anc)\b/i;

const KENYA_RE =
  /\b(kenya|nairobi|mombasa|kisumu|nakuru|eldoret|nyeri|kakamega|kiambu|machakos|meru|garissa|kitale|thika|ruto|raila|gachagua|iebc|uda|odm|azimio|kenya kwanza|wiper|jubilee)\b/i;

const isPoliticalStory = (title = '', description = '') =>
  POLITICAL_RE.test(`${title} ${description}`);

const isKenyaRelevant = (title = '', description = '', source = '') => {
  if (source === 'The Standard') return true;
  return KENYA_RE.test(`${title} ${description}`);
};

const parseDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const stripHtml = (html = '') =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const decodeXml = (value = '') =>
  String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const extractTag = (block, tag) => {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    'i'
  );
  const match = block.match(re);
  return decodeXml((match?.[1] || match?.[2] || '').trim());
};

const parseRssXml = (xml = '') => {
  const items = [];
  const chunks = String(xml).match(/<item[\s\S]*?<\/item>/gi) || [];
  chunks.forEach((chunk) => {
    items.push({
      title: extractTag(chunk, 'title'),
      description: extractTag(chunk, 'description') || extractTag(chunk, 'content:encoded'),
      link: extractTag(chunk, 'link'),
      pubDate: extractTag(chunk, 'pubDate') || extractTag(chunk, 'dc:date'),
      guid: extractTag(chunk, 'guid') || extractTag(chunk, 'link')
    });
  });
  return items;
};

const withTimeout = (ms) => AbortSignal.timeout(ms);

async function fetchRssViaRss2Json(feedUrl, ms = FETCH_MS) {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const res = await fetch(endpoint, { signal: withTimeout(ms) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error(data.message || 'Feed unavailable');
  }
  return data.items;
}

async function fetchRssViaAllOrigins(feedUrl, ms = FETCH_MS) {
  const endpoint = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
  const res = await fetch(endpoint, { signal: withTimeout(ms) });
  if (!res.ok) throw new Error(`Proxy ${res.status}`);
  const xml = await res.text();
  const items = parseRssXml(xml);
  if (!items.length) throw new Error('Empty feed');
  return items;
}

/** Race both proxies — first success wins (cap ~4s). */
async function fetchFeedItems(feedUrl) {
  return Promise.any([fetchRssViaRss2Json(feedUrl), fetchRssViaAllOrigins(feedUrl)]);
}

const normaliseItems = (rawItems, feed, cutoff) => {
  const out = [];
  rawItems.forEach((item) => {
    const published = parseDate(item.pubDate);
    if (!published || published.getTime() < cutoff) return;

    const title = stripHtml(item.title || '');
    const description = stripHtml(item.description || item.content || '');
    if (!title) return;
    if (feed.politicalOnly && !isPoliticalStory(title, description)) return;
    if (!isKenyaRelevant(title, description, feed.source)) return;

    out.push({
      id: `${feed.source}-${item.guid || item.link || title}`,
      title,
      summary: description.slice(0, 220) + (description.length > 220 ? '…' : ''),
      link: item.link || item.url || '#',
      source: feed.source,
      publishedAt: published.toISOString(),
      publishedMs: published.getTime()
    });
  });
  return out;
};

const dedupeSort = (collected) => {
  const seen = new Set();
  return collected
    .filter((story) => {
      const key = story.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.publishedMs - a.publishedMs);
};

export const readNewsCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.items || !parsed?.cachedAt) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeNewsCache = (payload) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ...payload,
        cachedAt: Date.now()
      })
    );
  } catch {
    /* ignore quota */
  }
};

/**
 * @param {{ force?: boolean, onPartial?: (payload: object) => void }} [options]
 * @returns {Promise<{ items: Array, fetchedAt: string, sourcesTried: number, errors: string[], fromCache?: boolean }>}
 */
export async function fetchKenyaPoliticalNewsLast24h(options = {}) {
  const { force = false, onPartial } = options;
  const cached = readNewsCache();

  if (!force && cached?.items?.length && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      items: cached.items,
      fetchedAt: cached.fetchedAt || new Date(cached.cachedAt).toISOString(),
      sourcesTried: cached.sourcesTried || KENYA_POLITICAL_FEEDS.length,
      errors: cached.errors || [],
      fromCache: true
    };
  }

  // Serve stale cache immediately while a fresh fetch is requested by the UI.
  if (!force && cached?.items?.length && typeof onPartial === 'function') {
    onPartial({
      items: cached.items,
      fetchedAt: cached.fetchedAt || new Date(cached.cachedAt).toISOString(),
      sourcesTried: cached.sourcesTried || KENYA_POLITICAL_FEEDS.length,
      errors: cached.errors || [],
      fromCache: true
    });
  }

  const cutoff = Date.now() - DAY_MS;
  const errors = [];
  const collected = [];

  await Promise.all(
    KENYA_POLITICAL_FEEDS.map(async (feed) => {
      try {
        const raw = await fetchFeedItems(feed.url);
        const mapped = normaliseItems(raw, feed, cutoff);
        collected.push(...mapped);
        if (typeof onPartial === 'function' && mapped.length) {
          onPartial({
            items: dedupeSort([...collected]),
            fetchedAt: new Date().toISOString(),
            sourcesTried: KENYA_POLITICAL_FEEDS.length,
            errors: [...errors],
            partial: true
          });
        }
      } catch (err) {
        const reason = err?.errors?.[0]?.message || err?.message || 'failed';
        errors.push(`${feed.source}: ${reason}`);
      }
    })
  );

  const items = dedupeSort(collected);
  const payload = {
    items,
    fetchedAt: new Date().toISOString(),
    sourcesTried: KENYA_POLITICAL_FEEDS.length,
    errors,
    fromCache: false
  };

  if (items.length) writeNewsCache(payload);
  return payload;
}

export const formatNewsTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short'
  });
};

export const hoursAgoLabel = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hrs = Math.max(0, Math.round((Date.now() - d.getTime()) / (60 * 60 * 1000)));
  if (hrs < 1) return 'Just now';
  if (hrs === 1) return '1 hour ago';
  return `${hrs} hours ago`;
};
