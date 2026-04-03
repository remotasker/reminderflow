'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 sm:h-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 md:px-8 flex items-center justify-between transition-colors duration-500">
      
      {/* --- Left Side: Search Bar --- */}
      <div className="relative w-full max-w-xs sm:max-w-md group hidden sm:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors" size={16} />
        <input 
          type="text" 
          placeholder="Search events or attendees..." 
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-brand-ring transition-all placeholder:text-slate-400"
        />
      </div>

      {/* --- Right Side: Actions & Profile --- */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all relative">
          <Bell size={18} />
          {/* Using the new bg-brand and border-background variables */}
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-brand rounded-full border border-background shadow-sm transition-colors"></span>
        </button>
        
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
        
        <button className="flex items-center gap-3 pl-2.5 pr-1.5 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/50">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">User Name</span>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
            <User size={16} />
          </div>
        </button>

      </div>
    </header>
  );
}