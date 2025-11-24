import { GoogleGenerativeAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profile, filters, batchSize = 10 } = req.body;

    if (!profile || !filters) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build the prompt
    const prompt = `You are a B2B lead generation expert. Generate ${batchSize} high-quality, realistic business leads based on the following criteria:

Business Profile:
- Company: ${profile.companyName}
- Industry: ${profile.industry}
- Target Market: ${profile.targetMarket}
- Product/Service: ${profile.productService}

Search Filters:
- Location: ${filters.location || 'Any'}
- Keywords: ${filters.keywords?.join(', ') || 'Any'}
- Company Size: ${filters.companySize || 'Any'}
- Industry: ${filters.industry || 'Any'}

Generate REAL-LOOKING leads with:
1. Realistic company names (real or plausible)
2. Decision maker names and titles
3. Contact information (format: realistic but not real)
4. Company websites
5. Brief company description
6. Estimated revenue range
7. Number of employees
8. Why they're a good fit

Return the data as a JSON array with this exact structure:
[
  {
    "companyName": "string",
    "contactName": "string",
    "title": "string",
    "email": "string (realistic format)",
    "phone": "string (format: +1-XXX-XXX-XXXX)",
    "website": "string (realistic URL)",
    "industry": "string",
    "companySize": "string (e.g., '50-200 employees')",
    "location": "string (City, State/Country)",
    "revenue": "string (e.g., '$5M-$10M')",
    "description": "string (2-3 sentences)",
    "fitScore": number (0-100),
    "fitReason": "string (why they're a good match)"
  }
]

Make them diverse and realistic. Use real industry patterns.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    let leads;
    try {
      // Try to find JSON in the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        leads = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: text.substring(0, 200)
      });
    }

    // Add IDs and timestamps
    const leadsWithMetadata = leads.map((lead: any, index: number) => ({
      ...lead,
      id: `lead_${Date.now()}_${index}`,
      source: 'AI Generated',
      status: 'new',
      createdAt: new Date().toISOString(),
    }));

    return res.status(200).json({ 
      leads: leadsWithMetadata,
      count: leadsWithMetadata.length
    });

  } catch (error: any) {
    console.error('Lead generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate leads',
      details: error.message 
    });
  }
}
