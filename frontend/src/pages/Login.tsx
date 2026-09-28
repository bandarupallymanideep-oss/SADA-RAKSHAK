import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  Lock, 
  User as UserIcon, 
  Radio, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('operator@trafficguard.ai');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to /dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailOrUsername.trim()) {
      setErrorMessage('Please enter your operator email or username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your security access key / password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({
        emailOrUsername,
        password,
        rememberMe
      });
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (userType: 'chief' | 'analyst') => {
    if (userType === 'chief') {
      setEmailOrUsername('operator@trafficguard.ai');
      setPassword('admin123');
    } else {
      setEmailOrUsername('analyst.chen@trafficguard.ai');
      setPassword('analyst2026');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-screen bg-[#070a12] text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      {/* Background radial glow & grid patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_rgba(239,68,68,0.12),_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Decorative radar scan circle in background */}
      <div className="absolute w-[600px] h-[600px] rounded-full border border-red-500/10 pointer-events-none animate-spin-slow opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 shadow-2xl shadow-red-600/30 text-white mb-4 border border-red-400/30">
            <Radio className="w-7 h-7 animate-pulse text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-sans">
            SADARAKSHAK
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-mono uppercase tracking-widest">
            Real-Time Road Accident Detection & Monitoring
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top red glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Operator Sign In</h2>
              <p className="text-xs text-slate-400">Restricted surveillance console access</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
              SECURE TLS
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 flex items-start gap-2.5 text-red-400 text-xs font-mono animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                OPERATOR ID / EMAIL
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="operator@trafficguard.ai"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white placeholder-slate-600 outline-none transition-all font-mono"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-medium text-slate-300">
                  SECURITY KEY / PASSWORD
                </label>
                <span className="text-[10px] font-mono text-slate-500">Min 4 chars</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white placeholder-slate-600 outline-none transition-all font-mono"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                />
                <span>Remember session on this terminal</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold font-mono tracking-wider uppercase shadow-xl shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING OPERATOR...</span>
                </>
              ) : (
                <>
                  <span>INITIALIZE SYSTEM ACCESS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Reviewers */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] font-mono text-slate-400 mb-2">QUICK FILL DEMO CREDENTIALS</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('chief')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                Control Chief (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('analyst')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                Incident Analyst
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span>Traffic Incident Command Node #04 // v2.6.0-stable</span>
        </div>
      </div>
    </div>
  );
};
