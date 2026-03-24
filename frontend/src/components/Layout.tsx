'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  BellRing,
  Sun,
  Moon,
  Users,      // Added
  Settings,   // Added
  HelpCircle, // Added
  User        // Added
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // --- UPDATED MENU ITEMS ---
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/events', icon: Calendar },
    { label: 'Attendees', href: '/attendees', icon: Users },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Help Center', href: '/help', icon: HelpCircle },
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all duration-300 ease-in-out flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-sm z-20`}
      >
        {/* Brand Header */}
        <div className="h-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
                <BellRing size={20} className="text-white" />
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">ReminderFlow</h1>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-all ml-auto"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* User Profile Section */}
        {sidebarOpen && (
          <div className="px-4 py-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <User size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {user?.name || 'User Name'}
                </p>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Premium Account
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}
                />
                {sidebarOpen && (
                  <span className={`text-sm tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-blue-600" />}
            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-4 px-4 py-3 w-full rounded-xl text-sm font-black transition-all ${
              sidebarOpen 
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                : 'text-red-500 justify-center'
            }`}
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};