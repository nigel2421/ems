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
  calculateTimeRemaining
} from '../utils/countdownUtils.js';

import {
  parseUserAgent,
  exportLoginLogsToCSV
} from '../utils/deviceParser.js';

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
    const initialKey = getLLMApiKey();
    assert.equal(typeof initialKey, 'string');

    setLLMApiKey('AIzaSyTestKey123456');
    assert.equal(getLLMApiKey(), 'AIzaSyTestKey123456');

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
    const mockFile = { name: 'form34a_evidence.jpg', size: 4100000 };
    const compressed = compressImageSimulation(mockFile);

    assert.equal(compressed.originalSizeKb, 4004);
    assert.ok(compressed.compressedSizeKb < 600);
    assert.ok(compressed.compressionRatioPct > 70);
    assert.ok(compressed.hashSignature.startsWith('0x'));
  });

  test('5. Election Day Form 34A OCR Scanner Simulation', async () => {
    const mockImageFile = { name: 'signed_form34a.jpg' };
    const ocrResult = await processOCRForm34A(mockImageFile);

    assert.equal(ocrResult.formType, 'Form 34A');
    assert.equal(ocrResult.status, 'OCR_PARSED');
    assert.ok(ocrResult.ocrExtracted.candA > 0);
    assert.ok(ocrResult.ocrExtracted.candB > 0);
    assert.equal(ocrResult.ocrExtracted.total, ocrResult.ocrExtracted.candA + ocrResult.ocrExtracted.candB + ocrResult.ocrExtracted.candC + ocrResult.ocrExtracted.rejected);
  });

  test('6. Seed Dataset Integrity Audit', () => {
    assert.ok(initialUsersList.length >= 6);
    assert.ok(Object.keys(initialStationIntelligence).length >= 4);
    assert.ok(initialAgentDirectory.length >= 5);
    assert.ok(initialSurveys.length >= 2);
    assert.ok(initialFieldReports.length >= 3);
    assert.ok(initialStakeholders.length >= 4);
    assert.ok(initialCampaignPhases.length >= 5);
    assert.ok(initialTallyCenterData.length >= 2);
  });

  test('7. Regional Field Agent Scoping & Jurisdiction Isolation', () => {
    const getScopedAgentsHelper = (user, allAgents) => {
      if (!user) return [];
      if (['Super Admin', 'Admin', 'Strategy Team', 'Governor', 'Senator'].includes(user.role)) return allAgents;
      const userNameLower = (user.name || '').toLowerCase().trim();
      const userId = user.id;
      const tokens = [user.entityName, user.assignedEntity, user.constituency, user.ward, user.county]
        .filter(Boolean)
        .map(t => String(t).toLowerCase().trim())
        .filter(t => t !== 'global' && t.length > 2);

      return allAgents.filter(ag => {
        if (ag.supervisorId && ag.supervisorId === userId) return true;
        if (ag.creatorId && ag.creatorId === userId) return true;
        if (ag.userId && ag.userId === userId) return true;
        const agSupervisorLower = (ag.supervisor || ag.name || '').toLowerCase();
        if (userNameLower && agSupervisorLower.includes(userNameLower)) return true;
        const agRegionLower = (ag.region || ag.entityName || '').toLowerCase();
        const agAssignedLower = (ag.assignedEntity || '').toLowerCase();
        return tokens.some(t => agRegionLower.includes(t) || t.includes(agRegionLower) || agAssignedLower.includes(t) || t.includes(agAssignedLower));
      });
    };

    const mohaUser = initialUsersList.find(u => u.name === 'moha') || {
      id: 'USR-MCA-01',
      name: 'moha',
      role: 'MCA',
      assignedEntity: 'WARD-0019',
      entityName: 'KONGOWEA'
    };

    const nairobiCoordinator = initialUsersList.find(u => u.id === 'USR-REGIONAL-01');

    const mohaAgents = getScopedAgentsHelper(mohaUser, initialAgentDirectory);
    assert.equal(mohaAgents.length, 2);
    assert.ok(mohaAgents.every(a => a.region.includes('Kongowea') || a.supervisorId === 'USR-MCA-01'));
    assert.ok(!mohaAgents.some(a => a.fullName.includes('Samuel Kiprop')));

    const nairobiAgents = getScopedAgentsHelper(nairobiCoordinator, initialAgentDirectory);
    assert.equal(nairobiAgents.length, 3);
    assert.ok(nairobiAgents.every(a => a.region.includes('Nairobi')));
    assert.ok(!nairobiAgents.some(a => a.fullName.includes('Ali Hassan Swaleh')));
  });

  test('8. Election Countdown Real-time Ticker & Math Engine', () => {
    const tenDaysFuture = new Date(Date.now() + (10 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000) + (12 * 60 * 1000) + 30000).toISOString();
    const resFuture = calculateTimeRemaining(tenDaysFuture);

    assert.equal(resFuture.isCompleted, false);
    assert.equal(resFuture.days, 10);
    assert.equal(resFuture.hours, 5);
    assert.equal(resFuture.minutes, 12);
    assert.ok(resFuture.seconds >= 29 && resFuture.seconds <= 30);
    assert.ok(resFuture.totalMs > 0);

    const pastDate = new Date(Date.now() - 10000).toISOString();
    const resPast = calculateTimeRemaining(pastDate);

    assert.equal(resPast.isCompleted, true);
    assert.equal(resPast.days, 0);
    assert.equal(resPast.hours, 0);

    const resInvalid = calculateTimeRemaining('invalid-date-string');
    assert.equal(resInvalid.isCompleted, true);
    assert.equal(resInvalid.days, 0);
  });

  test('9. User-Agent Device Parser & Telemetry Extraction', () => {
    const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
    const parsedChrome = parseUserAgent(chromeUA);

    assert.equal(parsedChrome.os, 'Windows 11/10');
    assert.ok(parsedChrome.browser.includes('Google Chrome'));
    assert.equal(parsedChrome.deviceType, 'Desktop');

    const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
    const parsedIphone = parseUserAgent(iphoneUA);

    assert.equal(parsedIphone.os, 'iOS (iPhone)');
    assert.ok(parsedIphone.browser.includes('Apple Safari'));
    assert.equal(parsedIphone.deviceType, 'Mobile');
  });

  test('10. Admin Login Activity CSV Serialization', () => {
    const mockLogs = [
      {
        id: 'LOG-TEST-01',
        timestamp: '2026-09-07T12:00:00Z',
        email: 'admin.super@ems.go.ke',
        role: 'Admin',
        status: 'Success',
        ipAddress: '197.237.112.45',
        geoLocation: 'Nairobi, Kenya',
        deviceType: 'Desktop',
        os: 'Windows 11/10',
        browser: 'Google Chrome 128.0',
        failureReason: null
      }
    ];

    const csvOutput = exportLoginLogsToCSV(mockLogs);
    assert.ok(typeof csvOutput === 'string');
    assert.ok(csvOutput.includes('Log ID,Timestamp (ISO)'));
    assert.ok(csvOutput.includes('admin.super@ems.go.ke'));
    assert.ok(csvOutput.includes('197.237.112.45'));
    assert.ok(csvOutput.includes('Nairobi, Kenya'));
  });

});
