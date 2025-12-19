"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Ticker from '@/components/Ticker';
import IPOCard from '@/components/IPOCard';
import Link from 'next/link';

interface IPO {
  id: number;
  name: string;
  type: string;
  price_band: string;
  status: string;
  gmp: number;
}

export default function Home() {
  const [hotIpos, setHotIpos] = useState<IPO[]>([]);

  useEffect(() => {
    async function fetchIPOs() {
      try {
        const res = await axios.get('http://localhost:8000/ipos');
        // Filter for "Hot" IPOs (e.g., Open or high GMP)
        // For MVP, just taking the first 3
        setHotIpos(res.data.slice(0, 3));
      } catch (e) {
        console.error("Error loading IPOs", e);
      }
    }
    fetchIPOs();
  }, []);

  return (
    <main className="min-h-screen pb-20">
      <Navbar />
      <div className="pt-16">
        <Ticker />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
          Invest with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Confidence.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-10">
          Track Live Grey Market Premiums (GMP), Subscription Status, and Listing Gains for Mainboard & SME IPOs.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/ipo" className="px-8 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl">
            View All IPOs
          </Link>
          <button className="px-8 py-3 rounded-full bg-white text-gray-900 border border-gray-200 font-medium hover:bg-gray-50 transition-all">
            Market News
          </button>
        </div>
      </section>

      {/* Hot IPOs Grid */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Trending IPOs</h2>
          <Link href="/ipo" className="text-blue-600 font-medium hover:underline">View All &rarr;</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotIpos.length > 0 ? (
             hotIpos.map((ipo) => (
               <IPOCard
                 key={ipo.id}
                 id={ipo.id}
                 name={ipo.name}
                 price={ipo.price_band}
                 status={ipo.status}
                 gmp={ipo.gmp}
                 type={ipo.type}
               />
             ))
          ) : (
             <div className="col-span-3 text-center py-20 text-gray-500">Loading Market Data...</div>
          )}
        </div>
      </section>
    </main>
  );
}
