import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface IPOCardProps {
  id: number;
  name: string;
  price: string;
  status: string;
  gmp: number;
  type: string;
}

export default function IPOCard({ id, name, price, status, gmp, type }: IPOCardProps) {
  const isPositive = gmp > 0;

  return (
    <Link href={`/ipo/${id}`}>
      <div className="glass-card p-6 h-full flex flex-col justify-between group cursor-pointer">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              status === 'Open' ? 'bg-green-100 text-green-700' :
              status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {status}
            </span>
            <span className="text-xs text-gray-400 font-medium">{type}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Price Band: {price}</p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">GMP</p>
            <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              ₹{gmp}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
          </div>
        </div>
      </div>
    </Link>
  );
}
