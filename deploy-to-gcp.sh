#!/bin/bash

# ====================================================
# LeadGen-AI - Automated Google Cloud Deployment
# ====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  LeadGen-AI - Google Cloud Deployment         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
}

print_step() {
    echo -e "\n${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Main script
print_header

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

print_success "gcloud CLI found"

# ====================================================
# Configuration
# ====================================================

print_step "Configuration"

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "Enter your Google Cloud Project ID (or create one at console.cloud.google.com):"
    read -p "Project ID: " PROJECT_ID
fi

export PROJECT_ID=$PROJECT_ID
export REGION="${REGION:-us-central1}"
export DB_NAME="leadgen"
export DB_INSTANCE="leadgen-db"
export BACKEND_SERVICE="leadgen-backend"
export BUCKET_NAME="${PROJECT_ID}-frontend"

print_info "Project ID: $PROJECT_ID"
print_info "Region: $REGION"
print_info "Database: $DB_NAME"

# Confirm before proceeding
echo -e "\n${YELLOW}This will deploy LeadGen-AI to Google Cloud.${NC}"
echo -e "${YELLOW}Estimated cost: $20-40/month${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warn "Deployment cancelled"
    exit 1
fi

# ====================================================
# Step 1: Setup Project
# ====================================================

print_step "Setting up Google Cloud Project"

gcloud config set project $PROJECT_ID

print_info "Enabling required APIs..."
gcloud services enable \
  sqladmin.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  storage-api.googleapis.com

print_success "APIs enabled"

# ====================================================
# Step 2: Create Database
# ====================================================

print_step "Creating PostgreSQL Database"

# Check if instance exists
if gcloud sql instances describe $DB_INSTANCE &> /dev/null; then
    print_warn "Database instance already exists, skipping creation"
else
    print_info "Creating Cloud SQL instance (this may take 5-10 minutes)..."
    
    read -sp "Enter database root password: " DB_PASSWORD
    echo
    
    gcloud sql instances create $DB_INSTANCE \
      --database-version=POSTGRES_15 \
      --tier=db-f1-micro \
      --region=$REGION \
      --root-password=$DB_PASSWORD \
      --backup \
      --backup-start-time=03:00
    
    print_success "Database instance created"
fi

# Create database
print_info "Creating database..."
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE 2>/dev/null || print_warn "Database already exists"

# Get connection name
SQL_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)')
print_info "SQL Connection Name: $SQL_CONNECTION_NAME"

print_success "Database setup complete"

# ====================================================
# Step 3: Setup Secrets
# ====================================================

print_step "Storing secrets in Secret Manager"

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- 2>/dev/null || \
  (echo -n "$JWT_SECRET" | gcloud secrets versions add jwt-secret --data-file=-)
print_info "JWT secret stored"

# Gemini API Key
GEMINI_KEY="AIzaSyBrSPVIOqInInho7nZl9PLPJPvu13zedCI"
echo -n "$GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=- 2>/dev/null || \
  (echo -n "$GEMINI_KEY" | gcloud secrets versions add gemini-api-key --data-file=-)
print_info "Gemini API key stored"

# SendGrid (optional)
read -p "Do you have a SendGrid API key? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -sp "Enter SendGrid API key: " SENDGRID_KEY
    echo
    echo -n "$SENDGRID_KEY" | gcloud secrets create sendgrid-api-key --data-file=- 2>/dev/null || \
      (echo -n "$SENDGRID_KEY" | gcloud secrets versions add sendgrid-api-key --data-file=-)
    
    read -p "Enter SendGrid FROM email: " SENDGRID_FROM
    echo -n "$SENDGRID_FROM" | gcloud secrets create sendgrid-from-email --data-file=- 2>/dev/null || \
      (echo -n "$SENDGRID_FROM" | gcloud secrets versions add sendgrid-from-email --data-file=-)
fi

# Database URL
DB_URL="postgresql://postgres:${DB_PASSWORD}@/leadgen?host=/cloudsql/$SQL_CONNECTION_NAME"
echo -n "$DB_URL" | gcloud secrets create database-url --data-file=- 2>/dev/null || \
  (echo -n "$DB_URL" | gcloud secrets versions add database-url --data-file=-)
print_info "Database URL stored"

print_success "Secrets configured"

# ====================================================
# Step 4: Load Database Schema
# ====================================================

print_step "Loading database schema"

if [ -f "postgresql-schema.sql" ]; then
    print_info "Uploading schema to temporary bucket..."
    TEMP_BUCKET="${PROJECT_ID}-temp-sql"
    gsutil mb -p $PROJECT_ID gs://$TEMP_BUCKET 2>/dev/null || true
    gsutil cp postgresql-schema.sql gs://$TEMP_BUCKET/
    
    print_info "Importing schema to Cloud SQL..."
    gcloud sql import sql $DB_INSTANCE gs://$TEMP_BUCKET/postgresql-schema.sql \
      --database=$DB_NAME \
      --quiet || print_warn "Schema import failed, you may need to import manually"
    
    gsutil rm -r gs://$TEMP_BUCKET
    print_success "Schema loaded"
else
    print_warn "postgresql-schema.sql not found, skipping schema import"
fi

# ====================================================
# Step 5: Deploy Backend
# ====================================================

print_step "Deploying Backend API to Cloud Run"

cd backend

print_info "Building and deploying backend..."
gcloud run deploy $BACKEND_SERVICE \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $SQL_CONNECTION_NAME \
  --set-env-vars "NODE_ENV=production,PORT=8080" \
  --set-secrets "DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GEMINI_API_KEY=gemini-api-key:latest" \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --quiet

BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)')
print_success "Backend deployed at: $BACKEND_URL"

cd ..

# ====================================================
# Step 6: Build Frontend
# ====================================================

print_step "Building Frontend"

# Create production env file
echo "VITE_API_URL=$BACKEND_URL" > .env.production

print_info "Installing dependencies..."
npm install --silent

print_info "Building production bundle..."
npm run build

print_success "Frontend built"

# ====================================================
# Step 7: Deploy Frontend
# ====================================================

print_step "Deploying Frontend to Cloud Storage"

# Create bucket
gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME 2>/dev/null || print_warn "Bucket already exists"

# Configure static website
gsutil web set -m index.html gs://$BUCKET_NAME

# Make public
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Upload files
print_info "Uploading files..."
gsutil -m rsync -r dist/ gs://$BUCKET_NAME

FRONTEND_URL="https://storage.googleapis.com/$BUCKET_NAME/index.html"
print_success "Frontend deployed at: $FRONTEND_URL"

# ====================================================
# Step 8: Grant IAM Permissions
# ====================================================

print_step "Configuring IAM permissions"

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

print_success "IAM permissions configured"

# ====================================================
# Deployment Complete
# ====================================================

print_header
echo -e "\n${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       🎉 DEPLOYMENT SUCCESSFUL! 🎉             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}📱 Application URLs:${NC}"
echo -e "   Frontend: ${GREEN}$FRONTEND_URL${NC}"
echo -e "   Backend:  ${GREEN}$BACKEND_URL${NC}"

echo -e "\n${BLUE}🔑 Resources Created:${NC}"
echo -e "   • Cloud SQL Instance: $DB_INSTANCE"
echo -e "   • Cloud Run Service: $BACKEND_SERVICE"
echo -e "   • Storage Bucket: $BUCKET_NAME"
echo -e "   • Secrets: jwt-secret, gemini-api-key, database-url"

echo -e "\n${BLUE}💰 Estimated Monthly Cost:${NC}"
echo -e "   • Cloud SQL: ~\$10-15"
echo -e "   • Cloud Run: ~\$5-10"
echo -e "   • Storage: ~\$1-2"
echo -e "   ${YELLOW}Total: ~\$17-32/month${NC}"

echo -e "\n${BLUE}📊 Monitoring:${NC}"
echo -e "   Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo -e "   Logs: gcloud run logs tail $BACKEND_SERVICE --region=$REGION"

echo -e "\n${BLUE}🔄 Update Commands:${NC}"
echo -e "   Backend: cd backend && gcloud run deploy $BACKEND_SERVICE --source . --region=$REGION"
echo -e "   Frontend: npm run build && gsutil -m rsync -r dist/ gs://$BUCKET_NAME"

echo -e "\n${GREEN}✅ Your LeadGen-AI application is now live!${NC}\n"

# Save deployment info
cat > deployment-info.txt << EOF
LeadGen-AI Deployment Information
==================================
Date: $(date)
Project ID: $PROJECT_ID
Region: $REGION

Frontend URL: $FRONTEND_URL
Backend URL: $BACKEND_URL

Database Instance: $DB_INSTANCE
Database Name: $DB_NAME
SQL Connection: $SQL_CONNECTION_NAME

Cloud Run Service: $BACKEND_SERVICE
Storage Bucket: $BUCKET_NAME

View logs: gcloud run logs tail $BACKEND_SERVICE --region=$REGION
View console: https://console.cloud.google.com/run?project=$PROJECT_ID
EOF

print_info "Deployment info saved to deployment-info.txt"
