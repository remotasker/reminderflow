'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getStoredUser, storeAuthUser } from '@/lib/auth';
import {
  Bell, Mail, Users, Calendar, CheckCircle2,
  ArrowRight, Zap, Shield, BarChart3, Clock,
  Star, Sparkles, Send, Sun, Moon
} from 'lucide-react';

// ── Animated counter hook ──────────────────────────────────────────────────
function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ── Floating email-sent badge ──────────────────────────────────────────────
function SentBadge() {
  return (
    <div className="absolute -top-4 -left-6 z-20 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full px-3 py-1.5 shadow-sm animate-bounce-slow">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap uppercase tracking-widest">
        Email Sent
      </span>
    </div>
  );
}

// ── Email preview card ─────────────────────────────────────────────────────
function EmailPreviewCard() {
  return (
    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <SentBadge />
      {/* Sleek Header Bar */}
      <div className="h-1.5 w-full bg-brand" />
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/10">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-2">From</p>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-brand flex items-center justify-center shadow-sm">
            <Bell size={12} className="text-brand-foreground" />
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-white">ReminderFlow</span>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 tracking-tight">
          You're registered for Annual Summit 2026!
        </p>
        <p className="text-sm text-slate-500 mb-5 font-normal">Hi Alex, your spot is confirmed.</p>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[16px] p-4 space-y-2.5 mb-5 text-xs text-slate-600 dark:text-slate-300">
          <p className="flex items-center gap-2"><Calendar size={14} className="text-slate-400"/> <strong>Date:</strong> April 17, 2026</p>
          <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400"/> <strong>Time:</strong> 2:00 PM EAT</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 h-9 bg-brand rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-[11px] font-medium text-brand-foreground uppercase tracking-wider">Access Event</span>
          </div>
          <div className="flex-1 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Add to Calendar</span>
          </div>
        </div>
      </div>
      {/* Reminder chips */}
      <div className="px-6 pb-6 flex gap-2 flex-wrap">
        {['24h reminder', '1h reminder', '10min alert'].map(label => (
          <span key={label} className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Code snippet panel ─────────────────────────────────────────────────────
function CodePanel() {
  const lines = [
    { n: 1,  c: 'slate',  t: '// Create event + auto-reminders' },
    { n: 2,  c: 'blue',   t: 'await reminderflow.events.create({' },
    { n: 3,  c: 'emerald',t: '  title: "Annual Summit 2026",' },
    { n: 4,  c: 'emerald',t: '  date: "2026-04-17",' },
    { n: 5,  c: 'emerald',t: '  timezone: "Africa/Nairobi",' },
    { n: 6,  c: 'slate',  t: '  reminders: ["24h", "1h", "10m"],' },
    { n: 7,  c: 'slate',  t: '  theme: "brand_heavy",' },
    { n: 8,  c: 'blue',   t: '});' },
    { n: 9,  c: 'slate',  t: '' },
    { n: 10, c: 'slate',  t: '// Emails fire automatically ✓' },
  ];

  const colorMap: Record<string, string> = {
    slate:   'text-slate-500',
    blue:    'text-slate-300',
    emerald: 'text-slate-400',
  };

  return (
    <div className="w-full max-w-xs bg-[#0b0f1a] rounded-[24px] border border-slate-800 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/50 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/10 text-slate-300 border border-white/5">
            Node.js
          </span>
        </div>
      </div>
      <div className="p-5 font-mono text-[11px] leading-6">
        {lines.map(line => (
          <div key={line.n} className="flex gap-4">
            <span className="select-none text-slate-700 w-3 text-right flex-shrink-0">{line.n}</span>
            <span className={colorMap[line.c]}>{line.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat counter card ──────────────────────────────────────────────────────
function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const count = useCounter(value);
  return (
    <div className="text-center p-6">
      <p className="text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-xs font-medium text-slate-500 mt-2 uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ── Feature card ───────────────────────────────────────────────────────────
function FeatureCard({
  icon, title, description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-8 rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-normal">{description}</p>
    </div>
  );
}

// ── Main landing page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (getStoredUser()) {
        router.replace('/dashboard');
        return;
      }
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          storeAuthUser(data.user);
          router.replace('/dashboard');
          return;
        }
      } catch {}
      setSessionChecked(true);
    };
    bootstrap();
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!sessionChecked) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Clean, text-only logo */}
          <div className="flex items-center">
            <span className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              ReminderFlow
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Docs', 'About'].map(item => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all mr-1 md:mr-2"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-brand-foreground text-sm font-medium rounded-xl transition-all active:scale-95 shadow-sm hover:opacity-90"
            >
              Start Free Trial
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left copy */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Clean Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <Sparkles size={14} className="text-slate-400" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                  Event Automation Platform
                </span>
              </div>

              {/* Pure Text Headline - No Badges/Icons */}
              <h1 className="text-5xl lg:text-6xl font-semibold text-slate-900 dark:text-white leading-[1.15] tracking-tight">
                Automate Emails, <br className="hidden md:block" />
                Reminders & RSVPs <br className="hidden md:block" />
                Faster.
              </h1>

              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg font-normal">
                Build beautiful event registration flows and send perfectly timed reminder emails — confirmation, 24h, 1h, and 10 minutes before — all on autopilot.
              </p>

              <div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="/signup"
                    className="flex items-center gap-2 px-7 py-3.5 bg-brand text-brand-foreground font-medium rounded-xl transition-all active:scale-95 shadow-sm text-sm hover:opacity-90"
                  >
                    Start 14-Day Free Trial
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="#features"
                    className="flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-sm shadow-sm"
                  >
                    See how it works
                  </Link>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-3 ml-1">No credit card required. Cancel anytime.</p>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-6">
                <div className="flex -space-x-3">
                  {['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'].map((color, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-slate-50 dark:border-slate-950 flex items-center justify-center text-[10px] font-medium text-white shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {['AK', 'JM', 'SL', 'RO', 'TW'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-slate-400 fill-slate-400" />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Trusted by <strong className="text-slate-700 dark:text-slate-300">200+</strong> organizers
                  </p>
                </div>
              </div>
            </div>

            {/* Right: product mockup */}
            <div className="relative flex items-center justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-1000 delay-150">
              {/* Sleek monochromatic background panel */}
              <div className="absolute right-0 top-4 w-[85%] h-[90%] rounded-[32px] bg-slate-200/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800" />

              <div className="relative z-10 flex flex-col gap-6 items-end w-full pt-8">
                <div className="relative mr-8">
                  <EmailPreviewCard />
                </div>
                <div className="relative -mt-8 mr-0 self-start ml-12">
                  <CodePanel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100 dark:divide-slate-800/50">
            <StatCard value={50000}  suffix="+"  label="Emails sent" />
            <StatCard value={2500}   suffix="+"  label="Events created" />
            <StatCard value={98}     suffix="%"  label="Delivery rate" />
            <StatCard value={500}    suffix="+"  label="Organizers" />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-4">
              Everything you need
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight mb-5">
              Built for modern event organizers
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-normal">
              From registration forms to timed reminders — everything in one highly refined, secure platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Mail size={20} />}
              title="Beautiful templates"
              description="Choose from Minimal Light, Modern Dark, or Brand Heavy themes. Every email auto-injects your event details perfectly."
            />
            <FeatureCard
              icon={<Clock size={20} />}
              title="Timed sequences"
              description="Automatically send reminders at 24 hours, 1 hour, and 10 minutes before your event. Never forget a follow-up."
            />
            <FeatureCard
              icon={<Calendar size={20} />}
              title="Calendar integration"
              description="Every confirmation email includes one-click Add to Google Calendar, Outlook, and Apple Calendar buttons."
            />
            <FeatureCard
              icon={<Users size={20} />}
              title="CSV bulk import"
              description="Import up to 500 attendees at once via CSV. Confirmation emails queue automatically for every new attendee."
            />
            <FeatureCard
              icon={<BarChart3 size={20} />}
              title="Delivery analytics"
              description="Track open rates, click rates, and delivery logs in real time. Know exactly who received and read your emails."
            />
            <FeatureCard
              icon={<Shield size={20} />}
              title="Secure by default"
              description="JWT auth with refresh token rotation, httpOnly cookies, rate limiting, and org-level data isolation built in."
            />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="py-32 px-6 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-4">
              Simple workflow
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Up and running in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <Calendar size={20} />,
                title: 'Create your event',
                desc: 'Fill in the title, date, time, and meeting link. Add custom registration questions for attendees.',
              },
              {
                step: '02',
                icon: <Zap size={20} />,
                title: 'Pick a theme',
                desc: 'Choose your email theme and see a live preview of every reminder email before you publish.',
              },
              {
                step: '03',
                icon: <Send size={20} />,
                title: 'Publish & relax',
                desc: 'Hit publish. ReminderFlow handles every confirmation and reminder email automatically from here.',
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative p-8 rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="text-5xl font-semibold text-slate-200/80 dark:text-slate-800/80 absolute top-6 right-8 select-none leading-none tracking-tighter">
                  {step}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center mb-6 text-slate-900 dark:text-white shadow-sm">
                    {icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-normal">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="relative bg-slate-950 dark:bg-slate-900 rounded-[32px] p-16 md:p-20 overflow-hidden border border-slate-800 shadow-2xl">
            {/* Subtle grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-5"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                <CheckCircle2 size={14} className="text-slate-300" />
                <span className="text-[11px] font-medium text-slate-300 uppercase tracking-widest">
                  14-Day Free Trial
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">
                Ready to automate your events?
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto font-normal">
                Join hundreds of organizers who save hours every event with our intelligent reminder sequences. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-all active:scale-95 shadow-lg text-sm"
                >
                  Start 14-Day Trial
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-medium rounded-xl border border-slate-700 hover:bg-white/5 transition-all text-sm"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Clean, text-only footer logo */}
          <div className="flex items-center">
            <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">ReminderFlow</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
            {['Features', 'Pricing', 'Privacy', 'Terms', 'Contact'].map(item => (
              <Link key={item} href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                {item}
              </Link>
            ))}
          </div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">© 2026 ReminderFlow.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}