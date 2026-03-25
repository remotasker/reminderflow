'use client';
import React from 'react';
import { Bell, Search, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-20 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-[#0b0f1a]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
      {/* Left Side: Search Bar */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search events or attendees..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm"
        />
      </div>

      {/* Right Side: Icons */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0b0f1a]"></span>
        </button>
        
        <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-2" />
        
        <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">User Name</span>
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <User size={18} />
          </div>
        </button>
      </div>
    </header>
  );
}