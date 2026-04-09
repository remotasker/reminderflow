'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Sun, Moon, Eye, EyeOff, Check, ChevronRight, Building2, Globe, Lock, Mail, User } from 'lucide-react';
import { useTheme } from 'next-themes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Countries list ────────────────────────────────────────────────────────────
const COUNTRIES = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Nigeria', 'Ghana',
  'South Africa', 'Egypt', 'Morocco', 'Senegal', 'Côte d\'Ivoire', 'Cameroon',
  'Zambia', 'Zimbabwe', 'Mozambique', 'Botswana', 'Namibia', 'Malawi', 'Angola',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Spain', 'Italy',
  'Portugal', 'India', 'China', 'Japan', 'Singapore', 'UAE', 'Saudi Arabia',
  'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru',
].sort();

// ── Password strength ─────────────────────────────────────────────────────────
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router   = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 fields
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  // Step 2 fields
  const [orgName, setOrgName]   = useState('');
  const [country, setCountry]   = useState('Kenya');
  const [agreed, setAgreed]     = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Pre-fill org name from full name when navigating to step 2
  function goToStep2() {
    if (!orgName || orgName === '') setOrgName(fullName);
    setStep(2);
  }

  const emailError = emailTouched && email && !isValidEmail(email)
    ? 'Please enter a valid email address'
    : null;

  const step1Valid = fullName.trim().length >= 2 && isValidEmail(email) && password.length >= 8;
  const step2Valid = orgName.trim().length >= 2 && agreed;
  const strength   = getPasswordStrength(password);

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  async function handleSubmit() {
    if (!step2Valid) return;
    setIsLoading(true);
    setServerError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          organizationName: orgName.trim(),
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Registration failed. Please try again.');
        return;
      }
      router.replace('/login?registered=true');
    } catch {
      setServerError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 font-sans transition-colors duration-500">
      <div className="flex w-full max-w-[1000px] min-h-[620px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all">

        {/* ── Left Brand Panel ── */}
        <div className="hidden lg:flex lg:w-[45%] bg-slate-950 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-900/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-900/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center mt-10">
            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-[16px] mb-8 border border-white/10 shadow-sm">
              <Sparkles size={28} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-3 tracking-tight">ReminderFlow</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[260px]">
              The intelligent way to automate event registrations and reminders.
            </p>

            {/* Feature list */}
            <div className="mt-10 w-full space-y-3 text-left">
              {[
                'Automated email reminders',
                'Custom registration forms',
                'Real-time analytics',
                'WhatsApp notifications (Pro)',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Check size={10} className="text-indigo-400" />
                  </div>
                  <span className="text-slate-400 text-xs">{f}</span>
                </div>
              ))}
            </div>

            {/* Step indicator */}
            <div className="mt-12 flex items-center gap-3">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-indigo-500' : 'w-3 bg-slate-600'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-indigo-500' : 'w-3 bg-slate-600'}`} />
            </div>
            <p className="mt-2 text-slate-500 text-xs">Step {step} of 2</p>
          </div>

          <div className="relative z-10 flex items-center justify-between w-full">
            <p className="text-slate-600 text-[10px] font-medium uppercase tracking-widest">© 2026 ReminderFlow</p>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="flex-1 flex flex-col p-8 md:p-12 relative bg-white dark:bg-slate-900 overflow-y-auto">

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="absolute top-6 right-6 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
            aria-label="Toggle theme"
          >
            {mounted ? (theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />) : <span className="block h-4 w-4" />}
          </button>

          <div className="w-full max-w-[380px] mx-auto my-auto py-4">

            {/* Mobile step dots */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className={`h-1 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-indigo-500' : 'w-3 bg-slate-200 dark:bg-slate-700'}`} />
              <div className={`h-1 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-indigo-500' : 'w-3 bg-slate-200 dark:bg-slate-700'}`} />
              <span className="text-slate-400 text-xs ml-1">Step {step} of 2</span>
            </div>

            {/* ── STEP 1: Account Details ── */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                    Create your account
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Start automating your event reminders today.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Jane Wambua"
                        autoComplete="name"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Work email
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="jane@company.com"
                        autoComplete="email"
                        className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2
                          ${emailError
                            ? 'border-red-400 focus:ring-red-400/30 focus:border-red-500 bg-red-50 dark:bg-red-950/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-indigo-500/30 focus:border-indigo-500'}
                          text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <span>✕</span> {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Password strength: <span className={
                            strength.score <= 1 ? 'text-red-500' :
                            strength.score <= 2 ? 'text-amber-500' :
                            strength.score <= 3 ? 'text-yellow-500' : 'text-emerald-500'
                          }>{strength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => { if (step1Valid) goToStep2(); }}
                  disabled={!step1Valid}
                  className="mt-8 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
                >
                  Continue
                  <ChevronRight size={16} />
                </button>

                <div className="mt-6 text-center">
                  <p className="text-slate-500 text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-slate-900 dark:text-white font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 2: Organization ── */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 mb-4 transition-colors"
                  >
                    ← Back
                  </button>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                    About your organization
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    This helps us personalize your experience.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Organization name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Organization name
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        placeholder="Acme Events Ltd"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">This will be your workspace name. You can change it later.</p>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Country
                    </label>
                    <div className="relative">
                      <Globe size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none z-10" />
                      <button
                        type="button"
                        onClick={() => { setCountryOpen(v => !v); setCountrySearch(''); }}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                      >
                        {country}
                      </button>

                      {countryOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                            <input
                              autoFocus
                              type="text"
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              placeholder="Search countries..."
                              className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="max-h-44 overflow-y-auto">
                            {filteredCountries.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => { setCountry(c); setCountryOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors
                                  ${c === country
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                  }`}
                              >
                                {c}
                              </button>
                            ))}
                            {filteredCountries.length === 0 && (
                              <p className="px-4 py-3 text-sm text-slate-400">No results</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-4 space-y-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account summary</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Name</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{fullName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Email</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Plan</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Free — forever</span>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <div
                      onClick={() => setAgreed(v => !v)}
                      className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer
                        ${agreed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}
                    >
                      {agreed && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-5">
                      I agree to ReminderFlow's{' '}
                      <Link href="/terms" target="_blank" className="text-slate-700 dark:text-slate-300 underline hover:text-slate-900 dark:hover:text-white">
                        Terms of Service
                      </Link>{' '}and{' '}
                      <Link href="/privacy" target="_blank" className="text-slate-700 dark:text-slate-300 underline hover:text-slate-900 dark:hover:text-white">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                {serverError && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                    <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!step2Valid || isLoading}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : (
                    <>
                      <Check size={16} />
                      Create account
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
