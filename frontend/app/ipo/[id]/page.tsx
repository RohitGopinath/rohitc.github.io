"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface GMPHistory {
  price: number;
  date: string;
}

interface IPODetail {
  id: number;
  name: string;
  symbol: string;
  type: string;
  price_band: string;
  lot_size: number;
  status: string;
  open_date: string;
  close_date: string;
  gmp_history: GMPHistory[];
}

export default function IPODetailPage() {
  const params = useParams();
  const [ipo, setIpo] = useState<IPODetail | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await axios.get(`http://localhost:8000/ipos/${params.id}`);
        setIpo(res.data);
      } catch (e) {
        console.error("Error loading detail", e);
      }
    }
    if (params.id) fetchDetail();
  }, [params.id]);

  if (!ipo) return <div className="pt-32 text-center">Loading...</div>;

  const currentGMP = ipo.gmp_history.length > 0 ? ipo.gmp_history[ipo.gmp_history.length - 1].price : 0;

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-20">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-6">
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/ipo" className="hover:text-gray-900">IPO Tracker</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium truncate">{ipo.name}</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
             <div className="flex justify-between items-start">
                <div>
                   <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3">
                     {ipo.type}
                   </span>
                   <h1 className="text-3xl font-bold text-gray-900 mb-2">{ipo.name} IPO</h1>
                   <p className="text-gray-500">Status: <span className="text-gray-900 font-medium">{ipo.status}</span></p>
                </div>
                <div className="text-right">
                   <p className="text-sm text-gray-500">Current GMP</p>
                   <p className={`text-4xl font-bold ${currentGMP > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                     ₹{currentGMP}
                   </p>
                </div>
             </div>
          </div>

          {/* GMP Trend (Simple List for MVP) */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">GMP Trend</h2>
            <div className="overflow-hidden">
               <table className="min-w-full text-left text-sm">
                 <thead className="bg-gray-50 text-gray-500">
                   <tr>
                     <th className="px-4 py-3 font-medium">Date</th>
                     <th className="px-4 py-3 font-medium">GMP Price</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {ipo.gmp_history.map((g, i) => (
                     <tr key={i}>
                       <td className="px-4 py-3 text-gray-900">{new Date(g.date).toLocaleDateString()}</td>
                       <td className="px-4 py-3 font-semibold text-green-600">₹{g.price}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-6">
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold mb-4">IPO Details</h3>
             <dl className="space-y-4 text-sm">
               <div className="flex justify-between pb-4 border-b border-gray-50">
                 <dt className="text-gray-500">Price Band</dt>
                 <dd className="font-medium text-gray-900">{ipo.price_band}</dd>
               </div>
               <div className="flex justify-between pb-4 border-b border-gray-50">
                 <dt className="text-gray-500">Lot Size</dt>
                 <dd className="font-medium text-gray-900">{ipo.lot_size || 'N/A'}</dd>
               </div>
               <div className="flex justify-between pb-4 border-b border-gray-50">
                 <dt className="text-gray-500">Open Date</dt>
                 <dd className="font-medium text-gray-900">{ipo.open_date}</dd>
               </div>
               <div className="flex justify-between">
                 <dt className="text-gray-500">Close Date</dt>
                 <dd className="font-medium text-gray-900">{ipo.close_date}</dd>
               </div>
             </dl>
           </div>
        </div>

      </div>
    </main>
  );
}
