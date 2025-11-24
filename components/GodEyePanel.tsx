
import React from 'react';
import { GodEyeData } from '../types';
import { 
  Building2, Users, Scale, Coins, Activity, 
  Globe, Target, Zap, Mail, MapPin, Calendar,
  TrendingUp, Award, Newspaper, X, ShieldCheck, Leaf,
  Briefcase
} from 'lucide-react';

interface Props {
  data: GodEyeData;
  onClose: () => void;
}

const GodEyePanel: React.FC<Props> = ({ data, onClose }) => {
  // Helper to safely render text that might be returned as an object by the LLM
  const safeText = (item: any): string => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.name || item.title || JSON.stringify(item);
    }
    return String(item);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg overflow-hidden flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[95vh] bg-zinc-950 border border-blue-500/20 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header - Premium Feel */}
        <div className="h-20 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-white/5 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <Globe className="w-6 h-6 text-white animate-pulse-slow" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                   GOD EYE <span className="text-blue-500 text-xs font-mono border border-blue-500/30 px-2 py-0.5 rounded bg-blue-500/10">ACTIVE</span>
                </h1>
                <p className="text-xs text-zinc-400">Deep Intelligence Scan • {data.basic_details.legal_name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
             <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        {/* Scrollable Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 1. Basic Details */}
              <div className="col-span-1 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Corporate Identity
                 </h3>
                 <div className="space-y-3">
                    <DetailRow label="Legal Name" value={data.basic_details.legal_name} />
                    <DetailRow label="Founded" value={data.basic_details.founded_year} />
                    <DetailRow label="HQ" value={data.basic_details.hq_location} />
                    <DetailRow label="Type" value={data.basic_details.business_type} />
                    <div className="pt-2">
                       <p className="text-xs text-zinc-400 italic">"{data.basic_details.mission_statement || data.basic_details.description}"</p>
                    </div>
                 </div>
              </div>

              {/* 2. Leadership */}
              <div className="col-span-1 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Leadership
                 </h3>
                 <DetailRow label="CEO" value={data.leadership.ceo} highlight />
                 <div className="mt-4 space-y-3">
                    {data.leadership.key_executives && data.leadership.key_executives.map((exec, i) => (
                       <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                          <div>
                             <p className="text-sm font-medium text-zinc-200">{safeText(exec.name)}</p>
                             <p className="text-xs text-zinc-500">{safeText(exec.role)}</p>
                          </div>
                          {exec.linkedin && (
                             <a href={exec.linkedin} target="_blank" rel="noreferrer" className="text-blue-500 text-xs hover:underline">LinkedIn</a>
                          )}
                       </div>
                    ))}
                 </div>
              </div>

              {/* 3. Legal & Compliance */}
              <div className="col-span-1 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4" /> Legal & Compliance
                 </h3>
                 <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                       {data.legal_compliance.registration_numbers?.map((reg, i) => (
                          <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-white/5">{reg}</span>
                       ))}
                    </div>
                    {data.legal_compliance.certifications?.length > 0 && (
                       <div>
                          <span className="text-xs text-zinc-500 block mb-1">Certifications</span>
                          <p className="text-xs text-zinc-300">{data.legal_compliance.certifications.join(', ')}</p>
                       </div>
                    )}
                 </div>
              </div>

              {/* 4. Financials */}
              <div className="col-span-1 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Coins className="w-4 h-4" /> Financial Health
                 </h3>
                 <div className="space-y-3">
                    <DetailRow label="Est. Revenue" value={data.financials.revenue_range} highlight />
                    <DetailRow label="Funding" value={data.financials.funding_rounds?.length > 0 ? data.financials.funding_rounds.join(', ') : 'N/A'} />
                    <DetailRow label="Investors" value={data.financials.investors?.length > 0 ? data.financials.investors.join(', ') : 'N/A'} />
                    <DetailRow label="Valuation" value={data.financials.valuation} />
                 </div>
              </div>

              {/* 5. Strategy & SWOT */}
              <div className="col-span-1 md:col-span-2 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Strategic Direction
                 </h3>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <span className="text-xs text-zinc-500 block mb-2 font-bold">Goals</span>
                       <ul className="list-disc list-inside space-y-1">
                          {data.strategy.short_term_goals?.map((g,i) => <li key={i} className="text-xs text-zinc-300">{safeText(g)}</li>)}
                       </ul>
                    </div>
                    <div>
                       <span className="text-xs text-zinc-500 block mb-2 font-bold">SWOT Snapshot</span>
                       <div className="space-y-2">
                          <p className="text-xs text-emerald-400"><span className="font-bold text-zinc-500">S:</span> {data.strategy.swot.strengths?.[0]}</p>
                          <p className="text-xs text-rose-400"><span className="font-bold text-zinc-500">W:</span> {data.strategy.swot.weaknesses?.[0]}</p>
                          <p className="text-xs text-blue-400"><span className="font-bold text-zinc-500">O:</span> {data.strategy.swot.opportunities?.[0]}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* 6. Operations */}
              <div className="col-span-1 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Operations
                 </h3>
                 <DetailRow label="Employees" value={data.operations.employee_count} />
                 <div className="mt-3">
                    <span className="text-xs text-zinc-500 block mb-1">Tech Stack</span>
                    <div className="flex flex-wrap gap-1">
                       {data.operations.tech_stack?.map((t, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{safeText(t)}</span>
                       ))}
                    </div>
                 </div>
              </div>

              {/* 7. Marketing & Social Discovery */}
              <div className="col-span-1 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Digital Footprint
                 </h3>
                 <DetailRow label="Sentiment" value={data.online_presence.sentiment_score} />
                 <div className="mt-3">
                    <span className="text-xs text-zinc-500 block mb-1">Social Channels</span>
                    <div className="flex flex-wrap gap-2">
                       {Object.entries(data.online_presence.social_profiles || {}).map(([platform, url], i) => (
                          url ? (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline capitalize">
                               {platform}
                            </a>
                          ) : null
                       ))}
                    </div>
                 </div>
              </div>
              
              {/* 8. CSR & Sustainability */}
              <div className="col-span-1 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Leaf className="w-4 h-4" /> CSR & Sustainability
                 </h3>
                 <ul className="list-disc list-inside space-y-1">
                    {data.csr_sustainability.initiatives?.length > 0 ? (
                       data.csr_sustainability.initiatives.map((init, i) => <li key={i} className="text-xs text-zinc-300">{safeText(init)}</li>)
                    ) : (
                       <li className="text-xs text-zinc-500">No major initiatives found.</li>
                    )}
                 </ul>
              </div>

              {/* 9. Recent Events */}
              <div className="col-span-1 md:col-span-2 bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                 <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Newspaper className="w-4 h-4" /> News & Signals
                 </h3>
                 <div className="space-y-4">
                    {data.additional.media_mentions?.length > 0 ? (
                       data.additional.media_mentions.map((event, i) => (
                          <div key={i} className="text-xs text-zinc-300 border-b border-white/5 pb-2 last:border-0">
                             {safeText(event)}
                          </div>
                       ))
                    ) : (
                       <p className="text-xs text-zinc-500">No recent media mentions found.</p>
                    )}
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, highlight = false }: { label: string, value?: string, highlight?: boolean }) => (
   <div className="flex justify-between py-1 border-b border-white/5 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-medium truncate max-w-[60%] text-right ${highlight ? 'text-emerald-400' : 'text-zinc-200'}`}>
         {value || 'N/A'}
      </span>
   </div>
);

export default GodEyePanel;
