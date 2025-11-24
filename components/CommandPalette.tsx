
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Zap, Users, LayoutGrid, Settings, 
  ArrowRight, Command, Sparkles 
} from 'lucide-react';
import { AppView, Lead } from '../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  setView: (view: AppView) => void;
  savedLeads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const CommandPalette: React.FC<Props> = ({ isOpen, setIsOpen, setView, savedLeads, onSelectLead }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle via Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setIsOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigationItems = [
    { label: 'Go to Dashboard', icon: LayoutGrid, action: () => setView(AppView.DASHBOARD) },
    { label: 'Lead Finder', icon: Search, action: () => setView(AppView.FINDER) },
    { label: 'CRM Pipeline', icon: Users, action: () => setView(AppView.RESULTS) },
    { label: 'AI Data Cleaner', icon: Sparkles, action: () => setView(AppView.CLEANER) },
    { label: 'Settings', icon: Settings, action: () => setView(AppView.SETTINGS) },
  ];

  const filteredLeads = savedLeads.filter(l => 
    l.business_name.toLowerCase().includes(query.toLowerCase()) ||
    l.primary_category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const hasQuery = query.length > 0;
  
  const allItems = hasQuery 
    ? [...filteredLeads.map(l => ({ type: 'lead', data: l })), ...navigationItems.map(n => ({ type: 'nav', data: n }))]
    : navigationItems.map(n => ({ type: 'nav', data: n }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item) {
        if (item.type === 'nav') {
          (item.data as any).action();
        } else {
          onSelectLead(item.data as Lead);
        }
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-slide-in">
        
        {/* Search Input */}
        <div className="flex items-center h-14 px-4 border-b border-white/5">
          <Search className="w-5 h-5 text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search leads..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 px-4 placeholder:text-zinc-600 h-full"
          />
          <div className="px-2 py-1 bg-zinc-900 rounded border border-white/10 text-[10px] font-medium text-zinc-500">
            ESC
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          
          {/* Navigation Section */}
          {!hasQuery && <div className="px-4 py-2 text-xs font-medium text-zinc-500">Suggested</div>}
          
          {allItems.map((item, idx) => {
             const isSelected = idx === selectedIndex;
             
             if (item.type === 'nav') {
                const nav = item.data as any;
                return (
                  <button
                    key={nav.label}
                    onClick={() => { nav.action(); setIsOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${isSelected ? 'bg-blue-600/10 border-l-2 border-blue-500' : 'hover:bg-zinc-900 border-l-2 border-transparent'}`}
                  >
                    <div className="flex items-center gap-3">
                       <nav.icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-zinc-500'}`} />
                       <span className={`text-sm font-medium ${isSelected ? 'text-blue-100' : 'text-zinc-300'}`}>{nav.label}</span>
                    </div>
                    {isSelected && <ArrowRight className="w-4 h-4 text-blue-500" />}
                  </button>
                );
             } else {
                const lead = item.data as Lead;
                return (
                   <button
                    key={lead.id}
                    onClick={() => { onSelectLead(lead); setIsOpen(false); }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${isSelected ? 'bg-blue-600/10 border-l-2 border-blue-500' : 'hover:bg-zinc-900 border-l-2 border-transparent'}`}
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                          {lead.business_name.substring(0,2).toUpperCase()}
                       </div>
                       <div>
                          <span className={`block text-sm font-medium ${isSelected ? 'text-blue-100' : 'text-zinc-300'}`}>{lead.business_name}</span>
                          <span className="block text-xs text-zinc-500">{lead.primary_category} • {lead.lead_score}% Match</span>
                       </div>
                    </div>
                    <span className="text-xs text-zinc-600">Jump to Lead</span>
                  </button>
                )
             }
          })}
          
          {allItems.length === 0 && (
             <div className="px-6 py-8 text-center text-zinc-500">
                <p className="text-sm">No results found.</p>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 border-t border-white/5 bg-zinc-900/50 flex items-center px-4 justify-between">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                 <Command className="w-3 h-3" /> Actions
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                 <Users className="w-3 h-3" /> Leads
              </span>
           </div>
           <div className="text-[10px] text-zinc-600">
              LeadGen AI v1.0
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
