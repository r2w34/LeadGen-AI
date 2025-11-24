import React, { useState } from 'react';
import { BusinessProfile, AnalysisResult } from '../types';
import { analyzeProfile } from '../services/gemini';
import { Loader2, ArrowRight } from 'lucide-react';

interface Props {
  profile: BusinessProfile;
  setProfile: (p: BusinessProfile) => void;
  setAnalysis: (a: AnalysisResult) => void;
  onComplete: () => void;
}

const BusinessProfileForm: React.FC<Props> = ({ profile, setProfile, setAnalysis, onComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await analyzeProfile(profile);
      setAnalysis(result);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const inputClass = "w-full bg-zinc-900 border border-white/10 rounded-md px-3 py-2 text-sm text-zinc-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder-zinc-600";
  const labelClass = "block text-xs font-medium text-zinc-400 mb-1.5";

  return (
    <div className="min-h-full flex items-center justify-center p-6">
       <div className="max-w-xl w-full">
          <div className="text-center mb-8">
             <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Configure Intelligence</h1>
             <p className="text-sm text-zinc-500 mt-2">Define your business parameters to optimize lead targeting.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className={labelClass}>Company Name</label>
                   <input name="companyName" required className={inputClass} value={profile.companyName} onChange={handleChange} placeholder="Acme Inc" />
                </div>
                <div>
                   <label className={labelClass}>Industry</label>
                   <input name="industry" required className={inputClass} value={profile.industry} onChange={handleChange} placeholder="SaaS" />
                </div>
             </div>

             <div>
                <label className={labelClass}>Value Proposition</label>
                <textarea name="description" rows={3} required className={inputClass} value={profile.description} onChange={handleChange} placeholder="Describe what you do..." />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className={labelClass}>Target Audience</label>
                   <input name="targetAudience" required className={inputClass} value={profile.targetAudience} onChange={handleChange} placeholder="CTOs, Dentists..." />
                </div>
                <div>
                   <label className={labelClass}>Key Keywords</label>
                   <input name="keywords" required className={inputClass} value={profile.keywords} onChange={handleChange} placeholder="software, automation..." />
                </div>
             </div>

             <button 
               type="submit" 
               disabled={loading}
               className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Initialize <ArrowRight className="w-4 h-4" /></>}
             </button>
          </form>
       </div>
    </div>
  );
};

export default BusinessProfileForm;