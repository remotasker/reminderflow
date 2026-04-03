'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import api from '@/lib/api';
import {
  clearAuthState,
  getStoredUser,
  storeAuthUser,
  subscribeAuthUser,
  type AuthUser,
} from '@/lib/auth';
import { ensureAuthUser } from '@/lib/session';
import {
  LayoutDashboard, Calendar, BarChart3, LogOut,
  ChevronLeft, ChevronRight, BellRing, Sun, Moon,
  HelpCircle, Building2, Bell, Menu,
  Code2, Mail, AlertTriangle, ChevronDown, Users,
  UserPlus, UserMinus, X, UserCircle2, MessageSquare
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Notification types
// ---------------------------------------------------------------------------
type NotifType = 'attendee_added' | 'attendee_removed';

interface Notification {
  id: string;
  type: NotifType;
  message: string;
  eventTitle?: string;
  timestamp: Date;
  read: boolean;
}

declare global {
  interface WindowEventMap {
    'rf:notify': CustomEvent<Omit<Notification, 'id' | 'timestamp' | 'read'>>;
  }
}

// ---------------------------------------------------------------------------
// Settings children (For the Profile Dropdown)
// ---------------------------------------------------------------------------
const ALL_SETTINGS_CHILDREN = [
  { label: 'Organization',    href: '/settings/organization',  icon: Building2,     adminOnly: false },
  { label: 'Notifications',   href: '/settings/notifications', icon: Bell,          adminOnly: true  },
  { label: 'Team',            href: '/settings/team',          icon: Users,         adminOnly: true  },
  { label: 'Integrations',    href: '/settings/integrations',  icon: Code2,         adminOnly: true  },
  { label: 'Email templates', href: '/settings/templates',     icon: Mail,          adminOnly: true  },
  { label: 'Danger zone',     href: '/settings/danger',        icon: AlertTriangle, adminOnly: true  },
];

function mapAuthUser(user: AuthUser | null): { name: string; email: string; role?: string } | null {
  if (!user) return null;
  return {
    name: user.fullName ?? user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? 'manager',
  };
}

// ---------------------------------------------------------------------------
// NotificationBell component
// ---------------------------------------------------------------------------
function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: CustomEvent<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      setNotifications(prev => [{
        ...e.detail,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        read: false,
      }, ...prev].slice(0, 50));
    };
    window.addEventListener('rf:notify', handler);
    return () => window.removeEventListener('rf:notify', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifications(p => p.filter(n => n.id !== id));
  const clearAll = () => setNotifications([]);

  const icon = (type: NotifType) =>
    type === 'attendee_added'
      ? <UserPlus size={14} className="text-emerald-500 flex-shrink-0" />
      : <UserMinus size={14} className="text-slate-400 flex-shrink-0" />;

  const relativeTime = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60)  return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 bg-brand text-brand-foreground text-[9px] font-medium rounded-full flex items-center justify-center border-2 border-background">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[20px] shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Notifications {unread > 0 && <span className="ml-1 text-slate-900 dark:text-white">({unread} new)</span>}
            </span>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors">
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={24} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm text-slate-500 font-normal">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`flex items-start gap-3 px-5 py-4 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors ${!n.read ? 'bg-slate-50/80 dark:bg-slate-800/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10'}`}>
                  <div className="mt-0.5 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">{icon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200 leading-snug">{n.message}</p>
                    {n.eventTitle && <p className="text-xs text-slate-500 font-normal mt-1 truncate">{n.eventTitle}</p>}
                    <p className="text-[10px] text-slate-400 font-medium mt-1.5 uppercase tracking-widest">{relativeTime(n.timestamp)}</p>
                  </div>
                  <button onClick={() => dismiss(n.id)} className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 mt-0.5 flex-shrink-0 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Layout
// ---------------------------------------------------------------------------
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  // States
  const [sidebarOpen, setSidebarOpen]         = useState(true); // Desktop collapse
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false); // Mobile slide-over
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mounted, setMounted]                 = useState(() => Boolean(getStoredUser()));
  const [user, setUser]                       = useState<{ name: string; email: string; role?: string } | null>(() => mapAuthUser(getStoredUser()));

  const isAdmin = user?.role === 'admin';
  const SETTINGS_CHILDREN = ALL_SETTINGS_CHILDREN.filter(c => !c.adminOnly || isAdmin);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close mobile menu automatically on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = subscribeAuthUser((nextUser) => {
      setUser(mapAuthUser(nextUser));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const nextUser = await ensureAuthUser();
        storeAuthUser(nextUser);
        setUser(mapAuthUser(nextUser));
      } catch {
        clearAuthState();
        router.replace('/login');
      } finally {
        setMounted(true);
      }
    };
    bootstrapSession();
  }, [router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileMenuOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignored
    } finally {
      clearAuthState();
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Dashboard',   href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events',      href: '/events',    icon: Calendar, exact: true },
    { label: 'Attendees',   href: '/attendees', icon: Users },
    { label: 'Responses',   href: '/responses', icon: MessageSquare },
    { label: 'Analytics',   href: '/analytics', icon: BarChart3 },
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans overflow-hidden">
      
      {/* --- MOBILE OVERLAY BACKDROP --- */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'} 
        md:relative md:translate-x-0 md:shadow-none
        w-64 md:${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-brand p-1.5 rounded-lg shadow-sm">
              <BellRing size={18} className="text-brand-foreground" />
            </div>
            <h1 className={`text-xl font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap ${!sidebarOpen ? 'md:hidden' : ''}`}>
              ReminderFlow
            </h1>
          </div>
          {/* Mobile Close Button */}
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = 'exact' in item && item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`relative flex items-center py-3 transition-all group ${
                  sidebarOpen ? 'px-6 gap-4' : 'px-6 md:px-0 md:justify-center gap-4 md:gap-0'
                } ${
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full" />
                )}
                <item.icon size={20} className={`shrink-0 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors'}`} />
                <span className={`text-sm font-medium tracking-tight whitespace-nowrap ${!sidebarOpen ? 'md:hidden' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <Link href="/help" className={`relative flex items-center py-3 w-full text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white transition-all group rounded-xl ${
            sidebarOpen ? 'px-4 gap-4' : 'px-4 md:px-0 md:justify-center gap-4 md:gap-0'
          }`}>
            <HelpCircle size={20} className="shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            <span className={`whitespace-nowrap ${!sidebarOpen ? 'md:hidden' : ''}`}>Help Center</span>
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT & TOP NAV --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0 z-20 transition-colors duration-500">
          
          {/* Left Side: Collapse/Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Hamburger for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          {/* Right Side: Theme, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <NotificationBell />
            
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileMenuOpen(o => !o)}
                className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/50"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-xs shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">{user?.name || 'Profile'}</p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div role="menu" className="absolute top-full right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[20px] shadow-sm overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 font-normal truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-widest border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm">
                      {isAdmin ? 'Administrator' : 'Manager'}
                    </div>
                  </div>

                  <div className="py-2">
                    <Link role="menuitem" onClick={() => setProfileMenuOpen(false)} href="/settings/profile" className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-colors group">
                      <UserCircle2 size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" /> My Profile
                    </Link>
                    {SETTINGS_CHILDREN.map((child) => (
                      <Link
                        key={child.href}
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                        href={child.href}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-colors group"
                      >
                        <child.icon size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" /> {child.label}
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/50 py-2">
                    <button role="menuitem" onClick={() => { setProfileMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                      <LogOut size={16} className="text-red-400 group-hover:text-red-500 transition-colors" /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- MAIN SCROLLABLE CONTENT --- */}
        <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
          <div className="w-full h-full animate-in fade-in duration-500 p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export function notify(detail: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rf:notify', { detail }));
  }
}