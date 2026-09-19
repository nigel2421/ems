// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS)
// Comprehensive Seed Dataset for all 9 Modules
// ====================================================================

export const initialUsersList = [];

// Initial Intelligence Metrics for Polling Stations (Westlands / Parklands streams)
export const initialStationIntelligence = {
  'PS-42409': {
    partyAdvantageScore: 78,
    incumbencyScore: 65,
    oppositionStrength: 32,
    publicPerceptionRating: 4.3,
    competitorActivityLevel: 'High',
    strategicImportance: 'High',
    riskLevel: 'Low',
    leadingFormation: 'UDA',
    rivalFormation: 'ODM',
    coalitionLean: 'Kenya Kwanza',
    streamTerrain: 'Stronghold',
    mobilisationChannel: 'Markets & boda stages'
  },
  'PS-42410': {
    partyAdvantageScore: 42,
    incumbencyScore: 50,
    oppositionStrength: 68,
    publicPerceptionRating: 3.1,
    competitorActivityLevel: 'Critical',
    strategicImportance: 'High',
    riskLevel: 'Severe',
    leadingFormation: 'ODM',
    rivalFormation: 'UDA',
    coalitionLean: 'Azimio la Umoja',
    streamTerrain: 'Contested',
    mobilisationChannel: 'Youth / campus blocs'
  },
  'PS-42411': {
    partyAdvantageScore: 55,
    incumbencyScore: 58,
    oppositionStrength: 45,
    publicPerceptionRating: 3.8,
    competitorActivityLevel: 'Medium',
    strategicImportance: 'Medium',
    riskLevel: 'Medium',
    leadingFormation: 'Wiper',
    rivalFormation: 'UDA',
    coalitionLean: 'Contested / fluid',
    streamTerrain: 'Swing',
    mobilisationChannel: 'Churches & mosques'
  },
  'PS-42398': {
    partyAdvantageScore: 89,
    incumbencyScore: 80,
    oppositionStrength: 15,
    publicPerceptionRating: 4.8,
    competitorActivityLevel: 'Low',
    strategicImportance: 'High',
    riskLevel: 'Low',
    leadingFormation: 'UDA',
    rivalFormation: 'Independent',
    coalitionLean: 'Kenya Kwanza',
    streamTerrain: 'Stronghold',
    mobilisationChannel: 'Nyumba Kumi / village elders'
  }
};

// Initial Agent Directory - Empty by default (Populated via user registration / API)
export const initialAgentDirectory = [];

// Initial Surveys - Empty by default
export const initialSurveys = [];

// Initial Field Reports - Empty by default
export const initialFieldReports = [];

// Initial Stakeholders & Influence Network - Empty by default
export const initialStakeholders = [];

// Initial Campaign Strategy Phases
export const initialCampaignPhases = [
  {
    id: 'PHASE-1',
    phaseNumber: 1,
    name: 'Announcement & Groundwork',
    description: 'Official campaign launch, team setup, and baseline voter perception audits.',
    startDate: '2026-06-01',
    endDate: '2026-07-15',
    progressPct: 100,
    status: 'Completed',
    objectives: ['Set up 17 constituency war rooms', 'Audit 2,400 polling stations', 'Recruit 500 ground agents'],
    tasks: [
      { id: 'TSK-101', title: 'Register campaign executive committee', assignedTeam: 'Legal & Strategy', priority: 'High', status: 'Completed', kpiTarget: '1 Committee', kpiCurrent: '1 Committee', dueDate: '2026-06-15' },
      { id: 'TSK-102', title: 'Complete baseline voter sentiment survey', assignedTeam: 'Research', priority: 'High', status: 'Completed', kpiTarget: '5,000 Voters', kpiCurrent: '5,240 Voters', dueDate: '2026-07-10' }
    ]
  },
  {
    id: 'PHASE-2',
    phaseNumber: 2,
    name: 'Team Formation & Agent Binding',
    description: 'Recruit, vet, and assign polling station agents and regional coordinators.',
    startDate: '2026-07-16',
    endDate: '2026-08-31',
    progressPct: 92,
    status: 'Active',
    objectives: ['Achieve 100% agent coverage in high-risk polling stations', 'Conduct agent Form 34A mobile app training'],
    tasks: [
      { id: 'TSK-201', title: 'Train regional coordinators on CI-EMS portal', assignedTeam: 'Operations', priority: 'Urgent', status: 'Completed', kpiTarget: '47 Coordinators', kpiCurrent: '47 Coordinators', dueDate: '2026-08-01' },
      { id: 'TSK-202', title: 'Bind polling station agents to IEBC streams', assignedTeam: 'Field Ops', priority: 'High', status: 'In Progress', kpiTarget: '2,000 Agents', kpiCurrent: '1,840 Agents', dueDate: '2026-08-30' }
    ]
  },
  {
    id: 'PHASE-3',
    phaseNumber: 3,
    name: 'Voter Mobilization & Stakeholder Network',
    description: 'Engage opinion leaders, youth groups, bodaboda associations, and clergy.',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    progressPct: 35,
    status: 'Active',
    objectives: ['Reach 250,000 voters via local stakeholder networks', 'Execute 100 townhall sessions'],
    tasks: [
      { id: 'TSK-301', title: 'Mobilize village elders across key wards', assignedTeam: 'Grassroots', priority: 'High', status: 'In Progress', kpiTarget: '500 Elders', kpiCurrent: '280 Elders', dueDate: '2026-09-15' },
      { id: 'TSK-302', title: 'Launch ward issue-based pulse surveys', assignedTeam: 'Digital Media', priority: 'Medium', status: 'In Progress', kpiTarget: '10,000 Responses', kpiCurrent: '3,890 Responses', dueDate: '2026-09-25' }
    ]
  },
  {
    id: 'PHASE-4',
    phaseNumber: 4,
    name: 'Mass Campaign & Media Blitz',
    description: 'High-visibility mega rallies, radio campaigns, and digital canvassing.',
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    progressPct: 0,
    status: 'Pending',
    objectives: ['Dominate local vernacular radio airwaves', 'Distribute campaign flyers'],
    tasks: [
      { id: 'TSK-401', title: 'Finalize rally schedule and security protocol', assignedTeam: 'Events', priority: 'High', status: 'Todo', kpiTarget: '5 Rallies', kpiCurrent: '0 Rallies', dueDate: '2026-10-10' }
    ]
  },
  {
    id: 'PHASE-5',
    phaseNumber: 5,
    name: 'GOTV (Get Out The Vote) & Tally Operations',
    description: 'Turnout drive on election day, polling station monitoring, and real-time Form 34A tallying.',
    startDate: '2026-10-26',
    endDate: '2026-11-02',
    progressPct: 0,
    status: 'Pending',
    objectives: ['Achieve 85%+ voter turnout in our strongholds', 'Transmit 100% Form 34A evidence within 4 hours of poll close'],
    tasks: [
      { id: 'TSK-501', title: 'Activate election day transportation dispatch desk', assignedTeam: 'Logistics', priority: 'Urgent', status: 'Todo', kpiTarget: '200 Vehicles', kpiCurrent: '0 Vehicles', dueDate: '2026-10-27' }
    ]
  }
];

// Initial Tally Center Submissions - Empty by default
export const initialTallyCenterData = [];

// Initial AI Assistant Knowledge Base & Chat Log - Empty by default
export const initialAIChatHistory = [];
