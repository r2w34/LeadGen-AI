

export interface BusinessProfile {
  companyName: string;
  website: string;
  location: string;
  industry: string;
  description: string;
  
  // Deep Analysis Fields (God Mode)
  founders?: string[];
  keyPeople?: { name: string; role: string; linkedin?: string }[];
  techStack?: string[];
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    crunchbase?: string;
  };
  financials?: {
    revenueRange?: string;
    funding?: string;
    teamSize?: string;
  };
  markets?: {
    primary?: string;
    secondary?: string[];
    targetAudience?: string;
  };
  
  // User input overrides
  products?: string; // Legacy but kept for compatibility
  keywords?: string;
  usps?: string;
  pricing?: string;
  targetAudience?: string;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MarketPosition {
  market_share_estimate: string;
  competitors: { name: string; strength: string; weakness: string }[];
  positioning_statement: string;
  pricing_strategy_analysis: string;
}

export interface DeepResearch {
  overview: string;
  core_services: string[];
  swot: SWOTAnalysis;
  market_position: MarketPosition;
  ideal_customer_profile: {
    industries: string[];
    roles: string[];
    pain_points: string[];
    company_size_fit: string[];
  };
  trends: string[];
  ai_suggestions: {
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
  }[];
  generated_at: string;
  targetAudiences?: string[];
  nicheCombinations?: string[];
  longTailKeywords?: string[];
  
  // Deep Tech/Team Data
  detected_tech_stack?: string[];
  detected_founders?: string[];
}

export interface GodEyeData {
  basic_details: {
    legal_name: string;
    trade_names: string[];
    slogan: string;
    hq_location: string;
    founded_year: string;
    business_type: string;
    industry_codes: string[]; // NAICS/SIC
    description: string;
    mission_statement?: string;
  };
  leadership: {
    founders: string[];
    ceo: string;
    key_executives: { name: string; role: string; linkedin?: string }[];
  };
  legal_compliance: {
    registration_numbers: string[]; // CIN, GST, VAT
    licenses: string[];
    certifications: string[]; // ISO etc
    patents?: string[];
    trademarks?: string[];
  };
  financials: {
    revenue_range: string;
    funding_rounds: string[];
    investors: string[];
    valuation?: string;
    stock_symbol?: string;
    assets_liabilities_summary?: string;
  };
  operations: {
    employee_count: string;
    office_locations: string[];
    tech_stack: string[];
    suppliers?: string[];
    distributors?: string[];
  };
  online_presence: {
    website: string;
    seo_score?: string;
    social_profiles: {
      linkedin?: string;
      instagram?: string;
      twitter?: string;
      facebook?: string;
      youtube?: string;
      glassdoor?: string;
      crunchbase?: string;
    };
    review_summary: string;
    sentiment_score: string; // Positive/Neutral/Negative
  };
  csr_sustainability: {
    initiatives: string[];
    sustainability_goals?: string[];
  };
  strategy: {
    short_term_goals: string[];
    long_term_goals: string[];
    expansion_plans: string[];
    swot: SWOTAnalysis;
    mergers_acquisitions?: string[];
  };
  market_customer: {
    market_share?: string;
    ranking?: string;
    customer_segments: string[];
  };
  additional: {
    awards: string[];
    media_mentions: string[];
    press_releases?: string[];
    future_launches?: string[];
  };
}

// --- ADMIN & TEAM TYPES ---

export type UserRole = 'Admin' | 'Manager' | 'Member' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Suspended' | 'Invited';
  lastLogin: string;
  avatar?: string;
  provider?: 'google' | 'email';
  teamId?: string;
  usage: {
    scans: number;
    leads: number;
  };
  // Manual Auth Fields
  passwordHash?: string;
  salt?: string;
}

export interface AuthSession {
  id: string; // 'active'
  user: User;
  timestamp: number;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'security' | 'action' | 'error' | 'admin';
}

export interface AdminStats {
  totalUsers: number;
  activeNow: number;
  totalLeadsFound: number;
  apiUsage: number; // percentage
  systemHealth: 'Healthy' | 'Degraded' | 'Down';
}

// --------------------------

export interface AIBehaviorSettings {
  aggression: 'Safe' | 'Normal' | 'Bold';
  scanDepth: 'Shallow' | 'Deep' | 'Extreme';
  intelligenceDepth: number; // 1-10
  autoVerify: boolean;
  autoSuggestKeywords: boolean;
  confidenceFilter: number; // 0-100
}

export interface UISettings {
  animationIntensity: 'High' | 'Medium' | 'Low';
  theme: 'dark' | 'light' | 'cyber';
  accentColor: string;
  reduceMotion: boolean;
  parallaxDepth: number;
}

export interface FinderSettings {
  defaultIndustries: string[];
  defaultAudiences: string[];
  keywordMode: 'Auto' | 'Semi-Auto' | 'Off';
  autoSave: boolean;
  autoScanLogin: boolean;
  maxConcurrency: number;
  defaultRadius: number;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  highPriorityOnly: boolean;
  suggestionFrequency: 'Real-Time' | 'Hourly' | 'Daily';
  channels: {
    push: boolean;
    email: boolean;
  };
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  activeSessions: { device: string; location: string; lastActive: string }[];
  apiKeys: { id: string; name: string; created: string; prefix: string }[];
  developerMode: boolean;
  dataRetentionDays: number;
}

export interface UserSettings {
  defaultRadius: number;
  enableSounds: boolean;
  enableNotifications: boolean;
  theme: 'dark' | 'light';
  aiBehavior: AIBehaviorSettings;
  uiPreferences: UISettings;
  finderPreferences: FinderSettings;
  notificationPreferences: NotificationSettings;
  security: SecuritySettings;
}

// --- OUTREACH & AUTOMATION TYPES ---

export interface SMTPConfig {
  id: string;
  provider: 'Gmail' | 'Outlook' | 'Custom';
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  fromEmail: string;
  fromName: string;
  status: 'Unverified' | 'Verified' | 'Error';
}

export interface OutreachTemplate {
  id: string;
  name: string;
  type: 'Email' | 'WhatsApp' | 'LinkedIn' | 'SMS';
  subject?: string;
  body: string;
  tone: 'Formal' | 'Casual' | 'Aggressive' | 'Friendly';
  stats: { sent: number; openRate: number; replyRate: number };
}

export interface SequenceStep {
  id: string;
  delayDays: number; // Days after previous step
  type: 'Email' | 'WhatsApp';
  templateId?: string;
  subject?: string; // Override
  body?: string; // Override
}

export interface OutreachSequence {
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Draft';
  steps: SequenceStep[];
  triggers: ('Lead Created' | 'Status Change' | 'Tag Added')[];
  stats: { active: number; completed: number; replied: number };
}

export interface OutreachCampaign {
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Draft';
  type: 'Email' | 'WhatsApp';
  leadsTargeted: number;
  leadsContacted: number;
  openRate: number;
  replyRate: number;
  abTestEnabled: boolean;
  variantA?: string; // Template ID
  variantB?: string; // Template ID
  createdAt: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  type: 'SCAN' | 'ENRICH' | 'OUTREACH' | 'AI';
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export type LeadStage = 'New' | 'Contacted' | 'Follow-Up' | 'Interested' | 'Negotiation' | 'Won' | 'Lost';

export interface Note {
  id: string;
  content: string;
  author?: string; // For team collaboration
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Activity {
  id: string;
  type: 'stage_change' | 'email_sent' | 'whatsapp_sent' | 'note_added' | 'task_created' | 'task_completed' | 'lead_created' | 'info_update' | 'assignment' | 'sequence_start' | 'sequence_step' | 'sequence_pause';
  description: string;
  timestamp: string;
  user?: string; // Who performed the activity
}

export interface CompanyInsights {
  founders: string[];
  leadership: { title: string; name: string; linkedin?: string }[];
  establishment_year?: string;
  company_size?: string;
  headquarters?: string;
  funding_info?: string;
  technologies?: string[];
  website_trust_score?: number; // 0-100
  growth_trend?: 'Growing' | 'Stable' | 'Shrinking';
}

export interface Competitor {
  name: string;
  rating: number;
  strength: string;
  weakness: string;
  comparison_pitch: string;
}

export interface PainPoint {
  issue: string;
  evidence: string;
  solution_pitch: string;
}

export interface EmailSequenceStep {
  day: number;
  subject: string;
  body: string;
  purpose: string;
}

export interface SmartNextStep {
  action: string;
  timing: string;
  reason: string;
  estimated_duration: string;
}

export interface DecisionMaker {
  name: string;
  role: string;
  confidence: number;
  linkedin?: string;
}

export interface LeadList {
  id: string;
  name: string;
  color: string;
}

export type FreshnessStatus = 'Fresh' | 'Active' | 'Stale' | 'Needs Update';
export type WarmthLevel = 'Cold' | 'Warm' | 'Hot';

export interface Alert {
  id: string;
  type: 'priority' | 'opportunity' | 'timing' | 'achievement';
  title: string;
  message: string;
  icon?: any;
  actionLabel?: string;
  onAction?: () => void;
  data?: any;
  timestamp: number;
  read?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: string;
  unlockedAt: string;
}

export interface IntentSignal {
  type: 'Hiring' | 'Content' | 'Launch' | 'Funding' | 'Social' | 'Tech';
  description: string;
  detected_at: string;
  impact_score: number; // 0-10
}

export interface PredictiveScore {
  score: number; // 0-100
  confidence: number; // 0-100
  top_factors: { factor: string; influence: 'Positive' | 'Negative' }[];
  explanation: string;
}

export interface EnrichmentData {
  tech_stack: string[];
  employee_count_range: string;
  online_activity_level: 'High' | 'Medium' | 'Low';
  competitor_overlap: string[];
  social_presence_score: number; // 0-100
}

export interface Lead {
  id: string;
  google_place_id?: string;
  business_name: string;
  primary_category: string;
  sub_categories: string[];
  address: string;
  location: { lat: number; lng: number };
  website: string;
  phone: string;
  email: string;
  social: {
    linkedin: string;
    facebook: string;
    instagram: string;
    twitter: string;
  };
  last_updated: string;
  freshness: FreshnessStatus;
  company_insights?: CompanyInsights;
  
  lead_score: number; // Legacy simple score
  intent_label: 'High' | 'Medium' | 'Low';
  warmth_level?: WarmthLevel;
  industry_trends?: string;
  matching_reason: string;
  
  // New Enrichment Fields
  predictive_score?: PredictiveScore;
  intent_signals?: IntentSignal[];
  enrichment_data?: EnrichmentData;
  
  possible_needs: string[];
  gap_analysis: string[];
  pain_points?: PainPoint[];
  competitors?: Competitor[];
  decision_makers?: DecisionMaker[];
  smart_next_step?: SmartNextStep;
  
  auto_pitches: {
    email_short: string;
    email_long: string;
    email_subject: string;
    email_body_html: string;
    email_body_text: string;
    whatsapp_message: string;
    call_script: string;
    cta: string;
  };
  follow_up_sequence?: EmailSequenceStep[]; // Legacy
  
  // New Automation Fields
  activeSequenceId?: string;
  sequenceStatus?: 'Active' | 'Paused' | 'Completed';
  nextScheduledStep?: string; // ISO Date

  smtp_email?: {
    to: string;
    subject: string;
    body_html: string;
    body_text: string;
  };
  whatsapp_link?: string;
  
  follow_up_recommendation: {
    next_task: string;
    recommended_date: string;
    cadence_days: number;
  };
  
  data_confidence: {
    website: 'verified' | 'estimated' | 'missing';
    phone: 'verified' | 'estimated' | 'missing';
    email: 'verified' | 'estimated' | 'missing';
    social: 'verified' | 'estimated' | 'missing';
  };
  
  source_map?: {
    [key: string]: { source: string; confidence: number; last_checked: string };
  };

  raw_sources?: string[];
  
  status?: string; 
  stage: LeadStage;
  tags: string[];
  notes: Note[];
  tasks: Task[];
  activityTimeline: Activity[];
  source: string;
  listIds?: string[];
  
  assignedTo?: string; // User ID
  
  _is_cached?: boolean;
}

export interface AnalysisResult {
  strategicSummary: string;
  suggestedKeywords: string[];
  targetIndustries: string[];
  competitorAnalysis: string;
  marketOpportunities?: string[];
  targetAudiences: string[];
  nicheCombinations: string[];
  longTailKeywords: string[];
}

export interface SearchFilters {
  location: string;
  radius: string;
  keywords: string[]; 
  industries: string[]; 
  
  minRating?: number;
  minReviews?: number;
  businessSize?: string;
  revenueRange?: string;
  reviewSentiment?: string;
  openingHours?: string; 
  yearsInBusiness?: string; 
  websiteActivity?: string; 
  
  websiteRequired?: boolean;
  socialRequired?: boolean;
  b2bOptimized?: boolean;
  minConfidence?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: number;
}

export interface CRMIssue {
  id: string;
  type: 'duplicate' | 'missing_data' | 'stale' | 'invalid_email';
  severity: 'high' | 'medium' | 'low';
  description: string;
  leadIds: string[];
  resolutionAction: 'merge' | 'delete' | 'enrich' | 'archive';
}

export enum AppView {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  FINDER = 'FINDER',
  RESULTS = 'RESULTS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  OUTREACH = 'OUTREACH',
  TEMPLATES = 'TEMPLATES',
  SETTINGS = 'SETTINGS',
  CLEANER = 'CLEANER',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN'
}