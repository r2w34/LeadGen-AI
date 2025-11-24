# 🚀 Google Cloud Platform Deployment Guide

## Complete Guide to Deploy LeadGen-AI on Google Cloud

---

## 📋 Overview

This guide will help you deploy LeadGen-AI to Google Cloud Platform using:
- **Cloud SQL (PostgreSQL)** - Database
- **Cloud Run** - Backend API
- **Cloud Storage + Cloud CDN** - Frontend (Static hosting)
- **Estimated Cost:** $20-40/month

---

## 🎯 Prerequisites

1. **Google Cloud Account**
   - Visit: https://console.cloud.google.com
   - Sign up if you don't have an account
   - Enable billing (free tier available)

2. **API Keys**
   - ✅ Gemini API Key (already configured)
   - ⏳ SendGrid API Key (optional, for emails)

---

## 🚀 Quick Deploy (Automated Script)

### Option 1: One-Command Deploy

I've created an automated deployment script. To use it:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login

# 2. Set your project ID
export PROJECT_ID="your-project-id"

# 3. Run deployment script
./deploy-to-gcp.sh
```

The script will:
1. ✅ Create Cloud SQL PostgreSQL instance
2. ✅ Deploy backend to Cloud Run
3. ✅ Build and deploy frontend
4. ✅ Configure environment variables
5. ✅ Set up networking
6. ✅ Output your application URL

---

## 📝 Manual Deployment (Step-by-Step)

### Step 1: Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create new project (or use existing)
export PROJECT_ID="leadgen-ai-prod"
export REGION="us-central1"

gcloud projects create $PROJECT_ID --name="LeadGen AI"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  sqladmin.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  storage-api.googleapis.com
```

---

### Step 2: Create PostgreSQL Database

```bash
# Create Cloud SQL instance
gcloud sql instances create leadgen-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create leadgen --instance=leadgen-db

# Get connection name
export SQL_CONNECTION_NAME=$(gcloud sql instances describe leadgen-db \
  --format='value(connectionName)')

echo "SQL Connection Name: $SQL_CONNECTION_NAME"
```

**Cost:** ~$10/month for db-f1-micro tier

---

### Step 3: Setup Database Schema

```bash
# Connect to database and run schema
gcloud sql connect leadgen-db --user=postgres

# In psql prompt:
\i /path/to/postgresql-schema.sql
\q
```

Or use Cloud Shell:
```bash
# Upload schema to Cloud SQL
gcloud sql import sql leadgen-db gs://your-bucket/postgresql-schema.sql \
  --database=leadgen
```

---

### Step 4: Store Secrets in Secret Manager

```bash
# Create secrets
echo -n "YOUR_JWT_SECRET_HERE" | gcloud secrets create jwt-secret --data-file=-
echo -n "AIzaSyBrSPVIOqInInho7nZl9PLPJPvu13zedCI" | gcloud secrets create gemini-api-key --data-file=-
echo -n "YOUR_SENDGRID_KEY" | gcloud secrets create sendgrid-api-key --data-file=-

# Create database URL
export DB_URL="postgresql://postgres:YOUR_PASSWORD@/leadgen?host=/cloudsql/$SQL_CONNECTION_NAME"
echo -n "$DB_URL" | gcloud secrets create database-url --data-file=-
```

---

### Step 5: Deploy Backend to Cloud Run

```bash
cd backend

# Build and deploy
gcloud run deploy leadgen-backend \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $SQL_CONNECTION_NAME \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GEMINI_API_KEY=gemini-api-key:latest,SENDGRID_API_KEY=sendgrid-api-key:latest" \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1

# Get backend URL
export BACKEND_URL=$(gcloud run services describe leadgen-backend \
  --region=$REGION --format='value(status.url)')

echo "Backend deployed at: $BACKEND_URL"
```

**Cost:** ~$0 (free tier: 2M requests/month), then $0.00002400 per request

---

### Step 6: Build Frontend

```bash
cd ..

# Update API URL in environment
echo "VITE_API_URL=$BACKEND_URL" > .env.production

# Build frontend
npm run build
```

---

### Step 7: Deploy Frontend to Cloud Storage

```bash
# Create storage bucket
gsutil mb -p $PROJECT_ID -l $REGION gs://$PROJECT_ID-frontend

# Enable static website hosting
gsutil web set -m index.html -e 404.html gs://$PROJECT_ID-frontend

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-frontend

# Upload files
gsutil -m rsync -r dist/ gs://$PROJECT_ID-frontend

# Set up Cloud CDN (optional but recommended)
gcloud compute backend-buckets create leadgen-frontend-bucket \
  --gcs-bucket-name=$PROJECT_ID-frontend \
  --enable-cdn

echo "Frontend deployed at: https://storage.googleapis.com/$PROJECT_ID-frontend/index.html"
```

**Cost:** ~$0.01-0.05/GB stored + ~$0.085/GB for CDN

---

### Step 8: Configure Custom Domain (Optional)

```bash
# Reserve static IP
gcloud compute addresses create leadgen-ip --global

# Get IP address
gcloud compute addresses describe leadgen-ip --global

# Create load balancer
gcloud compute url-maps create leadgen-lb \
  --default-backend-bucket=leadgen-frontend-bucket

gcloud compute target-http-proxies create leadgen-http-proxy \
  --url-map=leadgen-lb

gcloud compute forwarding-rules create leadgen-http-rule \
  --address=leadgen-ip \
  --global \
  --target-http-proxy=leadgen-http-proxy \
  --ports=80

# For HTTPS (recommended):
gcloud compute ssl-certificates create leadgen-ssl \
  --domains=yourdomain.com

gcloud compute target-https-proxies create leadgen-https-proxy \
  --url-map=leadgen-lb \
  --ssl-certificates=leadgen-ssl

gcloud compute forwarding-rules create leadgen-https-rule \
  --address=leadgen-ip \
  --global \
  --target-https-proxy=leadgen-https-proxy \
  --ports=443
```

---

## 🔧 Environment Variables Summary

### Backend (Cloud Run):
```
DATABASE_URL=postgresql://postgres:password@/leadgen?host=/cloudsql/PROJECT:REGION:INSTANCE
JWT_SECRET=your-secret-key-min-32-chars
GEMINI_API_KEY=AIzaSyBrSPVIOqInInho7nZl9PLPJPvu13zedCI
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
NODE_ENV=production
PORT=8080
```

### Frontend (.env.production):
```
VITE_API_URL=https://leadgen-backend-xxxxx-uc.a.run.app
```

---

## 📊 Monitoring & Logs

### View Logs:
```bash
# Backend logs
gcloud run logs read leadgen-backend --region=$REGION

# Database logs
gcloud sql operations list --instance=leadgen-db

# Follow logs in real-time
gcloud run logs tail leadgen-backend --region=$REGION
```

### Monitoring:
```bash
# Open Cloud Console monitoring
gcloud console --project=$PROJECT_ID
```

Visit: https://console.cloud.google.com/monitoring

---

## 💰 Cost Estimation

### Monthly Costs:

```
Cloud SQL (db-f1-micro):        $10-15/month
Cloud Run (Backend):            $5-10/month (after free tier)
Cloud Storage (Frontend):       $0.50-2/month
Cloud CDN:                      $1-5/month
Total:                          $17-32/month
```

### Free Tier Includes:
- Cloud Run: 2M requests/month
- Cloud Storage: 5GB storage
- Cloud SQL: None (always charged)

---

## 🔄 Update Deployment

### Update Backend:
```bash
cd backend
gcloud run deploy leadgen-backend --source . --region=$REGION
```

### Update Frontend:
```bash
npm run build
gsutil -m rsync -r dist/ gs://$PROJECT_ID-frontend
```

### Update Database Schema:
```bash
gcloud sql connect leadgen-db --user=postgres
\i /path/to/new-schema.sql
```

---

## 🧪 Testing Deployment

### Test Backend:
```bash
# Health check
curl https://YOUR-BACKEND-URL/health

# Test signup
curl -X POST https://YOUR-BACKEND-URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","name":"Test User"}'
```

### Test Frontend:
```bash
# Open in browser
open https://storage.googleapis.com/$PROJECT_ID-frontend/index.html
```

---

## 🔒 Security Best Practices

1. **Use Secret Manager** ✅
   - Never hardcode secrets in code
   - All secrets stored in Secret Manager

2. **Enable HTTPS** ✅
   - Use managed SSL certificates
   - Redirect HTTP to HTTPS

3. **IAM Permissions**
   ```bash
   # Grant Cloud Run access to Secret Manager
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

4. **Database Security**
   - Use Cloud SQL Proxy
   - Enable SSL connections
   - Regular backups

---

## 📱 Scaling

### Scale Backend:
```bash
gcloud run services update leadgen-backend \
  --min-instances=1 \
  --max-instances=100 \
  --region=$REGION
```

### Scale Database:
```bash
gcloud sql instances patch leadgen-db \
  --tier=db-g1-small
```

---

## 🐛 Troubleshooting

### Backend won't start:
```bash
# Check logs
gcloud run logs read leadgen-backend --limit=50 --region=$REGION

# Common issues:
1. Database connection failed → Check SQL_CONNECTION_NAME
2. Secrets not found → Verify Secret Manager setup
3. Port error → Cloud Run uses PORT=8080
```

### Frontend shows 404:
```bash
# Check bucket
gsutil ls gs://$PROJECT_ID-frontend

# Re-upload
gsutil -m rsync -r dist/ gs://$PROJECT_ID-frontend
```

### Database connection errors:
```bash
# Test connection
gcloud sql connect leadgen-db --user=postgres

# Check instance status
gcloud sql instances describe leadgen-db
```

---

## 🔗 Useful Commands

```bash
# Delete everything (careful!)
gcloud run services delete leadgen-backend --region=$REGION
gcloud sql instances delete leadgen-db
gsutil rm -r gs://$PROJECT_ID-frontend

# View all resources
gcloud run services list
gcloud sql instances list
gsutil ls

# Estimate costs
gcloud billing accounts list
```

---

## 📚 Resources

- Cloud Run Docs: https://cloud.google.com/run/docs
- Cloud SQL Docs: https://cloud.google.com/sql/docs
- Secret Manager: https://cloud.google.com/secret-manager/docs
- Pricing Calculator: https://cloud.google.com/products/calculator

---

## ✅ Deployment Checklist

- [ ] Google Cloud account created
- [ ] Project created and selected
- [ ] APIs enabled
- [ ] Cloud SQL database created
- [ ] Database schema loaded
- [ ] Secrets stored in Secret Manager
- [ ] Backend deployed to Cloud Run
- [ ] Frontend built
- [ ] Frontend deployed to Cloud Storage
- [ ] Environment variables configured
- [ ] Application tested
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup
- [ ] Backups enabled

---

## 🎉 Success!

Your LeadGen-AI application is now deployed on Google Cloud Platform!

**Next Steps:**
1. Test all features
2. Configure custom domain
3. Enable monitoring
4. Setup automated backups
5. Configure CI/CD (optional)

---

**Need Help?** Contact Google Cloud Support or refer to the documentation.

**Automated Deployment:** Run `./deploy-to-gcp.sh` for one-command deployment!
