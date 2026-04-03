'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle,
  LogOut,
  Moon,
  MessageSquare
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Attendees', href: '/dashboard/attendees', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Email Templates', href: '/settings/templates', icon: Settings },
    { name: 'Help Center', href: '/dashboard/help', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 h-screen border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex flex-col sticky top-0 z-30 transition-colors duration-500">
      
      {/* --- Brand Header --- */}
      <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-brand p-1.5 rounded-lg shadow-sm transition-colors">
            <Calendar size={18} className="text-brand-foreground" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">ReminderFlow</span>
        </div>
      </div>

      {/* --- Nav Links --- */}
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all group ${
                isActive
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/50'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors'} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* --- Bottom Actions --- */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
        <button className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all group">
          <Moon size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-shrink-0" /> 
          <span className="text-sm font-medium">Dark Mode</span>
        </button>
        
        <Link href="/settings/profile" className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all group">
          <Settings size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex-shrink-0" /> 
          <span className="text-sm font-medium">Settings</span>
        </Link>
        
        <button className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all group">
          <LogOut size={18} className="text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors flex-shrink-0" /> 
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}