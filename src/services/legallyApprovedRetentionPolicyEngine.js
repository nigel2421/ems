// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.1)
// Versioned Legally-Approved Evidence Retention Policy Engine
// ====================================================================

/**
  Legal Retention Disclaimer:
  Retention periods are configuration-driven and require documented legal/DPO approval. 
  No retention duration in CI-EMS should be interpreted as legal advice or an automatic statutory requirement.
 */
export const RETENTION_DISCLAIMER = 'DISCLAIMER: Retention periods are configuration-driven and require documented legal/DPO approval. No retention duration in CI-EMS should be interpreted as legal advice or an automatic statutory requirement.';

export const ELECTION_RETENTION_POLICIES = [
  {
    policyId: 'RET-KE-PRES-2027-V2',
    policyVersion: '2.0.0',
    datasetType: 'STATUTORY_EVIDENCE_FORM_34A',
    jurisdiction: 'KENYA',
    electionId: 'ELEC-KE-2027',
    contestType: 'PRESIDENTIAL',
    lawfulPurpose: 'Campaign Parallel Vote Verification & Legal Defense in Election Petitions',
    legalBasis: 'Elections (General) Regulations r 93 (Official Custody Reference), ODPC Data Minimization',
    retentionPeriodYears: 3,
    retentionPeriodDays: 1095,
    retentionTrigger: 'OFFICIAL_DECLARATION_OF_RESULTS',
    periodicReviewDate: '2028-08-01T00:00:00Z',
    legalHold: true,
    legalHoldReason: 'Mandatory Legal Hold Pending Expiry of Presidential Election Petition Window (Supreme Court of Kenya)',
    approvedBy: 'Senior Campaign Legal Counsel & Data Protection Officer (DPO)',
    effectiveDate: '2026-01-01T00:00:00Z',
    destructionRequiresCourtOrder: true,
    immutableLockRequired: true
  },
  {
    policyId: 'RET-KE-GOV-2027-V2',
    policyVersion: '2.0.0',
    datasetType: 'STATUTORY_EVIDENCE_FORM_38A',
    jurisdiction: 'KENYA',
    electionId: 'ELEC-KE-2027',
    contestType: 'GOVERNOR',
    lawfulPurpose: 'Gubernatorial Parallel Tally & Dispute Resolution',
    legalBasis: 'Elections (General) Regulations r 93 (3-Year Returning Officer Reference), ODPC Act 2019',
    retentionPeriodYears: 3,
    retentionPeriodDays: 1095,
    retentionTrigger: 'OFFICIAL_DECLARATION_OF_RESULTS',
    periodicReviewDate: '2028-08-01T00:00:00Z',
    legalHold: false,
    legalHoldReason: null,
    approvedBy: 'Campaign DPO & Legal Directorate',
    effectiveDate: '2026-01-01T00:00:00Z',
    destructionRequiresCourtOrder: false,
    immutableLockRequired: true
  },
  {
    policyId: 'RET-KE-PARL-2027-V2',
    policyVersion: '2.0.0',
    datasetType: 'STATUTORY_EVIDENCE_FORM_35A_36A',
    jurisdiction: 'KENYA',
    electionId: 'ELEC-KE-2027',
    contestType: 'PARLIAMENTARY',
    lawfulPurpose: 'Parliamentary & Senatorial Contest Audit Trail',
    legalBasis: 'Elections (General) Regulations r 93, ODPC Regulations 2021',
    retentionPeriodYears: 3,
    retentionPeriodDays: 1095,
    retentionTrigger: 'OFFICIAL_DECLARATION_OF_RESULTS',
    periodicReviewDate: '2028-08-01T00:00:00Z',
    legalHold: false,
    legalHoldReason: null,
    approvedBy: 'Campaign Legal Directorate',
    effectiveDate: '2026-01-01T00:00:00Z',
    destructionRequiresCourtOrder: false,
    immutableLockRequired: true
  },
  {
    policyId: 'RET-KE-LOGS-2027-V2',
    policyVersion: '2.0.0',
    datasetType: 'TEMPORARY_FIELD_LOGS',
    jurisdiction: 'KENYA',
    electionId: 'ELEC-KE-2027',
    contestType: 'TEMPORARY_LOGS',
    lawfulPurpose: 'System Operations & Performance Telemetry',
    legalBasis: 'ODPC Data Protection Act 2019 Sec 39 (Storage Limitation)',
    retentionPeriodYears: 1,
    retentionPeriodDays: 365,
    retentionTrigger: 'LOG_CREATION',
    periodicReviewDate: '2027-01-01T00:00:00Z',
    legalHold: false,
    legalHoldReason: null,
    approvedBy: 'Campaign DPO',
    effectiveDate: '2026-01-01T00:00:00Z',
    destructionRequiresCourtOrder: false,
    immutableLockRequired: false
  }
];

/**
  Resolves the legally approved evidence retention policy based on jurisdiction and contest type
 */
export const getLegallyApprovedRetentionPolicy = ({
  jurisdiction = 'KENYA',
  contestType = 'PRESIDENTIAL'
} = {}) => {
  const matchedPolicy = ELECTION_RETENTION_POLICIES.find(
    policy => policy.jurisdiction.toUpperCase() === jurisdiction.toUpperCase() &&
              policy.contestType.toUpperCase() === contestType.toUpperCase()
  ) || ELECTION_RETENTION_POLICIES[0];

  return {
    ...matchedPolicy,
    disclaimer: RETENTION_DISCLAIMER,
    evaluatedAt: new Date().toISOString()
  };
};

/**
  Calculates statutory expiration timestamp for an evidence record
 */
export const calculateStatutoryRetentionDate = (uploadDate = new Date(), policy) => {
  const activePolicy = policy || getLegallyApprovedRetentionPolicy();
  const startTime = new Date(uploadDate).getTime();
  const expirationTime = startTime + (activePolicy.retentionPeriodDays * 24 * 60 * 60 * 1000);
  
  return {
    retentionUntil: new Date(expirationTime).toISOString(),
    policyId: activePolicy.policyId,
    policyVersion: activePolicy.policyVersion,
    legalBasis: activePolicy.legalBasis,
    legalHold: activePolicy.legalHold,
    legalHoldReason: activePolicy.legalHoldReason,
    approvedBy: activePolicy.approvedBy,
    destructionRequiresCourtOrder: activePolicy.destructionRequiresCourtOrder,
    immutableLockRequired: activePolicy.immutableLockRequired,
    disclaimer: RETENTION_DISCLAIMER
  };
};
