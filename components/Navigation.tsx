
import React from 'react';
import { 
  LayoutGrid, Search, Users, Settings, Zap, 
  Briefcase, Bell, ChevronRight, Send, Image as ImageIcon, Shield, LogOut
} from 'lucide-react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isProfileReady: boolean;
  toggleNotifications: () => void;
  unreadCount: number;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, isProfileReady, toggleNotifications, unreadCount, onLogout }) => {
  
  const menuItems = [
    { view: AppView.DASHBOARD, icon: LayoutGrid, label: "Overview" },
    { view: AppView.FINDER, icon: Search, label: "Lead Finder" },
    { view: AppView.RESULTS, icon: Users, label: "CRM" },
    { view: AppView.OUTREACH, icon: Send, label: "Outreach" },
    { view: AppView.MEDIA_STUDIO, icon: ImageIcon, label: "Media Studio" },
    { view: AppView.PROFILE, icon: Briefcase, label: "Business Profile" },
  ];

  const bottomItems = [
    { view: AppView.ADMIN, icon: Shield, label: "Admin Console" },
    { view: AppView.SETTINGS, icon: Settings, label: "Settings" },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 h-full bg-zinc-950 border-r border-white/5 flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 justify-between">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold tracking-tight">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span>LeadGen AI</span>
          </div>
          <div className="px-2 py-1 bg-zinc-900 rounded border border-white/10 text-[10px] font-medium text-zinc-500 hidden lg:block">
            ⌘K
          </div>
        </div>

        {/* Main Menu */}
        <div className="flex-1 py-6 px-3 space-y-1">
          <p className="px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Platform</p>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setView(item.view)}
              disabled={!isProfileReady && item.view !== AppView.PROFILE && item.view !== AppView.MEDIA_STUDIO}
              className={`
                w-full flex items-center h-9 rounded-md px-3 text-sm font-medium transition-colors
                ${currentView === item.view 
                  ? 'bg-zinc-900 text-zinc-100' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'}
                ${(!isProfileReady && item.view !== AppView.PROFILE && item.view !== AppView.MEDIA_STUDIO) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <item.icon className="w-4 h-4 mr-3 opacity-80" />
              {item.label}
            </button>
          ))}

          <button
             onClick={toggleNotifications}
             className="w-full flex items-center justify-between h-9 rounded-md px-3 text-sm font-medium transition-colors text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
          >
             <div className="flex items-center">
                <Bell className="w-4 h-4 mr-3 opacity-80" />
                Notifications
             </div>
             {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full h-4 min-w-[16px] flex items-center justify-center animate-pulse">
                   {unreadCount}
                </span>
             )}
          </button>

          <div className="my-6 border-t border-white/5 mx-3"></div>

          <p className="px-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">System</p>
          {bottomItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setView(item.view)}
              className={`
                w-full flex items-center h-9 rounded-md px-3 text-sm font-medium transition-colors
                ${currentView === item.view 
                  ? 'bg-zinc-900 text-zinc-100' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'}
              `}
            >
              <item.icon className="w-4 h-4 mr-3 opacity-80" />
              {item.label}
            </button>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5 flex gap-2">
          <button className="flex items-center flex-1 hover:bg-zinc-900 p-2 rounded-md transition-colors text-left group">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-medium text-white ring-2 ring-zinc-950">
               JD
             </div>
             <div className="ml-3 flex-1 overflow-hidden">
               <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white">John Doe</p>
               <p className="text-xs text-zinc-500 truncate">Pro Plan</p>
             </div>
          </button>
          <button onClick={onLogout} className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-zinc-900 rounded-md transition-colors" title="Sign Out">
             <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 z-50 flex justify-around items-center px-2">
         {[...menuItems, ...bottomItems].slice(0, 5).map((item) => (
           <button
             key={item.view}
             onClick={() => setView(item.view)}
             className={`p-2 rounded-lg flex flex-col items-center gap-1 ${
                currentView === item.view ? 'text-blue-500' : 'text-zinc-500'
             }`}
           >
             <item.icon className="w-5 h-5" />
           </button>
         ))}
         <button
             onClick={toggleNotifications}
             className="p-2 rounded-lg flex flex-col items-center gap-1 text-zinc-500 relative"
         >
             <Bell className="w-5 h-5" />
             {unreadCount > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />}
         </button>
      </div>
    </>
  );
};

export default Navigation;
