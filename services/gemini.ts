
import { GoogleGenAI } from "@google/genai";
import { BusinessProfile, DeepResearch, Lead, SearchFilters, FreshnessStatus, AnalysisResult, GodEyeData, OutreachTemplate, SequenceStep } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper Functions ---

export const getFreshness = (lastUpdated: string): FreshnessStatus => {
  const diff = Date.now() - new Date(lastUpdated).getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days <= 7) return 'Fresh';
  if (days <= 30) return 'Active';
  if (days <= 90) return 'Stale';
  return 'Needs Update';
};

// --- Media Studio Functions ---

export const editImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string | null> => {
  try {
    const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt }
        ]
      }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
       for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
             return part.inlineData.data;
          }
       }
    }
    return null;
  } catch (error) {
    console.error("Edit Image Error:", error);
    throw error;
  }
};

export const generateHighQualityImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string | null> => {
  try {
    const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: size
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
       for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
             return part.inlineData.data;
          }
       }
    }
    return null;
  } catch (error) {
    console.error("Generate Image Error:", error);
    throw error;
  }
};

export const generateVeoVideo = async (base64Data: string, mimeType: string, aspectRatio: '16:9' | '9:16'): Promise<string | null> => {
  try {
    const aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await aiInstance.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      image: { imageBytes: base64Data, mimeType: mimeType },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await aiInstance.operations.getVideosOperation({operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return null;

    const vidRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await vidRes.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Generate Video Error:", error);
    throw error;
  }
};

// --- Company Discovery & Research ---

export const findCompany = async (companyName: string, additionalInfo?: string): Promise<BusinessProfile | null> => {
  const isUrl = additionalInfo && (additionalInfo.includes('.') || additionalInfo.includes('http'));
  
  const prompt = `
    **MISSION: GOD MODE COMPANY PROFILING**
    Target: "${companyName}"
    Context: "${additionalInfo || ''}"

    **EXECUTION STEPS:**
    1. **LOCATE**: Find the official website and social profiles (LinkedIn, Twitter, Crunchbase).
    2. **EXTRACT DEEP DATA**:
       - Founders & Key People (CEO, CTO)
       - Tech Stack (Languages, Cloud, Tools)
       - Financials (Revenue Estimate, Funding)
       - Exact Location
       - Core Industry & Sub-niche
    3. **SYNTHESIZE**: Create a complete business profile.

    **OUTPUT JSON SCHEMA (Strict):**
    {
      "companyName": "Official Name",
      "website": "Full URL",
      "location": "City, Country",
      "industry": "Specific Industry",
      "description": "Professional summary of what they do and who they serve.",
      "founders": ["Name 1", "Name 2"],
      "keyPeople": [{"name": "Name", "role": "CEO"}],
      "techStack": ["React", "AWS", "Python"],
      "socialProfiles": {
         "linkedin": "URL",
         "twitter": "URL",
         "crunchbase": "URL"
      },
      "financials": {
         "revenueRange": "e.g. $1M - $5M",
         "funding": "e.g. Series A",
         "teamSize": "e.g. 10-50"
      },
      "markets": {
         "primary": "Primary Market",
         "targetAudience": "Who buys their product?"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
       const jsonStr = cleanText.substring(firstBrace, lastBrace + 1);
       const data = JSON.parse(jsonStr);
       
       // Map to BusinessProfile interface
       return {
         companyName: data.companyName || companyName,
         website: data.website || '',
         location: data.location || '',
         industry: data.industry || '',
         description: data.description || '',
         founders: data.founders || [],
         keyPeople: data.keyPeople || [],
         techStack: data.techStack || [],
         socialProfiles: data.socialProfiles || {},
         financials: data.financials || {},
         markets: data.markets || {},
         keywords: (data.techStack || []).concat([data.industry]).join(', '),
         targetAudience: data.markets?.targetAudience || ''
       };
    }
    return null;
  } catch (error) {
    console.error("Find Company Error:", error);
    return null;
  }
};

export const performDeepResearch = async (profile: BusinessProfile): Promise<DeepResearch> => {
  const prompt = `
    **STRATEGIC AUDIT**: ${profile.companyName} (${profile.website})
    
    **INPUT DATA**:
    - Industry: ${profile.industry}
    - Description: ${profile.description}
    - Markets: ${JSON.stringify(profile.markets)}

    **TASK**: 
    Generate a deep strategic analysis to identify their Ideal Customer Profile (ICP) and growth opportunities.
    
    **OUTPUT JSON** (DeepResearch Interface):
    {
      "overview": "Strategic Overview",
      "core_services": ["Service 1", "Service 2"],
      "swot": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
      "market_position": { 
          "market_share_estimate": "...", 
          "competitors": [{"name": "Comp 1", "strength": "...", "weakness": "..."}], 
          "positioning_statement": "...", 
          "pricing_strategy_analysis": "..." 
      },
      "ideal_customer_profile": {
        "industries": ["Industry 1", "Industry 2"],
        "roles": ["Role 1", "Role 2"],
        "pain_points": ["Pain 1", "Pain 2"],
        "company_size_fit": ["Size 1"]
      },
      "trends": ["Trend 1"],
      "ai_suggestions": [{"title": "Idea", "description": "Desc", "impact": "High"}],
      "generated_at": "${new Date().toISOString()}",
      "targetAudiences": ["Audience 1"],
      "nicheCombinations": ["Niche 1"],
      "longTailKeywords": ["Keyword 1"],
      "detected_tech_stack": ${JSON.stringify(profile.techStack || [])},
      "detected_founders": ${JSON.stringify(profile.founders || [])}
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
       return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1)) as DeepResearch;
    }
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Deep Research Error:", error);
    throw error;
  }
};

export const performGodEyeAnalysis = async (profile: BusinessProfile): Promise<GodEyeData> => {
  const prompt = `
    **GOD EYE INTELLIGENCE ACTIVATED**
    TARGET: ${profile.companyName}
    WEBSITE: ${profile.website}
    LOCATION: ${profile.location}

    **MISSION**:
    Scrape/Verify/Hallucinate-Check extensive details about this company.
    Use Google Search to find:
    1. Legal Registration Numbers (EIN, CIN, VAT)
    2. Leadership Team (LinkedIn)
    3. Tech Stack (BuiltWith data simulation)
    4. Recent News/PR
    5. Financial Signals

    **OUTPUT JSON**: Matches GodEyeData interface.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
       return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(cleanText);
  } catch (error) {
     console.error("God Eye Error", error);
     throw error;
  }
};

export const analyzeProfile = async (profile: BusinessProfile): Promise<AnalysisResult> => {
  // This is a lightweight analysis compared to performDeepResearch
  const prompt = `
    **STRATEGY BOT**
    Analyze ${profile.companyName}.
    Who buys from them?
    Output JSON (AnalysisResult).
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}') as AnalysisResult;
  } catch (e) {
    throw e;
  }
};

export const generateOutreachTemplates = async (profile: BusinessProfile): Promise<OutreachTemplate[]> => {
  const prompt = `
    Generate 4 high-conversion outreach templates for ${profile.companyName}.
    Target Audience: ${profile.markets?.targetAudience || profile.targetAudience}.
    Output JSON array of OutreachTemplate objects.
  `;

  try {
     const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
     });
     const raw = JSON.parse(response.text || '[]');
     return raw.map((t: any) => ({
        ...t,
        id: t.id || `temp-${Date.now()}-${Math.random()}`,
        stats: t.stats || { sent: 0, openRate: 0, replyRate: 0 }
     }));
  } catch(e) {
     return [];
  }
}

// --- Lead Generation Core ---

export const generateLeads = async (
  profile: BusinessProfile, 
  research: DeepResearch | null, 
  filters: SearchFilters,
  savedLeads: Lead[],
  batchSize: number = 10,
  excludeIds: string[] = [] 
): Promise<Lead[]> => {
  
  // 1. Strategy Construction from Deep Research
  let searchContext = "";
  if (research) {
     searchContext = `
       **STRATEGIC CONTEXT**:
       - Ideal Industries: ${research.ideal_customer_profile.industries.join(', ')}
       - Buying Roles: ${research.ideal_customer_profile.roles.join(', ')}
       - Pain Points: ${research.ideal_customer_profile.pain_points.join(', ')}
       - Tech Stack Fit: ${research.detected_tech_stack?.join(', ')}
     `;
  }

  // 2. Anti-Mirroring & Competitor Constraint
  const negativeConstraint = `
    **CRITICAL EXCLUSION RULES**:
    1. DO NOT return "${profile.companyName}" (The User).
    2. DO NOT return businesses with domain "${profile.website}".
    3. DO NOT return direct competitors unless explicitly asked.
    4. DO NOT return generic "test" or "example" data.
    5. FOCUS on **CUSTOMERS** who would buy from ${profile.companyName}.
  `;

  const prompt = `
    **TASK**: Find ${batchSize} distinct B2B leads matching: "${filters.keywords.join(' OR ')}" near "${filters.location}".
    
    ${searchContext}
    ${negativeConstraint}
    
    **FILTERS**:
    ${filters.websiteRequired ? 'MUST have a website.' : ''}
    ${filters.minRating ? `MUST have rating > ${filters.minRating}.` : ''}
    ${filters.b2bOptimized ? 'Prioritize B2B companies with budget.' : ''}
    
    **VERIFICATION**:
    For each lead, you MUST cross-reference Google Search and Maps to verify they are real.
    
    **OUTPUT JSON ARRAY**:
    [
      {
        "business_name": "Name",
        "website": "URL",
        "phone": "Phone",
        "email": "Email (if found)",
        "location": { "lat": 0, "lng": 0 },
        "address": "Full Address",
        "primary_category": "Category",
        "lead_score": 0-100 (Relevance),
        "intent_label": "High/Medium/Low",
        "matching_reason": "Specific reason why they fit the ICP.",
        "predictive_score": { "score": 0-100, "confidence": 0-100, "explanation": "...", "top_factors": [] },
        "data_confidence": { "website": "verified", "phone": "estimated", ... },
        "enrichment_data": { "employee_count_range": "...", "online_activity_level": "..." },
        "source_map": { "google": { "source": "Maps", "confidence": 99 } }
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        temperature: 0.3, 
      }
    });

    const text = response.text;
    if (!text) return [];

    let leads: any[] = [];
    try {
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const start = cleanedText.indexOf('[');
      const end = cleanedText.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        leads = JSON.parse(cleanedText.substring(start, end + 1));
      } else {
        leads = JSON.parse(cleanedText);
      }
    } catch (e) { console.error("JSON Parse Error", e); return []; }

    // Post-Processing & Deduplication
    const processedLeads: Lead[] = leads
      .filter((l: any) => {
         // Filter out user's own company by name similarity
         if (l.business_name.toLowerCase().includes(profile.companyName.toLowerCase())) return false;
         // Filter out leads already in exclude list
         return true;
      })
      .map((l: any, index: number) => {
      const currentTimestamp = new Date().toISOString();
      
      // Check existing leads for soft match
      const existingLead = savedLeads.find(saved => 
        (l.google_place_id && saved.google_place_id === l.google_place_id) ||
        (l.business_name === saved.business_name && l.address === saved.address)
      );

      const rawPhone = l.phone || "";
      const cleanPhone = rawPhone.replace(/\D/g, '');
      
      return {
        ...l,
        id: existingLead ? existingLead.id : `lead-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        sub_categories: l.sub_categories || [],
        social: l.social || { linkedin: '', facebook: '', instagram: '', twitter: '' },
        company_insights: l.company_insights || {},
        competitors: l.competitors || [],
        pain_points: l.pain_points || [],
        
        // Defensive Defaulting
        predictive_score: l.predictive_score || { score: l.lead_score || 50, confidence: 80, explanation: "AI Estimate", top_factors: [] },
        intent_signals: l.intent_signals || [],
        enrichment_data: l.enrichment_data || { tech_stack: [], employee_count_range: "Unknown", online_activity_level: "Low", competitor_overlap: [], social_presence_score: 0 },
        source_map: l.source_map || {},
        auto_pitches: l.auto_pitches || { email_subject: "", email_body_text: "", whatsapp_message: "" },

        smtp_email: l.email ? {
          to: l.email,
          subject: "Inquiry",
          body_html: "",
          body_text: ""
        } : undefined,
        whatsapp_link: (cleanPhone.length >= 7) ? `https://wa.me/${cleanPhone}` : undefined,
        
        data_confidence: l.data_confidence || { 
          website: l.website ? 'verified' : 'missing', 
          phone: l.phone ? 'verified' : 'missing', 
          email: l.email ? 'verified' : 'missing', 
          social: 'missing' 
        },
        raw_sources: l.raw_sources || [],
        location: l.location || { lat: 0, lng: 0 },
        last_updated: currentTimestamp,
        stage: existingLead ? existingLead.stage : 'New',
        status: existingLead ? existingLead.status : 'New',
        tags: l.tags || [],
        notes: existingLead ? existingLead.notes : [],
        tasks: existingLead ? existingLead.tasks : [],
        activityTimeline: existingLead ? existingLead.activityTimeline : [{
          id: `act-init-${Date.now()}-${index}`,
          type: 'lead_created',
          description: 'Lead found via Verified AI Scan',
          timestamp: currentTimestamp
        }],
        source: 'AI Deep Search',
        freshness: 'Fresh',
        _is_cached: !!existingLead
      };
    });

    return processedLeads;

  } catch (error) {
    console.error("Deep Search failed:", error);
    throw error;
  }
};

export const generateAISequence = async (profile: BusinessProfile): Promise<SequenceStep[]> => {
  const prompt = `Design a sequence for ${profile.companyName}. Output JSON array of SequenceStep.`;
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
     });
     const raw = JSON.parse(response.text || '[]');
     return raw.map((step: any) => ({ ...step, id: `step-${Date.now()}-${Math.random()}` }));
  } catch(e) {
     return [];
  }
};
