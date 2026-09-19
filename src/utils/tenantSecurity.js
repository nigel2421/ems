// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.4)
// Server-Derived Multi-Tenant Context & Isolation Enforcement Engine
// ====================================================================

import { getUserScope, SCOPE_LEVELS } from './rbac.js';

/**
  Derives strict server-side context from authenticated user session
  Golden Security Rule: Never trust client-provided tenant_id overrides
 */
export const deriveServerTenantContext = (authenticatedUser) => {
  if (!authenticatedUser) {
    throw new Error('Unauthenticated: Cannot derive tenant context');
  }

  const tenantId = authenticatedUser.tenantId || 'TNT-ALPHA';
  const campaignId = authenticatedUser.campaignId || 'CMP-2027-MAIN';
  const electionId = authenticatedUser.electionId || 'KE-2027-GENERAL';

  const userScope = getUserScope(authenticatedUser);

  return {
    tenantId,
    campaignId,
    electionId,
    userId: authenticatedUser.id,
    userRole: authenticatedUser.role,
    scopeLevel: userScope.level,
    county: userScope.county || authenticatedUser.county,
    constituency: userScope.constituency || authenticatedUser.constituency,
    ward: userScope.ward || authenticatedUser.ward,
    assignedEntity: userScope.assignedEntity || authenticatedUser.assignedEntity
  };
};

/**
  Validates if a requested resource is accessible under the server-derived tenant context
 */
export const validateTenantAccess = (authenticatedUser, resourcePayload = {}, clientTenantIdOverride = null) => {
  if (!authenticatedUser) return false;

  const serverContext = deriveServerTenantContext(authenticatedUser);

  // 1. Enforce Golden Rule: Client tenant override manipulation must be rejected if mismatch
  if (clientTenantIdOverride && clientTenantIdOverride !== serverContext.tenantId) {
    return {
      isAllowed: false,
      reason: 'SECURITY_ALERT: Client-supplied tenant_id override mismatch (Cross-Tenant Isolation Breach Attempt)'
    };
  }

  // 2. Resource tenant check
  const resourceTenantId = resourcePayload.tenantId || serverContext.tenantId;
  if (resourceTenantId !== serverContext.tenantId) {
    return {
      isAllowed: false,
      reason: 'FORBIDDEN: Resource belongs to a different tenant domain'
    };
  }

  // 3. Resource campaign check
  if (resourcePayload.campaignId && resourcePayload.campaignId !== serverContext.campaignId) {
    return {
      isAllowed: false,
      reason: 'FORBIDDEN: Resource belongs to another campaign boundary'
    };
  }

  // 4. Geographic jurisdiction check for regional roles
  if (serverContext.scopeLevel !== SCOPE_LEVELS.NATIONAL) {
    if (serverContext.scopeLevel === SCOPE_LEVELS.COUNTY) {
      if (resourcePayload.county && resourcePayload.county !== serverContext.county) {
        return { isAllowed: false, reason: 'FORBIDDEN: Resource outside assigned county jurisdiction' };
      }
    }

    if (serverContext.scopeLevel === SCOPE_LEVELS.WARD) {
      if (resourcePayload.ward && resourcePayload.ward !== serverContext.ward) {
        return { isAllowed: false, reason: 'FORBIDDEN: Resource outside assigned ward jurisdiction' };
      }
    }
  }

  return {
    isAllowed: true,
    serverContext
  };
};
