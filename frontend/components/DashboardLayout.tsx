"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  LineChart,
  Newspaper,
  CalendarDays,
  Search,
  Settings,
  Grid,
  X,
  Menu,
  Zap,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useTheme } from 'next-themes';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Analysis', icon: LineChart, href: '/analysis' },
    { name: 'News', icon: Newspaper, href: '/news' },
    { name: 'Calendar', icon: CalendarDays, href: '/calendar' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">

      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-20 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 transition-transform duration-300 md:translate-x-0 md:static md:w-20",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Icon */}
        <div className="mb-8 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-6 w-full items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "p-3 rounded-xl transition-all relative group",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg shadow-emerald-500/5 dark:shadow-emerald-500/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                )}
                title={item.name}
              >
                <item.icon className="w-6 h-6" />
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full -ml-3" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions (Theme Toggle) */}
        <div className="mt-auto flex flex-col gap-4 items-center mb-4">
           {mounted && (
             <button
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               className="p-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all"
             >
               {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
             </button>
           )}
           <button className="p-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all">
             <HelpCircle className="w-6 h-6" />
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">

        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-300">

          {/* Left: Mobile Menu & Title */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>

            <div className="flex items-baseline gap-2">
               <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">
                 IPO Tracker Pro
               </h1>
               <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">V2.1</span>
            </div>

            {/* Market Ticker (Simplified) */}
            <div className="hidden lg:flex items-center gap-6 ml-8 text-xs font-mono border-l border-slate-200 dark:border-slate-800 pl-6 h-8">
               <div className="flex items-center gap-2">
                 <span className="text-slate-500 dark:text-slate-400">NIFTY 50</span>
                 <span className="text-emerald-600 dark:text-emerald-400">19,824.15 +0.42%</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-slate-500 dark:text-slate-400">VIX</span>
                 <span className="text-rose-600 dark:text-rose-400">12.42 +2.1%</span>
               </div>
            </div>
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center relative">
               <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3" />
               <input
                 type="text"
                 placeholder="Search ticker..."
                 className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 w-64 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
               />
               <div className="absolute right-2 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-mono">⌘K</div>
            </div>

            <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
              <Grid className="w-5 h-5" />
            </button>

            {/* User Avatar Placeholder */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 shadow-lg shadow-indigo-500/20"></div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative transition-colors duration-300">
           {children}
        </main>

        {/* Footer Status Bar */}
        <footer className="h-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center px-4 justify-between text-[10px] font-mono text-slate-500 dark:text-slate-500 transition-colors duration-300">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-emerald-600 dark:text-emerald-500">LIVE_SYNC_ACTIVE</span>
             </div>
             <span>LATENCY: <span className="text-slate-700 dark:text-white">12MS</span></span>
             <span>CPU: <span className="text-slate-700 dark:text-white">4%</span></span>
           </div>
           <div>
             SNAPSHOT: {new Date().toISOString().replace('T', ' ').split('.')[0]}
           </div>
        </footer>

      </div>
    </div>
  );
}
