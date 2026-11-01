// ====================================================================
// CI-EMS Gemini Campaign Intelligence Service
// Scoped, Role-Gated Electoral Analytics & Strategy Advice
// ====================================================================

/**
 * Builds the jurisdictional context for Gemini based on user role and data
 */
export const buildJurisdictionalContext = (user, geography, stationStats = {}) => {
  const role = user?.role || 'Guest';
  const name = user?.name || 'Campaign Officer';
  const scope = user?.jurisdictionScope || {};

  let boundaryDescription = 'National Operations Command (All 47 Counties)';
  if (role === 'Governor' || role === 'Senator') {
    boundaryDescription = `County Level: ${scope.countyName || 'Nairobi City County'} (${scope.constituencyCount || 17} Constituencies, ~${(scope.registeredVoters || 2658906).toLocaleString()} voters)`;
  } else if (role === 'MP') {
    boundaryDescription = `Constituency Level: ${scope.constituencyName || 'Westlands'} (${scope.wardCount || 5} Wards)`;
  } else if (role === 'MCA') {
    boundaryDescription = `Ward Level: ${scope.wardName || 'Parklands/Highridge Ward'}`;
  } else if (role === 'Field Agent') {
    boundaryDescription = `Assigned Polling Centre: ${scope.stationName || 'Assigned Polling Stream'}`;
  }

  return `
SYSTEM DIRECTIVE:
You are CI-EMS Campaign AI, an elite electoral strategy and polling intelligence copilot for Kenya elections.
User: ${name} (${role})
Authorized Jurisdiction: ${boundaryDescription}

OPERATIONAL CONSTRAINTS:
1. You MUST operate strictly within the user's authorized jurisdiction: "${boundaryDescription}".
2. Never leak or volunteer data for rival candidate campaigns or out-of-scope jurisdictions.
3. Reference real Kenyan electoral operational dynamics (IEBC Form 34A verification, turnout mobilization, agent deployment, and swing polling streams).
4. Keep insights sharp, actionable, and data-backed.
`;
};

/**
 * Queries Google Gemini API with fallback to offline heuristic analytics
 */
export const queryGeminiCampaignAI = async ({
  prompt,
  user,
  geography,
  stationStats = {},
  apiKey = null
}) => {
  const geminiKey = apiKey || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY);
  const systemInstruction = buildJurisdictionalContext(user, geography, stationStats);

  if (geminiKey && geminiKey.trim().length > 10) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemInstruction}\n\nUSER INQUIRY: ${prompt}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return {
            success: true,
            text: candidateText,
            source: 'gemini-1.5-flash',
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch (err) {
      console.warn('[GeminiService] Network query failed, falling back to local heuristic engine:', err);
    }
  }

  // Localized Rule-Based Heuristic Engine (Offline / Zero-Key Fallback)
  return generateLocalHeuristicResponse(prompt, user, geography, stationStats);
};

const generateLocalHeuristicResponse = (prompt, user, geography, stationStats) => {
  const lower = (prompt || '').toLowerCase();
  const role = user?.role || 'Leader';

  if (lower.includes('turnout') || lower.includes('voter')) {
    return {
      success: true,
      text: `Based on your ${role} command scope, priority mobilization must target high-density polling stations where turnout currently lags behind historical baselines. We recommend deploying mobile ground teams to stream locations with <55% projected turnout between 10:00 AM and 2:00 PM on election day.`,
      source: 'ci-ems-heuristic-engine',
      timestamp: new Date().toISOString()
    };
  }

  if (lower.includes('risk') || lower.includes('swing') || lower.includes('contested')) {
    return {
      success: true,
      text: `Identified swing wards in your jurisdiction show high responsiveness to door-to-door ground mobilizers over mass rallies. Ensure certified party agents are stationed and equipped with the CI-EMS offline PWA at all flagged high-risk polling streams prior to 5:00 AM on election day.`,
      source: 'ci-ems-heuristic-engine',
      timestamp: new Date().toISOString()
    };
  }

  if (lower.includes('form 34a') || lower.includes('tally') || lower.includes('result')) {
    return {
      success: true,
      text: `Form 34A transmission protocol requires complete photograph capture of the signed declaration sheet prior to departure from the polling stream. Our reconciliation engine will immediately check agent numbers against the registered voter capacity to flag any discrepancies.`,
      source: 'ci-ems-heuristic-engine',
      timestamp: new Date().toISOString()
    };
  }

  return {
    success: true,
    text: `As ${role}, your campaign operational readiness in your assigned jurisdiction is actively tracked. All 46,051 gazetted stations are mapped with real GPS coordinates. Form 34A verification, agent mobilization queues, and parallel tally comparisons are active.`,
    source: 'ci-ems-heuristic-engine',
    timestamp: new Date().toISOString()
  };
};
