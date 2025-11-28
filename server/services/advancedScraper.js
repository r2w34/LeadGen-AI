/**
 * Advanced Lead Scraper Service
 * Coordinates multiple scraping strategies and AI-powered lead generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import GoogleScraper from './scrapers/google.js';
import MultiPlatformScraper from './scrapers/multiPlatform.js';

class AdvancedScraperService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.googleScraper = new GoogleScraper();
    this.multiPlatformScraper = new MultiPlatformScraper();
    
    this.strategies = {
      'ai-powered': this.aiPoweredStrategy.bind(this),
      'multi-platform': this.multiPlatformStrategy.bind(this),
      'google-search': this.googleSearchStrategy.bind(this),
      'hybrid': this.hybridStrategy.bind(this)
    };
  }

  /**
   * Main entry point - intelligent lead generation
   */
  async generateAdvancedLeads(query, options = {}) {
    const {
      strategy = 'hybrid', // ai-powered, multi-platform, google-search, or hybrid
      location = '',
      maxResults = 20,
      platforms = 'all',
      category = null,
      filters = {},
      modelName = 'gemini-2.5-pro'
    } = options;

    console.log(`[AdvancedScraper] Starting ${strategy} strategy for: ${query}`);
    
    try {
      const strategyFn = this.strategies[strategy] || this.strategies['hybrid'];
      const leads = await strategyFn(query, {
        location,
        maxResults,
        platforms,
        category,
        filters,
        modelName
      });
      
      // Post-process: enrich, score, and deduplicate
      const enrichedLeads = await this.enrichLeads(leads, modelName);
      const scoredLeads = this.scoreLeads(enrichedLeads, query, filters);
      const uniqueLeads = this.deduplicateLeads(scoredLeads);
      
      // Sort by lead score
      uniqueLeads.sort((a, b) => b.lead_score - a.lead_score);
      
      console.log(`[AdvancedScraper] Generated ${uniqueLeads.length} leads`);
      return uniqueLeads.slice(0, maxResults);
    } catch (error) {
      console.error('[AdvancedScraper] Error:', error);
      throw error;
    }
  }

  /**
   * Strategy 1: AI-Powered (pure AI generation)
   */
  async aiPoweredStrategy(query, options) {
    const { location, maxResults, filters, modelName } = options;
    const model = this.genAI.getGenerativeModel({ model: modelName });

    const prompt = `You are an expert B2B lead generation AI with access to global business databases. Generate ${maxResults} high-quality, REALISTIC leads for:

**Search Query:** ${query}
**Location:** ${location || 'Global'}
${filters.industry ? `**Industry:** ${filters.industry}` : ''}
${filters.keywords ? `**Keywords:** ${filters.keywords.join(', ')}` : ''}

**Requirements:**
1. Generate REAL-SOUNDING company names and data
2. Include complete contact information (email, phone, website)
3. Add social media profiles (LinkedIn especially)
4. Include business description and services
5. Add employee count and revenue estimates
6. Include why they are a good lead
7. Make data as realistic as possible

Return JSON array (no markdown):
[
  {
    "business_name": "Company Name",
    "website": "https://example.com",
    "email": "contact@example.com",
    "phone": "+1-555-0100",
    "address": "123 Business St, City, State 12345",
    "location": {"lat": 37.7749, "lng": -122.4194},
    "description": "Professional business description",
    "industry": "Industry Name",
    "sub_categories": ["Service 1", "Service 2"],
    "employee_count_range": "10-50",
    "estimated_revenue": "$1M-$5M",
    "tech_stack": ["Technology 1", "Technology 2"],
    "social": {
      "linkedin": "https://linkedin.com/company/example",
      "twitter": "https://twitter.com/example",
      "facebook": "https://facebook.com/example"
    },
    "key_people": [
      {"name": "John Doe", "role": "CEO", "email": "john@example.com"}
    ],
    "matching_reason": "Specific reason why this is a good lead",
    "pain_points": ["Pain point 1", "Pain point 2"],
    "confidence": 85,
    "business_model": "B2B",
    "growth_stage": "Growth",
    "tags": ["tag1", "tag2"]
  }
]`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const leads = this.extractJsonArray(text);
      return leads.map(lead => ({
        ...lead,
        source: 'AI Deep Search',
        source_map: { ai: { source: 'Gemini AI', model: modelName, timestamp: new Date().toISOString() } }
      }));
    } catch (error) {
      console.error('[AdvancedScraper] AI strategy error:', error);
      return [];
    }
  }

  /**
   * Strategy 2: Multi-Platform (scrape multiple freelance/job platforms)
   */
  async multiPlatformStrategy(query, options) {
    return await this.multiPlatformScraper.scrape(query, options);
  }

  /**
   * Strategy 3: Google Search
   */
  async googleSearchStrategy(query, options) {
    return await this.googleScraper.scrape(query, options);
  }

  /**
   * Strategy 4: Hybrid (combines multiple strategies)
   */
  async hybridStrategy(query, options) {
    const { maxResults } = options;
    const leadsPerStrategy = Math.ceil(maxResults / 2);
    
    const [aiLeads, platformLeads] = await Promise.all([
      this.aiPoweredStrategy(query, { ...options, maxResults: leadsPerStrategy }),
      this.multiPlatformStrategy(query, { ...options, maxResults: leadsPerStrategy })
    ]);
    
    return [...aiLeads, ...platformLeads];
  }

  /**
   * Enrich leads with additional AI analysis
   */
  async enrichLeads(leads, modelName) {
    if (leads.length === 0) return leads;
    
    console.log(`[AdvancedScraper] Enriching ${leads.length} leads...`);
    
    // For performance, only enrich top leads
    const leadsToEnrich = leads.slice(0, 10);
    
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Use faster model
      
      const prompt = `Analyze these leads and add missing information or enhance existing data:

${JSON.stringify(leadsToEnrich.map(l => ({
  name: l.business_name,
  website: l.website,
  industry: l.industry || l.primary_category,
  description: l.description
})), null, 2)}

For each lead, provide:
1. Estimated employee count (if missing)
2. Estimated revenue range (if missing)
3. Tech stack used (if applicable)
4. Key decision makers and their likely titles
5. Top 3 pain points they likely have
6. Best approach to contact them

Return JSON array matching the input order with enrichment data:
[
  {
    "employee_count_range": "10-50",
    "estimated_revenue": "$1M-$5M",
    "tech_stack": ["Tech1", "Tech2"],
    "key_people": [{"name": "Likely Name", "role": "CEO"}],
    "pain_points": ["Pain 1", "Pain 2", "Pain 3"],
    "outreach_strategy": "Best approach to contact"
  }
]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const enrichments = this.extractJsonArray(response.text());
      
      // Apply enrichments
      leadsToEnrich.forEach((lead, i) => {
        if (enrichments[i]) {
          Object.assign(lead.enrichment_data, enrichments[i]);
          if (enrichments[i].key_people) {
            lead.key_people = enrichments[i].key_people;
          }
          if (enrichments[i].pain_points) {
            lead.pain_points = enrichments[i].pain_points;
          }
        }
      });
    } catch (error) {
      console.error('[AdvancedScraper] Enrichment error:', error);
    }
    
    return leads;
  }

  /**
   * Score leads based on query relevance and data quality
   */
  scoreLeads(leads, query, filters) {
    return leads.map(lead => {
      let score = lead.lead_score || 50;
      
      // Boost score based on contact completeness
      if (lead.email && lead.phone) score += 15;
      else if (lead.email || lead.phone) score += 8;
      
      // Boost for social profiles
      if (lead.social?.linkedin) score += 10;
      if (lead.website) score += 5;
      
      // Boost for keyword matches
      const searchTerms = query.toLowerCase().split(' ');
      const leadText = `${lead.business_name} ${lead.description || ''} ${lead.industry || ''}`.toLowerCase();
      const matchCount = searchTerms.filter(term => leadText.includes(term)).length;
      score += matchCount * 3;
      
      // Boost for filter matches
      if (filters.industry && lead.industry?.toLowerCase().includes(filters.industry.toLowerCase())) {
        score += 10;
      }
      
      // Apply confidence modifier
      if (lead.confidence) {
        score = score * (lead.confidence / 100);
      }
      
      lead.lead_score = Math.min(100, Math.max(0, Math.round(score)));
      
      // Update predictive score
      if (lead.predictive_score) {
        lead.predictive_score.score = lead.lead_score;
      }
      
      return lead;
    });
  }

  /**
   * Deduplicate leads
   */
  deduplicateLeads(leads) {
    const seen = new Map();
    const unique = [];
    
    for (const lead of leads) {
      // Create composite key
      const emailKey = lead.email?.toLowerCase();
      const websiteKey = lead.website?.toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
      const nameKey = lead.business_name?.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const key = emailKey || websiteKey || nameKey || lead.id;
      
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(lead);
      } else {
        // Merge data from duplicate
        const existing = unique.find(l => {
          const eEmail = l.email?.toLowerCase();
          const eWebsite = l.website?.toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
          const eName = l.business_name?.toLowerCase().replace(/[^a-z0-9]/g, '');
          return eEmail === emailKey || eWebsite === websiteKey || eName === nameKey;
        });
        
        if (existing) {
          // Merge missing fields
          for (const [key, value] of Object.entries(lead)) {
            if (!existing[key] && value) {
              existing[key] = value;
            }
          }
        }
      }
    }
    
    return unique;
  }

  /**
   * Extract JSON array from AI response
   */
  extractJsonArray(text) {
    let jsonText = text.trim();
    
    // Remove markdown
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
    
    // Find array bounds
    const arrayStart = jsonText.indexOf('[');
    const arrayEnd = jsonText.lastIndexOf(']');
    
    if (arrayStart !== -1 && arrayEnd !== -1) {
      jsonText = jsonText.substring(arrayStart, arrayEnd + 1);
    }
    
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('[AdvancedScraper] JSON parse error:', error.message);
      return [];
    }
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms() {
    return this.multiPlatformScraper.getAvailablePlatforms();
  }

  /**
   * Get scraper stats
   */
  getStats() {
    return {
      google: this.googleScraper.getStats(),
      multiPlatform: this.multiPlatformScraper.getStats()
    };
  }
}

export default new AdvancedScraperService();
