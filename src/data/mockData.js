export const initialGeography = {
  counties: [
    { id: 'C047', name: 'Nairobi City County', code: '047', registeredVoters: 2500000, constituenciesCount: 17 },
    { id: 'C022', name: 'Kiambu County', code: '022', registeredVoters: 1300000, constituenciesCount: 12 },
    { id: 'C032', name: 'Nakuru County', code: '032', registeredVoters: 1100000, constituenciesCount: 11 },
    { id: 'C001', name: 'Mombasa County', code: '001', registeredVoters: 850000, constituenciesCount: 6 }
  ],
  constituencies: [
    { id: 'CONST-01', countyId: 'C047', name: 'Westlands Constituency', registeredVoters: 160000, wardsCount: 5 },
    { id: 'CONST-02', countyId: 'C047', name: 'Dagoretti North Constituency', registeredVoters: 150000, wardsCount: 5 },
    { id: 'CONST-03', countyId: 'C022', name: 'Ruiru Constituency', registeredVoters: 175000, wardsCount: 8 },
    { id: 'CONST-04', countyId: 'C001', name: 'Nyali Constituency', registeredVoters: 120000, wardsCount: 5 }
  ],
  wards: [
    { id: 'WARD-01', constituencyId: 'CONST-01', name: 'Parklands / Highridge Ward', registeredVoters: 32000, pollingStationsCount: 18 },
    { id: 'WARD-02', constituencyId: 'CONST-01', name: 'Karura Ward', registeredVoters: 28000, pollingStationsCount: 14 },
    { id: 'WARD-03', constituencyId: 'CONST-01', name: 'Kangemi Ward', registeredVoters: 35000, pollingStationsCount: 20 },
    { id: 'WARD-04', constituencyId: 'CONST-03', name: 'Kahawa Sukari Ward', registeredVoters: 24000, pollingStationsCount: 12 }
  ],
  pollingStations: [
    { id: 'PS-101', wardId: 'WARD-01', name: 'Westlands Primary School - Stream 1', code: '047/01/01/001', registeredVoters: 650, agentAssigned: 'USR-AGENT-01' },
    { id: 'PS-102', wardId: 'WARD-01', name: 'Westlands Primary School - Stream 2', code: '047/01/01/002', registeredVoters: 640, agentAssigned: 'USR-AGENT-02' },
    { id: 'PS-103', wardId: 'WARD-01', name: 'City Park Secondary - Stream 1', code: '047/01/01/003', registeredVoters: 580, agentAssigned: 'USR-AGENT-03' },
    { id: 'PS-104', wardId: 'WARD-02', name: 'Karura Forest Primary School', code: '047/01/02/001', registeredVoters: 720, agentAssigned: null },
    { id: 'PS-105', wardId: 'WARD-03', name: 'Kangemi High School - Main Hall', code: '047/01/03/001', registeredVoters: 800, agentAssigned: 'USR-AGENT-04' }
  ]
};

export const initialUsers = [
  {
    id: 'USR-GOV-01',
    name: 'Hon. Johnson Sakaja',
    role: 'Governor',
    email: 'governor.nairobi@ems.go.ke',
    phone: '+254 712 345 678',
    assignedEntity: 'C047', // Nairobi
    entityName: 'Nairobi City County',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-SEN-01',
    name: 'Hon. Edwin Sifuna',
    role: 'Senator',
    email: 'senator.nairobi@ems.go.ke',
    phone: '+254 722 987 654',
    assignedEntity: 'C047',
    entityName: 'Nairobi City County',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-MP-01',
    name: 'Hon. Tim Wanyonyi',
    role: 'MP',
    email: 'mp.westlands@ems.go.ke',
    phone: '+254 733 111 222',
    assignedEntity: 'CONST-01',
    entityName: 'Westlands Constituency',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-MCA-01',
    name: 'Hon. David Okello',
    role: 'MCA',
    email: 'mca.parklands@ems.go.ke',
    phone: '+254 720 333 444',
    assignedEntity: 'WARD-01',
    entityName: 'Parklands / Highridge Ward',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-ASP-01',
    name: 'Aspirant Sarah Kimani',
    role: 'Aspirant',
    email: 'sarah.kimani@aspirant.ke',
    phone: '+254 711 999 888',
    assignedEntity: 'CONST-01',
    entityName: 'Westlands Aspirant (UDA/Azimio Coalition)',
    party: 'Progressive Kenya Alliance',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-AGENT-01',
    name: 'Agent James Omwamba',
    role: 'Agent',
    email: 'james.agent@ems.go.ke',
    phone: '+254 790 555 444',
    assignedEntity: 'PS-101',
    entityName: 'Westlands Primary School - Stream 1',
    aspirantId: 'USR-ASP-01',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-ADMIN-01',
    name: 'Admin System Director',
    role: 'Admin',
    email: 'admin.super@ems.go.ke',
    phone: '+254 700 000 000',
    assignedEntity: 'GLOBAL',
    entityName: 'National HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  }
];

export const initialSubmissions = [
  {
    id: 'SUB-2026-001',
    pollingStationId: 'PS-101',
    pollingStationName: 'Westlands Primary School - Stream 1',
    wardId: 'WARD-01',
    constituencyId: 'CONST-01',
    countyId: 'C047',
    agentId: 'USR-AGENT-01',
    agentName: 'Agent James Omwamba',
    aspirantId: 'USR-ASP-01',
    timestamp: '2026-08-31T10:15:00Z',
    status: 'Approved', // Draft, Submitted, Approved, Rejected, Mismatch
    approvalDate: '2026-08-31T11:00:00Z',
    approvalComment: 'Form 34A evidence verified and signed by presiding officer.',
    tallies: {
      presidential: { candidateA: 320, candidateB: 280, candidateC: 15, rejectedVotes: 5, totalValid: 615 },
      governor: { Sakaja: 340, Igathe: 260, rejectedVotes: 10, totalValid: 600 },
      mp: { Wanyonyi: 380, NelsonHavi: 240, rejectedVotes: 8, totalValid: 620 }
    },
    evidence: {
      form34AUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80',
      compressedSizeKb: 412,
      originalSizeKb: 3850,
      timestamp: '2026-08-31T10:14:22Z',
      gpsCoordinates: '-1.2676, 36.8111 (Westlands PS)',
      deviceInfo: 'Samsung Galaxy A53 5G - IEBC Verified Mobile App',
      hashSignature: '0x8f9a7b...e412c'
    }
  },
  {
    id: 'SUB-2026-002',
    pollingStationId: 'PS-103',
    pollingStationName: 'City Park Secondary - Stream 1',
    wardId: 'WARD-01',
    constituencyId: 'CONST-01',
    countyId: 'C047',
    agentId: 'USR-AGENT-03',
    agentName: 'Agent Mercy Wanjiru',
    aspirantId: 'USR-ASP-01',
    timestamp: '2026-08-31T12:40:00Z',
    status: 'Submitted', // Pending Aspirant approval
    approvalDate: null,
    approvalComment: null,
    tallies: {
      presidential: { candidateA: 290, candidateB: 260, candidateC: 10, rejectedVotes: 4, totalValid: 560 },
      governor: { Sakaja: 310, Igathe: 240, rejectedVotes: 6, totalValid: 550 },
      mp: { Wanyonyi: 300, NelsonHavi: 260, rejectedVotes: 5, totalValid: 560 }
    },
    evidence: {
      form34AUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      compressedSizeKb: 388,
      originalSizeKb: 4200,
      timestamp: '2026-08-31T12:38:10Z',
      gpsCoordinates: '-1.2612, 36.8204 (City Park)',
      deviceInfo: 'iPhone 13 Pro',
      hashSignature: '0x3c11f...a99b2'
    }
  },
  {
    id: 'SUB-2026-003',
    pollingStationId: 'PS-105',
    pollingStationName: 'Kangemi High School - Main Hall',
    wardId: 'WARD-03',
    constituencyId: 'CONST-01',
    countyId: 'C047',
    agentId: 'USR-AGENT-04',
    agentName: 'Agent Peter Njoroge',
    aspirantId: 'USR-ASP-01',
    timestamp: '2026-08-31T13:10:00Z',
    status: 'Mismatch', // Mismatch Flagged!
    approvalDate: '2026-08-31T13:30:00Z',
    approvalComment: 'Flagged discrepancy between agent physical copy and IEBC server broadcast.',
    tallies: {
      presidential: { candidateA: 550, candidateB: 210, candidateC: 20, rejectedVotes: 12, totalValid: 780 },
      governor: { Sakaja: 490, Igathe: 280, rejectedVotes: 10, totalValid: 770 },
      mp: { Wanyonyi: 520, NelsonHavi: 250, rejectedVotes: 10, totalValid: 770 }
    },
    evidence: {
      form34AUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      compressedSizeKb: 512,
      originalSizeKb: 4800,
      timestamp: '2026-08-31T13:05:44Z',
      gpsCoordinates: '-1.2589, 36.7512 (Kangemi)',
      deviceInfo: 'Redmi Note 11',
      hashSignature: '0x7d22e...b541a'
    }
  }
];

export const iebcOfficialBroadcasts = {
  'PS-101': {
    pollingStationId: 'PS-101',
    tallies: {
      presidential: { candidateA: 320, candidateB: 280, candidateC: 15, rejectedVotes: 5, totalValid: 615 },
      governor: { Sakaja: 340, Igathe: 260, rejectedVotes: 10, totalValid: 600 },
      mp: { Wanyonyi: 380, NelsonHavi: 240, rejectedVotes: 8, totalValid: 620 }
    }
  },
  'PS-103': {
    pollingStationId: 'PS-103',
    tallies: {
      presidential: { candidateA: 290, candidateB: 260, candidateC: 10, rejectedVotes: 4, totalValid: 560 },
      governor: { Sakaja: 310, Igathe: 240, rejectedVotes: 6, totalValid: 550 },
      mp: { Wanyonyi: 300, NelsonHavi: 260, rejectedVotes: 5, totalValid: 560 }
    }
  },
  'PS-105': {
    pollingStationId: 'PS-105',
    // IEBC broadcast has lower votes for candidateA than agent physical Form 34A evidence!
    tallies: {
      presidential: { candidateA: 350, candidateB: 210, candidateC: 20, rejectedVotes: 12, totalValid: 580 }, // 200 votes missing on broadcast!
      governor: { Sakaja: 390, Igathe: 280, rejectedVotes: 10, totalValid: 670 },
      mp: { Wanyonyi: 320, NelsonHavi: 250, rejectedVotes: 10, totalValid: 570 }
    }
  }
};

export const initialAuditLogs = [
  {
    id: 'LOG-1001',
    timestamp: '2026-08-31T08:00:15Z',
    userId: 'USR-ADMIN-01',
    userName: 'Admin System Director',
    role: 'Admin',
    ipAddress: '192.168.1.10',
    action: 'SYSTEM_INITIALIZATION',
    details: 'IEBC Master polling station gazette imported successfully (18,400 polling stations).'
  },
  {
    id: 'LOG-1002',
    timestamp: '2026-08-31T08:15:30Z',
    userId: 'USR-GOV-01',
    userName: 'Hon. Johnson Sakaja',
    role: 'Governor',
    ipAddress: '10.0.4.12',
    action: 'USER_LOGIN_2FA',
    details: '2FA authentication verified via Authenticator App.'
  },
  {
    id: 'LOG-1003',
    timestamp: '2026-08-31T10:15:00Z',
    userId: 'USR-AGENT-01',
    userName: 'Agent James Omwamba',
    role: 'Agent',
    ipAddress: '41.215.172.9',
    action: 'EVIDENCE_SUBMISSION',
    details: 'Submitted Form 34A for Westlands Primary School (PS-101). Compressed 3.8MB image to 412KB.'
  },
  {
    id: 'LOG-1004',
    timestamp: '2026-08-31T11:00:00Z',
    userId: 'USR-ASP-01',
    userName: 'Aspirant Sarah Kimani',
    role: 'Aspirant',
    ipAddress: '197.232.48.51',
    action: 'SUBMISSION_APPROVED',
    details: 'Approved Submission SUB-2026-001 after signature validation.'
  },
  {
    id: 'LOG-1005',
    timestamp: '2026-08-31T13:30:00Z',
    userId: 'SYSTEM_BOT',
    userName: 'IEBC Auto-Validator Engine',
    role: 'Admin',
    ipAddress: '127.0.0.1',
    action: 'MISMATCH_DETECTED',
    details: 'FLAGGED DISCREPANCY: Polling station PS-105 (Kangemi High School) candidateA vote variance of +200 votes between physical Form 34A and IEBC public broadcast.'
  }
];
