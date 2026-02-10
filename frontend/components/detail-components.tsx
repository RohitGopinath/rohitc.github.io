import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import axios from "axios";

// --- Types ---
interface IPO {
  id: number;
  name: string;
  symbol: string;
  gmp: number;
  lot_size: number;
  retail_subscription_x: number;
  allotment_url?: string;
  sentiment_bullish: number;
  sentiment_bearish: number;
}

// --- Component A: Profit Calculator ---
export function ProfitCalculator({ ipo }: { ipo: IPO }) {
  const [lots, setLots] = useState(1);
  const potentialProfit = ipo.gmp * ipo.lot_size * lots;
  const isHighProfit = potentialProfit > 10000;

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 transition-all ${isHighProfit ? "shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] border-emerald-500/30" : ""}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-4 w-4" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-sm">Profit Calculator</h3>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2 font-medium text-gray-500 dark:text-gray-400">
          <span>Lots Applied</span>
          <span>{lots} {lots === 1 ? "Lot" : "Lots"}</span>
        </div>
        <Slider
            defaultValue={[1]}
            max={15}
            step={1}
            value={[lots]}
            onValueChange={(val) => setLots(val[0])}
            className="w-full"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
            <span>1</span>
            <span>15</span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Estimated Profit</div>
        <div className={`text-3xl font-mono font-bold ${isHighProfit ? "text-emerald-500 animate-pulse" : "text-gray-900 dark:text-white"}`}>
            ₹{potentialProfit.toLocaleString("en-IN")}
        </div>
        <div className="text-[10px] text-gray-400 mt-2 font-mono">
            Based on current GMP ₹{ipo.gmp} × {ipo.lot_size} qty
        </div>
      </div>
    </div>
  );
}

// --- Component B: Allotment Probability ---
export function AllotmentProbability({ ipo }: { ipo: IPO }) {
  // Logic: 1 / retail_subscription_x
  // Avoid division by zero
  const subX = ipo.retail_subscription_x > 0 ? ipo.retail_subscription_x : 1;

  // Difficulty Score (0 to 100, where 100 is impossible)
  // If subX < 5, difficulty is low. If subX > 50, difficulty is max.
  // Formula: (subX / 50) * 100, capped at 100
  const difficulty = Math.min((subX / 50) * 100, 100);

  let statusText = "Moderate";
  let statusColor = "text-amber-500";
  let progressColor = "bg-amber-500";

  if (subX < 5) {
      statusText = "High Chance (Easy)";
      statusColor = "text-emerald-500";
      progressColor = "bg-emerald-500";
  } else if (subX > 50) {
      statusText = "Lottery (Hard)";
      statusColor = "text-rose-500";
      progressColor = "bg-rose-500";
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-sm">Allotment Chance</h3>
        {ipo.allotment_url && (
            <a
                href={ipo.allotment_url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
            >
                Check Status <ArrowUpRight className="h-3 w-3" />
            </a>
        )}
      </div>

      <div className="mb-4">
        <div className={`text-xl font-bold ${statusColor} mb-1`}>{statusText}</div>
        <div className="text-xs text-gray-500">Retail Subscription: <span className="font-mono font-bold text-gray-900 dark:text-white">{subX}x</span></div>
      </div>

      <div className="relative pt-1">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div style={{ width: `${difficulty}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor} transition-all duration-500`}></div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
            <span>Easy (1x)</span>
            <span>Hard (50x+)</span>
        </div>
      </div>
    </div>
  );
}

// --- Component C: Sentiment Voting ---
export function SentimentVoting({ ipo }: { ipo: IPO }) {
  const [votes, setVotes] = useState({ bullish: ipo.sentiment_bullish, bearish: ipo.sentiment_bearish });
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check local storage/cookie
    const voted = localStorage.getItem(`voted_${ipo.id}`);
    if (voted) setHasVoted(true);
  }, [ipo.id]);

  const handleVote = async (type: "bullish" | "bearish") => {
    if (hasVoted || loading) return;
    setLoading(true);

    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await axios.post(`${API_URL}/ipos/${ipo.id}/vote`, { vote_type: type });

        if (res.data.status === "success") {
            setVotes({ bullish: res.data.bullish, bearish: res.data.bearish });
            setHasVoted(true);
            localStorage.setItem(`voted_${ipo.id}`, "true");
        }
    } catch (e) {
        console.error("Vote failed", e);
    } finally {
        setLoading(false);
    }
  };

  const totalVotes = votes.bullish + votes.bearish;
  const bullishPct = totalVotes > 0 ? (votes.bullish / totalVotes) * 100 : 50;
  const bearishPct = 100 - bullishPct;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
       <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-sm mb-4">Market Sentiment</h3>

       <div className="flex gap-4 mb-6">
            <Button
                variant="outline"
                className={`flex-1 gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20 ${hasVoted ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleVote("bullish")}
                disabled={hasVoted || loading}
            >
                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Bullish</span>
            </Button>
            <Button
                variant="outline"
                className={`flex-1 gap-2 border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/50 dark:hover:bg-rose-900/20 ${hasVoted ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => handleVote("bearish")}
                disabled={hasVoted || loading}
            >
                <ThumbsDown className="h-4 w-4 text-rose-500" />
                <span className="text-rose-600 dark:text-rose-400 font-bold">Bearish</span>
            </Button>
       </div>

       {/* Visual Bar */}
       <div className="h-4 flex rounded-full overflow-hidden relative">
            <div
                style={{ width: `${bullishPct}%` }}
                className="bg-emerald-500 transition-all duration-700 ease-out flex items-center justify-center text-[9px] text-white font-bold"
            >
                {Math.round(bullishPct)}%
            </div>
            <div
                style={{ width: `${bearishPct}%` }}
                className="bg-rose-500 transition-all duration-700 ease-out flex items-center justify-center text-[9px] text-white font-bold"
            >
                 {Math.round(bearishPct)}%
            </div>
       </div>
       <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
            <span>{votes.bullish} Votes</span>
            <span>{votes.bearish} Votes</span>
       </div>
    </div>
  );
}
