
import React, { useState } from 'react';
import { Lead, LeadStage } from '../types';
import LeadDetailPanel from './LeadDetailView';
import { MoreHorizontal } from 'lucide-react';

interface Props {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  customLists: any[];
  onCreateList: any;
  onDeleteList: any;
  onAddLeadToList: any;
}

const getTagStyle = (tag: string) => {
  const t = tag.toLowerCase();
  if (t.includes('high') || t.includes('potential')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (t.includes('fast') || t.includes('urgent')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
};

const CRMBoard: React.FC<Props> = ({ leads, onUpdateLead }) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const stages: LeadStage[] = ['New', 'Contacted', 'Interested', 'Won'];

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-zinc-100">Pipeline</h2>
      </div>

      <div className="flex-1 overflow-x-auto flex gap-6 pb-4">
        {stages.map(stage => (
          <div key={stage} className="w-80 flex-shrink-0 flex flex-col">
             <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-medium text-zinc-400">{stage}</span>
                <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">
                   {leads.filter(l => l.stage === stage).length}
                </span>
             </div>
             
             <div className="flex-1 bg-zinc-900/30 rounded-lg p-2 space-y-2 overflow-y-auto">
                {leads.filter(l => l.stage === stage).map(lead => (
                   <div 
                     key={lead.id}
                     onClick={() => setSelectedLead(lead)}
                     className="bg-zinc-950 border border-white/5 p-3 rounded shadow-sm hover:border-zinc-700 cursor-pointer transition-colors group"
                   >
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-sm font-medium text-zinc-200">{lead.business_name}</span>
                         <MoreHorizontal className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="text-xs text-zinc-500 mb-2">{lead.primary_category}</div>
                      
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {lead.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border ${getTagStyle(tag)}`}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] px-1.5 py-0.5 rounded border ${lead.lead_score > 70 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                            {lead.lead_score}% Match
                         </span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        ))}
      </div>

      {selectedLead && (
         <LeadDetailPanel 
           lead={selectedLead} 
           onClose={() => setSelectedLead(null)} 
           onUpdate={onUpdateLead}
           isSaved={true}
         />
      )}
    </div>
  );
};

export default CRMBoard;
