
import React, { useState } from 'react';
import { Lead, Note, OutreachSequence } from '../types';
import { OpportunityTimeline } from './OpportunityTimeline';
import GodEyePanel from './GodEyePanel';
import { performGodEyeAnalysis } from '../services/gemini';
import { GodEyeData, BusinessProfile } from '../types';
import { 
  X, Globe, Phone, Mail, MapPin, 
  MessageCircle, LayoutDashboard, History, Tag,
  ShieldCheck, ExternalLink, AlertTriangle, Flag, Eye, Loader2,
  TrendingUp, BarChart3, Database, Zap, UserPlus, Send, MessageSquare, Users,
  Workflow, Play, Pause, Save
} from 'lucide-react';

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
  isSaved: boolean;
  onSave?: () => void;
  sequences?: OutreachSequence[]; // Passed from App
}

const getTagStyle = (tag: string) => {
  const t = tag.toLowerCase();
  if (t.includes('high') || t.includes('potential') || t.includes('verified')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (t.includes('fast') || t.includes('urgent') || t.includes('response')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  if (t.includes('competition') || t.includes('low')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (t.includes('hiring') || t.includes('warm')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  return 'bg-zinc-800 text-zinc-400 border-zinc-700';
};

const LeadDetailPanel: React.FC<Props> = ({ lead, onClose, onUpdate, isSaved, onSave, sequences = [] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'enrichment' | 'team' | 'automation'>('overview');
  const [noteInput, setNoteInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  
  // God Eye State
  const [godEyeData, setGodEyeData] = useState<GodEyeData | null>(null);
  const [isLoadingGodEye, setIsLoadingGodEye] = useState(false);
  const [showGodEye, setShowGodEye] = useState(false);

  const activateGodEye = async () => {
    if (godEyeData) {
      setShowGodEye(true);
      return;
    }
    setIsLoadingGodEye(true);
    try {
      const tempProfile: BusinessProfile = {
        companyName: lead.business_name,
        description: lead.matching_reason || '',
        website: lead.website,
        location: lead.address,
        industry: lead.primary_category,
        keywords: '',
        usps: '',
        pricing: ''
      };

      const data = await performGodEyeAnalysis(tempProfile);
      setGodEyeData(data);
      setShowGodEye(true);
    } catch (e) {
      console.error("God Eye Scan Failed", e);
    } finally {
      setIsLoadingGodEye(false);
    }
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: noteInput,
      author: 'You',
      createdAt: new Date().toISOString()
    };
    
    const updatedLead = {
      ...lead,
      notes: [newNote, ...(lead.notes || [])],
      activityTimeline: [
        { 
          id: `act-note-${Date.now()}`, 
          type: 'note_added', 
          description: `Added note: "${noteInput.substring(0, 30)}..."`, 
          timestamp: new Date().toISOString(),
          user: 'You'
        } as any,
        ...(lead.activityTimeline || [])
      ]
    };
    onUpdate(updatedLead);
    setNoteInput('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && tagInput.trim()) {
        const newTag = tagInput.trim();
        if (!lead.tags.includes(newTag)) {
           onUpdate({
              ...lead,
              tags: [...(lead.tags || []), newTag],
              activityTimeline: [
                 {
                    id: `act-tag-${Date.now()}`,
                    type: 'info_update',
                    description: `Added tag: ${newTag}`,
                    timestamp: new Date().toISOString(),
                    user: 'You'
                 } as any,
                 ...(lead.activityTimeline || [])
              ]
           });
        }
        setTagInput('');
     }
  };

  const removeTag = (tagToRemove: string) => {
     onUpdate({
        ...lead,
        tags: lead.tags.filter(t => t !== tagToRemove)
     });
  };

  return (
    <div className="absolute inset-0 z-50 flex justify-end bg-zinc-950/60 backdrop-blur-sm">
      <div className="w-full md:w-[600px] h-full bg-zinc-950 border-l border-white/5 flex flex-col shadow-2xl animate-slide-in-right">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-zinc-950/50 backdrop-blur-xl z-20">
           <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 font-medium text-xs border border-white/5">
                 {lead.business_name.substring(0,2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h2 className="font-semibold text-zinc-100 truncate">{lead.business_name}</h2>
                {lead.data_confidence?.website === 'verified' && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                    <ShieldCheck className="w-3 h-3" /> Verified Business
                  </span>
                )}
              </div>
           </div>
           <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-0 border-b border-white/5 flex items-center justify-between shrink-0">
           <div className="flex gap-6 overflow-x-auto no-scrollbar">
               {['overview', 'enrichment', 'team', 'automation', 'activity'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-3 text-sm font-medium transition-colors relative capitalize whitespace-nowrap ${activeTab === tab ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                     {tab}
                     {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />}
                  </button>
               ))}
           </div>
           
           <button 
              onClick={activateGodEye}
              disabled={isLoadingGodEye}
              className={`pb-2 flex items-center gap-2 text-xs font-bold transition-colors ${isLoadingGodEye ? 'text-blue-400' : 'text-zinc-500 hover:text-blue-400'}`}
           >
              {isLoadingGodEye ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              {isLoadingGodEye ? 'SCANNING...' : 'GOD EYE'}
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
           
           {activeTab === 'overview' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4">
                   <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Predictive Score</p>
                      <div className="flex items-end gap-1">
                         <p className="text-2xl font-semibold text-zinc-200">{lead.predictive_score?.score || lead.lead_score}</p>
                         <span className="text-[10px] text-zinc-500 mb-1">/100</span>
                      </div>
                   </div>
                   <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Intent</p>
                      <p className={`text-xl font-semibold ${lead.intent_label === 'High' ? 'text-emerald-400' : 'text-zinc-200'}`}>{lead.intent_label}</p>
                   </div>
                   <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider mb-1">Confidence</p>
                      <p className="text-xl font-semibold text-zinc-200">{lead.predictive_score?.confidence || 85}%</p>
                   </div>
                </div>

                {/* Score Breakdown */}
                {lead.predictive_score && (
                   <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 rounded-lg p-5">
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                         <BarChart3 className="w-4 h-4" /> AI Match Factors
                      </h3>
                      <p className="text-sm text-zinc-300 mb-4">{lead.predictive_score.explanation}</p>
                      <div className="space-y-2">
                         {lead.predictive_score.top_factors.map((factor, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                               <span className="text-zinc-400">{factor.factor}</span>
                               <span className={factor.influence === 'Positive' ? 'text-emerald-400' : 'text-rose-400'}>{factor.influence}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Tags */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Tag className="w-3.5 h-3.5" /> Tags
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                     {lead.tags && lead.tags.map(tag => (
                        <span key={tag} className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getTagStyle(tag)} flex items-center gap-1.5 group`}>
                           {tag}
                           <button onClick={() => removeTag(tag)} className="hover:text-white"><X className="w-3 h-3" /></button>
                        </span>
                     ))}
                     <input 
                        className="bg-transparent border border-white/10 rounded-md px-2 py-1 text-xs text-zinc-200 outline-none focus:border-blue-500 w-24"
                        placeholder="+ Add Tag"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                     />
                  </div>
                </div>
                
                {/* Details */}
                <div className="space-y-4 border-t border-white/5 pt-4">
                   <div className="flex justify-between">
                      <span className="text-sm text-zinc-500">Website</span>
                      <a href={lead.website} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline truncate max-w-[200px]">{lead.website}</a>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-sm text-zinc-500">Location</span>
                      <span className="text-sm text-zinc-300 truncate max-w-[200px]">{lead.address}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-sm text-zinc-500">Phone</span>
                      <span className="text-sm text-zinc-300">{lead.phone || 'N/A'}</span>
                   </div>
                </div>

             </div>
           )}

           {activeTab === 'automation' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-5">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Workflow className="w-4 h-4" /> Active Sequence
                  </h3>
                  
                  {lead.activeSequenceId ? (
                     <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-indigo-400">
                              {sequences.find(s => s.id === lead.activeSequenceId)?.name || 'Unknown Sequence'}
                           </span>
                           <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded">{lead.sequenceStatus}</span>
                        </div>
                        <p className="text-sm text-zinc-300 mb-3">Next step scheduled for: {new Date(lead.nextScheduledStep || Date.now()).toLocaleDateString()}</p>
                        <div className="flex gap-2">
                           <button className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-white transition-colors flex items-center justify-center gap-1">
                              <Pause className="w-3 h-3" /> Pause
                           </button>
                           <button className="flex-1 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-medium transition-colors">
                              Cancel
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-6">
                        <p className="text-sm text-zinc-500 mb-4">Lead is not currently in any automated sequence.</p>
                        <div className="space-y-2">
                           {sequences.length > 0 ? sequences.map(s => (
                              <button 
                                key={s.id}
                                className="w-full flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-lg transition-colors group"
                              >
                                 <span className="text-sm text-zinc-300 font-medium">{s.name}</span>
                                 <Play className="w-4 h-4 text-zinc-600 group-hover:text-indigo-500" />
                              </button>
                           )) : (
                              <p className="text-xs text-zinc-600 italic">Create sequences in Outreach Center first.</p>
                           )}
                        </div>
                     </div>
                  )}
               </div>
             </div>
           )}

           {activeTab === 'team' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-5">
                   <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Assignment
                   </h3>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                            ME
                         </div>
                         <div>
                            <p className="text-sm font-medium text-zinc-200">Assigned to You</p>
                            <p className="text-xs text-zinc-500">Lead Owner</p>
                         </div>
                      </div>
                      <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">Change</button>
                   </div>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-5">
                   <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Team Notes
                   </h3>
                   
                   <div className="space-y-4 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                      {lead.notes?.length > 0 ? (
                         lead.notes.map(note => (
                            <div key={note.id} className="bg-zinc-950 p-3 rounded-lg border border-white/5">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-blue-400">{note.author}</span>
                                  <span className="text-[10px] text-zinc-600">{new Date(note.createdAt).toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm text-zinc-300">{note.content}</p>
                            </div>
                         ))
                      ) : (
                         <div className="text-center py-6 text-zinc-500 text-sm">No notes yet.</div>
                      )}
                   </div>

                   <div className="flex gap-2">
                      <input 
                         value={noteInput}
                         onChange={e => setNoteInput(e.target.value)}
                         className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none"
                         placeholder="Add a note..."
                         onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      />
                      <button 
                         onClick={handleAddNote}
                         disabled={!noteInput.trim()}
                         className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                      >
                         <Send className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'enrichment' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-zinc-900/50 p-5 rounded-lg border border-white/5">
                   <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Firmographics</h3>
                   <div className="space-y-3">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-sm text-zinc-400">Employees</span>
                         <span className="text-sm text-zinc-200">{lead.enrichment_data?.employee_count_range || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-sm text-zinc-400">Activity Level</span>
                         <span className="text-sm text-zinc-200">{lead.enrichment_data?.online_activity_level || 'Low'}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                         <span className="text-sm text-zinc-400">Social Score</span>
                         <span className="text-sm text-zinc-200">{lead.enrichment_data?.social_presence_score}/100</span>
                      </div>
                   </div>
                </div>

                <div className="bg-zinc-900/50 p-5 rounded-lg border border-white/5">
                   <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Verified Sources</h3>
                   <div className="space-y-3">
                      {Object.entries(lead.source_map || {}).map(([field, info]: [string, any], i) => (
                         <div key={i} className="flex justify-between items-center">
                            <span className="text-sm text-zinc-400 capitalize">{field}</span>
                            <div className="text-right">
                               <span className="text-xs text-zinc-200 block">{info.source}</span>
                               <span className="text-[10px] text-emerald-500">{info.confidence}% Confidence</span>
                            </div>
                         </div>
                      ))}
                      {(!lead.source_map || Object.keys(lead.source_map).length === 0) && (
                         <span className="text-sm text-zinc-500">Source map unavailable.</span>
                      )}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'activity' && (
             <div className="animate-in fade-in duration-300">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Opportunity Timeline</h3>
                <OpportunityTimeline activities={lead.activityTimeline} />
             </div>
           )}

        </div>

        {/* Footer with Live Actions */}
        <div className="h-16 border-t border-white/5 px-6 flex items-center justify-between shrink-0 bg-zinc-950 z-20">
           {!isSaved && onSave ? (
              <button 
                onClick={() => { onSave(); onClose(); }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                 <Save className="w-4 h-4" /> Save to CRM Pipeline
              </button>
           ) : (
             <div className="flex gap-3 w-full">
                <a 
                   href={lead.smtp_email ? `mailto:${lead.smtp_email.to}?subject=${encodeURIComponent(lead.smtp_email.subject)}&body=${encodeURIComponent(lead.smtp_email.body_text)}` : '#'}
                   className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 group ${lead.email ? 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white' : 'opacity-50 cursor-not-allowed border-zinc-800 text-zinc-600'}`}
                >
                   <Mail className="w-4 h-4" /> Email
                </a>
                
                <a 
                   href={lead.whatsapp_link || '#'}
                   target="_blank"
                   rel="noreferrer"
                   className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 group ${lead.whatsapp_link ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400' : 'opacity-50 cursor-not-allowed border-zinc-800 text-zinc-600'}`}
                >
                   <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
             </div>
           )}
        </div>

        {showGodEye && godEyeData && (
            <div className="fixed inset-0 z-[60]">
               <GodEyePanel data={godEyeData} onClose={() => setShowGodEye(false)} />
            </div>
        )}

      </div>
    </div>
  );
};

export default LeadDetailPanel;
