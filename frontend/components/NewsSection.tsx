"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  published_at: string;
  link: string;
  source: string;
}

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    async function fetchNews() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await axios.get(`${API_URL}/news`);
        setNews(res.data);
      } catch (e) {
        console.error("Failed to load news", e);
      }
    }
    fetchNews();
  }, []);

  if (news.length === 0) return null;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-3xl font-bold text-gray-900">Market News</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group h-full"
          >
            <div className="glass-card p-6 h-full flex flex-col justify-between hover:border-blue-300 transition-all duration-300">
               <div>
                  <div className="flex justify-between items-start mb-3">
                     <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {item.source}
                     </span>
                     <span className="text-xs text-gray-400">
                        {new Date(item.published_at).toLocaleDateString()}
                     </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-3 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3">
                    {item.summary}
                  </p>
               </div>
               <div className="mt-4 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Read full story <ExternalLink className="ml-1 w-3 h-3" />
               </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
