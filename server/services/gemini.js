import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Search for company information using Gemini AI
 */
export async function findCompany(companyName, additionalInfo = '', modelName = 'gemini-2.5-pro') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = genAI.getGenerativeModel({ 
    model: modelName,
  });

  const prompt = `You are a business intelligence expert with access to comprehensive business databases. Find detailed information about the company "${companyName}".
${additionalInfo ? `Additional context: ${additionalInfo}` : ''}

Search for and provide REAL, VERIFIED information. If the company exists, provide detailed data. If you cannot find real information, clearly indicate what is unknown.

Return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "success": true,
  "companyName": "Official company name",
  "website": "Official website URL",
  "location": "City, Country",
  "industry": "Specific industry",
  "description": "Professional description (2-3 sentences)",
  "founders": ["Founder names"],
  "keyPeople": [{"name": "Name", "role": "Title"}],
  "techStack": ["Technologies"],
  "socialProfiles": {
    "linkedin": "LinkedIn URL",
    "twitter": "Twitter URL",
    "facebook": "Facebook URL"
  },
  "financials": {
    "revenueRange": "Revenue estimate",
    "funding": "Funding info",
    "teamSize": "Team size estimate"
  },
  "markets": {
    "primary": "Primary market",
    "targetAudience": "Who they sell to"
  },
  "confidence": "high"
}

If company not found:
{
  "success": false,
  "error": "Company not found"
}`;

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
    
    // Transform to expected format
    return {
      companyName: data.companyName || companyName,
      website: data.website || '',
      location: data.location || 'Unknown',
      industry: data.industry || 'Unknown',
      description: data.description || 'No description available',
      founders: data.founders || [],
      keyPeople: data.keyPeople || [],
      techStack: data.techStack || [],
      socialProfiles: data.socialProfiles || {},
      financials: data.financials || {},
      markets: data.markets || {},
      keywords: [...(data.techStack || []), data.industry].filter(Boolean).join(', '),
      targetAudience: data.markets?.targetAudience || '',
      confidence: data.confidence || 'medium'
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
