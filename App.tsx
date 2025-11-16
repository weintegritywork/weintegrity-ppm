import React, { useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { SettingsContext } from './context/SettingsContext';
import { ToastContext } from './context/ToastContext';
import { DataContext } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Employees from './pages/Employees';
import Profile from './pages/Profile';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Settings from './pages/Settings';
import ChatPage from './pages/ChatPage';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import { Role } from './types';
import Card from './components/Card';
import LoadingScreen from './components/LoadingScreen';

const MaintenancePage: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-100">
    <Card className="text-center">
      <h1 className="text-3xl font-bold text-orange-500">Under Maintenance</h1>
      <p className="mt-4 text-gray-600">The portal is currently undergoing maintenance. We'll be back shortly.</p>
      <p className="mt-2 text-sm text-gray-500">Only administrators can access the system during this time.</p>
    </Card>
  </div>
);


const App: React.FC = () => {
  const authContext = useContext(AuthContext);
  const settingsContext = useContext(SettingsContext);
  const dataContext = useContext(DataContext);
  const toastContext = useContext(ToastContext);

  useEffect(() => {
    // Note: Theme toggle UI is removed per request, but underlying logic remains.
    if (settingsContext?.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settingsContext?.settings.theme]);

  // Session Timeout Logic
  useEffect(() => {
    if (!authContext?.currentUser || !settingsContext?.settings.sessionTimeout) return;
    
    let timeoutId: number;
    const { sessionTimeout } = settingsContext.settings;
    const { logout } = authContext;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logout();
        toastContext?.addToast('You have been logged out due to inactivity.', 'info');
      }, sessionTimeout * 60 * 1000); // convert minutes to ms
    };

    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    
    const setupTimers = () => {
      activityEvents.forEach(event => {
        window.addEventListener(event, resetTimer);
      });
      resetTimer(); // Start the timer initially
    };

    const cleanupTimers = () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };

    setupTimers();
    return () => cleanupTimers();

  }, [authContext, settingsContext, toastContext]);


  if (!authContext || !settingsContext || !dataContext || !dataContext.isDataReady || !authContext.isAuthReady) {
    return <LoadingScreen />;
  }

  const { currentUser } = authContext;
  const { settings } = settingsContext;
  
  const isMaintenance = settings.maintenanceMode && currentUser?.role !== Role.Admin;

  const announcement = settings.announcement;

  return (
    <ThemeProvider>
      <HashRouter>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
        {currentUser && !isMaintenance && <Sidebar />}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentUser && !isMaintenance && <Navbar />}
          <main className="flex-1 flex flex-col overflow-y-auto bg-gray-100">
            {announcement?.isVisible && !isMaintenance && (
              <div className="bg-blue-600 text-white text-center p-2 text-sm font-medium shadow-md">
                {announcement.message}
              </div>
            )}
             <div className="flex-grow p-4 md:p-6 lg:p-8">
              {isMaintenance ? <MaintenancePage /> : (
                <Routes>
                  <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={settings.defaultLandingPage} replace />} />
                  <Route path="/register" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR]}><Register /></ProtectedRoute>} />
                  <Route path="/" element={currentUser ? <Navigate to={settings.defaultLandingPage} replace /> : <Navigate to="/login" replace />} />
                  
                  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]}><Dashboard /></ProtectedRoute>} />

                  <Route path="/projects" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]} page="projects"><Projects /></ProtectedRoute>} />
                  <Route path="/projects/:projectId" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]} page="projects"><ProjectDetail /></ProtectedRoute>} />

                  <Route path="/teams" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]} page="teams"><Teams /></ProtectedRoute>} />
                  <Route path="/teams/:teamId" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]} page="teams"><TeamDetail /></ProtectedRoute>} />
                  
                  <Route path="/employees" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR]} page="employees"><Employees /></ProtectedRoute>} />
                  <Route path="/profile/:employeeId" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]}><Profile /></ProtectedRoute>} />
                  
                  <Route path="/stories" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]}><Stories /></ProtectedRoute>} />
                  <Route path="/stories/:storyId" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]}><StoryDetail /></ProtectedRoute>} />

                  <Route path="/chat" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR, Role.TeamLead, Role.Employee, Role.ProductOwner]}><ChatPage /></ProtectedRoute>} />

                  <Route path="/settings" element={<ProtectedRoute allowedRoles={[Role.Admin, Role.HR]} page="settings"><Settings /></ProtectedRoute>} />

                  <Route path="*" element={<Navigate to={settings.defaultLandingPage} replace />} />
                </Routes>
              )}
             </div>
             {!isMaintenance && (
                <footer className="text-center text-xs text-gray-500 p-4 border-t border-gray-200 bg-gray-100 flex-shrink-0">
                  {settings.footerText}
                </footer>
             )}
          </main>
        </div>
        </div>
        <ToastContainer />
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;