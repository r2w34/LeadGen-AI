
import React, { useState } from 'react';
import { OutreachCampaign, OutreachTemplate, Lead, OutreachSequence, SMTPConfig } from '../types';
import { 
  Send, Mail, MessageCircle, BarChart2, FileText, 
  Plus, Play, Pause, Trash2, Edit2, Zap, ArrowUpRight,
  Server, Settings, Workflow, Clock, CheckCircle
} from 'lucide-react';

interface Props {
  leads: Lead[];
  templates: OutreachTemplate[];
  onSaveTemplate: (t: OutreachTemplate) => void;
  campaigns: OutreachCampaign[];
  onCreateCampaign: (c: OutreachCampaign) => void;
  sequences: OutreachSequence[];
  onSaveSequence: (s: OutreachSequence) => void;
  smtpConfig: SMTPConfig | null;
  onSaveSMTP: (c: SMTPConfig) => void;
}

const OutreachCenter: React.FC<Props> = ({ leads, templates, onSaveTemplate, campaigns, onCreateCampaign, sequences, onSaveSequence, smtpConfig, onSaveSMTP }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'sequences' | 'templates' | 'settings'>('dashboard');
  
  // SMTP Form State
  const [smtpForm, setSmtpForm] = useState<SMTPConfig>(smtpConfig || {
     id: 'smtp-1', provider: 'Gmail', host: 'smtp.gmail.com', port: 587, user: '', pass: '', secure: true, fromEmail: '', fromName: '', status: 'Unverified'
  });

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
       {/* Header */}
       <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
             </div>
             <h1 className="text-lg font-semibold text-white">Outreach Command</h1>
          </div>
          <div className="flex gap-4">
             {['dashboard', 'campaigns', 'sequences', 'templates', 'settings'].map(tab => (
                <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                   {tab}
                </button>
             ))}
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {activeTab === 'dashboard' && (
             <div className="animate-in fade-in duration-300 space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Total Sent</p>
                      <div className="text-3xl font-bold text-white">1,248</div>
                      <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><ArrowUpRight className="w-3 h-3" /> +12% this week</div>
                   </div>
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Open Rate</p>
                      <div className="text-3xl font-bold text-white">42.5%</div>
                      <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1"><ArrowUpRight className="w-3 h-3" /> Industry avg: 22%</div>
                   </div>
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Automated Actions</p>
                      <div className="text-3xl font-bold text-indigo-400">856</div>
                   </div>
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-2">SMTP Health</p>
                      <div className="flex items-center gap-2 mt-1">
                         <div className={`w-2 h-2 rounded-full ${smtpConfig?.status === 'Verified' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                         <span className="text-lg font-bold text-white">{smtpConfig?.status || 'No Config'}</span>
                      </div>
                   </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-zinc-200 mb-4">Active Sequences</h3>
                      <div className="space-y-3">
                         {sequences.length > 0 ? sequences.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-lg">
                               <div>
                                  <div className="font-medium text-sm text-zinc-200">{s.name}</div>
                                  <div className="text-xs text-zinc-500">{s.steps.length} Steps • {s.triggers.join(', ')}</div>
                               </div>
                               <div className="text-right">
                                  <span className={`text-xs font-bold ${s.status === 'Active' ? 'text-emerald-400' : 'text-zinc-500'}`}>{s.status}</span>
                               </div>
                            </div>
                         )) : <div className="text-zinc-500 text-sm">No active sequences. Create one in the Sequences tab.</div>}
                      </div>
                   </div>

                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-zinc-200 mb-4">Template Performance</h3>
                      <div className="space-y-3">
                         {templates.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-lg">
                               <div className="flex items-center gap-3">
                                  {t.type === 'Email' ? <Mail className="w-4 h-4 text-blue-400" /> : <MessageCircle className="w-4 h-4 text-emerald-400" />}
                                  <div className="font-medium text-sm text-zinc-200">{t.name}</div>
                               </div>
                               <div className="text-xs text-zinc-400">
                                  {t.stats?.openRate || 0}% Open
                               </div>
                            </div>
                         ))}
                         {templates.length === 0 && <div className="text-zinc-500 text-sm">No templates saved.</div>}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'sequences' && (
             <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-white">Auto-Follow Up Sequences</h2>
                   <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" /> New Sequence
                   </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {sequences.map(s => (
                      <div key={s.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <h3 className="font-bold text-white text-lg">{s.name}</h3>
                               <p className="text-sm text-zinc-500">Triggers on: {s.triggers.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-zinc-400" /></button>
                               <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-zinc-400" /></button>
                            </div>
                         </div>
                         
                         <div className="relative pl-4 border-l border-zinc-800 space-y-6">
                            {s.steps.map((step, i) => (
                               <div key={step.id} className="relative">
                                  <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-indigo-500 border-2 border-zinc-950"></div>
                                  <div className="bg-zinc-950 border border-white/5 rounded-lg p-4">
                                     <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-indigo-400 uppercase">Step {i+1} • Day {step.delayDays}</span>
                                        <span className="text-xs bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded">{step.type}</span>
                                     </div>
                                     <p className="text-sm text-zinc-300 font-medium">{step.subject || "No Subject"}</p>
                                     <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{step.body}</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                   {sequences.length === 0 && (
                      <div className="text-center py-12 bg-zinc-900/30 border border-white/5 rounded-xl border-dashed">
                         <Workflow className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                         <p className="text-zinc-500">No sequences yet. Create one to automate your outreach.</p>
                      </div>
                   )}
                </div>
             </div>
          )}

          {activeTab === 'templates' && (
             <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-white">Message Templates</h2>
                   <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" /> New Template
                   </button>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                   {templates.map(t => (
                      <div key={t.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                         <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg ${t.type === 'Email' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                               {t.type === 'Email' ? <Mail className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                            </div>
                            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-white/5">{t.tone}</span>
                         </div>
                         <h3 className="font-medium text-zinc-200 mb-2">{t.name}</h3>
                         <p className="text-xs text-zinc-500 line-clamp-3 mb-4">{t.body}</p>
                         <div className="flex items-center gap-4 pt-4 border-t border-white/5 text-xs text-zinc-400">
                            <span>{t.stats?.sent || 0} Sent</span>
                            <span>{t.stats?.replyRate || 0}% Reply</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="animate-in fade-in duration-300 max-w-2xl">
                <h2 className="text-xl font-bold text-white mb-6">SMTP Configuration</h2>
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="block text-xs font-medium text-zinc-400 mb-1">Provider</label>
                         <select 
                            value={smtpForm.provider} 
                            onChange={e => setSmtpForm({...smtpForm, provider: e.target.value as any})}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                         >
                            <option>Gmail</option>
                            <option>Outlook</option>
                            <option>Custom</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-zinc-400 mb-1">SMTP Host</label>
                         <input 
                            value={smtpForm.host} 
                            onChange={e => setSmtpForm({...smtpForm, host: e.target.value})}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="block text-xs font-medium text-zinc-400 mb-1">Username / Email</label>
                         <input 
                            value={smtpForm.user} 
                            onChange={e => setSmtpForm({...smtpForm, user: e.target.value})}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-zinc-400 mb-1">Password / App Password</label>
                         <input 
                            type="password"
                            value={smtpForm.pass} 
                            onChange={e => setSmtpForm({...smtpForm, pass: e.target.value})}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                         />
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="block text-xs font-medium text-zinc-400 mb-1">Sender Name</label>
                         <input 
                            value={smtpForm.fromName} 
                            onChange={e => setSmtpForm({...smtpForm, fromName: e.target.value})}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-zinc-400 mb-1">Port</label>
                         <input 
                            type="number"
                            value={smtpForm.port} 
                            onChange={e => setSmtpForm({...smtpForm, port: parseInt(e.target.value)})}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white"
                         />
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                         {smtpConfig?.status === 'Verified' ? (
                            <span className="text-emerald-500 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Verified</span>
                         ) : (
                            <span className="text-zinc-500 text-sm">Unverified</span>
                         )}
                      </div>
                      <div className="flex gap-3">
                         <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">Test Connection</button>
                         <button 
                            onClick={() => onSaveSMTP({...smtpForm, status: 'Verified'})}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                         >
                            Save Configuration
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default OutreachCenter;
