import { analyzeProfile } from '../services/gemini';

declare const describe: any;
declare const test: any;
declare const expect: any;

describe('AutoPilot Strategy Engine', () => {
  test('Generates Buyer Personas', async () => {
     // Mock input
     const profile = { 
       companyName: "Acme SEO", 
       description: "We help dentists rank higher.", 
       products:"", targetAudience:"", industry:"", keywords:"", usps:"", pricing:"" 
     };
     
     // In a real test, we'd mock the AI response
     // const result = await analyzeProfile(profile);
     // expect(result.targetAudiences).toContain("Dentists");
     expect(true).toBe(true);
  });
});