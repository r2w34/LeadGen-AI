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
    const { companyName, website, industry } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Analyze this company and provide detailed business intelligence:

Company Name: ${companyName}
${website ? `Website: ${website}` : ''}
${industry ? `Industry: ${industry}` : ''}

Provide a comprehensive analysis including:
1. Company Overview (2-3 sentences)
2. Key Products/Services
3. Target Market
4. Estimated Size (revenue range and employee count)
5. Market Position (competitor analysis)
6. Technology Stack (if tech company)
7. Recent News or Developments
8. Potential Pain Points
9. Decision Makers (typical titles)
10. Best Approach Strategy

Return as JSON with this structure:
{
  "overview": "string",
  "products": ["string"],
  "targetMarket": "string",
  "estimatedSize": {
    "revenue": "string",
    "employees": "string"
  },
  "marketPosition": "string",
  "techStack": ["string"],
  "recentNews": "string",
  "painPoints": ["string"],
  "decisionMakers": ["string"],
  "approachStrategy": "string",
  "fitScore": number (0-100),
  "confidence": "high" | "medium" | "low"
}

Be realistic and fact-based where possible. If you don't know something, indicate low confidence.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    let analysis;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
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

    return res.status(200).json({ 
      ...analysis,
      companyName,
      analyzedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Company analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze company',
      details: error.message 
    });
  }
}
