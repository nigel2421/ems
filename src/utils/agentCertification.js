// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.5)
// Training Sandbox & Agent Certification Module Engine
// ====================================================================

export const CERTIFICATION_MODULES = [
  { id: 'MOD-01', title: 'Module 1: CI-EMS Basics & Navigation' },
  { id: 'MOD-02', title: 'Module 2: Polling Station Assignment & Check-In' },
  { id: 'MOD-03', title: 'Module 3: Offline Queue & Sync Operations' },
  { id: 'MOD-04', title: 'Module 4: Incident Reporting & SLA Escalation' },
  { id: 'MOD-05', title: 'Module 5: Evidence Capture & Form Quality Rules' },
  { id: 'MOD-06', title: 'Module 6: Result Submission (Form 34A-39A)' },
  { id: 'MOD-07', title: 'Module 7: Election-Day Rehearsal Simulation & Practical Exam' }
];

/**
  Evaluates agent training module progress and issues certification status
 */
export const evaluateAgentCertification = (agentProgress = {}) => {
  const completedModules = agentProgress.completedModules || [];
  const practicalExamPassed = agentProgress.practicalExamPassed === true;

  const completedCount = completedModules.length;
  const isFullyCertified = completedCount === CERTIFICATION_MODULES.length && practicalExamPassed;

  return {
    agentId: agentProgress.agentId || 'USR-AGENT-01',
    agentName: agentProgress.agentName || 'Field Agent',
    completedModulesCount: completedCount,
    totalModulesCount: CERTIFICATION_MODULES.length,
    practicalExamPassed,
    isFullyCertified,
    certificationStatus: isFullyCertified ? 'CI-EMS READY CERTIFIED' : 'TRAINING IN PROGRESS',
    certifiedAt: isFullyCertified ? (agentProgress.certifiedAt || new Date().toISOString()) : null
  };
};
