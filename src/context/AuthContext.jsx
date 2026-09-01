import React, { createContext, useContext, useState } from 'react';
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
  const [users, setUsers] = useState(initialUsers);
  // Default active user is Governor Sakaja for county-wide view, but can switch anytime
  const [currentUser, setCurrentUser] = useState(initialUsers[0]);
  const [is2FAVerified, setIs2FAVerified] = useState(true);

  const switchUser = (userId) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIs2FAVerified(!found.twoFactorEnabled); // require 2FA popup if enabled
    }
  };

  const toggle2FAStatus = () => {
    setIs2FAVerified(prev => !prev);
  };

  const hasPermission = (minRole) => {
    const userRank = ROLE_HIERARCHY[currentUser.role] || 0;
    const requiredRank = ROLE_HIERARCHY[minRole] || 0;
    return userRank >= requiredRank || currentUser.role === 'Admin';
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
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
