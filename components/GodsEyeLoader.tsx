import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  progress?: { found: number; total: number };
  location: string;
}

export const GodsEyeLoader: React.FC<Props> = ({ progress, location }) => {
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState('INITIALIZING');

  useEffect(() => {
    if (progress) {
      const p = Math.min(100, Math.round((progress.found / progress.total) * 100));
      setPercent(p);
      if (p < 20) setStage('DISCOVERY_PHASE');
      else if (p < 50) setStage('DATA_AGGREGATION');
      else if (p < 80) setStage('VALIDATION_CHECK');
      else setStage('FINALIZING');
    } else {
      const interval = setInterval(() => {
        setPercent(prev => {
           const next = prev >= 95 ? 95 : prev + 1;
           if (next < 20) setStage('DISCOVERY_PHASE');
           else if (next < 50) setStage('DATA_AGGREGATION');
           else if (next < 80) setStage('VALIDATION_CHECK');
           else setStage('FINALIZING');
           return next;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
      <div className="relative w-24 h-24 mb-8">
         <div className="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
         <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
         <div className="absolute inset-4 rounded-full border-2 border-zinc-800 opacity-50"></div>
         <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xs font-mono font-bold text-zinc-500">{percent}%</span>
         </div>
      </div>
      
      <h3 className="text-lg font-medium text-zinc-100 mb-2">Scanning {location}</h3>
      <p className="text-xs font-mono text-blue-500 mb-4 animate-pulse">
         [{stage}]
      </p>
      
      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
         <div 
           className="h-full bg-blue-600 transition-all duration-300" 
           style={{ width: `${percent}%` }}
         ></div>
      </div>
    </div>
  );
};