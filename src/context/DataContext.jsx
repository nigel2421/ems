import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialGeography, initialSubmissions, iebcOfficialBroadcasts, initialAuditLogs } from '../data/mockData';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [geography, setGeography] = useState(() => {
    const saved = localStorage.getItem('ems_geography');
    return saved ? JSON.parse(saved) : initialGeography;
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
        logAuditAction
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
