import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';
import { AuthContext } from './AuthContext';
import { Role } from '../types';

export interface AccessControl {
  [key: string]: {
    // Page visibility
    canViewTeams: boolean;
    canViewEmployees: boolean;
    canAccessSettings: boolean;

    // Project permissions
    canCreateProject: boolean;
    canEditProject: boolean;
    canDeleteProject: boolean;

    // Team permissions
    canCreateTeam: boolean;
    canEditTeam: boolean;
    canDeleteTeam: boolean;

    // Story permissions
    canCreateStory: boolean;
    canEditStory: boolean;
    canDeleteStory: boolean;

    // Granular settings access
    canManageUsers: boolean;
    canManageBranding: boolean;
  }
}


export interface GlobalSettings {
  portalName: string;
  maintenanceMode: boolean;
  accessControl: AccessControl;
  footerText: string;
  theme: 'light' | 'dark';
  defaultLandingPage: string;
  sessionTimeout: number; // in minutes, 0 = disabled
  announcement: {
    message: string;
    isVisible: boolean;
  };
}

export interface UserSettings {
  [key: string]: any; 
}

interface SettingsState {
  global: GlobalSettings;
  users: {
    [userId: string]: UserSettings;
  };
}

interface SettingsContextType {
  settings: SettingsState['global'];
  userSettings: UserSettings;
  updateGlobalSetting: <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => void;
  updateUserSetting: (key: string, value: any) => void;
  updateAccessControl: (role: Role, key: keyof AccessControl[Role], value: boolean) => void;
}

const defaultGlobalSettings: GlobalSettings = {
  portalName: 'WEIntegrity',
  maintenanceMode: false,
  footerText: '© 2024 WEIntegrity. All rights reserved.',
  theme: 'light',
  accessControl: {
    [Role.Admin]: {
      canViewTeams: true, canViewEmployees: true, canAccessSettings: true,
      canCreateProject: true, canEditProject: true, canDeleteProject: true,
      canCreateTeam: true, canEditTeam: true, canDeleteTeam: true,
      canCreateStory: true, canEditStory: true, canDeleteStory: true,
      canManageUsers: true, canManageBranding: true,
    },
    [Role.HR]: {
      canViewTeams: true, canViewEmployees: true, canAccessSettings: false,
      canCreateProject: false, canEditProject: false, canDeleteProject: false,
      canCreateTeam: true, canEditTeam: true, canDeleteTeam: true,
      canCreateStory: false, canEditStory: false, canDeleteStory: false,
      canManageUsers: false, canManageBranding: true,
    },
    [Role.ProductOwner]: {
      canViewTeams: true, canViewEmployees: false, canAccessSettings: false,
      canCreateProject: true, canEditProject: true, canDeleteProject: true,
      canCreateTeam: false, canEditTeam: false, canDeleteTeam: false,
      canCreateStory: true, canEditStory: true, canDeleteStory: true,
      canManageUsers: false, canManageBranding: false,
    },
    [Role.TeamLead]: {
      canViewTeams: true, canViewEmployees: false, canAccessSettings: false,
      canCreateProject: false, canEditProject: false, canDeleteProject: false,
      canCreateTeam: false, canEditTeam: true, canDeleteTeam: true,
      canCreateStory: true, canEditStory: true, canDeleteStory: false,
      canManageUsers: false, canManageBranding: false,
    },
    [Role.Employee]: {
      canViewTeams: true, canViewEmployees: false, canAccessSettings: false,
      canCreateProject: false, canEditProject: false, canDeleteProject: false,
      canCreateTeam: false, canEditTeam: false, canDeleteTeam: false,
      canCreateStory: false, canEditStory: false, canDeleteStory: false,
      canManageUsers: false, canManageBranding: false,
    },
  },
  defaultLandingPage: '/dashboard',
  sessionTimeout: 30, // 30 minutes
  announcement: {
      message: '',
      isVisible: false,
  },
};

const defaultUserSettings: UserSettings = {
  defaultLandingPage: '/',
  notifications: { email: true, inApp: true },
  showCompletedStories: true,
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const currentUserId = authContext?.currentUser?.id;

  const [settingsState, setSettingsState] = useState<SettingsState>(() => {
    const savedSettings = getFromLocalStorage<SettingsState>('appSettingsV3');
    const global = { ...defaultGlobalSettings, ...(savedSettings?.global || {}) };
    return {
      global,
      users: savedSettings?.users || {},
    };
  });

  useEffect(() => {
    saveToLocalStorage('appSettingsV3', settingsState);
  }, [settingsState]);
  
  const currentUserSettings = (currentUserId && settingsState.users[currentUserId]) || defaultUserSettings;

  const updateGlobalSetting = useCallback(<K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
    setSettingsState(prev => ({ ...prev, global: { ...prev.global, [key]: value } }));
  }, []);
  
  const updateUserSetting = useCallback((key: string, value: any) => {
    if (!currentUserId) return;
    setSettingsState(prev => {
      const userSettings = prev.users[currentUserId] || {};
      return {
        ...prev,
        users: {
          ...prev.users,
          [currentUserId]: { ...userSettings, [key]: value }
        }
      };
    });
  }, [currentUserId]);

  const updateAccessControl = useCallback((role: Role, key: keyof AccessControl[Role], value: boolean) => {
    setSettingsState(prev => ({
        ...prev,
        global: {
            ...prev.global,
            accessControl: {
                ...prev.global.accessControl,
                [role]: {
                    ...prev.global.accessControl[role],
                    [key]: value
                }
            }
        }
    }));
  }, []);
  
  return (
    <SettingsContext.Provider value={{
      settings: settingsState.global,
      userSettings: currentUserSettings,
      updateGlobalSetting,
      updateUserSetting,
      updateAccessControl
    }}>
      {children}
    </SettingsContext.Provider>
  );
};