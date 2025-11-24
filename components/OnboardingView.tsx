
import React, { useState } from 'react';
import { findCompany, performDeepResearch } from '../services/gemini';
import { BusinessProfile, DeepResearch } from '../types';
import { Search, CheckCircle, ArrowRight, Sparkles, Globe, MapPin, AlertTriangle, RefreshCw, Building2, Users, Code2, DollarSign, Share2 } from 'lucide-react';

interface Props {
  setProfile: (p: BusinessProfile) => void;
  setResearch: (r: DeepResearch) => void;
  onComplete: () => void;
}

const OnboardingView: React.FC<Props> = ({ setProfile, setResearch, onComplete }) => {
  const [step, setStep] = useState<'input' | 'confirm' | 'analyzing'>('input');
  const [inputName, setInputName] = useState('');
  
  // Fallback states
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  const [foundProfile, setFoundProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use URL if available for Deep Verification
      const profile = await findCompany(inputName, showUrlInput ? inputUrl : undefined);
      
      if (profile) {
        setFoundProfile(profile);
        setStep('confirm');
        setError(null);
      } else {
        // Failure Logic
        if (!showUrlInput) {
           // Soft Fail: Show URL input
           setShowUrlInput(true);
        } else {
           // Hard Fail: Show retry
           setError("We searched thoroughly but couldn't verify a business entity with that name. Please check the URL or try a more specific name.");
        }
      }
    } catch (err) {
       setError("Connection failed during verification. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!foundProfile) return;
    
    setStep('analyzing');
    try {
      const research = await performDeepResearch(foundProfile);
      const fullProfile = {
        ...foundProfile,
        description: research.overview,
        keywords: research.core_services.join(', '),
        targetAudience: research.ideal_customer_profile.roles.join(', '),
        usps: research.market_position.positioning_statement,
        pricing: research.market_position.pricing_strategy_analysis,
        products: research.core_services.join(', ')
      };
      
      setProfile(fullProfile);
      setResearch(research);
      onComplete();
    } catch (err) {
      console.error(err);
      setError("Deep Analysis failed. Please try again.");
      setStep('confirm');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden p-6">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-4xl w-full text-center">
        
        {step === 'input' && (
          <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-xl shadow-blue-900/20">
                <Sparkles className="w-8 h-8 text-white" />
             </div>
             
             <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Identify Your Business</h1>
             <p className="text-zinc-400 mb-8 text-lg">Enter your company name to activate God-Eye analysis.</p>

             <form onSubmit={handleScan} className="relative group space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                       {loading && !showUrlInput ? (
                         <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <Search className="w-5 h-5 text-zinc-500" />
                       )}
                    </div>
                    <input 
                      autoFocus
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      disabled={loading}
                      className="w-full bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-xl py-4 pl-12 pr-4 text-lg text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-lg"
                      placeholder="e.g. SpaceX, Acme Corp..."
                    />
                    {!showUrlInput && (
                        <button 
                          type="submit"
                          disabled={!inputName || loading}
                          className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-medium transition-colors disabled:opacity-0"
                        >
                           {loading ? 'Scanning...' : 'Scan'}
                        </button>
                    )}
                </div>

                {/* Fallback URL Input - Shows only if initial scan fails */}
                {showUrlInput && (
                   <div className="relative animate-in fade-in slide-in-from-top-2 text-left">
                       <div className="mb-3 bg-zinc-900/50 border border-white/5 p-3 rounded-lg flex gap-3">
                          <div className="bg-blue-500/10 p-1.5 rounded text-blue-400 shrink-0 h-fit">
                             <Globe className="w-4 h-4" />
                          </div>
                          <div className="text-sm text-zinc-400">
                             <p className="font-medium text-zinc-200 mb-0.5">Verification Help Needed</p>
                             <p>We couldn't find "{inputName}" automatically. Please paste your <strong>Website URL</strong> or <strong>Google Maps Link</strong>.</p>
                          </div>
                       </div>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                              <Globe className="w-5 h-5 text-zinc-500" />
                          </div>
                          <input 
                             value={inputUrl}
                             onChange={(e) => setInputUrl(e.target.value)}
                             disabled={loading}
                             className="w-full bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-xl py-4 pl-12 pr-28 text-lg text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-lg"
                             placeholder="https://..."
                          />
                          <button 
                             type="submit"
                             disabled={!inputUrl || loading}
                             className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
                           >
                              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify'}
                           </button>
                       </div>
                   </div>
                )}
             </form>

             {error && (
                <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-left animate-in fade-in">
                   <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                         <p className="text-sm text-rose-200 font-medium mb-1">Verification Failed</p>
                         <p className="text-xs text-rose-300/80 leading-relaxed">{error}</p>
                      </div>
                   </div>
                   {showUrlInput && (
                      <button 
                        type="button"
                        onClick={() => handleScan()}
                        disabled={loading}
                        className="mt-3 w-full flex items-center justify-center gap-2 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-2 rounded transition-colors border border-rose-500/20"
                      >
                         <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Retry Deep Scan
                      </button>
                   )}
                </div>
             )}
          </div>
        )}

        {step === 'confirm' && foundProfile && (
          <div className="animate-in fade-in scale-in-95 duration-500 w-full max-w-3xl mx-auto">
             <div className="text-center mb-8">
               <h2 className="text-3xl font-semibold text-white">Confirm Entity Analysis</h2>
               <p className="text-zinc-400 mt-2">We found the following deep intelligence profile. Is this accurate?</p>
             </div>
             
             <div className="bg-zinc-900 border border-white/10 rounded-2xl p-0 mb-8 text-left shadow-2xl relative overflow-hidden">
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-zinc-800 to-zinc-900 border-b border-white/5 p-6 flex items-end relative">
                   <div className="absolute top-6 right-6">
                      <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> VERIFIED ENTITY
                      </div>
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{foundProfile.companyName}</h3>
                      <div className="flex items-center gap-3 text-sm text-zinc-400">
                         <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {foundProfile.industry}</span>
                         <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {foundProfile.location}</span>
                         <a href={foundProfile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline"><Globe className="w-3.5 h-3.5" /> Website</a>
                      </div>
                   </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                   
                   <div className="p-6 space-y-6">
                      <div>
                         <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</h4>
                         <p className="text-sm text-zinc-300 leading-relaxed">{foundProfile.description}</p>
                      </div>
                      
                      <div>
                         <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Key People
                         </h4>
                         <div className="space-y-2">
                            {foundProfile.founders && foundProfile.founders.length > 0 ? (
                               foundProfile.founders.map((f, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                     <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">{f.charAt(0)}</div>
                                     {f} <span className="text-zinc-500 text-xs ml-auto">Founder</span>
                                  </div>
                               ))
                            ) : (
                               <span className="text-sm text-zinc-500 italic">No public leadership data found.</span>
                            )}
                         </div>
                      </div>
                   </div>

                   <div className="p-6 space-y-6">
                      <div>
                         <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Code2 className="w-3.5 h-3.5" /> Tech Stack
                         </h4>
                         <div className="flex flex-wrap gap-1.5">
                            {foundProfile.techStack && foundProfile.techStack.length > 0 ? (
                               foundProfile.techStack.map((tech, i) => (
                                  <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-xs">{tech}</span>
                               ))
                            ) : (
                               <span className="text-sm text-zinc-500 italic">Scanning...</span>
                            )}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                               <DollarSign className="w-3.5 h-3.5" /> Revenue
                            </h4>
                            <p className="text-sm text-white font-medium">{foundProfile.financials?.revenueRange || 'Est. unavailable'}</p>
                         </div>
                         <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                               <Share2 className="w-3.5 h-3.5" /> Socials
                            </h4>
                            <div className="flex gap-2">
                               {foundProfile.socialProfiles?.linkedin && <a href={foundProfile.socialProfiles.linkedin} target="_blank" className="p-1.5 bg-zinc-800 rounded hover:bg-blue-600 hover:text-white transition-colors"><Globe className="w-3 h-3" /></a>}
                               {foundProfile.socialProfiles?.twitter && <a href={foundProfile.socialProfiles.twitter} target="_blank" className="p-1.5 bg-zinc-800 rounded hover:bg-blue-400 hover:text-white transition-colors"><Globe className="w-3 h-3" /></a>}
                            </div>
                         </div>
                      </div>
                   </div>

                </div>
             </div>

             <div className="flex gap-3 max-w-lg mx-auto">
                <button 
                  onClick={() => {
                     setStep('input');
                     setShowUrlInput(false);
                     setInputUrl('');
                     setError(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
                >
                   Incorrect, Search Again
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-900/20"
                >
                   Confirm & Analyze <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
             </div>
          </div>
        )}

        {step === 'analyzing' && (
           <div className="text-center animate-in fade-in duration-500">
              <div className="relative w-32 h-32 mx-auto mb-8">
                 <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                 <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                 <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Initializing Command Center</h2>
              <p className="text-zinc-400">
                 Building Ideal Customer Profiles (ICP), generating keyword strategy,<br/>
                 and configuring the CRM based on {foundProfile?.companyName}'s DNA...
              </p>
           </div>
        )}

      </div>
    </div>
  );
};

export default OnboardingView;
