# Google Custom Search API Setup Guide

## Why You Need This

The company search feature has been enhanced to use **real Google search results** to find businesses. This provides:

- ✅ **Real-time data** from Google search
- ✅ **Accurate company websites** and information
- ✅ **Better search results** for any company
- ✅ **Higher confidence** in company profiles

Without Google Search API, the app will still work but rely only on Gemini AI's knowledge base, which may be less accurate for smaller or newer companies.

---

## How It Works

1. User searches for a company (e.g., "Microsoft", "Tesla", "Local Bakery NYC")
2. App searches Google to find the official website and top results
3. Google returns real search results with website URLs and descriptions
4. Gemini AI uses these **real search results** to build an accurate company profile
5. User gets accurate, up-to-date company information

---

## Setup Instructions (FREE - 100 searches/day)

### Step 1: Create Google Custom Search Engine

1. **Go to**: https://programmablesearchengine.google.com/

2. **Sign in** with your Google account (yashbhadane28@gmail.com)

3. **Click "Add"** or "Create" to create a new search engine

4. **Configure Search Engine**:
   - **Search engine name**: LeadGen AI Search
   - **What to search**: Select "Search the entire web"
   - **Advanced settings**:
     - ✅ Enable "Search the entire web"
     - ✅ Enable "Image search"

5. **Click "Create"**

6. **Get your Search Engine ID (cx)**:
   - After creating, you'll see: `cx = "your-search-engine-id"`
   - Copy this ID (looks like: `017576662512468239146:omuauf_lfve`)
   - **Save it** - you'll need this!

### Step 2: Enable Custom Search API

1. **Go to**: https://console.cloud.google.com/apis/dashboard

2. **Select your project** (or create a new one)

3. **Click "+ ENABLE APIS AND SERVICES"**

4. **Search for**: "Custom Search API"

5. **Click** on "Custom Search API"

6. **Click "ENABLE"**

### Step 3: Create API Key

1. **Still in Google Cloud Console**, go to:
   - **APIs & Services** → **Credentials**

2. **Click "+ CREATE CREDENTIALS"** → **API Key**

3. **Copy the API Key** that's generated (looks like: `AIzaSyD...`)

4. **(Recommended) Restrict the API Key**:
   - Click "Edit API key" (pencil icon)
   - Under "API restrictions", select "Restrict key"
   - Check only: **Custom Search API**
   - Under "Application restrictions" (optional):
     - Select "HTTP referrers" or "IP addresses"
     - Add your VPS IP: `34.29.164.144`
   - **Save**

### Step 4: Add to Environment Variables

**On your VPS** (after deployment):

```bash
# SSH to VPS
ssh -i /workspace/project/indigenssh yash@34.29.164.144

# Edit environment file
cd /home/yash/leadgen-ai/LeadGen-AI/server
nano .env

# Add these lines:
GOOGLE_SEARCH_API_KEY=AIzaSyD...your-api-key-here...
GOOGLE_SEARCH_ENGINE_ID=017576662512468239146:omuauf_lfve

# Save (Ctrl+O, Enter, Ctrl+X)

# Restart the application
pm2 restart leadgen-api
```

**Or if using Docker**:

```bash
# Edit .env file
nano /home/yash/leadgen-ai/LeadGen-AI/.env

# Add the same variables, then restart:
docker-compose restart api
```

---

## Verification

### Test API Key

```bash
# Replace with your actual values
API_KEY="AIzaSyD..."
SEARCH_ENGINE_ID="017576..."
QUERY="Microsoft official website"

curl "https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${QUERY}"
```

If working, you'll see JSON with search results.

### Test in Application

1. **Open**: https://leadgen.indigenservices.com
2. **Login** with your credentials
3. **Search for a company**: "Microsoft" or "Tesla" or any business
4. **Check backend logs**:
   ```bash
   pm2 logs leadgen-api
   ```
5. You should see: `[Gemini Service] Found Google search results for: Company Name`

---

## Pricing & Limits

### Free Tier (Perfect for Starting)
- **100 search queries per day** - FREE
- **10,000 queries per month** - FREE
- Perfect for testing and small usage

### Paid Tier (If You Need More)
- **$5 per 1,000 queries** after free tier
- First 10,000 queries/month are still free
- Only pay for what you use beyond free tier

### Cost Examples
- **100 searches/day** = FREE (within free tier)
- **500 searches/day** = ~$60/month ($5 × 5,000 extra queries)
- **1,000 searches/day** = ~$150/month ($5 × 20,000 extra queries)

---

## Important Notes

### Without Google Search API

The app will still work! It will:
- ✅ Use Gemini AI's knowledge base only
- ⚠️ May have less accurate data for small/new companies
- ⚠️ May not find the correct website URL
- ⚠️ Lower confidence scores

### With Google Search API

The app will:
- ✅ Use **real Google search results**
- ✅ Find accurate company websites
- ✅ Provide up-to-date information
- ✅ Higher confidence in results
- ✅ Better for ANY company (big or small)

---

## Troubleshooting

### Error: "API key not valid"
**Solution**: 
- Check the API key is copied correctly
- Ensure Custom Search API is enabled in Google Cloud Console
- Check API key restrictions (if any)

### Error: "Invalid Value" or "cx parameter is missing"
**Solution**:
- Check Search Engine ID (cx) is correct
- Format: `017576662512468239146:omuauf_lfve`

### No search results returned
**Solution**:
- Verify Search Engine is set to "Search the entire web"
- Check API key has Custom Search API enabled
- Test the API directly with curl command above

### Still not working?
**Check logs**:
```bash
pm2 logs leadgen-api --lines 50
```

Look for errors mentioning "Google search" or "Custom Search"

---

## Environment Variables Summary

Add these to your `.env` file in the `server` directory:

```env
# Existing variables
GEMINI_API_KEY=AIzaSyChOuW1O5xu_1uF6eUfL0zeDIXuzCaNM3k
DB_USER=leadgen_user
DB_PASSWORD=leadgen_secure_2024
DB_NAME=leadgen_ai
DB_HOST=localhost
DB_PORT=5432
API_PORT=3001
JWT_SECRET=leadgen-jwt-secret-key-2024-change-in-production

# NEW - Google Search API (Optional but Recommended)
GOOGLE_SEARCH_API_KEY=your-google-custom-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
```

---

## Quick Links

- **Create Search Engine**: https://programmablesearchengine.google.com/
- **Google Cloud Console**: https://console.cloud.google.com/
- **Enable Custom Search API**: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
- **API Documentation**: https://developers.google.com/custom-search/v1/overview

---

**Setup Time**: ~10 minutes  
**Cost**: FREE (100 searches/day)  
**Benefit**: Much better company search results! 🎯

---

**Created**: 2025-11-28  
**For**: LeadGen AI - Enhanced Company Search
