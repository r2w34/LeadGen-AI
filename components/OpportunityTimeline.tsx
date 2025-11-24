import React from 'react';
import { Activity } from '../types';
import { 
  Mail, MessageCircle, FileText, CheckCircle2, 
  PlusCircle, ArrowUpCircle, AlertCircle, Clock,
  Calendar, Phone
} from 'lucide-react';

interface Props {
  activities: Activity[];
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'email_sent': return Mail;
    case 'whatsapp_sent': return MessageCircle;
    case 'note_added': return FileText;
    case 'task_completed': return CheckCircle2;
    case 'task_created': return Calendar;
    case 'lead_created': return PlusCircle;
    case 'stage_change': return ArrowUpCircle;
    case 'info_update': return AlertCircle;
    default: return Clock;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'email_sent': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'whatsapp_sent': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'lead_created': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'stage_change': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'task_completed': return 'text-zinc-300 bg-zinc-800 border-zinc-700';
    default: return 'text-zinc-400 bg-zinc-900 border-zinc-800';
  }
};

const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const OpportunityTimeline: React.FC<Props> = ({ activities }) => {
   // Sort newest first
   const sorted = [...activities].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
   );

   return (
      <div className="relative pl-2 py-2">
         {/* Vertical Line */}
         <div className="absolute left-[19px] top-4 bottom-4 w-px bg-zinc-800" />
         
         <div className="space-y-6">
           {sorted.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                 <div key={activity.id} className="relative flex gap-4 group">
                    {/* Icon Node */}
                    <div className="z-10 relative shrink-0">
                       <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm ${colorClass} group-hover:scale-110`}>
                          <Icon className="w-4 h-4" />
                       </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 py-1.5 min-w-0">
                       <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-medium text-zinc-200 truncate pr-4">
                             {activity.type === 'lead_created' ? 'Opportunity Detected' : 
                              activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <span className="text-[10px] font-medium text-zinc-500 whitespace-nowrap tabular-nums">
                             {formatTime(activity.timestamp)}
                          </span>
                       </div>
                       <p className="text-sm text-zinc-400 leading-relaxed break-words opacity-90 group-hover:opacity-100 transition-opacity">
                          {activity.description}
                       </p>
                    </div>
                 </div>
              );
           })}

           {sorted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600 gap-3">
                 <div className="w-12 h-12 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center">
                    <Clock className="w-5 h-5 opacity-40" />
                 </div>
                 <p className="text-sm">No activity recorded yet.</p>
              </div>
           )}
         </div>
      </div>
   );
};