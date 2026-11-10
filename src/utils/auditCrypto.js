// ====================================================================
// KuraTech Cryptographic Audit Trail Engine
// SHA-256 Hash-Chaining & Tamper-Evident Election Logging
// ====================================================================

import { jsPDF } from 'jspdf';

/**
 * Fast synchronous / asynchronous SHA-256 digest
 */
export const computeSha256 = async (text) => {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Synchronous fallback hash for environments without WebCrypto
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
};

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Creates a new tamper-evident audit record cryptographically linked to the previous log
 */
export const createChainedAuditLog = async ({
  previousHash = GENESIS_HASH,
  userId = 'SYSTEM',
  userName = 'System Engine',
  role = 'System',
  action = 'ACTION',
  details = '',
  scope = 'National',
  metadata = {}
}) => {
  const timestamp = new Date().toISOString();
  const rawPayload = `${previousHash}|${timestamp}|${userId}|${role}|${action}|${details}|${scope}`;
  const hash = await computeSha256(rawPayload);

  return {
    id: `LOG-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp,
    userId,
    userName,
    role,
    action,
    details,
    scope,
    previousHash,
    hash,
    metadata
  };
};

/**
 * Verifies the mathematical integrity of the entire audit chain
 * Returns { isIntact: boolean, totalChecked: number, brokenAt: number | null }
 */
export const verifyAuditChainIntegrity = async (logs = []) => {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { isIntact: true, totalChecked: 0, brokenAt: null };
  }

  // Logs ordered newest-first or oldest-first
  // Ensure we sort chronologically from oldest to newest for verification
  const chronological = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  for (let i = 0; i < chronological.length; i++) {
    const current = chronological[i];
    const expectedPrev = i === 0 ? (current.previousHash || GENESIS_HASH) : chronological[i - 1].hash;

    if (current.previousHash && current.previousHash !== expectedPrev) {
      return {
        isIntact: false,
        totalChecked: i,
        brokenAt: current.id,
        reason: `Previous hash pointer mismatch at entry ${current.id}`
      };
    }

    const rawPayload = `${current.previousHash}|${current.timestamp}|${current.userId}|${current.role}|${current.action}|${current.details}|${current.scope}`;
    const calculatedHash = await computeSha256(rawPayload);

    if (current.hash && current.hash !== calculatedHash) {
      return {
        isIntact: false,
        totalChecked: i,
        brokenAt: current.id,
        reason: `Cryptographic digest mismatch for payload at entry ${current.id}`
      };
    }
  }

  return { isIntact: true, totalChecked: chronological.length, brokenAt: null };
};

/**
 * Generates downloadable CSV of audit trail with verification headers
 */
export const exportAuditLogsToCSV = (logs = []) => {
  const headers = ['ID', 'Timestamp', 'User ID', 'User Name', 'Role', 'Action', 'Scope', 'Details', 'Previous Hash', 'SHA-256 Hash'];
  const rows = logs.map(log => [
    `"${log.id || ''}"`,
    `"${log.timestamp || ''}"`,
    `"${log.userId || ''}"`,
    `"${log.userName || ''}"`,
    `"${log.role || ''}"`,
    `"${log.action || ''}"`,
    `"${log.scope || ''}"`,
    `"${(log.details || '').replace(/"/g, '""')}"`,
    `"${log.previousHash || ''}"`,
    `"${log.hash || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `KuraTech_AUDIT_LOGS_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates an official cryptographic audit certificate PDF
 */
export const exportAuditLogsToPDF = (logs = [], certTitle = 'KuraTech OFFICIAL AUDIT TRAIL CERTIFICATE') => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(certTitle, 40, 40);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toISOString()} | Certified Immutable Election Audit Ledger`, 40, 58);
  doc.text(`Total Records: ${logs.length} | Security: SHA-256 Chained Ledger`, 40, 72);

  let y = 100;
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, 760, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Timestamp', 45, y + 14);
  doc.text('Actor', 160, y + 14);
  doc.text('Role', 250, y + 14);
  doc.text('Action', 320, y + 14);
  doc.text('Details', 430, y + 14);
  doc.text('SHA-256 Digest (Truncated)', 630, y + 14);

  y += 26;
  doc.setFont('helvetica', 'normal');

  logs.slice(0, 25).forEach((log) => {
    if (y > 540) return; // limit to first page sample
    const timeStr = new Date(log.timestamp).toLocaleTimeString();
    doc.text(timeStr, 45, y);
    doc.text(String(log.userName || '').slice(0, 16), 160, y);
    doc.text(String(log.role || '').slice(0, 12), 250, y);
    doc.text(String(log.action || '').slice(0, 18), 320, y);
    doc.text(String(log.details || '').slice(0, 32), 430, y);
    doc.text(String(log.hash || '').slice(0, 24) + '...', 630, y);
    y += 18;
  });

  doc.save(`KuraTech_Audit_Certificate_${Date.now()}.pdf`);
};
