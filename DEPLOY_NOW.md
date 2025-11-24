# 🚀 Deploy LeadGen-AI to Google Cloud NOW!

## Quick Start (5 Minutes to Deploy!)

### ⚠️ Important: Authentication Required

I cannot directly deploy to your Google Cloud account without your authentication. You have **3 options**:

---

## Option 1: Run Automated Script (Recommended) ✅

### Step 1: Authenticate
```bash
# Set PATH to include gcloud
export PATH="/tmp/google-cloud-sdk/google-cloud-sdk/bin:$PATH"

# Login to Google Cloud (opens browser)
gcloud auth login

# Or use service account (if you have one)
# gcloud auth activate-service-account --key-file=key.json
```

### Step 2: Deploy
```bash
# Set your project ID
export PROJECT_ID="your-project-id-here"

# Run automated deployment
./deploy-to-gcp.sh
```

**That's it!** The script will:
- ✅ Create all resources
- ✅ Deploy backend
- ✅ Deploy frontend
- ✅ Configure everything
- ✅ Give you the live URL

---

## Option 2: Use Google Cloud Console (Web UI)

### For Backend:

1. **Go to Cloud Run:** https://console.cloud.google.com/run
2. **Click "Create Service"**
3. **Select "Deploy one revision from an existing container image"**
4. **Or use "Continuously deploy new revisions from a source repository"**
   - Connect your GitHub repo: `r2w34/LeadGen-AI`
   - Set source directory: `/backend`
   - Click **Deploy**

### For Database:

1. **Go to Cloud SQL:** https://console.cloud.google.com/sql
2. **Click "Create Instance" → PostgreSQL**
3. **Choose configuration:**
   - Instance ID: `leadgen-db`
   - Password: (set a secure password)
   - Region: `us-central1`
   - Version: PostgreSQL 15
   - Tier: `db-f1-micro` ($10/month)
4. **Create database:**
   - Name: `leadgen`
5. **Import schema:**
   - Upload `postgresql-schema.sql`

### For Frontend:

1. **Go to Cloud Storage:** https://console.cloud.google.com/storage
2. **Create bucket:**
   - Name: `your-project-id-frontend`
   - Location: `us-central1`
3. **Build frontend locally:**
   ```bash
   npm run build
   ```
4. **Upload `dist/` folder to bucket**
5. **Make bucket public:**
   - Permissions → Add Principal: `allUsers`
   - Role: Storage Object Viewer
6. **Enable website:**
   - Edit website configuration
   - Index page: `index.html`

---

## Option 3: Manual Commands (Copy & Paste)

If you want to run commands manually, here's the exact sequence:

```bash
# 1. Setup
export PATH="/tmp/google-cloud-sdk/google-cloud-sdk/bin:$PATH"
export PROJECT_ID="YOUR_PROJECT_ID_HERE"
export REGION="us-central1"

# 2. Authenticate
gcloud auth login

# 3. Set project
gcloud config set project $PROJECT_ID

# 4. Enable APIs
gcloud services enable sqladmin.googleapis.com run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# 5. Create database (interactive)
gcloud sql instances create leadgen-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=$REGION
gcloud sql databases create leadgen --instance=leadgen-db

# 6. Get connection name
export SQL_CONNECTION=$(gcloud sql instances describe leadgen-db --format='value(connectionName)')

# 7. Create secrets
echo -n "$(openssl rand -base64 32)" | gcloud secrets create jwt-secret --data-file=-
echo -n "AIzaSyBrSPVIOqInInho7nZl9PLPJPvu13zedCI" | gcloud secrets create gemini-api-key --data-file=-

# 8. Deploy backend
cd backend
gcloud run deploy leadgen-backend \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $SQL_CONNECTION \
  --set-secrets "JWT_SECRET=jwt-secret:latest,GEMINI_API_KEY=gemini-api-key:latest"

# 9. Get backend URL
export BACKEND_URL=$(gcloud run services describe leadgen-backend --region=$REGION --format='value(status.url)')

# 10. Build frontend
cd ..
echo "VITE_API_URL=$BACKEND_URL" > .env.production
npm run build

# 11. Deploy frontend
gsutil mb gs://$PROJECT_ID-frontend
gsutil web set -m index.html gs://$PROJECT_ID-frontend
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-frontend
gsutil -m rsync -r dist/ gs://$PROJECT_ID-frontend

# 12. Get frontend URL
echo "Frontend: https://storage.googleapis.com/$PROJECT_ID-frontend/index.html"
echo "Backend: $BACKEND_URL"
```

---

## 🔑 What You Need

1. **Google Cloud Account**
   - Create at: https://console.cloud.google.com
   - Free trial: $300 credit

2. **Project ID**
   - Create project in console
   - Or use existing project

3. **Billing Enabled**
   - Required for Cloud SQL
   - Cost: ~$20-30/month

---

## ❓ Which Option Should I Choose?

| Option | Best For | Time | Difficulty |
|--------|----------|------|------------|
| **Option 1 (Script)** | Quick deployment | 5 min | ⭐ Easy |
| **Option 2 (Console)** | Visual interface | 15 min | ⭐⭐ Medium |
| **Option 3 (Manual)** | Learning/Control | 20 min | ⭐⭐⭐ Advanced |

---

## 🎬 Let's Deploy!

### Ready to deploy? Tell me:

1. **Do you have a Google Cloud account?** (Yes/No)
2. **Do you have a Project ID?** (Yes/No - I can help you create one)
3. **Which option do you prefer?** (1, 2, or 3)

---

## 💡 Alternative: Use Heroku (Simpler)

If Google Cloud seems complex, you can also deploy to **Heroku** (easier):

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create leadgen-ai

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy backend
cd backend
git init
heroku git:remote -a leadgen-ai
git add .
git commit -m "Deploy"
git push heroku main

# Deploy frontend (Netlify or Vercel)
npm run build
# Upload dist/ to Netlify/Vercel
```

**Cost:** FREE tier available!

---

## 🆘 Need Help?

Tell me which option you want to use, and I'll guide you through step-by-step!

Or if you prefer, share your:
1. Google Cloud Project ID
2. Service account key (JSON file)

And I can deploy it for you automatically!

---

## 📞 Support

- Google Cloud Support: https://cloud.google.com/support
- Documentation: See `GOOGLE_CLOUD_DEPLOYMENT.md`
- Automated Script: Run `./deploy-to-gcp.sh`
