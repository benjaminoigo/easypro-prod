# EasyPro - Render Deployment Guide

## Overview
This guide explains how to deploy the EasyPro Academic Writing Management System on Render.

## Architecture
- **Backend**: NestJS with TypeORM (PostgreSQL)
- **Frontend**: React (static site)
- **Database**: PostgreSQL (Render provides this)

---

## Deployment Options

### Option 1: Blueprint Deployment (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and configure all services
5. Review the configuration and click **"Apply"**

### Option 2: Manual Deployment

#### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click **"New"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `easypro-db`
   - **Database**: `easypro`
   - **Plan**: Free (or choose paid for production)
3. Click **"Create Database"**
4. Copy the **Internal Database URL** for later

#### Step 2: Deploy the Backend

1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `easypro-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

4. Add Environment Variables:
   ```
   NODE_ENV           → production
   DATABASE_URL       → (paste Internal Database URL from Step 1)
   JWT_SECRET         → (click "Generate" for a secure random value)
   JWT_EXPIRES_IN     → 7d
   CORS_ORIGIN        → (will be updated after frontend deploy)
   DB_SYNCHRONIZE     → true (for first deploy, then change to false)
   ```

5. Click **"Create Web Service"**

#### Step 3: Deploy the Frontend

1. Click **"New"** → **"Static Site"**
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `easypro-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `build`

4. Add Environment Variables:
   ```
   REACT_APP_API_URL  → https://easypro-backend.onrender.com/api
   ```

5. Add Rewrite Rule (for React Router):
   - Go to **Redirects/Rewrites**
   - Add: Source `/*` → Destination `/index.html` → Type `Rewrite`

6. Click **"Create Static Site"**

#### Step 4: Update Backend CORS

1. Go to Backend service → **Environment**
2. Update `CORS_ORIGIN` with your frontend URL:
   ```
   CORS_ORIGIN=https://easypro-frontend.onrender.com
   ```
3. Click **"Save Changes"** (triggers redeploy)

---

## Environment Variables Reference

### Backend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Provided by Render |
| `JWT_SECRET` | Secret for JWT signing | Use "Generate" button |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `CORS_ORIGIN` | Frontend URL | `https://easypro-frontend.onrender.com` |
| `NODE_ENV` | Environment | `production` |
| `DB_SYNCHRONIZE` | Auto-sync DB schema | `false` (after initial deploy) |

### Frontend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://easypro-backend.onrender.com/api` |

---

## Initial Data Seeding

After deployment with `DB_SYNCHRONIZE=true`:

1. The database schema will be created automatically
2. To seed initial data, use Render's Shell:
   - Go to Backend service → **Shell**
   - Run: `npm run seed`

Or connect to the database using external tools with the External Database URL.

---

## Important Notes

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Consider upgrading for production use

### Database Security
- After first successful deploy:
  1. Change `DB_SYNCHRONIZE` to `false`
  2. This prevents accidental schema changes/data loss

### File Uploads
- Render's file system is ephemeral
- For persistent file storage, integrate with:
  - AWS S3
  - Cloudinary
  - DigitalOcean Spaces

---

## Troubleshooting

### Build Failures
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Use **Internal Database URL** (not External) for services on Render
- Check if database service is running

### CORS Errors
- Ensure `CORS_ORIGIN` matches frontend URL exactly
- Include `https://` protocol
- Check for trailing slashes

### 502/503 Errors
- Check service logs for startup errors
- Verify PORT is not hardcoded (Render sets it automatically)
- Ensure health check path `/api` is responding

### Frontend Routing Issues
- Verify rewrite rule is configured: `/* → /index.html`
- Clear browser cache after deployment

---

## Custom Domains

1. Go to your service → **Settings** → **Custom Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update `CORS_ORIGIN` to include the new domain

---

## Monitoring & Logs

- **Logs**: Available in real-time in the Render dashboard
- **Metrics**: CPU, Memory, and Bandwidth usage visible in dashboard
- **Notifications**: Configure email/Slack alerts for deploy status

---

## Support

For issues specific to Render:
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
