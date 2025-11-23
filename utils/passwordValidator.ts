export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

export const validatePassword = (password: string): PasswordStrength => {
  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;

  // Uppercase check
  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Add uppercase letters (A-Z)');

  // Lowercase check
  if (/[a-z]/.test(password)) score++;
  else suggestions.push('Add lowercase letters (a-z)');

  // Number check
  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Add numbers (0-9)');

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push('Add special characters (!@#$%^&*)');

  // Common patterns check
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    suggestions.push('Avoid common passwords');
  }

  // Sequential characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid repeating characters');
  }

  // Normalize score to 0-4
  score = Math.min(4, Math.max(0, Math.floor(score / 1.5)));

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

  return {
    score,
    label: labels[score],
    color: colors[score],
    suggestions: suggestions.slice(0, 3), // Show max 3 suggestions
  };
};

export const isPasswordStrong = (password: string): boolean => {
  const strength = validatePassword(password);
  return strength.score >= 3; // Require at least "Strong"
};
