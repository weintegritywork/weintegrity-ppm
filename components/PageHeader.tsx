import React, { useState, useEffect } from 'react';
import BackButton from './BackButton';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
  showDateTime?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showBackButton = true, actions, showDateTime = false }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    if (!showDateTime) return;

    // Update every minute
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [showDateTime]);

  const formatDateTime = (date: Date) => {
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    return { time: timeStr, date: dateStr };
  };

  const { time, date } = formatDateTime(currentDateTime);

  return (
    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4">
        {showBackButton && <BackButton />}
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {showDateTime && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
            <span className="text-xl">🕐</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-800">{time}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">{date}</span>
            </div>
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
