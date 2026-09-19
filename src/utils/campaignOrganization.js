// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.6)
// Campaign Organization & Command Graph Resolver
// ====================================================================

import { ROLES } from './rbac.js';

export const ORGANIZATIONAL_POSITIONS = {
  CHAIRPERSON: 'Campaign Chairperson',
  SECRETARY: 'Campaign Secretary',
  TREASURER: 'Resource Mobilizer / Treasurer',
  NATIONAL_LEAD: 'National Campaign Director',
  COUNTY_CHAIR: 'County Campaign Lead',
  CONSTITUENCY_CHAIR: 'Constituency Campaign Lead',
  WARD_CHAIR: 'Ward Campaign Lead',
  POLLING_CHIEF: 'Chief Polling Agent',
  FIELD_AGENT_TITLE: 'Station Polling Agent'
};

/**
  Maps organizational political position to default security authorization role
  Golden Rule: Security authorization is server-checked by security role, not political job title
 */
export const mapPositionToSecurityRole = (orgPosition) => {
  switch (orgPosition) {
    case ORGANIZATIONAL_POSITIONS.CHAIRPERSON:
    case ORGANIZATIONAL_POSITIONS.SECRETARY:
    case ORGANIZATIONAL_POSITIONS.NATIONAL_LEAD:
      return ROLES.SUPER_ADMIN;

    case ORGANIZATIONAL_POSITIONS.COUNTY_CHAIR:
      return ROLES.COUNTY_COORDINATOR;

    case ORGANIZATIONAL_POSITIONS.CONSTITUENCY_CHAIR:
      return ROLES.CONSTITUENCY_COORDINATOR;

    case ORGANIZATIONAL_POSITIONS.WARD_CHAIR:
      return ROLES.WARD_COORDINATOR;

    case ORGANIZATIONAL_POSITIONS.POLLING_CHIEF:
      return ROLES.POLLING_COORDINATOR;

    default:
      return ROLES.AGENT;
  }
};

/**
  Resolves the complete supervisory command chain for a specific polling station
 */
export const resolveCommandChainForStation = (stationId = '002938') => {
  return {
    stationId,
    stationName: 'Highridge Primary School - Stream 03',
    commandChain: [
      { level: 'STATION_AGENT', name: 'Jane Wambui (Agent-239)', role: ROLES.AGENT, phone: '+254 700 000 001' },
      { level: 'POLLING_COORDINATOR', name: 'Peter Otieno (PC-38)', role: ROLES.POLLING_COORDINATOR, phone: '+254 700 000 002' },
      { level: 'WARD_COORDINATOR', name: 'David Kamau (WC-12)', role: ROLES.WARD_COORDINATOR, phone: '+254 700 000 003' },
      { level: 'CONSTITUENCY_COORDINATOR', name: 'Grace Muthoni (CC-05)', role: ROLES.CONSTITUENCY_COORDINATOR, phone: '+254 700 000 004' },
      { level: 'COUNTY_COORDINATOR', name: 'Hassan Ali (CY-01)', role: ROLES.COUNTY_COORDINATOR, phone: '+254 700 000 005' },
      { level: 'NATIONAL_COMMAND', name: 'Campaign HQ Desk', role: ROLES.SUPER_ADMIN, phone: '+254 700 000 000' }
    ]
  };
};

/**
  Resolves dynamic operational command chains based on incident type and severity
  Escalation paths route dynamically to Specialized Desks vs Geographic Hierarchy
 */
export const resolveOperationalCommandChain = ({
  election = 'GENERAL_2027',
  contest = 'PRESIDENTIAL',
  geography = {},
  incidentType = 'ORDINARY',
  severity = 'SEV_3_MODERATE'
}) => {
  let escalationPath = [];

  switch (incidentType) {
    case 'TECHNICAL':
    case 'SECURITY_VIOLATION':
    case 'DEVICE_RECOVERY':
      escalationPath = [
        { level: 'FIELD_AGENT', team: 'Station Polling Agent', role: ROLES.AGENT },
        { level: 'FIELD_SUPPORT', team: 'Regional Tech Response', role: ROLES.POLLING_COORDINATOR },
        { level: 'TECH_OPERATIONS', team: 'Infrastructure Ops', role: ROLES.ADMIN },
        { level: 'SOC_COMMAND', team: 'Security Operations Center', role: ROLES.SUPER_ADMIN }
      ];
      break;

    case 'EVIDENCE_REVIEW':
    case 'RECONCILIATION':
      escalationPath = [
        { level: 'FIELD_AGENT', team: 'Station Agent Submission', role: ROLES.AGENT },
        { level: 'EVIDENCE_REVIEWER', team: 'Form Review Clerk', role: ROLES.CONSTITUENCY_COORDINATOR },
        { level: 'VERIFICATION_SUPERVISOR', team: 'Tally Verification Desk', role: ROLES.COUNTY_COORDINATOR },
        { level: 'RECONCILIATION_DESK', team: 'National Reconciliation Board', role: ROLES.SUPER_ADMIN }
      ];
      break;

    case 'PRIVACY_INCIDENT':
      escalationPath = [
        { level: 'OPERATOR', team: 'System User / Agent', role: ROLES.AGENT },
        { level: 'PRIVACY_OPS', team: 'Privacy Operations Lead', role: ROLES.ADMIN },
        { level: 'DPO_COMMAND', team: 'Data Protection Officer & Legal Desk', role: ROLES.SUPER_ADMIN }
      ];
      break;

    case 'ORDINARY':
    case 'LOGISTICS_GAP':
    default:
      escalationPath = [
        { level: 'STATION_AGENT', team: 'Station Agent', role: ROLES.AGENT },
        { level: 'WARD_COORDINATOR', team: 'Ward Command', role: ROLES.WARD_COORDINATOR },
        { level: 'CONSTITUENCY_COMMAND', team: 'Constituency Desk', role: ROLES.CONSTITUENCY_COORDINATOR },
        { level: 'COUNTY_COMMAND', team: 'County Command Center', role: ROLES.COUNTY_COORDINATOR },
        { level: 'NATIONAL_COMMAND', team: 'National Election War Room', role: ROLES.SUPER_ADMIN }
      ];
      break;
  }

  return {
    election,
    contest,
    geography,
    incidentType,
    severity,
    escalationChain: escalationPath
  };
};

