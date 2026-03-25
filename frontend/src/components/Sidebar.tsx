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
  Moon
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Attendees', href: '/dashboard/attendees', icon: Users },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Help Center', href: '/dashboard/help', icon: HelpCircle },
  ];

  return (
    <aside className="w-72 h-screen border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0b0f1a] flex flex-col sticky top-0">
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Calendar size={20} />
          </div>
          <span className="text-xl font-bold dark:text-white">ReminderFlow</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-50 dark:border-slate-800 space-y-2">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 font-bold text-sm hover:text-blue-600 transition-colors">
          <Moon size={20} /> Dark Mode
        </button>
        <button className="flex items-center gap-3 w-full px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </aside>
  );
}