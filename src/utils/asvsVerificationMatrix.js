// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.1)
// OWASP Application Security Verification Standard (ASVS 5.0) Requirement-Level Matrix
// ====================================================================

export const ASVS_VERIFICATION_STATUS = {
  FULLY_VERIFIED: 'FULLY_VERIFIED',
  PARTIALLY_VERIFIED: 'PARTIALLY_VERIFIED',
  ENVIRONMENT_DEPENDENT_UNVERIFIED: 'ENVIRONMENT_DEPENDENT_UNVERIFIED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  FAILED_OR_BLOCKED: 'FAILED_OR_BLOCKED'
};

export const ASVS_5_MATRIX = [
  {
    reqId: 'V2.1.1',
    category: 'Authentication Architecture',
    description: 'Verify that server-side session token verification and registered device binding block revoked credentials.',
    ciEmsControl: 'Server Identity & Session Verification Engine',
    implementationFile: 'src/services/authServerEngine.js',
    testEvidence: 'Tests 111, 114, 170',
    verificationStatus: ASVS_VERIFICATION_STATUS.FULLY_VERIFIED
  },
  {
    reqId: 'V4.1.1',
    category: 'Access Control Architecture',
    description: 'Verify that server enforces all access control decisions, avoiding reliance on untrusted client claims.',
    ciEmsControl: 'Server-Derived Context & RBAC Engine',
    implementationFile: 'src/utils/rbac.js',
    testEvidence: 'Tests 68-71, 123, 162-165',
    verificationStatus: ASVS_VERIFICATION_STATUS.FULLY_VERIFIED
  },
  {
    reqId: 'V4.2.2',
    category: 'Multi-Tenant Isolation',
    description: 'Verify that multi-tenant isolation is enforced at application and PostgreSQL database layers via RLS policies.',
    ciEmsControl: 'PostgreSQL Row-Level Security Engine',
    implementationFile: 'src/services/postgresRlsEngine.js',
    testEvidence: 'Tests 68, 71, 108, 161-165',
    verificationStatus: ASVS_VERIFICATION_STATUS.FULLY_VERIFIED
  },
  {
    reqId: 'V5.1.1',
    category: 'Input & Data Validation',
    description: 'Verify that all input vote data and statutory form parameters undergo strict server-side schema validation.',
    ciEmsControl: 'Arithmetic Engine & Input Sanitizer',
    implementationFile: 'src/utils/domainModel.js',
    testEvidence: 'Tests 34-36, 87',
    verificationStatus: ASVS_VERIFICATION_STATUS.FULLY_VERIFIED
  },
  {
    reqId: 'V6.2.1',
    category: 'Cryptographic Storage & Keys',
    description: 'Verify that Cloud KMS HSM key management and Envelope Encryption protect database columns at rest.',
    ciEmsControl: 'AWS KMS HSM / Cloud Key Vault Configuration',
    implementationFile: 'Infrastructure Binding Layer',
    testEvidence: 'Requires Live Cloud HSM Binding',
    verificationStatus: ASVS_VERIFICATION_STATUS.ENVIRONMENT_DEPENDENT_UNVERIFIED
  },
  {
    reqId: 'V8.1.1',
    category: 'Data Protection & Hashing',
    description: 'Verify that statutory election evidence objects are stored with SHA-256 binary checksums and legal retention locks.',
    ciEmsControl: 'S3 Object Storage & Immutability Engine',
    implementationFile: 'src/services/objectStorageEngine.js',
    testEvidence: 'Tests 46, 84, 166-169',
    verificationStatus: ASVS_VERIFICATION_STATUS.FULLY_VERIFIED
  },
  {
    reqId: 'V9.1.1',
    category: 'Communications Security',
    description: 'Verify that TLS 1.3 encryption in transit with HTTP Strict Transport Security (HSTS) is enforced on production domain ingress.',
    ciEmsControl: 'Cloudflare / AWS ALB Edge Ingress Policy',
    implementationFile: 'Edge Ingress Config',
    testEvidence: 'Requires Production Edge Binding',
    verificationStatus: ASVS_VERIFICATION_STATUS.ENVIRONMENT_DEPENDENT_UNVERIFIED
  },
  {
    reqId: 'V10.1.1',
    category: 'Malicious Code & Audit Tracing',
    description: 'Verify that administrative & high-risk security operations record tamper-evident audit logs with correlation IDs.',
    ciEmsControl: 'Tamper-Evident Ledger & Correlation Engine',
    implementationFile: 'src/utils/tamperEvidentLedger.js',
    testEvidence: 'Tests 91, 118, 143-144, 171',
    verificationStatus: ASVS_VERIFICATION_STATUS.FULLY_VERIFIED
  },
  {
    reqId: 'V14.1.1',
    category: 'Hardware & Physical Security',
    description: 'Verify physical biometric access security on server hardware chassis.',
    ciEmsControl: 'Managed Server Infrastructure (AWS/GCP)',
    implementationFile: 'Cloud Provider Infrastructure SLA',
    testEvidence: 'Handled by AWS SOC 2 Type II Certification',
    verificationStatus: ASVS_VERIFICATION_STATUS.NOT_APPLICABLE,
    reason: 'Application runs on managed multi-tenant cloud infrastructure; physical hardware access is managed by cloud provider.',
    reviewer: 'Chief Information Security Officer (CISO)',
    reviewedAt: '2026-09-19T21:00:00Z'
  }
];

/**
  Evaluates granular requirement-level OWASP ASVS 5.0 security compliance status
 */
export const evaluateASVSCompliance = (matrix = ASVS_5_MATRIX) => {
  const total = matrix.length;
  
  const fullyVerifiedCount = matrix.filter(
    item => item.verificationStatus === ASVS_VERIFICATION_STATUS.FULLY_VERIFIED
  ).length;

  const partiallyVerifiedCount = matrix.filter(
    item => item.verificationStatus === ASVS_VERIFICATION_STATUS.PARTIALLY_VERIFIED
  ).length;

  const envDependentCount = matrix.filter(
    item => item.verificationStatus === ASVS_VERIFICATION_STATUS.ENVIRONMENT_DEPENDENT_UNVERIFIED
  ).length;

  const notApplicableCount = matrix.filter(
    item => item.verificationStatus === ASVS_VERIFICATION_STATUS.NOT_APPLICABLE
  ).length;

  const failedCount = matrix.filter(
    item => item.verificationStatus === ASVS_VERIFICATION_STATUS.FAILED_OR_BLOCKED
  ).length;

  const applicableTotal = total - notApplicableCount;
  const softwareVerifiedPercentage = Math.round((fullyVerifiedCount / applicableTotal) * 100);

  return {
    asvsVersion: '5.0.0',
    totalRequirements: total,
    applicableRequirements: applicableTotal,
    fullyVerifiedCount,
    partiallyVerifiedCount,
    envDependentCount,
    notApplicableCount,
    failedCount,
    softwareVerifiedPercentage,
    statusMessage: envDependentCount > 0
      ? `ℹ️ ASVS Status: ${fullyVerifiedCount}/${applicableTotal} Applicable Requirements Fully Verified (${envDependentCount} Environment-Dependent pending live cloud infra)`
      : `✓ ${fullyVerifiedCount}/${applicableTotal} ASVS Requirements Fully Verified`
  };
};
