import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, Navigation, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";

interface EmergencyLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (interval: number) => void;
}

const INTERVAL_PRESETS = [
  { label: "1s (Ultra-fast)", value: 1000 },
  { label: "5s (High frequency)", value: 5000 },
  { label: "30s (Standard)", value: 30000 },
  { label: "1m (Energy saver)", value: 60000 },
  { label: "5m", value: 300000 },
  { label: "1h", value: 3600000 },
];

export function EmergencyLocationModal({ isOpen, onClose, onStart }: EmergencyLocationModalProps) {
  const [selectedInterval, setSelectedInterval] = useState(30000);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-red-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-red-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Emergency Tracking</h2>
                <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Protocol: Active Location Stream</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Warning Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                Security Notice
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Emergency tracking initiates a persistent GPS stream. Your real-time coordinates will be updated automatically based on the selected frequency.
              </p>
            </div>

            {/* Interval Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Update Interval
                </label>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
                  {selectedInterval / 1000}s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {INTERVAL_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setSelectedInterval(preset.value)}
                    className={`p-3 text-left rounded-xl border transition-all flex flex-col gap-1 ${
                      selectedInterval === preset.value
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "bg-slate-800/30 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="text-sm font-bold">{preset.label.split(" (")[0]}</span>
                    <span className="text-[10px] uppercase opacity-60">
                      {preset.label.includes("(") ? preset.label.split("(")[1].replace(")", "") : "Frequency"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                onClick={() => onStart(selectedInterval)}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <Navigation className="w-5 h-5 fill-current" />
                START EMERGENCY STREAM
              </button>
              <p className="mt-4 text-center text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                LiveKit GPS Tunnel v4.2.1
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
