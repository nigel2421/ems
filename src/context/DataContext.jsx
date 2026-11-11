import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { initialGeography, initialSubmissions, iebcOfficialBroadcasts, initialAuditLogs, initialUsers } from '../data/mockData';
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
} from '../data/seedData';
import {
  initialStrategyMembers,
  initialStrategyTasks,
  initialCampaignRoadmap,
  initialStrategyMeetings
} from '../utils/strategyEngine';
import { filterByScope, canAccessLocation, getUserScope, SCOPE_LEVELS } from '../utils/rbac';
import { validateTallySubmission } from '../utils/tallyValidation';

const DataContext = createContext(null);



// Helper to safely write to localStorage without crashing on QuotaExceededError
const safeSetLocalStorage = (key, value) => {
  try {
    safeStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[EMS] LocalStorage save quota exceeded or unavailable for '${key}':`, err);
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      try {
        localStorage.removeItem('ems_geography');
      } catch (e) {
        // ignore
      }
    }
  }
};

const safeGetLocalStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    return fallback;
  }
};

export const DataProvider = ({ children }) => {
  // 1. Geography & Polling Stations: Uses bundled iebcGeographyData.json (46,051 stations)
  const [geography, setGeography] = useState(() => {
    // Purge legacy ems_geography from localStorage to prevent exceeding 5MB browser quota
    try {
      localStorage.removeItem('ems_geography');
    } catch (e) {
      // ignore
    }
    return initialGeography;
  });

  // 2. Polling Station Intelligence Scores
  const [stationIntelligence, setStationIntelligence] = useState(() => safeGetLocalStorage('ems_station_intelligence', initialStationIntelligence));

  // 3. Agent Directory (Filter legacy dummy agents out of localStorage)
  const [agents, setAgents] = useState(() => {
    const loaded = safeGetLocalStorage('ems_agent_directory', initialAgentDirectory);
    return (loaded || []).filter(a => !['Samuel Kiprop', 'Grace Muthoni', 'Kevin Omwamba', 'Ali Hassan Swaleh', 'Fatuma Bakari'].includes(a?.fullName || a?.name));
  });

  // 4. Surveys
  const [surveys, setSurveys] = useState(() => {
    const loaded = safeGetLocalStorage('ems_surveys', initialSurveys);
    return (loaded || []).filter(s => !['SURV-101', 'SURV-102'].includes(s?.id));
  });

  // 5. Field Reports
  const [fieldReports, setFieldReports] = useState(() => {
    const loaded = safeGetLocalStorage('ems_field_reports', initialFieldReports);
    return (loaded || []).filter(r => !['REP-2026-001', 'REP-2026-002', 'REP-2026-003'].includes(r?.id));
  });

  // 6. Stakeholders / Influence Network
  const [stakeholders, setStakeholders] = useState(() => {
    const loaded = safeGetLocalStorage('ems_stakeholders', initialStakeholders);
    return (loaded || []).filter(s => !['STK-001', 'STK-002', 'STK-003', 'STK-004'].includes(s?.id));
  });

  // 7. Campaign Strategy & Phases
  const [campaignPhases, setCampaignPhases] = useState(() => safeGetLocalStorage('ems_campaign_phases', initialCampaignPhases));

  // 8. Tally Center Results & Submissions
  const [tallyResults, setTallyResults] = useState(() => {
    const loaded = safeGetLocalStorage('ems_tally_results', initialTallyCenterData);
    return (loaded || []).filter(t => !['TALLY-001', 'TALLY-002'].includes(t?.id));
  });
  const [submissions, setSubmissions] = useState(() => safeGetLocalStorage('ems_submissions', initialSubmissions));
  const [broadcasts, setBroadcasts] = useState(() => safeGetLocalStorage('ems_broadcasts', iebcOfficialBroadcasts));

  // 9. AI Chat History
  const [aiChatHistory, setAiChatHistory] = useState(() => {
    const loaded = safeGetLocalStorage('ems_ai_chat', initialAIChatHistory);
    return (loaded || []).filter(c => !['CHAT-1', 'CHAT-2'].includes(c?.id));
  });

  // 10. Audit Logs
  const [auditLogs, setAuditLogs] = useState(() => safeGetLocalStorage('ems_audit_logs', initialAuditLogs));

  // 11. Strategy Team & Campaign Organization
  const [strategyMembers, setStrategyMembers] = useState(() => {
    const loaded = safeGetLocalStorage('ems_strategy_members', []);
    return (loaded || []).filter(m => !['STM-001', 'STM-002', 'STM-003', 'STM-004', 'STM-005', 'STM-006', 'STM-007', 'STM-008'].includes(m?.id));
  });
  const [strategyTasks, setStrategyTasks] = useState(() => {
    const loaded = safeGetLocalStorage('ems_strategy_tasks', []);
    return (loaded || []).filter(t => !['ST-101', 'ST-102', 'ST-103', 'ST-104'].includes(t?.id));
  });
  const [campaignRoadmap, setCampaignRoadmap] = useState(() => safeGetLocalStorage('ems_campaign_roadmap', initialCampaignRoadmap));
  const [strategyMeetings, setStrategyMeetings] = useState(() => {
    const loaded = safeGetLocalStorage('ems_strategy_meetings', []);
    return (loaded || []).filter(m => !['MTG-301'].includes(m?.id));
  });

  // Persist State to LocalStorage (Safely caught) & Central Server DB
  useEffect(() => { safeSetLocalStorage('ems_station_intelligence', stationIntelligence); }, [stationIntelligence]);
  useEffect(() => {
    safeSetLocalStorage('ems_agent_directory', agents);
    syncStateToServer({ agents });
  }, [agents]);
  useEffect(() => { safeSetLocalStorage('ems_surveys', surveys); }, [surveys]);
  useEffect(() => { safeSetLocalStorage('ems_field_reports', fieldReports); }, [fieldReports]);
  useEffect(() => { safeSetLocalStorage('ems_stakeholders', stakeholders); }, [stakeholders]);
  useEffect(() => { safeSetLocalStorage('ems_campaign_phases', campaignPhases); }, [campaignPhases]);
  useEffect(() => { safeSetLocalStorage('ems_tally_results', tallyResults); }, [tallyResults]);
  useEffect(() => { safeSetLocalStorage('ems_submissions', submissions); }, [submissions]);
  useEffect(() => { safeSetLocalStorage('ems_ai_chat', aiChatHistory); }, [aiChatHistory]);
  useEffect(() => { safeSetLocalStorage('ems_audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => {
    safeSetLocalStorage('ems_strategy_members', strategyMembers);
    syncStateToServer({ strategyMembers });
  }, [strategyMembers]);
  useEffect(() => {
    safeSetLocalStorage('ems_strategy_tasks', strategyTasks);
    syncStateToServer({ strategyTasks });
  }, [strategyTasks]);
  useEffect(() => { safeSetLocalStorage('ems_campaign_roadmap', campaignRoadmap); }, [campaignRoadmap]);
  useEffect(() => {
    safeSetLocalStorage('ems_strategy_meetings', strategyMeetings);
    syncStateToServer({ strategyMeetings });
  }, [strategyMeetings]);

  // Sync state with Central Server Database (/ems/api/db) on load
  useEffect(() => {
    const fetchCentralDatabase = async () => {
      try {
        const apiUrl = `${window.location.origin}/ems/api/db`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.strategyMembers) && data.strategyMembers.length > 0) {
            setStrategyMembers(data.strategyMembers);
          }
          if (Array.isArray(data.agents) && data.agents.length > 0) {
            setAgents(prev => {
              const map = new Map();
              prev.forEach(a => map.set(a.id || (a.email || '').toLowerCase(), a));
              data.agents.forEach(sa => {
                const key = sa.id || (sa.email || '').toLowerCase();
                map.set(key, { ...(map.get(key) || {}), ...sa });
              });
              return Array.from(map.values());
            });
            setGeography(prevGeo => {
              const stationAgentMap = new Map();
              data.agents.forEach(ag => {
                const stIds = Array.isArray(ag.assignedStations) && ag.assignedStations.length > 0
                  ? ag.assignedStations
                  : (ag.pollingStationId ? [ag.pollingStationId] : []);
                stIds.forEach(stId => {
                  if (stId && ag.id) stationAgentMap.set(stId, ag.id);
                });
              });
              if (stationAgentMap.size === 0) return prevGeo;
              return {
                ...prevGeo,
                pollingStations: (prevGeo.pollingStations || []).map(ps =>
                  stationAgentMap.has(ps.id) ? { ...ps, agentAssigned: stationAgentMap.get(ps.id) } : ps
                )
              };
            });
          }
          if (Array.isArray(data.tallyResults) && data.tallyResults.length > 0) {
            setTallyResults(data.tallyResults);
          }
          if (Array.isArray(data.fieldReports) && data.fieldReports.length > 0) {
            setFieldReports(data.fieldReports);
          }
        }

        // Also hydrate scoped agents from /api/agents (users.json) for authenticated user accounts
        const agentsRes = await fetch(`${window.location.origin}/api/agents`, { credentials: 'include' });
        if (agentsRes.ok) {
          const serverAgents = await agentsRes.json().catch(() => []);
          if (Array.isArray(serverAgents) && serverAgents.length > 0) {
            setAgents(prev => {
              const map = new Map();
              prev.forEach(a => map.set(a.id || (a.email || '').toLowerCase(), a));
              serverAgents.forEach(u => {
                const key = u.id || (u.email || '').toLowerCase();
                const stId = u.pollingStationId || u.assignedEntity || null;
                const normalized = {
                  id: u.id,
                  userId: u.id,
                  name: u.name || u.fullName || 'Field Agent',
                  fullName: u.fullName || u.name || 'Field Agent',
                  role: 'Field Agent',
                  email: u.email,
                  phone: u.phone,
                  county: u.county,
                  constituency: u.constituency,
                  ward: u.ward,
                  region: u.region || [u.ward, u.constituency, u.county].filter(v => v && String(v).toLowerCase() !== 'all').join(', ') || 'Assigned Jurisdiction',
                  assignedEntity: u.assignedEntity,
                  entityName: u.entityName,
                  pollingStationId: stId,
                  pollingStationCode: u.pollingStationCode || stId,
                  pollingStationName: u.pollingStationName || u.entityName,
                  assignedStations: Array.isArray(u.assignedStations) && u.assignedStations.length > 0
                    ? u.assignedStations
                    : (stId ? [stId] : []),
                  supervisorId: u.supervisorId || u.candidateId || u.creatorId,
                  supervisor: u.supervisor || u.candidateName || 'Campaign HQ',
                  aspirantId: u.candidateId || u.supervisorId,
                  candidateId: u.candidateId,
                  creatorId: u.creatorId,
                  status: u.status || 'Active',
                  batteryLevel: u.batteryLevel ?? 100,
                  signalStrength: u.signalStrength ?? 100,
                  avatar: u.avatar
                };
                map.set(key, { ...(map.get(key) || {}), ...normalized });
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        // Fallback to localStorage silently
      }
    };
    fetchCentralDatabase();
  }, []);

  const syncStateToServer = async (payload) => {
    try {
      const apiUrl = `${window.location.origin}/ems/api/db`;
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Ignore network errors in local dev
    }
  };


  // Audit Logger Helper with SHA-256 Chaining
  const logAuditAction = (user, action, details) => {
    setAuditLogs(prev => {
      const prevHash = prev?.[0]?.hash || '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date().toISOString();
      const userId = user?.id || 'SYSTEM';
      const role = user?.role || 'System';
      const raw = `${prevHash}|${timestamp}|${userId}|${role}|${action}|${details}|${user?.jurisdictionScope?.title || 'National'}`;
      
      // Simple synchronous hash digest representation
      let h = 0;
      for (let i = 0; i < raw.length; i++) {
        h = ((h << 5) - h) + raw.charCodeAt(i);
        h |= 0;
      }
      const hash = Math.abs(h).toString(16).padStart(64, '0');

      const newLog = {
        id: `LOG-${Date.now().toString().slice(-6)}`,
        timestamp,
        userId,
        userName: user?.name || 'System Bot',
        role,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        action,
        details,
        scope: user?.jurisdictionScope?.title || 'National',
        previousHash: prevHash,
        hash
      };

      try {
        fetch(`${window.location.origin}/api/audit-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        }).catch(() => {});
      } catch {}

      return [newLog, ...(prev || [])];
    });
  };

  // --- Module Actions ---

  // Module 1: Update Polling Station Intelligence Scores
  const updateStationIntelligence = (stationId, updatedFields, user) => {
    setStationIntelligence(prev => ({
      ...prev,
      [stationId]: {
        ...(prev[stationId] || {
          partyAdvantageScore: 50,
          incumbencyScore: 50,
          oppositionStrength: 50,
          publicPerceptionRating: 3.5,
          competitorActivityLevel: 'Medium',
          strategicImportance: 'Medium',
          riskLevel: 'Low',
          leadingFormation: 'UDA',
          rivalFormation: 'ODM',
          coalitionLean: 'Contested / fluid',
          streamTerrain: 'Swing',
          mobilisationChannel: 'Markets & boda stages'
        }),
        ...updatedFields
      }
    }));
    logAuditAction(user, 'INTELLIGENCE_UPDATE', `Updated intelligence scores for Station ${stationId}`);
  };

  // Bulk Import Polling Stations from CSV
  const bulkImportPollingStations = (importedStations, user) => {
    setGeography(prev => ({
      ...prev,
      pollingStations: [...importedStations, ...prev.pollingStations]
    }));
    logAuditAction(user, 'BULK_IMPORT_STATIONS', `Imported ${importedStations.length} polling stations via CSV`);
  };

  // Module 2: Agent Management
  const assignAgentToPollingStation = (agentId, pollingStationId, user) => {
    setGeography(prev => ({
      ...prev,
      pollingStations: prev.pollingStations.map(ps => {
        if (ps.id === pollingStationId) return { ...ps, agentAssigned: agentId };
        if (ps.agentAssigned === agentId && ps.id !== pollingStationId) return { ...ps, agentAssigned: null };
        return ps;
      })
    }));

    setAgents(prev => prev.map(ag => {
      if (ag.id === agentId || ag.userId === agentId) {
        const assigned = Array.isArray(ag.assignedStations) ? ag.assignedStations : [];
        return {
          ...ag,
          assignedStations: Array.from(new Set([...assigned, pollingStationId]))
        };
      }
      return ag;
    }));

    logAuditAction(user, 'AGENT_ASSIGNMENT', `Assigned Agent ${agentId} to Polling Station ${pollingStationId}`);
  };

  const updateAgentStatus = (agentId, newStatus, user) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: newStatus } : a));
    logAuditAction(user, 'AGENT_STATUS_CHANGE', `Updated agent ${agentId} status to ${newStatus}`);
  };

  const createAgent = (agentData = {}, user = null) => {
    const stationId = agentData.pollingStationId || (Array.isArray(agentData.assignedStations) && agentData.assignedStations[0]) || agentData.assignedEntity || null;
    const assignedStations = Array.isArray(agentData.assignedStations) && agentData.assignedStations.length > 0
      ? agentData.assignedStations
      : (stationId ? [stationId] : []);

    const newAgentRecord = {
      id: agentData.id || `AGT-${Date.now().toString().slice(-5)}`,
      userId: agentData.userId || agentData.id || null,
      name: agentData.name || agentData.fullName || 'Field Agent',
      fullName: agentData.fullName || agentData.name || 'Field Agent',
      role: agentData.role || 'Field Agent',
      email: agentData.email || '',
      phone: agentData.phone || '',
      county: agentData.county || user?.county || null,
      constituency: agentData.constituency || user?.constituency || null,
      ward: agentData.ward || user?.ward || null,
      region: agentData.region || [agentData.ward || user?.ward, agentData.constituency || user?.constituency, agentData.county || user?.county].filter(v => v && String(v).toLowerCase() !== 'all').join(', ') || 'Assigned Jurisdiction',
      assignedEntity: agentData.assignedEntity || stationId || '',
      entityName: agentData.entityName || agentData.pollingStationName || 'Assigned Polling Station',
      pollingStationId: stationId,
      pollingStationCode: agentData.pollingStationCode || stationId,
      pollingStationName: agentData.pollingStationName || agentData.entityName || '',
      assignedStations,
      supervisorId: agentData.supervisorId || agentData.aspirantId || user?.id || null,
      supervisor: agentData.supervisor || (user ? `${user.name} (${user.role})` : 'Campaign HQ'),
      aspirantId: agentData.aspirantId || agentData.supervisorId || user?.id || null,
      candidateId: agentData.candidateId || agentData.aspirantId || user?.id || null,
      creatorId: agentData.creatorId || user?.id || null,
      status: agentData.status || 'Active',
      batteryLevel: agentData.batteryLevel ?? 100,
      signalStrength: agentData.signalStrength ?? 100,
      lastCheckIn: agentData.lastCheckIn || new Date().toISOString(),
      reportsSubmittedCount: agentData.reportsSubmittedCount ?? 0,
      surveysCompletedCount: agentData.surveysCompletedCount ?? 0,
      avatar: agentData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: agentData.createdAt || new Date().toISOString()
    };

    setAgents(prev => {
      const filtered = prev.filter(
        a => a.id !== newAgentRecord.id && (!a.email || !newAgentRecord.email || a.email.toLowerCase() !== newAgentRecord.email.toLowerCase())
      );
      return [newAgentRecord, ...filtered];
    });

    if (stationId) {
      setGeography(prev => ({
        ...prev,
        pollingStations: (prev.pollingStations || []).map(ps =>
          ps.id === stationId ? { ...ps, agentAssigned: newAgentRecord.id } : ps
        )
      }));
    }

    logAuditAction(user, 'AGENT_PROVISIONED', `Provisioned field agent ${newAgentRecord.name} (${newAgentRecord.email || newAgentRecord.phone}) for ${newAgentRecord.entityName}`);
    return newAgentRecord;
  };

  // Module 3: Survey Engine
  const addSurvey = (surveyData, user) => {
    const newSurvey = {
      ...surveyData,
      id: `SURV-${Date.now().toString().slice(-4)}`,
      publicSlug: surveyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      createdAt: new Date().toISOString(),
      responseCount: 0
    };
    setSurveys(prev => [newSurvey, ...prev]);
    logAuditAction(user, 'SURVEY_CREATED', `Created new ${surveyData.type}: "${surveyData.title}"`);
    return newSurvey;
  };

  const submitSurveyResponse = (surveyId, responseAnswers, agentUser = null) => {
    setSurveys(prev => prev.map(s => s.id === surveyId ? { ...s, responseCount: (s.responseCount || 0) + 1 } : s));
    if (agentUser) {
      setAgents(prev => prev.map(a => a.userId === agentUser.id ? { ...a, surveysCompletedCount: (a.surveysCompletedCount || 0) + 1 } : a));
    }
    logAuditAction(agentUser, 'SURVEY_RESPONSE_SUBMITTED', `Submitted survey response for survey ${surveyId}`);
  };

  // Module 4: Field Reporting
  const addFieldReport = async (reportData, imageFiles = [], user = null) => {
    const mediaList = imageFiles.map((file, idx) => {
      const sim = compressImageSimulation(file);
      return {
        id: `MED-${Date.now()}-${idx}`,
        fileName: file.name || `photo_${idx + 1}.jpg`,
        originalSizeKb: sim.originalSizeKb,
        compressedSizeKb: sim.compressedSizeKb,
        thumbnailUrl: sim.thumbnailUrl,
        mediaUrl: file.preview || 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80'
      };
    });

    const newReport = {
      ...reportData,
      id: `REP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      agentId: user?.id || 'AGT-SYSTEM',
      agentName: user?.name || 'Field Agent',
      createdAt: new Date().toISOString(),
      media: mediaList
    };

    setFieldReports(prev => [newReport, ...prev]);
    if (user) {
      setAgents(prev => prev.map(a => a.userId === user.id ? { ...a, reportsSubmittedCount: (a.reportsSubmittedCount || 0) + 1, lastActivityTimestamp: new Date().toISOString() } : a));
    }
    logAuditAction(user, 'FIELD_REPORT_SUBMITTED', `Submitted ${reportData.category}: "${reportData.title}" (Severity: ${reportData.severityLevel})`);
    return newReport;
  };

  // Module 5: Stakeholder & Influence Network
  const addStakeholder = (stakeholderData, user) => {
    const newStk = {
      ...stakeholderData,
      id: `STK-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      activities: []
    };
    setStakeholders(prev => [newStk, ...prev]);
    logAuditAction(user, 'STAKEHOLDER_ADDED', `Added ${stakeholderData.category} leader: ${stakeholderData.name}`);
    return newStk;
  };

  const logStakeholderActivity = (stakeholderId, activityData, user) => {
    setStakeholders(prev => prev.map(s => {
      if (s.id === stakeholderId) {
        return {
          ...s,
          activities: [{ ...activityData, id: `ACT-${Date.now().toString().slice(-4)}` }, ...(s.activities || [])]
        };
      }
      return s;
    }));
    logAuditAction(user, 'STAKEHOLDER_ACTIVITY_LOGGED', `Logged activity "${activityData.type}" for stakeholder ${stakeholderId}`);
  };

  // Module 6: Campaign Strategy
  const updateCampaignTask = (phaseId, taskId, updatedFields, user) => {
    setCampaignPhases(prev => prev.map(phase => {
      if (phase.id === phaseId) {
        const updatedTasks = phase.tasks.map(t => t.id === taskId ? { ...t, ...updatedFields } : t);
        const completedCount = updatedTasks.filter(t => t.status === 'Completed').length;
        const progressPct = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : phase.progressPct;
        return {
          ...phase,
          tasks: updatedTasks,
          progressPct
        };
      }
      return phase;
    }));
    logAuditAction(user, 'STRATEGY_TASK_UPDATED', `Updated campaign task ${taskId} in Phase ${phaseId}`);
  };

  // Module 7: Tally Center & Election Day Operations
  const submitTallyCenterForm = (tallyData, user, options = {}) => {
    const validation = validateTallySubmission({
      candAVotes: tallyData.candAVotes,
      candBVotes: tallyData.candBVotes,
      candCVotes: tallyData.candCVotes,
      rejectedVotes: tallyData.rejectedVotes,
      registeredVoters: tallyData.registeredVoters,
      pollingStationId: tallyData.pollingStationId,
      existingTallies: tallyResults,
      allowOverwrite: options.allowOverwrite ?? false
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const totalCast = validation.parsed.totalVotesCast;
    const isMismatch = totalCast > (tallyData.registeredVoters || 1000);

    const existingIndex = tallyResults.findIndex((t) => t.pollingStationId === tallyData.pollingStationId);
    const existing = existingIndex >= 0 ? tallyResults[existingIndex] : null;

    const historyEntry = {
      timestamp: new Date().toISOString(),
      updatedBy: user?.name || 'Agent',
      role: user?.role || 'Agent',
      candAVotes: validation.parsed.candAVotes,
      candBVotes: validation.parsed.candBVotes,
      candCVotes: validation.parsed.candCVotes,
      rejectedVotes: validation.parsed.rejectedVotes,
      totalVotesCast: totalCast
    };

    const newTally = {
      ...tallyData,
      ...validation.parsed,
      id: existing ? existing.id : `TALLY-${Date.now().toString().slice(-4)}`,
      status: isMismatch ? 'Mismatch' : (existing?.status || 'Submitted'),
      submittedAt: existing ? existing.submittedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: existing ? [historyEntry, ...(existing.history || [])] : [historyEntry]
    };

    setTallyResults(prev => [newTally, ...prev.filter(t => t.pollingStationId !== tallyData.pollingStationId)]);
    logAuditAction(user, isMismatch ? 'TALLY_MISMATCH_DETECTED' : 'TALLY_SUBMITTED', `Submitted Tally Form for Station ${tallyData.pollingStationCode}. Status: ${newTally.status}`);
    return { success: true, tally: newTally };
  };

  const verifyTallyResult = (tallyId, status, comment, user) => {
    setTallyResults(prev => prev.map(t => {
      if (t.id === tallyId) {
        const verifyEntry = {
          timestamp: new Date().toISOString(),
          updatedBy: user?.name || 'Supervisor',
          role: user?.role || 'Supervisor',
          action: `Status changed to ${status}`,
          comment: comment || 'Verified'
        };
        return {
          ...t,
          status,
          approvalComment: comment,
          verifiedBy: user?.name || 'Supervisor',
          verifiedAt: new Date().toISOString(),
          history: [verifyEntry, ...(t.history || [])]
        };
      }
      return t;
    }));
    logAuditAction(user, 'TALLY_VERIFIED', `Supervisor ${user?.name} set status to ${status} for Tally ${tallyId}`);
  };

  // Module 8: AI Intelligence Assistant
  const sendAIQuery = async (promptText, user) => {
    const userMsg = {
      id: `CHAT-U-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toISOString()
    };

    setAiChatHistory(prev => [...prev, userMsg]);

    const contextData = {
      user,
      geography,
      stationIntelligence,
      fieldReports,
      surveys,
      stakeholders,
      tallyResults,
      campaignPhases
    };

    const res = await apiService.queryAIAssistant(promptText, contextData);
    const aiMsg = {
      id: res.id,
      sender: 'ai',
      text: res.response,
      provider: res.provider,
      timestamp: res.timestamp
    };

    setAiChatHistory(prev => [...prev, aiMsg]);
    logAuditAction(user, 'AI_ASSISTANT_QUERY', `Queried AI Assistant: "${promptText}" (${res.provider || 'AI'})`);
    return res;
  };

  // Legacy analysis & scoped getters
  const analyzeMismatch = (submission) => {
    const broadcast = broadcasts[submission.pollingStationId];
    if (!broadcast) return { hasMismatch: false, discrepancies: [] };
    const discrepancies = [];
    return { hasMismatch: discrepancies.length > 0, discrepancies };
  };

  const getScopedAgents = (user, customAgentList = null) => {
    if (!user) return [];
    const targetAgents = customAgentList || agents;

    // National executive roles see all agents nationally
    if (['Super Admin', 'Admin', 'Strategy Team', 'Presidential', 'President', 'Governor', 'Senator', 'Woman Rep'].includes(user.role)) {
      return targetAgents;
    }

    const userNameLower = (user.name || '').toLowerCase().trim();
    const userId = user.id;

    // Extract search tokens from user's assigned jurisdiction
    const tokens = [
      user.entityName,
      user.assignedEntity,
      user.constituency,
      user.ward,
      user.county
    ]
      .filter(Boolean)
      .map(t => String(t).toLowerCase().replace(/\b(county|constituency|ward|city)\b/gi, '').trim())
      .filter(t => t !== 'global' && t !== 'all' && t.length > 2);

    return targetAgents.filter(ag => {
      // 1. Direct ID binding match (Supervisor ID, Creator ID, Aspirant ID, Candidate ID, or User ID)
      if (ag.supervisorId && ag.supervisorId === userId) return true;
      if (ag.creatorId && ag.creatorId === userId) return true;
      if (ag.aspirantId && ag.aspirantId === userId) return true;
      if (ag.candidateId && ag.candidateId === userId) return true;
      if (ag.userId && ag.userId === userId) return true;

      // 2. Supervisor string match (e.g., "moha (MCA)", "David Ochieng")
      const agSupervisorLower = (ag.supervisor || ag.name || '').toLowerCase();
      if (userNameLower && agSupervisorLower.includes(userNameLower)) return true;

      // 3. Match agent region, ward, constituency, county, or assigned entity against user jurisdiction tokens
      const agFieldsLower = [
        ag.region,
        ag.entityName,
        ag.assignedEntity,
        ag.ward,
        ag.constituency,
        ag.county,
        ag.pollingStationName
      ]
        .filter(Boolean)
        .map(f => String(f).toLowerCase().replace(/\b(county|constituency|ward|city)\b/gi, '').trim())
        .filter(Boolean);

      return tokens.some(token =>
        agFieldsLower.some(field => field.includes(token) || token.includes(field))
      );
    });
  };

  const getScopedSubmissions = (user) => {
    return filterByScope(user, submissions, 'submissions');
  };

  const getScopedFieldReports = (user) => {
    return filterByScope(user, fieldReports, 'reports');
  };

  const getScopedTallyResults = (user) => {
    return filterByScope(user, tallyResults, 'tally');
  };

  const getScopedSurveys = (user) => {
    return filterByScope(user, surveys, 'surveys');
  };

  const getScopedStakeholders = (user) => {
    return filterByScope(user, stakeholders, 'stakeholders');
  };

  const getScopedGeography = (user) => {
    if (!user) return geography;
    const scope = getUserScope(user);
    if (scope.level === SCOPE_LEVELS.NATIONAL) return geography;

    const userCounty = (scope.county || user.county || '').toLowerCase();
    const userConst = (scope.constituency || user.constituency || '').toLowerCase();
    const userWard = (scope.ward || user.ward || '').toLowerCase();

    return {
      ...geography,
      counties: (geography.counties || []).filter(c => !userCounty || c.name.toLowerCase().includes(userCounty) || userCounty.includes(c.name.toLowerCase())),
      constituencies: (geography.constituencies || []).filter(c => !userConst || c.name.toLowerCase().includes(userConst) || userConst.includes(c.name.toLowerCase())),
      wards: (geography.wards || []).filter(w => !userWard || w.name.toLowerCase().includes(userWard) || userWard.includes(w.name.toLowerCase())),
      pollingStations: (geography.pollingStations || []).filter(ps => canAccessLocation(user, ps))
    };
  };

  // Strategy Team & Campaign Organization Actions
  const addStrategyMember = (memberData, user) => {
    const newMember = {
      ...memberData,
      id: `STM-${Date.now().toString().slice(-4)}`,
      dateJoined: new Date().toISOString().split('T')[0]
    };
    setStrategyMembers(prev => [newMember, ...prev]);
    logAuditAction(user, 'STRATEGY_MEMBER_ADDED', `Added team member ${newMember.name} as ${newMember.position} (${newMember.departmentId})`);
    return newMember;
  };

  const updateStrategyMember = (memberId, updatedFields, user) => {
    setStrategyMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updatedFields } : m));
    logAuditAction(user, 'STRATEGY_MEMBER_UPDATED', `Updated strategy team member ${memberId}`);
  };

  const addStrategyTask = (taskData, user) => {
    const newTask = {
      ...taskData,
      id: `ST-${Date.now().toString().slice(-4)}`
    };
    setStrategyTasks(prev => [newTask, ...prev]);
    logAuditAction(user, 'STRATEGY_TASK_CREATED', `Created strategy task: "${newTask.title}"`);
    return newTask;
  };

  const updateStrategyTask = (taskId, updatedFields, user) => {
    setStrategyTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
    logAuditAction(user, 'STRATEGY_TASK_UPDATED', `Updated strategy task ${taskId}`);
  };

  const addStrategyMeeting = (meetingData, user) => {
    const newMeeting = {
      ...meetingData,
      id: `MTG-${Date.now().toString().slice(-4)}`
    };
    setStrategyMeetings(prev => [newMeeting, ...prev]);
    logAuditAction(user, 'STRATEGY_MEETING_CREATED', `Created strategy meeting: "${newMeeting.title}"`);
    return newMeeting;
  };

  return (
    <DataContext.Provider
      value={{
        geography,
        setGeography,
        stationIntelligence,
        updateStationIntelligence,
        bulkImportPollingStations,
        agents,
        setAgents,
        createAgent,
        assignAgentToPollingStation,
        updateAgentStatus,
        surveys,
        addSurvey,
        submitSurveyResponse,
        fieldReports,
        addFieldReport,
        stakeholders,
        addStakeholder,
        logStakeholderActivity,
        campaignPhases,
        updateCampaignTask,
        tallyResults,
        submitTallyCenterForm,
        verifyTallyResult,
        aiChatHistory,
        sendAIQuery,
        submissions,
        broadcasts,
        auditLogs,
        logAuditAction,
        analyzeMismatch,
        getScopedAgents,
        getScopedSubmissions,
        getScopedFieldReports,
        getScopedTallyResults,
        getScopedSurveys,
        getScopedStakeholders,
        getScopedGeography,
        strategyMembers,
        setStrategyMembers,
        addStrategyMember,
        updateStrategyMember,
        strategyTasks,
        setStrategyTasks,
        addStrategyTask,
        updateStrategyTask,
        campaignRoadmap,
        setCampaignRoadmap,
        strategyMeetings,
        setStrategyMeetings,
        addStrategyMeeting
      }}
    >
      {children}
    </DataContext.Provider>
  );

};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
