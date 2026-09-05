import iebcGeographyData from './iebcGeographyData.json';

export const initialGeography = iebcGeographyData;

// Super Admin user strictly retained for account setup and administration
export const initialUsers = [
  {
    id: 'USR-ADMIN-01',
    name: 'Admin System Director',
    role: 'Admin',
    email: 'admin.super@ems.go.ke',
    password: 'AdminSuper2026!',
    phone: '+254 700 000 000',
    assignedEntity: 'GLOBAL',
    entityName: 'National HQ',
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
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

