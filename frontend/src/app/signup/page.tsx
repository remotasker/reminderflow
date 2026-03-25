'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Sun, Moon, BellRing, CircleCheck } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SignupPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [signedUp, setSignedUp] = useState(false);

  // If already logged in, skip to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.push('/dashboard');
  }, [router]);

  // When signedUp flips true, start the redirect timer.
  // Cleanup cancels it if the component unmounts early.
  useEffect(() => {
    if (!signedUp) return;
    const timer = setTimeout(() => router.push('/login'), 2500);
    return () => clearTimeout(timer);
  }, [signedUp, router]);

  const handleSuccess = () => {
    setSignedUp(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-500">

      <div className="flex w-full max-w-[950px] min-h-[650px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white dark:border-slate-800 bg-white dark:bg-slate-900 transition-all">

        {/* Left Side: Brand Panel */}
        <div className="hidden lg:flex lg:w-[42%] bg-blue-600 p-12 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center mt-12">
            <div className="bg-white/20 backdrop-blur-lg p-5 rounded-3xl mb-6 border border-white/30">
              <BellRing size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">ReminderFlow</h1>
            <p className="text-blue-100 text-xs font-medium leading-relaxed max-w-[220px]">
              The smarter way to automate your event notifications.
            </p>
          </div>
          <p className="relative z-10 text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-60">© 2026</p>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="flex-1 flex flex-col p-8 md:p-14 relative bg-white dark:bg-slate-900">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="absolute top-6 right-6 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="w-full max-w-[360px] mx-auto my-auto">

            {signedUp ? (
              <div className="flex flex-col items-center text-center gap-4 py-10 animate-in fade-in duration-500">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-full">
                  <CircleCheck size={36} className="text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Account created!</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                    Redirecting you to sign in…
                  </p>
                </div>
                <div className="w-40 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-blue-600 rounded-full animate-[grow_2.5s_linear_forwards]" />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex gap-1 mb-4">
                    <div className="h-1 w-6 bg-blue-600 rounded-full" />
                    <div className="h-1 w-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create Account</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Start your 14-day free trial today.</p>
                </div>

                <AuthForm isSignup={true} onSignupSuccess={handleSuccess} />

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-slate-500 text-xs font-bold">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 hover:text-blue-500">Sign in</Link>
                  </p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}