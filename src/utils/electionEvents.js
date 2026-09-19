// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.2)
// Election-Day Event Engine & Station Operations Digital Timeline
// ====================================================================

export const ELECTION_DAY_EVENTS = {
  AGENT_CHECKED_IN: 'AGENT_CHECKED_IN',
  AGENT_ADMITTED: 'AGENT_ADMITTED',
  MATERIALS_CONFIRMED: 'MATERIALS_CONFIRMED',
  STATION_OPENED: 'STATION_OPENED',
  VOTING_OPENED: 'VOTING_OPENED',
  OPERATIONAL_ISSUE: 'OPERATIONAL_ISSUE',
  INCIDENT_REPORTED: 'INCIDENT_REPORTED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  VOTING_CLOSED: 'VOTING_CLOSED',
  COUNTING_STARTED: 'COUNTING_STARTED',
  EVIDENCE_CAPTURED: 'EVIDENCE_CAPTURED',
  EVIDENCE_UPLOADED: 'EVIDENCE_UPLOADED',
  CAMPAIGN_VERIFIED: 'CAMPAIGN_VERIFIED',
  RECONCILIATION: 'RECONCILIATION'
};

export const INCIDENT_STATUSES = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ASSIGNED: 'ASSIGNED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

export const ESCALATION_LEVELS = [
  'Station Agent',
  'Polling Coordinator',
  'Ward Coordinator',
  'Constituency Coordinator',
  'Campaign Operations & Legal Desk'
];

/**
 * Creates an operational election-day event log with optional evidence & GPS payload
 */
export const createElectionEventLog = (eventType, stationId, agentUser, details = {}) => ({
  eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  eventType,
  stationId,
  deviceTimestamp: new Date().toISOString(),
  serverTimestamp: new Date().toISOString(),
  submittedBy: agentUser?.name || agentUser?.email || 'Field Agent',
  role: agentUser?.role || 'Agent',
  gpsCoordinates: details.gpsCoordinates || null,
  distanceFromExpectedMeters: details.distanceFromExpectedMeters || 0,
  evidenceUrl: details.evidenceUrl || null,
  details
});

/**
 * Generates an operational digital timeline for a specific polling station
 */
export const getStationOperationsTimeline = (stationId, customEvents = []) => {
  const baseTimeline = [
    { time: '06:03 AM', event: ELECTION_DAY_EVENTS.AGENT_CHECKED_IN, label: 'Agent checked in', status: 'OK' },
    { time: '06:19 AM', event: ELECTION_DAY_EVENTS.AGENT_ADMITTED, label: 'Agent admitted by Presiding Officer', status: 'OK' },
    { time: '06:31 AM', event: ELECTION_DAY_EVENTS.MATERIALS_CONFIRMED, label: 'Election materials & seals confirmed', status: 'OK' },
    { time: '06:42 AM', event: ELECTION_DAY_EVENTS.STATION_OPENED, label: 'Polling station opened for voting', status: 'OK' },
    { time: '10:18 AM', event: ELECTION_DAY_EVENTS.INCIDENT_REPORTED, label: 'BVR kit battery issue reported', status: 'WARNING' },
    { time: '10:51 AM', event: ELECTION_DAY_EVENTS.INCIDENT_RESOLVED, label: 'Replacement battery deployed', status: 'OK' },
    { time: '05:04 PM', event: ELECTION_DAY_EVENTS.VOTING_CLOSED, label: 'Polling station closed', status: 'OK' },
    { time: '05:49 PM', event: ELECTION_DAY_EVENTS.COUNTING_STARTED, label: 'Ballot counting commenced', status: 'OK' },
    { time: '08:21 PM', event: ELECTION_DAY_EVENTS.EVIDENCE_CAPTURED, label: 'Statutory form evidence captured', status: 'OK' },
    { time: '08:37 PM', event: ELECTION_DAY_EVENTS.EVIDENCE_UPLOADED, label: 'Form payload uploaded & hash verified', status: 'OK' },
    { time: '08:48 PM', event: ELECTION_DAY_EVENTS.CAMPAIGN_VERIFIED, label: 'Supervisor verified tallies', status: 'OK' }
  ];

  const timelineEvents = [...baseTimeline, ...customEvents];
  return {
    stationId,
    stationCode: stationId,
    timeline: timelineEvents,
    timelineEvents,
    overallStatus: 'VERIFIED'
  };
};

export const createIncidentTicket = ({
  incidentId,
  category = 'Operational Issue',
  severity = 'Medium',
  description,
  stationId,
  reportedBy,
  locationName
}) => ({
  incidentId: incidentId || `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  category,
  severity,
  description,
  stationId,
  locationName,
  reportedBy: reportedBy?.name || reportedBy?.email || 'Field Agent',
  reportedAt: new Date().toISOString(),
  status: INCIDENT_STATUSES.OPEN,
  escalationLevel: ESCALATION_LEVELS[0],
  assignedTo: null,
  resolutionNotes: null,
  closedAt: null,
  history: [
    {
      status: INCIDENT_STATUSES.OPEN,
      timestamp: new Date().toISOString(),
      updatedBy: reportedBy?.name || 'Reporter',
      notes: 'Incident ticket opened'
    }
  ]
});
