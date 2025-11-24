
import React, { useState } from 'react';
import { BusinessProfile, DeepResearch, Lead, GodEyeData } from '../types';
import { performGodEyeAnalysis } from '../services/gemini';
import GodEyePanel from './GodEyePanel';
import { 
  Target, Activity, BarChart3, Zap, ShieldCheck, 
  TrendingUp, Users, AlertTriangle, Download, CheckCircle, Eye,
  Map, MessageSquare, Globe, Clock
} from 'lucide-react';

interface Props {
  profile: BusinessProfile;
  research: DeepResearch | null;
  savedLeads: Lead[];
  goToFinder: () => void;
}

const Dashboard: React.FC<Props> = ({ profile, research, savedLeads, goToFinder }) => {
  const [tab, setTab] = useState<'overview' | 'swot' | 'strategy' | 'mission_control'>('mission_control');
  
  const [godEyeData, setGodEyeData] = useState<GodEyeData | null>(null);
  const [isLoadingGodEye, setIsLoadingGodEye] = useState(false);
  const [showGodEye, setShowGodEye] = useState(false);

  if (!research) return <div className="p-10 text-zinc-500">No research data available.</div>;

  const activateGodEye = async () => {
    if (godEyeData) {
      setShowGodEye(true);
      return;
    }
    setIsLoadingGodEye(true);
    try {
      const data = await performGodEyeAnalysis(profile);
      setGodEyeData(data);
      setShowGodEye(true);
    } catch (e) {
      console.error("God Eye failed", e);
    } finally {
      setIsLoadingGodEye(false);
    }
  };

  // Live Metrics Calculation
  const totalLeads = savedLeads.length;
  const hotLeads = savedLeads.filter(l => l.intent_label === 'High' || l.warmth_level === 'Hot').length;
  const contactedLeads = savedLeads.filter(l => l.stage === 'Contacted' || l.stage === 'Interested').length;
  const newSignals = savedLeads.filter(l => l.freshness === 'Fresh').length;

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden">
      {/* Header Ticker */}
      <div className="flex items-center gap-6 overflow-hidden border-b border-white/10 pb-4 pt-6 px-6 shrink-0 bg-black z-10">
         <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            SYSTEM ONLINE
         </div>
         <div className="flex-1 flex gap-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap">
            <span className="text-xs text-zinc-500">Scanning Nodes: Active</span>
            <span className="text-xs text-zinc-500">New Signals: {newSignals} Detected</span>
            <span className="text-xs text-zinc-500">Database: Connected</span>
         </div>
      </div>

      {/* Main Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between">
           <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
             {['mission_control', 'overview', 'swot', 'strategy'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t as any)}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all capitalize ${tab === t ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                   {t.replace('_', ' ')}
                </button>
             ))}
           </div>

           <button 
             onClick={activateGodEye}
             disabled={isLoadingGodEye}
             className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border ${isLoadingGodEye ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
           >
             {isLoadingGodEye ? <Eye className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
             {isLoadingGodEye ? 'SCANNING DEEP WEB...' : 'ACTIVATE GOD EYE'}
           </button>
        </div>

        {/* MISSION CONTROL DASHBOARD */}
        {tab === 'mission_control' && (
           <div className="grid grid-cols-4 gap-6 animate-in fade-in duration-500 pb-12">
              
              {/* Stats Row */}
              <div className="col-span-4 grid grid-cols-4 gap-4">
                 <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users className="w-12 h-12 text-blue-500" /></div>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Total Leads</p>
                    <div className="text-3xl font-bold text-white">{totalLeads}</div>
                    <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                    </div>
                 </div>
                 <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="w-12 h-12 text-amber-500" /></div>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Hot Leads</p>
                    <div className="text-3xl font-bold text-white">{hotLeads}</div>
                    <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500" style={{ width: `${(hotLeads/totalLeads)*100 || 0}%` }}></div>
                    </div>
                 </div>
                 <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><MessageSquare className="w-12 h-12 text-emerald-500" /></div>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Outreach Active</p>
                    <div className="text-3xl font-bold text-white">{contactedLeads}</div>
                    <p className="text-[10px] text-zinc-500 mt-2">Leads in sequence</p>
                 </div>
                 <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-12 h-12 text-purple-500" /></div>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Health Score</p>
                    <div className="text-3xl font-bold text-white">98%</div>
                    <p className="text-[10px] text-emerald-500 mt-2">System Optimal</p>
                 </div>
              </div>

              {/* Main Map Intelligence */}
              <div className="col-span-2 bg-zinc-900/50 border border-white/5 rounded-xl p-6 min-h-[300px] relative overflow-hidden">
                 <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2"><Map className="w-4 h-4" /> Global Intelligence Map</h3>
                 <div className="absolute inset-0 top-12 opacity-30 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png')] bg-contain bg-no-repeat bg-center"></div>
                 
                 {/* Live Pings based on leads */}
                 {savedLeads.slice(0, 5).map((l, i) => (
                    <div 
                      key={l.id}
                      className="absolute w-3 h-3 rounded-full animate-ping bg-blue-500"
                      style={{ 
                        top: `${30 + (i * 10)}%`, 
                        left: `${20 + (i * 15)}%`,
                        animationDelay: `${i * 0.5}s`
                      }}
                    ></div>
                 ))}
              </div>

              {/* Pipeline Snapshot */}
              <div className="col-span-2 bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                 <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Pipeline Velocity</h3>
                 <div className="space-y-4">
                    {['New', 'Contacted', 'Interested', 'Won'].map((stage, i) => {
                       const count = savedLeads.filter(l => l.stage === stage).length;
                       const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 5;
                       return (
                          <div key={stage} className="flex items-center gap-4">
                             <div className="w-24 text-xs text-zinc-500 font-medium">{stage}</div>
                             <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${i===3 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${percent}%` }}></div>
                             </div>
                             <div className="w-8 text-right text-xs text-zinc-300 font-bold">{count}</div>
                          </div>
                       );
                    })}
                 </div>
              </div>

              {/* Mission Log */}
              <div className="col-span-4 bg-black border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 max-h-48 overflow-y-auto custom-scrollbar">
                 <p className="text-emerald-500 mb-1">[SYSTEM] Mission Control Initialized.</p>
                 <p className="mb-1">[AI] Deep Research module loaded for {profile.companyName}.</p>
                 {savedLeads.slice(0, 5).map((l, i) => (
                    <p key={i} className="mb-1 flex items-center gap-2">
                       <span className="text-blue-500">[{new Date(l.last_updated).toLocaleTimeString()}]</span> 
                       Found {l.business_name} ({l.lead_score}% Match)
                    </p>
                 ))}
                 <p className="animate-pulse text-blue-500 mt-2">[LIVE] Listening for new market signals...</p>
              </div>

           </div>
        )}

        {/* Fallback to other tabs for detailed research */}
        {tab !== 'mission_control' && (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
             {tab === 'overview' && (
               <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-8">
                  <h2 className="text-xl font-bold text-white mb-4">{profile.companyName} Overview</h2>
                  <p className="text-zinc-400 leading-relaxed">{profile.description}</p>
                  <div className="mt-6 grid grid-cols-2 gap-6">
                     <div>
                        <h3 className="text-sm font-medium text-zinc-300 mb-2">Target Audience</h3>
                        <div className="flex flex-wrap gap-2">
                           {research.ideal_customer_profile.roles.map(role => (
                              <span key={role} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-white/5">{role}</span>
                           ))}
                        </div>
                     </div>
                     <div>
                        <h3 className="text-sm font-medium text-zinc-300 mb-2">Core Services</h3>
                        <div className="flex flex-wrap gap-2">
                           {research.core_services.map(svc => (
                              <span key={svc} className="px-2 py-1 bg-blue-900/20 text-blue-400 rounded text-xs border border-blue-500/20">{svc}</span>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
             )}
             {tab === 'swot' && (
               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                     <h3 className="text-emerald-400 font-bold mb-4">Strengths</h3>
                     <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
                        {research.swot.strengths.map((s, i) => <li key={i}>{s}</li>)}
                     </ul>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                     <h3 className="text-rose-400 font-bold mb-4">Weaknesses</h3>
                     <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
                        {research.swot.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                     </ul>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                     <h3 className="text-blue-400 font-bold mb-4">Opportunities</h3>
                     <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
                        {research.swot.opportunities.map((s, i) => <li key={i}>{s}</li>)}
                     </ul>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                     <h3 className="text-amber-400 font-bold mb-4">Threats</h3>
                     <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
                        {research.swot.threats.map((s, i) => <li key={i}>{s}</li>)}
                     </ul>
                  </div>
               </div>
             )}
           </div>
        )}

        {/* God Eye Overlay */}
        {showGodEye && godEyeData && (
          <GodEyePanel data={godEyeData} onClose={() => setShowGodEye(false)} />
        )}

      </div>
    </div>
  );
};

export default Dashboard;
