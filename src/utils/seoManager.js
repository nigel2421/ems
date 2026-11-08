// ====================================================================
// CI-EMS DYNAMIC HEAD & SEO MANAGEMENT ENGINE
// Automatic indexing, canonical linking, OpenGraph/Twitter Cards,
// and Schema.org structured data synchronization for all modules.
// ====================================================================

export const PAGE_SEO_REGISTRY = {
  dashboard: {
    title: 'Operations Dashboard | CI-EMS Election Management System',
    description: 'Central operations command dashboard for Kenya 2027 General Elections. Real-time turnout, tallies, and operational status.',
    canonicalRoute: '',
    robots: 'index, follow',
    ogType: 'website',
    priority: 1.0,
    changefreq: 'always'
  },
  interactive_map: {
    title: 'Electoral Map Room & Geospatial Intelligence | CI-EMS',
    description: 'High-precision Kenya electoral map with 47 counties, 290 constituencies, live candidate lead choropleth, voter turnout, and Google satellite imagery.',
    canonicalRoute: '#/map',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.95,
    changefreq: 'hourly'
  },
  polling_stations: {
    title: 'Polling Station Intelligence & GPS Directory | CI-EMS',
    description: 'Directory and security risk assessment for 46,051 Kenyan polling stations across 290 constituencies with live voter capacity and agent assignments.',
    canonicalRoute: '#/polling-stations',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.9,
    changefreq: 'daily'
  },
  tally_center: {
    title: 'National Tally Operations & Results Certification | CI-EMS',
    description: 'Real-time Form 34A tabulation, candidate vote share certification, turnout verification, and forensic discrepancy checks for Kenya elections.',
    canonicalRoute: '#/tally-center',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.95,
    changefreq: 'always'
  },
  strategy: {
    title: 'Campaign Strategy, Roadmaps & Objectives | CI-EMS',
    description: 'Strategic victory roadmapping, department-level task mobilization, key milestones, and polling intelligence for election leadership.',
    canonicalRoute: '#/strategy',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.85,
    changefreq: 'daily'
  },
  strategy_team: {
    title: 'Campaign Organization & Strategy Team Directory | CI-EMS',
    description: 'Hierarchical campaign leadership structure, departmental rosters, security permissions, and strategic jurisdiction management.',
    canonicalRoute: '#/strategy-team',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.8,
    changefreq: 'weekly'
  },
  agents: {
    title: 'Accredited Agent Management & Station Deployment | CI-EMS',
    description: 'Official roster of certified polling station agents, deployment tracking, digital check-ins, and direct communications network.',
    canonicalRoute: '#/agents',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.85,
    changefreq: 'daily'
  },
  field_reports: {
    title: 'Field Agent Incident & Polling Stream Reports | CI-EMS',
    description: 'Real-time field observer observations, station opening times, queue length telemetry, and security incident logs across Kenya.',
    canonicalRoute: '#/field-reports',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.85,
    changefreq: 'hourly'
  },
  surveys: {
    title: 'Electoral Sampling & Voter Opinion Surveys | CI-EMS',
    description: 'Statistically verified voter sentiment sampling, demographic trend analysis, and candidate preference tracking by region.',
    canonicalRoute: '#/surveys',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.8,
    changefreq: 'daily'
  },
  mobilization: {
    title: 'Voter Turnout & Grassroots Mobilization | CI-EMS',
    description: 'Grassroots voter mobilization command, GOTV dispatching, volunteer task assignment, and hourly turnout acceleration metrics.',
    canonicalRoute: '#/mobilization',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.8,
    changefreq: 'hourly'
  },
  executive_briefing: {
    title: 'Executive Situation Room & Leadership Briefing | CI-EMS',
    description: 'Executive-level strategic briefing room providing summarized KPIs, decisive swing county indicators, and legal audit status.',
    canonicalRoute: '#/executive-briefing',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.8,
    changefreq: 'hourly'
  },
  production_readiness: {
    title: 'Production Readiness & OWASP Security Gate | CI-EMS',
    description: 'System security posture verification, OWASP ASVS compliance audit, statutory data retention checks, and release provenance.',
    canonicalRoute: '#/production-readiness',
    robots: 'index, follow',
    ogType: 'website',
    priority: 0.75,
    changefreq: 'weekly'
  },
  // Protected operational rooms (Deep-linkable, but flagged noindex)
  ops_queue: {
    title: 'Unified Operations Queue | CI-EMS Internal Ops',
    description: 'Internal operational workflow and escalation queue for election coordinators.',
    canonicalRoute: '#/ops-queue',
    robots: 'noindex, nofollow',
    ogType: 'website',
    priority: 0.3,
    changefreq: 'always'
  },
  war_room: {
    title: 'Election War Room Cockpit | CI-EMS Secured Command',
    description: 'Secure operational war room interface for authorized election coordinators.',
    canonicalRoute: '#/war-room',
    robots: 'noindex, nofollow',
    ogType: 'website',
    priority: 0.3,
    changefreq: 'always'
  },
  security_ops: {
    title: 'Security Operations & Threat Defense | CI-EMS Ops',
    description: 'Security incident monitoring and tamper-evident ledger verification.',
    canonicalRoute: '#/security-ops',
    robots: 'noindex, nofollow',
    ogType: 'website',
    priority: 0.2,
    changefreq: 'always'
  },
  evidence_review: {
    title: 'Evidence Review & Form 34A Vault | CI-EMS Forensic',
    description: 'Digital evidence inspection desk for statutory Form 34A uploads.',
    canonicalRoute: '#/evidence-review',
    robots: 'noindex, nofollow',
    ogType: 'website',
    priority: 0.2,
    changefreq: 'always'
  }
};

/**
 * Synchronizes HTML Head metadata for the active module dynamically
 */
export const updatePageMetadata = (moduleId, customOptions = {}) => {
  if (typeof document === 'undefined') return;

  const page = PAGE_SEO_REGISTRY[moduleId] || PAGE_SEO_REGISTRY.dashboard;
  const title = customOptions.title || page.title;
  const description = customOptions.description || page.description;
  const robots = customOptions.robots || page.robots;

  // 1. Update Title
  document.title = title;

  // 2. Helper to set or create meta tag
  const setMetaTag = (selector, attributeName, attributeVal, contentVal) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attributeName, attributeVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentVal);
  };

  // 3. Helper to set or create link tag
  const setLinkTag = (rel, href) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  // Standard Meta Tags
  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag('meta[name="robots"]', 'name', 'robots', robots);

  // Canonical URL
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://ci-ems.ke';
  const fullCanonical = `${origin}/ems/${page.canonicalRoute ? page.canonicalRoute : ''}`;
  setLinkTag('canonical', fullCanonical);

  // Open Graph
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', fullCanonical);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', page.ogType || 'website');
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'CI-EMS Kenya');

  // Twitter Cards
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);

  // Schema.org Structured Data
  let schemaEl = document.querySelector('script[type="application/ld+json"]#seo-schema');
  if (!schemaEl) {
    schemaEl = document.createElement('script');
    schemaEl.setAttribute('type', 'application/ld+json');
    schemaEl.setAttribute('id', 'seo-schema');
    document.head.appendChild(schemaEl);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    'name': 'Campaign Intelligence & Election Management System (CI-EMS)',
    'serviceType': 'Electoral Operations and Results Certification',
    'provider': {
      '@type': 'Organization',
      'name': 'CI-EMS Kenya'
    },
    'url': fullCanonical,
    'description': description
  };

  schemaEl.textContent = JSON.stringify(structuredData);
};
