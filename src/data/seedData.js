// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS)
// Comprehensive Seed Dataset for all 9 Modules
// ====================================================================

export const initialUsersList = [
  {
    id: 'USR-SUPERADMIN-01',
    name: 'Chief Campaign Director (Super Admin)',
    role: 'Super Admin',
    email: 'admin@campaign.org',
    password: 'Password2026!',
    phone: '+254 711 000 000',
    assignedEntity: 'GLOBAL',
    entityName: 'National Campaign HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-STRATEGY-01',
    name: 'Dr. Evelyn Wanjiru',
    role: 'Strategy Team',
    email: 'strategy@campaign.org',
    password: 'Password2026!',
    phone: '+254 722 111 222',
    assignedEntity: 'GLOBAL',
    entityName: 'Strategic War Room',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-REGIONAL-01',
    name: 'David Ochieng',
    role: 'Regional Coordinator',
    email: 'regional.nairobi@campaign.org',
    password: 'Password2026!',
    phone: '+254 733 444 555',
    assignedEntity: 'Nairobi',
    entityName: 'Nairobi Metro Region',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-AGENT-01',
    name: 'Samuel Kiprop',
    role: 'Field Agent',
    email: 'agent.samuel@campaign.org',
    password: 'Password2026!',
    phone: '+254 799 888 777',
    assignedEntity: 'Westlands Ward',
    entityName: 'Westlands Primary Stream 01',
    supervisorId: 'USR-REGIONAL-01',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-MCA-01',
    name: 'moha',
    role: 'MCA',
    email: 'moha@campaign.org',
    password: 'Password2026!',
    phone: '+254 711 223 344',
    assignedEntity: 'WARD-0019',
    entityName: 'KONGOWEA',
    constituency: 'Nyali',
    ward: 'Kongowea',
    county: 'Mombasa',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-OBSERVER-01',
    name: 'Amina Mohamed',
    role: 'Observer',
    email: 'observer@campaign.org',
    password: 'Password2026!',
    phone: '+254 788 999 000',
    assignedEntity: 'Nairobi',
    entityName: 'Election Observer Desk',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  }
];

// Initial Intelligence Metrics for Polling Stations
export const initialStationIntelligence = {
  'PS-01-001': {
    partyAdvantageScore: 78,
    incumbencyScore: 65,
    oppositionStrength: 32,
    publicPerceptionRating: 4.3,
    competitorActivityLevel: 'High',
    strategicImportance: 'High',
    riskLevel: 'Low'
  },
  'PS-01-002': {
    partyAdvantageScore: 42,
    incumbencyScore: 50,
    oppositionStrength: 68,
    publicPerceptionRating: 3.1,
    competitorActivityLevel: 'Critical',
    strategicImportance: 'High',
    riskLevel: 'Severe'
  },
  'PS-01-003': {
    partyAdvantageScore: 55,
    incumbencyScore: 58,
    oppositionStrength: 45,
    publicPerceptionRating: 3.8,
    competitorActivityLevel: 'Medium',
    strategicImportance: 'Medium',
    riskLevel: 'Medium'
  },
  'PS-01-004': {
    partyAdvantageScore: 89,
    incumbencyScore: 80,
    oppositionStrength: 15,
    publicPerceptionRating: 4.8,
    competitorActivityLevel: 'Low',
    strategicImportance: 'High',
    riskLevel: 'Low'
  }
};

// Initial Agent Directory
export const initialAgentDirectory = [
  {
    id: 'AGT-001',
    userId: 'USR-AGENT-01',
    fullName: 'Samuel Kiprop',
    name: 'Samuel Kiprop',
    phone: '+254 799 888 777',
    region: 'Nairobi - Westlands',
    assignedEntity: 'Westlands Ward',
    assignedStations: ['PS-01-001', 'PS-01-002'],
    supervisor: 'David Ochieng (Regional Coordinator)',
    supervisorId: 'USR-REGIONAL-01',
    status: 'Active',
    performanceRating: 4.8,
    lastActivityTimestamp: '2026-09-04T13:45:00Z',
    reportsSubmittedCount: 14,
    surveysCompletedCount: 28
  },
  {
    id: 'AGT-002',
    userId: 'USR-AGENT-02',
    fullName: 'Grace Muthoni',
    name: 'Grace Muthoni',
    phone: '+254 712 345 678',
    region: 'Nairobi - Dagoretti',
    assignedEntity: 'Dagoretti Ward',
    assignedStations: ['PS-01-003'],
    supervisor: 'David Ochieng (Regional Coordinator)',
    supervisorId: 'USR-REGIONAL-01',
    status: 'On Duty',
    performanceRating: 4.5,
    lastActivityTimestamp: '2026-09-04T14:10:00Z',
    reportsSubmittedCount: 9,
    surveysCompletedCount: 19
  },
  {
    id: 'AGT-003',
    userId: 'USR-AGENT-03',
    fullName: 'Kevin Omwamba',
    name: 'Kevin Omwamba',
    phone: '+254 723 456 789',
    region: 'Nairobi - Kibra',
    assignedEntity: 'Kibra Ward',
    assignedStations: ['PS-01-004'],
    supervisor: 'David Ochieng (Regional Coordinator)',
    supervisorId: 'USR-REGIONAL-01',
    status: 'Active',
    performanceRating: 4.9,
    lastActivityTimestamp: '2026-09-04T12:00:00Z',
    reportsSubmittedCount: 22,
    surveysCompletedCount: 45
  },
  {
    id: 'AGT-004',
    userId: 'USR-AGENT-04',
    fullName: 'Ali Hassan Swaleh',
    name: 'Ali Hassan Swaleh',
    phone: '+254 744 555 666',
    region: 'Mombasa - Kongowea (WARD-0019)',
    assignedEntity: 'WARD-0019',
    assignedStations: ['PS-02-001'],
    supervisor: 'moha (MCA / Regional Coordinator)',
    supervisorId: 'USR-MCA-01',
    status: 'Active',
    performanceRating: 4.8,
    lastActivityTimestamp: '2026-09-04T15:00:00Z',
    reportsSubmittedCount: 12,
    surveysCompletedCount: 31
  },
  {
    id: 'AGT-005',
    userId: 'USR-AGENT-05',
    fullName: 'Fatuma Bakari',
    name: 'Fatuma Bakari',
    phone: '+254 755 666 777',
    region: 'Mombasa - Kongowea (WARD-0019)',
    assignedEntity: 'WARD-0019',
    assignedStations: ['PS-02-002'],
    supervisor: 'moha (MCA / Regional Coordinator)',
    supervisorId: 'USR-MCA-01',
    status: 'On Duty',
    performanceRating: 4.7,
    lastActivityTimestamp: '2026-09-04T15:30:00Z',
    reportsSubmittedCount: 8,
    surveysCompletedCount: 22
  }
];

// Initial Surveys
export const initialSurveys = [
  {
    id: 'SURV-101',
    title: 'Ward Voter Priority & Key Issues Survey 2026',
    type: 'Issue-Based Survey',
    targetAudience: 'Registered Ward Voters',
    status: 'Active',
    publicSlug: 'ward-voter-priority-2026',
    createdAt: '2026-08-15T09:00:00Z',
    questions: [
      {
        id: 'Q1',
        questionText: 'What is the single most urgent issue in your local ward?',
        type: 'Single Choice',
        options: ['Youth Employment & Skills', 'Clean Water Access', 'Road Infrastructure', 'Healthcare & Clinics', 'Security & Streetlights']
      },
      {
        id: 'Q2',
        questionText: 'How would you rate the current incumbent representative performance?',
        type: 'Rating',
        options: []
      },
      {
        id: 'Q3',
        questionText: 'Which candidate do you currently favor for Governor?',
        type: 'Single Choice',
        options: ['Candidate A (Our Party)', 'Candidate B (Opposition)', 'Candidate C (Independent)', 'Undecided']
      },
      {
        id: 'Q4',
        questionText: 'Please share any specific community concerns or suggestions:',
        type: 'Text',
        options: []
      }
    ],
    responseCount: 142
  },
  {
    id: 'SURV-102',
    title: 'Candidate Preference & Brand Perception Pulse Poll',
    type: 'Candidate Preference Poll',
    targetAudience: 'Youth Voters (18-35)',
    status: 'Active',
    publicSlug: 'youth-pulse-poll-2026',
    createdAt: '2026-08-20T10:30:00Z',
    questions: [
      {
        id: 'Q1',
        questionText: 'Are you planning to vote in the upcoming election?',
        type: 'Single Choice',
        options: ['Definitely Yes', 'Probably Yes', 'Undecided', 'No']
      },
      {
        id: 'Q2',
        questionText: 'Which communication channel influences your choice most?',
        type: 'Multi Choice',
        options: ['Townhall Meetings', 'WhatsApp Groups', 'TikTok & Instagram', 'Radio & TV', 'Community Leaders']
      }
    ],
    responseCount: 389
  }
];

// Initial Field Reports
export const initialFieldReports = [
  {
    id: 'REP-2026-001',
    agentId: 'AGT-001',
    agentName: 'Samuel Kiprop',
    category: 'Mobilization Reports',
    title: 'Successful Youth Bodaboda Leader Engagement Meeting',
    notes: 'Met with 35 Bodaboda association leaders at Westlands stage. Agreed to lead voter registration drive.',
    severityLevel: 'Low',
    latitude: -1.2676,
    longitude: 36.8111,
    locationName: 'Westlands Stage, Nairobi',
    createdAt: '2026-09-04T10:15:00Z',
    media: [
      {
        id: 'MED-101',
        fileName: 'bodaboda_meeting_01.jpg',
        originalSizeKb: 3420,
        compressedSizeKb: 285,
        thumbnailUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=200&auto=format&fit=crop&q=80',
        mediaUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'REP-2026-002',
    agentId: 'AGT-002',
    agentName: 'Grace Muthoni',
    category: 'Opponent Activity Reports',
    title: 'Opponent Rally Door-to-Door Distribution Detected',
    notes: 'Rival campaign team distributing branded merchandise and flyers near Market Square.',
    severityLevel: 'High',
    latitude: -1.3001,
    longitude: 36.7820,
    locationName: 'Dagoretti Corner, Nairobi',
    createdAt: '2026-09-04T12:40:00Z',
    media: [
      {
        id: 'MED-102',
        fileName: 'opponent_flyer.jpg',
        originalSizeKb: 4100,
        compressedSizeKb: 310,
        thumbnailUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=200&auto=format&fit=crop&q=80',
        mediaUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'REP-2026-003',
    agentId: 'AGT-003',
    agentName: 'Kevin Omwamba',
    category: 'Incident Reports',
    title: 'Voter Registration Equipment Intermittent Connection',
    notes: 'BVR kit at Station #004 experiencing battery issues. Presiding Officer notified.',
    severityLevel: 'Medium',
    latitude: -1.3120,
    longitude: 36.7910,
    locationName: 'Kibra Primary School, Nairobi',
    createdAt: '2026-09-04T13:00:00Z',
    media: []
  }
];

// Initial Stakeholders & Influence Network
export const initialStakeholders = [
  {
    id: 'STK-001',
    name: 'Elder Mzee Francis Kariuki',
    category: 'Village Elders',
    county: 'Nairobi',
    ward: 'Westlands Ward',
    village: 'Kangemi Central',
    influenceRating: 9,
    reachEstimate: 1200,
    assignedCoordinator: 'David Ochieng',
    status: 'Supportive',
    activities: [
      { id: 'ACT-1', type: 'Community Baraza', notes: 'Pledged support of 12 council elders.', followUpDate: '2026-09-10' }
    ]
  },
  {
    id: 'STK-002',
    name: 'Pastor Joseph Mwangi',
    category: 'Clergy',
    county: 'Nairobi',
    ward: 'Parklands Ward',
    village: 'Highridge',
    influenceRating: 8,
    reachEstimate: 2500,
    assignedCoordinator: 'David Ochieng',
    status: 'Engaged',
    activities: [
      { id: 'ACT-2', type: 'Church Fellowship Breakfast', notes: 'Invited candidate for Sunday guest speech.', followUpDate: '2026-09-07' }
    ]
  },
  {
    id: 'STK-003',
    name: 'Mama Sarah Nekesa',
    category: 'Women Leaders',
    county: 'Nairobi',
    ward: 'Kitisuru Ward',
    village: 'Githogoro',
    influenceRating: 9,
    reachEstimate: 1800,
    assignedCoordinator: 'David Ochieng',
    status: 'Supportive',
    activities: [
      { id: 'ACT-3', type: 'Chama Empowerment Summit', notes: 'Organized 15 table banking groups.', followUpDate: '2026-09-12' }
    ]
  },
  {
    id: 'STK-004',
    name: 'Brian "Speedy" Otieno',
    category: 'Bodaboda Leaders',
    county: 'Nairobi',
    ward: 'Westlands Ward',
    village: 'Westlands Stage',
    influenceRating: 8,
    reachEstimate: 950,
    assignedCoordinator: 'Samuel Kiprop (Field Agent)',
    status: 'Supportive',
    activities: [
      { id: 'ACT-4', type: 'Rider Safety Workshop', notes: 'Distributed 200 branded reflector jackets.', followUpDate: '2026-09-08' }
    ]
  }
];

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
    description: 'Recruit, vet, and assign 2,500 polling station agents and regional coordinators.',
    startDate: '2026-07-16',
    endDate: '2026-08-31',
    progressPct: 92,
    status: 'Active',
    objectives: ['Achieve 100% agent coverage in high-risk polling stations', 'Conduct agent Form 34A mobile app training'],
    tasks: [
      { id: 'TSK-201', title: 'Train regional coordinators on CI-EMS portal', assignedTeam: 'Operations', priority: 'Urgent', status: 'Completed', kpiTarget: '47 Coordinators', kpiCurrent: '47 Coordinators', dueDate: '2026-08-01' },
      { id: 'TSK-202', title: 'Bind 2,000 polling station agents to IEBC streams', assignedTeam: 'Field Ops', priority: 'High', status: 'In Progress', kpiTarget: '2,000 Agents', kpiCurrent: '1,840 Agents', dueDate: '2026-08-30' }
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
      { id: 'TSK-301', title: 'Mobilize 500 village elders across key wards', assignedTeam: 'Grassroots', priority: 'High', status: 'In Progress', kpiTarget: '500 Elders', kpiCurrent: '280 Elders', dueDate: '2026-09-15' },
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
    objectives: ['Dominate local vernacular radio airwaves', 'Distribute 500k campaign flyers'],
    tasks: [
      { id: 'TSK-401', title: 'Finalize stadium rally schedule and security protocol', assignedTeam: 'Events', priority: 'High', status: 'Todo', kpiTarget: '5 Rallies', kpiCurrent: '0 Rallies', dueDate: '2026-10-10' }
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

// Initial Tally Center Submissions
export const initialTallyCenterData = [
  {
    id: 'TALLY-001',
    pollingStationId: 'PS-01-001',
    pollingStationCode: '001',
    pollingStationName: 'Westlands Primary School Stream 01',
    registeredVoters: 750,
    candAVotes: 412,
    candBVotes: 198,
    candCVotes: 45,
    rejectedVotes: 12,
    totalVotesCast: 667,
    status: 'Approved',
    approvalComment: 'Form 34A verified by Supervisor. Figures match physical ballot count.',
    verifiedBy: 'David Ochieng',
    submittedAt: '2026-09-04T11:20:00Z',
    evidence: {
      formType: 'Form 34A',
      imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=200&auto=format&fit=crop&q=80',
      hashSignature: '0x8f2a1b9c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
      ocrExtracted: {
        candA: 412,
        candB: 198,
        candC: 45,
        rejected: 12,
        total: 667,
        confidence: 0.98
      }
    }
  },
  {
    id: 'TALLY-002',
    pollingStationId: 'PS-01-002',
    pollingStationCode: '002',
    pollingStationName: 'Westlands Primary School Stream 02',
    registeredVoters: 720,
    candAVotes: 350,
    candBVotes: 380, // Note sum is 730 > 720 (Mismatch!)
    candCVotes: 10,
    rejectedVotes: 5,
    totalVotesCast: 745,
    status: 'Mismatch',
    approvalComment: 'FLAGGED: Total votes cast (745) exceeds total registered voters (720)!',
    verifiedBy: null,
    submittedAt: '2026-09-04T12:05:00Z',
    evidence: {
      formType: 'Form 34A',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      hashSignature: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      ocrExtracted: {
        candA: 350,
        candB: 280, // OCR read 280, but agent typed 380
        candC: 10,
        rejected: 5,
        total: 645,
        confidence: 0.91
      }
    }
  }
];

// Initial AI Assistant Knowledge Base & Chat Log
export const initialAIChatHistory = [
  {
    id: 'CHAT-1',
    sender: 'user',
    text: 'Which wards are becoming competitive this week?',
    timestamp: '2026-09-04T09:15:00Z'
  },
  {
    id: 'CHAT-2',
    sender: 'ai',
    text: 'Based on intelligence scores and field report analysis: **Westlands Ward (Stream 02)** and **Dagoretti Corner** show high opponent activity. Opponent strength in Stream 02 has risen to 68%, making it a high-risk swing area.',
    timestamp: '2026-09-04T09:15:05Z'
  }
];
