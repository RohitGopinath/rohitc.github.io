"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, ArrowUpRight, Check, X, Calendar, DollarSign, Users, Briefcase } from 'lucide-react';
import { clsx } from 'clsx';

interface SubscriptionData {
  category: string;
  times_subscribed: number;
}

interface GMPHistory {
  price: number;
  date: string;
}

interface IPODetail {
  id: number;
  name: string;
  symbol: string | null;
  type: string;
  status: string;
  price_band: string;
  lot_size: number | null;
  issue_size: string | null;
  fresh_issue: string | null;
  offer_for_sale: string | null;
  open_date: string | null;
  close_date: string | null;
  allotment_date: string | null;
  refund_date: string | null;
  listing_date: string | null;
  subscriptions: SubscriptionData[];
  gmp_history: GMPHistory[];
  current_gmp: number;
}

export default function IPODetailPage() {
  const params = useParams();
  const [ipo, setIpo] = useState<IPODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const id = params?.id;

  useEffect(() => {
    async function fetchDetail() {
      if (!id) return;
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await axios.get(`${API_URL}/ipos/${id}`);
        setIpo(res.data);
      } catch (e) {
        console.error("Error loading detail", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full text-slate-500 font-mono animate-pulse">
           LOADING_IPO_DETAILS...
        </div>
      </DashboardLayout>
    );
  }

  if (!ipo) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full text-slate-500 font-mono">
           IPO_NOT_FOUND
        </div>
      </DashboardLayout>
    );
  }

  const isPositiveGMP = ipo.current_gmp >= 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">

        {/* Breadcrumb & Back */}
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium truncate">{ipo.name}</span>
        </div>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden shadow-lg dark:shadow-none transition-colors duration-300">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

           <div className="flex flex-col lg:flex-row justify-between items-start gap-6 relative z-10">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase rounded border border-indigo-200 dark:border-indigo-500/30 tracking-wide">
                      {ipo.type} IPO
                    </span>
                    <span className={clsx(
                      "px-2 py-1 text-[10px] font-bold uppercase rounded border tracking-wide",
                      ipo.status === "Open"
                        ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                        : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600"
                    )}>
                      {ipo.status}
                    </span>
                 </div>
                 <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors">{ipo.name}</h1>
                 <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                   <span className="font-mono">{ipo.symbol || 'SYMBOL_TBA'}</span>
                 </p>
              </div>

              <div className="flex flex-col items-end gap-4">
                 <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Current GMP</p>
                    <div className={clsx(
                      "text-4xl font-mono font-bold flex items-center gap-2 transition-colors",
                      isPositiveGMP ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {isPositiveGMP && <ArrowUpRight className="w-8 h-8" />}
                      ₹{ipo.current_gmp}
                    </div>
                 </div>
                 <button
                   onClick={() => setIsApplyModalOpen(true)}
                   className="px-8 py-3 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                 >
                   Apply for IPO <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

           {/* Left Column: Timeline & Financials */}
           <div className="lg:col-span-2 space-y-8">

              {/* Timeline */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Tentative Timetable
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Open Date", value: ipo.open_date, active: true },
                      { label: "Close Date", value: ipo.close_date, active: true },
                      { label: "Allotment", value: ipo.allotment_date },
                      { label: "Refunds", value: ipo.refund_date },
                      { label: "Listing", value: ipo.listing_date, highlight: true },
                    ].map((item, i) => (
                      <div key={i} className={clsx(
                        "p-4 rounded-xl border flex flex-col gap-1 transition-colors",
                        item.highlight
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30"
                          : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50"
                      )}>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                        <span className={clsx("font-mono font-bold transition-colors", item.highlight ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-slate-200")}>
                          {item.value || 'TBA'}
                        </span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Financials */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                   <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-500" /> Financial Details
                 </h2>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <span className="text-xs text-slate-500 uppercase font-bold">Price Band</span>
                       <div className="text-slate-900 dark:text-slate-200 font-mono text-lg">{ipo.price_band || 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs text-slate-500 uppercase font-bold">Lot Size</span>
                       <div className="text-slate-900 dark:text-slate-200 font-mono text-lg">{ipo.lot_size ? `${ipo.lot_size} Shares` : 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs text-slate-500 uppercase font-bold">Total Issue Size</span>
                       <div className="text-slate-900 dark:text-slate-200 font-mono">{ipo.issue_size || 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs text-slate-500 uppercase font-bold">Fresh Issue</span>
                       <div className="text-slate-900 dark:text-slate-200 font-mono">{ipo.fresh_issue || 'N/A'}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs text-slate-500 uppercase font-bold">Offer for Sale</span>
                       <div className="text-slate-900 dark:text-slate-200 font-mono">{ipo.offer_for_sale || 'N/A'}</div>
                    </div>
                 </div>
              </div>

           </div>

           {/* Right Column: Subscription & GMP Trend */}
           <div className="space-y-8">

              {/* Subscription Status */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                   <Users className="w-5 h-5 text-purple-600 dark:text-purple-500" /> Subscription Status
                 </h2>
                 <div className="space-y-4">
                    {ipo.subscriptions && ipo.subscriptions.length > 0 ? (
                      ipo.subscriptions.map((sub, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700/30 transition-colors">
                           <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{sub.category}</span>
                           <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{sub.times_subscribed}x</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        Data not available yet
                      </div>
                    )}
                 </div>
              </div>

              {/* GMP Trend List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                   <Briefcase className="w-5 h-5 text-orange-500" /> GMP Trend
                 </h2>
                 <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                    {ipo.gmp_history && ipo.gmp_history.length > 0 ? (
                      ipo.gmp_history.slice().reverse().slice(0, 5).map((g, i) => (
                        <div key={i} className="flex justify-between items-center py-3">
                           <span className="text-xs text-slate-500 font-mono">
                             {new Date(g.date).toLocaleDateString()}
                           </span>
                           <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{g.price}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">No GMP history</div>
                    )}
                 </div>
              </div>

           </div>

        </div>
      </div>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm transition-all">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative transition-colors duration-300">
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-black dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">Apply via Broker</h3>
                 <p className="text-sm text-slate-500 mt-1">Choose your preferred broker to apply for {ipo.name}</p>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4 bg-white dark:bg-slate-900 transition-colors">
                 {[
                   { name: 'Zerodha', color: 'bg-blue-600' },
                   { name: 'Groww', color: 'bg-emerald-600' },
                   { name: 'Upstox', color: 'bg-purple-600' },
                   { name: 'AngelOne', color: 'bg-orange-600' },
                 ].map((broker) => (
                   <a
                     key={broker.name}
                     href="#"
                     className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
                     onClick={(e) => {
                       e.preventDefault();
                       alert(`Redirecting to ${broker.name}... (Mock Action)`);
                       setIsApplyModalOpen(false);
                     }}
                   >
                     <div className={`w-10 h-10 rounded-full ${broker.color} mb-3 flex items-center justify-center text-white font-bold text-xs`}>
                        {broker.name[0]}
                     </div>
                     <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors">{broker.name}</span>
                   </a>
                 ))}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800 transition-colors">
                 Secure connection via Broker API
              </div>
           </div>
        </div>
      )}

    </DashboardLayout>
  );
}
