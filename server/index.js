// Ensure fetch is available globally for Gemini SDK (must be first!)
import fetch, { Headers, Request, Response } from 'node-fetch';
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import db from './db.js';
import auth from './auth.js';
import geminiService from './services/gemini.js';
import advancedScraper from './services/advancedScraper.js';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LeadGen AI API is running',
    gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
  });
});

// ==================== AUTH ROUTES ====================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const result = await auth.signUp(email, password, name);
    res.json(result);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const result = await auth.signIn(email, password);
    res.json(result);
  } catch (error) {
    console.error('Signin error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Get Current User
app.get('/api/auth/me', auth.verifyToken, async (req, res) => {
  try {
    const user = await auth.getCurrentUser(req.userId);
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({ error: error.message });
  }
});

// Sign Out (client-side token removal, no server action needed)
app.post('/api/auth/signout', auth.verifyToken, (req, res) => {
  res.json({ message: 'Signed out successfully' });
});

// ==================== LEADS ROUTES ====================

// Get all leads for user
app.get('/api/leads', auth.verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ leads: result.rows });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save a single lead
app.post('/api/leads', auth.verifyToken, async (req, res) => {
  try {
    const lead = req.body;
    
    const result = await db.query(
      `INSERT INTO leads (
        user_id, business_name, website, phone, email, location, address,
        primary_category, sub_categories, lead_score, intent_label, matching_reason,
        predictive_score, data_confidence, enrichment_data, source_map, social,
        company_insights, competitors, pain_points, intent_signals, auto_pitches,
        smtp_email, whatsapp_link, raw_sources, google_place_id, stage, status,
        tags, notes, tasks, activity_timeline, source, freshness
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34
      ) RETURNING *`,
      [
        req.userId,
        lead.business_name,
        lead.website,
        lead.phone,
        lead.email,
        JSON.stringify(lead.location || {}),
        lead.address,
        lead.primary_category,
        lead.sub_categories || [],
        lead.lead_score || 50,
        lead.intent_label,
        lead.matching_reason,
        JSON.stringify(lead.predictive_score || {}),
        JSON.stringify(lead.data_confidence || {}),
        JSON.stringify(lead.enrichment_data || {}),
        JSON.stringify(lead.source_map || {}),
        JSON.stringify(lead.social || {}),
        JSON.stringify(lead.company_insights || {}),
        lead.competitors || [],
        lead.pain_points || [],
        JSON.stringify(lead.intent_signals || []),
        JSON.stringify(lead.auto_pitches || {}),
        JSON.stringify(lead.smtp_email || null),
        lead.whatsapp_link,
        JSON.stringify(lead.raw_sources || []),
        lead.google_place_id,
        lead.stage || 'New',
        lead.status || 'New',
        lead.tags || [],
        JSON.stringify(lead.notes || []),
        JSON.stringify(lead.tasks || []),
        JSON.stringify(lead.activity_timeline || []),
        lead.source || 'AI Deep Search',
        lead.freshness || 'Fresh'
      ]
    );
    
    res.json({ lead: result.rows[0] });
  } catch (error) {
    console.error('Save lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save multiple leads
app.post('/api/leads/bulk', auth.verifyToken, async (req, res) => {
  try {
    const { leads } = req.body;
    
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'Leads array required' });
    }
    
    const savedLeads = [];
    
    for (const lead of leads) {
      const result = await db.query(
        `INSERT INTO leads (
          user_id, business_name, website, phone, email, location, address,
          primary_category, lead_score, intent_label, matching_reason, stage, status, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [
          req.userId,
          lead.business_name,
          lead.website,
          lead.phone,
          lead.email,
          JSON.stringify(lead.location || {}),
          lead.address,
          lead.primary_category,
          lead.lead_score || 50,
          lead.intent_label,
          lead.matching_reason,
          'New',
          'New',
          'AI Deep Search'
        ]
      );
      savedLeads.push(result.rows[0]);
    }
    
    res.json({ leads: savedLeads, count: savedLeads.length });
  } catch (error) {
    console.error('Bulk save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update lead
app.put('/api/leads/:id', auth.verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'user_id') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }
    
    values.push(id);
    values.push(req.userId);
    
    const result = await db.query(
      `UPDATE leads SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json({ lead: result.rows[0] });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete lead
app.delete('/api/leads/:id', auth.verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM leads WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI-POWERED ROUTES ====================

// Search for company (God-Eye analysis)
app.post('/api/company/search', auth.verifyToken, async (req, res) => {
  try {
    const { companyName, additionalInfo } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ error: 'Company name required' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured. Please contact administrator.' });
    }
    
    // Get user's selected model
    let modelName = 'gemini-2.5-pro';
    try {
      const settingsResult = await db.query(
        'SELECT gemini_model FROM user_settings WHERE user_id = $1',
        [req.userId]
      );
      if (settingsResult.rows.length > 0) {
        modelName = settingsResult.rows[0].gemini_model;
      }
    } catch (err) {
      console.log('Settings query failed, using default model:', err.message);
    }
    
    const profile = await geminiService.findCompany(companyName, additionalInfo, modelName);
    
    if (!profile) {
      return res.status(404).json({ error: 'Company not found', suggestion: 'Try providing a website URL or more details' });
    }
    
    res.json({ profile });
  } catch (error) {
    console.error('Company search error:', error);
    res.status(500).json({ error: 'Failed to search company', details: error.message });
  }
});

// Perform deep research on company
app.post('/api/company/research', auth.verifyToken, async (req, res) => {
  try {
    const { profile } = req.body;
    
    if (!profile || !profile.companyName) {
      return res.status(400).json({ error: 'Company profile required' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }
    
    // Get user's selected model
    let modelName = 'gemini-2.5-pro';
    try {
      const settingsResult = await db.query(
        'SELECT gemini_model FROM user_settings WHERE user_id = $1',
        [req.userId]
      );
      if (settingsResult.rows.length > 0) {
        modelName = settingsResult.rows[0].gemini_model;
      }
    } catch (err) {
      console.log('Settings query failed, using default model:', err.message);
    }
    
    const research = await geminiService.performDeepResearch(profile, modelName);
    res.json({ research });
  } catch (error) {
    console.error('Deep research error:', error);
    res.status(500).json({ error: 'Failed to perform research', details: error.message });
  }
});

// Generate leads based on profile and ICP
app.post('/api/leads/generate', auth.verifyToken, async (req, res) => {
  try {
    const { profile, research, filters, count } = req.body;
    
    if (!profile || !profile.companyName) {
      return res.status(400).json({ error: 'Company profile required' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }
    
    // Get user's selected model
    let modelName = 'gemini-2.5-pro';
    try {
      const settingsResult = await db.query(
        'SELECT gemini_model FROM user_settings WHERE user_id = $1',
        [req.userId]
      );
      if (settingsResult.rows.length > 0) {
        modelName = settingsResult.rows[0].gemini_model;
      }
    } catch (err) {
      console.log('Settings query failed, using default model:', err.message);
    }
    
    const leads = await geminiService.generateLeads(
      profile, 
      research, 
      filters || {},
      count || 10,
      modelName
    );
    
    res.json({ leads, count: leads.length });
  } catch (error) {
    console.error('Lead generation error:', error);
    res.status(500).json({ error: 'Failed to generate leads', details: error.message });
  }
});

// Advanced lead generation with multi-platform scraping
app.post('/api/leads/generate-advanced', auth.verifyToken, async (req, res) => {
  try {
    const { query, strategy, location, maxResults, platforms, category, filters } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }
    
    // Get user's selected model
    let modelName = 'gemini-2.5-pro';
    try {
      const settingsResult = await db.query(
        'SELECT gemini_model FROM user_settings WHERE user_id = $1',
        [req.userId]
      );
      if (settingsResult.rows.length > 0) {
        modelName = settingsResult.rows[0].gemini_model;
      }
    } catch (err) {
      console.log('Settings query failed, using default model:', err.message);
    }
    
    const leads = await advancedScraper.generateAdvancedLeads(query, {
      strategy: strategy || 'hybrid',
      location: location || '',
      maxResults: maxResults || 20,
      platforms: platforms || 'all',
      category: category || null,
      filters: filters || {},
      modelName
    });
    
    res.json({ 
      leads, 
      count: leads.length,
      strategy: strategy || 'hybrid',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Advanced lead generation error:', error);
    res.status(500).json({ error: 'Failed to generate leads', details: error.message });
  }
});

// Get available scraping platforms
app.get('/api/leads/platforms', auth.verifyToken, (req, res) => {
  try {
    const platforms = advancedScraper.getAvailablePlatforms();
    res.json({ platforms });
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({ error: 'Failed to get platforms' });
  }
});

// Get scraper statistics
app.get('/api/leads/scraper-stats', auth.verifyToken, (req, res) => {
  try {
    const stats = advancedScraper.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ==================== BUSINESS PROFILE ROUTES ====================

// Get business profile
app.get('/api/business-profile', auth.verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM business_profiles WHERE user_id = $1',
      [req.userId]
    );
    res.json({ profile: result.rows[0] || null });
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save business profile
app.post('/api/business-profile', auth.verifyToken, async (req, res) => {
  try {
    const profile = req.body;
    
    const result = await db.query(
      `INSERT INTO business_profiles (
        user_id, company_name, website, location, industry, description,
        founders, key_people, tech_stack, social_profiles, financials, markets,
        keywords, target_audience
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id, company_name) 
      DO UPDATE SET
        website = EXCLUDED.website,
        location = EXCLUDED.location,
        industry = EXCLUDED.industry,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        req.userId,
        profile.company_name,
        profile.website,
        profile.location,
        profile.industry,
        profile.description,
        profile.founders || [],
        JSON.stringify(profile.key_people || []),
        profile.tech_stack || [],
        JSON.stringify(profile.social_profiles || {}),
        JSON.stringify(profile.financials || {}),
        JSON.stringify(profile.markets || {}),
        profile.keywords,
        profile.target_audience
      ]
    );
    
    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Save business profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user settings
app.get('/api/settings', auth.verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      // Create default settings if not exists
      const defaultSettings = await db.query(
        `INSERT INTO user_settings (user_id, gemini_model) 
         VALUES ($1, 'gemini-2.5-pro') 
         RETURNING *`,
        [req.userId]
      );
      return res.json({ settings: defaultSettings.rows[0] });
    }
    
    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
app.put('/api/settings', auth.verifyToken, async (req, res) => {
  try {
    const { gemini_model } = req.body;
    
    // Validate model name
    const validModels = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp'
    ];
    
    if (gemini_model && !validModels.includes(gemini_model)) {
      return res.status(400).json({ error: 'Invalid model name' });
    }
    
    const result = await db.query(
      `INSERT INTO user_settings (user_id, gemini_model) 
       VALUES ($1, $2)
       ON CONFLICT (user_id) 
       DO UPDATE SET gemini_model = EXCLUDED.gemini_model, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.userId, gemini_model || 'gemini-2.5-pro']
    );
    
    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LeadGen AI API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  db.pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
