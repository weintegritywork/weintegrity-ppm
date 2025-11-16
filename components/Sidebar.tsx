import React, { useContext, useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { Role } from '../types';
import Tooltip from './Tooltip';

const Sidebar: React.FC = () => {
  const authContext = useContext(AuthContext);
  const settingsContext = useContext(SettingsContext);
  const { currentUser } = authContext!;
  const { settings } = settingsContext!;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);
  const location = useLocation();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 my-1 rounded-lg transition-colors w-full ${
      isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-blue-800 hover:text-white'
    }`;
  
  const navTextClasses = isCollapsed ? 'hidden' : 'ml-3';

  const mainLinks = [
    { to: '/dashboard', text: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { to: '/projects', text: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  ];
  
  const storiesLinkItem = { text: 'Stories', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' };

  const roleBasedLinks = {
    [Role.Admin]: [
      { to: '/teams', text: 'Teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { to: '/employees', text: 'Employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-12 0v2z' },
    ],
    [Role.HR]: [
      { to: '/teams', text: 'Teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { to: '/employees', text: 'Employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-12 0v2z' },
    ],
    [Role.TeamLead]: [
       { to: '/teams', text: 'My Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    ],
    [Role.Employee]: [],
    [Role.ProductOwner]: []
  };
  
  const settingsLink = { to: '/settings', text: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' };

  const userPermissions = settings.accessControl[currentUser.role];

  const linksToRender = [...mainLinks, ...(roleBasedLinks[currentUser.role] || [])].filter(link => {
      if (!userPermissions) return true; // Should not happen but as a fallback
      if (link.to.startsWith('/teams')) return userPermissions.canViewTeams;
      if (link.to.startsWith('/employees')) return userPermissions.canViewEmployees;
      return true;
  });

  const storiesActive = location.pathname.startsWith('/stories');
  const storiesButtonClasses = `flex items-center p-3 my-1 rounded-lg transition-colors w-full text-left ${
    storiesActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-blue-800 hover:text-white'
  }`;
  const subLinkClasses = `flex items-center w-full p-3 my-1 rounded-lg transition-colors text-sm ${
      isCollapsed ? 'justify-center' : 'pl-10'
  } text-gray-400 hover:bg-blue-800 hover:text-white`;

  return (
    <div className={`bg-blue-900 text-white flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 h-16 border-b border-blue-800">
        {!isCollapsed && <span className="text-xl font-bold">{settings.portalName}</span>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-md hover:bg-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 flex flex-col justify-between">
        <div>
          {linksToRender.map((link) => (
            <Tooltip key={link.to} content={link.text} position="right" delay={300} disabled={!isCollapsed}>
              <NavLink to={link.to} className={navLinkClasses} end>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                </svg>
                <span className={navTextClasses}>{link.text}</span>
              </NavLink>
            </Tooltip>
          ))}
          {/* Stories Conditional Link/Dropdown */}
          {currentUser.role === Role.ProductOwner ? (
            <Tooltip content={storiesLinkItem.text} position="right" delay={300} disabled={!isCollapsed}>
               <NavLink to="/stories" className={navLinkClasses} end>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={storiesLinkItem.icon} />
                </svg>
                <span className={navTextClasses}>{storiesLinkItem.text}</span>
              </NavLink>
            </Tooltip>
          ) : (
            <div>
              <Tooltip content={storiesLinkItem.text} position="right" delay={300} disabled={!isCollapsed}>
                <button onClick={() => setIsStoriesOpen(!isStoriesOpen)} className={storiesButtonClasses}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={storiesLinkItem.icon} />
                  </svg>
                  <span className={navTextClasses}>{storiesLinkItem.text}</span>
                  {!isCollapsed && (
                    <svg className={`ml-auto h-5 w-5 transform transition-transform duration-200 ${isStoriesOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </Tooltip>
              {isStoriesOpen && !isCollapsed && (
                <div className="bg-blue-900/50 rounded-b-lg">
                  <Link to="/stories" state={{ storiesFilter: 'all' }} className={subLinkClasses}>All Stories</Link>
                  <Link to="/stories" state={{ storiesFilter: 'my' }} className={subLinkClasses}>My Stories</Link>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          {userPermissions.canAccessSettings && (
             <Tooltip content={settingsLink.text} position="right" delay={300} disabled={!isCollapsed}>
               <NavLink to={settingsLink.to} className={navLinkClasses}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={settingsLink.icon} />
                </svg>
                <span className={navTextClasses}>{settingsLink.text}</span>
              </NavLink>
            </Tooltip>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
