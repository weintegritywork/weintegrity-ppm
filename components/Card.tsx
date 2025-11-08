
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // FIX: Changed type from string to React.ReactNode to allow JSX in title.
  title?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md p-4 sm:p-6 transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1 ${className}`}
    >
      {title && <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;