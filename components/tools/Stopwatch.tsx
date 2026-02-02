
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Cloud, CheckCircle2 } from 'lucide-react';
import { logTimerUsage } from '../../lib/supabase';

interface StopwatchProps {
  userId?: string;
}

const Stopwatch: React.FC<StopwatchProps> = ({ userId }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (userId && time > 1000) {
        setLastSyncStatus('syncing');
        logTimerUsage(userId, 'stopwatch', time, 'Activity').then(() => {
          setLastSyncStatus('success');
          setTimeout(() => setLastSyncStatus('idle'), 3000);
        });
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
    setLastSyncStatus('idle');
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor((time / 60000) % 60);
    const seconds = Math.floor((time / 1000) % 60);
    const milliseconds = Math.floor((time % 1000) / 10);
    return {
      main: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      ms: milliseconds.toString().padStart(2, '0')
    };
  };

  const formatted = formatTime(time);

  return (
    <div className="bg-[#0B1120] border border-slate-800 p-8 sm:p-12 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] shadow-2xl relative overflow-hidden w-full max-w-4xl mx-auto">
      {userId && (
        <div className="absolute top-4 right-6 sm:top-6 sm:right-8 flex items-center gap-2">
          {lastSyncStatus === 'success' ? (
            <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Saved
            </div>
          ) : (
            <div className={`flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-colors ${lastSyncStatus === 'syncing' ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`}>
              <Cloud className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {lastSyncStatus === 'syncing' ? 'Saving...' : 'Ready'}
            </div>
          )}
        </div>
      )}
      
      <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-8">Stopwatch</span>
      
      <div className="flex items-baseline mb-12 select-none">
        <div className="timer-display font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">
          {formatted.main}
        </div>
        <div className="timer-ms font-bold text-blue-600/50 ml-1 sm:ml-2 tabular-nums">
          .{formatted.ms}
        </div>
      </div>
      
      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={handleStartStop}
          className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs sm:text-sm transition-all shadow-xl active:scale-95 ${
            isRunning 
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
          }`}
        >
          {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={handleReset}
          className="px-8 flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-white py-5 rounded-[1.5rem] transition-all group"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 h-6 group-hover:rotate-[-45deg] transition-transform" />
        </button>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8 w-full max-w-xs text-center border-t border-slate-800/50 pt-8">
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
          <p className={`text-[10px] font-bold uppercase ${isRunning ? 'text-emerald-500' : 'text-slate-400'}`}>
            {isRunning ? 'Running' : 'Stopped'}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Session</p>
          <p className="text-[10px] font-bold text-white uppercase">{time > 0 ? (time/1000).toFixed(1) + 's' : '--'}</p>
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
