// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.1)
// Strategy Team & Campaign Organization Engine
// ====================================================================

import { ROLES } from './rbac.js';
import { resolveEffectiveGeographicScope } from './scopeResolver.js';

export const STRATEGY_DEPARTMENTS = [
  { id: 'DEP-LEAD', name: 'Campaign Leadership', icon: '🧭', color: '#6366f1' },
  { id: 'DEP-STRAT', name: 'Strategy & Planning', icon: '🎯', color: '#ec4899' },
  { id: 'DEP-FOPS', name: 'Field Operations', icon: '👥', color: '#10b981' },
  { id: 'DEP-COMM', name: 'Communications & Media', icon: '📢', color: '#f59e0b' },
  { id: 'DEP-RES', name: 'Research & Intelligence', icon: '📊', color: '#8b5cf6' },
  { id: 'DEP-MOB', name: 'Resource Mobilization', icon: '💰', color: '#06b6d4' },
  { id: 'DEP-LOG', name: 'Logistics', icon: '🚚', color: '#3b82f6' },
  { id: 'DEP-LEG', name: 'Legal & Compliance', icon: '⚖️', color: '#ef4444' },
  { id: 'DEP-ICT', name: 'ICT / Digital Operations', icon: '💻', color: '#14b8a6' }
];

export const DEPARTMENT_ROLES_MAP = {
  'DEP-LEAD': ['Campaign Manager', 'Deputy Campaign Manager', 'Campaign Chairperson', 'Campaign Secretary', 'Campaign Coordinator'],
  'DEP-STRAT': ['Chief Strategist', 'Political Strategy Lead', 'Policy Advisor', 'Campaign Planning Officer'],
  'DEP-FOPS': ['Field Operations Director', 'County Coordinator', 'Constituency Coordinator', 'Ward Coordinator', 'Polling Coordinator', 'Agent Coordinator'],
  'DEP-COMM': ['Communications Director', 'Media Officer', 'Social Media Manager', 'Content Manager', 'Press Coordinator', 'Communications Officer'],
  'DEP-RES': ['Research Lead', 'Survey Coordinator', 'Data Analyst', 'Field Intelligence Coordinator', 'Media Monitoring Officer'],
  'DEP-MOB': ['Resource Mobilization Lead', 'Fundraising Coordinator', 'Finance Coordinator', 'Donor Relations'],
  'DEP-LOG': ['Logistics Director', 'Transport Coordinator', 'Materials Coordinator', 'Agent Kit Coordinator'],
  'DEP-LEG': ['Legal Lead', 'Election Compliance Officer', 'Incident Legal Reviewer'],
  'DEP-ICT': ['ICT Lead', 'CI-EMS Administrator', 'Digital Campaign Coordinator', 'Technical Support']
};

/**
 * Initial Strategy Team seed members for Nairobi Governor Campaign
 */
export const initialStrategyMembers = [
  {
    id: 'STM-001',
    name: 'Dr. Evans Kidero',
    phone: '+254 711 000 101',
    email: 'candidate@governor.ke',
    candidateId: 'USR-GOV-01',
    campaignId: 'CMP-NAIROBI-2027',
    departmentId: 'DEP-LEAD',
    position: 'Governor Candidate',
    jurisdiction: 'Nairobi City County',
    reportingToId: null,
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.GOVERNOR,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    dateJoined: '2026-01-10',
    notes: 'Aspirant Candidate Lead'
  },
  {
    id: 'STM-002',
    name: 'Amb. Beatrice Elachi',
    phone: '+254 722 111 202',
    email: 'b.elachi@campaign.ke',
    candidateId: 'USR-GOV-01',
    campaignId: 'CMP-NAIROBI-2027',
    departmentId: 'DEP-LEAD',
    position: 'Campaign Manager',
    jurisdiction: 'Nairobi City County',
    reportingToId: 'STM-001',
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    dateJoined: '2026-01-15',
    notes: 'Chief Campaign Executive Director'
  },
  {
    id: 'STM-003',
    name: 'Prof. Peter Wanyande',
    phone: '+254 733 222 303',
    email: 'p.wanyande@strategy.ke',
    candidateId: 'USR-GOV-01',
    campaignId: 'CMP-NAIROBI-2027',
    departmentId: 'DEP-STRAT',
    position: 'Chief Strategist',
    jurisdiction: 'Nairobi City County',
    reportingToId: 'STM-002',
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.STRATEGY_TEAM,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    dateJoined: '2026-02-01',
    notes: 'Lead Political Strategy Advisor'
  },
  {
    id: 'STM-004',
    name: 'David Ochieng',
    phone: '+254 744 333 404',
    email: 'd.ochieng@fieldops.ke',
    candidateId: 'USR-GOV-01',
    campaignId: 'CMP-NAIROBI-2027',
    departmentId: 'DEP-FOPS',
    position: 'Field Operations Director',
    jurisdiction: 'Nairobi City County',
    reportingToId: 'STM-002',
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.COUNTY_COORDINATOR,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    dateJoined: '2026-02-05',
    notes: 'Directs all 17 constituency sub-teams'
  },
  {
    id: 'STM-005',
    name: 'Sylvia Njeri',
    phone: '+254 755 444 505',
    email: 's.njeri@media.ke',
    candidateId: 'USR-GOV-01',
    campaignId: 'CMP-NAIROBI-2027',
    departmentId: 'DEP-COMM',
    position: 'Communications Director',
    jurisdiction: 'Nairobi City County',
    reportingToId: 'STM-002',
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.STRATEGY_TEAM,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    dateJoined: '2026-02-10',
    notes: 'Head of PR, Media and Broadcast'
  },
  {
    id: 'STM-006',
    name: 'Eng. Timothy Mwangi',
    phone: '+254 766 555 606',
    email: 't.mwangi@fieldops.ke',
    candidateId: 'USR-GOV-01',
    campaignId: 'CMP-NAIROBI-2027',
    departmentId: 'DEP-FOPS',
    position: 'Constituency Coordinator',
    jurisdiction: 'Westlands Constituency',
    reportingToId: 'STM-004',
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.CONSTITUENCY_COORDINATOR,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    dateJoined: '2026-02-15',
    notes: 'Leads Westlands constituency campaign operations'
  },
  {
    id: 'STM-007',
    name: 'Mohamed Hassan (Moha)',
    phone: '+254 777 666 707',
    email: 'moha@fieldops.ke',
    candidateId: 'USR-GOV-01',
    campaignId: 'CMP-NAIROBI-2027',
    departmentId: 'DEP-FOPS',
    position: 'Ward Coordinator',
    jurisdiction: 'Kitisuru Ward',
    reportingToId: 'STM-006',
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.WARD_COORDINATOR,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    dateJoined: '2026-02-20',
    notes: 'Leads Kitisuru Ward campaign mobilization'
  },
  {
    id: 'STM-008',
    name: 'Adv. Wanjiru Maina',
    phone: '+254 788 777 808',
    email: 'w.maina@legal.ke',
    candidateId: 'USR-GOV-01',
    campaignId: 'CMP-NAIROBI-2027',
    departmentId: 'DEP-LEG',
    position: 'Legal Lead',
    jurisdiction: 'Nairobi City County',
    reportingToId: 'STM-002',
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    dateJoined: '2026-03-01',
    notes: 'Head of Dispute Resolution & Evidence Audit'
  }
];

/**
 * Initial Strategy Tasks
 */
export const initialStrategyTasks = [
  {
    id: 'ST-101',
    title: 'Confirm All 17 Constituency Coordinators',
    departmentId: 'DEP-FOPS',
    assignedToId: 'STM-004',
    assignedToName: 'David Ochieng',
    jurisdiction: 'Nairobi City County',
    priority: 'HIGH',
    dueDate: '2026-10-05',
    status: 'IN PROGRESS',
    description: 'Vet and formally contract constituency coordinators for all 17 sub-counties.'
  },
  {
    id: 'ST-102',
    title: 'Finalize Westlands Ward Campaign Roster',
    departmentId: 'DEP-FOPS',
    assignedToId: 'STM-006',
    assignedToName: 'Eng. Timothy Mwangi',
    jurisdiction: 'Westlands Constituency',
    priority: 'HIGH',
    dueDate: '2026-10-10',
    status: 'IN PROGRESS',
    description: 'Recruit and onboard 5 Ward Coordinators across Westlands constituency.'
  },
  {
    id: 'ST-103',
    title: 'Publish Q4 Voters Survey Findings',
    departmentId: 'DEP-RES',
    assignedToId: 'STM-003',
    assignedToName: 'Prof. Peter Wanyande',
    jurisdiction: 'Nairobi City County',
    priority: 'MEDIUM',
    dueDate: '2026-10-15',
    status: 'TO DO',
    description: 'Aggregate sentiment data across 85 wards into executive strategy briefing.'
  },
  {
    id: 'ST-104',
    title: 'Audit Agent Verification Readiness',
    departmentId: 'DEP-LEG',
    assignedToId: 'STM-008',
    assignedToName: 'Adv. Wanjiru Maina',
    jurisdiction: 'Nairobi City County',
    priority: 'HIGH',
    dueDate: '2026-10-01',
    status: 'COMPLETED',
    description: 'Verify 2,500 polling agent accreditation credentials against IEBC gazette rules.'
  }
];

/**
 * Initial 5-Phase Campaign Roadmap
 */
export const initialCampaignRoadmap = [
  {
    phaseId: 'PHASE-1',
    phaseName: 'Phase 1: Groundwork & Governance',
    targetDate: '2026-04-30',
    status: 'COMPLETED',
    objectives: [
      { id: 'OBJ-1', title: 'Register Campaign Headquarters & Tenant RLS', targetPct: 100, actualPct: 100, owner: 'Campaign Manager' },
      { id: 'OBJ-2', title: 'Draft Statutory Evidence Legal Guidelines', targetPct: 100, actualPct: 100, owner: 'Legal Lead' }
    ]
  },
  {
    phaseId: 'PHASE-2',
    phaseName: 'Phase 2: Strategy Team Formation',
    targetDate: '2026-09-30',
    status: 'IN_PROGRESS',
    objectives: [
      { id: 'OBJ-3', title: 'Complete 85 Ward Team Coordinator Appointments', targetCount: 85, actualCount: 71, targetPct: 100, actualPct: 83.5, owner: 'Field Operations' },
      { id: 'OBJ-4', title: 'Deploy Scoped Location Sieve across All Portals', targetPct: 100, actualPct: 100, owner: 'ICT Operations' }
    ]
  },
  {
    phaseId: 'PHASE-3',
    phaseName: 'Phase 3: Voter Mobilization & Intelligence',
    targetDate: '2026-12-31',
    status: 'PLANNED',
    objectives: [
      { id: 'OBJ-5', title: 'Conduct 10,000 Sample Voter Sentiment Surveys', targetCount: 10000, actualCount: 2400, targetPct: 100, actualPct: 24.0, owner: 'Research & Intelligence' }
    ]
  },
  {
    phaseId: 'PHASE-4',
    phaseName: 'Phase 4: Mass Campaign Execution',
    targetDate: '2027-06-30',
    status: 'PLANNED',
    objectives: [
      { id: 'OBJ-6', title: 'Execute Town Hall Rallies in 17 Constituencies', targetCount: 17, actualCount: 3, targetPct: 100, actualPct: 17.6, owner: 'Communications' }
    ]
  },
  {
    phaseId: 'PHASE-5',
    phaseName: 'Phase 5: Election-Day Readiness Gate',
    targetDate: '2027-08-08',
    status: 'PLANNED',
    objectives: [
      { id: 'OBJ-7', title: 'Achieve 100% Agent Accreditation & Parallel Tally Dry Run', targetPct: 100, actualPct: 0, owner: 'Field Operations' }
    ]
  }
];

/**
 * Initial Strategy Meetings & Decision Records
 */
export const initialStrategyMeetings = [
  {
    id: 'MTG-301',
    title: 'Weekly Command & Strategy Briefing',
    date: '2026-09-24T10:00:00Z',
    location: 'Campaign HQ War Room / Virtual',
    chair: 'Amb. Beatrice Elachi',
    participants: ['Dr. Evans Kidero', 'Prof. Peter Wanyande', 'David Ochieng', 'Sylvia Njeri', 'Adv. Wanjiru Maina'],
    agenda: '1. Review Westlands Field Mobilization\n2. Q4 Budget Allocation\n3. Legal Compliance Update',
    discussionNotes: 'Field Ops reported 83.5% ward coordinator coverage. Media team briefed on press release.',
    decisions: [
      {
        id: 'DEC-1',
        summary: 'Increase mobilization funding in swing wards (Westlands & Kibra)',
        actionItems: [
          { id: 'ACT-1', title: 'Organize 4 community engagement rallies in Westlands', assignedToName: 'Eng. Timothy Mwangi', deadline: '2026-10-02', status: 'IN PROGRESS' }
        ]
      }
    ]
  }
];

/**
 * Automatically provisions a Strategy Team structure when a new Candidate is onboarded
 */
export const createCandidateStrategyTeam = (candidate) => {
  const contest = candidate.contest || candidate.contestType || candidate.role || 'GOVERNOR';
  const scope = resolveEffectiveGeographicScope({ authenticatedUser: candidate, contest });

  const rootMember = {
    id: `STM-${Date.now()}-CAND`,
    name: candidate.name || 'Candidate',
    phone: candidate.phone || '+254 700 000 000',
    email: candidate.email || 'candidate@campaign.ke',
    candidateId: candidate.id || `CAND-${Date.now()}`,
    campaignId: `CMP-${Date.now()}`,
    departmentId: 'DEP-LEAD',
    position: `${scope.contestType} Candidate`,
    jurisdiction: scope.locked.ward || scope.locked.constituency || scope.locked.county || 'National',
    reportingToId: null,
    status: 'Active',
    systemAccess: true,
    securityRole: candidate.role || ROLES.GOVERNOR,
    avatar: candidate.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    dateJoined: new Date().toISOString().split('T')[0],
    notes: 'Campaign Candidate Principal'
  };

  const campaignManager = {
    id: `STM-${Date.now()}-CM`,
    name: `Campaign Director (${candidate.name || 'Campaign'})`,
    phone: '+254 700 000 001',
    email: 'manager@campaign.ke',
    candidateId: rootMember.candidateId,
    campaignId: rootMember.campaignId,
    departmentId: 'DEP-LEAD',
    position: 'Campaign Manager',
    jurisdiction: rootMember.jurisdiction,
    reportingToId: rootMember.id,
    status: 'Active',
    systemAccess: true,
    securityRole: ROLES.ADMIN,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    dateJoined: new Date().toISOString().split('T')[0],
    notes: 'Appointed Executive Manager'
  };

  return [rootMember, campaignManager];
};

/**
 * Resolves hierarchy graph tree representation of strategy team members
 */
export const resolveOrgHierarchyGraph = (members = []) => {
  const memberMap = new Map();
  members.forEach(m => memberMap.set(m.id, { ...m, children: [] }));

  let rootNodes = [];

  memberMap.forEach(node => {
    if (node.reportingToId && memberMap.has(node.reportingToId)) {
      memberMap.get(node.reportingToId).children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
};

/**
 * Calculates zero dead-KPI metrics for Strategy Command
 */
export const calculateStrategyReadinessMetrics = (members = [], tasks = [], roadmap = [], meetings = []) => {
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const activeDepartments = new Set(members.map(m => m.departmentId)).size;
  const systemUsersCount = members.filter(m => m.systemAccess).length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN PROGRESS').length;
  const overdueTasks = tasks.filter(t => t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date()).length;

  const activeMeetings = meetings.length;

  return {
    activeMembers,
    activeDepartments,
    systemUsersCount,
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    activeMeetings
  };
};
