# Production Deployment Guide

## 1. Production Requirements
- Linux VPS (Ubuntu 22.04 LTS recommended) or Cloud Container (Google Cloud Run / AWS ECS / Render).
- Node.js 18+ & PM2 process manager.
- Nginx for SSL termination and reverse proxying.

## 2. Setting Up on Ubuntu Server
```bash
# 1. Update system & install Node.js
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx

# 2. Install PM2
sudo npm install -g pm2

# 3. Clone / Upload App
mkdir -p /var/www/nbv-trading
# Copy project files here
cd /var/www/nbv-trading
npm install
npm run build

# 4. Start with PM2
pm2 start server.ts --name nbv-app --interpreter ./node_modules/.bin/tsx
pm2 save
pm2 startup
```

## 3. Nginx Configuration with SSL (Certbot)
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Obtain free SSL certificate:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
