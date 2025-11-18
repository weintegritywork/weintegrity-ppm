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
            <h2 className="text-2xl font-bold text-center text-gray-800">Forgot Password</h2>
            <p className="text-sm text-center text-gray-600 mt-2">Enter your email to receive a reset code.</p>
            <form className="mt-8 space-y-6" onSubmit={handleForgotPasswordRequest}>
              <FormField label="Email Address" id="email-forgot" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <button type="submit" className="w-full btn-primary" disabled={isRequestingOtp}>
                {isRequestingOtp ? 'Sending...' : 'Send Reset Code'}
              </button>
              <button type="button" onClick={() => setView('LOGIN')} className="w-full text-center text-sm text-blue-600 hover:underline mt-4">Back to Login</button>
            </form>
          </>
        );
      case 'RESET_PASSWORD':
         return (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800">Reset Your Password</h2>
            <p className="text-sm text-center text-gray-600 mt-2">An OTP has been sent to {resetEmail || email}. Please check your email.</p>
            <form className="mt-8 space-y-6" onSubmit={handleResetPasswordSubmit}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={e => {
                      setOtp(e.target.value);
                      setIsOtpVerified(false); // Reset verification if OTP changes
                    }}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isOtpVerified}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || isOtpVerified || !otp || otp.length !== 6}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isOtpVerified
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : isVerifyingOtp || !otp || otp.length !== 6
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isOtpVerified ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isVerifyingOtp ? (
                      'Checking...'
                    ) : (
                      'Check'
                    )}
                  </button>
                </div>
                {isOtpVerified && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    OTP verified successfully
                  </p>
                )}
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isRequestingOtp}
                    className={`text-sm ${
                      resendCooldown > 0 || isRequestingOtp
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:underline'
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
              <FormField 
                label="New Password" 
                id="new-password" 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                minLength={6}
                disabled={!isOtpVerified}
              />
              <button 
                type="submit" 
                className="w-full btn-primary" 
                disabled={isResettingPassword || !isOtpVerified}
              >
                {isResettingPassword ? 'Resetting Password...' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => {
                setView('LOGIN');
                setOtp('');
                setNewPassword('');
                setIsOtpVerified(false);
              }} className="w-full text-center text-sm text-blue-600 hover:underline mt-4">Back to Login</button>
            </form>
          </>
        );
      case 'LOGIN':
      default:
        return (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800">Sign In</h2>
             <p className="mt-2 text-sm text-center text-gray-600">Welcome back! Please enter your details.</p>
            {maintenanceMode && (
                <div className="mt-4 p-3 bg-orange-100 border-l-4 border-orange-500 text-orange-700">
                    <p className="font-bold">Maintenance Mode</p>
                    <p className="text-sm">The portal is currently under maintenance. Only administrators can log in.</p>
                </div>
            )}
            <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit} autoComplete="off">
              <div>
                <label htmlFor="email-login" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email-login"
                  type="email"
                  value={emailForLogin}
                  onChange={e => setEmailForLogin(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <FormField label="Password" id="password-login" type="password" value={password} onChange={e => setPassword(e.target.value)} required/>
              
              <div className="text-center mt-4">
                <button 
                  type="button" 
                  onClick={() => setView('FORGOT_PASSWORD')}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Forgot your password?
                </button>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" className="w-full btn-primary" disabled={isLoading}>
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
       <style>{`
        .btn-primary {
            display: flex; justify-content: center; align-items: center; padding: 0.75rem 1rem; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; border-radius: 0.5rem; color: white; background-color: #3b82f6;
            transition: background-color 0.2s; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        .btn-primary:hover:not(:disabled) { background-color: #2563eb; }
        .btn-primary:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
          opacity: 0.8;
        }
      `}</style>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <h1 className="text-4xl font-bold tracking-tight text-gray-800">WEIntegrity</h1>
        </div>
        <Card>
            <div className="p-4">
              {renderContent()}
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
