// ====================================================================
// KuraTech Tally Validation Engine (QA TAL-01..TAL-11)
// Results validation, sum checks, duplicate prevention, and lock rules.
// ====================================================================

/**
 * Validates result submission inputs:
 * - Checks non-negative integers
 * - Checks registered voters ceiling
 * - Checks candidates + rejected == total cast
 * - Checks station lock status
 * - Checks duplicate submissions
 */
export const validateTallySubmission = ({
  candAVotes,
  candBVotes,
  candCVotes,
  rejectedVotes,
  registeredVoters,
  pollingStationId,
  existingTallies = [],
  allowOverwrite = false
}) => {
  const errors = [];

  // Parse and validate numeric fields
  const parseVal = (v, fieldName) => {
    if (v === '' || v === null || v === undefined) {
      errors.push(`${fieldName} is required`);
      return NaN;
    }
    const num = Number(v);
    if (!Number.isInteger(num)) {
      errors.push(`${fieldName} must be a valid whole number`);
      return NaN;
    }
    if (num < 0) {
      errors.push(`${fieldName} cannot be negative`);
      return NaN;
    }
    return num;
  };

  const a = parseVal(candAVotes, 'Candidate A votes');
  const b = parseVal(candBVotes, 'Candidate B votes');
  const c = parseVal(candCVotes, 'Candidate C votes');
  const rej = parseVal(rejectedVotes, 'Rejected ballots');

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const totalCast = a + b + c + rej;
  const reg = Number(registeredVoters) || 0;

  // Registered voters constraint
  if (reg > 0 && totalCast > reg) {
    errors.push(
      `Total votes cast (${totalCast.toLocaleString('en-KE')}) exceeds registered voters (${reg.toLocaleString('en-KE')})`
    );
  }

  // Check if station tally already exists and is locked
  const existing = existingTallies.find((t) => t.pollingStationId === pollingStationId);
  if (existing) {
    if (existing.status === 'Approved' || existing.status === 'Verified') {
      errors.push(`This station's tally has already been verified and locked against edits.`);
    } else if (!allowOverwrite) {
      errors.push(`A result for this station has already been submitted and is currently ${existing.status}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: {
      candAVotes: a,
      candBVotes: b,
      candCVotes: c,
      rejectedVotes: rej,
      totalVotesCast: totalCast
    }
  };
};

/**
 * Checks for parallel tally discrepancy across two sources (e.g., Agent vs Broadcast)
 */
export const checkParallelMismatch = (sourceA, sourceB, tolerance = 0) => {
  if (!sourceA || !sourceB) return { isMismatch: false };
  const diffA = Math.abs(Number(sourceA.candAVotes || 0) - Number(sourceB.candAVotes || 0));
  const diffB = Math.abs(Number(sourceA.candBVotes || 0) - Number(sourceB.candBVotes || 0));
  const diffC = Math.abs(Number(sourceA.candCVotes || 0) - Number(sourceB.candCVotes || 0));
  const diffRej = Math.abs(Number(sourceA.rejectedVotes || 0) - Number(sourceB.rejectedVotes || 0));

  const hasDiscrepancy = (diffA > tolerance) || (diffB > tolerance) || (diffC > tolerance) || (diffRej > tolerance);

  return {
    isMismatch: hasDiscrepancy,
    discrepancies: {
      diffCandA: diffA,
      diffCandB: diffB,
      diffCandC: diffC,
      diffRejected: diffRej
    }
  };
};

/**
 * Validates Form 34A evidence attachment:
 * - Checks file / URL presence
 * - Validates permitted MIME types (image/jpeg, image/png, application/pdf)
 * - Computes simulated document hash if raw file supplied
 */
export const validateForm34AAttachment = (form34A) => {
  if (!form34A) {
    return {
      isValid: false,
      error: 'Form 34A photograph or scanned document is mandatory for result transmission.'
    };
  }

  const name = typeof form34A === 'string' ? form34A : form34A?.name || form34A?.fileName || '';
  const type = form34A?.type || '';

  const isPermittedExt = /\.(jpe?g|png|webp|pdf)$/i.test(name);
  const isPermittedMime = !type || /^(image\/(jpeg|png|webp)|application\/pdf)$/i.test(type);

  if (name && !isPermittedExt) {
    return {
      isValid: false,
      error: 'Form 34A must be an image (JPEG, PNG, WebP) or official PDF document.'
    };
  }

  if (type && !isPermittedMime) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload a clear photo or PDF scan of Form 34A.'
    };
  }

  return {
    isValid: true,
    fileReference: name || 'FORM_34A_TRANSMITTED.jpg',
    sha256Stamp: `F34A-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  };
};

/**
 * Evaluates statistical anomalies in transmitted tallies:
 * - Turnout > 95% (flagged for high scrutiny)
 * - Turnout > 100% (critical violation)
 * - Rejected ballots > 8%
 * - One candidate having > 98% in a competitive ward
 */
export const assessTallyAnomalyRisk = ({
  candAVotes = 0,
  candBVotes = 0,
  candCVotes = 0,
  rejectedVotes = 0,
  registeredVoters = 0
}) => {
  const flags = [];
  const total = Number(candAVotes) + Number(candBVotes) + Number(candCVotes) + Number(rejectedVotes);
  const reg = Number(registeredVoters) || 0;

  if (reg > 0) {
    const turnoutPct = (total / reg) * 100;
    if (turnoutPct > 100) {
      flags.push({ severity: 'CRITICAL', code: 'OVER_VOTE', message: `Turnout exceeds 100% (${turnoutPct.toFixed(1)}%)` });
    } else if (turnoutPct >= 95) {
      flags.push({ severity: 'HIGH', code: 'ANOMALOUS_TURNOUT', message: `Unusually high turnout rate (${turnoutPct.toFixed(1)}%)` });
    }
  }

  if (total > 0) {
    const rejPct = (Number(rejectedVotes) / total) * 100;
    if (rejPct >= 8) {
      flags.push({ severity: 'MEDIUM', code: 'HIGH_REJECTIONS', message: `Elevated rejected ballots count (${rejPct.toFixed(1)}%)` });
    }

    const leaderVotes = Math.max(Number(candAVotes), Number(candBVotes), Number(candCVotes));
    const leaderShare = (leaderVotes / total) * 100;
    if (leaderShare >= 98 && total > 200) {
      flags.push({ severity: 'HIGH', code: 'MONOLITHIC_MARGIN', message: `Single candidate holds ${leaderShare.toFixed(1)}% of total votes` });
    }
  }

  return {
    isAnomalous: flags.length > 0,
    riskLevel: flags.some(f => f.severity === 'CRITICAL') ? 'Critical' : flags.some(f => f.severity === 'HIGH') ? 'High' : flags.length ? 'Medium' : 'Low',
    flags
  };
};

/**
 * Validates and applies resolution action from the Reconciliation Desk
 */
export const resolveDiscrepancyStatus = (tally, action, reviewerUser) => {
  const allowedActions = ['Approve', 'RequestRetally', 'FlagFraud', 'LockVerified'];
  if (!allowedActions.includes(action)) {
    throw new Error(`Invalid reconciliation action: ${action}`);
  }

  const statusMap = {
    Approve: 'Verified',
    RequestRetally: 'Disputed',
    FlagFraud: 'Flagged',
    LockVerified: 'Locked'
  };

  return {
    ...tally,
    status: statusMap[action],
    reconciledBy: reviewerUser?.name || reviewerUser?.email || 'Reconciliation Officer',
    reconciledAt: new Date().toISOString(),
    reconciliationNotes: `Action ${action} applied by ${reviewerUser?.role || 'User'}`
  };
};

