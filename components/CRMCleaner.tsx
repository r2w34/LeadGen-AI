
import React, { useState, useEffect } from 'react';
import { Lead, CRMIssue } from '../types';
import { 
  Sparkles, Trash2, Merge, RefreshCw, CheckCircle, 
  AlertTriangle, ShieldCheck, Database 
} from 'lucide-react';

interface Props {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
}

const CRMCleaner: React.FC<Props> = ({ leads, onUpdateLeads }) => {
  const [issues, setIssues] = useState<CRMIssue[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const runScan = () => {
    setScanning(true);
    setScanned(false);
    
    // Simulate AI Analysis delay
    setTimeout(() => {
       const newIssues: CRMIssue[] = [];
       
       // 1. Detect Duplicates
       const nameMap = new Map<string, string[]>();
       leads.forEach(l => {
          const key = l.business_name.toLowerCase().trim();
          if (!nameMap.has(key)) nameMap.set(key, []);
          nameMap.get(key)?.push(l.id);
       });
       
       nameMap.forEach((ids, name) => {
          if (ids.length > 1) {
             newIssues.push({
                id: `dup-${name}`,
                type: 'duplicate',
                severity: 'high',
                description: `Found ${ids.length} records for "${name}"`,
                leadIds: ids,
                resolutionAction: 'merge'
             });
          }
       });

       // 2. Missing Data
       const missingEmailIds = leads.filter(l => !l.email && l.data_confidence.email === 'missing').map(l => l.id);
       if (missingEmailIds.length > 0) {
          newIssues.push({
             id: 'missing-email',
             type: 'missing_data',
             severity: 'medium',
             description: `${missingEmailIds.length} leads are missing email addresses.`,
             leadIds: missingEmailIds,
             resolutionAction: 'enrich'
          });
       }

       // 3. Stale Data
       const staleIds = leads.filter(l => l.freshness === 'Stale' || l.freshness === 'Needs Update').map(l => l.id);
       if (staleIds.length > 0) {
          newIssues.push({
             id: 'stale-data',
             type: 'stale',
             severity: 'low',
             description: `${staleIds.length} leads haven't been updated in 90+ days.`,
             leadIds: staleIds,
             resolutionAction: 'archive'
          });
       }

       setIssues(newIssues);
       setScanning(false);
       setScanned(true);
    }, 2000);
  };

  const resolveIssue = (issueId: string) => {
     const issue = issues.find(i => i.id === issueId);
     if (!issue) return;

     if (issue.type === 'duplicate') {
        // Simplified merge: Keep first, delete others
        const [keepId, ...removeIds] = issue.leadIds;
        const newLeads = leads.filter(l => !removeIds.includes(l.id));
        onUpdateLeads(newLeads);
     } else if (issue.type === 'stale') {
        // Archive logic (delete for now in this demo)
        const newLeads = leads.filter(l => !issue.leadIds.includes(l.id));
        onUpdateLeads(newLeads);
     } 
     
     // Remove issue from list
     setIssues(prev => prev.filter(i => i.id !== issueId));
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
       <div className="flex items-center justify-between mb-8">
          <div>
             <h2 className="text-2xl font-semibold text-zinc-100 flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-500" /> AI CRM Cleaner
             </h2>
             <p className="text-zinc-400 mt-1">Optimize your database health automatically.</p>
          </div>
          
          <button 
             onClick={runScan}
             disabled={scanning}
             className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${scanning ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
          >
             {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
             {scanning ? 'Scanning Database...' : 'Run AI Diagnostics'}
          </button>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-zinc-300">Data Health</span>
             </div>
             <div className="text-2xl font-semibold text-zinc-100">
                {scanned ? (issues.length > 0 ? '82%' : '100%') : '--'}
             </div>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                   <AlertTriangle className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-sm font-medium text-zinc-300">Critical Errors</span>
             </div>
             <div className="text-2xl font-semibold text-zinc-100">
                {scanned ? issues.filter(i => i.severity === 'high').length : '--'}
             </div>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                   <Merge className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-zinc-300">Optimizations</span>
             </div>
             <div className="text-2xl font-semibold text-zinc-100">
                {scanned ? issues.length : '--'}
             </div>
          </div>
       </div>

       {/* Scan Visualizer */}
       {!scanned && !scanning && (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-900/20">
             <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4 opacity-50" />
             <p className="text-zinc-500">Ready to scan {leads.length} records.</p>
          </div>
       )}

       {scanning && (
          <div className="py-20 flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-6"></div>
             <p className="text-zinc-300 font-medium">Analyzing Lead Patterns...</p>
             <p className="text-zinc-500 text-sm mt-1">Checking duplicates, email validity, and freshness.</p>
          </div>
       )}

       {scanned && (
          <div className="space-y-4">
             {issues.length === 0 ? (
                <div className="text-center py-12 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                   <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                   <h3 className="text-xl font-medium text-emerald-100">All Clean!</h3>
                   <p className="text-emerald-500/70 mt-1">Your CRM data is optimized and healthy.</p>
                </div>
             ) : (
                issues.map(issue => (
                   <div key={issue.id} className="bg-zinc-900 border border-white/10 rounded-xl p-5 flex items-center justify-between animate-slide-in-right">
                      <div className="flex items-start gap-4">
                         <div className={`mt-1 p-2 rounded-lg ${
                            issue.severity === 'high' ? 'bg-rose-500/10 text-rose-500' :
                            issue.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                         }`}>
                            {issue.type === 'duplicate' ? <Merge className="w-5 h-5" /> :
                             issue.type === 'missing_data' ? <AlertTriangle className="w-5 h-5" /> :
                             <RefreshCw className="w-5 h-5" />}
                         </div>
                         <div>
                            <h4 className="text-zinc-100 font-medium">{issue.type.replace('_', ' ').toUpperCase()}</h4>
                            <p className="text-zinc-400 text-sm mt-1">{issue.description}</p>
                            <div className="flex gap-2 mt-2">
                               {issue.leadIds.slice(0,5).map(id => {
                                  const lead = leads.find(l => l.id === id);
                                  return lead ? (
                                     <span key={id} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-white/5">
                                        {lead.business_name}
                                     </span>
                                  ) : null;
                               })}
                               {issue.leadIds.length > 5 && <span className="text-[10px] text-zinc-600 self-center">+{issue.leadIds.length - 5} more</span>}
                            </div>
                         </div>
                      </div>
                      
                      <button 
                        onClick={() => resolveIssue(issue.id)}
                        className="ml-4 px-4 py-2 bg-white text-black hover:bg-zinc-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                         {issue.resolutionAction === 'merge' ? 'Merge Records' : 
                          issue.resolutionAction === 'enrich' ? 'Auto-Enrich' : 'Archive Leads'}
                      </button>
                   </div>
                ))
             )}
          </div>
       )}
    </div>
  );
};

export default CRMCleaner;
