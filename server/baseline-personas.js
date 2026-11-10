// ====================================================================
// KuraTech Baseline Personas
// Canonical baseline accounts for demonstration, staging, and administrative bootstrap.
// All passwords default to AdminSuper2026! unless overridden by ENV.
// ====================================================================

export const DEFAULT_BASELINE_PASSWORD = process.env.DEV_ADMIN_PASSWORD || 'AdminSuper2026!';

export const BASELINE_PERSONAS = [
  {
    id: 'USR-ADMIN-01',
    name: 'Admin System Director',
    role: 'Super Admin',
    email: 'admin.super@ems.go.ke',
    password: process.env.DEV_ADMIN_PASSWORD || DEFAULT_BASELINE_PASSWORD,
    phone: '+254 700 000 000',
    assignedEntity: 'GLOBAL',
    entityName: 'National HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-GOVERNOR-01',
    name: 'Hon. Johnson Sakaja (Governor Nairobi)',
    role: 'Governor',
    contestType: 'Gubernatorial',
    email: 'governor.nairobi@ems.go.ke',
    password: process.env.DEV_GOVERNOR_PASSWORD || DEFAULT_BASELINE_PASSWORD,
    phone: '+254 720 000 001',
    county: 'Nairobi',
    assignedEntity: 'C-047',
    entityName: 'Nairobi Campaign HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-COUNTY-01',
    name: 'Nairobi County Coordinator',
    role: 'County Coordinator',
    email: 'senator.nairobi@ems.go.ke',
    password: process.env.DEV_SENATOR_PASSWORD || DEFAULT_BASELINE_PASSWORD,
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
    email: 'mp.westlands@ems.go.ke',
    password: process.env.DEV_MP_PASSWORD || DEFAULT_BASELINE_PASSWORD,
    phone: '+254 730 000 003',
    county: 'Nairobi',
    constituency: 'Westlands',
    assignedEntity: 'CONST-274',
    entityName: 'Westlands Constituency HQ',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-MP-MOMBASA-01',
    name: 'Hon. Mohammed Ali (MP Nyali)',
    role: 'MP',
    contestType: 'Parliamentary',
    email: 'mp.nyali@ems.go.ke',
    password: process.env.DEV_MP_MOMBASA_PASSWORD || DEFAULT_BASELINE_PASSWORD,
    phone: '+254 711 000 007',
    county: 'Mombasa',
    constituency: 'Nyali',
    assignedEntity: 'CONST-004',
    entityName: 'Nyali Constituency HQ',
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-GOVERNOR-MOMBASA-01',
    name: 'Hon. Abdulswamad Nassir (Governor Mombasa)',
    role: 'Governor',
    contestType: 'Gubernatorial',
    email: 'governor.mombasa@ems.go.ke',
    password: process.env.DEV_GOV_MOMBASA_PASSWORD || DEFAULT_BASELINE_PASSWORD,
    phone: '+254 711 000 008',
    county: 'Mombasa',
    assignedEntity: 'C-001',
    entityName: 'Mombasa County HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-MCA-01',
    name: 'Parklands Ward Coordinator',
    role: 'Ward Coordinator',
    email: 'mca.parklands@ems.go.ke',
    password: process.env.DEV_MCA_PASSWORD || DEFAULT_BASELINE_PASSWORD,
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
    email: 'sarah.kimani@aspirant.ke',
    password: process.env.DEV_ASPIRANT_PASSWORD || DEFAULT_BASELINE_PASSWORD,
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
    email: 'james.agent@ems.go.ke',
    password: process.env.DEV_AGENT_PASSWORD || DEFAULT_BASELINE_PASSWORD,
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
