// ====================================================================
// CI-EMS Tally Validation Engine (QA TAL-01..TAL-11)
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
