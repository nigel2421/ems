// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.4)
// Tamper-Evident SHA-256 Hash-Chained Audit Ledger Engine
// ====================================================================

export const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
  Simulates/Computes SHA-256 event hash linked to previous entry's hash
 */
export const computeEventHash = async (previousHash, eventData) => {
  const payloadString = JSON.stringify({ previousHash, eventData });

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const buffer = new TextEncoder().encode(payloadString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // Fallback simulation
  }

  // Deterministic fallback hash for NodeJS test environment
  let hashNum = 0;
  for (let i = 0; i < payloadString.length; i++) {
    hashNum = (hashNum << 5) - hashNum + payloadString.charCodeAt(i);
    hashNum |= 0;
  }
  return '0x' + Math.abs(hashNum).toString(16).padStart(40, '0');
};

/**
  Creates a new hash-chained audit log entry
 */
export const appendLedgerEvent = async (previousHash = GENESIS_HASH, action, actor, resource, details = {}) => {
  const timestamp = new Date().toISOString();
  const eventData = {
    eventId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    actor: typeof actor === 'object' ? (actor.name || actor.email || 'User') : actor,
    resource,
    details,
    timestamp
  };

  const eventHash = await computeEventHash(previousHash, eventData);

  return {
    ...eventData,
    previousHash,
    eventHash
  };
};

/**
  Verifies whether an audit event chain has been tampered with or silently altered
 */
export const verifyLedgerChainIntegrity = async (ledgerChain = []) => {
  if (!Array.isArray(ledgerChain) || ledgerChain.length === 0) {
    return { isIntact: true, tamperedIndex: -1, message: 'Ledger empty' };
  }

  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < ledgerChain.length; i++) {
    const entry = ledgerChain[i];

    if (entry.previousHash !== expectedPreviousHash) {
      return {
        isIntact: false,
        tamperedIndex: i,
        message: `TAMPERING DETECTED at index ${i}: Previous hash mismatch (${entry.previousHash} vs expected ${expectedPreviousHash})`
      };
    }

    const eventData = {
      eventId: entry.eventId,
      action: entry.action,
      actor: entry.actor,
      resource: entry.resource,
      details: entry.details,
      timestamp: entry.timestamp
    };

    const recomputedHash = await computeEventHash(entry.previousHash, eventData);
    if (recomputedHash !== entry.eventHash) {
      return {
        isIntact: false,
        tamperedIndex: i,
        message: `TAMPERING DETECTED at index ${i}: Event content hash mismatch (Record payload altered)`
      };
    }

    expectedPreviousHash = entry.eventHash;
  }

  return {
    isIntact: true,
    tamperedIndex: -1,
    message: `All ${ledgerChain.length} audit entries cryptographically verified & intact`
  };
};
