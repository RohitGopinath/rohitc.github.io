"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import IPOCard from '@/components/IPOCard';

interface IPO {
  id: number;
  name: string;
  type: string;
  price_band: string;
  status: string;
  gmp: number;
}

export default function IPOListPage() {
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [filter, setFilter] = useState('All'); // All, Mainboard, SME

  useEffect(() => {
    async function fetchIPOs() {
      try {
        const res = await axios.get('http://localhost:8000/ipos');
        setIpos(res.data);
      } catch (e) {
        console.error("Error loading IPOs", e);
      }
    }
    fetchIPOs();
  }, []);

  const filteredIPOs = ipos.filter(ipo => {
    if (filter === 'All') return true;
    return ipo.type === filter;
  });

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-20">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">IPO Tracker</h1>

          <div className="mt-4 md:mt-0 flex space-x-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            {['All', 'Mainboard', 'SME'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filter === f
                    ? 'bg-black text-white shadow'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIPOs.map((ipo) => (
            <IPOCard
               key={ipo.id}
               id={ipo.id}
               name={ipo.name}
               price={ipo.price_band}
               status={ipo.status}
               gmp={ipo.gmp}
               type={ipo.type}
             />
          ))}
        </div>
      </div>
    </main>
  );
}
