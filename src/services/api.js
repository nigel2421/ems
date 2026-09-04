// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS)
// Simulated Asynchronous API Service Layer
// ====================================================================

import {
  initialUsersList,
  initialStationIntelligence,
  initialAgentDirectory,
  initialSurveys,
  initialFieldReports,
  initialStakeholders,
  initialCampaignPhases,
  initialTallyCenterData,
  initialAIChatHistory
} from '../data/seedData.js';
import { queryLLM } from './llmService.js';

// Helper to delay simulated responses
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for client-side simulated image compression calculation
export const compressImageSimulation = (fileObj) => {
  const originalSizeKb = fileObj.size ? Math.round(fileObj.size / 1024) : 3850;
  // Compress down by 85-92%
  const compressedSizeKb = Math.round(originalSizeKb * (0.08 + Math.random() * 0.05));
  return {
    originalSizeKb,
    compressedSizeKb,
    compressionRatioPct: Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100),
    thumbnailUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=200&auto=format&fit=crop&q=80',
    hashSignature: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  };
};

export const parsePollingStationsCSV = (csvText) => {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanValues = rawLine.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (cleanValues.length >= 3) {
      results.push({
        id: `PS-CSV-${i}`,
        code: cleanValues[0] || `CSV-${100 + i}`,
        name: cleanValues[1] || `Polling Station ${i}`,
        county: cleanValues[2] || 'Nairobi',
        constituency: cleanValues[3] || 'Westlands',
        ward: cleanValues[4] || 'Westlands Ward',
        village: cleanValues[5] || 'Village Central',
        registeredVoters: parseInt(cleanValues[6]) || Math.floor(400 + Math.random() * 600),
        activeVoters: parseInt(cleanValues[7]) || Math.floor(300 + Math.random() * 400),
        historicalTurnoutPct: parseFloat(cleanValues[8]) || parseFloat((70 + Math.random() * 20).toFixed(1))
      });
    }
  }

  return results;
};

// Helper for simulated OCR Scanner on Form 34A evidence
export const processOCRForm34A = async (imageFile) => {
  await delay(800);
  const candA = Math.floor(300 + Math.random() * 200);
  const candB = Math.floor(150 + Math.random() * 150);
  const candC = Math.floor(20 + Math.random() * 40);
  const rejected = Math.floor(5 + Math.random() * 15);
  const total = candA + candB + candC + rejected;

  return {
    success: true,
    confidence: (0.92 + Math.random() * 0.07).toFixed(2),
    extractedVotes: { candA, candB, candC, rejected, total },
    detectedHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  };
};

// API Service Interface
export const apiService = {
  // 1. Polling Station Intelligence
  async getPollingStationIntelligence() {
    await delay();
    return initialStationIntelligence;
  },

  async updateIntelligenceScore(stationId, updatedFields) {
    await delay();
    return { stationId, ...updatedFields, updatedAt: new Date().toISOString() };
  },

  // 2. Agent Management
  async getAgentDirectory() {
    await delay();
    return initialAgentDirectory;
  },

  async assignStationsToAgent(agentId, stationIds) {
    await delay();
    return { success: true, agentId, stationIds };
  },

  // 3. Survey & Polling Module
  async getSurveys() {
    await delay();
    return initialSurveys;
  },

  async createSurvey(surveyData) {
    await delay();
    const newSurvey = {
      ...surveyData,
      id: `SURV-${Date.now().toString().slice(-4)}`,
      publicSlug: surveyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      createdAt: new Date().toISOString(),
      responseCount: 0
    };
    return newSurvey;
  },

  async submitSurveyResponse(surveyId, answers, agentId = null) {
    await delay();
    return {
      success: true,
      responseId: `RESP-${Date.now().toString().slice(-5)}`,
      surveyId,
      agentId,
      submittedAt: new Date().toISOString()
    };
  },

  // 4. Field Reporting Module
  async submitFieldReport(reportData, imageFiles = []) {
    await delay(300);
    const mediaList = imageFiles.map((file, idx) => {
      const sim = compressImageSimulation(file);
      return {
        id: `MED-${Date.now()}-${idx}`,
        fileName: file.name || `photo_${idx + 1}.jpg`,
        originalSizeKb: sim.originalSizeKb,
        compressedSizeKb: sim.compressedSizeKb,
        thumbnailUrl: sim.thumbnailUrl,
        mediaUrl: URL.createObjectURL(file)
      };
    });

    const newReport = {
      ...reportData,
      id: `REP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      media: mediaList
    };

    return newReport;
  },

  // 5. Team Mobilization & Stakeholder Network
  async getStakeholders() {
    await delay();
    return initialStakeholders;
  },

  async addStakeholder(stakeholderData) {
    await delay();
    const newStakeholder = {
      ...stakeholderData,
      id: `STK-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      activities: []
    };
    return newStakeholder;
  },

  // 6. Campaign Strategy Module
  async getCampaignPhases() {
    await delay();
    return initialCampaignPhases;
  },

  // 7. Election Day Operations (Tally Center)
  async getTallyResults() {
    await delay();
    return initialTallyCenterData;
  },

  async submitTallyForm(tallyData) {
    await delay();
    const totalCast = tallyData.candAVotes + tallyData.candBVotes + tallyData.candCVotes + tallyData.rejectedVotes;
    const isMismatch = totalCast > tallyData.registeredVoters;

    const newTally = {
      ...tallyData,
      id: `TALLY-${Date.now().toString().slice(-4)}`,
      totalVotesCast: totalCast,
      status: isMismatch ? 'Mismatch' : 'Submitted',
      submittedAt: new Date().toISOString()
    };
    return newTally;
  },

  // 8. AI Intelligence Assistant
  async queryAIAssistant(promptText, currentContextData = {}) {
    const llmRes = await queryLLM(promptText, currentContextData);
    return {
      id: `AI-RESP-${Date.now().toString().slice(-4)}`,
      prompt: promptText,
      response: llmRes.response,
      provider: llmRes.provider,
      timestamp: llmRes.timestamp
    };
  }
};
