
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Cloud } from 'lucide-react';
import { Lap } from '../../types';
import { logTimerUsage } from '../../lib/supabase';

interface LapTimerProps {
  userId?: string;
}

const LapTimer: React.FC<LapTimerProps> = ({ userId }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      if (userId && time > 1000) {
        // Calculate metrics for metadata
        const lapTimes = laps.map(l => l.time);
        const metadata = laps.length > 0 ? {
          lap_count: laps.length,
          avg_lap: lapTimes.reduce((a, b) => a + b, 0) / laps.length,
          fastest_lap: Math.min(...lapTimes),
          slowest_lap: Math.max(...lapTimes),
          consistency: Math.sqrt(lapTimes.map(x => Math.pow(x - (lapTimes.reduce((a, b) => a + b, 0) / laps.length), 2)).reduce((a, b) => a + b, 0) / laps.length)
        } : null;

        logTimerUsage(userId, 'lap_timer', time, 'Activity', metadata);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, userId]);

  const handleStartStop = () => setIsRunning(!isRunning);
  
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (isRunning) {
      const lastLapTime = laps.length > 0 ? laps[0].overall : 0;
      const newLap: Lap = {
        id: laps.length + 1,
        time: time - lastLapTime,
        overall: time
      };
      setLaps([newLap, ...laps]);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0B1120] border border-slate-800 p-8 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row gap-8 relative">
      {userId && (
        <div className="absolute top-6 right-8 flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
          <Cloud className="w-3 h-3" /> Auto-Saving
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6">Lap Timer</span>
        <div className="text-7xl font-black text-white tabular-nums tracking-tighter mb-10">
          {formatTime(time)}
        </div>
        
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={handleStartStop}
            className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-[1.5rem] font-bold transition-all shadow-xl active:scale-95 ${
              isRunning ? 'bg-slate-800 text-slate-300' : 'bg-blue-600 text-white shadow-blue-600/20'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={handleLap}
            disabled={!isRunning}
            className="flex-1 flex items-center justify-center gap-2 py-5 rounded-[1.5rem] font-bold bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
          >
            <Flag className="w-5 h-5" />
            Lap
          </button>
          <button
            onClick={handleReset}
            className="p-5 bg-slate-900 text-slate-500 border border-slate-800 hover:text-white rounded-[1.5rem] transition-all group"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
          </button>
        </div>
      </div>

      <div className="w-full md:w-80 bg-slate-900/50 rounded-[2rem] border border-slate-800 p-6 max-h-[400px] overflow-y-auto no-scrollbar shadow-inner">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800/50 pb-3 flex justify-between">
          <span>Lap Sequence</span>
          <span>Duration</span>
        </div>
        {laps.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 py-12 gap-3 opacity-50">
            <Flag className="w-8 h-8" />
            <span className="text-[10px] font-black uppercase tracking-widest">No laps recorded</span>
          </div>
        ) : (
          <div className="space-y-3">
            {laps.map((lap) => (
              <div key={lap.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800/50 group hover:border-blue-500/30 transition-all">
                <span className="text-[11px] font-black text-slate-500 group-hover:text-blue-500 uppercase tracking-tighter">Lap {lap.id.toString().padStart(2, '0')}</span>
                <span className="text-sm font-black text-white tabular-nums">{formatTime(lap.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LapTimer;
