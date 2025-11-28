/**
 * Base Scraper Class
 * Provides common functionality for all scrapers
 */

export class BaseScraper {
  constructor(name, config = {}) {
    this.name = name;
    this.config = {
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      respectRobotsTxt: config.respectRobotsTxt !== false,
      rateLimit: config.rateLimit || 1000, // ms between requests
      ...config
    };
    
    this.lastRequestTime = 0;
    this.requestCount = 0;
  }

  /**
   * Rate limiting - ensures we don't overwhelm servers
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.rateLimit) {
      await this.sleep(this.config.rateLimit - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch with retry logic
   */
  async fetchWithRetry(url, options = {}, retryCount = 0) {
    await this.rateLimit();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...options.headers
        },
        timeout: this.config.timeout
      });

      if (!response.ok && retryCount < this.config.retries) {
        await this.sleep(this.config.retryDelay * (retryCount + 1));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < this.config.retries) {
        console.log(`[${this.name}] Retry ${retryCount + 1}/${this.config.retries} for ${url}`);
        await this.sleep(this.config.retryDelay * (retryCount + 1));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Extract email addresses from text
   */
  extractEmails(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return [...new Set(text.match(emailRegex) || [])];
  }

  /**
   * Extract phone numbers from text
   */
  extractPhones(text) {
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?(?:\(\d{1,4}\)|\d{1,4})[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    const matches = text.match(phoneRegex) || [];
    return [...new Set(matches.filter(phone => {
      const digits = phone.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    }))];
  }

  /**
   * Extract URLs from text
   */
  extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s<>"]+/g;
    return [...new Set(text.match(urlRegex) || [])];
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@.,:;!?()-]/g, '')
      .trim();
  }

  /**
   * Parse HTML (basic - in production use cheerio or similar)
   */
  parseHtml(html) {
    // This is a basic implementation
    // In production, install and use 'cheerio' or 'jsdom'
    const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"');
    
    return this.cleanText(text);
  }

  /**
   * Generate lead score based on data quality
   */
  calculateLeadScore(data) {
    let score = 50; // Base score

    // Contact information
    if (data.email) score += 15;
    if (data.phone) score += 10;
    if (data.website) score += 10;
    
    // Company information
    if (data.description && data.description.length > 50) score += 5;
    if (data.location) score += 5;
    if (data.industry) score += 5;
    
    // Social presence
    if (data.social?.linkedin) score += 5;
    if (data.social?.twitter) score += 3;
    if (data.social?.facebook) score += 2;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Standard lead format
   */
  formatLead(data) {
    const timestamp = new Date().toISOString();
    const leadId = `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const cleanPhone = (data.phone || '').replace(/\D/g, '');

    return {
      id: leadId,
      business_name: data.business_name || data.name || 'Unknown',
      website: data.website || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      location: data.location || {},
      primary_category: data.primary_category || data.industry || 'Unknown',
      sub_categories: data.sub_categories || [],
      lead_score: this.calculateLeadScore(data),
      intent_label: data.intent_label || 'Medium',
      matching_reason: data.matching_reason || `Found via ${this.name}`,
      predictive_score: {
        score: this.calculateLeadScore(data),
        confidence: data.confidence || 70,
        explanation: data.explanation || `Lead discovered through ${this.name} scraping`,
        top_factors: data.top_factors || ['Online presence', 'Contact information available']
      },
      data_confidence: {
        website: data.website ? 'verified' : 'unknown',
        phone: data.phone ? 'verified' : 'unknown',
        email: data.email ? 'verified' : 'unknown'
      },
      enrichment_data: {
        employee_count_range: data.employee_count_range || 'Unknown',
        estimated_revenue: data.estimated_revenue || 'Unknown',
        tech_stack: data.tech_stack || [],
        online_activity_level: data.online_activity_level || 'Medium',
        ...(data.enrichment_data || {})
      },
      pain_points: data.pain_points || [],
      company_insights: {
        business_model: data.business_model || 'B2B',
        growth_stage: data.growth_stage || 'Unknown',
        ...(data.company_insights || {})
      },
      social: {
        linkedin: data.social?.linkedin || '',
        twitter: data.social?.twitter || '',
        facebook: data.social?.facebook || '',
        ...(data.social || {})
      },
      whatsapp_link: cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone}` : null,
      smtp_email: data.email ? {
        to: data.email,
        subject: 'Partnership Opportunity',
        body_text: '',
        body_html: ''
      } : null,
      source: this.name,
      source_map: { scraper: { source: this.name, timestamp } },
      raw_sources: data.raw_sources || [],
      freshness: 'Fresh',
      stage: 'New',
      status: 'New',
      tags: data.tags || [],
      notes: data.notes || [],
      tasks: [],
      activityTimeline: [{
        id: `act-${leadId}`,
        type: 'lead_created',
        description: `Lead discovered via ${this.name}`,
        timestamp
      }],
      last_updated: timestamp,
      created_at: timestamp,
      metadata: data.metadata || {}
    };
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  async scrape(query, options = {}) {
    throw new Error('scrape() method must be implemented by subclass');
  }

  /**
   * Get scraper stats
   */
  getStats() {
    return {
      name: this.name,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      config: this.config
    };
  }
}

export default BaseScraper;
