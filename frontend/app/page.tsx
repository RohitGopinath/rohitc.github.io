"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Bell, Settings, Grid3X3, Filter, Calendar, FileText, Monitor, CheckCircle, Moon, Sun, MessageSquare, ChevronUp, ChevronDown } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from "recharts";
import { useTheme } from "next-themes";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PredictorModal } from "@/components/predictor-modal";
import { AuthButton } from "@/components/auth-button";

// --- COMPONENTS ---

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-gray-400"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}

interface MarketIndex {
  name: string;
  price: number;
  percent: number;
  is_positive: boolean;
}

function MarketTicker() {
  const [data, setData] = useState<MarketIndex[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await axios.get(`${API_URL}/market-indices`);
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch market data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 text-xs py-2 overflow-hidden flex items-center h-10 w-full z-40 relative">
      <div className="whitespace-nowrap flex animate-marquee space-x-8 px-4 w-full">
         {data.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 dark:text-gray-100 uppercase">{item.name}</span>
              <span className={`flex items-center ${item.is_positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {item.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                <span className="ml-1 text-[10px] bg-gray-100 dark:bg-slate-800 px-1 rounded font-mono">
                  {item.is_positive ? "+" : ""}{item.percent}%
                </span>
              </span>
            </div>
          ))}
      </div>
      <style jsx>{`
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

function TopBar({ onSearch }: { onSearch: (val: string) => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300">
       <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
         <div className="flex items-center min-w-0">
            <Link href="/" className="text-xl font-bold tracking-tighter text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                ITP
              </div>
              <span className="hidden sm:inline">IPO Tracker Pro</span>
            </Link>
         </div>

         <div className="flex-1 max-w-2xl mx-4 lg:mx-8 hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-12 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
                placeholder="Search ticker..."
                onChange={(e) => onSearch(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                 <span className="text-[10px] text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">⌘K</span>
              </div>
            </div>
         </div>

         <div className="flex items-center space-x-1 sm:space-x-3">
           <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors hidden sm:block">
             <Settings className="h-5 w-5" />
           </button>
           <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors hidden sm:block">
             <Grid3X3 className="h-5 w-5" />
           </button>
            <button className="p-2 text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 rounded-full transition-colors relative">
             <Bell className="h-5 w-5" />
             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border border-white dark:border-slate-900"></span>
           </button>
           <ThemeToggle />
           <AuthButton />
         </div>
       </div>
       <MarketTicker />
    </div>
  );
}

interface FilterState {
  type: string;
  status: string;
  gmpRange: string;
}

interface IPO {
  id: number;
  name: string;
  symbol: string;
  gmp: number;
  growth_percent: number;
  listing_date: string;
  base_price: number;
  status: string;
  trend: { price: number; date: string }[];
  price_band: string;
  type: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

function Sidebar({ onFilterChange, ipos }: { onFilterChange: (f: FilterState) => void, ipos: IPO[] }) {
  const [activeFilters, setActiveFilters] = useState<FilterState>({ type: "All", status: "All", gmpRange: "All" });

  const updateFilter = (k: keyof FilterState, v: string) => {
      const n = { ...activeFilters, [k]: v };
      setActiveFilters(n);
      onFilterChange(n);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-gray-800 h-[calc(100vh-6.5rem)] sticky top-28 overflow-y-auto p-5 hidden lg:flex flex-col gap-6 w-80 transition-colors duration-300">

        {/* Quick Access */}
        <div>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1 h-3 bg-green-500 rounded-full"></span> QUICK ACCESS
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {[
                    { icon: FileText, label: "IPO DOCS", color: "text-blue-500" },
                ].map((item, i) => (
                    <button key={i} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group">
                        <item.icon className={`h-5 w-5 mb-2 ${item.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{item.label}</span>
                    </button>
                ))}

                {/* PREDICTOR MODAL TRIGGER */}
                <PredictorModal ipos={ipos} />

                {[
                    { icon: Calendar, label: "CALENDAR", color: "text-orange-500" },
                    { icon: MessageSquare, label: "FORUM", color: "text-pink-500" },
                ].map((item, i) => (
                    <button key={i} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group">
                        <item.icon className={`h-5 w-5 mb-2 ${item.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

        {/* Filters */}
        <div className="flex-1">
             <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Filter className="h-3 w-3" /> ADVANCED FILTERS
            </h3>

            <div className="space-y-6">
                {/* Type */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">IPO Type</label>
                    <div className="space-y-1">
                        {["All", "Mainboard", "SME"].map(type => (
                            <div key={type}
                                onClick={() => updateFilter("type", type)}
                                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${activeFilters.type === type ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"}`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${activeFilters.type === type ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-600"}`}>
                                    {activeFilters.type === type && <CheckCircle className="h-3 w-3 text-white" />}
                                </div>
                                {type === "All" ? "All Types" : `${type} IPOs`}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</label>
                     <div className="grid grid-cols-1 gap-2">
                        {["All", "Open", "Upcoming", "Closed"].map((status) => (
                             <button
                                key={status}
                                onClick={() => updateFilter("status", status)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                                    activeFilters.status === status
                                    ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                                    : "bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                                }`}
                            >
                                {status === "All" ? "ALL STATUSES" : status}
                            </button>
                        ))}
                     </div>
                </div>

                {/* GMP Range */}
                 <div className="space-y-3">
                    <div className="flex justify-between">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Min Growth %</label>
                         <span className="text-[10px] font-mono text-blue-500">{activeFilters.gmpRange === "All" ? "0%" : `${activeFilters.gmpRange}%`}+</span>
                    </div>
                    <input
                        type="range"
                        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        min="0" max="100" step="10"
                        onChange={(e) => updateFilter("gmpRange", e.target.value)}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%+</span>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
}

function IPOTable({ data, sortConfig, onSort }: { data: IPO[], sortConfig: SortConfig, onSort: (key: string) => void }) {
    if (!data || data.length === 0) {
        return <div className="p-10 text-center text-gray-500 dark:text-gray-400">No IPOs found matching your criteria.</div>
    }

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig.key !== column) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
    };

    const Header = ({ label, column, className = "" }: { label: string, column: string, className?: string }) => (
        <th
            className={`px-6 py-4 font-semibold cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${className}`}
            onClick={() => onSort(column)}
        >
            <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
                {label} <SortIcon column={column} />
            </div>
        </th>
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-950/50 border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
                            <th className="px-6 py-4 font-semibold">Symbol / Name</th>
                            <Header label="GMP Prem" column="gmp" />
                            <Header label="Growth (%)" column="growth_percent" />
                            <Header label="Listing Date" column="listing_date" className="hidden md:table-cell" />
                            <Header label="Base Price" column="base_price" className="hidden sm:table-cell" />
                            <Header label="Status" column="status" />
                            <th className="px-6 py-4 font-semibold hidden lg:table-cell text-right pr-8">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm">
                        {data.map((ipo) => (
                            <tr key={ipo.id} className="group hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700">
                                            {ipo.symbol ? ipo.symbol[0] : ipo.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-gray-100">{ipo.name}</div>
                                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">{ipo.type === "SME" ? "SME" : "MAINBOARD"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    <span className={`font-bold ${ipo.gmp > 0 ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>
                                        ₹{ipo.gmp.toLocaleString("en-IN")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                     <span className={`font-bold ${ipo.growth_percent > 0 ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>
                                        {ipo.growth_percent > 0 ? "+" : ""}{ipo.growth_percent}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell font-mono text-gray-600 dark:text-gray-400 text-xs">
                                    {ipo.listing_date || "TBA"}
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell font-mono text-gray-600 dark:text-gray-400">
                                    {ipo.base_price > 0 ? `₹${ipo.base_price}` : ipo.price_band || "--"}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                        ipo.status === "Open" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                        ipo.status === "Closed" ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700" :
                                        "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                    }`}>
                                        {ipo.status === "Open" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
                                        {ipo.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell pr-8">
                                    <div className="h-12 w-32 ml-auto">
                                        {ipo.trend && ipo.trend.length > 1 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={ipo.trend}>
                                                    <XAxis dataKey="date" hide />
                                                    <RechartsTooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', fontSize: '10px', padding: '4px' }}
                                                        itemStyle={{ color: '#fff', padding: 0 }}
                                                        cursor={{fill: 'rgba(255,255,255,0.1)'}}
                                                    />
                                                    <Bar dataKey="price" fill={ipo.growth_percent >= 0 ? "#10b981" : "#ef4444"} radius={[2, 2, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex justify-end gap-1 opacity-20 h-full items-end">
                                                <div className="w-2 h-3 bg-current rounded-sm"></div>
                                                <div className="w-2 h-5 bg-current rounded-sm"></div>
                                                <div className="w-2 h-4 bg-current rounded-sm"></div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- MAIN PAGE ---

export default function Home() {
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [filteredIpos, setFilteredIpos] = useState<IPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({ type: "All", status: "All", gmpRange: "All" });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "listing_date", direction: "desc" });

  const handleSort = (key: string) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
      }));
  };

  useEffect(() => {
    async function loadData() {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await axios.get(`${API_URL}/ipos`);
            setIpos(res.data);
            setFilteredIpos(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    loadData();
  }, []);

  useEffect(() => {
      let res = ipos;

      // Search
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          res = res.filter(i => i.name.toLowerCase().includes(q) || (i.symbol && i.symbol.toLowerCase().includes(q)));
      }

      // Filter
      if (filters.type !== "All") res = res.filter(i => i.type === filters.type || (filters.type === "Mainboard" && i.type === "Mainboard") || (filters.type === "SME" && i.type === "SME"));
      if (filters.status !== "All") res = res.filter(i => i.status.toLowerCase() === filters.status.toLowerCase());
      if (filters.gmpRange !== "All") {
          const min = parseInt(filters.gmpRange);
          if (min > 0) res = res.filter(i => i.growth_percent >= min);
      }

      // Sort
      if (sortConfig.key) {
        res.sort((a, b) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let aVal = (a as any)[sortConfig.key];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let bVal = (b as any)[sortConfig.key];

            // Handle Dates (assume string ISO or "TBA")
            if (sortConfig.key === 'listing_date') {
                if (!aVal) aVal = "0000-00-00";
                if (!bVal) bVal = "0000-00-00";
                // If it is 'TBA' put it at the end for desc, start for asc?
                if (aVal === 'TBA') aVal = '9999-99-99';
                if (bVal === 'TBA') bVal = '9999-99-99';
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
      }

      setFilteredIpos([...res]); // Spread to trigger re-render
  }, [ipos, searchQuery, filters, sortConfig]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 bg-grid-dots transition-colors duration-300 pt-28 pb-10">
        <TopBar onSearch={setSearchQuery} />

        <div className="flex max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 gap-8">
            <main className="flex-1 min-w-0">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Realtime Feed
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Live Sync Active</span>
                        </h1>
                        <div className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-wide">
                            {filteredIpos.length} IPOs Listed • Updated Just Now
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <IPOTable data={filteredIpos} sortConfig={sortConfig} onSort={handleSort} />
                )}
            </main>

            <Sidebar onFilterChange={setFilters} ipos={ipos} />
        </div>
    </div>
  );
}
