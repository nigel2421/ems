// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.1)
// Privacy Governance & Data Protection Subsystem (Kenya DPA / ODPC)
// ====================================================================

export const PRIVACY_DISCLAIMER = 
  "Designed to support compliance with Kenya's Data Protection Act and ODPC electoral guidance. Voter sentiment data is strictly aggregated at Ward/Constituency level. No individual political profiling or persuadability targeting.";

export const PRIVACY_PURPOSES = [
  { id: 'PURPOSE-1', name: 'Parallel Vote Tabulation', legalBasis: 'Public Interest / Electoral Observation', retentionMonths: 60 },
  { id: 'PURPOSE-2', name: 'Agent Coordination & Mobilization', legalBasis: 'Legitimate Interest / Contractual', retentionMonths: 36 },
  { id: 'PURPOSE-3', name: 'Aggregated Voter Issue Research', legalBasis: 'Consent / Anonymized Public Data', retentionMonths: 24 }
];

export const createPrivacyNoticeRecord = (noticeTitle, targetAudience) => ({
  noticeId: `PN-${Date.now()}`,
  noticeTitle,
  targetAudience,
  publishedAt: new Date().toISOString(),
  odpcReference: 'ODPC-GUIDANCE-ELECTORAL-2022',
  status: 'ACTIVE'
});

export const registerDataSubjectRequest = (requestType, subjectIdentifier) => ({
  requestId: `DSR-${Date.now()}`,
  requestType, // 'ACCESS', 'RECTIFICATION', 'DELETION', 'ANONYMIZATION'
  subjectIdentifier,
  receivedAt: new Date().toISOString(),
  deadlineAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'RECEIVED'
});

/**
  CI-EMS 3.0 Enforceable Data Policy Engine
 */
export const DATA_POLICIES = {
  AGENT_PERSONAL_DATA: {
    dataset: 'Agent Personal Information',
    purpose: 'Election Operational Deployment',
    collectionAllowed: true,
    exportAllowed: false,
    aiAccess: 'DENIED',
    analyticsMode: 'ANONYMIZED_ONLY',
    retentionDays: 90
  },
  EVIDENCE_STATUTORY_FORMS: {
    dataset: 'Statutory Form Scans & OCR',
    purpose: 'Electoral Evidence Vault',
    collectionAllowed: true,
    exportAllowed: true,
    aiAccess: 'READ_ONLY_SUMMARY',
    analyticsMode: 'FULL_AGGREGATE',
    retentionDays: 2555 // 7 Years for litigation
  },
  VOTER_SENTIMENT_RESEARCH: {
    dataset: 'Aggregated Voter Issues',
    purpose: 'Ward Issue Analytics',
    collectionAllowed: true,
    exportAllowed: true,
    aiAccess: 'READ_ONLY_ANALYTICS',
    analyticsMode: 'WARD_LEVEL_AGGREGATE_ONLY',
    retentionDays: 365
  },
  BIOMETRIC_REDACTED_SCANS: {
    dataset: 'Identity Document Redactions',
    purpose: 'Agent Verification',
    collectionAllowed: true,
    exportAllowed: false,
    aiAccess: 'DENIED',
    analyticsMode: 'NONE',
    retentionDays: 0 // Immediate redaction
  }
};

/**
  Evaluates data access against active ODPC privacy enforcement policies
 */
export const evaluateDataPolicy = (policyKey, actionType = 'USAGE') => {
  const policy = DATA_POLICIES[policyKey];
  if (!policy) {
    return { isAllowed: false, reason: `Unknown privacy policy key: ${policyKey}` };
  }

  switch (actionType) {
    case 'AI_PROCESSING':
      if (policy.aiAccess === 'DENIED') {
        return { isAllowed: false, policy, reason: 'AI processing explicitly denied by privacy policy' };
      }
      return { isAllowed: true, policy, mode: policy.aiAccess };

    case 'EXPORT':
      if (!policy.exportAllowed) {
        return { isAllowed: false, policy, reason: 'Dataset export denied under ODPC Kenya compliance' };
      }
      return { isAllowed: true, policy };

    default:
      return { isAllowed: true, policy };
  }
};

