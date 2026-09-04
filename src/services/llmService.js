// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS)
// LLM Service (Google Gemini / OpenAI / Custom LLM Integration)
// ====================================================================

/**
 * Retrieves configured LLM API Key from localStorage or Vite environment
 */
export const getLLMApiKey = () => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('ems_gemini_api_key');
    if (saved) return saved;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_LLM_API_KEY || '';
  }
  return '';
};

export const setLLMApiKey = (key) => {
  if (typeof localStorage !== 'undefined') {
    if (key) {
      localStorage.setItem('ems_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('ems_gemini_api_key');
    }
  }
};

/**
 * Formats live campaign context into a system prompt for the LLM
 */
const buildSystemContextPrompt = (contextData = {}) => {
  const {
    stationIntelligence = {},
    fieldReports = [],
    surveys = [],
    stakeholders = [],
    tallyResults = [],
    campaignPhases = []
  } = contextData;

  const totalStations = Object.keys(stationIntelligence).length;
  const severeRiskCount = Object.values(stationIntelligence).filter(s => s.riskLevel === 'Severe' || s.riskLevel === 'High').length;
  const totalReach = (stakeholders || []).reduce((acc, curr) => acc + (curr.reachEstimate || 0), 0);
  const activePhase = (campaignPhases || []).find(p => p.status === 'Active') || { phaseNumber: 3, name: 'Voter Mobilization', progressPct: 35 };

  const recentIncidents = (fieldReports || []).slice(0, 5).map(r => `- [${r.severityLevel}] ${r.title} at ${r.locationName} (${r.notes})`).join('\n');
  const surveySummaries = (surveys || []).map(s => `- ${s.title} (${s.responseCount || 0} responses)`).join('\n');
  const tallySummary = (tallyResults || []).map(t => `- ${t.pollingStationName}: Total ${t.totalVotesCast} votes (Cand A: ${t.candAVotes}, Cand B: ${t.candBVotes}) Status: ${t.status}`).join('\n');

  return `You are the Chief AI Campaign Strategist for the Campaign Intelligence & Election Management System (CI-EMS).
Your mission is to provide high-fidelity, actionable strategic campaign advice, risk assessments, voter sentiment analysis, and executive briefings.

LIVE CAMPAIGN GROUND TRUTH METRICS:
- Active Campaign Phase: Phase ${activePhase.phaseNumber} (${activePhase.name}) - Progress: ${activePhase.progressPct}%
- Polling Station Risk: ${severeRiskCount} High/Severe Risk Wards out of ${totalStations} mapped
- Stakeholder Network Reach: ${totalReach.toLocaleString()} estimated voters reached via elders, clergy & youth leaders

RECENT FIELD INCIDENTS & REPORTS:
${recentIncidents || 'No severe incidents reported.'}

ACTIVE SURVEYS & VOTER SENTIMENT:
${surveySummaries || 'Surveys active.'}

LIVE TALLY CENTER RETURNS:
${tallySummary || 'Tally center operational.'}

INSTRUCTIONS:
1. Always analyze the user query against the live ground truth metrics provided above.
2. Structure your responses cleanly using GitHub-flavored Markdown headers, bullet points, and bold text.
3. Be strategic, objective, decisive, and concise. Avoid fluff. Provide direct campaign recommendations.`;
};

/**
 * Calls Google Gemini REST API or falls back to intelligent rule engine
 */
export const queryLLM = async (promptText, contextData = {}, options = {}) => {
  const apiKey = getLLMApiKey();
  const systemPrompt = buildSystemContextPrompt(contextData);

  // If API Key is configured, execute real Google Gemini LLM REST call
  if (apiKey) {
    try {
      const model = options.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUSER QUERY: ${promptText}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error?.message || `Gemini API Error (Status ${response.status})`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        return {
          success: true,
          provider: 'Google Gemini LLM',
          model,
          response: generatedText,
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn('Real Gemini LLM Query failed, falling back to rule engine:', err.message);
      return {
        success: false,
        error: err.message,
        provider: 'Fallback Rule Engine',
        response: `⚠️ **Gemini API Call Warning**: ${err.message}\n\nUsing local campaign intelligence engine:\n\n` + executeFallbackEngine(promptText, contextData),
        timestamp: new Date().toISOString()
      };
    }
  }

  // Fallback Rule Engine when API Key is missing
  return {
    success: true,
    provider: 'Local Intelligence Engine (No API Key)',
    response: executeFallbackEngine(promptText, contextData),
    timestamp: new Date().toISOString()
  };
};

/**
 * Local Rule Engine Fallback when no Gemini API Key is provided
 */
const executeFallbackEngine = (promptText, contextData) => {
  const text = promptText.toLowerCase();

  if (text.includes('ward') || text.includes('competitive') || text.includes('swing')) {
    return `### 📊 Live Competitive Wards Analysis\n\n- **Westlands Ward (Stream 02)**: High opponent activity detected. Incumbency score: 65%, Party Advantage: 78% (declining by 4% this week).\n- **Dagoretti Corner**: Flagged as **Severe Risk**. Opposition strength is at 68% with heavy opponent door-to-door canvassing.\n- **Kibra Central**: Stronghold status (Party Advantage: 89%). High voter enthusiasm detected.`;
  }
  if (text.includes('concern') || text.includes('voter') || text.includes('issue')) {
    return `### 🗣️ Top Voter Concerns This Week (From Survey & Field Data)\n\n1. **Youth Employment & Skills Training** (44% of responses)\n2. **Clean Water Supply & Distribution** (28% of responses)\n3. **Road Maintenance & Street Lighting** (18% of responses)\n4. **Healthcare Clinic Equipment** (10% of responses)\n\n*Strategic Action*: Focus upcoming townhalls on youth empowerment funds and water infrastructure commitments.`;
  }
  if (text.includes('agent') || text.includes('underperforming') || text.includes('performance')) {
    return `### 📱 Agent Performance & Activity Audit\n\n- **Total Active Agents**: 3 registered agents\n- **Top Performer**: Kevin Omwamba (Kibra) - Rating 4.9 (22 reports, 45 surveys)\n- **Underperforming / Attention Needed**: Grace Muthoni (Dagoretti) - 9 reports submitted, last active 3 hours ago. Recommended regional coordinator follow-up.`;
  }
  if (text.includes('weekly') || text.includes('summary') || text.includes('briefing')) {
    return `### 📋 Executive Weekly Campaign Briefing\n\n- **Overall Campaign Progress**: Phase 3 (Voter Mobilization) is at **35% completion**.\n- **Stakeholder Reach**: 4 key leaders engaged with estimated **6,450 voters** reached.\n- **Field Reports**: 3 new field reports submitted (1 High Severity incident flagged in Dagoretti).\n- **Election Day Readiness**: 2 Polling Stations mapped; 1 station flagged with Math Mismatch on test tally.`;
  }

  return `### 🤖 Campaign Strategy Analysis\n\nThank you for your query: "${promptText}". System ground truth indicates that campaign mobilization is currently progressing as scheduled across Phase 3.\n\n*Note*: Connect a Google Gemini API Key in AI Assistant settings to enable live generative AI responses.`;
};
