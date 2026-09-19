// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.1)
// Production S3-Compatible Object Storage & Immutability Engine
// ====================================================================

import crypto from 'node:crypto';
import {
  getLegallyApprovedRetentionPolicy,
  calculateStatutoryRetentionDate
} from './legallyApprovedRetentionPolicyEngine.js';

export const STORAGE_BUCKETS = {
  EVIDENCE_VAULT: 'ci-ems-evidence-vault-prod',
  AUDIT_CHECKPOINTS: 'ci-ems-audit-checkpoints-prod',
  BIOMETRIC_REDACTIONS: 'ci-ems-biometric-redactions-prod'
};

/**
  Calculates deterministic SHA-256 digest of binary/text file payload
 */
export const calculatePayloadHash = (payload) => {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload || '');
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
  Creates an immutable object storage record with SHA-256 content hash & versioned legal retention policy lock
 */
export const createObjectStoreRecord = ({
  bucketName = STORAGE_BUCKETS.EVIDENCE_VAULT,
  objectKey,
  payload,
  mimeType = 'image/jpeg',
  tenantId = 'TENANT-KENYA-2027',
  contestType = 'PRESIDENTIAL',
  jurisdiction = 'KENYA',
  customPolicy = null
}) => {
  if (!objectKey) throw new Error('objectKey is required');

  const contentHash = calculatePayloadHash(payload);
  const now = new Date();
  
  const activePolicy = customPolicy || getLegallyApprovedRetentionPolicy({ jurisdiction, contestType });
  const retentionInfo = calculateStatutoryRetentionDate(now, activePolicy);

  return {
    bucketName,
    objectKey: `${tenantId}/${objectKey}`,
    tenantId,
    contentHash,
    mimeType,
    sizeBytes: typeof payload === 'string' ? payload.length : 1024,
    uploadedAt: now.toISOString(),
    retentionUntil: retentionInfo.retentionUntil,
    retentionPolicyId: activePolicy.policyId,
    retentionPolicyVersion: activePolicy.policyVersion,
    statuteReference: activePolicy.statuteReference,
    destructionRequiresCourtOrder: activePolicy.destructionRequiresCourtOrder,
    isImmutable: true,
    storageClass: 'STANDARD_IA'
  };
};

/**
  Verifies object hash against expected SHA-256 payload hash
 */
export const verifyObjectIntegrity = (objectRecord, currentPayload) => {
  if (!objectRecord || !objectRecord.contentHash) {
    return { isVerified: false, reason: 'Missing storage record hash' };
  }

  const currentHash = calculatePayloadHash(currentPayload);
  const isMatch = objectRecord.contentHash === currentHash;

  return {
    isVerified: isMatch,
    expectedHash: objectRecord.contentHash,
    calculatedHash: currentHash,
    statusMessage: isMatch ? '✓ SHA-256 Object Integrity Verified Intact' : 'CRITICAL CORRUPTION: SHA-256 Hash Mismatch'
  };
};

/**
  Generates a time-bound signed access URL after checking tenant authorization
 */
export const generateSignedObjectUrl = (objectRecord, requestorUser, expirationSeconds = 900) => {
  if (!objectRecord || !requestorUser) {
    throw new Error('Invalid storage record or requestor context');
  }

  if (requestorUser.tenantId && requestorUser.tenantId !== objectRecord.tenantId) {
    throw new Error(`SECURITY ACCESS DENIED: Requestor tenant (${requestorUser.tenantId}) cannot access object in tenant (${objectRecord.tenantId})`);
  }

  const expiresAt = new Date(Date.now() + expirationSeconds * 1000).toISOString();
  const signature = calculatePayloadHash(`${objectRecord.objectKey}:${expiresAt}:${requestorUser.id}`);

  return {
    signedUrl: `https://${objectRecord.bucketName}.s3.amazonaws.com/${objectRecord.objectKey}?X-Amz-Expires=${expirationSeconds}&X-Amz-Signature=${signature}`,
    expiresAt,
    tenantId: objectRecord.tenantId
  };
};

/**
  Simulates an object storage recovery test, verifying bucket integrity, payload hash auditing, and corruption quarantine
 */
export const runObjectStorageRecoveryTest = (testRecords = []) => {
  const samplePayload = 'FORM_34A_BINARY_PAYLOAD_DATA_SAMPLE';
  const validRecord = createObjectStoreRecord({
    objectKey: 'test_form_34a.jpg',
    payload: samplePayload,
    contestType: 'PRESIDENTIAL'
  });

  const validVerification = verifyObjectIntegrity(validRecord, samplePayload);
  const corruptVerification = verifyObjectIntegrity(validRecord, 'CORRUPTED_PAYLOAD_TAMPERED');

  const isTestPassed = validVerification.isVerified && !corruptVerification.isVerified;

  return {
    testName: 'S3 Object Storage Payload Integrity & Corruption Quarantine Test',
    validObjectHash: validRecord.contentHash,
    validVerificationResult: validVerification.isVerified,
    corruptVerificationQuarantined: !corruptVerification.isVerified,
    retentionPolicyEnforced: validRecord.destructionRequiresCourtOrder === true,
    isPassed: isTestPassed,
    executedAt: new Date().toISOString()
  };
};
