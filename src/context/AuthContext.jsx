<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialUsers } from '../data/mockData';

const AuthContext = createContext(null);

export const ROLE_HIERARCHY = {
  Governor: 7,
  Senator: 7,
  MP: 5,
  MCA: 4,
  Aspirant: 3,
  Agent: 2,
  Admin: 10
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('ems_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  // Session-bound authentication: Require login on new browser sessions / dev app load
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = sessionStorage.getItem('ems_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = sessionStorage.getItem('ems_is_authenticated');
    return savedAuth !== null ? JSON.parse(savedAuth) : false;
  });

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
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      setIs2FAVerified(!foundUser.twoFactorEnabled);
      sessionStorage.setItem('ems_current_user', JSON.stringify(foundUser));
      sessionStorage.setItem('ems_is_authenticated', 'true');
      return { success: true, user: foundUser };
    }

    return { success: false, error: 'Invalid email address or password credentials.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem('ems_current_user');
    sessionStorage.setItem('ems_is_authenticated', 'false');
    localStorage.removeItem('ems_is_authenticated');
    localStorage.removeItem('ems_current_user');
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

  const toggle2FAStatus = () => {
    setIs2FAVerified(prev => !prev);
  };

  const hasPermission = (minRole) => {
    if (!currentUser) return false;
    const userRank = ROLE_HIERARCHY[currentUser.role] || 0;
    const requiredRank = ROLE_HIERARCHY[minRole] || 0;
    return userRank >= requiredRank || currentUser.role === 'Admin';
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        login,
        logout,
        switchUser,
        addUser,
        updateUserProfile,
        is2FAVerified,
        setIs2FAVerified,
        toggle2FAStatus,
        hasPermission,
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
=======
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialUsers } from '../data/mockData';

const AuthContext = createContext(null);

export const ROLE_HIERARCHY = {
  'Super Admin': 10,
  'Admin': 10,
  'Strategy Team': 8,
  'Regional Coordinator': 6,
  'Governor': 7,
  'Senator': 7,
  'MP': 5,
  'MCA': 4,
  'Aspirant': 3,
  'Field Agent': 4,
  'Agent': 4,
  'Observer': 2
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('ems_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  // Session-bound authentication: Require login on new browser sessions / dev app load
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = sessionStorage.getItem('ems_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = sessionStorage.getItem('ems_is_authenticated');
    return savedAuth !== null ? JSON.parse(savedAuth) : false;
  });

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
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      setIs2FAVerified(!foundUser.twoFactorEnabled);
      sessionStorage.setItem('ems_current_user', JSON.stringify(foundUser));
      sessionStorage.setItem('ems_is_authenticated', 'true');
      return { success: true, user: foundUser };
    }

    return { success: false, error: 'Invalid email address or password credentials.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem('ems_current_user');
    sessionStorage.setItem('ems_is_authenticated', 'false');
    localStorage.removeItem('ems_is_authenticated');
    localStorage.removeItem('ems_current_user');
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

  const toggle2FAStatus = () => {
    setIs2FAVerified(prev => !prev);
  };

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
        return true; // All authenticated users can view/participate according to their role capabilities
      case 'ai_assistant':
        return ['Super Admin', 'Admin', 'Strategy Team', 'Governor'].includes(role);
      case 'system_settings':
      case 'user_management':
        return ['Super Admin', 'Admin'].includes(role);
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
        login,
        logout,
        switchUser,
        addUser,
        updateUserProfile,
        is2FAVerified,
        setIs2FAVerified,
        toggle2FAStatus,
        hasPermission,
        hasRole,
        canAccessModule,
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
>>>>>>> ef7cb7aa1a098dbbffd93d594dd1429f163322e4
