'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface AuthFormProps {
  isSignup?: boolean;
  onSuccess: (token: string, user: any) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ isSignup = false, onSuccess }) => {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fix hydration mismatch for icons/themes
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup ? formData : { email: formData.email, password: formData.password };
      const response = await api.post(endpoint, payload);
      const { token, user } = response.data;
      onSuccess(token, user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all outline-none font-medium";
  const labelClasses = "text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-1 block";

  return (
    <div className="space-y-6">
      {/* Social Login Buttons Section */}
      <div className="flex gap-3">
        <button type="button" className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4 opacity-80 group-hover:opacity-100" alt="Google" />
        </button>
        <button type="button" className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
          <img src="https://www.svgrepo.com/show/448234/linkedin.svg" className="w-4 h-4 opacity-80 group-hover:opacity-100" alt="LinkedIn" />
        </button>
      </div>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
        <span className="flex-shrink mx-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">or</span>
        <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
      </div>

      {/* Form Section */}
      <form className="space-y-3" onSubmit={handleSubmit}>
        {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
        
        {isSignup && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelClasses}>Org Name</label>
              <input name="organizationName" type="text" placeholder="Acme" className={inputClasses} onChange={handleChange} required />
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Full Name</label>
              <input name="fullName" type="text" placeholder="Jane Doe" className={inputClasses} onChange={handleChange} required />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className={labelClasses}>Email Address</label>
          <input name="email" type="email" placeholder="you@example.com" className={inputClasses} onChange={handleChange} required />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <label className={labelClasses}>Password</label>
            {!isSignup && (
              <button type="button" className="text-[10px] font-bold text-blue-500 hover:text-blue-600">
                Forgot?
              </button>
            )}
          </div>
          <div className="relative">
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              className={inputClasses} 
              onChange={handleChange} 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all mt-4 flex justify-center items-center"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : (isSignup ? 'Create Account' : 'Sign In')}
        </button>
      </form>
    </div>
  );
};