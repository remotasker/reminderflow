'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { type AuthUser } from '@/lib/auth';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SignupPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Do NOT call storeAuthUser here — it fires all auth listeners and causes
  // every auth guard in the app to immediately redirect to /dashboard,
  // winning the race against router.replace('/login').
  // Instead just redirect to login with a flag so it can show a welcome toast.
  const handleSuccess = (_user: AuthUser) => {
    router.replace('/login?registered=true');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 font-sans transition-colors duration-500">

      {/* Main Container */}
      <div className="flex w-full max-w-[1000px] min-h-[600px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all">

        {/* Left: Brand Panel */}
        <div className="hidden lg:flex lg:w-[45%] bg-slate-950 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-slate-800/40 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-slate-800/30 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center mt-16">
            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-[16px] mb-8 border border-white/10 shadow-sm">
              <Sparkles size={28} className="text-slate-300" />
            </div>
            <h1 className="text-2xl font-medium text-white mb-3 tracking-tight">ReminderFlow</h1>
            <p className="text-slate-400 text-sm font-normal leading-relaxed max-w-[260px]">
              The intelligent way to automate event registrations and email reminders.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between w-full">
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">
              © 2026 ReminderFlow
            </p>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            </div>
          </div>
        </div>

        {/* Right: Form Panel */}
        <div className="flex-1 flex flex-col p-8 md:p-16 relative bg-white dark:bg-slate-900">

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="absolute top-6 right-6 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />
            ) : (
              <span className="block h-[16px] w-[16px]" aria-hidden="true" />
            )}
          </button>

          <div className="w-full max-w-[360px] mx-auto my-auto">
            <div className="animate-in fade-in duration-500">

              <div className="mb-10 text-left">
                <h2 className="text-2xl font-medium text-slate-900 dark:text-white mb-1.5 tracking-tight">
                  Create Account
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
                  Start automating your event reminders today.
                </p>
              </div>

              <AuthForm isSignup={true} onLoginSuccess={handleSuccess} />

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/50 text-center">
                <p className="text-slate-500 text-sm font-normal">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-slate-900 dark:text-white font-medium hover:underline transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
                <p className="mt-4 text-xs leading-6 text-slate-400 dark:text-slate-500">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
