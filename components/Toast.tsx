import React, { useContext, useState, useEffect, useCallback } from 'react';
import { ToastContext } from '../context/ToastContext';

const Toast: React.FC<{ message: string, type: 'success' | 'error' | 'info', onClose: () => void }> = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 350); // Animation duration
  }, [onClose]);

  useEffect(() => {
    setIsMounted(true); // Trigger fade-in
    const timer = setTimeout(handleClose, 3000); // Auto-close after 3 seconds
    return () => {
      clearTimeout(timer);
    };
  }, [handleClose]);

  const baseClasses = 'w-full max-w-sm p-4 rounded-lg shadow-lg flex items-center text-white transform transition-all duration-[350ms] ease-in-out';
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const animationClass = isMounted && !isExiting ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full';

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${animationClass} cursor-pointer`} onClick={handleClose}>
      <div className="flex-1 font-medium">{message}</div>
      <button onClick={handleClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);

  if (!context) return null;
  const { toasts, removeToast } = context;

  return (
    <div className="fixed top-5 right-5 z-50 space-y-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;