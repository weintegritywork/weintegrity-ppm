import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: Role[];
  page?: 'projects' | 'teams' | 'employees' | 'settings';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, page }) => {
  const authContext = useContext(AuthContext);
  const settingsContext = useContext(SettingsContext);
  const location = useLocation();

  if (!authContext || !settingsContext) {
    return <div>Loading Auth...</div>;
  }
  
  const { currentUser } = authContext;
  const { settings } = settingsContext;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const accessControl = settings.accessControl[currentUser.role];
  let hasAccess = true;

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    hasAccess = false;
  }

  if (page && accessControl) {
    if (page === 'teams' && !accessControl.canViewTeams) hasAccess = false;
    if (page === 'employees' && !accessControl.canViewEmployees) hasAccess = false;
    if (page === 'settings' && !accessControl.canAccessSettings) hasAccess = false;
  }


  if (!hasAccess) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;