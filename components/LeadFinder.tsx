import React, { useState, useEffect, useRef } from 'react';
import { BusinessProfile, DeepResearch, Lead, SearchFilters, SavedSearch } from '../types';
import { generateLeads } from '../services/gemini';
import LeadDetailPanel from './LeadDetailView';
import { 
  Search, MapPin, RefreshCw, SlidersHorizontal, Save, Bookmark, 
  AlertCircle, Sparkles, X, ChevronDown, ChevronUp, Zap, Rocket, Loader2,
  CheckSquare, Filter, Briefcase, Users, Target, Activity
} from 'lucide-react';

interface Props {
  profile: BusinessProfile;
  analysis: DeepResearch | null; 
  savedLeads: Lead[];
  onSaveLead: (lead: Lead) => void;
  addAlert: (alert: any) => void;
  unlockAchievement: (title: string) => void;
  defaultRadius?: number;
  savedSearches: SavedSearch[];
  onSaveSearch: (search: SavedSearch) => void;
}

const getTagStyle = (tag: string) => {
  const t = tag.toLowerCase();
  if (t.includes('high') || t.includes('potential')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (t.includes('fast') || t.includes('urgent')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
};

// --- Enhanced Radar Animation with Telemetry ---
const ScanningRadar = ({ text, filters }: { text: string, filters: SearchFilters }) => (
  <div className="flex flex-col items-center justify-center h-full z-50 relative pointer-events-none">
    <div className="relative w-64 h-64 flex items-center justify-center mb-8">
      {/* Concentric Circles */}
      <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
      <div className="absolute inset-8 border border-blue-500/30 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
      <div className="absolute inset-16 border border-blue-500/40 rounded-full animate-pulse"></div>
      
      {/* Rotating Radar Line */}
      <div className="absolute w-full h-full rounded-full overflow-hidden">
         <div className="w-[50%] h-[50%] bg-gradient-to-br from-blue-500/40 to-transparent absolute top-0 right-0 origin-bottom-left animate-spin-slow" style={{ animationDuration: '2s' }}></div>
      </div>
      
      {/* Center Dot */}
      <div className="absolute w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
    </div>
    
    <h3 className="text-xl font-medium text-white tracking-tight">{text}</h3>
    
    <div className="mt-4 font-mono text-[10px] text-emerald-500 bg-black/50 backdrop-blur p-2 rounded border border-white/5 space-y-1 w-64">
       <div className="flex justify-between">
          <span>SCANNING_NODES:</span>
          <span>{filters.location.toUpperCase()}</span>
       </div>
       <div className="flex justify-between">
          <span>TARGET:</span>
          <span className="truncate max-w-[120px]">{filters.keywords[0]?.toUpperCase() || 'GENERAL'}</span>
       </div>
       <div className="flex justify-between">
          <span>SOURCE_UPLINK:</span>
          <span className="animate-pulse">CONNECTED</span>
       </div>
       <div className="flex justify-between">
          <span>LATENCY:</span>
          <span>{Math.floor(Math.random() * 50 + 20)}ms</span>
       </div>
    </div>
  </div>
);

const LeadFinder: React.FC<Props> = ({ profile, analysis, savedLeads, onSaveLead, addAlert, defaultRadius = 10, savedSearches, onSaveSearch }) => {
  // Auto vs Manual
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Input states
  const [keywordInput, setKeywordInput] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    location: profile.location ? profile.location.split(',')[0] : '',
    radius: `${defaultRadius}km`,
    keywords: [],
    industries: [],
    minRating: 0,
    businessSize: '',
    revenueRange: '',
    reviewSentiment: '',
    openingHours: '',
    yearsInBusiness: '',
    websiteActivity: '',
    // Smart Filters
    websiteRequired: false,
    socialRequired: false,
    b2bOptimized: false,
  });

  // Initial Strategy Population for Auto Mode
  useEffect(() => {
    if (analysis && mode === 'auto' && filters.keywords.length === 0) {
       // Pre-select some high value tags
      setFilters(prev => ({
        ...prev,
        keywords: analysis.core_services.slice(0, 3),
        industries: analysis.ideal_customer_profile.industries.slice(0, 3)
      }));
    }
  }, [analysis, mode]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Auto Mode Validation
    if (mode === 'auto') {
       if (!filters.location) {
         setSearchError("Please enter a target location for Auto Mode.");
         return;
       }
       // If no strategy selected, use defaults
       if (filters.keywords.length === 0 && filters.industries.length === 0 && analysis) {
          setFilters(prev => ({
             ...prev,
             keywords: analysis.core_services.slice(0, 3),
             industries: analysis.ideal_customer_profile.industries.slice(0, 3)
          }));
       }
    } else {
       // Manual Validation
       if (!filters.location.trim()) return;
       if (filters.keywords.length === 0 && filters.industries.length === 0) {
          setSearchError("Please add at least one keyword or industry.");
          return;
       }
    }

    // PHASE 1: Immediate Results (3 leads)
    setLoading(true);
    setLeads([]);
    setHasSearched(true);
    setSearchError(null);
    
    try {
      const activeFilters = { ...filters };
      if (mode === 'auto') {
         activeFilters.minRating = 4;
         activeFilters.websiteRequired = true; // Auto mode is stricter
      }

      // Fetch 3
      const initialResults = await generateLeads(profile, analysis, activeFilters, savedLeads, 3);
      setLeads(initialResults);
      setLoading(false); // Show results immediately

      if (initialResults.length === 0) {
        setSearchError("No verified leads found. Try expanding your radius or removing some filters.");
        return;
      }

      // PHASE 2: Background Load (22 leads)
      setBackgroundLoading(true);
      const existingIds = initialResults.map(l => l.id).concat(savedLeads.map(l => l.id));
      
      const moreResults = await generateLeads(
        profile, 
        analysis, 
        activeFilters, 
        [...savedLeads, ...initialResults], 
        22, 
        existingIds
      );
      
      setLeads(prev => [...prev, ...moreResults]);

    } catch (err) {
      console.error(err);
      if (leads.length === 0) {
        setSearchError("Search failed. AI could not verify sources.");
      }
    } finally {
      setLoading(false);
      setBackgroundLoading(false);
    }
  };
  
  const addKeyword = (k: string) => {
    if (k && !filters.keywords.includes(k)) {
      setFilters(prev => ({ ...prev, keywords: [...prev.keywords, k] }));
    }
    setKeywordInput('');
  };

  const toggleIndustry = (ind: string) => {
     if (filters.industries.includes(ind)) {
        setFilters(prev => ({ ...prev, industries: prev.industries.filter(i => i !== ind) }));
     } else {
        setFilters(prev => ({ ...prev, industries: [...prev.industries, ind] }));
     }
  };

  const toggleKeyword = (k: string) => {
     if (filters.keywords.includes(k)) {
        setFilters(prev => ({ ...prev, keywords: prev.keywords.filter(x => x !== k) }));
     } else {
        setFilters(prev => ({ ...prev, keywords: [...prev.keywords, k] }));
     }
  };

  return (
    <div className="flex h-full bg-zinc-950 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-[420px] border-r border-white/5 bg-zinc-950 flex flex-col shrink-0 h-full overflow-hidden">
         {/* Mode Switcher */}
         <div className="p-6 border-b border-white/5 shrink-0">
            <div className="flex bg-zinc-900 p-1 rounded-lg mb-4">
               <button 
                 onClick={() => setMode('auto')}
                 className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'auto' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
               >
                  <Sparkles className="w-3.5 h-3.5" /> Auto Pilot
               </button>
               <button 
                 onClick={() => setMode('manual')}
                 className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
               >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Manual
               </button>
            </div>
            
            <div className="relative">
               <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
               <input 
                  type="text" 
                  placeholder="Target City..."
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-md pl-9 pr-4 py-2 text-sm text-zinc-200 focus:border-blue-600 outline-none"
                  value={filters.location}
                  onChange={e => setFilters({...filters, location: e.target.value})}
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {mode === 'auto' ? (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                     <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                        <Rocket className="w-4 h-4" /> AI Strategy Board
                     </h3>
                     <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                        Select the strategy vectors you want to target.
                     </p>
                     
                     {analysis ? (
                       <div className="space-y-4">
                          {/* Industries */}
                          <div>
                             <span className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-500 font-bold mb-2">
                                <Briefcase className="w-3 h-3" /> Target Industries
                             </span>
                             <div className="flex flex-wrap gap-1.5">
                                {analysis.ideal_customer_profile.industries.slice(0, 5).map(ind => (
                                   <button 
                                     key={ind} 
                                     onClick={() => toggleIndustry(ind)}
                                     className={`text-[10px] px-2 py-1 rounded border transition-colors ${filters.industries.includes(ind) ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-zinc-800 text-zinc-500 border-white/5 hover:bg-zinc-700'}`}
                                   >
                                      {ind}
                                   </button>
                                ))}
                             </div>
                          </div>

                          {/* Audiences */}
                          {analysis.targetAudiences && (
                            <div>
                               <span className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-500 font-bold mb-2">
                                  <Users className="w-3 h-3" /> Target Audiences
                               </span>
                               <div className="flex flex-wrap gap-1.5">
                                  {analysis.targetAudiences.slice(0, 5).map(aud => (
                                     <button 
                                       key={aud} 
                                       onClick={() => toggleKeyword(aud)} // Treat audiences as keywords
                                       className={`text-[10px] px-2 py-1 rounded border transition-colors ${filters.keywords.includes(aud) ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-zinc-800 text-zinc-500 border-white/5 hover:bg-zinc-700'}`}
                                     >
                                        {aud}
                                     </button>
                                  ))}
                               </div>
                            </div>
                          )}

                          {/* Niches / Keywords */}
                          <div>
                             <span className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-500 font-bold mb-2">
                                <Target className="w-3 h-3" /> Niche & Keywords
                             </span>
                             <div className="flex flex-wrap gap-1.5">
                                {analysis.core_services.concat(analysis.nicheCombinations || []).slice(0, 8).map(k => (
                                   <button 
                                     key={k} 
                                     onClick={() => toggleKeyword(k)}
                                     className={`text-[10px] px-2 py-1 rounded border transition-colors ${filters.keywords.includes(k) ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-500 border-white/5 hover:bg-zinc-700'}`}
                                   >
                                      {k}
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>
                     ) : (
                       <div className="text-xs text-zinc-500 italic">Loading AI Strategy...</div>
                     )}
                  </div>
                  
                  <button 
                     onClick={() => handleSearch()}
                     disabled={loading || backgroundLoading}
                     className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {(loading || backgroundLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                     {(loading || backgroundLoading) ? 'Scanning Sector...' : 'Launch Auto-Finder'}
                  </button>
               </div>
            ) : (
               /* MANUAL MODE FORM */
               <form onSubmit={(e) => handleSearch(e)} className="space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-2">
                     <label className="text-xs font-medium text-zinc-500">Search Keywords</label>
                     <div className="flex flex-wrap gap-2 mb-2">
                       {filters.keywords.map(k => (
                         <span key={k} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20">
                           {k} <button type="button" onClick={() => setFilters(p => ({...p, keywords: p.keywords.filter(x => x !== k)}))}><X className="w-3 h-3" /></button>
                         </span>
                       ))}
                    </div>
                     <input 
                       type="text"
                       className="w-full bg-zinc-900/50 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 outline-none"
                       placeholder="Add keyword + Enter..."
                       value={keywordInput}
                       onChange={e => setKeywordInput(e.target.value)}
                       onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addKeyword(keywordInput); } }}
                     />
                  </div>
                  
                  {/* Advanced Filters Accordion */}
                  <div className="bg-zinc-900/30 border border-white/5 rounded-lg overflow-hidden">
                     <button 
                       type="button" 
                       onClick={() => setShowAdvanced(!showAdvanced)}
                       className="w-full flex items-center justify-between p-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                     >
                        <span className="flex items-center gap-2"><Filter className="w-3 h-3" /> Advanced Filters</span>
                        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                     </button>
                     
                     {showAdvanced && (
                        <div className="p-3 border-t border-white/5 space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                 <label className="text-[10px] text-zinc-500 mb-1 block">Radius</label>
                                 <select 
                                   value={filters.radius} 
                                   onChange={e => setFilters({...filters, radius: e.target.value})}
                                   className="w-full bg-zinc-900 border border-white/10 rounded text-xs px-2 py-1.5"
                                 >
                                    <option value="5km">5km</option>
                                    <option value="10km">10km</option>
                                    <option value="25km">25km</option>
                                    <option value="50km">50km</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-[10px] text-zinc-500 mb-1 block">Business Size</label>
                                 <select 
                                   value={filters.businessSize}
                                   onChange={e => setFilters({...filters, businessSize: e.target.value})}
                                   className="w-full bg-zinc-900 border border-white/10 rounded text-xs px-2 py-1.5"
                                 >
                                    <option value="">Any</option>
                                    <option value="Small">Small (1-10)</option>
                                    <option value="Medium">Medium (11-50)</option>
                                    <option value="Large">Large (50+)</option>
                                 </select>
                              </div>
                           </div>
                           
                           {/* Boolean Toggles */}
                           <div className="space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                 <div 
                                    className={`w-3 h-3 rounded border flex items-center justify-center ${filters.websiteRequired ? 'bg-blue-500 border-blue-500' : 'border-zinc-700'}`}
                                    onClick={() => setFilters(f => ({...f, websiteRequired: !f.websiteRequired}))}
                                 >
                                    {filters.websiteRequired && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                 </div>
                                 <span className="text-xs text-zinc-400 group-hover:text-zinc-200">Must have Website</span>
                              </label>
                              
                              <label className="flex items-center gap-2 cursor-pointer group">
                                 <div 
                                    className={`w-3 h-3 rounded border flex items-center justify-center ${filters.socialRequired ? 'bg-blue-500 border-blue-500' : 'border-zinc-700'}`}
                                    onClick={() => setFilters(f => ({...f, socialRequired: !f.socialRequired}))}
                                 >
                                    {filters.socialRequired && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                 </div>
                                 <span className="text-xs text-zinc-400 group-hover:text-zinc-200">Must have Socials</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer group">
                                 <div 
                                    className={`w-3 h-3 rounded border flex items-center justify-center ${filters.b2bOptimized ? 'bg-blue-500 border-blue-500' : 'border-zinc-700'}`}
                                    onClick={() => setFilters(f => ({...f, b2bOptimized: !f.b2bOptimized}))}
                                 >
                                    {filters.b2bOptimized && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                 </div>
                                 <span className="text-xs text-zinc-400 group-hover:text-zinc-200">B2B Optimized</span>
                              </label>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Smart Suggestions Manual */}
                  {analysis && (
                    <div className="p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                       <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span className="text-xs font-medium text-zinc-400">Try searching for...</span>
                       </div>
                       <div className="flex flex-wrap gap-1.5">
                          {analysis.longTailKeywords?.slice(0, 5).map(k => (
                            <button 
                              key={k}
                              type="button"
                              onClick={() => addKeyword(k)}
                              className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded border border-white/5 transition-colors"
                            >
                              + {k}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}
                  
                  <button 
                     type="submit"
                     disabled={loading || backgroundLoading}
                     className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                     {(loading || backgroundLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                     Find Leads
                  </button>
               </form>
            )}
         </div>
      </div>

      {/* Main Results Area */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
         {loading && (
           <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center">
             <ScanningRadar text={`Scanning ${filters.location}...`} filters={filters} />
           </div>
         )}
         
         {/* Results Grid */}
         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            
            {/* Background Loading Indicator */}
            {backgroundLoading && leads.length > 0 && (
               <div className="sticky top-0 z-40 mb-4 flex justify-center">
                  <div className="bg-blue-600/90 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 animate-pulse">
                     <RefreshCw className="w-3 h-3 animate-spin" />
                     Scanning deep web for more leads...
                  </div>
               </div>
            )}

            {!hasSearched && !loading ? (
               <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
                     <Search className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm">Select a mode and start finding leads.</p>
               </div>
            ) : searchError ? (
               <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <AlertCircle className="w-12 h-12 mb-4 text-rose-500 opacity-50" />
                  <p className="text-sm text-zinc-400 max-w-xs text-center mb-2">{searchError}</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                  {leads.map((lead) => (
                    <div 
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="group cursor-pointer bg-zinc-900/30 border border-white/5 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all rounded-lg overflow-hidden p-5 flex flex-col relative animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                       {/* Confidence Badge */}
                       <div className="absolute top-3 right-3 flex gap-1">
                          {lead.data_confidence.website === 'verified' && (
                             <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                <CheckSquare className="w-3 h-3" /> Verified
                             </span>
                          )}
                       </div>

                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center text-zinc-400 font-bold text-sm">
                            {lead.business_name.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                             <h3 className="text-sm font-medium text-zinc-100 group-hover:text-blue-400 transition-colors truncate w-40">{lead.business_name}</h3>
                             <p className="text-xs text-zinc-500 truncate w-40">{lead.primary_category}</p>
                          </div>
                       </div>

                       <div className="flex flex-wrap gap-1.5 mb-4 h-6 overflow-hidden">
                         {lead.tags?.slice(0, 2).map(tag => (
                           <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border ${getTagStyle(tag)}`}>
                             {tag}
                           </span>
                         ))}
                       </div>

                       <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-xs text-zinc-500">
                          <span>{lead.lead_score}% Match</span>
                          <span className="group-hover:text-zinc-300 transition-colors">View Details &rarr;</span>
                       </div>
                    </div>
                  ))}
                  
                  {/* Skeleton Loaders for Background Loading */}
                  {backgroundLoading && Array.from({ length: 6 }).map((_, i) => (
                     <div key={i} className="bg-zinc-900/20 border border-white/5 rounded-lg p-5 animate-pulse">
                        <div className="flex gap-3 mb-4">
                           <div className="w-10 h-10 bg-zinc-800/50 rounded"></div>
                           <div className="flex-1 space-y-2">
                              <div className="h-4 bg-zinc-800/50 rounded w-3/4"></div>
                              <div className="h-3 bg-zinc-800/50 rounded w-1/2"></div>
                           </div>
                        </div>
                        <div className="h-20 bg-zinc-800/30 rounded w-full"></div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>

      {selectedLead && (
        <LeadDetailPanel 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onUpdate={(updated) => setLeads(leads.map(l => l.id === updated.id ? updated : l))}
          isSaved={savedLeads.some(s => s.id === selectedLead.id)}
          onSave={() => onSaveLead(selectedLead)}
        />
      )}
    </div>
  );
};

export default LeadFinder;