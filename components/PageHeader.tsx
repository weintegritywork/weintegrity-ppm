import React from 'react';
import BackButton from './BackButton';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showBackButton = true, actions }) => {
  return (
    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4">
        {showBackButton && <BackButton />}
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
