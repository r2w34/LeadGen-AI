
import React, { useState } from 'react';
import { UserSettings, BusinessProfile } from '../types';
import { 
  Cpu, Layout, Bell, Shield, Database, Save, 
  RefreshCw, Power, Monitor, Smartphone, Globe,
  Terminal, Eye, Key, Moon, Sun, Laptop,
  CheckCircle, Plus, Trash2, Smartphone as MobileIcon,
  ToggleLeft, ToggleRight
} from 'lucide-react';

// --- Helper Components ---

const SectionHeader = ({ title, description }: { title: string, description: string }) => (
   <div className="mb-6">
      <h3 className="text-lg font-medium text-zinc-100">{title}</h3>
      <p className="text-sm text-zinc-500">{description}</p>
   </div>
);

const SettingCard = ({ label, description, children }: { label: string, description: string, children?: React.ReactNode }) => (
   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
      <div className="mb-4">
         <h4 className="text-sm font-medium text-zinc-200">{label}</h4>
         <p className="text-xs text-zinc-500">{description}</p>
      </div>
      {children}
   </div>
);

const ToggleSetting = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (v: boolean) => void }) => (
   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 flex items-center justify-between cursor-pointer" onClick={() => onChange(!checked)}>
      <div>
         <h4 className="text-sm font-medium text-zinc-200">{label}</h4>
         <p className="text-xs text-zinc-500">{desc}</p>
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-zinc-700'}`}>
         <div className={`absolute top-1 bottom-1 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </div>
   </div>
);

interface Props {
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
  profile: BusinessProfile;
  onUpdateProfile: (p: BusinessProfile) => void;
}

const SettingsPage: React.FC<Props> = ({ settings, onUpdateSettings, profile, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'ui' | 'finder' | 'notifications' | 'security' | 'developer'>('ai');
  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    // In a real app, this would persist to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAIChange = (key: keyof UserSettings['aiBehavior'], value: any) => {
    onUpdateSettings({
      ...settings,
      aiBehavior: { ...settings.aiBehavior, [key]: value }
    });
  };

  const handleUIChange = (key: keyof UserSettings['uiPreferences'], value: any) => {
    onUpdateSettings({
      ...settings,
      uiPreferences: { ...settings.uiPreferences, [key]: value }
    });
  };
  
  const handleSecurityChange = (key: keyof UserSettings['security'], value: any) => {
    onUpdateSettings({
       ...settings,
       security: { ...settings.security, [key]: value }
    });
  };

  const tabs = [
    { id: 'ai', label: 'AI Behavior', icon: Cpu },
    { id: 'ui', label: 'UI & Animation', icon: Layout },
    { id: 'finder', label: 'Lead Finder', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Account & Security', icon: Shield },
    { id: 'developer', label: 'Developer', icon: Terminal },
  ];

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
       {/* Header */}
       <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-zinc-950">
          <div>
             <h2 className="text-2xl font-semibold text-zinc-100">System Settings</h2>
             <p className="text-zinc-500 text-sm mt-1">Configure your AI command center preferences.</p>
          </div>
          <button 
             onClick={saveSettings}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${saved ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
             {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
             {saved ? 'Changes Saved' : 'Save Changes'}
          </button>
       </div>

       <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-white/5 bg-zinc-900/30 flex flex-col py-6">
             {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors relative ${isActive ? 'text-blue-400 bg-blue-500/5' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
                   >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                      <span className="text-sm font-medium">{tab.label}</span>
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />}
                   </button>
                );
             })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
             
             {/* AI BEHAVIOR */}
             {activeTab === 'ai' && (
                <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
                   <SectionHeader title="AI Intelligence Engine" description="Calibrate how the AI discovers and verifies leads." />
                   
                   <div className="grid grid-cols-2 gap-6">
                      <SettingCard label="AI Aggression" description="Risk tolerance for lead verification.">
                         <div className="flex bg-zinc-900 p-1 rounded-lg">
                            {['Safe', 'Normal', 'Bold'].map((opt) => (
                               <button 
                                 key={opt}
                                 onClick={() => handleAIChange('aggression', opt as any)}
                                 className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${settings.aiBehavior.aggression === opt ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                               >
                                  {opt}
                               </button>
                            ))}
                         </div>
                      </SettingCard>

                      <SettingCard label="Scan Depth" description="How deep to crawl for company data.">
                         <div className="flex bg-zinc-900 p-1 rounded-lg">
                            {['Shallow', 'Deep', 'Extreme'].map((opt) => (
                               <button 
                                 key={opt}
                                 onClick={() => handleAIChange('scanDepth', opt as any)}
                                 className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${settings.aiBehavior.scanDepth === opt ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                               >
                                  {opt}
                               </button>
                            ))}
                         </div>
                      </SettingCard>
                   </div>

                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-sm font-medium text-zinc-200">Intelligence Depth (1-10)</span>
                         <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Level {settings.aiBehavior.intelligenceDepth}</span>
                      </div>
                      <input 
                         type="range" 
                         min="1" max="10" 
                         value={settings.aiBehavior.intelligenceDepth}
                         onChange={(e) => handleAIChange('intelligenceDepth', parseInt(e.target.value))}
                         className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-xs text-zinc-500 mt-2">Higher levels consume more API credits but provide deeper verification.</p>
                   </div>

                   <div className="space-y-4">
                      <ToggleSetting 
                         label="Auto-Verify Company Data" 
                         desc="Cross-reference all findings with official registries automatically." 
                         checked={settings.aiBehavior.autoVerify} 
                         onChange={(v) => handleAIChange('autoVerify', v)} 
                      />
                      <ToggleSetting 
                         label="Auto-Suggest Keywords" 
                         desc="Allow AI to dynamically expand search terms based on success rates." 
                         checked={settings.aiBehavior.autoSuggestKeywords} 
                         onChange={(v) => handleAIChange('autoSuggestKeywords', v)} 
                      />
                   </div>
                </div>
             )}

             {/* UI & APPEARANCE */}
             {activeTab === 'ui' && (
                <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
                   <SectionHeader title="Interface Customization" description="Personalize your command center visuals." />

                   <div className="grid grid-cols-3 gap-4">
                      {[
                         { id: 'dark', label: 'Ultra Dark', color: 'bg-zinc-950' },
                         { id: 'cyber', label: 'Cyber Purple', color: 'bg-[#1a0b2e]' },
                         { id: 'light', label: 'Soft Light', color: 'bg-zinc-100' }
                      ].map((theme) => (
                         <button
                           key={theme.id}
                           onClick={() => handleUIChange('theme', theme.id as any)}
                           className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${settings.uiPreferences.theme === theme.id ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-zinc-900/50 hover:bg-zinc-900'}`}
                         >
                            <div className={`w-8 h-8 rounded-full border border-white/10 ${theme.color}`} />
                            <span className="text-xs font-medium text-zinc-300">{theme.label}</span>
                         </button>
                      ))}
                   </div>

                   <SettingCard label="Animation Intensity" description="Control GPU usage and motion effects.">
                      <div className="flex gap-4">
                         {['Low', 'Medium', 'High'].map(intensity => (
                            <button 
                               key={intensity}
                               onClick={() => handleUIChange('animationIntensity', intensity as any)}
                               className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${settings.uiPreferences.animationIntensity === intensity ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-900 border-white/10 text-zinc-400'}`}
                            >
                               {intensity}
                            </button>
                         ))}
                      </div>
                   </SettingCard>

                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-sm font-medium text-zinc-200">Parallax Depth</span>
                         <span className="text-xs font-mono text-zinc-500">{settings.uiPreferences.parallaxDepth}px</span>
                      </div>
                      <input 
                         type="range" 
                         min="0" max="50" 
                         value={settings.uiPreferences.parallaxDepth}
                         onChange={(e) => handleUIChange('parallaxDepth', parseInt(e.target.value))}
                         className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                   </div>

                   <ToggleSetting 
                      label="Reduce Motion" 
                      desc="Disable heavy animations for better performance/accessibility." 
                      checked={settings.uiPreferences.reduceMotion} 
                      onChange={(v) => handleUIChange('reduceMotion', v)} 
                   />
                </div>
             )}

             {/* SECURITY */}
             {activeTab === 'security' && (
                <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
                   <SectionHeader title="Account & Security" description="Manage access controls and API keys." />

                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center ${settings.security.twoFactorEnabled ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
                            <Shield className={`w-6 h-6 ${settings.security.twoFactorEnabled ? 'text-emerald-500' : 'text-zinc-500'}`} />
                         </div>
                         <div>
                            <h3 className="text-sm font-medium text-zinc-100">Two-Factor Authentication</h3>
                            <p className="text-xs text-zinc-500">Secure your account with 2FA.</p>
                         </div>
                      </div>
                      <button 
                         onClick={() => handleSecurityChange('twoFactorEnabled', !settings.security.twoFactorEnabled)}
                         className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${settings.security.twoFactorEnabled ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                      >
                         {settings.security.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                      </button>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Sessions</h3>
                      {settings.security.activeSessions.map((session, i) => (
                         <div key={i} className="bg-zinc-900 border border-white/5 rounded-lg p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               {session.device.includes('Mobile') ? <MobileIcon className="w-4 h-4 text-zinc-500" /> : <Laptop className="w-4 h-4 text-zinc-500" />}
                               <div>
                                  <p className="text-sm font-medium text-zinc-200">{session.device}</p>
                                  <p className="text-xs text-zinc-500">{session.location} • {session.lastActive}</p>
                               </div>
                            </div>
                            {i === 0 && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">Current</span>}
                         </div>
                      ))}
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center">
                         <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">API Keys</h3>
                         <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Create New Key
                         </button>
                      </div>
                      {settings.security.apiKeys.map((key) => (
                         <div key={key.id} className="bg-zinc-900 border border-white/5 rounded-lg p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                               <Key className="w-4 h-4 text-zinc-500" />
                               <div>
                                  <p className="text-sm font-medium text-zinc-200">{key.name}</p>
                                  <p className="text-xs font-mono text-zinc-500">{key.prefix}•••••••••••••</p>
                               </div>
                            </div>
                            <button className="text-zinc-500 hover:text-rose-500 transition-colors">
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {/* NOTIFICATIONS */}
             {activeTab === 'notifications' && (
                <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
                   <SectionHeader title="Notifications" description="Manage alerts and communication frequency." />
                   
                   <ToggleSetting 
                      label="Enable Notifications" 
                      desc="Master switch for all system alerts." 
                      checked={settings.notificationPreferences.enabled} 
                      onChange={(v) => onUpdateSettings({...settings, notificationPreferences: {...settings.notificationPreferences, enabled: v}})} 
                   />

                   {settings.notificationPreferences.enabled && (
                      <div className="space-y-6 pl-6 border-l-2 border-zinc-800">
                         <ToggleSetting 
                            label="Sound Effects" 
                            desc="Play audio cues for important events." 
                            checked={settings.notificationPreferences.soundEnabled} 
                            onChange={(v) => onUpdateSettings({...settings, notificationPreferences: {...settings.notificationPreferences, soundEnabled: v}})} 
                         />
                         <ToggleSetting 
                            label="High Priority Only" 
                            desc="Only notify me about High-Intent leads and Errors." 
                            checked={settings.notificationPreferences.highPriorityOnly} 
                            onChange={(v) => onUpdateSettings({...settings, notificationPreferences: {...settings.notificationPreferences, highPriorityOnly: v}})} 
                         />
                         
                         <SettingCard label="AI Suggestion Frequency" description="How often AI pushes new strategy ideas.">
                            <div className="flex bg-zinc-900 p-1 rounded-lg">
                               {['Real-Time', 'Hourly', 'Daily'].map((freq) => (
                                  <button 
                                    key={freq}
                                    onClick={() => onUpdateSettings({...settings, notificationPreferences: {...settings.notificationPreferences, suggestionFrequency: freq as any}})}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${settings.notificationPreferences.suggestionFrequency === freq ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                  >
                                     {freq}
                                  </button>
                               ))}
                            </div>
                         </SettingCard>
                      </div>
                   )}
                </div>
             )}
             
             {/* DEVELOPER */}
             {activeTab === 'developer' && (
                <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
                    <SectionHeader title="Developer Mode" description="Advanced debugging and raw data access." />
                    
                    <div className="bg-black border border-zinc-800 rounded-xl p-6 font-mono text-xs text-zinc-400 overflow-x-auto">
                       <p className="text-emerald-400 mb-2">// System Telemetry</p>
                       <p>User ID: {Math.random().toString(36).substring(7)}</p>
                       <p>Session Time: {new Date().toISOString()}</p>
                       <p>Memory Usage: 42MB</p>
                       <p>API Latency: 124ms</p>
                       <br />
                       <p className="text-blue-400 mb-2">// Feature Flags</p>
                       <p>GodEye_V2: <span className="text-emerald-500">ENABLED</span></p>
                       <p>Live_Stream: <span className="text-emerald-500">ENABLED</span></p>
                       <p>Beta_Clean: <span className="text-rose-500">DISABLED</span></p>
                    </div>

                    <ToggleSetting 
                       label="Enable Developer Tools" 
                       desc="Show raw JSON outputs in dashboards." 
                       checked={settings.security.developerMode} 
                       onChange={(v) => handleSecurityChange('developerMode', v)} 
                    />

                    <div className="pt-8 border-t border-white/5">
                       <h3 className="text-sm font-medium text-rose-500 mb-4">Danger Zone</h3>
                       <button className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-sm font-medium hover:bg-rose-500/20 transition-colors">
                          Reset All App Data
                       </button>
                    </div>
                </div>
             )}

          </div>
       </div>
    </div>
  );
};

export default SettingsPage;