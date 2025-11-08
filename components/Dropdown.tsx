import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  buttonContent: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  menuClassName?: string;
  buttonClassName?: string;
  hideChevron?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ buttonContent, children, className = '', menuClassName = '', buttonClassName, hideChevron = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const defaultButtonClass = "inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500";

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={toggleDropdown}
          className={buttonClassName || defaultButtonClass}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {buttonContent}
          {!hideChevron && (
            <svg className={`-mr-1 ml-2 h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      <div
        className={`transition-all duration-150 ease-out origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-[#f0f8ff] ring-1 ring-black ring-opacity-5 focus:outline-none z-10 ${menuClassName} ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
      >
        <div className="py-1" role="none">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dropdown;
