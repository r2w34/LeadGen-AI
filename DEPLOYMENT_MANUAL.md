# LeadGen AI - Complete Deployment Guide for VPS 34.29.164.144

## 🎯 Overview
This guide will help you deploy LeadGen AI to your VPS with domain leadgen.indigenservices.com and SSL certificate.

## 📋 Prerequisites Checklist

### VPS Configuration (Must be done first!)
- [ ] VPS is running and accessible
- [ ] SSH port 22 is open in firewall/security group
- [ ] HTTP port 80 is open (for web traffic)
- [ ] HTTPS port 443 is open (for SSL)
- [ ] Port 3001 is open (for API)
- [ ] DNS A record for `leadgen.indigenservices.com` points to `34.29.164.144`

### Access Information
- **VPS IP**: 34.29.164.144
- **SSH User**: yash
- **SSH Key**: indigenssh
- **Key Passphrase**: indigen
- **Domain**: leadgen.indigenservices.com

---

## 🚀 Deployment Options

### Option 1: Automated Script Deployment (Recommended)

1. **Fix SSH Key Permissions** (if needed):
   ```bash
   chmod 600 /workspace/project/indigenssh
   ```

2. **Run Automated Deployment Script**:
   ```bash
   cd /workspace/project/LeadGen-AI
   ./deploy-new-vps.sh
   ```

   This script will:
   - ✅ Test VPS connection
   - ✅ Install all system dependencies
   - ✅ Setup PostgreSQL database
   - ✅ Upload application files
   - ✅ Configure environment variables
   - ✅ Install Node.js dependencies
   - ✅ Stop old app on port 12000
   - ✅ Start new app with PM2
   - ✅ Configure Nginx
   - ✅ Setup SSL certificate
   - ✅ Verify deployment

### Option 2: Docker Deployment via Dokploy

1. **Connect to VPS**:
   ```bash
   ssh -i /workspace/project/indigenssh yash@34.29.164.144
   ```

2. **Clone Repository**:
   ```bash
   mkdir -p /home/yash/leadgen-ai
   cd /home/yash/leadgen-ai
   git clone https://github.com/r2w34/LeadGen-AI.git
   cd LeadGen-AI
   ```

3. **Create Environment File**:
   ```bash
   cat > .env << 'EOF'
   GEMINI_API_KEY=AIzaSyChOuW1O5xu_1uF6eUfL0zeDIXuzCaNM3k
   DB_USER=leadgen_user
   DB_PASSWORD=leadgen_secure_2024
   DB_NAME=leadgen_ai
   DB_HOST=postgres
   DB_PORT=5432
   API_PORT=3001
   JWT_SECRET=leadgen-jwt-secret-key-2024-change-in-production
   EOF
   ```

4. **Start with Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```

5. **Check Status**:
   ```bash
   docker-compose ps
   docker-compose logs -f api
   ```

### Option 3: Manual Step-by-Step Deployment

#### Step 1: Connect to VPS
```bash
ssh -i /workspace/project/indigenssh yash@34.29.164.144
```

#### Step 2: Install System Dependencies
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

#### Step 3: Setup PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE leadgen_ai;
CREATE USER leadgen_user WITH PASSWORD 'leadgen_secure_2024';
GRANT ALL PRIVILEGES ON DATABASE leadgen_ai TO leadgen_user;
\q
```

#### Step 4: Create Application Directory
```bash
mkdir -p /home/yash/leadgen-ai
cd /home/yash/leadgen-ai
```

#### Step 5: Upload Application Files
From your local machine (where the code is):

```bash
# Build frontend first
cd /workspace/project/LeadGen-AI
npm install
npm run build

# Upload everything
scp -i /workspace/project/indigenssh -r /workspace/project/LeadGen-AI yash@34.29.164.144:/home/yash/leadgen-ai/
```

#### Step 6: Configure Environment Variables
On the VPS:
```bash
cd /home/yash/leadgen-ai/LeadGen-AI
cat > .env << 'EOF'
DB_USER=leadgen_user
DB_HOST=localhost
DB_NAME=leadgen_ai
DB_PASSWORD=leadgen_secure_2024
DB_PORT=5432
API_PORT=3001
JWT_SECRET=leadgen-jwt-secret-key-2024-change-in-production
GEMINI_API_KEY=AIzaSyChOuW1O5xu_1uF6eUfL0zeDIXuzCaNM3k
FRONTEND_URL=https://leadgen.indigenservices.com
EOF
```

#### Step 7: Initialize Database
```bash
cd /home/yash/leadgen-ai/LeadGen-AI
PGPASSWORD=leadgen_secure_2024 psql -U leadgen_user -d leadgen_ai -h localhost < postgresql-schema.sql
```

#### Step 8: Install Node Dependencies for Server
```bash
cd /home/yash/leadgen-ai/LeadGen-AI/server
npm install
```

#### Step 9: Stop Old Application on Port 12000
```bash
# Find and kill process on port 12000
sudo lsof -ti:12000 | xargs sudo kill -9 || echo "No process on port 12000"

# If using PM2
pm2 stop all
pm2 delete all
```

#### Step 10: Install and Configure PM2
```bash
sudo npm install -g pm2

# Start backend API
cd /home/yash/leadgen-ai/LeadGen-AI/server
pm2 start index.js --name leadgen-api --time

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

#### Step 11: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/leadgen.indigenservices.com
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name leadgen.indigenservices.com;

    # Frontend (React build)
    root /home/yash/leadgen-ai/LeadGen-AI/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase max body size
    client_max_body_size 10M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/leadgen.indigenservices.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 12: Setup SSL Certificate
```bash
sudo certbot --nginx -d leadgen.indigenservices.com --non-interactive --agree-tos --email yashbhadane28@gmail.com --redirect
```

#### Step 13: Verify Deployment
```bash
# Check API health
curl http://localhost:3001/api/health

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# View API logs
pm2 logs leadgen-api
```

---

## 🧪 Testing the Application

### 1. Check API Health
```bash
curl https://leadgen.indigenservices.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "LeadGen AI API is running",
  "gemini": "configured"
}
```

### 2. Test in Browser
1. Open: https://leadgen.indigenservices.com
2. You should see the LeadGen AI login page
3. Login with:
   - **Email**: yashbhadane28@gmail.com
   - **Password**: 28121996

### 3. Test Lead Generation
1. After login, click "Start Onboarding" or "God-Eye Analysis"
2. Enter a company name (e.g., "Microsoft", "Google")
3. Should see AI-generated company profile
4. Click "Continue" to generate leads
5. Verify leads are displayed and saved

---

## 🔧 Troubleshooting

### Cannot Connect to VPS via SSH

**Issue**: `ssh: connect to host 34.29.164.144 port 22: Connection timed out`

**Solutions**:
1. **Check VPS is running**: Login to your cloud provider dashboard
2. **Check firewall rules**: Ensure port 22 is open in security group/firewall
3. **Check SSH key permissions**:
   ```bash
   chmod 600 /workspace/project/indigenssh
   ```
4. **Try password authentication**:
   ```bash
   ssh yash@34.29.164.144
   # Password: Kalilinux@2812
   ```

### API Not Responding

**Check backend logs**:
```bash
pm2 logs leadgen-api
```

**Common issues**:
- Database connection failed → Check PostgreSQL is running: `sudo systemctl status postgresql`
- Port 3001 already in use → Kill existing process: `sudo lsof -ti:3001 | xargs sudo kill -9`
- Missing GEMINI_API_KEY → Check .env file exists in server directory

### Frontend Shows Error

**Check Nginx logs**:
```bash
sudo tail -f /var/log/nginx/error.log
```

**Verify build exists**:
```bash
ls -la /home/yash/leadgen-ai/LeadGen-AI/dist/
```

If missing, rebuild:
```bash
cd /home/yash/leadgen-ai/LeadGen-AI
npm install
npm run build
sudo systemctl reload nginx
```

### SSL Certificate Issues

**Check certificate status**:
```bash
sudo certbot certificates
```

**Renew manually**:
```bash
sudo certbot renew --dry-run
```

### Database Connection Failed

**Check PostgreSQL is running**:
```bash
sudo systemctl status postgresql
```

**Test connection**:
```bash
PGPASSWORD=leadgen_secure_2024 psql -U leadgen_user -d leadgen_ai -h localhost -c "SELECT 1;"
```

**Restart PostgreSQL**:
```bash
sudo systemctl restart postgresql
```

---

## 📊 Management Commands

### PM2 Process Management
```bash
# View status
pm2 status

# View logs
pm2 logs leadgen-api
pm2 logs leadgen-api --lines 100

# Restart
pm2 restart leadgen-api

# Stop
pm2 stop leadgen-api

# Start
pm2 start leadgen-api

# Monitor
pm2 monit
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload (without downtime)
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Management
```bash
# Connect to database
PGPASSWORD=leadgen_secure_2024 psql -U leadgen_user -d leadgen_ai -h localhost

# Backup database
pg_dump -U leadgen_user -d leadgen_ai -h localhost > backup.sql

# Restore database
PGPASSWORD=leadgen_secure_2024 psql -U leadgen_user -d leadgen_ai -h localhost < backup.sql
```

---

## 🔐 Security Checklist

- [ ] Change default JWT_SECRET in .env
- [ ] Change database password
- [ ] Setup firewall (ufw)
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Setup automatic security updates
- [ ] Configure fail2ban for SSH protection
- [ ] Regular backups of database
- [ ] Monitor logs for suspicious activity

---

## 📞 Support Information

**Test Credentials**:
- Email: yashbhadane28@gmail.com
- Password: 28121996

**API Endpoints**:
- Health: `/api/health`
- Auth: `/api/auth/login`, `/api/auth/signup`
- Company: `/api/company/search`, `/api/company/research`
- Leads: `/api/leads/generate`, `/api/leads`

**Technology Stack**:
- Frontend: React 19 + TypeScript + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- AI: Google Gemini API
- Process Manager: PM2
- Web Server: Nginx
- SSL: Let's Encrypt (Certbot)

---

## ✅ Post-Deployment Checklist

- [ ] VPS accessible via SSH
- [ ] Old app on port 12000 stopped/deleted
- [ ] Backend API running on port 3001
- [ ] Frontend accessible at https://leadgen.indigenservices.com
- [ ] SSL certificate installed and working
- [ ] Database connected and initialized
- [ ] Can login to application
- [ ] Lead generation features working
- [ ] PM2 configured to auto-start on reboot
- [ ] Nginx configured correctly
- [ ] Logs are accessible and monitored

---

**Last Updated**: 2025-11-28
**Version**: 1.0.0
