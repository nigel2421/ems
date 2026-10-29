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
    localStorage.setItem('ems_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ems_login_activity_logs', JSON.stringify(loginActivityLogs));
  }, [loginActivityLogs]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('ems_current_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('ems_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    sessionStorage.setItem('ems_is_authenticated', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  const login = (email, password) => {
    const cleanEmail = normaliseEmail(email);
    const telemetry = getDeviceTelemetry();

    // Lockout is checked BEFORE the password so a locked account cannot be probed
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

    const foundUser = users.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    const logEntry = {
      id: `LOG-LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      email: cleanEmail || 'unknown@user',
      userName: foundUser ? foundUser.name : (cleanEmail || 'Unknown User'),
      role: foundUser ? foundUser.role : 'Unauthenticated',
      ipAddress: telemetry.ipAddress,
      geoLocation: telemetry.geoLocation,
      deviceType: telemetry.deviceType,
      os: telemetry.os,
      browser: telemetry.browser,
      status: foundUser ? 'Success' : 'Failure',
      failureReason: foundUser ? null : 'Invalid email address or password credentials'
    };

    setLoginActivityLogs(prev => [logEntry, ...prev]);

    if (foundUser) {
      const nextStore = recordSuccess(freshStore, cleanEmail);
      saveThrottleStore(nextStore);
      setThrottleStore(nextStore);
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      setIs2FAVerified(!foundUser.twoFactorEnabled);
      setLogoutReason(null);
      sessionStorage.removeItem(LOGOUT_REASON_KEY);
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      sessionStorage.setItem('ems_current_user', JSON.stringify(foundUser));
      sessionStorage.setItem('ems_is_authenticated', 'true');
      return { success: true, user: foundUser };
    }

    const nextStore = recordFailure(freshStore, cleanEmail);
    saveThrottleStore(nextStore);
    setThrottleStore(nextStore);
    const after = getLockState(nextStore, cleanEmail);
    if (after.locked) {
      return {
        success: false,
        locked: true,
        permanent: !!after.permanent,
        retryInMs: after.retryInMs || 0,
        error: after.permanent ? LOCKED_PERMANENT_MESSAGE : LOCKED_TEMP_MESSAGE
      };
    }

    return { success: false, error: 'Invalid email address or password credentials.' };
  };

  // logout() may be wired directly to onClick, so only accept string reasons
  const logout = (reason) => {
    const why = typeof reason === 'string' ? reason : null;
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLogoutReason(why);
    if (why) sessionStorage.setItem(LOGOUT_REASON_KEY, why);
    else sessionStorage.removeItem(LOGOUT_REASON_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem('ems_current_user');
    sessionStorage.setItem('ems_is_authenticated', 'false');
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

  const switchUser = (userId) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      setIs2FAVerified(!found.twoFactorEnabled);
    }
  };

  const addUser = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const updateUserProfile = (userId, updatedFields) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedFields } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, ...updatedFields }));
    }
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser && currentUser.id === userId) {
      logout();
    }
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

  const canAccessModule = (moduleName) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'Super Admin' || role === 'Admin') return true;

    switch (moduleName) {
      case 'polling_stations':
      case 'agents':
      case 'surveys':
      case 'field_reports':
      case 'mobilization':
      case 'strategy':
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
        updateUserProfile,
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
