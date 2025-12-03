# Deployment Guide: GitHub + Netlify

## Overview
This guide helps you deploy your React frontend to Netlify with continuous deployment from GitHub. Your backend will need separate hosting (see Backend Deployment section).

## Prerequisites
- GitHub account
- Netlify account (free at netlify.com)
- Your code pushed to GitHub

---

## STEP 1: Push Code to GitHub

Since your repo is already connected to GitHub (https://github.com/uilibrary/matx-react.git), commit and push your latest changes:

```bash
cd /Users/shilpibhawna/matx-react

# Add all files
git add .

# Commit changes
git commit -m "Add payment/invoice features with currency support"

# Push to GitHub
git push origin master
```

---

## STEP 2: Deploy Frontend to Netlify

### A. Sign up / Log in to Netlify
1. Go to https://netlify.com
2. Sign up or log in (use GitHub to sign in for easier integration)

### B. Create New Site from Git
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access your GitHub repos
4. Select your repository: **uilibrary/matx-react**

### C. Configure Build Settings
Netlify should auto-detect your settings from `netlify.toml`, but verify:
- **Branch to deploy**: `master` (or `main`)
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- Click **"Deploy site"**

### D. Set Environment Variables
1. Go to **Site settings** → **Environment variables**
2. Add these variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_KEY` = your Supabase anon/public key
   - `VITE_API_URL` = your backend API URL (see Backend Deployment)

3. Click **"Redeploy"** after adding variables

---

## STEP 3: Backend Deployment Options

Your Node.js backend (in `/server`) needs separate hosting. Choose one:

### Option A: Render (Recommended - Free tier available)
1. Go to https://render.com
2. Create a **"New Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `PORT=3030`
6. Copy the deployed URL and use it as `VITE_API_URL` in Netlify

### Option B: Railway.app
1. Go to https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Add root directory: `/server`
5. Add environment variables
6. Deploy

### Option C: Heroku
1. Create Heroku app
2. Set buildpack for Node.js
3. Configure subdirectory deployment
4. Add environment variables
5. Deploy

---

## STEP 4: Update Frontend API URL

After deploying backend, update your frontend code:

1. Create `.env.production` file in project root:
```env
VITE_API_URL=https://your-backend-url.render.com
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-key
```

2. Update API calls in your code to use environment variable:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';
fetch(`${API_URL}/api/customer-payments`)
```

---

## STEP 5: Continuous Deployment Workflow

Once set up, your workflow is:

### Local Development:
```bash
# Work on your code locally
npm run dev

# Test changes
```

### When Ready to Deploy:
```bash
# Commit changes
git add .
git commit -m "Your change description"

# Push to GitHub
git push origin master
```

**Netlify automatically detects the push and deploys!** ✨

Check deployment status at: https://app.netlify.com

---

## STEP 6: Custom Domain (Optional)

### On Netlify:
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration instructions
5. Netlify provides free SSL certificate

---

## Quick Commands Reference

```bash
# Check current branch
git branch

# See what files changed
git status

# Commit and push
git add .
git commit -m "Description of changes"
git push origin master

# Pull latest from GitHub
git pull origin master

# Create new branch for testing
git checkout -b feature-name
git push origin feature-name
```

---

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Verify all dependencies in `package.json`
- Ensure environment variables are set

### API Not Working
- Verify backend is deployed and running
- Check CORS settings in backend
- Confirm `VITE_API_URL` is correct in Netlify

### Database Connection Issues
- Run both SQL migrations in Supabase:
  1. `add-payment-fields.sql`
  2. `make-vendor-service-optional.sql`
- Verify Supabase credentials in environment variables

---

## Environment Variables Summary

### Netlify (Frontend):
- `VITE_API_URL` - Backend API URL
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_KEY` - Supabase public key

### Backend (Render/Railway/Heroku):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` - Supabase key
- `PORT` - Port number (usually 3030)
- `NODE_ENV=production`

---

## Next Steps After Deployment

1. **Test Production**: Visit your Netlify URL and test all features
2. **Monitor**: Check Netlify analytics and logs
3. **Database**: Run SQL migrations in Supabase if not done yet
4. **SSL**: Netlify provides free SSL automatically
5. **Backups**: Supabase handles database backups automatically

---

Your app is now live! Any push to GitHub master branch will auto-deploy to Netlify. 🚀
