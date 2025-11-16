

import React, { useState } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  children?: React.ReactNode;
  as?: 'input' | 'textarea' | 'select';
  className?: string;
  // FIX: Add disabled prop to allow disabling the form field.
  disabled?: boolean;
  min?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  error,
  children,
  as = 'input',
  className = '',
  disabled = false,
  min,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === 'password';

  const commonProps = {
    id,
    name: id,
    value,
    onChange,
    required,
    disabled,
    min,
    className: `mt-1 block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm shadow-sm placeholder-gray-400 text-gray-900
      focus:outline-none focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none
      ${className}`
  };

  const renderField = () => {
    switch (as) {
      case 'textarea':
        return <textarea {...commonProps} rows={4} />;
      case 'select':
        return <select {...commonProps}>{children}</select>;
      default:
        if (isPasswordField) {
          return (
            <div className="relative">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                {...commonProps}
                className={`${commonProps.className} pr-10`}
              />
              {String(value).length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                >
                  {isPasswordVisible ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 6.957 14.548 4 10 4a9.95 9.95 0 00-4.242 1.03l-2.05-2.05zM10 12a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" />
                      <path d="M2 10s3.923-6 8-6 8 6 8 6-3.923 6-8 6-8-6-8-6zm7.939-1a1.998 1.998 0 00-1.414-1.414l-1.414 1.414a2 2 0 001.414 1.414l1.414-1.414z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.73 6.957 5.452 4 10 4s8.27 2.957 9.542 6c-1.272 3.043-5.094 6-9.542 6S1.73 13.043.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          );
        }
        return <input type={type} {...commonProps} />;
    }
  };
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {renderField()}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FormField;