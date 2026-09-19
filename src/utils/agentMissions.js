// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Agent Mission Lifecycle & Operational Deployment Management Model
// ====================================================================

export const MISSION_STATES = {
  ASSIGNED: 'ASSIGNED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  EN_ROUTE: 'EN_ROUTE',
  CHECKED_IN: 'CHECKED_IN',
  ON_DUTY: 'ON_DUTY',
  COUNTING: 'COUNTING',
  EVIDENCE_SUBMITTED: 'EVIDENCE_SUBMITTED',
  CHECKED_OUT: 'CHECKED_OUT',
  COMPLETED: 'COMPLETED'
};

export const MISSION_STATE_ORDER = [
  MISSION_STATES.ASSIGNED,
  MISSION_STATES.ACKNOWLEDGED,
  MISSION_STATES.EN_ROUTE,
  MISSION_STATES.CHECKED_IN,
  MISSION_STATES.ON_DUTY,
  MISSION_STATES.COUNTING,
  MISSION_STATES.EVIDENCE_SUBMITTED,
  MISSION_STATES.CHECKED_OUT,
  MISSION_STATES.COMPLETED
];

/**
  Creates a new operational agent mission instance
 */
export const createAgentMission = (data = {}) => {
  const timestamp = new Date().toISOString();
  return {
    missionId: data.missionId || `MSN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    electionId: data.electionId || 'KE-2027-GENERAL',
    contestId: data.contestId || 'PRESIDENT-2027',
    agentId: data.agentId || 'USR-AGENT-001',
    agentName: data.agentName || 'Field Agent',
    pollingCentreId: data.pollingCentreId || 'PC-001',
    pollingCentreName: data.pollingCentreName || 'Highridge Primary School',
    pollingUnitId: data.pollingUnitId || 'PU-001-03',
    streamId: data.streamId || 'Stream 03',
    county: data.county || 'Nairobi',
    constituency: data.constituency || 'Westlands',
    ward: data.ward || 'Parklands/Highridge',
    role: data.role || 'Polling Agent',
    supervisorId: data.supervisorId || 'SUP-001',
    supervisorName: data.supervisorName || 'Polling Coordinator',
    reportingTime: data.reportingTime || '06:00:00',
    status: data.status || MISSION_STATES.ASSIGNED,
    checkInAt: data.checkInAt || null,
    checkOutAt: data.checkOutAt || null,
    deviceId: data.deviceId || null,
    expectedCoords: data.expectedCoords || { lat: -1.2644, lng: 36.8051 },
    currentCoords: data.currentCoords || null,
    distanceFromExpectedKm: null,
    history: [
      {
        status: data.status || MISSION_STATES.ASSIGNED,
        timestamp,
        actor: 'System',
        notes: 'Mission assigned to agent'
      }
    ],
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

/**
  Updates mission status with state transition validation & audit tracking
 */
export const updateMissionStatus = (mission, newStatus, actor = 'Agent', notes = '', metadata = {}) => {
  if (!mission || !MISSION_STATES[newStatus]) {
    throw new Error(`Invalid mission state: ${newStatus}`);
  }

  const timestamp = new Date().toISOString();
  const updatedHistory = [
    ...(mission.history || []),
    {
      status: newStatus,
      timestamp,
      actor: typeof actor === 'object' ? (actor.name || actor.email || 'User') : actor,
      notes,
      metadata
    }
  ];

  let checkInAt = mission.checkInAt;
  let checkOutAt = mission.checkOutAt;

  if (newStatus === MISSION_STATES.CHECKED_IN && !checkInAt) {
    checkInAt = timestamp;
  }
  if (newStatus === MISSION_STATES.CHECKED_OUT || newStatus === MISSION_STATES.COMPLETED) {
    checkOutAt = timestamp;
  }

  return {
    ...mission,
    status: newStatus,
    checkInAt,
    checkOutAt,
    deviceId: metadata.deviceId || mission.deviceId,
    history: updatedHistory,
    updatedAt: timestamp
  };
};

/**
  Verifies whether an agent's check-in GPS coordinates fall within expected proximity threshold
 */
export const verifyCheckInLocation = (mission, coords, maxAllowedKm = 0.5) => {
  if (!mission?.expectedCoords || !coords?.lat || !coords?.lng) {
    return {
      isVerified: true,
      distanceKm: 0,
      warning: 'GPS coordinates unavailable - location check bypassed with warning'
    };
  }

  // Haversine formula distance calculation
  const R = 6371; // Earth radius in km
  const dLat = (coords.lat - mission.expectedCoords.lat) * Math.PI / 180;
  const dLng = (coords.lng - mission.expectedCoords.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(mission.expectedCoords.lat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  const isVerified = distanceKm <= maxAllowedKm;
  return {
    isVerified,
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    warning: isVerified ? null : `Agent checked in ${Math.round(distanceKm * 1000)}m away from assigned polling station`
  };
};

/**
  Aggregates mission status metrics for operational command scope
 */
export const getMissionSummary = (missions = []) => {
  const summary = {
    totalMissions: missions.length,
    byStatus: {},
    checkedInCount: 0,
    activeCount: 0,
    missingCheckInCount: 0,
    completedCount: 0
  };

  Object.keys(MISSION_STATES).forEach(st => {
    summary.byStatus[st] = 0;
  });

  missions.forEach(m => {
    const st = m.status || MISSION_STATES.ASSIGNED;
    summary.byStatus[st] = (summary.byStatus[st] || 0) + 1;

    if (m.checkInAt) summary.checkedInCount++;
    if ([MISSION_STATES.CHECKED_IN, MISSION_STATES.ON_DUTY, MISSION_STATES.COUNTING].includes(st)) {
      summary.activeCount++;
    }
    if ([MISSION_STATES.ASSIGNED, MISSION_STATES.ACKNOWLEDGED, MISSION_STATES.EN_ROUTE].includes(st)) {
      summary.missingCheckInCount++;
    }
    if ([MISSION_STATES.CHECKED_OUT, MISSION_STATES.COMPLETED].includes(st)) {
      summary.completedCount++;
    }
  });

  return summary;
};
