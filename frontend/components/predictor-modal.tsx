"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

interface PredictorModalProps {
  ipos: any[];
}

export function PredictorModal({ ipos }: PredictorModalProps) {
  const [selectedIPO, setSelectedIPO] = React.useState<string>("");
  const [lots, setLots] = React.useState<number>(1);
  const [category, setCategory] = React.useState<string>("RII");
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const handlePredict = async () => {
    if (!selectedIPO) return;
    setLoading(true);
    setResult(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Parallel requests
      const p1 = axios.post(`${API_URL}/predict/profit`, {
        ipo_id: parseInt(selectedIPO),
        lots: lots
      });

      const p2 = axios.post(`${API_URL}/predict/allotment`, {
        ipo_id: parseInt(selectedIPO),
        category: category,
        lots_applied: lots
      });

      const [resProfit, resAllotment] = await Promise.all([p1, p2]);

      setResult({
        profit: resProfit.data,
        allotment: resAllotment.data
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group">
            <span className="w-5 h-5 mb-2 text-purple-500 group-hover:scale-110 transition-transform">📊</span>
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">PREDICT</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle>IPO Predictor</DialogTitle>
          <DialogDescription>
            Estimate your profit and allotment chances.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Select IPO</label>
            <Select onValueChange={setSelectedIPO} value={selectedIPO}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an IPO..." />
              </SelectTrigger>
              <SelectContent>
                {ipos.filter(i => i.status !== "Closed").map((ipo) => (
                  <SelectItem key={ipo.id} value={ipo.id.toString()}>
                    {ipo.name} ({ipo.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
               <label className="text-sm font-medium">Lots Applied</label>
               <Input type="number" min={1} value={lots} onChange={(e) => setLots(parseInt(e.target.value))} />
            </div>
             <div className="grid gap-2">
               <label className="text-sm font-medium">Category</label>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RII">Retail (RII)</SelectItem>
                    <SelectItem value="HNI">HNI (NII)</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          <Button onClick={handlePredict} disabled={loading || !selectedIPO}>
            {loading ? "Calculating..." : "Calculate"}
          </Button>
        </div>

        {result && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-3">
                <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500">Est. Profit</span>
                    <span className={`font-bold font-mono text-lg ${result.profit.estimated_profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                        ₹{result.profit.estimated_profit.toLocaleString()}
                    </span>
                </div>
                 <div className="flex justify-between items-center border-b pb-2 border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500">Investment</span>
                    <span className="font-mono text-sm">
                        ₹{result.profit.investment_amount.toLocaleString()}
                    </span>
                </div>
                <div className="pt-2">
                     <span className="text-sm text-gray-500 block mb-1">Allotment Chance</span>
                     <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            result.allotment.probability === "High" ? "bg-green-100 text-green-700" :
                            result.allotment.probability === "Low" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                        }`}>
                            {result.allotment.probability}
                        </span>
                        <span className="text-xs text-gray-400">{result.allotment.reasoning}</span>
                     </div>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
