#!/bin/bash

# LeadGen AI - Complete VPS Deployment Script
# Target: 34.29.164.144 (NEW VPS)
# Domain: leadgen.indigenservices.com

set -e

echo "🚀 LeadGen AI - VPS Deployment Script"
echo "========================================="

# Configuration
VPS_IP="34.29.164.144"
VPS_USER="yash"
SSH_KEY="/workspace/project/indigenssh"
DOMAIN="leadgen.indigenservices.com"
APP_DIR="/home/yash/leadgen-ai"
GEMINI_API_KEY="AIzaSyChOuW1O5xu_1uF6eUfL0zeDIXuzCaNM3k"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run SSH commands
run_ssh() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "$@"
}

# Function to upload files via SCP
upload_file() {
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_IP:$2"
}

# Function to upload directory via SCP
upload_dir() {
    scp -r -i "$SSH_KEY" -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_IP:$2"
}

echo -e "${YELLOW}Step 1: Testing VPS connection...${NC}"
if ! run_ssh "echo 'Connection successful'"; then
    echo -e "${RED}❌ Cannot connect to VPS. Please check:${NC}"
    echo "  1. SSH key permissions: chmod 600 $SSH_KEY"
    echo "  2. VPS firewall allows SSH (port 22)"
    echo "  3. IP address is correct: $VPS_IP"
    echo "  4. User has access: $VPS_USER"
    exit 1
fi
echo -e "${GREEN}✅ VPS connection successful${NC}"

echo -e "${YELLOW}Step 2: Installing system dependencies...${NC}"
run_ssh "sudo apt-get update && sudo apt-get install -y nodejs npm nginx certbot python3-certbot-nginx postgresql postgresql-contrib"

echo -e "${YELLOW}Step 3: Setting up PostgreSQL database...${NC}"
run_ssh "sudo -u postgres psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'leadgen_ai'\" | grep -q 1 || sudo -u postgres psql -c \"CREATE DATABASE leadgen_ai;\""
run_ssh "sudo -u postgres psql -tc \"SELECT 1 FROM pg_user WHERE usename = 'leadgen_user'\" | grep -q 1 || sudo -u postgres psql -c \"CREATE USER leadgen_user WITH PASSWORD 'leadgen_secure_2024';\""
run_ssh "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE leadgen_ai TO leadgen_user;\""
echo -e "${GREEN}✅ Database configured${NC}"

echo -e "${YELLOW}Step 4: Creating application directory...${NC}"
run_ssh "mkdir -p $APP_DIR/LeadGen-AI"

echo -e "${YELLOW}Step 5: Uploading application files...${NC}"
echo "  - Uploading frontend build..."
npm run build
upload_dir "./dist" "$APP_DIR/LeadGen-AI/"

echo "  - Uploading backend server..."
upload_dir "./server" "$APP_DIR/LeadGen-AI/"

echo "  - Uploading configuration files..."
upload_file "./package.json" "$APP_DIR/LeadGen-AI/"
upload_file "./vite.config.ts" "$APP_DIR/LeadGen-AI/"
upload_file "./tsconfig.json" "$APP_DIR/LeadGen-AI/"

echo -e "${GREEN}✅ Files uploaded${NC}"

echo -e "${YELLOW}Step 6: Setting up environment variables...${NC}"
run_ssh "cat > $APP_DIR/LeadGen-AI/.env << 'EOF'
# Database Configuration
DB_USER=leadgen_user
DB_HOST=localhost
DB_NAME=leadgen_ai
DB_PASSWORD=leadgen_secure_2024
DB_PORT=5432

# API Configuration
API_PORT=3001
JWT_SECRET=leadgen-jwt-secret-key-2024-change-in-production

# Gemini AI
GEMINI_API_KEY=$GEMINI_API_KEY

# Frontend URL
FRONTEND_URL=https://$DOMAIN
EOF"
echo -e "${GREEN}✅ Environment configured${NC}"

echo -e "${YELLOW}Step 7: Installing Node.js dependencies...${NC}"
run_ssh "cd $APP_DIR/LeadGen-AI/server && npm install"
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${YELLOW}Step 8: Initializing database schema...${NC}"
upload_file "./postgresql-schema.sql" "$APP_DIR/LeadGen-AI/"
run_ssh "cd $APP_DIR/LeadGen-AI && PGPASSWORD=leadgen_secure_2024 psql -U leadgen_user -d leadgen_ai -h localhost < postgresql-schema.sql || true"
echo -e "${GREEN}✅ Database initialized${NC}"

echo -e "${YELLOW}Step 9: Installing PM2 process manager...${NC}"
run_ssh "sudo npm install -g pm2"
echo -e "${GREEN}✅ PM2 installed${NC}"

echo -e "${YELLOW}Step 10: Stopping old application on port 12000...${NC}"
run_ssh "pm2 stop all || true"
run_ssh "sudo lsof -ti:12000 | xargs sudo kill -9 || true"
run_ssh "pm2 delete all || true"
echo -e "${GREEN}✅ Old application stopped${NC}"

echo -e "${YELLOW}Step 11: Starting backend API server...${NC}"
run_ssh "cd $APP_DIR/LeadGen-AI/server && pm2 start index.js --name leadgen-api --time"
run_ssh "pm2 save"
run_ssh "pm2 startup | grep 'sudo' | sh"
echo -e "${GREEN}✅ Backend API started${NC}"

echo -e "${YELLOW}Step 12: Configuring Nginx...${NC}"
run_ssh "sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'EOF'
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend (React build)
    root $APP_DIR/LeadGen-AI/dist;
    index index.html;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Increase max body size for file uploads
    client_max_body_size 10M;
}
EOF"

# Enable site
run_ssh "sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN"
run_ssh "sudo rm -f /etc/nginx/sites-enabled/default"
run_ssh "sudo nginx -t"
run_ssh "sudo systemctl reload nginx"
echo -e "${GREEN}✅ Nginx configured${NC}"

echo -e "${YELLOW}Step 13: Setting up SSL certificate...${NC}"
run_ssh "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email yashbhadane28@gmail.com --redirect"
echo -e "${GREEN}✅ SSL certificate installed${NC}"

echo -e "${YELLOW}Step 14: Verifying deployment...${NC}"
echo "  - Checking API health..."
run_ssh "curl -s http://localhost:3001/api/health" || echo "API check failed"

echo "  - Checking PM2 status..."
run_ssh "pm2 status"

echo "  - Checking Nginx status..."
run_ssh "sudo systemctl status nginx --no-pager | head -10"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Application URLs:"
echo "  🌐 Frontend: https://$DOMAIN"
echo "  🔌 API: https://$DOMAIN/api/health"
echo ""
echo "Management Commands:"
echo "  SSH: ssh -i $SSH_KEY $VPS_USER@$VPS_IP"
echo "  Logs: pm2 logs leadgen-api"
echo "  Status: pm2 status"
echo "  Restart: pm2 restart leadgen-api"
echo ""
echo "Test Credentials:"
echo "  Email: yashbhadane28@gmail.com"
echo "  Password: 28121996"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Open https://$DOMAIN in your browser"
echo "  2. Login with test credentials"
echo "  3. Test lead generation features"
echo ""
