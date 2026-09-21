// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 3.1)
// Contest-Aware Geographic Scope Resolver & Security Enforcement Engine
// ====================================================================

export const SCOPE_LEVELS = {
  NATIONAL: 'NATIONAL',       // Super Admin, Admin, Campaign HQ
  COUNTY: 'COUNTY',           // County Coordinator, Governor, Senator
  CONSTITUENCY: 'CONSTITUENCY', // Constituency Coordinator, MP
  WARD: 'WARD',               // Ward Coordinator, MCA
  POLLING_CENTRE: 'POLLING_CENTRE', // Polling Coordinator
  STATION: 'STATION'          // Agent / Field Agent
};

export const CONTEST_JURISDICTION_POLICY = {
  PRESIDENT: { level: SCOPE_LEVELS.NATIONAL, title: 'Presidential', defaultScope: 'NATIONAL' },
  PRESIDENTIAL: { level: SCOPE_LEVELS.NATIONAL, title: 'Presidential', defaultScope: 'NATIONAL' },
  GOVERNOR: { level: SCOPE_LEVELS.COUNTY, title: 'Governor', defaultScope: 'COUNTY' },
  GUBERNATORIAL: { level: SCOPE_LEVELS.COUNTY, title: 'Governor', defaultScope: 'COUNTY' },
  SENATOR: { level: SCOPE_LEVELS.COUNTY, title: 'Senator', defaultScope: 'COUNTY' },
  SENATORIAL: { level: SCOPE_LEVELS.COUNTY, title: 'Senator', defaultScope: 'COUNTY' },
  COUNTY_WOMAN_REPRESENTATIVE: { level: SCOPE_LEVELS.COUNTY, title: 'County Woman Representative', defaultScope: 'COUNTY' },
  WOMAN_REP: { level: SCOPE_LEVELS.COUNTY, title: 'County Woman Representative', defaultScope: 'COUNTY' },
  MP: { level: SCOPE_LEVELS.CONSTITUENCY, title: 'Member of National Assembly (MP)', defaultScope: 'CONSTITUENCY' },
  MEMBER_OF_NATIONAL_ASSEMBLY: { level: SCOPE_LEVELS.CONSTITUENCY, title: 'Member of National Assembly (MP)', defaultScope: 'CONSTITUENCY' },
  PARLIAMENTARY: { level: SCOPE_LEVELS.CONSTITUENCY, title: 'Member of National Assembly (MP)', defaultScope: 'CONSTITUENCY' },
  MCA: { level: SCOPE_LEVELS.WARD, title: 'Member of County Assembly (MCA)', defaultScope: 'WARD' },
  MEMBER_OF_COUNTY_ASSEMBLY: { level: SCOPE_LEVELS.WARD, title: 'Member of County Assembly (MCA)', defaultScope: 'WARD' }
};

const normalizeGeo = (str) => {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

export const getContestPolicy = (contestOrCampaign) => {
  let rawContest = contestOrCampaign;
  if (typeof contestOrCampaign === 'object' && contestOrCampaign !== null) {
    rawContest = contestOrCampaign.contestType || contestOrCampaign.contest || contestOrCampaign.role || 'PRESIDENT';
  }

  if (!rawContest || typeof rawContest !== 'string') {
    return CONTEST_JURISDICTION_POLICY.PRESIDENT;
  }

  const normalizedKey = rawContest.toUpperCase().trim().replace(/\s+/g, '_');

  for (const key of Object.keys(CONTEST_JURISDICTION_POLICY)) {
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      return CONTEST_JURISDICTION_POLICY[key];
    }
  }

  return CONTEST_JURISDICTION_POLICY.PRESIDENT;
};

export const resolveEffectiveGeographicScope = ({
  authenticatedUser = null,
  campaign = null,
  contest = null,
  userAssignments = null
} = {}) => {
  if (!authenticatedUser && !campaign) {
    return {
      isConfigured: false,
      failClosed: true,
      error: 'Electoral Scope Not Configured: Authenticated user context missing'
    };
  }

  const contestTypeStr = contest || (campaign && (campaign.contestType || campaign.contest)) || (authenticatedUser && authenticatedUser.role) || 'PRESIDENT';
  const policy = getContestPolicy(contestTypeStr);

  // Default user scope extraction if user exists
  const role = authenticatedUser?.role;
  const userCounty = authenticatedUser?.county;
  const userConst = authenticatedUser?.constituency;
  const userWard = authenticatedUser?.ward;

  let userScopeLevel = SCOPE_LEVELS.NATIONAL;
  if (['County Coordinator', 'Governor', 'Senator'].includes(role)) userScopeLevel = SCOPE_LEVELS.COUNTY;
  else if (['Constituency Coordinator', 'MP'].includes(role)) userScopeLevel = SCOPE_LEVELS.CONSTITUENCY;
  else if (['Ward Coordinator', 'MCA'].includes(role)) userScopeLevel = SCOPE_LEVELS.WARD;
  else if (['Polling Coordinator', 'Aspirant'].includes(role)) userScopeLevel = SCOPE_LEVELS.POLLING_CENTRE;
  else if (['Field Agent', 'Agent'].includes(role)) userScopeLevel = SCOPE_LEVELS.STATION;

  const campaignCounty = campaign?.county || campaign?.jurisdiction?.county || authenticatedUser?.county || null;
  const campaignConst = campaign?.constituency || campaign?.jurisdiction?.constituency || authenticatedUser?.constituency || null;
  const campaignWard = campaign?.ward || campaign?.jurisdiction?.ward || authenticatedUser?.ward || null;

  let campaignLockedCounty = null;
  let campaignLockedConst = null;
  let campaignLockedWard = null;

  if (policy.level === SCOPE_LEVELS.COUNTY || policy.level === SCOPE_LEVELS.CONSTITUENCY || policy.level === SCOPE_LEVELS.WARD) {
    campaignLockedCounty = campaignCounty || 'Nairobi';
  }

  if (policy.level === SCOPE_LEVELS.CONSTITUENCY || policy.level === SCOPE_LEVELS.WARD) {
    campaignLockedConst = campaignConst || 'Westlands';
  }

  if (policy.level === SCOPE_LEVELS.WARD) {
    campaignLockedWard = campaignWard || 'Kitisuru';
  }

  let effectiveCounty = campaignLockedCounty;
  let effectiveConst = campaignLockedConst;
  let effectiveWard = campaignLockedWard;

  if (userCounty && userScopeLevel !== SCOPE_LEVELS.NATIONAL) {
    if (effectiveCounty && normalizeGeo(effectiveCounty) !== normalizeGeo(userCounty)) {
      return {
        isConfigured: false,
        failClosed: true,
        error: `Electoral Scope Conflict: User scope (${userCounty}) does not intersect campaign scope (${effectiveCounty})`
      };
    }
    effectiveCounty = userCounty;
  }

  if (userConst && [SCOPE_LEVELS.CONSTITUENCY, SCOPE_LEVELS.WARD, SCOPE_LEVELS.POLLING_CENTRE, SCOPE_LEVELS.STATION].includes(userScopeLevel)) {
    if (effectiveConst && normalizeGeo(effectiveConst) !== normalizeGeo(userConst)) {
      return {
        isConfigured: false,
        failClosed: true,
        error: `Electoral Scope Conflict: User constituency (${userConst}) does not intersect campaign constituency (${effectiveConst})`
      };
    }
    effectiveConst = userConst;
  }

  if (userWard && [SCOPE_LEVELS.WARD, SCOPE_LEVELS.POLLING_CENTRE, SCOPE_LEVELS.STATION].includes(userScopeLevel)) {
    if (effectiveWard && normalizeGeo(effectiveWard) !== normalizeGeo(userWard)) {
      return {
        isConfigured: false,
        failClosed: true,
        error: `Electoral Scope Conflict: User ward (${userWard}) does not intersect campaign ward (${effectiveWard})`
      };
    }
    effectiveWard = userWard;
  }

  const locked = {
    country: 'Kenya',
    county: effectiveCounty,
    constituency: effectiveConst,
    ward: effectiveWard
  };

  const selectableLevels = [];
  if (!effectiveCounty) selectableLevels.push('COUNTY');
  if (!effectiveConst) selectableLevels.push('CONSTITUENCY');
  if (!effectiveWard) selectableLevels.push('WARD');
  selectableLevels.push('POLLING_CENTRE');
  selectableLevels.push('POLLING_STREAM');

  const startingLevel = selectableLevels[0] || 'POLLING_STREAM';

  return {
    isConfigured: true,
    failClosed: false,
    contestType: policy.title,
    rootPolicyLevel: policy.level,
    locked,
    selectableLevels,
    startingLevel,
    effectiveScopeLevel: effectiveWard ? SCOPE_LEVELS.WARD : (effectiveConst ? SCOPE_LEVELS.CONSTITUENCY : (effectiveCounty ? SCOPE_LEVELS.COUNTY : SCOPE_LEVELS.NATIONAL))
  };
};

export const validateGeographicSubmission = (submissionLocation = {}, effectiveScope = {}, user = null, logAuditAction = null) => {
  if (!effectiveScope || effectiveScope.failClosed || !effectiveScope.isConfigured) {
    const errorMsg = 'GEOGRAPHY_OUTSIDE_EFFECTIVE_SCOPE: Campaign geography is unconfigured or fail-closed';
    if (logAuditAction) {
      logAuditAction(user, 'SECURITY_DENIAL_GEOGRAPHY', errorMsg);
    }
    return { valid: false, reason: 'GEOGRAPHY_OUTSIDE_EFFECTIVE_SCOPE', details: errorMsg };
  }

  const locked = effectiveScope.locked || {};

  if (locked.county) {
    const subCounty = submissionLocation.county || submissionLocation.countyName || submissionLocation.countyId || '';
    if (!subCounty || (normalizeGeo(subCounty) !== normalizeGeo(locked.county) && !normalizeGeo(subCounty).includes(normalizeGeo(locked.county)))) {
      const details = `Submitted county '${subCounty}' is outside locked campaign county '${locked.county}'`;
      if (logAuditAction) {
        logAuditAction(user, 'SECURITY_DENIAL_GEOGRAPHY', details);
      }
      return { valid: false, reason: 'GEOGRAPHY_OUTSIDE_EFFECTIVE_SCOPE', details };
    }
  }

  if (locked.constituency) {
    const subConst = submissionLocation.constituency || submissionLocation.constituencyName || submissionLocation.constituencyId || '';
    if (!subConst || (normalizeGeo(subConst) !== normalizeGeo(locked.constituency) && !normalizeGeo(subConst).includes(normalizeGeo(locked.constituency)))) {
      const details = `Submitted constituency '${subConst}' is outside locked constituency '${locked.constituency}'`;
      if (logAuditAction) {
        logAuditAction(user, 'SECURITY_DENIAL_GEOGRAPHY', details);
      }
      return { valid: false, reason: 'GEOGRAPHY_OUTSIDE_EFFECTIVE_SCOPE', details };
    }
  }

  if (locked.ward) {
    const subWard = submissionLocation.ward || submissionLocation.wardName || submissionLocation.wardId || '';
    if (!subWard || (normalizeGeo(subWard) !== normalizeGeo(locked.ward) && !normalizeGeo(subWard).includes(normalizeGeo(locked.ward)))) {
      const details = `Submitted ward '${subWard}' is outside locked ward '${locked.ward}'`;
      if (logAuditAction) {
        logAuditAction(user, 'SECURITY_DENIAL_GEOGRAPHY', details);
      }
      return { valid: false, reason: 'GEOGRAPHY_OUTSIDE_EFFECTIVE_SCOPE', details };
    }
  }

  return { valid: true };
};
