// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.2)
// Domain Model: Statutory Forms, Configuration Lock Phases, Maker-Checker & Data Classification
// ====================================================================

export const STATUTORY_FORM_TYPES = {
  PRESIDENT: 'Form 34A',
  MP: 'Form 35A',
  SENATOR: 'Form 36A',
  WOMAN_REP: 'Form 37A',
  GOVERNOR: 'Form 38A',
  MCA: 'Form 39A',
  GENERIC: 'Result Declaration Form'
};

export const CONFIGURATION_LOCK_PHASES = {
  D_90_EDITABLE: 'D_90_EDITABLE',
  D_7_LOCKED: 'D_7_LOCKED',
  ELECTION_DAY_LOCKED: 'ELECTION_DAY_LOCKED',
  COUNTING_LOCKED: 'COUNTING_LOCKED'
};

export const DATA_CLASSIFICATIONS = {
  PUBLIC: 'PUBLIC',             // Polling station name, gazette codes
  INTERNAL: 'INTERNAL',         // Campaign tasks, phase objectives
  CONFIDENTIAL: 'CONFIDENTIAL', // Agent phone numbers, candidate strategies
  RESTRICTED: 'RESTRICTED'      // Security telemetry, access tokens, audit keys
};

export const getContestFormType = (contestOffice) => {
  const office = (contestOffice || '').toUpperCase();
  if (office.includes('PRESIDENT')) return STATUTORY_FORM_TYPES.PRESIDENT;
  if (office.includes('WOMAN REP') || office.includes('WOMEN REP')) return STATUTORY_FORM_TYPES.WOMAN_REP;
  if (office.includes('GOVERNOR') || office.includes('GUBERNATORIAL')) return STATUTORY_FORM_TYPES.GOVERNOR;
  if (office.includes('SENATOR') || office.includes('SENATORIAL')) return STATUTORY_FORM_TYPES.SENATOR;
  if (office.includes('MP') || office.includes('NATIONAL ASSEMBLY') || office.includes('PARLIAMENT')) return STATUTORY_FORM_TYPES.MP;
  if (office.includes('MCA') || office.includes('COUNTY ASSEMBLY') || office.includes('WARD')) return STATUTORY_FORM_TYPES.MCA;
  return STATUTORY_FORM_TYPES.GENERIC;
};

/**
 * Maker-Checker Dual Control Approval Workflow
 */
export const createMakerCheckerRequest = ({
  actionType,
  targetResource,
  requestedBy,
  proposedPayload,
  reason
}) => ({
  requestId: `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  actionType,
  targetResource,
  requestedBy: requestedBy?.id || requestedBy?.email || 'Admin A',
  requestedByName: requestedBy?.name || 'Admin A',
  requestedAt: new Date().toISOString(),
  proposedPayload,
  reason: reason || 'Elevated configuration change',
  status: 'PENDING_APPROVAL',
  approvedBy: null,
  approvedAt: null
});

export const approveMakerCheckerRequest = (request, approverUser) => {
  if (request.requestedBy === approverUser.id) {
    throw new Error('MAKER_CHECKER_VIOLATION: Approver cannot be the same user who requested the change');
  }

  return {
    ...request,
    status: 'APPROVED',
    approvedBy: approverUser.id || approverUser.email,
    approvedByName: approverUser.name || 'Admin B',
    approvedAt: new Date().toISOString()
  };
};

export const createNormalizedResultSubmission = ({
  submissionId,
  tenantId = 'TNT-001',
  campaignId = 'CMP-2026-NAIROBI',
  electionId = 'ELE-KENYA-2027',
  contestId = 'CNT-GOVERNOR-047',
  pollingUnitId,
  submittedBy,
  registeredVoters,
  totalVotesCast,
  rejectedVotes,
  candidateEntries = [],
  formType = STATUTORY_FORM_TYPES.GOVERNOR
}) => {
  const candidateTotal = candidateEntries.reduce((sum, c) => sum + (Number(c.votes) || 0), 0);
  const calculatedTotal = candidateTotal + (Number(rejectedVotes) || 0);

  return {
    submissionId: submissionId || `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tenantId,
    campaignId,
    electionId,
    contestId,
    pollingUnitId,
    submittedBy,
    submittedAt: new Date().toISOString(),
    status: 'Captured',
    formType,
    registeredVoters: Number(registeredVoters) || 0,
    candidateTotal,
    rejectedVotes: Number(rejectedVotes) || 0,
    totalVotesCast: Number(totalVotesCast) || calculatedTotal,
    entries: candidateEntries.map(entry => ({
      candidateId: entry.candidateId,
      candidateName: entry.candidateName,
      votes: Number(entry.votes) || 0
    }))
  };
};

export const evaluateResultDiscrepancy = (submission) => {
  const flags = [];
  const registered = Number(submission.registeredVoters) || 0;
  const cast = Number(submission.totalVotesCast) || 0;
  const entriesTotal = (submission.entries || []).reduce((acc, e) => acc + (Number(e.votes) || 0), 0);
  const rejected = Number(submission.rejectedVotes) || 0;
  const mathSum = entriesTotal + rejected;

  if (cast > registered && registered > 0) {
    flags.push({
      severity: 'CRITICAL',
      code: 'CAST_EXCEEDS_REGISTERED',
      message: `Total votes cast (${cast}) exceeds registered voters (${registered})`
    });
  }

  if (mathSum !== cast && cast > 0) {
    flags.push({
      severity: 'WARNING',
      code: 'SUM_MISMATCH',
      message: `Sum of candidate votes + rejected (${mathSum}) does not equal total cast (${cast})`
    });
  }

  return {
    isClean: flags.length === 0,
    overallStatus: flags.some(f => f.severity === 'CRITICAL') ? 'Mismatch' : flags.length > 0 ? 'Review Required' : 'Validated',
    flags
  };
};
