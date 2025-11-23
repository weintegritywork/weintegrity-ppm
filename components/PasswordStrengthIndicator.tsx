import React from 'react';
import { validatePassword } from '../utils/passwordValidator';

interface PasswordStrengthIndicatorProps {
  password: string;
  showSuggestions?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showSuggestions = true 
}) => {
  if (!password) return null;

  const strength = validatePassword(password);
  const widthPercentage = ((strength.score + 1) / 5) * 100;

  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${widthPercentage}%`,
            backgroundColor: strength.color,
          }}
        />
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between mt-1">
        <span
          className="text-xs font-medium"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>
        {strength.score >= 3 && (
          <span className="text-xs text-green-600">✓ Good password</span>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && strength.suggestions.length > 0 && (
        <div className="mt-2 space-y-1">
          {strength.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-1 text-xs text-gray-600">
              <span className="text-gray-400">•</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
