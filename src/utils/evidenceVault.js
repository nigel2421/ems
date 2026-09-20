// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.2)
// Evidence Vault: Quality Scoring, Field-Level Reconciliation & Discrepancy Case Management
// ====================================================================

export const calculateEvidenceHash = async (fileOrText) => {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      let buffer;
      if (typeof fileOrText === 'string') {
        buffer = new TextEncoder().encode(fileOrText);
      } else if (fileOrText instanceof Blob || fileOrText instanceof File) {
        buffer = await fileOrText.arrayBuffer();
      } else {
        buffer = new TextEncoder().encode(JSON.stringify(fileOrText));
      }
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // Fallback simulation hash
  }
  return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

/**
 * 0-100 Evidence Quality Score calculation
 */
export const calculateEvidenceQualityScore = (payload = {}) => {
  let score = 0;
  const breakdown = [];

  if (payload.imageReadable !== false) { score += 20; breakdown.push({ rule: 'Image readable', pts: 20 }); }
  if (payload.stationId || payload.pollingStationCode) { score += 15; breakdown.push({ rule: 'Station identified', pts: 15 }); }
  if (payload.formType) { score += 15; breakdown.push({ rule: 'Correct form type', pts: 15 }); }
  if (payload.fieldsDetected !== false) { score += 10; breakdown.push({ rule: 'Required fields detected', pts: 10 }); }
  if (payload.mathValid !== false) { score += 15; breakdown.push({ rule: 'Totals mathematically valid', pts: 15 }); }
  if (payload.signaturesDetected) { score += 5; breakdown.push({ rule: 'Expected signatures detected', pts: 5 }); }
  if (payload.stampDetected) { score += 5; breakdown.push({ rule: 'Stamp detected', pts: 5 }); }
  if (payload.isDuplicate !== true) { score += 10; breakdown.push({ rule: 'Duplicate check passed', pts: 10 }); }
  if (payload.manualReviewed) { score += 5; breakdown.push({ rule: 'Manual reviewer verified', pts: 5 }); }

  const automatedValidationStatus = score >= 85 ? 'PASS' : score >= 70 ? 'WARNING' : 'CRITICAL';
  const humanVerificationStatus = payload.humanVerificationStatus || 'PENDING';
  const tallyEligibility = (humanVerificationStatus === 'APPROVED' && score >= 70) ? 'ELIGIBLE' : 'NOT_ELIGIBLE';

  return {
    score,
    automatedValidationStatus,
    humanVerificationStatus,
    tallyEligibility,
    breakdown
  };
};

export const calculateEvidenceConfidenceScore = calculateEvidenceQualityScore;

/**
 * Field-Level 3-Way Reconciliation
 */
export const evaluateFieldLevelReconciliation = (agentReported = {}, campaignVerified = {}, officialReference = {}) => {
  if (!agentReported || !campaignVerified || !officialReference) {
    return {
      status: 'INCOMPLETE',
      label: 'INCOMPLETE',
      affectedFields: [],
      message: 'One or more result sources missing for field-level reconciliation'
    };
  }

  const fields = ['candAVotes', 'candBVotes', 'candCVotes', 'rejectedVotes', 'totalVotesCast'];
  const affectedFields = [];

  fields.forEach(field => {
    const a = Number(agentReported[field] || 0);
    const c = Number(campaignVerified[field] || 0);
    const o = Number(officialReference[field] || 0);

    if (a !== c || c !== o) {
      affectedFields.push({
        field,
        agentValue: a,
        verifiedValue: c,
        officialValue: o,
        diff: c - o
      });
    }
  });

  if (affectedFields.length === 0) {
    return {
      status: 'RECONCILED',
      label: 'RECONCILED',
      affectedFields: [],
      message: 'All candidate and ballot totals match across Agent, Campaign, and Official Reference'
    };
  }

  const isOfficialDiffOnly = affectedFields.every(f => f.agentValue === f.verifiedValue && f.verifiedValue !== f.officialValue);
  const status = isOfficialDiffOnly ? 'OFFICIAL_REFERENCE_DIFFERENCE' : 'DISCREPANCY_DETECTED';

  return {
    status,
    label: isOfficialDiffOnly ? 'OFFICIAL REFERENCE DIFFERENCE' : 'DISCREPANCY DETECTED',
    affectedFields,
    message: `${affectedFields.length} field(s) show differences across sources`
  };
};

/**
 * Discrepancy Case Management System
 */
export const createReconciliationCase = (pollingUnitId, contestId, reconciliationEval, author) => ({
  caseId: `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  pollingUnitId,
  contestId,
  severity: reconciliationEval.affectedFields.length > 2 ? 'HIGH' : 'MEDIUM',
  affectedFields: reconciliationEval.affectedFields,
  assignedReviewer: null,
  status: 'CASE_CREATED',
  resolution: null,
  resolutionNotes: null,
  createdAt: new Date().toISOString(),
  createdBy: author?.name || author?.email || 'System'
});

/**
 * Immutable Chain-of-Custody Event Tracker
 */
export const createEvidenceCustodyEvent = (evidenceId, eventType, actor, details = {}) => ({
  eventId: `CUSTODY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  evidenceId,
  eventType, // CAPTURED, HASH_CREATED, QUEUED_OFFLINE, UPLOAD_STARTED, SERVER_RECEIVED, HASH_VERIFIED, OCR_COMPLETED, REVIEW_OPENED, CAMPAIGN_VERIFIED
  timestamp: new Date().toISOString(),
  actor: actor?.name || actor?.email || 'System',
  details
});

export const createSubmissionVersion = (existingSubmission, newFields, reason, author) => {
  const versionHistory = existingSubmission.versionHistory || [];
  const currentVersionNumber = versionHistory.length + 1;

  const snapshot = {
    versionNumber: currentVersionNumber,
    timestamp: new Date().toISOString(),
    author: author?.name || author?.email || 'Supervisor',
    reason: reason || 'Data correction',
    previousData: {
      candAVotes: existingSubmission.candAVotes,
      candBVotes: existingSubmission.candBVotes,
      candCVotes: existingSubmission.candCVotes,
      rejectedVotes: existingSubmission.rejectedVotes,
      status: existingSubmission.status
    }
  };

  return {
    ...existingSubmission,
    ...newFields,
    versionNumber: currentVersionNumber + 1,
    versionHistory: [snapshot, ...versionHistory]
  };
};
