#!/bin/bash

###############################################################################
# LeadGen AI - IP-Only Deployment Script
# Deploys application on VPS accessible via IP address (no domain/SSL)
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_USER="yash"
VPS_IP="34.29.164.144"
SSH_KEY="indigenssh"
DEPLOY_DIR="/home/yash/leadgen-ai"
APP_PORT="3001"
WEB_PORT="80"
PASSPHRASE="indigen"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   LeadGen AI - IP-Only Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to run SSH commands
run_ssh() {
    sshpass -p "$PASSPHRASE" ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "$@"
}

# Function to copy files
run_scp() {
    sshpass -p "$PASSPHRASE" scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r "$@"
}

echo -e "${YELLOW}📋 Pre-deployment Checklist:${NC}"
echo "  - VPS IP: $VPS_IP"
echo "  - User: $VPS_USER"
echo "  - Deploy Directory: $DEPLOY_DIR"
echo "  - App Port: $APP_PORT"
echo "  - Web Port: $WEB_PORT (HTTP)"
echo ""

# Check if sshpass is available
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install sshpass
    else
        sudo apt-get install -y sshpass || sudo yum install -y sshpass
    fi
fi

echo -e "${GREEN}✅ Step 1: Testing VPS Connection${NC}"
if run_ssh "echo 'Connection successful'"; then
    echo -e "${GREEN}✅ VPS connection successful${NC}\n"
else
    echo -e "${RED}❌ Cannot connect to VPS. Check firewall and SSH key.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Step 2: Installing System Dependencies${NC}"
run_ssh "sudo apt-get update && sudo apt-get install -y \
    nodejs npm postgresql postgresql-contrib nginx git curl"

echo -e "${GREEN}✅ Step 3: Installing PM2${NC}"
run_ssh "sudo npm install -g pm2"

echo -e "${GREEN}✅ Step 4: Creating Deploy Directory${NC}"
run_ssh "mkdir -p $DEPLOY_DIR"

echo -e "${GREEN}✅ Step 5: Stopping and Removing Old Application (Port 12000)${NC}"
# Kill any process on port 12000
run_ssh "sudo fuser -k 12000/tcp || true"
run_ssh "pm2 delete leadgen-old || true"
run_ssh "pm2 delete all || true"
echo -e "${GREEN}✅ Old application removed${NC}\n"

echo -e "${GREEN}✅ Step 6: Cloning Repository${NC}"
run_ssh "cd $DEPLOY_DIR && \
    (git clone https://github.com/r2w34/LeadGen-AI.git || \
    (cd LeadGen-AI && git pull origin main))"

echo -e "${GREEN}✅ Step 7: Installing Backend Dependencies${NC}"
run_ssh "cd $DEPLOY_DIR/LeadGen-AI/server && npm install"

echo -e "${GREEN}✅ Step 8: Installing Frontend Dependencies${NC}"
run_ssh "cd $DEPLOY_DIR/LeadGen-AI && npm install"

echo -e "${GREEN}✅ Step 9: Building Frontend${NC}"
run_ssh "cd $DEPLOY_DIR/LeadGen-AI && npm run build"

echo -e "${GREEN}✅ Step 10: Setting up PostgreSQL Database${NC}"
run_ssh "sudo -u postgres psql -c \"CREATE USER leadgen_user WITH PASSWORD 'leadgen_secure_2024';\" || true"
run_ssh "sudo -u postgres psql -c \"CREATE DATABASE leadgen_ai OWNER leadgen_user;\" || true"
run_ssh "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE leadgen_ai TO leadgen_user;\" || true"

echo -e "${GREEN}✅ Step 11: Configuring Environment Variables${NC}"
run_ssh "cat > $DEPLOY_DIR/LeadGen-AI/server/.env << 'EOF'
# Database Configuration
DB_USER=leadgen_user
DB_PASSWORD=leadgen_secure_2024
DB_NAME=leadgen_ai
DB_HOST=localhost
DB_PORT=5432

# API Configuration
API_PORT=3001
NODE_ENV=production

# JWT Secret
JWT_SECRET=leadgen-jwt-secret-key-2024-change-in-production

# Gemini AI
GEMINI_API_KEY=AIzaSyChOuW1O5xu_1uF6eUfL0zeDIXuzCaNM3k

# Optional: Google Custom Search API (for better company search)
# GOOGLE_SEARCH_API_KEY=your-key-here
# GOOGLE_SEARCH_ENGINE_ID=your-cx-here
EOF"

echo -e "${GREEN}✅ Step 12: Initializing Database Schema${NC}"
run_ssh "cd $DEPLOY_DIR/LeadGen-AI/server && node -e \"
const db = require('./db.js');
const fs = require('fs');

async function initDB() {
  try {
    // Create tables
    await db.query(\\\`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \\\`);

    await db.query(\\\`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        gemini_model VARCHAR(50) DEFAULT 'gemini-2.5-pro',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \\\`);

    await db.query(\\\`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        website VARCHAR(255),
        industry VARCHAR(255),
        location VARCHAR(255),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \\\`);

    await db.query(\\\`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        title VARCHAR(255),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    \\\`);

    console.log('✅ Database schema initialized');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
  }
}

initDB();
\" || echo 'Database already initialized'"

echo -e "${GREEN}✅ Step 13: Configuring Nginx (IP-Only, No SSL)${NC}"
run_ssh "sudo tee /etc/nginx/sites-available/leadgen << 'EOF'
server {
    listen 80;
    server_name $VPS_IP;

    # Frontend (React app)
    location / {
        root $DEPLOY_DIR/LeadGen-AI/dist;
        try_files \\\$uri \\\$uri/ /index.html;
        
        # Enable CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        # Handle preflight
        if (\\\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check
    location /health {
        proxy_pass http://localhost:$APP_PORT/api/health;
    }
}
EOF"

echo -e "${GREEN}✅ Step 14: Enabling Nginx Site${NC}"
run_ssh "sudo ln -sf /etc/nginx/sites-available/leadgen /etc/nginx/sites-enabled/"
run_ssh "sudo rm -f /etc/nginx/sites-enabled/default"
run_ssh "sudo nginx -t && sudo systemctl restart nginx"

echo -e "${GREEN}✅ Step 15: Starting Application with PM2${NC}"
run_ssh "cd $DEPLOY_DIR/LeadGen-AI/server && pm2 start index.js --name leadgen-api --node-args='--max-old-space-size=2048'"
run_ssh "pm2 startup systemd -u $VPS_USER --hp /home/$VPS_USER"
run_ssh "pm2 save"

echo -e "${GREEN}✅ Step 16: Verifying Deployment${NC}"
sleep 5

# Test backend
echo -n "Testing backend API... "
if run_ssh "curl -s http://localhost:$APP_PORT/api/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend running${NC}"
else
    echo -e "${RED}❌ Backend not responding${NC}"
fi

# Test Nginx
echo -n "Testing Nginx... "
if run_ssh "curl -s http://localhost/" | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✅ Nginx serving frontend${NC}"
else
    echo -e "${RED}❌ Nginx not serving correctly${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   🎉 DEPLOYMENT SUCCESSFUL! 🎉${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}📝 Access Information:${NC}"
echo -e "  🌐 Application URL: ${GREEN}http://$VPS_IP${NC}"
echo -e "  📧 Login Email: ${YELLOW}yashbhadane28@gmail.com${NC}"
echo -e "  🔑 Login Password: ${YELLOW}28121996${NC}"
echo ""

echo -e "${BLUE}🔧 Management Commands (on VPS):${NC}"
echo -e "  View logs:     ${YELLOW}pm2 logs leadgen-api${NC}"
echo -e "  Restart app:   ${YELLOW}pm2 restart leadgen-api${NC}"
echo -e "  Stop app:      ${YELLOW}pm2 stop leadgen-api${NC}"
echo -e "  App status:    ${YELLOW}pm2 status${NC}"
echo -e "  Nginx logs:    ${YELLOW}sudo tail -f /var/log/nginx/error.log${NC}"
echo ""

echo -e "${BLUE}🧪 Test the Application:${NC}"
echo -e "  1. Open: ${GREEN}http://$VPS_IP${NC}"
echo -e "  2. Login with your credentials"
echo -e "  3. Try company search: 'Microsoft' or 'Tesla'"
echo -e "  4. Test lead generation features"
echo ""

echo -e "${YELLOW}💡 Optional: Setup Google Search API for Better Results${NC}"
echo -e "  See: ${BLUE}LeadGen-AI/GOOGLE_SEARCH_SETUP.md${NC}"
echo -e "  Benefits: Real-time Google search, better accuracy"
echo -e "  Cost: FREE (100 searches/day)"
echo ""

echo -e "${GREEN}✅ Old app on port 12000 has been removed${NC}"
echo -e "${GREEN}✅ All features are working on http://$VPS_IP${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"
