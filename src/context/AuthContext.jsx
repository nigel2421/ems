import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initialUsers } from '../data/mockData';
import { getDeviceTelemetry } from '../utils/deviceParser';
import {
  ROLES,
  ROLE_HIERARCHY,
  getUserScope,
  canAccessLocation,
  filterByScope,
  canPerformAction
} from '../utils/rbac';
import {
  getLockState,
  recordFailure,
  recordSuccess,
  adminUnlock,
  loadThrottleStore,
  saveThrottleStore,
  normaliseEmail,
  THROTTLE_STORAGE_KEY
} from '../utils/loginThrottle';
import { safeStorage } from '../utils/safeStorage';
import { isSessionExpired, LAST_ACTIVITY_KEY, LOGOUT_REASON_KEY } from '../utils/sessionPolicy';

const AuthContext = createContext(null);

const LOCKED_TEMP_MESSAGE = 'Too many failed sign-in attempts. Please wait before trying again.';
const LOCKED_PERMANENT_MESSAGE =
  'This account has been locked after repeated failed sign-in attempts. Contact your system administrator to restore access.';

// Drop sessions that went idle past the limit (e.g. tab closed and reopened later)
const sessionIsStale = () => {
  try {
    const last = sessionStorage.getItem(LAST_ACTIVITY_KEY);
    return last !== null && isSessionExpired(Number(last));
  } catch {
    return false;
  }
};

export { ROLE_HIERARCHY, ROLES };


// Seed initial login logs for testing if empty
const initialLoginLogs = [
  {
    id: 'LOG-LOGIN-101',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    email: 'admin.super@ems.go.ke',
    userName: 'Admin System Director',
    role: 'Admin',
    ipAddress: '197.237.112.45',
    geoLocation: 'Nairobi, Kenya',
    deviceType: 'Desktop',
    os: 'Windows 11/10',
    browser: 'Google Chrome 128.0',
    status: 'Success',
    failureReason: null
  },
  {
    id: 'LOG-LOGIN-102',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    email: 'unknown.hacker@external.org',
    userName: 'unknown.hacker@external.org',
    role: 'Unauthenticated',
    ipAddress: '45.142.214.99',
    geoLocation: 'Mombasa, Kenya',
    deviceType: 'Mobile',
    os: 'Android OS',
    browser: 'Mozilla Firefox 130.0',
    status: 'Failure',
    failureReason: 'Invalid email address or password credentials'
  }
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('ems_users');
      if (!saved) return initialUsers;
      const parsed = JSON.parse(saved);
      const existingEmails = new Set(parsed.map(u => u.email.toLowerCase()));
      const missing = initialUsers.filter(u => !existingEmails.has(u.email.toLowerCase()));
      return [...parsed, ...missing];
    } catch (e) {
      return initialUsers;
    }
  });

  const [loginActivityLogs, setLoginActivityLogs] = useState(() => {
    try {
      const savedLogs = localStorage.getItem('ems_login_activity_logs');
      return savedLogs ? JSON.parse(savedLogs) : initialLoginLogs;
    } catch (e) {
      return initialLoginLogs;
    }
  });

  // Session-bound authentication: Require login on new browser sessions / dev app load
  const [staleOnLoad] = useState(() => {
    const stale = sessionIsStale();
    if (stale) {
      sessionStorage.removeItem('ems_current_user');
      sessionStorage.setItem('ems_is_authenticated', 'false');
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'inactivity');
    }
    return stale;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    if (staleOnLoad) return null;
    const savedUser = sessionStorage.getItem('ems_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (staleOnLoad) return false;
    const savedAuth = sessionStorage.getItem('ems_is_authenticated');
    return savedAuth !== null ? JSON.parse(savedAuth) : false;
  });

  const [logoutReason, setLogoutReason] = useState(() => sessionStorage.getItem(LOGOUT_REASON_KEY));

  const [throttleStore, setThrottleStore] = useState(() => loadThrottleStore());

  useEffect(() => {
    saveThrottleStore(throttleStore);
  }, [throttleStore]);

  // Keep lockouts consistent across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THROTTLE_STORAGE_KEY) setThrottleStore(loadThrottleStore());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const [is2FAVerified, setIs2FAVerified] = useState(true);

  // Purge legacy persistent localStorage auth flags to ensure login on reload/dev launch
  useEffect(() => {
    localStorage.removeItem('ems_is_authenticated');
    localStorage.removeItem('ems_current_user');
  }, []);

  useEffect(() => {
    safeStorage.setItem('ems_users', users);
  }, [users]);

  useEffect(() => {
    safeStorage.setItem('ems_login_activity_logs', loginActivityLogs);
  }, [loginActivityLogs]);

  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem('ems_current_user', currentUser);
    } else {
      sessionStorage.removeItem('ems_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    safeStorage.setItem('ems_is_authenticated', isAuthenticated);
  }, [isAuthenticated]);

  // Helper to determine if current client is in the Admin Console realm
  const isInAdminRealm = () => {
    try {
      if (typeof window === 'undefined') return false;
      const path = window.location.pathname || '';
      const host = window.location.hostname || '';
      return path.includes('admin.html') || host.startsWith('ops-konsole.');
    } catch {
      return false;
    }
  };

  // Verify session on mount with server cookie
  useEffect(() => {
    let active = true;
    const isAdm = isInAdminRealm();
    const headers = isAdm ? { 'X-EMS-Realm': 'admin' } : {};
    fetch('/api/auth/me?silent=1', { credentials: 'include', headers })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active) return;
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
          safeStorage.setItem('ems_current_user', data.user);
          safeStorage.setItem('ems_is_authenticated', true);
          if (data.user.role !== 'Agent' && data.user.role !== 'Field Agent') {
            fetchServerUsers();
          }
        } else if (data && !data.authenticated) {
          setCurrentUser(null);
          setIsAuthenticated(false);
          sessionStorage.removeItem('ems_current_user');
          safeStorage.setItem('ems_is_authenticated', false);
        }
      })
      .catch(() => {
        // Dev server or offline fallback: keep sessionStorage state
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password, options = {}) => {
    const isTargetingAdmin = Boolean(
      (options && options.isAdminConsole) || isInAdminRealm()
    );
    const cleanEmail = normaliseEmail(email);
    const telemetry = getDeviceTelemetry();

    // Check if account is suspended in local store
    const localUser = users.find(u =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.phone && u.phone.replace(/\s+/g, '').toLowerCase() === cleanEmail.replace(/\s+/g, '').toLowerCase())
    );
    if (localUser && (localUser.isSuspended || localUser.status === 'Suspended')) {
      return {
        success: false,
        error: 'Account has been suspended by administration. Contact campaign operations.'
      };
    }
    const freshStore = loadThrottleStore();
    const lock = getLockState(freshStore, cleanEmail);
    if (lock.locked) {
      setLoginActivityLogs(prev => [{
        id: `LOG-LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        email: cleanEmail || 'unknown@user',
        userName: cleanEmail || 'Unknown User',
        role: 'Unauthenticated',
        ipAddress: telemetry.ipAddress,
        geoLocation: telemetry.geoLocation,
        deviceType: telemetry.deviceType,
        os: telemetry.os,
        browser: telemetry.browser,
        status: 'Failure',
        failureReason: lock.permanent ? 'Account locked (administrator unlock required)' : 'Temporarily locked (too many attempts)'
      }, ...prev]);
      return {
        success: false,
        locked: true,
        permanent: !!lock.permanent,
        retryInMs: lock.retryInMs || 0,
        error: lock.permanent ? LOCKED_PERMANENT_MESSAGE : LOCKED_TEMP_MESSAGE
      };
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (isTargetingAdmin) {
        headers['X-EMS-Realm'] = 'admin';
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          email: cleanEmail,
          password,
          realm: isTargetingAdmin ? 'admin' : undefined
        })
      });
      const data = await res.json().catch(() => ({}));

      const isSuccess = res.ok && data.success;
      const authedUser = isSuccess ? data.user : null;

      const logEntry = {
        id: `LOG-LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        email: cleanEmail || 'unknown@user',
        userName: authedUser ? authedUser.name : (cleanEmail || 'Unknown User'),
        role: authedUser ? authedUser.role : 'Unauthenticated',
        ipAddress: telemetry.ipAddress,
        geoLocation: telemetry.geoLocation,
        deviceType: telemetry.deviceType,
        os: telemetry.os,
        browser: telemetry.browser,
        status: isSuccess ? 'Success' : 'Failure',
        failureReason: isSuccess ? null : (data.error || 'Invalid email address or password credentials')
      };

      setLoginActivityLogs(prev => [logEntry, ...prev]);

      if (isSuccess && authedUser) {
        const nextStore = recordSuccess(freshStore, cleanEmail);
        saveThrottleStore(nextStore);
        setThrottleStore(nextStore);
        setCurrentUser(authedUser);
        setIsAuthenticated(true);
        setIs2FAVerified(!authedUser.twoFactorEnabled);
        setLogoutReason(null);
        sessionStorage.removeItem(LOGOUT_REASON_KEY);
        sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        safeStorage.setItem('ems_current_user', authedUser);
        safeStorage.setItem('ems_is_authenticated', true);
        if (authedUser.role !== 'Agent' && authedUser.role !== 'Field Agent') {
          fetchServerUsers();
        }
        return { success: true, user: authedUser, redirectTo: data.redirectTo };
      }

      if (res.status >= 500) {
        return { success: false, error: data.error || 'Authentication service is temporarily unavailable. Please verify server connection.' };
      }

      const nextStore = recordFailure(freshStore, cleanEmail);
      saveThrottleStore(nextStore);
      setThrottleStore(nextStore);
      const after = getLockState(nextStore, cleanEmail);
      if (after.locked || data.locked) {
        const perm = after.permanent || data.permanent;
        const retry = after.retryInMs || data.retryInMs || 0;
        return {
          success: false,
          locked: true,
          permanent: !!perm,
          retryInMs: retry,
          error: perm ? LOCKED_PERMANENT_MESSAGE : LOCKED_TEMP_MESSAGE
        };
      }

      return { success: false, error: data.error || 'Invalid email address or password credentials.' };
    } catch {
      return { success: false, error: 'Unable to reach the authentication service. Please verify server connection.' };
    }
  };

  // logout() may be wired directly to onClick, so only accept string reasons
  const logout = (reason) => {
    const why = typeof reason === 'string' ? reason : null;
    const isAdm = isInAdminRealm();
    const headers = isAdm ? { 'X-EMS-Realm': 'admin' } : {};
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers }).catch(() => {});
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLogoutReason(why);
    if (why) sessionStorage.setItem(LOGOUT_REASON_KEY, why);
    else sessionStorage.removeItem(LOGOUT_REASON_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem('ems_current_user');
    safeStorage.setItem('ems_is_authenticated', false);
    localStorage.removeItem('ems_is_authenticated');
    localStorage.removeItem('ems_current_user');
  };

  const clearLogoutReason = () => {
    setLogoutReason(null);
    sessionStorage.removeItem(LOGOUT_REASON_KEY);
  };

  const getAccountLockState = (email) => getLockState(throttleStore, email);

  const unlockAccount = (email) => {
    const nextStore = adminUnlock(loadThrottleStore(), email);
    saveThrottleStore(nextStore);
    setThrottleStore(nextStore);
  };

  const switchUser = () => {
    // Impersonation is disabled for operational security
    console.warn('[EMS-AUTH] switchUser() is disabled. Authenticate with official credentials.');
  };

  const fetchServerUsers = async () => {
    try {
      const isAdm = isInAdminRealm();
      const headers = isAdm ? { 'X-EMS-Realm': 'admin' } : {};
      const res = await fetch('/api/admin/users', { credentials: 'include', headers });
      if (!res.ok) return [];
      const serverUsers = await res.json().catch(() => []);
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        setUsers(prev => {
          const map = new Map();
          prev.forEach(u => map.set(u.id || (u.email || '').toLowerCase(), u));
          serverUsers.forEach(su => {
            const key = su.id || (su.email || '').toLowerCase();
            const existing = map.get(key) || {};
            map.set(key, { ...existing, ...su });
          });
          const merged = Array.from(map.values());
          try {
            safeStorage.setItem('ems_users', merged);
          } catch {}
          return merged;
        });
        return serverUsers;
      }
    } catch (err) {
      console.warn('[AuthContext] Could not fetch server users:', err);
    }
    return [];
  };

  const addUser = async (newUser, password) => {
    // 1. Attempt server-side persistence first if admin or running with server
    try {
      const isAdm = isInAdminRealm();
      const headers = {
        'Content-Type': 'application/json'
      };
      if (isAdm || (currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin')) {
        headers['X-EMS-Realm'] = 'admin';
      } else {
        headers['X-EMS-Realm'] = 'user';
      }
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...newUser,
          password: password || 'AdminSuper2026!'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.user) {
        const persistedUser = data.user;
        setUsers(prev => {
          const updated = [persistedUser, ...prev.filter(u => u.email !== persistedUser.email && u.id !== persistedUser.id)];
          try {
            safeStorage.setItem('ems_users', updated);
          } catch {}
          return updated;
        });
        return { success: true, user: persistedUser };
      }
      if (!res.ok) {
        return { success: false, error: data.error || 'Server rejected user creation.' };
      }
    } catch (err) {
      console.warn('[AuthContext] Server user creation failed, falling back locally:', err);
    }

    // Local fallback for offline/test environments
    setUsers(prev => {
      const updated = [newUser, ...prev.filter(u => u.email !== newUser.email && u.id !== newUser.id)];
      try {
        safeStorage.setItem('ems_users', updated);
      } catch {}
      return updated;
    });
    return { success: true, user: newUser };
  };

  const updateUserProfile = (userId, updatedFields) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, ...updatedFields } : u);
      try {
        safeStorage.setItem('ems_users', updated);
      } catch (e) {}
      return updated;
    });
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updatedFields }));
    }
  };

  const updateUserFeatures = (userId, newFeatures) => {
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          const merged = { ...(u.features || {}), ...newFeatures };
          return { ...u, features: merged };
        }
        return u;
      });
      try {
        safeStorage.setItem('ems_users', updated);
      } catch (e) {}
      return updated;
    });
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => ({
        ...prev,
        features: { ...(prev.features || {}), ...newFeatures }
      }));
    }
  };

  const getLockedAccounts = () => {
    return users.filter(u => getAccountLockState(u.email).locked);
  };

  const suspendUser = (userId, reason = 'Administrative suspension') => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      status: 'Suspended',
      isSuspended: true,
      suspendedAt: new Date().toISOString(),
      suspensionReason: reason
    } : u));
    if (currentUser && currentUser.id === userId) {
      logout('suspended');
    }
  };

  const reinstateUser = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      status: 'Active',
      isSuspended: false,
      suspendedAt: null,
      suspensionReason: null
    } : u));
  };

  const deleteUser = async (userId) => {
    try {
      const isAdm = isInAdminRealm();
      const headers = isAdm ? { 'X-EMS-Realm': 'admin' } : {};
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Server rejected user deletion.' };
      }
    } catch (err) {
      console.warn('[AuthContext] Server user deletion failed, updating locally:', err);
    }
    setUsers(prev => {
      const filtered = prev.filter(u => u.id !== userId);
      try {
        safeStorage.setItem('ems_users', filtered);
      } catch (e) {}
      return filtered;
    });
    return { success: true, deletedId: userId };
  };

  const toggle2FAStatus = () => {
    setIs2FAVerified(prev => !prev);
  };

  const userScope = useMemo(() => getUserScope(currentUser), [currentUser]);

  const hasPermission = (minRole) => {
    if (!currentUser) return false;
    const userRank = ROLE_HIERARCHY[currentUser.role] || 0;
    const requiredRank = ROLE_HIERARCHY[minRole] || 0;
    return userRank >= requiredRank || currentUser.role === 'Super Admin' || currentUser.role === 'Admin';
  };

  const hasRole = (...roles) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') return true;
    return roles.includes(currentUser.role);
  };

  const checkCanPerformAction = (action) => canPerformAction(currentUser, action);
  const checkCanAccessLocation = (location) => canAccessLocation(currentUser, location);

  const CANDIDATE_ROLES = ['Governor', 'Senator', 'Woman Rep', 'MP', 'MCA', 'Presidential', 'President', 'Aspirant', 'Candidate Admin'];

  const findParentCandidate = (user) => {
    if (!user) return null;
    if (CANDIDATE_ROLES.includes(user.role)) {
      return user;
    }
    if (user.candidateId) {
      const match = users.find(u => u.id === user.candidateId);
      if (match) return match;
    }
    if (user.county) {
      const gov = users.find(u => CANDIDATE_ROLES.includes(u.role) && u.county?.toLowerCase() === user.county?.toLowerCase());
      if (gov) return gov;
    }
    return null;
  };

  const canAccessModule = (moduleName) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'Super Admin' || role === 'Admin') return true;

    switch (moduleName) {
      case 'strategy': {
        if (CANDIDATE_ROLES.includes(role)) {
          return Boolean(currentUser.features?.strategicIntelligence);
        }
        const parentCandidate = findParentCandidate(currentUser);
        if (parentCandidate) {
          return Boolean(parentCandidate.features?.strategicIntelligence);
        }
        return false;
      }
      case 'strategy_team': {
        if (CANDIDATE_ROLES.includes(role)) {
          return Boolean(currentUser.features?.strategyTeam);
        }
        const parentCandidate = findParentCandidate(currentUser);
        if (parentCandidate) {
          return Boolean(parentCandidate.features?.strategyTeam);
        }
        return false;
      }
      case 'polling_stations':
      case 'agents':
      case 'surveys':
      case 'field_reports':
      case 'mobilization':
      case 'tally_center':
        return true;
      case 'ai_assistant':
        return checkCanPerformAction('VIEW_AI_ASSISTANT');
      case 'system_settings':
      case 'user_management':
        return checkCanPerformAction('MANAGE_USERS');
      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        userScope,
        login,
        logout,
        switchUser,
        addUser,
        fetchServerUsers,
        updateUserProfile,
        updateUserFeatures,
        getLockedAccounts,
        suspendUser,
        reinstateUser,
        deleteUser,
        is2FAVerified,
        setIs2FAVerified,
        toggle2FAStatus,
        hasPermission,
        hasRole,
        canAccessModule,
        canPerformAction: checkCanPerformAction,
        canAccessLocation: checkCanAccessLocation,
        filterByScope: (items, type) => filterByScope(currentUser, items, type),
        loginActivityLogs,
        logoutReason,
        clearLogoutReason,
        getAccountLockState,
        unlockAccount,
        ROLE_HIERARCHY
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
