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
 * Search for company information using Gemini AI with Google Search enhancement
 */
export async function findCompany(companyName, additionalInfo = '', modelName = 'gemini-2.5-pro') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // First, try to get real data from Google search
  const searchResults = await searchGoogle(companyName);
  
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.1, // Lower temperature for more factual responses
    }
  });

  let prompt = `You are a business intelligence expert. Find detailed information about the company "${companyName}".
${additionalInfo ? `Additional context: ${additionalInfo}` : ''}`;

  // If we have Google search results, include them
  if (searchResults) {
    prompt += `\n\nI found these search results for "${companyName}":\n`;
    prompt += `Website: ${searchResults.website}\n`;
    prompt += `Description: ${searchResults.snippet}\n`;
    if (searchResults.results) {
      prompt += `\nTop search results:\n`;
      searchResults.results.forEach((result, i) => {
        prompt += `${i + 1}. ${result.title} - ${result.link}\n   ${result.snippet}\n`;
      });
    }
    prompt += `\nUse this REAL search data as the primary source. `;
  } else {
    prompt += `\n\nIMPORTANT: Search your knowledge base for REAL, VERIFIED information about this company. `;
  }

  prompt += `Provide accurate details based on what you know or can infer from the search results.

Return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "success": true,
  "companyName": "Official company name",
  "website": "${searchResults?.website || 'Official website URL'}",
  "location": "City, Country (or 'Not specified' if unknown)",
  "industry": "Specific industry",
  "description": "Professional description (2-3 sentences)",
  "founders": ["Founder names if known, otherwise empty array"],
  "keyPeople": [{"name": "Name", "role": "Title"}],
  "techStack": ["Technologies they likely use"],
  "socialProfiles": {
    "linkedin": "LinkedIn URL if known",
    "twitter": "Twitter URL if known",
    "facebook": "Facebook URL if known"
  },
  "financials": {
    "revenueRange": "Revenue estimate or 'Not available'",
    "funding": "Funding info or 'Not available'",
    "teamSize": "Team size estimate or 'Not available'"
  },
  "markets": {
    "primary": "Primary market",
    "targetAudience": "Who they sell to"
  },
  "confidence": "${searchResults ? 'high' : 'medium'}"
}

IMPORTANT RULES:
1. If you have search results above, use them as the primary source
2. Use the website URL from search results
3. Be honest - if you don't know something, use "Not specified" or "Not available"
4. For well-known companies, provide detailed information
5. If the company is unknown or you're unsure, still return success:true but with limited data
6. NEVER return success:false unless the company name is clearly invalid

Even if information is limited, always try to return a profile with whatever data is available.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
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
    
    if (!data.success) {
      return null;
    }
    
    // Ensure website from search results is used if available
    if (searchResults && searchResults.website) {
      data.website = searchResults.website;
    }
    
    // Transform to expected format
    return {
      companyName: data.companyName || companyName,
      website: data.website || '',
      location: data.location || 'Not specified',
      industry: data.industry || 'Not specified',
      description: data.description || 'No description available',
      founders: data.founders || [],
      keyPeople: data.keyPeople || [],
      techStack: data.techStack || [],
      socialProfiles: data.socialProfiles || {},
      financials: data.financials || {},
      markets: data.markets || {},
      keywords: [...(data.techStack || []), data.industry].filter(Boolean).join(', '),
      targetAudience: data.markets?.targetAudience || '',
      confidence: data.confidence || 'medium',
      searchData: searchResults ? {
        foundViaGoogle: true,
        topResults: searchResults.results?.length || 0
      } : { foundViaGoogle: false }
    };
  } catch (error) {
    console.error('Company search error:', error.message);
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
