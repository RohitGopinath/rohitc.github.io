"use client";
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import IPOTable from '@/components/IPOTable';
import { FileText, Calculator, Calendar, MessageSquare, Download, Terminal, Filter } from 'lucide-react';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-full">

        {/* Main Content Area (Table) - Spans 3 columns */}
        <div className="lg:col-span-3 space-y-6">

          {/* Section Header */}
          <div className="flex items-center justify-between mb-2">
             <div>
               <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Realtime Feed</h2>
               <p className="text-sm text-slate-400 font-mono">
                  TATA_TECH <span className="text-emerald-400">+85.2%</span> • GANDHAR <span className="text-emerald-400">+44.1%</span> • FLAIR <span className="text-slate-500">UNPRICED</span>
               </p>
             </div>

             {/* Filter Toggle (Mobile) */}
             <button className="lg:hidden p-2 bg-slate-800 text-slate-300 rounded-lg">
               <Filter className="w-5 h-5" />
             </button>
          </div>

          {/* The Data Table */}
          <IPOTable />

          <div className="text-center text-xs text-slate-600 font-mono pt-8">
            END OF ACTIVE LISTINGS
          </div>
        </div>


        {/* Right Sidebar (Widgets) - Spans 1 column */}
        <div className="space-y-6">

           {/* Quick Access */}
           <div>
             <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="w-4 h-[1px] bg-emerald-500"></span>
               Quick Access
             </h3>
             <div className="grid grid-cols-2 gap-3">
               <button className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl flex flex-col items-center gap-2 transition-all group">
                 <FileText className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">IPO Docs</span>
               </button>
               <button className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl flex flex-col items-center gap-2 transition-all group">
                 <Calculator className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Calc GMP</span>
               </button>
               <button className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl flex flex-col items-center gap-2 transition-all group">
                 <Calendar className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Calendar</span>
               </button>
               <button className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl flex flex-col items-center gap-2 transition-all group">
                 <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Forum</span>
               </button>
             </div>
           </div>

           {/* Advanced Filters */}
           <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3 h-3" /> Advanced Filters
              </h3>

              {/* IPO Type */}
              <div className="space-y-3">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">IPO Type</label>
                 <div className="space-y-2">
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <div className="w-4 h-4 rounded border border-slate-600 bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-slate-900 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     </div>
                     <span className="text-sm text-slate-300 group-hover:text-white">Mainboard IPOs</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <div className="w-4 h-4 rounded border border-slate-600 bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-slate-900 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     </div>
                     <span className="text-sm text-slate-300 group-hover:text-white">SME Listings</span>
                   </label>
                 </div>
              </div>

              {/* System Status */}
              <div className="space-y-3">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">System Status</label>
                 <button className="w-full py-2 bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 text-xs font-bold rounded uppercase hover:bg-emerald-900/50 transition-colors">
                   All Statuses
                 </button>
                 <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded uppercase hover:text-white hover:border-slate-600 transition-colors">
                       Only Open
                    </button>
                    <button className="py-2 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded uppercase hover:text-white hover:border-slate-600 transition-colors">
                       Upcoming
                    </button>
                 </div>
              </div>

              {/* GMP Range Slider (Mock) */}
              <div className="space-y-3 pt-2">
                 <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>GMP RANGE (MIN %)</span>
                 </div>
                 <div className="relative h-1 bg-slate-800 rounded-full">
                    <div className="absolute left-0 w-2/3 h-full bg-slate-600 rounded-full"></div>
                    <div className="absolute left-2/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 cursor-pointer hover:scale-110 transition-transform"></div>
                 </div>
                 <div className="flex justify-between text-[10px] font-mono text-slate-600">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%+</span>
                 </div>
              </div>

           </div>

           {/* Export Data */}
           <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Export Data</h3>
              <div className="grid grid-cols-2 gap-3">
                 <button className="p-3 bg-slate-800 border border-slate-700 rounded-lg flex flex-col items-center gap-1 hover:bg-slate-700 transition-colors group">
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">CSV_DATA</span>
                 </button>
                 <button className="p-3 bg-slate-800 border border-slate-700 rounded-lg flex flex-col items-center gap-1 hover:bg-slate-700 transition-colors group">
                    <Terminal className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">TERMINAL_PRT</span>
                 </button>
              </div>
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
