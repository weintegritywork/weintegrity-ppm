import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { DataContext } from '../context/DataContext';
import { SettingsContext } from '../context/SettingsContext';
import { User, Role } from '../types';
import FormField from '../components/FormField';
import Card from '../components/Card';
import { api } from '../utils/api';

type View = 'LOGIN' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';

const Login: React.FC = () => {
  const [emailForLogin, setEmailForLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  const dataContext = useContext(DataContext);
  const settingsContext = useContext(SettingsContext);
  
  // State for forgot password flow
  const [view, setView] = useState<View>('LOGIN');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const maintenanceMode = settingsContext?.settings.maintenanceMode || false;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        if (authContext) {
          const result = await authContext.login(emailForLogin, password);
          
          if (result.success) {
            // Check maintenance mode after successful login
            if (maintenanceMode && authContext.currentUser?.role !== Role.Admin) {
              authContext.logout();
              const msg = 'The system is under maintenance. Only admins can log in.';
              setError(msg);
              toastContext?.addToast(msg, 'error');
              return;
            }
            
            toastContext?.addToast('Login successful!', 'success');
            navigate('/');
          } else {
            setError(result.message || 'Invalid email or password.');
            toastContext?.addToast(result.message || 'Login failed. Please check your credentials.', 'error');
          }
        }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      toastContext?.addToast('Login failed. Please try again.', 'error');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toastContext?.addToast('Please enter your email address.', 'error');
      return;
    }
    
    setIsRequestingOtp(true);
    try {
      const result = await api.forgotPassword(email);
      
      if (result.error) {
        toastContext?.addToast(result.error, 'error');
      } else {
        // Store email for reset password step
        setResetEmail(email);
        setIsOtpVerified(false); // Reset OTP verification state
        setOtp(''); // Clear any previous OTP
        
        // Start cooldown timer
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toastContext?.addToast(result.data?.message || 'If an account exists with this email, a reset code has been sent. Please check your email.', 'success');
        setView('RESET_PASSWORD');
      }
    } catch (error) {
      toastContext?.addToast('Failed to request password reset. Please try again.', 'error');
    } finally {
      setIsRequestingOtp(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsRequestingOtp(true);
    try {
      const result = await api.forgotPassword(resetEmail);
      
      if (result.error) {
        toastContext?.addToast(result.error, 'error');
      } else {
        setIsOtpVerified(false);
        setOtp('');
        
        // Start cooldown timer
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toastContext?.addToast('A new OTP has been sent to your email.', 'success');
      }
    } catch (error) {
      toastContext?.addToast('Failed to resend OTP. Please try again.', 'error');
    } finally {
      setIsRequestingOtp(false);
    }
  };
  
  const handleVerifyOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toastContext?.addToast('Please enter the OTP code.', 'error');
      return;
    }
    
    if (!resetEmail) {
      toastContext?.addToast('Email not found. Please start over.', 'error');
      setView('LOGIN');
      return;
    }
    
    setIsVerifyingOtp(true);
    try {
      const result = await api.verifyOtp(resetEmail, otp);
      
      if (result.error) {
        toastContext?.addToast(result.error, 'error');
      } else {
        setIsOtpVerified(true);
        toastContext?.addToast('OTP verified successfully. You can now set your new password.', 'success');
      }
    } catch (error) {
      toastContext?.addToast('Failed to verify OTP. Please try again.', 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOtpVerified) {
      toastContext?.addToast('Please verify the OTP first.', 'error');
      return;
    }
    
    if (!otp || !newPassword) {
      toastContext?.addToast('Please enter OTP and new password.', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      toastContext?.addToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    
    if (!resetEmail) {
      toastContext?.addToast('Email not found. Please start over.', 'error');
      setView('LOGIN');
      return;
    }
    
    setIsResettingPassword(true);
    try {
      const result = await api.resetPassword(resetEmail, otp, newPassword);
      
      if (result.error) {
        toastContext?.addToast(result.error, 'error');
      } else {
        toastContext?.addToast('Password has been reset successfully. Please log in.', 'success');
        // Reset state and go back to login view
        setView('LOGIN');
        setEmail('');
        setOtp('');
        setNewPassword('');
        setResetEmail('');
        setIsOtpVerified(false);
        setError('');
      }
    } catch (error) {
      toastContext?.addToast('Failed to reset password. Please try again.', 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const renderContent = () => {
    switch(view) {
      case 'FORGOT_PASSWORD':
        return (
          <>
            <h2 className="title-gradient text-3xl font-bold text-center text-gray-900 mb-2">Forgot Password</h2>
            <p className="text-sm text-center text-gray-600 mb-6">Enter your email to receive a reset code.</p>
            <form className="space-y-5" onSubmit={handleForgotPasswordRequest}>
              <div className="group/input">
                <label htmlFor="email-forgot" className="block text-sm font-medium text-gray-600 mb-2 transition-colors duration-300 group-hover/input:text-indigo-600">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover/input:text-gray-500 group-focus-within/input:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email-forgot"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="input-field w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-200 transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <button type="submit" className="w-full btn-primary mt-6" disabled={isRequestingOtp}>
                {isRequestingOtp ? 'Sending...' : 'Send Reset Code'}
              </button>
              <button type="button" onClick={() => setView('LOGIN')} className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-4 transition-colors">
                ← Back to Login
              </button>
            </form>
          </>
        );
      case 'RESET_PASSWORD':
         return (
          <>
            <h2 className="title-gradient text-3xl font-bold text-center text-gray-900 mb-2">Reset Your Password</h2>
            <p className="text-sm text-center text-gray-600 mb-6">An OTP has been sent to <span className="font-semibold text-gray-900">{resetEmail || email}</span>. Please check your email.</p>
            <form className="space-y-5" onSubmit={handleResetPasswordSubmit}>
              <div className="group/input">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-600 mb-2 transition-colors duration-300 group-hover/input:text-indigo-600">
                  OTP Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value);
                      setIsOtpVerified(false);
                    }}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    className="input-field flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 text-center text-lg tracking-widest font-mono bg-white border border-gray-200 transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.1)] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isOtpVerified}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || isOtpVerified || !otp || otp.length !== 6}
                    className={`px-5 py-3 rounded-lg font-semibold transition-all ${
                      isOtpVerified
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : isVerifyingOtp || !otp || otp.length !== 6
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isOtpVerified ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isVerifyingOtp ? (
                      'Checking...'
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                {isOtpVerified && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    OTP verified successfully
                  </p>
                )}
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isRequestingOtp}
                    className={`text-xs font-medium ${
                      resendCooldown > 0 || isRequestingOtp
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-indigo-600 hover:text-indigo-700 transition-colors'
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : isRequestingOtp
                      ? 'Sending...'
                      : 'Resend OTP'}
                  </button>
                </div>
              </div>
              
              <div className="group/input">
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-600 mb-2 transition-colors duration-300 group-hover/input:text-indigo-600">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover/input:text-gray-500 group-focus-within/input:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={!isOtpVerified}
                    className="input-field w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-200 transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.1)] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              
              <button 
                type="submit" 
                className="w-full btn-primary mt-6" 
                disabled={isResettingPassword || !isOtpVerified}
              >
                {isResettingPassword ? 'Resetting Password...' : 'Reset Password'}
              </button>
              
              <button type="button" onClick={() => {
                setView('LOGIN');
                setOtp('');
                setNewPassword('');
                setIsOtpVerified(false);
              }} className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-4 transition-colors">
                ← Back to Login
              </button>
            </form>
          </>
        );
      case 'LOGIN':
      default:
        return (
          <>
            <h2 className="title-gradient text-3xl font-bold text-center text-gray-900 mb-2">Sign In</h2>
            <p className="text-sm text-center text-gray-600 mb-6">Welcome back! Please enter your details.</p>
            {maintenanceMode && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800">
                    <p className="font-bold text-sm">⚠️ Maintenance Mode</p>
                    <p className="text-xs mt-1">The portal is currently under maintenance. Only administrators can log in.</p>
                </div>
            )}
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <div className="group/input">
                <label htmlFor="email-login" className="block text-sm font-medium text-gray-600 mb-2 transition-colors duration-300 group-hover/input:text-indigo-600">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover/input:text-gray-500 group-focus-within/input:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="email-login"
                    type="email"
                    value={emailForLogin}
                    onChange={e => setEmailForLogin(e.target.value)}
                    required
                    className="input-field w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-200 transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div className="group/input">
                <label htmlFor="password-login" className="block text-sm font-medium text-gray-600 mb-2 transition-colors duration-300 group-hover/input:text-indigo-600">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover/input:text-gray-500 group-focus-within/input:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password-login"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="input-field w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-gray-200 transition-all duration-300 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="text-center pt-2">
                <p className="text-xs text-gray-600">
                  Forgot your password? <span className="font-semibold text-gray-900">Contact your administrator</span> to reset it.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm text-center">{error}</p>
                </div>
              )}
              
              <button type="submit" className="w-full btn-primary mt-6" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .btn-primary {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0.75rem 1rem;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 0.5rem;
          color: white;
          background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3), 0 2px 4px -1px rgba(99, 102, 241, 0.2);
        }
        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%);
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4), 0 4px 6px -2px rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }
        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-primary:disabled {
          background: linear-gradient(135deg, #a5b4fc 0%, #93c5fd 100%);
          cursor: not-allowed;
          opacity: 0.7;
          box-shadow: none;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 30px 0 rgba(31, 38, 135, 0.15);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 20px 40px 0 rgba(31, 38, 135, 0.2);
          transform: translateY(-4px);
        }
        .input-field:focus {
          outline: none;
        }
        .title-gradient {
          transition: all 0.4s ease;
        }
        .glass-card:hover .title-gradient {
          background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">WEIntegrity</h1>
          <p className="text-sm text-gray-600">Project Management Portal</p>
        </div>
        
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Login;
