'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Dummy data to start with
const INITIAL_NOTIFICATIONS = [
  { id: '1', title: 'New Registration', message: 'Jane Doe registered for Q3 Briefing.', time: '2m ago' },
  { id: '2', title: 'System Update', message: 'ReminderFlow background worker updated.', time: '1h ago' },
];

export default function TopNav() {
  // --- 1. DARK MODE LOGIC ---
  const [isDarkMode, setIsDarkMode] = useState(false);

  // On mount, check if they previously selected dark mode or if their OS prefers it
  useEffect(() => {
    const isDark = 
      localStorage.theme === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      toast.success('Switched to Dark Mode', { icon: '🌙' });
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      toast.success('Switched to Light Mode', { icon: '☀️' });
    }
  };


  // --- 2. NOTIFICATION LOGIC ---
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const addTestNotification = () => {
    const newNotif = {
      id: Date.now().toString(),
      title: 'Test Alert',
      message: 'This is a manually added notification.',
      time: 'Just now'
    };
    setNotifications([newNotif, ...notifications]);
    toast.success('New notification added!');
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the dropdown from closing when clicking the trash can
    setNotifications(notifications.filter(n => n.id !== id));
    toast.error('Notification deleted', { icon: '🗑️' });
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
    setIsNotifOpen(false);
  };

  return (
    <nav className="w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-colors duration-300">
      
      {/* Left side: Brand / Search */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          ReminderFlow
        </span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Test Button: Just so you can see the "Add" toast working */}
        <button 
          onClick={addTestNotification}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus size={14} /> Trigger Alert
        </button>

        {/* 1. Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* 2. Notification Bell Wrapper */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative"
          >
            <Bell size={20} />
            {/* Red Notification Dot */}
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>

          {/* Notification Dropdown Menu */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-[10px] font-bold text-slate-500 hover:text-red-500 uppercase tracking-wider">
                    Clear All
                  </button>
                )}
              </div>

              {/* Dropdown List */}
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 font-medium">
                    You're all caught up!
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="group p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 relative">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">{notif.time}</p>
                      </div>
                      
                      {/* Delete Button (Appears on hover) */}
                      <button 
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all absolute right-4 top-4"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
      </div>
    </nav>
  );
}