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
  Settings,
  HelpCircle,
  User,
  Building2,
  Bell,
  Code2,
  Mail,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const SETTINGS_CHILDREN = [
  { label: 'Organization',    href: '/settings',               icon: Building2     },
  { label: 'Notifications',   href: '/settings/notifications', icon: Bell          },
  { label: 'Integrations',    href: '/settings/integrations',  icon: Code2         },
  { label: 'Email templates', href: '/settings/templates',     icon: Mail          },
  { label: 'Danger zone',     href: '/settings/danger',        icon: AlertTriangle },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [user, setUser]                 = useState<{ name: string; email: string } | null>(null);

  // Auto-expand settings dropdown when already on a settings route
  useEffect(() => {
    if (pathname.startsWith('/settings')) setSettingsOpen(true);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard',   href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events',      href: '/events',    icon: Calendar, exact: true },
    { label: 'Analytics',   href: '/analytics', icon: BarChart3 },
    { label: 'Help Center', href: '/help',      icon: HelpCircle },
  ];

  const isSettingsActive = pathname.startsWith('/settings');

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

        {/* User Profile */}
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
                  Free Trial
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {/* Regular nav items */}
          {navItems.map((item) => {
            const isActive = 'exact' in item && item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
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

          {/* Settings dropdown */}
          <div>
            <button
              onClick={() => sidebarOpen && setSettingsOpen(o => !o)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                isSettingsActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings
                size={20}
                strokeWidth={isSettingsActive ? 2.5 : 2}
                className={isSettingsActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}
              />
              {sidebarOpen && (
                <>
                  <span className={`flex-1 text-sm tracking-tight text-left ${isSettingsActive ? 'font-black' : 'font-bold'}`}>
                    Settings
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''} ${isSettingsActive ? 'text-white' : 'text-slate-400'}`}
                  />
                </>
              )}
            </button>

            {/* Dropdown children — only shown when sidebar is open */}
            {sidebarOpen && settingsOpen && (
              <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-0.5">
                {SETTINGS_CHILDREN.map((child) => {
                  const isChildActive = pathname === child.href;
                  const isDanger = child.href === '/settings/danger';
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
                        isChildActive
                          ? isDanger
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : isDanger
                            ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500'
                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <child.icon size={14} strokeWidth={isChildActive ? 2.5 : 2} />
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {theme === 'dark'
              ? <Sun size={18} className="text-amber-500" />
              : <Moon size={18} className="text-blue-600" />}
            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

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

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};