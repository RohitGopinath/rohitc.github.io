"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowUpRight, ArrowDownRight, TrendingUp, MoreHorizontal, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface IPO {
  id: number;
  name: string;
  symbol: string | null;
  type: string;
  price_band: string;
  base_price: number;
  status: string;
  gmp: number;
  growth_percent: number;
  listing_date: string | null;
  trend: { price: number; date: string }[];
}

export default function IPOTable() {
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIPOs() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await axios.get(`${API_URL}/ipos`);
        setIpos(res.data);
      } catch (e) {
        console.error("Error loading IPOs", e);
      } finally {
        setLoading(false);
      }
    }
    fetchIPOs();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-slate-500 font-mono animate-pulse">
        LOADING_MARKET_DATA...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-black/50 transition-all duration-300">

      {/* Table Header */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between transition-colors duration-300">
         <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase">Active Listings</h2>
         <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-slate-500 font-mono">LIVE UPDATE</span>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-500 font-mono uppercase tracking-wider transition-colors duration-300">
              <th className="px-6 py-4 font-medium w-64">Symbol / Name</th>
              <th className="px-6 py-4 font-medium text-right">GMP Prem</th>
              <th className="px-6 py-4 font-medium text-right">Growth (%)</th>
              <th className="px-6 py-4 font-medium">Listing Date</th>
              <th className="px-6 py-4 font-medium text-right">Base Price</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Trend</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm transition-colors duration-300">
            {ipos.map((ipo) => (
              <tr key={ipo.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">

                {/* Symbol / Name */}
                <td className="px-6 py-4">
                  <Link href={`/ipo/${ipo.id}`} className="block">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                         {ipo.symbol ? ipo.symbol.slice(0, 2) : ipo.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {ipo.symbol || ipo.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate max-w-[140px]">
                          {ipo.type} • {ipo.name}
                        </div>
                      </div>
                    </div>
                  </Link>
                </td>

                {/* GMP Premium */}
                <td className="px-6 py-4 text-right font-mono">
                  <span className={clsx(
                    "font-bold",
                    ipo.gmp > 0 ? "text-emerald-600 dark:text-emerald-400" : ipo.gmp < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"
                  )}>
                    {ipo.gmp > 0 ? '+' : ''}₹{ipo.gmp.toFixed(2)}
                  </span>
                </td>

                {/* Growth % */}
                <td className="px-6 py-4 text-right font-mono">
                   <div className={clsx(
                     "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border",
                     ipo.growth_percent > 0
                       ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                       : ipo.growth_percent < 0
                         ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                         : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600/50"
                   )}>
                     {ipo.growth_percent > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                     {ipo.growth_percent.toFixed(2)}%
                   </div>
                </td>

                {/* Listing Date */}
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                  {ipo.listing_date || <span className="text-slate-400 dark:text-slate-600 italic">TBA</span>}
                </td>

                {/* Base Price */}
                <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300 font-mono">
                  ₹{ipo.base_price.toLocaleString()}
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4 text-center">
                  <span className={clsx(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase border tracking-wide",
                    ipo.status === "Open" ? "bg-emerald-100 dark:bg-emerald-500 text-emerald-700 dark:text-emerald-950 border-emerald-200 dark:border-emerald-400" :
                    ipo.status === "Closed" ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600" :
                    ipo.status === "Upcoming" ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                  )}>
                    {ipo.status}
                  </span>
                </td>

                {/* Trend Sparkline (Simplified) */}
                <td className="px-6 py-4 text-right">
                   <div className="flex items-end justify-end gap-0.5 h-6 w-16 opacity-50 group-hover:opacity-100 transition-opacity">
                      {ipo.trend.length > 0 ? (
                        ipo.trend.map((point, i) => (
                           <div
                             key={i}
                             className={clsx(
                               "w-1 rounded-t-sm",
                               point.price > 0 ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600"
                             )}
                             style={{ height: `${Math.min(100, Math.max(10, (point.price / (ipo.base_price || 1)) * 50))}%` }}
                           />
                        ))
                      ) : (
                        <div className="w-full h-[1px] bg-slate-300 dark:bg-slate-700"></div>
                      )}
                   </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <Link href={`/ipo/${ipo.id}`} className="p-2 text-slate-400 dark:text-slate-500 hover:text-black dark:hover:text-white transition-colors inline-block">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {ipos.length === 0 && !loading && (
           <div className="p-12 text-center text-slate-500 font-mono text-sm border-t border-slate-200 dark:border-slate-800">
             NO_ACTIVE_LISTINGS_FOUND
           </div>
        )}
      </div>
    </div>
  );
}
