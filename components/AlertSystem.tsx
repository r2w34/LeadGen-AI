import React from 'react';
import { X } from 'lucide-react';
import { Alert } from '../types';

interface Props {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

const AlertSystem: React.FC<Props> = ({ alerts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {alerts.map((alert) => (
        <div 
          key={alert.id}
          className="bg-zinc-900 border border-white/10 shadow-xl rounded-lg p-4 w-80 animate-slide-in flex items-start gap-3"
        >
           <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
              alert.type === 'priority' ? 'bg-rose-500' : 
              alert.type === 'opportunity' ? 'bg-blue-500' : 'bg-emerald-500'
           }`} />
           <div className="flex-1">
              <h4 className="text-sm font-medium text-zinc-100">{alert.title}</h4>
              <p className="text-xs text-zinc-500 mt-1">{alert.message}</p>
           </div>
           <button onClick={() => onDismiss(alert.id)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
           </button>
        </div>
      ))}
    </div>
  );
};

export default AlertSystem;