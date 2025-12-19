"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

interface IndexData {
  name: string;
  price: number;
  change: number;
  percent: number;
  is_positive: boolean;
}

export default function Ticker() {
  const [indices, setIndices] = useState<IndexData[]>([]);

  useEffect(() => {
    // In a real app, use SWR or React Query
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:8000/market-indices');
        setIndices(res.data);
      } catch (e) {
        console.error("Failed to fetch ticker data", e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  if (indices.length === 0) return null;

  return (
    <div className="w-full bg-black/90 text-white overflow-hidden py-2 whitespace-nowrap z-40 relative">
      <motion.div
        className="inline-block"
        animate={{ x: [0, -1000] }} // Simple marquee effect
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        {/* Repeat the content to create seamless loop illusion */}
        {[...indices, ...indices, ...indices].map((idx, i) => (
          <span key={i} className="mx-8 font-medium text-sm">
            <span className="text-gray-400 mr-2">{idx.name}</span>
            <span>{idx.price.toLocaleString()}</span>
            <span className={`ml-2 ${idx.is_positive ? 'text-green-400' : 'text-red-400'}`}>
              {idx.change > 0 ? '+' : ''}{idx.change} ({idx.percent}%)
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
