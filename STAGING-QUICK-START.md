# Quick Start: Staging Environment Setup

## What We've Done

1. ✅ Created GitHub Actions workflows for automated deployments
2. ✅ Set up CI/CD pipeline for staging and production
3. ✅ Fixed all API calls in dashboard components
4. ✅ Committed all changes to Git

## Next Steps: To Activate Staging

### Step 1: Create GitHub Staging Branch

```bash
# Create staging branch from main
git checkout main
git pull origin main
git checkout -b staging
git push origin staging
```

### Step 2: Add GitHub Secrets

Go to: **GitHub → astadata/Asta-Dashboard-Production → Settings → Secrets and variables → Actions**

Add these secrets (copy/paste values):

```
GCP_SA_KEY
  ↓
  Paste the Google Cloud Service Account JSON key

SUPABASE_URL
  ↓
  https://vfgoysnyxknvfaeemuxz.supabase.co

SUPABASE_KEY
  ↓
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg0NTUsImV4cCI6MjA4MDE0NDQ1NX0.mzUbDdK69BqXCQiWopswnO3i81vchiL93wdkquBwjaA

SUPABASE_SERVICE_ROLE_KEY
  ↓
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2ODQ1NSwiZXhwIjoyMDgwMTQ0NDU1fQ.CkiTcMu5oHX42fEhU6NnUkFhivJU2x44ubop6TqxVi4

STAGING_SUPABASE_URL
  ↓
  https://vfgoysnyxknvfaeemuxz.supabase.co (same as production for now)

STAGING_SUPABASE_KEY
  ↓
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg0NTUsImV4cCI6MjA4MDE0NDQ1NX0.mzUbDdK69BqXCQiWopswnO3i81vchiL93wdkquBwjaA

STAGING_SUPABASE_SERVICE_ROLE_KEY
  ↓
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2ODQ1NSwiZXhwIjoyMDgwMTQ0NDU1fQ.CkiTcMu5oHX42fEhU6NnUkFhivJU2x44ubop6TqxVi4

FIREBASE_API_KEY
  ↓
  [Your Firebase API Key]

FIREBASE_PROJECT_ID
  ↓
  [Your Firebase Project ID]

FIREBASE_AUTH_DOMAIN
  ↓
  [Your Firebase Auth Domain]
```

### Step 3: Create Google Cloud Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"

# Grant Cloud Run admin role
gcloud projects add-iam-policy-binding astadata-dashboard-2025 \
  --member=serviceAccount:github-actions@astadata-dashboard-2025.iam.gserviceaccount.com \
  --role=roles/run.admin

# Grant service account user role
gcloud projects add-iam-policy-binding astadata-dashboard-2025 \
  --member=serviceAccount:github-actions@astadata-dashboard-2025.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser

# Create and download JSON key
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@astadata-dashboard-2025.iam.gserviceaccount.com
```

Then copy the contents of `~/github-actions-key.json` and paste as the `GCP_SA_KEY` secret.

### Step 4: Create Staging Services in Google Cloud

```bash
# Deploy staging frontend (first time)
gcloud run deploy asta-frontend-staging \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed

# Deploy staging backend (first time)
cd server
gcloud run deploy asta-backend-staging \
  --source . \
  --region us-central1 \
  --platform managed
```

### Step 5: Verify Staging Services

```bash
# List all Cloud Run services
gcloud run services list --region us-central1
```

Look for:
- `asta-frontend-staging`
- `asta-backend-staging`

Note their URLs - you'll use these for testing.

## Development Workflow

### To Deploy to Staging:

```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Make your changes, test locally
npm run dev

# Commit changes
git add .
git commit -m "Feature: description"
git push origin feature/my-feature

# Create Pull Request: feature/my-feature → staging
# OR merge manually:
git checkout staging
git pull origin staging
git merge feature/my-feature
git push origin staging
```

**GitHub Actions will automatically deploy to staging!**

### To Deploy to Production:

```bash
# After testing in staging
git checkout main
git pull origin main
git merge staging
git push origin main
```

**GitHub Actions will automatically deploy to production!**

## Testing Checklist (Staging)

After deployment completes, test:

```
Login:
  ☐ Admin login works
  ☐ Customer login works
  ☐ Invalid password shows error
  
Dashboard:
  ☐ Page loads without errors
  ☐ Vendor dropdown populates
  ☐ Usage data displays
  ☐ Error details display
  
Network:
  ☐ All API calls go to staging backend
  ☐ No calls stuck on frontend
  ☐ Response times acceptable

Console:
  ☐ No JavaScript errors
  ☐ No warning messages
```

## Monitoring

### View Staging Logs:
```bash
gcloud run services logs read asta-frontend-staging --region us-central1 --limit 100
gcloud run services logs read asta-backend-staging --region us-central1 --limit 100
```

### View Production Logs:
```bash
gcloud run services logs read asta-frontend --region us-central1 --limit 100
gcloud run services logs read asta-backend --region us-central1 --limit 100
```

## Useful Commands

```bash
# Switch to develop branch
git checkout develop

# Switch to staging branch
git checkout staging

# Switch to main (production)
git checkout main

# View all branches
git branch -a

# Create new branch from develop
git checkout develop && git checkout -b feature/name

# Push branch to GitHub
git push origin branch-name

# Create pull request (use GitHub UI)
# Or merge locally:
git checkout target-branch
git merge source-branch
git push origin target-branch
```

## Troubleshooting

**Q: Deployment failed - authentication error?**
A: Check `GCP_SA_KEY` secret is valid JSON from Google Cloud

**Q: Frontend can't reach backend?**
A: Verify `VITE_API_URL` matches staging backend URL

**Q: Staging not using latest code?**
A: Make sure you pushed to staging branch: `git push origin staging`

**Q: Old version still showing?**
A: Cloud Run caches builds. Wait 1-2 minutes or manually redeploy:
```bash
gcloud run deploy asta-frontend-staging --source . --region us-central1 --allow-unauthenticated
```

## Next Steps

1. ✅ Set up staging branch
2. ✅ Create Google Cloud service account
3. ✅ Add GitHub secrets
4. ✅ Create staging services
5. ✅ Test workflow: develop → staging → main
6. ✅ Monitor both environments

Your CI/CD pipeline is now ready! 🚀
