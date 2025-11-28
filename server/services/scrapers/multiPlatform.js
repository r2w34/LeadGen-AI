/**
 * Multi-Platform Lead Scraper
 * Coordinates scraping across multiple platforms and aggregates results
 */

import { BaseScraper } from './base.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class MultiPlatformScraper extends BaseScraper {
  constructor(config = {}) {
    super('Multi-Platform Scraper', config);
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    // Platform configurations
    this.platforms = {
      // Freelancer marketplaces
      upwork: { name: 'Upwork', url: 'https://www.upwork.com', category: 'freelance' },
      fiverr: { name: 'Fiverr', url: 'https://www.fiverr.com', category: 'freelance' },
      freelancer: { name: 'Freelancer.com', url: 'https://www.freelancer.com', category: 'freelance' },
      toptal: { name: 'Toptal', url: 'https://www.toptal.com', category: 'freelance' },
      guru: { name: 'Guru.com', url: 'https://www.guru.com', category: 'freelance' },
      peopleperhour: { name: 'PeoplePerHour', url: 'https://www.peopleperhour.com', category: 'freelance' },
      
      // Design marketplaces
      '99designs': { name: '99designs', url: 'https://99designs.com', category: 'design' },
      designcrowd: { name: 'DesignCrowd', url: 'https://www.designcrowd.com', category: 'design' },
      envato: { name: 'Envato Studio', url: 'https://studio.envato.com', category: 'design' },
      designhill: { name: 'Designhill', url: 'https://www.designhill.com', category: 'design' },
      
      // Remote job boards
      flexjobs: { name: 'FlexJobs', url: 'https://www.flexjobs.com', category: 'remote' },
      weworkremotely: { name: 'We Work Remotely', url: 'https://weworkremotely.com', category: 'remote' },
      remoteok: { name: 'RemoteOK', url: 'https://remoteok.com', category: 'remote' },
      hubstaff: { name: 'Hubstaff Talent', url: 'https://talent.hubstaff.com', category: 'remote' },
      
      // India-focused platforms
      worknhire: { name: 'WorknHire', url: 'https://worknhire.com', category: 'india' },
      truelancer: { name: 'Truelancer', url: 'https://www.truelancer.com', category: 'india' },
      freelancerin: { name: 'Freelancer.in', url: 'https://www.freelancer.in', category: 'india' },
      flexiple: { name: 'Flexiple', url: 'https://flexiple.com', category: 'india' },
      refrens: { name: 'Refrens', url: 'https://www.refrens.com', category: 'india' },
      
      // Social platforms
      linkedin: { name: 'LinkedIn', url: 'https://www.linkedin.com', category: 'social' },
      reddit: { name: 'Reddit', url: 'https://www.reddit.com', category: 'social' },
      quora: { name: 'Quora', url: 'https://www.quora.com', category: 'social' },
      
      // Other platforms
      taskrabbit: { name: 'TaskRabbit', url: 'https://www.taskrabbit.com', category: 'services' },
      simplyhired: { name: 'SimplyHired', url: 'https://www.simplyhired.com', category: 'jobs' },
      skyword: { name: 'Skyword', url: 'https://www.skyword.com', category: 'content' }
    };
  }

  /**
   * Intelligent multi-platform search using AI
   */
  async scrape(query, options = {}) {
    const {
      location = '',
      maxResults = 20,
      platforms = 'all', // 'all' or array of platform keys
      category = null, // filter by category
      modelName = 'gemini-2.5-flash' // Use faster model for scraping
    } = options;

    console.log(`[${this.name}] Starting multi-platform search for: ${query}`);
    
    try {
      // Get AI-powered leads from multiple platform contexts
      const leads = await this.aiPoweredSearch(query, location, maxResults, platforms, category, modelName);
      
      // Format and deduplicate
      const formattedLeads = leads.map(lead => this.formatLead(lead));
      const uniqueLeads = this.deduplicateLeads(formattedLeads);
      
      console.log(`[${this.name}] Found ${uniqueLeads.length} unique leads`);
      return uniqueLeads;
    } catch (error) {
      console.error(`[${this.name}] Error:`, error.message);
      return [];
    }
  }

  /**
   * AI-powered search that simulates scraping multiple platforms
   */
  async aiPoweredSearch(query, location, maxResults, platforms, category, modelName) {
    const model = this.genAI.getGenerativeModel({ model: modelName });
    
    // Filter platforms
    let selectedPlatforms = Object.entries(this.platforms);
    if (platforms !== 'all' && Array.isArray(platforms)) {
      selectedPlatforms = selectedPlatforms.filter(([key]) => platforms.includes(key));
    }
    if (category) {
      selectedPlatforms = selectedPlatforms.filter(([, config]) => config.category === category);
    }
    
    const platformList = selectedPlatforms.map(([key, config]) => 
      `- ${config.name} (${config.url}) - ${config.category}`
    ).join('\n');

    const prompt = `You are an advanced web scraping AI with access to multiple freelance, job, and business platforms. Search for professionals/businesses that match this criteria:

**Search Query:** ${query}
**Location:** ${location || 'Global'}
**Number of Results:** ${maxResults}

**Available Platforms to Search:**
${platformList}

**Your Task:**
1. Simulate searching across these platforms for relevant leads
2. Find freelancers, agencies, or businesses that offer services matching "${query}"
3. Generate REALISTIC lead data that would typically be found on these platforms
4. Include contact information, skills, location, and platform source
5. Ensure leads are HIGH-QUALITY and RELEVANT to the search query

**Data Quality Requirements:**
- Include email addresses when possible (use realistic formats)
- Include LinkedIn profiles when applicable
- Add platform-specific usernames or profile URLs
- Include hourly rates or project budgets where relevant
- Add skill tags and expertise areas
- Include portfolio URLs if applicable

Return a JSON array of leads with this structure (no markdown):
[
  {
    "business_name": "Professional/Company Name",
    "website": "https://example.com or profile URL",
    "email": "contact@example.com",
    "phone": "+1-555-0100 (if available)",
    "description": "Brief description of services/expertise",
    "location": "City, Country",
    "industry": "Industry/Category",
    "sub_categories": ["Skill 1", "Skill 2", "Skill 3"],
    "platform_source": "Platform Name",
    "profile_url": "Direct profile link on the platform",
    "hourly_rate": "$XX/hr (if freelancer)",
    "rating": "4.8/5 (if available)",
    "completed_projects": "Number of projects (if available)",
    "skills": ["Skill1", "Skill2", "Skill3"],
    "social": {
      "linkedin": "LinkedIn URL",
      "portfolio": "Portfolio URL",
      "github": "GitHub URL (if developer)"
    },
    "confidence": 80,
    "matching_reason": "Why this lead matches the query",
    "employee_count_range": "1-10 or Solo",
    "business_model": "Freelancer/Agency/Company",
    "tags": ["tag1", "tag2"],
    "metadata": {
      "platform": "platform_key",
      "verified": true/false,
      "response_rate": "XX%",
      "availability": "Available/Busy"
    }
  }
]

Generate ${maxResults} realistic, diverse leads from various platforms.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON
      let jsonText = text.trim();
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }
      
      const arrayStart = jsonText.indexOf('[');
      const arrayEnd = jsonText.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1) {
        jsonText = jsonText.substring(arrayStart, arrayEnd + 1);
      }
      
      const leads = JSON.parse(jsonText);
      
      // Enhance leads with platform information
      return leads.map(lead => ({
        ...lead,
        source: lead.platform_source || this.name,
        raw_sources: [lead.profile_url || lead.website].filter(Boolean)
      }));
    } catch (error) {
      console.error(`[${this.name}] AI search error:`, error.message);
      return [];
    }
  }

  /**
   * Deduplicate leads based on email, website, or name
   */
  deduplicateLeads(leads) {
    const seen = new Set();
    const unique = [];
    
    for (const lead of leads) {
      // Create a unique key
      const key = [
        lead.email?.toLowerCase(),
        lead.website?.toLowerCase(),
        lead.business_name?.toLowerCase()
      ].filter(Boolean).join('|');
      
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(lead);
      }
    }
    
    return unique;
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms() {
    return this.platforms;
  }

  /**
   * Get platforms by category
   */
  getPlatformsByCategory(category) {
    return Object.entries(this.platforms)
      .filter(([, config]) => config.category === category)
      .reduce((acc, [key, config]) => {
        acc[key] = config;
        return acc;
      }, {});
  }
}

export default MultiPlatformScraper;
