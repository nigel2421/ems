<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialGeography, initialSubmissions, iebcOfficialBroadcasts, initialAuditLogs, initialUsers } from '../data/mockData';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [geography, setGeography] = useState(() => {
    const saved = localStorage.getItem('ems_geography');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reset if cached version in localStorage is from old mock data (e.g. 4 counties instead of full 26)
      if (parsed.counties && parsed.counties.length >= 26) {
        return parsed;
      }
    }
    return initialGeography;
  });

  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem('ems_submissions');
    return saved ? JSON.parse(saved) : initialSubmissions;
  });

  const [broadcasts, setBroadcasts] = useState(() => {
    const saved = localStorage.getItem('ems_broadcasts');
    return saved ? JSON.parse(saved) : iebcOfficialBroadcasts;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('ems_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('ems_geography', JSON.stringify(geography));
  }, [geography]);

  useEffect(() => {
    localStorage.setItem('ems_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('ems_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper to log audit actions
  const logAuditAction = (user, action, details) => {
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'SYSTEM',
      userName: user?.name || 'System Bot',
      role: user?.role || 'System',
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Mismatch Analysis Algorithm
  const analyzeMismatch = (submission) => {
    const broadcast = broadcasts[submission.pollingStationId];
    if (!broadcast) return { hasMismatch: false, discrepancies: [] };

    const discrepancies = [];
    const subTallies = submission.tallies;
    const bcTallies = broadcast.tallies;

    // Check Presidential
    if (subTallies.presidential && bcTallies.presidential) {
      if (subTallies.presidential.candidateA !== bcTallies.presidential.candidateA) {
        discrepancies.push({
          category: 'Presidential Candidate A',
          agentCount: subTallies.presidential.candidateA,
          iebcCount: bcTallies.presidential.candidateA,
          diff: subTallies.presidential.candidateA - bcTallies.presidential.candidateA
        });
      }
    }

    // Check MP
    if (subTallies.mp && bcTallies.mp) {
      if (subTallies.mp.Wanyonyi !== bcTallies.mp.Wanyonyi) {
        discrepancies.push({
          category: 'MP Candidate (Wanyonyi)',
          agentCount: subTallies.mp.Wanyonyi,
          iebcCount: bcTallies.mp.Wanyonyi,
          diff: subTallies.mp.Wanyonyi - bcTallies.mp.Wanyonyi
        });
      }
    }

    return {
      hasMismatch: discrepancies.length > 0,
      discrepancies
    };
  };

  // Agent Submits Tally & Evidence
  const submitAgentForm = (newSubmissionData, user) => {
    const mismatchResult = analyzeMismatch(newSubmissionData);
    const finalStatus = mismatchResult.hasMismatch ? 'Mismatch' : 'Submitted';

    const submissionWithId = {
      ...newSubmissionData,
      id: `SUB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      status: finalStatus,
      timestamp: new Date().toISOString()
    };

    setSubmissions(prev => [submissionWithId, ...prev]);

    logAuditAction(
      user,
      mismatchResult.hasMismatch ? 'SUBMISSION_MISMATCH_FLAGGED' : 'EVIDENCE_SUBMISSION',
      `Submitted Form 34A evidence for ${newSubmissionData.pollingStationName}. Status: ${finalStatus}.`
    );

    if (mismatchResult.hasMismatch) {
      logAuditAction(
        { id: 'SYSTEM_BOT', name: 'IEBC Auto-Validator Engine', role: 'Admin' },
        'MISMATCH_DETECTED',
        `FLAGGED DISCREPANCY on ${newSubmissionData.pollingStationName}: Variance of ${mismatchResult.discrepancies.map(d => `${d.category} (${d.diff > 0 ? '+' : ''}${d.diff})`).join(', ')}`
      );
    }

    return submissionWithId;
  };

  // Aspirant Approves or Rejects Agent Submission
  const updateSubmissionStatus = (submissionId, status, comment, user) => {
    setSubmissions(prev =>
      prev.map(sub => {
        if (sub.id === submissionId) {
          return {
            ...sub,
            status,
            approvalDate: new Date().toISOString(),
            approvalComment: comment
          };
        }
        return sub;
      })
    );

    logAuditAction(
      user,
      status === 'Approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED',
      `${status} submission ${submissionId} for Aspirant. Rationale: "${comment}"`
    );
  };

  // Admin Assigns Agent to Polling Station
  const assignAgentToPollingStation = (agentId, pollingStationId, user) => {
    setGeography(prev => ({
      ...prev,
      pollingStations: prev.pollingStations.map(ps => {
        if (ps.id === pollingStationId) {
          return { ...ps, agentAssigned: agentId };
        }
        if (ps.agentAssigned === agentId && ps.id !== pollingStationId) {
          return { ...ps, agentAssigned: null }; // clear previous assignment
        }
        return ps;
      })
    }));

    logAuditAction(
      user,
      'AGENT_ASSIGNMENT',
      `Assigned Agent ${agentId} to Polling Station ${pollingStationId}.`
    );
  };

  // Get agents linked strictly to a specific Aspirant / Ticket / Creator
  const getScopedAgents = (user, allUsers = null) => {
    if (!user) return [];
    
    let userList = allUsers;
    if (!userList) {
      const saved = localStorage.getItem('ems_users');
      userList = saved ? JSON.parse(saved) : initialUsers;
    }

    if (user.role === 'Admin') return userList.filter(u => u.role === 'Agent');

    // Aspirants, Governors, MPs only see agents where creatorId === user.id OR aspirantId === user.id
    return userList.filter(
      u => u.role === 'Agent' && (u.creatorId === user.id || u.aspirantId === user.id)
    );
  };

  // Get submissions linked strictly to a specific candidate tenant's agents
  const getScopedSubmissions = (user) => {
    if (!user) return [];
    if (user.role === 'Admin') return submissions; // System HQ Super Admin

    // Scope submissions strictly to agents bound to this user (by aspirantId, creatorId, or agentId)
    const tenantAgents = getScopedAgents(user);
    const tenantAgentIds = tenantAgents.map(a => a.id);

    if (user.role === 'Agent') {
      return submissions.filter(s => s.agentId === user.id);
    }

    return submissions.filter(
      s => tenantAgentIds.includes(s.agentId) || s.aspirantId === user.id || s.agentId === user.id
    );
  };

  return (
    <DataContext.Provider
      value={{
        geography,
        submissions,
        broadcasts,
        auditLogs,
        submitAgentForm,
        updateSubmissionStatus,
        assignAgentToPollingStation,
        analyzeMismatch,
        logAuditAction,
        getScopedAgents,
        getScopedSubmissions
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
=======
import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { apiService, compressImageSimulation } from '../services/api';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  // 1. Geography & Polling Stations
  const [geography, setGeography] = useState(() => {
    const saved = localStorage.getItem('ems_geography');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.counties && parsed.counties.length >= 26) {
        return parsed;
      }
    }
    return initialGeography;
  });

  // 2. Polling Station Intelligence Scores
  const [stationIntelligence, setStationIntelligence] = useState(() => {
    const saved = localStorage.getItem('ems_station_intelligence');
    return saved ? JSON.parse(saved) : initialStationIntelligence;
  });

  // 3. Agent Directory
  const [agents, setAgents] = useState(() => {
    const saved = localStorage.getItem('ems_agent_directory');
    return saved ? JSON.parse(saved) : initialAgentDirectory;
  });

  // 4. Surveys
  const [surveys, setSurveys] = useState(() => {
    const saved = localStorage.getItem('ems_surveys');
    return saved ? JSON.parse(saved) : initialSurveys;
  });

  // 5. Field Reports
  const [fieldReports, setFieldReports] = useState(() => {
    const saved = localStorage.getItem('ems_field_reports');
    return saved ? JSON.parse(saved) : initialFieldReports;
  });

  // 6. Stakeholders / Influence Network
  const [stakeholders, setStakeholders] = useState(() => {
    const saved = localStorage.getItem('ems_stakeholders');
    return saved ? JSON.parse(saved) : initialStakeholders;
  });

  // 7. Campaign Strategy & Phases
  const [campaignPhases, setCampaignPhases] = useState(() => {
    const saved = localStorage.getItem('ems_campaign_phases');
    return saved ? JSON.parse(saved) : initialCampaignPhases;
  });

  // 8. Tally Center Results & Submissions
  const [tallyResults, setTallyResults] = useState(() => {
    const saved = localStorage.getItem('ems_tally_results');
    return saved ? JSON.parse(saved) : initialTallyCenterData;
  });

  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem('ems_submissions');
    return saved ? JSON.parse(saved) : initialSubmissions;
  });

  const [broadcasts, setBroadcasts] = useState(() => {
    const saved = localStorage.getItem('ems_broadcasts');
    return saved ? JSON.parse(saved) : iebcOfficialBroadcasts;
  });

  // 9. AI Chat History
  const [aiChatHistory, setAiChatHistory] = useState(() => {
    const saved = localStorage.getItem('ems_ai_chat');
    return saved ? JSON.parse(saved) : initialAIChatHistory;
  });

  // 10. Audit Logs
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('ems_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  // Persist State to LocalStorage
  useEffect(() => { localStorage.setItem('ems_geography', JSON.stringify(geography)); }, [geography]);
  useEffect(() => { localStorage.setItem('ems_station_intelligence', JSON.stringify(stationIntelligence)); }, [stationIntelligence]);
  useEffect(() => { localStorage.setItem('ems_agent_directory', JSON.stringify(agents)); }, [agents]);
  useEffect(() => { localStorage.setItem('ems_surveys', JSON.stringify(surveys)); }, [surveys]);
  useEffect(() => { localStorage.setItem('ems_field_reports', JSON.stringify(fieldReports)); }, [fieldReports]);
  useEffect(() => { localStorage.setItem('ems_stakeholders', JSON.stringify(stakeholders)); }, [stakeholders]);
  useEffect(() => { localStorage.setItem('ems_campaign_phases', JSON.stringify(campaignPhases)); }, [campaignPhases]);
  useEffect(() => { localStorage.setItem('ems_tally_results', JSON.stringify(tallyResults)); }, [tallyResults]);
  useEffect(() => { localStorage.setItem('ems_submissions', JSON.stringify(submissions)); }, [submissions]);
  useEffect(() => { localStorage.setItem('ems_ai_chat', JSON.stringify(aiChatHistory)); }, [aiChatHistory]);
  useEffect(() => { localStorage.setItem('ems_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);

  // Audit Logger Helper
  const logAuditAction = (user, action, details) => {
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'SYSTEM',
      userName: user?.name || 'System Bot',
      role: user?.role || 'System',
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
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
          riskLevel: 'Low'
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
  const submitTallyCenterForm = (tallyData, user) => {
    const totalCast = parseInt(tallyData.candAVotes) + parseInt(tallyData.candBVotes) + parseInt(tallyData.candCVotes) + parseInt(tallyData.rejectedVotes);
    const isMismatch = totalCast > (tallyData.registeredVoters || 1000);

    const newTally = {
      ...tallyData,
      id: `TALLY-${Date.now().toString().slice(-4)}`,
      totalVotesCast: totalCast,
      status: isMismatch ? 'Mismatch' : 'Submitted',
      submittedAt: new Date().toISOString()
    };

    setTallyResults(prev => [newTally, ...prev.filter(t => t.pollingStationId !== tallyData.pollingStationId)]);
    logAuditAction(user, isMismatch ? 'TALLY_MISMATCH_DETECTED' : 'TALLY_SUBMITTED', `Submitted Tally Form for Station ${tallyData.pollingStationCode}. Status: ${newTally.status}`);
    return newTally;
  };

  const verifyTallyResult = (tallyId, status, comment, user) => {
    setTallyResults(prev => prev.map(t => t.id === tallyId ? { ...t, status, approvalComment: comment, verifiedBy: user?.name || 'Supervisor' } : t));
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
    if (['Super Admin', 'Admin', 'Strategy Team', 'Governor', 'Senator'].includes(user.role)) {
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
      .map(t => String(t).toLowerCase().trim())
      .filter(t => t !== 'global' && t.length > 2);

    return targetAgents.filter(ag => {
      // 1. Direct ID binding match (Supervisor ID, Creator ID, Aspirant ID, or User ID)
      if (ag.supervisorId && ag.supervisorId === userId) return true;
      if (ag.creatorId && ag.creatorId === userId) return true;
      if (ag.aspirantId && ag.aspirantId === userId) return true;
      if (ag.userId && ag.userId === userId) return true;

      // 2. Supervisor string match (e.g., "moha (MCA)", "David Ochieng")
      const agSupervisorLower = (ag.supervisor || ag.name || '').toLowerCase();
      if (userNameLower && agSupervisorLower.includes(userNameLower)) return true;

      // 3. Match agent region or assigned entity against user jurisdiction tokens
      const agRegionLower = (ag.region || ag.entityName || '').toLowerCase();
      const agAssignedLower = (ag.assignedEntity || '').toLowerCase();

      return tokens.some(token => 
        agRegionLower.includes(token) || token.includes(agRegionLower) ||
        agAssignedLower.includes(token) || token.includes(agAssignedLower)
      );
    });
  };

  const getScopedSubmissions = (user) => {
    if (!user) return [];
    if (user.role === 'Super Admin' || user.role === 'Admin') return submissions;
    return submissions;
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
        getScopedSubmissions
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
>>>>>>> ef7cb7aa1a098dbbffd93d594dd1429f163322e4
