# Complete CI/CD Setup Guide - Step by Step

## Current Status

✅ GitHub Actions workflow files created  
✅ develop, staging, and master branches created in GitHub  
✅ CI/CD documentation ready  

## What We've Built

You now have a complete automated deployment pipeline:

```
Your Code Changes
    ↓
develop branch (local testing)
    ↓
Create Pull Request: develop → staging
    ↓
GitHub Actions automatically deploys to:
  - asta-frontend-staging
  - asta-backend-staging
    ↓
Test in staging environment
    ↓
Create Pull Request: staging → master
    ↓
GitHub Actions automatically deploys to:
  - asta-frontend (production)
  - asta-backend (production)
    ↓
Production live! ✅
```

## Complete Setup Instructions

### Phase 1: GitHub Secrets Configuration (Required for CI/CD to work)

**Go to:** GitHub → astadata/Asta-Dashboard-Production → Settings → Secrets and variables → Actions

Add these 9 secrets (you can copy these values):

#### 1. GCP_SA_KEY
This is your Google Cloud Service Account authentication key

**Get it:**
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"

gcloud projects add-iam-policy-binding astadata-dashboard-2025 \
  --member=serviceAccount:github-actions@astadata-dashboard-2025.iam.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding astadata-dashboard-2025 \
  --member=serviceAccount:github-actions@astadata-dashboard-2025.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser

gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@astadata-dashboard-2025.iam.gserviceaccount.com
```

Then open `~/github-actions-key.json` and copy the entire JSON content.

**Add to GitHub:**
- Secret name: `GCP_SA_KEY`
- Value: [Paste entire JSON file content]

#### 2-4. Production Supabase Keys

**Secret name:** `SUPABASE_URL`  
**Value:** `https://vfgoysnyxknvfaeemuxz.supabase.co`

**Secret name:** `SUPABASE_KEY`  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg0NTUsImV4cCI6MjA4MDE0NDQ1NX0.mzUbDdK69BqXCQiWopswnO3i81vchiL93wdkquBwjaA`

**Secret name:** `SUPABASE_SERVICE_ROLE_KEY`  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2ODQ1NSwiZXhwIjoyMDgwMTQ0NDU1fQ.CkiTcMu5oHX42fEhU6NnUkFhivJU2x44ubop6TqxVi4`

#### 5-7. Staging Supabase Keys (same as production for now)

**Secret name:** `STAGING_SUPABASE_URL`  
**Value:** `https://vfgoysnyxknvfaeemuxz.supabase.co`

**Secret name:** `STAGING_SUPABASE_KEY`  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg0NTUsImV4cCI6MjA4MDE0NDQ1NX0.mzUbDdK69BqXCQiWopswnO3i81vchiL93wdkquBwjaA`

**Secret name:** `STAGING_SUPABASE_SERVICE_ROLE_KEY`  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2ODQ1NSwiZXhwIjoyMDgwMTQ0NDU1fQ.CkiTcMu5oHX42fEhU6NnUkFhivJU2x44ubop6TqxVi4`

#### 8-10. Firebase Keys

**Get from Firebase Console:**
Go to: Firebase Project → Project Settings → Service Accounts → Generate New Private Key

**Secret name:** `FIREBASE_API_KEY`  
**Value:** [Your Firebase API Key - find in Firebase console]

**Secret name:** `FIREBASE_PROJECT_ID`  
**Value:** [Your Firebase Project ID]

**Secret name:** `FIREBASE_AUTH_DOMAIN`  
**Value:** [Your Firebase Auth Domain]

### Phase 2: Create Staging Cloud Run Services

These commands create separate staging services that GitHub Actions will deploy to:

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

After running these commands:
1. GitHub Actions workflows become active
2. When you push to `staging` branch, it auto-deploys to staging services
3. When you push to `master` branch, it auto-deploys to production services

### Phase 3: Verify Setup

**Check GitHub Actions:**
1. Go to: GitHub → astadata/Asta-Dashboard-Production → Actions
2. You should see two workflows:
   - "Deploy to Staging"
   - "Deploy to Production"

**Check branches:**
```bash
git branch -a
# Should show:
#   * master
#   develop
#   staging
#   remotes/origin/develop
#   remotes/origin/master
#   remotes/origin/staging
```

**Check Cloud Run services:**
```bash
gcloud run services list --region us-central1
# Should show:
#   asta-frontend
#   asta-backend
#   asta-frontend-staging
#   asta-backend-staging
```

## Development Workflow (After Setup)

### 1. Create Feature Branch

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature-name
```

### 2. Make Changes & Test Locally

```bash
# Terminal 1 - Frontend
npm run dev
# Opens on http://localhost:5173

# Terminal 2 - Backend
cd server && npm start
# Runs on http://localhost:3030
```

Test everything works locally before committing.

### 3. Commit & Push to develop

```bash
git add .
git commit -m "feat: description of changes"
git push origin feature/my-feature-name
```

### 4. Create Pull Request

Go to GitHub:
1. Click "New Pull Request"
2. From: `feature/my-feature-name`
3. To: `develop`
4. Add description
5. Click "Create Pull Request"

### 5. Merge to develop

After review/approval, click "Merge pull request"

```bash
# Or merge locally:
git checkout develop
git merge feature/my-feature-name
git push origin develop
```

### 6. Deploy to Staging

```bash
# Merge develop → staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging
```

**GitHub Actions automatically deploys!** ✅

Watch deployment:
- GitHub → Actions tab
- Watch "Deploy to Staging" workflow
- Takes 5-10 minutes

### 7. Test in Staging

Find staging URLs:
```bash
gcloud run services describe asta-frontend-staging --region us-central1
gcloud run services describe asta-backend-staging --region us-central1
```

Or find in Cloud Run console.

**Test checklist:**
```
☐ Admin login works
☐ Customer login works
☐ Dashboard loads
☐ Vendor/service dropdowns work
☐ Usage data displays
☐ Error details display
☐ No console errors (open DevTools)
☐ All buttons/features work
☐ Error messages are helpful
```

### 8. Deploy to Production

```bash
# Merge staging → master
git checkout master
git pull origin master
git merge staging
git push origin master
```

**GitHub Actions automatically deploys to production!** ✅

### 9. Verify Production

```bash
# Find production URLs
gcloud run services describe asta-frontend --region us-central1
gcloud run services describe asta-backend --region us-central1
```

Or:
- Frontend: https://asta-frontend-533746513056.us-central1.run.app
- Backend: https://asta-backend-533746513056.us-central1.run.app

## Monitoring

### View Logs

```bash
# Staging frontend
gcloud run services logs read asta-frontend-staging --region us-central1 --limit 50

# Staging backend
gcloud run services logs read asta-backend-staging --region us-central1 --limit 50

# Production frontend
gcloud run services logs read asta-frontend --region us-central1 --limit 50

# Production backend
gcloud run services logs read asta-backend --region us-central1 --limit 50

# Watch logs in real-time
gcloud run services logs read asta-frontend --region us-central1 --follow
```

### GitHub Actions Logs

Go to: GitHub → Actions → Select workflow → Select run → View logs

## Emergency Rollback

If production breaks:

```bash
# Option 1: Revert last commit
git revert HEAD
git push origin master
# GitHub Actions will deploy the previous version

# Option 2: Manually scale down traffic
gcloud run services update-traffic asta-frontend \
  --region us-central1 \
  --to-revisions LATEST=0
# This disables traffic to latest version

# Option 3: Redeploy previous revision manually
git checkout HEAD~1  # Go back one commit
gcloud run deploy asta-frontend --source . --region us-central1
```

## Troubleshooting

### GitHub Actions Won't Deploy

**Problem:** Workflow doesn't trigger when pushing to staging/master

**Solution:**
1. Check GitHub → Settings → Actions → General
2. Ensure "All actions and reusable workflows" is selected
3. Check all 9 secrets are added correctly
4. Try: `git push origin staging --force-with-lease`

### API Calls Go to Frontend Instead of Backend

**Problem:** Frontend making requests to itself

**Solution:**
- Check workflow file has correct backend URL
- Staging should use: `asta-backend-staging-...`
- Production should use: `asta-backend-...`

### Login Fails in Staging

**Problem:** Can't login to staging environment

**Solution:**
- Staging using same database as production (intentional)
- Users exist in Supabase: admin@astadata.com, sales@astitva.ai
- Check staging backend logs: `gcloud run services logs read asta-backend-staging`

### Deployment Takes Too Long

**Normal timing:**
- First deploy: 10-15 minutes (building image)
- Subsequent deploys: 5-10 minutes
- If stuck > 20 minutes, check Cloud Build console

## Branch Naming Conventions

```
Feature branches: feature/description
Bug fixes:        fix/description
Documentation:    docs/description
```

Examples:
```
git checkout -b feature/add-export-csv
git checkout -b fix/api-routing-error
git checkout -b docs/update-readme
```

## Next Steps

1. ✅ Create Google Cloud Service Account (run commands above)
2. ✅ Add all 9 secrets to GitHub
3. ✅ Create staging Cloud Run services
4. ✅ Test workflow: feature → develop → staging → master
5. ✅ Monitor first deployment
6. ✅ Document team guidelines

## Quick Reference

```bash
# Start work
git checkout develop && git pull origin develop
git checkout -b feature/my-feature

# Publish feature
git push origin feature/my-feature
# Create PR on GitHub: feature → develop

# Update staging
git checkout staging && git pull
git merge develop
git push origin staging
# Workflow auto-deploys

# Update production
git checkout master && git pull
git merge staging
git push origin master
# Workflow auto-deploys
```

## Questions?

Check:
- CI-CD-PIPELINE.md (comprehensive reference)
- STAGING-QUICK-START.md (quick reference)
- Cloud Run logs (debugging)
- GitHub Actions logs (deployment issues)
