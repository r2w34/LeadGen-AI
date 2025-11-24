
import React from 'react';
import { X, Bell, Check, Info, AlertTriangle, Sparkles, Calendar } from 'lucide-react';
import { Alert } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<Props> = ({ isOpen, onClose, alerts, onDismiss, onClearAll }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-96 bg-zinc-950 border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
             <Bell className="w-4 h-4 text-zinc-100" />
             <h2 className="font-semibold text-zinc-100">Notifications</h2>
             <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 rounded-full">{alerts.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClearAll}
              className="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              MARK ALL READ
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {alerts.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <Bell className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">You're all caught up.</p>
             </div>
           ) : (
             alerts.map((alert) => {
               const Icon = alert.type === 'opportunity' ? Sparkles : 
                            alert.type === 'timing' ? Calendar :
                            alert.type === 'priority' ? AlertTriangle : Info;
                            
               const bgClass = alert.type === 'opportunity' ? 'bg-blue-500/10 border-blue-500/20' :
                               alert.type === 'timing' ? 'bg-amber-500/10 border-amber-500/20' :
                               alert.type === 'priority' ? 'bg-rose-500/10 border-rose-500/20' :
                               'bg-zinc-900 border-white/5';

               return (
                 <div key={alert.id} className={`p-4 rounded-lg border ${bgClass} relative group`}>
                    <div className="flex items-start gap-3">
                       <div className={`p-2 rounded-md ${bgClass.split(' ')[0]}`}>
                          <Icon className="w-4 h-4 text-zinc-200" />
                       </div>
                       <div className="flex-1">
                          <h4 className="text-sm font-medium text-zinc-100">{alert.title}</h4>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{alert.message}</p>
                          <span className="text-[10px] text-zinc-600 mt-2 block">
                             {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          
                          {alert.actionLabel && (
                            <button 
                              onClick={alert.onAction}
                              className="mt-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors border border-white/5"
                            >
                              {alert.actionLabel}
                            </button>
                          )}
                       </div>
                       <button 
                         onClick={() => onDismiss(alert.id)}
                         className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 transition-opacity"
                       >
                         <X className="w-3 h-3" />
                       </button>
                    </div>
                 </div>
               );
             })
           )}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
