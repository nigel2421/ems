// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.6)
// Shift & Handover Management
// ====================================================================

export const SHIFT_TYPES = {
  MORNING_OPENING: 'MORNING_OPENING', // 05:00 - 13:00
  AFTERNOON_VOTING: 'AFTERNOON_VOTING', // 13:00 - 17:00
  CLOSING_COUNTING: 'CLOSING_COUNTING', // 17:00 - 22:00
  NIGHT_TALLYING: 'NIGHT_TALLYING' // 22:00 - 06:00
};

export const HANDOVER_STATUSES = {
  PENDING_ACK: 'PENDING_ACK',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  REJECTED: 'REJECTED'
};

/**
  Create a new Shift Record
 */
export const createShiftRecord = ({
  shiftId,
  shiftType = SHIFT_TYPES.MORNING_OPENING,
  operatorName,
  operatorRole,
  jurisdictionScope,
  startedAt = new Date().toISOString()
}) => {
  const generatedId = shiftId || `SHIFT-${shiftType}-${Date.now()}`;

  return {
    shiftId: generatedId,
    shiftType,
    operatorName,
    operatorRole,
    jurisdictionScope,
    startedAt,
    endedAt: null,
    status: 'ACTIVE',
    handovers: [],
    openItemSummary: []
  };
};

/**
  Initiate a formal Handover from current operator to incoming operator
  Preserves operational audit history
 */
export const initiateHandover = ({
  shiftRecord,
  outgoingOperator,
  incomingOperator,
  openCasesCount = 0,
  openIncidentsCount = 0,
  unverifiedFormsCount = 0,
  handoverNotes = '',
  effectiveAt = new Date().toISOString()
}) => {
  if (!shiftRecord) {
    throw new Error('shiftRecord is required to initiate handover');
  }

  const handoverId = `HND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const handoverEntry = {
    handoverId,
    outgoingOperator,
    incomingOperator,
    effectiveAt,
    status: HANDOVER_STATUSES.PENDING_ACK,
    openItems: {
      openCasesCount,
      openIncidentsCount,
      unverifiedFormsCount
    },
    notes: handoverNotes,
    acknowledgedAt: null,
    acknowledgedBy: null
  };

  const updatedShift = {
    ...shiftRecord,
    handovers: [...(shiftRecord.handovers || []), handoverEntry]
  };

  return { updatedShift, handoverEntry };
};

/**
  Acknowledge a pending handover
 */
export const acknowledgeHandover = (shiftRecord, handoverId, acknowledgedBy) => {
  if (!shiftRecord || !shiftRecord.handovers) {
    throw new Error('Invalid shift record');
  }

  const updatedHandovers = shiftRecord.handovers.map((item) => {
    if (item.handoverId === handoverId) {
      return {
        ...item,
        status: HANDOVER_STATUSES.ACKNOWLEDGED,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: acknowledgedBy || item.incomingOperator
      };
    }
    return item;
  });

  return {
    ...shiftRecord,
    operatorName: acknowledgedBy,
    handovers: updatedHandovers
  };
};

/**
  Get audit summary of shift history
 */
export const getShiftHistorySummary = (shiftRecord) => {
  if (!shiftRecord) return { totalHandovers: 0, pendingHandovers: 0, activeOperator: 'NONE' };

  const handovers = shiftRecord.handovers || [];
  const pending = handovers.filter((h) => h.status === HANDOVER_STATUSES.PENDING_ACK).length;

  return {
    shiftId: shiftRecord.shiftId,
    shiftType: shiftRecord.shiftType,
    activeOperator: shiftRecord.operatorName,
    totalHandovers: handovers.length,
    pendingHandovers: pending,
    lastHandover: handovers.length > 0 ? handovers[handovers.length - 1] : null
  };
};
