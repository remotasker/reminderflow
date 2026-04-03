'use client';

import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionWarningModalProps {
  isOpen: boolean;
  timeLeft: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export function SessionWarningModal({ isOpen, timeLeft, onRefresh, onLogout }: SessionWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg max-w-sm w-full mx-4 animate-in scale-in-95 fade-in">
        
        {/* Header */}
        <div className="flex items-start gap-3 p-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Session Expiring</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your session will expire soon</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <Clock size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Time Remaining</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">{timeLeft}</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            For security reasons, your session will automatically end due to inactivity. You'll need to log in again to continue accessing your account.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            Logout
          </button>
          <button
            onClick={onRefresh}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg transition-all"
          >
            Continue Session
          </button>
        </div>
      </div>
    </div>
  );
}
