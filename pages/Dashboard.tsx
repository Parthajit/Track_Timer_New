
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Clock, 
  Zap, 
  Activity, 
  TrendingUp, 
  ChevronLeft,
  History,
  Hourglass,
  BarChart2,
  Layers,
  Info,
  Calendar,
  Download
} from 'lucide-react';
import { User, TimerMode } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  user: User;
}

type ToolFilter = 'overall' | TimerMode;

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeToolTab, setActiveToolTab] = useState<ToolFilter>('overall');
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('timer_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (isMounted && !error && data) {
          setRawLogs(data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (user.isLoggedIn) fetchLogs();
    return () => { isMounted = false; };
  }, [user.id, user.isLoggedIn]);

  const filteredLogs = useMemo(() => {
    if (activeToolTab === 'overall') return rawLogs;
    return rawLogs.filter(log => log.timer_type === activeToolTab);
  }, [rawLogs, activeToolTab]);

  const stats = useMemo(() => {
    const totalMs = filteredLogs.reduce((acc, log) => acc + (log.duration_ms || 0), 0);
    const avgMs = filteredLogs.length > 0 ? totalMs / filteredLogs.length : 0;
    
    const formatDuration = (ms: number) => {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return {
      sessions: filteredLogs.length,
      totalActive: formatDuration(totalMs),
      avgBlock: formatDuration(avgMs),
    };
  }, [filteredLogs]);

  const trendData = useMemo(() => {
    if (filteredLogs.length === 0) return [];
    
    const dateGroups: Record<string, number> = {};

    filteredLogs.forEach(log => {
      const dateKey = new Date(log.created_at).toISOString().split('T')[0];
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + (log.duration_ms / 3600000);
    });

    const entries = Object.entries(dateGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, hours]) => {
        const dateObj = new Date(dateKey);
        return {
          name: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
          hours: Number(hours.toFixed(3)),
          fullDate: dateKey
        };
      });

    if (entries.length === 1) {
      return [{ name: '', hours: 0 }, ...entries];
    }

    return entries;
  }, [filteredLogs]);

  const formatLogDuration = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
          <Zap className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Syncing User Analytics</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 px-4 pt-6 animate-fade-up">
      {/* Navigation & Context */}
      <div className="flex items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all bg-[#0B1120] px-5 py-3.5 rounded-2xl border border-slate-800 shadow-xl"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </button>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-blue-500 bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 uppercase tracking-widest">
            {activeToolTab === 'overall' ? 'Profile Summary' : `${activeToolTab.toUpperCase()} Data`}
        </div>
      </div>

      {/* Tool-specific Selection Tabs */}
      <div className="flex bg-[#0B1120] p-1.5 rounded-[2rem] border border-slate-800 overflow-x-auto no-scrollbar scroll-smooth shadow-2xl">
        <TabButton active={activeToolTab === 'overall'} onClick={() => setActiveToolTab('overall')} label="OVERALL" icon={<Layers className="w-4 h-4" />} />
        <TabButton active={activeToolTab === TimerMode.STOPWATCH} onClick={() => setActiveToolTab(TimerMode.STOPWATCH)} label="STOPWATCH" icon={<History className="w-4 h-4" />} />
        <TabButton active={activeToolTab === TimerMode.COUNTDOWN} onClick={() => setActiveToolTab(TimerMode.COUNTDOWN)} label="COUNTDOWN" icon={<Hourglass className="w-4 h-4" />} />
        <TabButton active={activeToolTab === TimerMode.LAP_TIMER} onClick={() => setActiveToolTab(TimerMode.LAP_TIMER)} label="LAP TIMER" icon={<Activity className="w-4 h-4" />} />
        <TabButton active={activeToolTab === TimerMode.INTERVAL} onClick={() => setActiveToolTab(TimerMode.INTERVAL)} label="INTERVAL" icon={<BarChart2 className="w-4 h-4" />} />
      </div>

      {/* Primary Metrics Group */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="TOTAL SESSIONS" value={stats.sessions.toString()} icon={<TrendingUp className="w-5 h-5" />} color="text-blue-500" />
        <MetricCard label="ACTIVE HOURS" value={stats.totalActive} icon={<Clock className="w-5 h-5" />} color="text-indigo-400" />
        <MetricCard label="AVG SESSION" value={stats.avgBlock} icon={<Zap className="w-5 h-5" />} color="text-emerald-400" />
      </div>

      {/* Activity Trend Graph */}
      <div className="bg-[#0B1120] border border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <TrendingUp className="w-64 h-64 text-blue-500" />
        </div>
        
        <div className="flex items-center justify-between mb-12 relative z-10">
          <div className="space-y-1">
            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em]">Usage Performance</h4>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest italic">{activeToolTab === 'overall' ? 'System Intensity' : `${activeToolTab.replace('_', ' ')} Performance`}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            <Calendar className="w-3 h-3" /> Tool Filter Active
          </div>
        </div>

        <div className="w-full h-[400px] min-h-[400px] relative z-10">
          {trendData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5">
              <div className="p-5 bg-slate-800/50 rounded-2xl">
                <Info className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No session data for this selection</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.15} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} 
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} 
                  contentStyle={{backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff'}}
                  itemStyle={{color: '#3b82f6', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#chartGradient)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* FOCUS LOG Table - Bold Italic Design */}
      <div className="bg-[#0B1120] border border-slate-800 rounded-[3rem] p-1 shadow-2xl overflow-hidden relative">
        <div className="p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-800/50">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20">
                 <History className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter">FOCUS LOG</h4>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">{filteredLogs.length} SESSIONS IN VIEW</p>
              </div>
           </div>
           <button className="flex items-center gap-3 px-8 py-4 bg-[#0B1120] border border-slate-800 hover:border-slate-700 text-[10px] font-black text-white uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl group">
             <Download className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
             EXPORT ANALYSIS
           </button>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#0B1120] border-b border-slate-800/30">
                <th className="px-12 py-10 text-[10px] font-black text-slate-600 italic uppercase tracking-[0.3em]">TIMESTAMP</th>
                <th className="px-12 py-10 text-[10px] font-black text-slate-600 italic uppercase tracking-[0.3em]">APP</th>
                <th className="px-12 py-10 text-[10px] font-black text-slate-600 italic uppercase tracking-[0.3em]">DURATION</th>
                <th className="px-12 py-10 text-[10px] font-black text-slate-600 italic uppercase tracking-[0.3em]">SPECIFIC METRICS (SECONDS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-32 text-center text-[11px] font-black text-slate-700 uppercase tracking-widest italic">No Focus Data Found</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/10 transition-all group">
                    <td className="px-12 py-12">
                      <div className="space-y-1">
                        <span className="text-[15px] font-black text-white uppercase tracking-tighter block">{new Date(log.created_at).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                      </div>
                    </td>
                    <td className="px-12 py-12">
                       <span className="inline-flex items-center px-4 py-2 bg-slate-900/50 border border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-xl group-hover:border-blue-500/30 transition-colors">
                         {log.timer_type.replace('_', '').toUpperCase()}
                       </span>
                    </td>
                    <td className="px-12 py-12">
                       <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                         <span className="text-2xl font-black text-white tabular-nums tracking-tighter">{formatLogDuration(log.duration_ms)}</span>
                       </div>
                    </td>
                    <td className="px-12 py-12">
                       <div className="flex flex-wrap gap-x-5 gap-y-3">
                         {log.metadata ? (
                           <>
                             {log.metadata.lap_count !== undefined && <MetricBadge label="LAP COUNT" value={log.metadata.lap_count} />}
                             {log.metadata.avg_lap !== undefined && <MetricBadge label="AVERAGE LAP" value={`${(log.metadata.avg_lap / 1000).toFixed(2)}S`} />}
                             {log.metadata.consistency !== undefined && <MetricBadge label="CONSISTENCY" value={`${(log.metadata.consistency / 1000).toFixed(2)}S`} />}
                             {log.metadata.fastest_lap !== undefined && <MetricBadge label="FASTEST LAP" value={`${(log.metadata.fastest_lap / 1000).toFixed(2)}S`} />}
                             {log.metadata.slowest_lap !== undefined && <MetricBadge label="SLOWEST LAP" value={`${(log.metadata.slowest_lap / 1000).toFixed(2)}S`} />}
                           </>
                         ) : (
                           <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest italic opacity-40">Standard Session</span>
                         )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MetricBadge: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
  <div className="inline-flex items-center gap-2 bg-[#020617] border border-slate-800/80 px-4 py-2 rounded-xl shadow-sm hover:border-blue-500/30 transition-all">
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}:</span>
    <span className="text-[11px] font-black text-blue-500 uppercase">{value}</span>
  </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-8 py-5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all whitespace-nowrap ${
      active ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
    }`}
  >
    {icon}
    {label}
  </button>
);

const MetricCard: React.FC<{ label: string, value: string, icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-[#0B1120] border border-slate-800 p-10 rounded-[3rem] flex flex-col justify-center min-h-[250px] shadow-2xl group hover:border-blue-500/20 transition-all cursor-default relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">{icon}</div>
    <div className="flex items-center justify-between mb-8">
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">{label}</p>
      <div className={`${color} opacity-30 group-hover:opacity-100 transition-opacity`}>{icon}</div>
    </div>
    <p className={`text-5xl lg:text-6xl font-black tabular-nums tracking-tighter italic ${value === '0' || value === '0:00:00' ? 'text-slate-800' : 'text-white'}`}>{value}</p>
  </div>
);

export default Dashboard;
