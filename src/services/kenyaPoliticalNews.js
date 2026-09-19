/**
 * Fetch Kenyan mainstream political headlines (last 24 hours).
 * Uses public RSS endpoints via rss2json, with an allorigins XML fallback.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const KENYA_POLITICAL_FEEDS = [
  {
    source: 'The Standard',
    url: 'https://www.standardmedia.co.ke/rss/politics.php',
    politicalOnly: false
  },
  {
    source: 'Nation Africa',
    url: 'https://nation.africa/kenya/rss',
    politicalOnly: true
  },
  {
    source: 'Capital FM',
    url: 'https://www.capitalfm.co.ke/news/feed/',
    politicalOnly: true
  },
  {
    source: 'Citizen Digital',
    url: 'https://www.citizen.digital/feed',
    politicalOnly: true
  },
  {
    source: 'The Star',
    url: 'https://www.the-star.co.ke/rss.xml',
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
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
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

async function fetchRssViaRss2Json(feedUrl) {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error(data.message || 'Feed unavailable');
  }
  return data.items;
}

async function fetchRssViaAllOrigins(feedUrl) {
  const endpoint = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(14000) });
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  const xml = await res.text();
  const items = parseRssXml(xml);
  if (!items.length) throw new Error('No RSS items in feed');
  return items;
}

async function fetchFeedItems(feedUrl) {
  try {
    return await fetchRssViaRss2Json(feedUrl);
  } catch {
    return fetchRssViaAllOrigins(feedUrl);
  }
}

/**
 * @returns {Promise<{ items: Array, fetchedAt: string, sourcesTried: number, errors: string[] }>}
 */
export async function fetchKenyaPoliticalNewsLast24h() {
  const cutoff = Date.now() - DAY_MS;
  const errors = [];
  const collected = [];

  await Promise.all(
    KENYA_POLITICAL_FEEDS.map(async (feed) => {
      try {
        const items = await fetchFeedItems(feed.url);
        items.forEach((item) => {
          const published = parseDate(item.pubDate);
          if (!published || published.getTime() < cutoff) return;

          const title = stripHtml(item.title || '');
          const description = stripHtml(item.description || item.content || '');
          if (!title) return;
          if (feed.politicalOnly && !isPoliticalStory(title, description)) return;
          if (!isKenyaRelevant(title, description, feed.source)) return;

          collected.push({
            id: `${feed.source}-${item.guid || item.link || title}`,
            title,
            summary: description.slice(0, 220) + (description.length > 220 ? '…' : ''),
            link: item.link || item.url || '#',
            source: feed.source,
            publishedAt: published.toISOString(),
            publishedMs: published.getTime()
          });
        });
      } catch (err) {
        errors.push(`${feed.source}: ${err?.message || 'failed'}`);
      }
    })
  );

  const seen = new Set();
  const unique = collected.filter((story) => {
    const key = story.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => b.publishedMs - a.publishedMs);

  return {
    items: unique,
    fetchedAt: new Date().toISOString(),
    sourcesTried: KENYA_POLITICAL_FEEDS.length,
    errors
  };
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
