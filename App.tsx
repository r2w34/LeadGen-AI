

import React, { useState, useEffect } from 'react';
import { 
  AppView, BusinessProfile, DeepResearch, Lead, LeadList, Alert, 
  Achievement, UserSettings, SavedSearch, OutreachCampaign, 
  OutreachTemplate, OutreachSequence, SMTPConfig, User 
} from './types';
import Navigation from './components/Navigation';
import OnboardingView from './components/OnboardingView';
import Dashboard from './components/Dashboard';
import LeadFinder from './components/LeadFinder';
import CRMBoard from './components/CRMBoard';
import SettingsPage from './components/SettingsPage';
import CommandPalette from './components/CommandPalette';
import NotificationCenter from './components/NotificationCenter';
import LeadDetailPanel from './components/LeadDetailView';
import CRMCleaner from './components/CRMCleaner';
import LandingPage from './components/LandingPage';
import OutreachCenter from './components/OutreachCenter';
import MediaStudio from './components/MediaStudio';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import { generateOutreachTemplates } from './services/gemini';
import { db } from './lib/db';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // App State
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.LANDING);
  
  // Data States
  const [profile, setProfile] = useState<BusinessProfile>({
    companyName: '', description: '', products: '', targetAudience: '', industry: '', keywords: '', usps: '', pricing: '',
    website: '', location: ''
  });
  const [research, setResearch] = useState<DeepResearch | null>(null);
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    defaultRadius: 10,
    enableSounds: true,
    enableNotifications: true,
    theme: 'dark',
    aiBehavior: { aggression: 'Normal', scanDepth: 'Deep', intelligenceDepth: 7, autoVerify: true, autoSuggestKeywords: true, confidenceFilter: 60 },
    uiPreferences: { animationIntensity: 'High', theme: 'dark', accentColor: '#2563eb', reduceMotion: false, parallaxDepth: 20 },
    finderPreferences: { defaultIndustries: [], defaultAudiences: [], keywordMode: 'Auto', autoSave: false, autoScanLogin: false, maxConcurrency: 5, defaultRadius: 10 },
    notificationPreferences: { enabled: true, soundEnabled: true, highPriorityOnly: false, suggestionFrequency: 'Real-Time', channels: { push: true, email: true } },
    security: { twoFactorEnabled: false, activeSessions: [], apiKeys: [], developerMode: false, dataRetentionDays: 90 }
  });

  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [customLists, setCustomLists] = useState<LeadList[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [sequences, setSequences] = useState<OutreachSequence[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig | null>(null);

  // UI States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [selectedLeadFromCommand, setSelectedLeadFromCommand] = useState<Lead | null>(null);

  // --- 1. HYDRATION (Load Data from DB) ---
  useEffect(() => {
    const hydrate = async () => {
      try {
        await db.init();
        
        // Check Auth
        const session = await db.getSession();
        if (session) {
          setCurrentUser(session);
          setView(AppView.DASHBOARD);
        }

        // Load Data concurrently
        const [
           loadedLeads, loadedSettings, loadedProfile, loadedResearch,
           loadedTemplates, loadedCampaigns, loadedSequences, loadedSMTP,
           loadedLists, loadedSearches, loadedAlerts
        ] = await Promise.all([
           db.getLeads(), db.getSettings(), db.getProfile(), db.getResearch(),
           db.getTemplates(), db.getCampaigns(), db.getSequences(), db.getSMTPConfig(),
           db.getLists(), db.getSearches(), db.getAlerts()
        ]);

        if (loadedLeads.length) setSavedLeads(loadedLeads);
        if (loadedSettings) setUserSettings(loadedSettings);
        if (loadedProfile) setProfile(loadedProfile);
        if (loadedResearch) setResearch(loadedResearch);
        if (loadedTemplates.length) setTemplates(loadedTemplates);
        if (loadedCampaigns.length) setCampaigns(loadedCampaigns);
        if (loadedSequences.length) setSequences(loadedSequences);
        if (loadedSMTP) setSmtpConfig(loadedSMTP);
        if (loadedLists.length) setCustomLists(loadedLists);
        if (loadedSearches.length) setSavedSearches(loadedSearches);
        if (loadedAlerts.length) setAlerts(loadedAlerts);

      } catch (e) {
        console.error("Hydration Failed:", e);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, []);

  // --- 2. PERSISTENCE (Save Data on Change) ---
  useEffect(() => { if (!loading) db.saveLeads(savedLeads); }, [savedLeads, loading]);
  useEffect(() => { if (!loading) db.saveSettings(userSettings); }, [userSettings, loading]);
  useEffect(() => { if (!loading) db.saveProfile(profile); }, [profile, loading]);
  useEffect(() => { if (!loading && research) db.saveResearch(research); }, [research, loading]);
  useEffect(() => { if (!loading) db.saveTemplates(templates); }, [templates, loading]);
  useEffect(() => { if (!loading) db.saveCampaigns(campaigns); }, [campaigns, loading]);
  useEffect(() => { if (!loading) db.saveSequences(sequences); }, [sequences, loading]);
  useEffect(() => { if (!loading && smtpConfig) db.saveSMTPConfig(smtpConfig); }, [smtpConfig, loading]);
  useEffect(() => { if (!loading) db.saveLists(customLists); }, [customLists, loading]);
  useEffect(() => { if (!loading) db.saveSearches(savedSearches); }, [savedSearches, loading]);
  useEffect(() => { if (!loading) db.saveAlerts(alerts); }, [alerts, loading]);

  // --- Effects ---

  useEffect(() => {
     if (profile.companyName && templates.length === 0 && !loading && currentUser) {
        generateOutreachTemplates(profile).then(t => {
           setTemplates(t);
        });
     }
  }, [profile, templates.length, loading, currentUser]);

  const addAlert = (alert: Omit<Alert, 'id' | 'timestamp'>) => {
    if (!userSettings.notificationPreferences.enabled) return;
    const newAlert: Alert = { ...alert, id: `alert-${Date.now()}`, timestamp: Date.now(), read: false };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleLogout = async () => {
    await db.clearSession();
    setCurrentUser(null);
    setView(AppView.LOGIN);
  };

  const isProfileReady = research !== null;

  if (loading) {
     return (
       <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
         <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
         <p className="text-sm text-zinc-500 font-medium">Initializing System...</p>
       </div>
     );
  }

  const renderContent = () => {
    if (!currentUser && view !== AppView.LANDING && view !== AppView.LOGIN) {
       return <LoginScreen onLogin={(u) => { setCurrentUser(u); setView(AppView.ONBOARDING); }} />;
    }

    switch (view) {
      case AppView.LANDING:
        return <LandingPage onEnterApp={() => setView(AppView.LOGIN)} />;
      case AppView.LOGIN:
        return <LoginScreen onLogin={(u) => { setCurrentUser(u); setView(AppView.ONBOARDING); }} />;
      case AppView.ONBOARDING:
        return <OnboardingView setProfile={setProfile} setResearch={setResearch} onComplete={() => setView(AppView.DASHBOARD)} />;
      case AppView.DASHBOARD:
        return <Dashboard profile={profile} research={research} goToFinder={() => setView(AppView.FINDER)} savedLeads={savedLeads} />;
      case AppView.FINDER:
        return isProfileReady ? <LeadFinder profile={profile} analysis={research} savedLeads={savedLeads} onSaveLead={(l) => { setSavedLeads(prev => [...prev, { ...l, stage: 'New' }]); addAlert({ type: 'opportunity', title: 'Lead Saved', message: l.business_name }); }} addAlert={addAlert} unlockAchievement={() => {}} defaultRadius={userSettings.defaultRadius} savedSearches={savedSearches} onSaveSearch={(s) => setSavedSearches(prev => [...prev, s])} /> : <div className="p-8 text-zinc-500">Please complete onboarding first.</div>;
      case AppView.RESULTS:
        return <CRMBoard leads={savedLeads} onUpdateLead={(l) => setSavedLeads(savedLeads.map(lead => lead.id === l.id ? l : lead))} onDeleteLead={(id) => setSavedLeads(savedLeads.filter(l => l.id !== id))} customLists={customLists} onCreateList={() => {}} onDeleteList={() => {}} onAddLeadToList={() => {}} />;
      case AppView.CLEANER:
        return <CRMCleaner leads={savedLeads} onUpdateLeads={setSavedLeads} />;
      case AppView.OUTREACH:
        return <OutreachCenter 
          leads={savedLeads} 
          templates={templates} 
          campaigns={campaigns} 
          onSaveTemplate={t => setTemplates(prev => [...prev, t])} 
          onCreateCampaign={c => setCampaigns(prev => [...prev, c])} 
          sequences={sequences}
          onSaveSequence={s => setSequences(prev => [...prev, s])}
          smtpConfig={smtpConfig}
          onSaveSMTP={setSmtpConfig}
        />;
      case AppView.MEDIA_STUDIO:
        return <MediaStudio />;
      case AppView.ADMIN:
        return <AdminPanel />;
      case AppView.SETTINGS:
        return <SettingsPage settings={userSettings} onUpdateSettings={setUserSettings} profile={profile} onUpdateProfile={setProfile} />;
      case AppView.PROFILE:
        return <OnboardingView setProfile={setProfile} setResearch={setResearch} onComplete={() => setView(AppView.DASHBOARD)} />;
      default: return null;
    }
  };

  return (
    <div className={`flex h-screen w-screen bg-[#09090b] text-zinc-200 font-sans overflow-hidden selection:bg-blue-500/30 ${userSettings.uiPreferences.theme === 'cyber' ? 'theme-cyber' : ''}`}>
      {/* Navigation */}
      {currentUser && view !== AppView.ONBOARDING && view !== AppView.LANDING && view !== AppView.LOGIN && (
        <Navigation 
          currentView={view} 
          setView={setView} 
          isProfileReady={isProfileReady} 
          toggleNotifications={() => setIsNotificationPanelOpen(true)}
          unreadCount={alerts.filter(a => !a.read).length}
          onLogout={handleLogout}
        />
      )}
      
      <main className={`flex-1 flex flex-col h-full relative overflow-hidden bg-zinc-950 ${view === AppView.LANDING ? 'overflow-y-auto' : ''}`}>
        {renderContent()}
      </main>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        setIsOpen={setIsCommandPaletteOpen} 
        setView={setView} 
        savedLeads={savedLeads} 
        onSelectLead={setSelectedLeadFromCommand}
      />

      <NotificationCenter 
        isOpen={isNotificationPanelOpen} 
        onClose={() => setIsNotificationPanelOpen(false)} 
        alerts={alerts} 
        onDismiss={(id) => setAlerts(alerts.filter(a => a.id !== id))}
        onClearAll={() => setAlerts([])}
      />

      {selectedLeadFromCommand && (
         <LeadDetailPanel 
           lead={selectedLeadFromCommand} 
           onClose={() => setSelectedLeadFromCommand(null)} 
           onUpdate={(l) => {
             setSavedLeads(savedLeads.map(lead => lead.id === l.id ? l : lead));
             setSelectedLeadFromCommand(l);
           }}
           isSaved={true}
           sequences={sequences}
         />
      )}
    </div>
  );
};

export default App;