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

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('ems_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('ems_is_authenticated');
    return savedAuth !== null ? JSON.parse(savedAuth) : false;
  });

  const [is2FAVerified, setIs2FAVerified] = useState(true);

  useEffect(() => {
    localStorage.setItem('ems_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ems_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ems_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('ems_is_authenticated', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  const login = (email, password) => {
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      setIs2FAVerified(!foundUser.twoFactorEnabled);
      return { success: true, user: foundUser };
    }

    return { success: false, error: 'Invalid email address or password credentials.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('ems_current_user');
    localStorage.setItem('ems_is_authenticated', 'false');
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
