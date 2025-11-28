import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Search Google for company information
 */
async function searchGoogle(companyName) {
  try {
    // Try to search via Google Custom Search API if available
    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
      const query = encodeURIComponent(`${companyName} official website`);
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=3`;
      
      const response = await fetch(url, { timeout: 10000 });
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return {
          website: data.items[0].link,
          snippet: data.items[0].snippet,
          title: data.items[0].title,
          results: data.items.slice(0, 3).map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
          }))
        };
      }
    }
    
    // If no API key or API fails, return basic info
    return null;
  } catch (error) {
    console.error('Google search error:', error.message);
    return null;
  }
}

/**
 * Fetch and extract content from a website URL
 */
async function fetchWebsiteContent(url) {
  try {
    console.log(`Fetching website content from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      console.log(`Website fetch failed: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Extract text content (remove HTML tags)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Get first 2000 characters of clean text
    const content = text.substring(0, 2000);
    
    // Extract meta description if available
    const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const description = metaMatch ? metaMatch[1] : '';
    
    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    return {
      url,
      title,
      description,
      content,
      found: true
    };
  } catch (error) {
    console.error(`Error fetching website ${url}:`, error.message);
    return null;
  }
}

/**
 * Check if a string is a URL
 */
function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Search for company information using Gemini AI with Google Search enhancement
 */
export async function findCompany(companyName, additionalInfo = '', modelName = 'gemini-2.5-pro') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  let websiteData = null;
  let searchResults = null;
  
  // Check if additionalInfo is a URL - if so, fetch the website directly
  if (additionalInfo && isURL(additionalInfo)) {
    console.log(`Additional info is a URL, fetching website: ${additionalInfo}`);
    websiteData = await fetchWebsiteContent(additionalInfo);
    if (!websiteData) {
      console.log('Website fetch failed, trying Google search...');
      searchResults = await searchGoogle(companyName);
    }
  } else {
    // Try to get real data from Google search
    searchResults = await searchGoogle(companyName);
  }
  
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.1, // Lower temperature for more factual responses
    }
  });

  let prompt = `You are a business intelligence expert. Find detailed information about the company "${companyName}".`;

  // If we have website data from direct URL fetch
  if (websiteData) {
    prompt += `\n\nI have VERIFIED the company website at ${websiteData.url}:\n`;
    prompt += `Website Title: ${websiteData.title}\n`;
    prompt += `Meta Description: ${websiteData.description}\n`;
    prompt += `Website Content:\n${websiteData.content}\n`;
    prompt += `\nThis is REAL, VERIFIED data from their actual website. Use this as the PRIMARY source.`;
  }
  // If we have Google search results
  else if (searchResults) {
    prompt += `\n\nI found these search results for "${companyName}":\n`;
    prompt += `Website: ${searchResults.website}\n`;
    prompt += `Description: ${searchResults.snippet}\n`;
    if (searchResults.results) {
      prompt += `\nTop search results:\n`;
      searchResults.results.forEach((result, i) => {
        prompt += `${i + 1}. ${result.title} - ${result.link}\n   ${result.snippet}\n`;
      });
    }
    prompt += `\nUse this REAL search data as the primary source.`;
  }
  // Neither website nor search results
  else {
    if (additionalInfo) {
      prompt += `\n\nAdditional context: ${additionalInfo}`;
    }
    prompt += `\n\nIMPORTANT: Search your knowledge base for REAL, VERIFIED information about this company.`;
  }

  const websiteUrl = websiteData?.url || searchResults?.website || '';
  
  prompt += `\n\nProvide accurate details based on the verified data above or your knowledge.

Return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "success": true,
  "companyName": "Official company name from the website/data",
  "website": "${websiteUrl || 'Website URL if known'}",
  "location": "City, Country (extract from website if available, or 'Not specified')",
  "industry": "Specific industry (infer from website content)",
  "description": "Professional description (2-3 sentences based on website content)",
  "founders": ["Founder names if mentioned on website, otherwise empty"],
  "keyPeople": [{"name": "Name", "role": "Title"}],
  "techStack": ["Technologies they use (infer from website)"],
  "socialProfiles": {
    "linkedin": "LinkedIn URL if found",
    "twitter": "Twitter URL if found",
    "facebook": "Facebook URL if found"
  },
  "financials": {
    "revenueRange": "Revenue estimate or 'Not available'",
    "funding": "Funding info or 'Not available'",
    "teamSize": "Team size estimate or 'Not available'"
  },
  "markets": {
    "primary": "Primary market (infer from website)",
    "targetAudience": "Who they sell to (infer from content)"
  },
  "confidence": "${websiteData || searchResults ? 'high' : 'medium'}"
}

CRITICAL RULES FOR SUCCESS:
1. ${websiteData ? 'USE THE VERIFIED WEBSITE CONTENT ABOVE as your primary source' : 'Use search results if available'}
2. ALWAYS return success:true (even with limited data)
3. Extract company name, industry, description from the website content
4. Use "${websiteUrl}" as the website URL
5. Be honest - if you don't know something, use "Not specified" or "Not available"
6. Infer industry and services from the website content
7. NEVER return success:false - always try to extract what you can

Even with minimal information, return a profile with whatever is available.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log(`AI Response received for ${companyName}`);
    
    // Extract JSON from response
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
    
    // Find JSON object bounds
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON found in response');
    }
    
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonText);
    
    // Even if AI says success:false, we try to salvage data
    if (!data.success && !websiteData && !searchResults) {
      console.log('AI returned success:false, no fallback data available');
      return null;
    }
    
    // Force success if we have website or search data
    if (websiteData || searchResults) {
      data.success = true;
    }
    
    // Ensure website from verified sources
    if (websiteData && websiteData.url) {
      data.website = websiteData.url;
    } else if (searchResults && searchResults.website) {
      data.website = searchResults.website;
    }
    
    // Transform to expected format
    const profile = {
      companyName: data.companyName || companyName,
      website: data.website || websiteUrl || '',
      location: data.location || 'Not specified',
      industry: data.industry || 'Not specified',
      description: data.description || websiteData?.description || 'No description available',
      founders: data.founders || [],
      keyPeople: data.keyPeople || [],
      techStack: data.techStack || [],
      socialProfiles: data.socialProfiles || {},
      financials: data.financials || {},
      markets: data.markets || {},
      keywords: [...(data.techStack || []), data.industry].filter(Boolean).join(', '),
      targetAudience: data.markets?.targetAudience || '',
      confidence: data.confidence || 'medium',
      searchData: {
        foundViaGoogle: !!searchResults,
        websiteVerified: !!websiteData,
        topResults: searchResults?.results?.length || 0
      }
    };
    
    console.log(`Successfully created profile for ${companyName}`);
    return profile;
  } catch (error) {
    console.error('Company search error:', error.message);
    
    // If we have website data, create a basic profile even if AI fails
    if (websiteData) {
      console.log('AI failed but we have website data, creating basic profile');
      return {
        companyName: websiteData.title || companyName,
        website: websiteData.url,
        location: 'Not specified',
        industry: 'Not specified',
        description: websiteData.description || 'No description available',
        founders: [],
        keyPeople: [],
        techStack: [],
        socialProfiles: {},
        financials: {},
        markets: {},
        keywords: '',
        targetAudience: '',
        confidence: 'medium',
        searchData: {
          foundViaGoogle: false,
          websiteVerified: true,
          topResults: 0
        }
      };
    }
    
    throw error;
  }
}

/**
 * Perform deep strategic research
 */
export async function performDeepResearch(profile, modelName = 'gemini-2.5-pro') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ 
    model: modelName,
  });

  const prompt = `You are a strategic business analyst. Analyze this company and provide deep strategic insights:

Company: ${profile.companyName}
Website: ${profile.website}
Industry: ${profile.industry}
Description: ${profile.description}
Location: ${profile.location}

Provide comprehensive analysis in JSON format (no markdown):
{
  "overview": "Strategic overview (2-3 sentences)",
  "core_services": ["Service 1", "Service 2", "Service 3"],
  "swot": {
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "threats": ["Threat 1", "Threat 2"]
  },
  "market_position": {
    "market_share_estimate": "Market position",
    "competitors": [{"name": "Competitor", "strength": "Advantage", "weakness": "Disadvantage"}],
    "positioning_statement": "Positioning",
    "pricing_strategy_analysis": "Pricing insights"
  },
  "ideal_customer_profile": {
    "industries": ["Industry 1", "Industry 2"],
    "roles": ["CEO", "CTO", "VP Sales"],
    "pain_points": ["Pain 1", "Pain 2", "Pain 3"],
    "company_size_fit": ["SMB", "Enterprise"]
  },
  "trends": ["Trend 1", "Trend 2"],
  "ai_suggestions": [
    {"title": "Strategy", "description": "Details", "impact": "High"}
  ],
  "targetAudiences": ["Audience 1"],
  "nicheCombinations": ["Niche 1"],
  "longTailKeywords": ["Keyword 1"],
  "detected_tech_stack": ${JSON.stringify(profile.techStack || [])},
  "detected_founders": ${JSON.stringify(profile.founders || [])},
  "generated_at": "${new Date().toISOString()}"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let jsonText = text.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
    
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Deep research error:', error.message);
    throw error;
  }
}

/**
 * Generate targeted B2B leads
 */
export async function generateLeads(profile, research, filters = {}, count = 10, modelName = 'gemini-2.5-pro') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ 
    model: modelName,
  });

  const keywords = filters.keywords?.join(', ') || profile.keywords || profile.industry;
  const location = filters.location || profile.location || 'United States';
  
  const icpContext = research ? `
Target Customer Profile:
- Industries: ${research.ideal_customer_profile.industries.join(', ')}
- Decision Makers: ${research.ideal_customer_profile.roles.join(', ')}
- Pain Points: ${research.ideal_customer_profile.pain_points.join(', ')}
- Company Sizes: ${research.ideal_customer_profile.company_size_fit.join(', ')}
` : '';

  const prompt = `You are an expert B2B lead generation specialist. Generate ${count} high-quality potential customer leads for:

**Company Seeking Customers:**
- Name: ${profile.companyName}
- Industry: ${profile.industry}
- Services: ${profile.description}
- Target Market: ${profile.targetAudience || 'B2B companies'}

${icpContext}

**Search Parameters:**
- Keywords: ${keywords}
- Location: ${location}
- Focus: B2B companies that would PURCHASE from ${profile.companyName}

**CRITICAL RULES:**
1. DO NOT include "${profile.companyName}" itself
2. DO NOT include competitors
3. ONLY include potential CUSTOMERS
4. Provide realistic company names that could exist
5. Each lead must have clear fit reasoning

Return JSON array (no markdown):
[
  {
    "business_name": "Company Name",
    "website": "https://example.com",
    "phone": "+1-555-0100",
    "email": "contact@example.com",
    "address": "123 Main St, City, State ZIP",
    "location": {"lat": 37.7749, "lng": -122.4194},
    "primary_category": "Industry",
    "sub_categories": ["Sub 1", "Sub 2"],
    "lead_score": 85,
    "intent_label": "High",
    "matching_reason": "Specific reason why they need ${profile.companyName}'s services",
    "predictive_score": {
      "score": 85,
      "confidence": 90,
      "explanation": "Why valuable",
      "top_factors": ["Factor 1", "Factor 2"]
    },
    "data_confidence": {
      "website": "verified",
      "phone": "estimated",
      "email": "estimated"
    },
    "enrichment_data": {
      "employee_count_range": "10-50",
      "estimated_revenue": "$1M-$5M",
      "tech_stack": ["Tech 1"],
      "online_activity_level": "Medium"
    },
    "pain_points": ["Pain they likely have"],
    "company_insights": {
      "business_model": "B2B",
      "growth_stage": "Growth"
    },
    "social": {
      "linkedin": "URL",
      "twitter": "",
      "facebook": ""
    }
  }
]

Make these realistic, valuable leads.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
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
    
    // Enrich with metadata
    return leads.map((lead, index) => {
      const timestamp = new Date().toISOString();
      const leadId = `lead-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      const cleanPhone = (lead.phone || '').replace(/\D/g, '');
      
      return {
        id: leadId,
        ...lead,
        whatsapp_link: cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone}` : null,
        smtp_email: lead.email ? {
          to: lead.email,
          subject: `Partnership Opportunity`,
          body_text: '',
          body_html: ''
        } : null,
        source_map: { ai: { source: 'Gemini AI', confidence: 85 } },
        raw_sources: [],
        google_place_id: null,
        stage: 'New',
        status: 'New',
        tags: [],
        notes: [],
        tasks: [],
        activityTimeline: [{
          id: `act-${leadId}`,
          type: 'lead_created',
          description: 'Lead discovered via AI',
          timestamp
        }],
        source: 'AI Deep Search',
        freshness: 'Fresh',
        last_updated: timestamp,
        created_at: timestamp
      };
    });
  } catch (error) {
    console.error('Lead generation error:', error.message);
    throw error;
  }
}

export default {
  findCompany,
  performDeepResearch,
  generateLeads
};
