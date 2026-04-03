'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import type { AuthUser } from '@/lib/auth';
import toast from 'react-hot-toast';

interface AuthFormProps {
  isSignup?: boolean;
  onLoginSuccess: (user: AuthUser) => void;
}

export function AuthForm({ isSignup = false, onLoginSuccess }: AuthFormProps) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
      const payload = isSignup 
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const { data } = await api.post(endpoint, payload);
      
      toast.success(isSignup ? 'Account created successfully!' : 'Welcome back!');
      onLoginSuccess(data.user);
      
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        (error.request
          ? 'Unable to reach the server. Make sure the backend is running on http://localhost:3001.'
          : 'Authentication failed. Please try again.');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast(`Redirecting to ${provider}...`, { icon: '' });
    setTimeout(() => {
      toast.error(`${provider} login is not yet configured.`);
    }, 1500);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignup && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative group">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Doe"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-[16px] text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
          <div className="relative group">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-[16px] text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
            {!isSignup && (
              <a href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</a>
            )}
          </div>
          <div className="relative group">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                required
                minLength={10}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="••••••••"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-[16px] text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 mt-4 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-full hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 shadow-sm"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> {isSignup ? 'Creating account...' : 'Signing in...'}</>
          ) : (
            <>
              {isSignup ? 'Create Account' : 'Sign In'}
              <ArrowRight size={16} className="-mt-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-slate-200/60 dark:bg-slate-800"></div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
        <div className="flex-1 h-px bg-slate-200/60 dark:bg-slate-800"></div>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3">
        {/* Google Button */}
        <button 
          onClick={() => handleSocialLogin('Google')}
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-full transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        {/* Apple Button - Optically Sized to match Google */}
        <button 
          onClick={() => handleSocialLogin('Apple')}
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#000000] dark:bg-white text-white dark:text-black border border-transparent hover:opacity-90 text-sm font-semibold rounded-full transition-opacity shadow-sm"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" className="-mt-0.5">
            <path d="M17.038 12.306c.018 2.022 1.764 2.688 1.794 2.706-.018.066-.276.96-.912 1.902-.558.822-1.134 1.638-2.034 1.65-.894.018-1.176-.534-2.196-.534-.996 0-1.326.516-2.172.552-.828.03-1.488-.864-2.052-1.68-.906-1.314-1.542-3.702-.63-5.322.456-.81 1.284-1.32 2.19-1.332 1.002-.018 1.704.69 2.184.69.474 0 1.29-.822 2.4-.702 1.014.114 1.578.618 1.83.984-1.014.612-1.206 1.872-1.194 3.012h.006zM15.014 6.84c.48-.588.798-1.404.708-2.226-.702.03-1.554.468-2.052 1.062-.444.516-.834 1.344-.732 2.148.78.06 1.59-.396 2.076-.984z" fill="currentColor"/>
          </svg>
          Apple
        </button>
      </div>

    </div>
  );
}
