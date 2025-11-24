import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const auth = {
  signUp: async (email: string, password: string, userData?: any) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },
};

// Database helper functions
export const db = {
  // Users/Profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, profile: any) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profile, updated_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Business Profiles
  async getBusinessProfile(userId: string) {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  async saveBusinessProfile(userId: string, profile: any) {
    const { data, error } = await supabase
      .from('business_profiles')
      .upsert({ 
        user_id: userId, 
        ...profile, 
        updated_at: new Date().toISOString() 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Leads
  async getLeads(userId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async saveLead(userId: string, lead: any) {
    const { data, error } = await supabase
      .from('leads')
      .insert({ 
        user_id: userId, 
        ...lead,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async saveLeads(userId: string, leads: any[]) {
    const leadsWithUser = leads.map(lead => ({
      user_id: userId,
      ...lead,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsWithUser)
      .select();
    
    if (error) throw error;
    return data;
  },

  async updateLead(leadId: string, updates: any) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteLead(leadId: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);
    
    if (error) throw error;
  },

  // Search Filters
  async getSearchFilters(userId: string) {
    const { data, error } = await supabase
      .from('search_filters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async saveSearchFilter(userId: string, filter: any) {
    const { data, error } = await supabase
      .from('search_filters')
      .insert({ 
        user_id: userId, 
        ...filter,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Email Templates
  async getEmailTemplates(userId: string) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async saveEmailTemplate(userId: string, template: any) {
    const { data, error } = await supabase
      .from('email_templates')
      .upsert({ 
        user_id: userId, 
        ...template,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteEmailTemplate(templateId: string) {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) throw error;
  },
};
