import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  getLLMApiKey,
  setLLMApiKey,
  queryLLM
} from '../services/llmService.js';

import {
  parsePollingStationsCSV,
  compressImageSimulation,
  processOCRForm34A
} from '../services/api.js';

import {
  initialUsersList,
  initialStationIntelligence,
  initialAgentDirectory,
  initialSurveys,
  initialFieldReports,
  initialStakeholders,
  initialCampaignPhases,
  initialTallyCenterData
} from '../data/seedData.js';

// Global localStorage Mock for Node.js test environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: key => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: key => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

globalThis.localStorage = localStorageMock;

describe('CI-EMS Core Service & LLM Unit Tests', () => {

  test('1. LLM API Key Management (getLLMApiKey & setLLMApiKey)', () => {
    // Test default empty state when not set in localStorage
    const initialKey = getLLMApiKey();
    assert.equal(typeof initialKey, 'string');

    // Test setting a new API key
    setLLMApiKey('AIzaSyTestKey123456');
    assert.equal(getLLMApiKey(), 'AIzaSyTestKey123456');

    // Test clearing key
    setLLMApiKey('');
    assert.equal(getLLMApiKey(), '');
  });

  test('2. LLM Query Execution & Ground-Truth Context Injection', async () => {
    const mockContext = {
      stationIntelligence: initialStationIntelligence,
      fieldReports: initialFieldReports,
      surveys: initialSurveys,
      stakeholders: initialStakeholders,
      tallyResults: initialTallyCenterData,
      campaignPhases: initialCampaignPhases
    };

    const res = await queryLLM('Which wards are becoming competitive?', mockContext);
    assert.ok(res);
    assert.equal(typeof res.response, 'string');
    assert.ok(res.response.length > 20);
    assert.ok(res.response.includes('Wards') || res.response.includes('Westlands') || res.response.includes('Competitive'));
  });

  test('3. CSV Bulk Polling Station Parser', () => {
    const csvContent = `Code,Name,County,Constituency,Ward,Village,RegisteredVoters,ActiveVoters,TurnoutPct\n001,Westlands Primary,Nairobi,Westlands,Westlands Ward,Kangemi,750,600,80.0\n002,Parklands Primary,Nairobi,Westlands,Parklands Ward,Highridge,820,680,82.9`;
    
    const parsed = parsePollingStationsCSV(csvContent);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].code, '001');
    assert.equal(parsed[0].name, 'Westlands Primary');
    assert.equal(parsed[0].county, 'Nairobi');
    assert.equal(parsed[0].registeredVoters, 750);
    assert.equal(parsed[1].code, '002');
  });

  test('4. Client-Side Image Compression Simulation Engine', () => {
    const mockFile = { name: 'form34a_evidence.jpg', size: 4100000 }; // 4.1 MB
    const compressed = compressImageSimulation(mockFile);

    assert.equal(compressed.originalSizeKb, 4004);
    assert.ok(compressed.compressedSizeKb < 600); // Should be compressed down to < 600KB (~85-90% reduction)
    assert.ok(compressed.compressionRatioPct > 70);
    assert.ok(compressed.hashSignature.startsWith('0x'));
  });

  test('5. Election Day Form 34A OCR Scanner Simulation', async () => {
    const mockImageFile = { name: 'signed_form34a.jpg' };
    const ocrResult = await processOCRForm34A(mockImageFile);

    assert.equal(ocrResult.success, true);
    assert.ok(ocrResult.confidence >= 0.90);
    assert.equal(typeof ocrResult.extractedVotes.candA, 'number');
    assert.equal(typeof ocrResult.extractedVotes.candB, 'number');
    assert.equal(ocrResult.extractedVotes.total, ocrResult.extractedVotes.candA + ocrResult.extractedVotes.candB + ocrResult.extractedVotes.candC + ocrResult.extractedVotes.rejected);
  });

  test('6. Seed Dataset Integrity Audit', () => {
    assert.ok(initialUsersList.length >= 5);
    assert.ok(initialAgentDirectory.length >= 3);
    assert.ok(initialSurveys.length >= 2);
    assert.ok(initialFieldReports.length >= 3);
    assert.ok(initialStakeholders.length >= 4);
    assert.equal(initialCampaignPhases.length, 5);
    assert.ok(initialTallyCenterData.length >= 2);
  });

});
