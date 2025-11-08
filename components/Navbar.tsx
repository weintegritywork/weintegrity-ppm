

import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import Dropdown from './Dropdown';
import Modal from './Modal';
import { Role } from '../types';

const Navbar: React.FC = () => {
  const authContext = useContext(AuthContext);
  const dataContext = useContext(DataContext);
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!authContext || !dataContext) return null;

  const { currentUser, logout } = authContext;
  const { notifications, deleteNotification, markAllNotificationsAsRead } = dataContext;

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  if (!currentUser) return null;
  
  // Sort notifications by timestamp (newest first) and filter by user
  const userNotifications = notifications
    .filter(n => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notificationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    deleteNotification(notificationId);
  };

  const handleDeleteNotification = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Delete all user notifications instead of marking as read
      const userNotifications = notifications.filter(n => n.userId === currentUser.id);
      userNotifications.forEach(n => deleteNotification(n.id));
  };

  // Format timestamp to relative time (e.g., "2 minutes ago")
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  return (
    <>
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 flex-shrink-0 z-10">
        <div className="flex items-center">
          {/* Can add search bar or breadcrumbs here */}
          <h1 className="text-xl font-semibold text-gray-700">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Notification Icon */}
          <Dropdown
            buttonClassName="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            hideChevron={true}
            buttonContent={
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </>
            }
            menuClassName="w-80"
          >
            <div className="px-4 py-3 flex justify-between items-center border-b bg-gray-50">
              <h4 className="font-semibold text-sm text-gray-800">Notifications</h4>
              {userNotifications.length > 0 && 
                <button 
                  onClick={handleMarkAllRead} 
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                >
                  Clear all
                </button>
              }
            </div>
            <div className="max-h-96 overflow-y-auto">
              {userNotifications.length > 0 ? (
                userNotifications.slice(0, 10).map(n => (
                  <div
                    key={n.id}
                    className={`group relative border-l-4 transition-all duration-200 ${
                      !n.isRead ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white'
                    } hover:bg-gray-50`}
                  >
                    <Link
                      to={n.link}
                      onClick={(e) => handleNotificationClick(n.id, e)}
                      className="block px-4 py-3 pr-10 text-sm text-gray-700"
                    >
                      <p className={`${!n.isRead ? 'font-semibold text-gray-900' : 'font-normal text-gray-700'}`}>
                        {n.message}
                      </p>
                      <div className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTimeAgo(n.timestamp)}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
            {userNotifications.length > 10 && (
              <div className="px-4 py-2 border-t bg-gray-50 text-center">
                <p className="text-xs text-gray-500">
                  Showing 10 of {userNotifications.length} notifications
                </p>
              </div>
            )}
          </Dropdown>

          {/* Profile Dropdown */}
          <Dropdown
            buttonClassName="p-1 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            hideChevron
            buttonContent={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                </div>
                <span className="hidden md:inline text-sm font-medium">{currentUser.firstName} {currentUser.lastName}</span>
              </div>
            }
          >
            <Link
              to={`/profile/${currentUser.id}`}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              role="menuitem"
            >
              My Profile
            </Link>
            {currentUser.role === Role.Admin && (
              <Link
                to="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                role="menuitem"
              >
                Settings
              </Link>
            )}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              role="menuitem"
            >
              Logout
            </button>
          </Dropdown>
        </div>
      </header>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        }
      >
        <p className="text-gray-600">Are you sure you want to log out of your account?</p>
      </Modal>
    </>
  );
};

export default Navbar;