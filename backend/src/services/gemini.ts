import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

interface SearchFilters {
  industry?: string;
  location?: string;
  companySize?: string;
}

interface Lead {
  companyName: string;
  website: string;
  industry: string;
  companySize: string;
  location: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  fitScore: number;
}

export async function generateLeads(filters: SearchFilters): Promise<Lead[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a B2B lead generation expert. Generate 5-10 realistic, high-quality leads based on these criteria:

Industry: ${filters.industry || 'Technology'}
Location: ${filters.location || 'United States'}
Company Size: ${filters.companySize || '10-50 employees'}

For each lead, provide:
- Company name (realistic, fictional company)
- Website URL
- Industry
- Company size
- Location (city, state/country)
- Contact name (decision maker)
- Contact title (CEO, VP Sales, etc.)
- Email address (professional format)
- Phone number (with country code)
- LinkedIn profile URL
- Fit score (0-100, how well they match the criteria)

Return ONLY a valid JSON array of lead objects. Example format:
[
  {
    "companyName": "TechCorp Solutions",
    "website": "https://techcorp-solutions.com",
    "industry": "SaaS",
    "companySize": "25-50",
    "location": "San Francisco, CA",
    "contactName": "Sarah Johnson",
    "contactTitle": "CEO",
    "email": "sarah.johnson@techcorp-solutions.com",
    "phone": "+1-415-555-0123",
    "linkedinUrl": "https://linkedin.com/in/sarahjohnson",
    "fitScore": 85
  }
]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in AI response');
    }
    
    const leads: Lead[] = JSON.parse(jsonMatch[0]);
    return leads;
  } catch (error) {
    console.error('Gemini API error:', error);
    // Return mock data if AI fails
    return generateMockLeads(filters);
  }
}

export async function analyzeCompany(companyName: string, website?: string): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze the company "${companyName}"${website ? ` (website: ${website})` : ''} and provide a comprehensive business intelligence report.

Include:
1. Company overview and description
2. Industry and market segment
3. Estimated company size and revenue
4. Technology stack (if applicable)
5. Key products/services
6. Target market and customers
7. Competitors
8. Recent news or funding (if known)
9. Key people (CEO, founders, executives)
10. Growth potential and market opportunities

Return a detailed JSON object with this structure:
{
  "companyName": "...",
  "industry": "...",
  "description": "...",
  "size": "...",
  "revenue": "...",
  "techStack": ["..."],
  "products": ["..."],
  "targetMarket": "...",
  "competitors": ["..."],
  "funding": "...",
  "keyPeople": [{"name": "...", "title": "..."}],
  "growthPotential": "...",
  "opportunities": ["..."]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Company analysis error:', error);
    return {
      companyName,
      error: 'Failed to analyze company',
      message: 'Please try again or provide more information'
    };
  }
}

// Fallback mock data generator
function generateMockLeads(filters: SearchFilters): Lead[] {
  const mockLeads: Lead[] = [
    {
      companyName: "Innovate Tech Solutions",
      website: "https://innovate-tech.com",
      industry: filters.industry || "Technology",
      companySize: filters.companySize || "25-50",
      location: filters.location || "San Francisco, CA",
      contactName: "Emily Chen",
      contactTitle: "VP of Sales",
      email: "emily.chen@innovate-tech.com",
      phone: "+1-415-555-0101",
      linkedinUrl: "https://linkedin.com/in/emilychen",
      fitScore: 88
    },
    {
      companyName: "DataFlow Systems",
      website: "https://dataflow-systems.com",
      industry: filters.industry || "SaaS",
      companySize: filters.companySize || "50-100",
      location: filters.location || "Austin, TX",
      contactName: "Michael Rodriguez",
      contactTitle: "CEO",
      email: "michael.r@dataflow-systems.com",
      phone: "+1-512-555-0202",
      linkedinUrl: "https://linkedin.com/in/michaelrodriguez",
      fitScore: 92
    },
    {
      companyName: "CloudScale Inc",
      website: "https://cloudscale.io",
      industry: filters.industry || "Cloud Services",
      companySize: filters.companySize || "10-25",
      location: filters.location || "Seattle, WA",
      contactName: "Jessica Park",
      contactTitle: "Head of Business Development",
      email: "j.park@cloudscale.io",
      phone: "+1-206-555-0303",
      linkedinUrl: "https://linkedin.com/in/jessicapark",
      fitScore: 85
    },
    {
      companyName: "NextGen Analytics",
      website: "https://nextgen-analytics.com",
      industry: filters.industry || "Data Analytics",
      companySize: filters.companySize || "30-60",
      location: filters.location || "New York, NY",
      contactName: "David Kim",
      contactTitle: "Director of Partnerships",
      email: "david.kim@nextgen-analytics.com",
      phone: "+1-212-555-0404",
      linkedinUrl: "https://linkedin.com/in/davidkim",
      fitScore: 90
    },
    {
      companyName: "SmartOps Solutions",
      website: "https://smartops.tech",
      industry: filters.industry || "Operations Software",
      companySize: filters.companySize || "15-40",
      location: filters.location || "Denver, CO",
      contactName: "Amanda White",
      contactTitle: "Chief Revenue Officer",
      email: "a.white@smartops.tech",
      phone: "+1-303-555-0505",
      linkedinUrl: "https://linkedin.com/in/amandawhite",
      fitScore: 87
    }
  ];
  
  return mockLeads;
}
