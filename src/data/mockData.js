import iebcGeographyData from './iebcGeographyData.json' with { type: 'json' };

export const initialGeography = iebcGeographyData;

// Provisioned System Accounts matching .env environment specifications
export const initialUsers = [
  {
    id: 'USR-ADMIN-01',
    name: 'Admin System Director',
    role: 'Super Admin',
    email: import.meta.env?.VITE_ADMIN_EMAIL || 'admin.super@ems.go.ke',
    phone: '+254 700 000 000',
    assignedEntity: 'GLOBAL',
    entityName: 'National HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    features: { strategicIntelligence: true, strategyTeam: true }
  },
  {
    id: 'USR-GOVERNOR-01',
    name: 'Hon. Johnson Sakaja (Governor Nairobi)',
    role: 'Governor',
    contestType: 'Gubernatorial',
    email: import.meta.env?.VITE_GOVERNOR_EMAIL || 'governor.nairobi@ems.go.ke',
    phone: '+254 720 000 001',
    county: 'Nairobi',
    assignedEntity: 'C-047',
    entityName: 'Nairobi Campaign HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    features: { strategicIntelligence: false, strategyTeam: false }
  },
  {
    id: 'USR-COUNTY-01',
    name: 'Nairobi County Coordinator',
    role: 'County Coordinator',
    email: import.meta.env?.VITE_SENATOR_EMAIL || 'senator.nairobi@ems.go.ke',
    phone: '+254 720 000 002',
    county: 'Nairobi',
    assignedEntity: 'C-047',
    entityName: 'Nairobi County Operations',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-MP-01',
    name: 'Hon. Tim Wanyonyi (MP Westlands)',
    role: 'MP',
    contestType: 'Parliamentary',
    email: import.meta.env?.VITE_MP_EMAIL || 'mp.westlands@ems.go.ke',
    phone: '+254 730 000 003',
    county: 'Nairobi',
    constituency: 'Westlands',
    assignedEntity: 'CONST-274',
    entityName: 'Westlands Constituency HQ',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    features: { strategicIntelligence: false, strategyTeam: false }
  },
  {
    id: 'USR-MP-MOMBASA-01',
    name: 'Hon. Mohammed Ali (MP Nyali)',
    role: 'MP',
    contestType: 'Parliamentary',
    email: import.meta.env?.VITE_MP_MOMBASA_EMAIL || 'mp.nyali@ems.go.ke',
    phone: '+254 711 000 007',
    county: 'Mombasa',
    constituency: 'Nyali',
    assignedEntity: 'CONST-004',
    entityName: 'Nyali Constituency HQ',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    features: { strategicIntelligence: false, strategyTeam: false }
  },
  {
    id: 'USR-GOVERNOR-MOMBASA-01',
    name: 'Hon. Abdulswamad Nassir (Governor Mombasa)',
    role: 'Governor',
    contestType: 'Gubernatorial',
    email: import.meta.env?.VITE_GOVERNOR_MOMBASA_EMAIL || 'governor.mombasa@ems.go.ke',
    phone: '+254 711 000 008',
    county: 'Mombasa',
    assignedEntity: 'C-001',
    entityName: 'Mombasa County HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    features: { strategicIntelligence: false, strategyTeam: false }
  },
  {
    id: 'USR-MCA-01',
    name: 'Parklands Ward Coordinator',
    role: 'Ward Coordinator',
    email: import.meta.env?.VITE_MCA_EMAIL || 'mca.parklands@ems.go.ke',
    phone: '+254 740 000 004',
    county: 'Nairobi',
    constituency: 'Westlands',
    ward: 'Parklands/Highridge',
    assignedEntity: '1367',
    entityName: 'Parklands/Highridge Ward HQ',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-POLLING-01',
    name: 'Highridge Primary Polling Coordinator',
    role: 'Polling Coordinator',
    email: import.meta.env?.VITE_ASPIRANT_EMAIL || 'sarah.kimani@aspirant.ke',
    phone: '+254 750 000 005',
    county: 'Nairobi',
    constituency: 'Westlands',
    ward: 'Parklands/Highridge',
    assignedEntity: 'Highridge Primary Centre',
    entityName: 'Highridge Primary Polling Centre',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-AGENT-01',
    name: 'James Kiprop (Station Agent)',
    role: 'Agent',
    email: import.meta.env?.VITE_AGENT_EMAIL || 'james.agent@ems.go.ke',
    phone: '+254 790 000 006',
    county: 'Nairobi',
    constituency: 'Westlands',
    ward: 'Parklands/Highridge',
    assignedEntity: 'Highridge Primary Stream 01',
    entityName: 'Highridge Primary Stream 01',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  }
];

export const initialSubmissions = [];

export const iebcOfficialBroadcasts = {};

export const initialAuditLogs = [
  {
    id: 'LOG-1001',
    timestamp: new Date().toISOString(),
    userId: 'USR-ADMIN-01',
    userName: 'Admin System Director',
    role: 'Admin',
    ipAddress: '127.0.0.1',
    action: 'SYSTEM_HARDENED',
    details: 'System initialized in production state. IEBC Gazette imported with 46,051 polling stations across 47 counties and 22,349,912 registered voters.'
  }
];
