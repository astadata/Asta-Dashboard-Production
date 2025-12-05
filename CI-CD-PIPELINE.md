# CI/CD Pipeline Setup for Staging & Production

## Overview
This guide shows how to implement automated deployments to staging and production environments using Google Cloud Run.

## Git Branch Strategy

```
main (Production)
  ↑
  ├─ Create PR from staging
  └─ Auto-deploy to: asta-frontend, asta-backend

staging (Staging)
  ↑
  ├─ Create PR from develop
  └─ Auto-deploy to: asta-frontend-staging, asta-backend-staging

develop (Local Development)
  ├─ All developers push here
  └─ Test locally before creating PRs
```

## Step 1: Set Up GitHub Actions Workflows

### 1.1 Create Staging Deployment Workflow

Create file: `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - staging

env:
  PROJECT_ID: astadata-dashboard-2025
  REGION: us-central1

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ env.PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true
      
      - name: Deploy frontend to staging
        run: |
          gcloud run deploy asta-frontend-staging \
            --source . \
            --region ${{ env.REGION }} \
            --allow-unauthenticated \
            --platform managed \
            --set-env-vars "VITE_API_URL=https://asta-backend-staging-533746513056.us-central1.run.app,VITE_SUPABASE_URL=${{ secrets.STAGING_SUPABASE_URL }},VITE_SUPABASE_KEY=${{ secrets.STAGING_SUPABASE_KEY }},VITE_FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }},VITE_FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }},VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ env.PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true
      
      - name: Deploy backend to staging
        run: |
          cd server
          gcloud run deploy asta-backend-staging \
            --source . \
            --region ${{ env.REGION }} \
            --platform managed \
            --set-env-vars "SUPABASE_URL=${{ secrets.STAGING_SUPABASE_URL }},SUPABASE_KEY=${{ secrets.STAGING_SUPABASE_KEY }},SUPABASE_SERVICE_ROLE_KEY=${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}"
```

### 1.2 Create Production Deployment Workflow

Create file: `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: astadata-dashboard-2025
  REGION: us-central1

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ env.PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true
      
      - name: Deploy frontend to production
        run: |
          gcloud run deploy asta-frontend \
            --source . \
            --region ${{ env.REGION }} \
            --allow-unauthenticated \
            --platform managed \
            --set-env-vars "VITE_API_URL=https://asta-backend-533746513056.us-central1.run.app,VITE_SUPABASE_URL=${{ secrets.SUPABASE_URL }},VITE_SUPABASE_KEY=${{ secrets.SUPABASE_KEY }},VITE_FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }},VITE_FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }},VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ env.PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true
      
      - name: Deploy backend to production
        run: |
          cd server
          gcloud run deploy asta-backend \
            --source . \
            --region ${{ env.REGION }} \
            --platform managed \
            --set-env-vars "SUPABASE_URL=${{ secrets.SUPABASE_URL }},SUPABASE_KEY=${{ secrets.SUPABASE_KEY }},SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

## Step 2: Configure GitHub Secrets

Go to: GitHub → Settings → Secrets and variables → Actions

Add these secrets:

```
GCP_SA_KEY                              (Service Account JSON key from Google Cloud)
SUPABASE_URL                            (Production: https://vfgoysnyxknvfaeemuxz.supabase.co)
SUPABASE_KEY                            (Production Anon Key)
SUPABASE_SERVICE_ROLE_KEY              (Production Service Role Key)
STAGING_SUPABASE_URL                    (Staging: same or separate project)
STAGING_SUPABASE_KEY                    (Staging Anon Key)
STAGING_SUPABASE_SERVICE_ROLE_KEY      (Staging Service Role Key)
FIREBASE_API_KEY
FIREBASE_PROJECT_ID
FIREBASE_AUTH_DOMAIN
```

## Step 3: Create Staging Cloud Run Services

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

## Step 4: Development Workflow

### For Developers

**1. Start new feature:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

**2. Make changes and test locally:**
```bash
# Frontend
npm run dev  # http://localhost:5173

# Backend (in another terminal)
cd server && npm start  # http://localhost:3030
```

**3. Commit and push:**
```bash
git add .
git commit -m "Feature: description of changes"
git push origin feature/my-feature
```

**4. Create Pull Request:**
- Go to GitHub
- Create PR: `feature/my-feature` → `develop`
- Add description
- Request review

**5. After approval, merge to develop**

### Testing in Staging

**1. Create PR from develop → staging:**
```bash
git checkout staging
git pull origin staging
git merge develop
git push origin staging
```

Or use GitHub UI to create PR: `develop` → `staging`

**2. Wait for GitHub Actions to deploy to staging**

**3. Test at staging URLs:**
- Frontend: Check Cloud Run console for asta-frontend-staging URL
- Backend: Check Cloud Run console for asta-backend-staging URL

**4. Run Testing Checklist:**
   - [ ] Login works (admin and customer)
   - [ ] Dashboard loads without errors
   - [ ] Vendor/service dropdowns populate
   - [ ] Usage data displays
   - [ ] Error details display
   - [ ] All buttons/features work
   - [ ] No console errors (open DevTools)
   - [ ] Network tab shows correct API URLs
   - [ ] Error messages are user-friendly
   - [ ] Performance is acceptable

### Deploying to Production

**1. After successful staging test, create PR from staging → main:**
```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```

Or use GitHub UI to create PR: `staging` → `main`

**2. Wait for GitHub Actions to deploy to production**

**3. Verify production:**
- Frontend: https://asta-frontend-533746513056.us-central1.run.app
- Backend: https://asta-backend-533746513056.us-central1.run.app

**4. Monitor errors:**
- Check Cloud Run logs for both services
- Watch for user-reported issues

## Step 5: Setting Up Google Cloud Service Account

**1. Create service account:**
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"
```

**2. Grant permissions:**
```bash
gcloud projects add-iam-policy-binding astadata-dashboard-2025 \
  --member=serviceAccount:github-actions@astadata-dashboard-2025.iam.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding astadata-dashboard-2025 \
  --member=serviceAccount:github-actions@astadata-dashboard-2025.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

**3. Create and download JSON key:**
```bash
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@astadata-dashboard-2025.iam.gserviceaccount.com
```

**4. Add to GitHub secrets:**
- Copy contents of `github-actions-key.json`
- Paste as `GCP_SA_KEY` secret in GitHub

## Testing Checklist for Staging

```
Login Tests:
  [ ] Admin login works
  [ ] Customer login works
  [ ] Invalid password shows error
  [ ] Non-existent user shows error
  [ ] Error messages are clear

Dashboard Tests:
  [ ] Page loads without JavaScript errors
  [ ] Vendor dropdown populates
  [ ] Service dropdown populates
  [ ] Date picker works
  [ ] Filters apply correctly

Data Display:
  [ ] Usage data loads and displays
  [ ] Error details table populates
  [ ] Charts render without errors
  [ ] Numbers are formatted correctly

API Tests:
  [ ] Check Network tab for correct URLs
  [ ] All calls go to staging backend
  [ ] No calls stuck on frontend
  [ ] Response times are acceptable

Performance:
  [ ] Page load time < 3 seconds
  [ ] Dashboard responds quickly to filters
  [ ] No memory leaks
  [ ] No excessive console warnings

Browser Compatibility:
  [ ] Chrome/Chromium
  [ ] Firefox
  [ ] Safari
  [ ] Edge
```

## Rollback Procedure

If production breaks:

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Or checkout previous commit
git checkout <previous-commit-hash>
git push origin main --force
```

GitHub Actions will automatically redeploy the previous version.

## Monitoring

**Production Logs:**
```bash
gcloud run services list --region us-central1

# View logs for frontend
gcloud run services logs read asta-frontend --region us-central1 --limit 100

# View logs for backend
gcloud run services logs read asta-backend --region us-central1 --limit 100
```

**Real-time Logs:**
```bash
# Watch frontend logs
gcloud run services logs read asta-frontend --region us-central1 --follow

# Watch backend logs
gcloud run services logs read asta-backend --region us-central1 --follow
```

## Benefits of This Setup

✅ **Automated Deployments**: No manual steps after code push  
✅ **Staging Environment**: Test before production  
✅ **Safe Rollback**: Easy to revert if issues found  
✅ **Team Collaboration**: Clear workflow for multiple developers  
✅ **Environment Separation**: Different configs for staging vs production  
✅ **Audit Trail**: All deployments tracked in GitHub  
✅ **Consistency**: Same deployment process every time  

## Common Issues & Solutions

### Issue: Deployment fails with authentication error
**Solution**: Check GCP_SA_KEY secret is correct JSON

### Issue: Frontend can't reach backend
**Solution**: Verify VITE_API_URL environment variable is correct in workflow

### Issue: Staging not using latest code
**Solution**: Ensure develop branch has latest commits before creating PR to staging

### Issue: Production deploys wrong version
**Solution**: Always merge staging → main through GitHub UI (don't force push)
