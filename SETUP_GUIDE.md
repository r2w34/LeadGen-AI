# 🚀 LeadGen-AI Setup Guide

Complete guide to get your LeadGen-AI app running locally and deploying to Google Cloud.

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ Node.js v18+ installed
- ✅ Git installed
- ✅ Google Cloud account (with billing enabled)
- ✅ Text editor (VS Code recommended)

---

## 🔑 Step 1: Get Your API Keys

### 1.1 Supabase (Database)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new organization (free)
4. Create new project:
   - Name: `leadgen-ai`
   - Database Password: (save this!)
   - Region: Choose closest to you
   - Wait 2-3 minutes for setup
5. Get your keys:
   - Go to Settings → API
   - Copy `Project URL` → This is your `VITE_SUPABASE_URL`
   - Copy `anon public` key → This is your `VITE_SUPABASE_ANON_KEY`
   - Copy `service_role` key → This is your `SUPABASE_SERVICE_KEY`

### 1.2 Google Gemini AI

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key → This is your `GEMINI_API_KEY`
4. ⚠️ **Store this safely - you can't see it again!**

### 1.3 SendGrid (Email)

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account (100 emails/day free)
3. Verify your email
4. Create API key:
   - Go to Settings → API Keys
   - Create API Key
   - Name: `leadgen-ai`
   - Full Access
   - Copy key → This is your `SENDGRID_API_KEY`
5. Verify sender email:
   - Go to Settings → Sender Authentication
   - Verify Single Sender
   - Use your email → This is your `SENDGRID_FROM_EMAIL`
   - Check your inbox and verify

---

## 💾 Step 2: Setup Database

### 2.1 Run SQL Schema

1. Open your Supabase project dashboard
2. Go to SQL Editor (left sidebar)
3. Click "New Query"
4. Copy the entire contents of `supabase-schema.sql` file
5. Paste into the SQL editor
6. Click "Run" or press Ctrl+Enter
7. Wait for success message: "LeadGen-AI database schema created successfully!"

### 2.2 Verify Tables Created

1. Go to Table Editor (left sidebar)
2. You should see these tables:
   - `profiles`
   - `business_profiles`
   - `leads`
   - `search_filters`
   - `email_templates`
   - `email_campaigns`
   - `email_logs`
   - `user_stats`

---

## ⚙️ Step 3: Configure Environment

### 3.1 Create .env.local File

In the project root directory, create `.env.local`:

```bash
cd /workspace/project/LeadGen-AI
cp .env.example .env.local
```

### 3.2 Add Your API Keys

Edit `.env.local` and replace with your actual keys:

```env
# Frontend Environment Variables
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend API Keys (NEVER expose these!)
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=your-verified-email@example.com
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Verify .gitignore

Make sure `.env.local` is in `.gitignore` (it should be already):

```bash
cat .gitignore | grep .env
```

Should show:
```
.env
.env.local
.env.*.local
```

---

## 🏃 Step 4: Run Locally

### 4.1 Install Dependencies (if not done)

```bash
npm install
```

### 4.2 Start Development Server

```bash
npm run dev
```

You should see:
```
  VITE v6.2.0  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4.3 Open in Browser

1. Open: http://localhost:5173
2. You should see the LeadGen-AI login page!

---

## ✅ Step 5: Test the App

### Test 1: Authentication
1. Click "Sign Up"
2. Enter email and password
3. Should create account successfully
4. Login with same credentials
5. ✅ Should see dashboard

### Test 2: Business Profile
1. Fill out your business information:
   - Company name
   - Industry
   - Target market
   - Products/services
2. Click Save
3. ✅ Data should save to Supabase

### Test 3: Lead Generation
1. Set search filters:
   - Location
   - Keywords
   - Industry
2. Click "Generate Leads"
3. ✅ Should get 5-10 AI-generated leads

### Test 4: Data Persistence
1. Close browser tab
2. Reopen http://localhost:5173
3. Login again
4. ✅ Your leads should still be there!

### Test 5: Email Sending
1. Select a lead
2. Click "Send Email"
3. Customize message
4. Click Send
5. ✅ Check SendGrid dashboard for sent email

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:**
```bash
# Check .env.local exists
ls -la .env.local

# Check variables are set
cat .env.local

# Make sure variables start with VITE_ for frontend
```

### Issue: "Failed to generate leads"

**Possible causes:**
1. Invalid Gemini API key
2. API quota exceeded
3. Network issue

**Solution:**
```bash
# Test Gemini API key
curl https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY

# Check browser console for errors (F12)
```

### Issue: "Email sending failed"

**Possible causes:**
1. Invalid SendGrid API key
2. Sender email not verified
3. Free tier limit reached (100/day)

**Solution:**
1. Verify sender email in SendGrid dashboard
2. Check API key has "Full Access"
3. Check SendGrid activity logs

### Issue: "Database connection failed"

**Solution:**
```bash
# Verify Supabase project is running
# Go to supabase.com dashboard
# Check project status

# Test connection
# Open browser console (F12)
# Type: localStorage.getItem('supabase.auth.token')
```

---

## 🧪 Testing Checklist

Before deploying, verify all features work:

- [ ] User signup/login
- [ ] Business profile save/load
- [ ] AI lead generation
- [ ] Lead list displays
- [ ] Lead details modal
- [ ] CRM pipeline (drag & drop)
- [ ] Email sending
- [ ] Data persists after reload
- [ ] No console errors
- [ ] Responsive on mobile

---

## 📊 Monitor Usage

### Supabase Usage
1. Go to Supabase dashboard
2. Click your project
3. Settings → Usage
4. Check:
   - Database size (500MB free)
   - API requests (50,000/month free)
   - Auth users (50,000 free)

### Gemini AI Usage
1. Go to Google Cloud Console
2. Navigation Menu → APIs & Services → Credentials
3. Click your API key
4. View quotas and usage

### SendGrid Usage
1. Go to SendGrid dashboard
2. Activity → Overview
3. Check emails sent today (100/day free)

---

## 🎉 Success!

If all tests pass, you're ready to deploy to Google Cloud!

### Next Steps:

1. **Local Development Complete** ✅
2. **Deploy to Google Cloud** → Follow `GOOGLE_CLOUD_DEPLOYMENT.md`
3. **Test in Production**
4. **Launch! 🚀**

---

## 💡 Tips

### Development Tips:
- Use browser DevTools (F12) to debug
- Check Network tab for API errors
- Check Console tab for JavaScript errors
- Use React DevTools extension

### Cost Optimization:
- Stay within free tiers initially
- Monitor API usage daily
- Set up budget alerts
- Only generate leads when needed

### Security Tips:
- Never commit `.env.local` to git
- Never share your API keys
- Rotate keys if exposed
- Use environment-specific keys

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [SendGrid Docs](https://docs.sendgrid.com)
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)

---

**Ready to deploy?** Open `GOOGLE_CLOUD_DEPLOYMENT.md` and let's get your app live on Google Cloud! 🚀
