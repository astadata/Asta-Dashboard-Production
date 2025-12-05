# System Architecture - Staging & Production Environment

## Complete Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           GITHUB REPOSITORY                              │
│                  astadata/Asta-Dashboard-Production                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  BRANCHES:                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────────┐ │
│  │    develop      │◄───┤  feature/*      │    │     (Team Works)     │ │
│  │   (Integration) │    │   (Individual)  │    │                      │ │
│  └────────┬────────┘    └─────────────────┘    └──────────────────────┘ │
│           │                                                               │
│           │ (Merge & Push)                                               │
│           ▼                                                               │
│  ┌─────────────────┐                                                      │
│  │    staging      │◄─ GitHub Actions deploys to staging services        │
│  │  (QA Testing)   │                                                      │
│  └────────┬────────┘                                                      │
│           │                                                               │
│           │ (Merge & Push)                                               │
│           ▼                                                               │
│  ┌─────────────────┐                                                      │
│  │     master      │◄─ GitHub Actions deploys to production services     │
│  │  (Production)   │                                                      │
│  └─────────────────┘                                                      │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
    (GitHub Actions Workflows)          (GitHub Secrets - 9 total)
         │                                    │
         ├─ deploy-staging.yml               ├─ GCP_SA_KEY
         ├─ deploy-production.yml            ├─ SUPABASE_URL
         │                                    ├─ SUPABASE_KEY
         │                                    ├─ SUPABASE_SERVICE_ROLE_KEY
         │                                    ├─ STAGING_SUPABASE_URL
         │                                    ├─ STAGING_SUPABASE_KEY
         │                                    ├─ STAGING_SUPABASE_SERVICE_ROLE_KEY
         │                                    ├─ FIREBASE_API_KEY
         │                                    ├─ FIREBASE_PROJECT_ID
         │                                    └─ FIREBASE_AUTH_DOMAIN
         │
         └──────────────────┐
                            │
                            ▼
    ┌───────────────────────────────────────────────────────────────┐
    │              GOOGLE CLOUD PROJECT                              │
    │          (astadata-dashboard-2025)                             │
    ├───────────────────────────────────────────────────────────────┤
    │                                                                 │
    │  ┌─────────────────────────────────┐   ┌──────────────────┐   │
    │  │    CLOUD RUN SERVICES           │   │   SUPABASE       │   │
    │  ├─────────────────────────────────┤   ├──────────────────┤   │
    │  │                                 │   │                  │   │
    │  │  STAGING ENVIRONMENT:           │   │  Database:       │   │
    │  │  ┌────────────────────────────┐ │   │  ┌────────────┐  │   │
    │  │  │ asta-frontend-staging      │ │   │  │  Users     │  │   │
    │  │  │ (Port 8080)                │ │   │  │  Tables    │  │   │
    │  │  │ Deploys from: staging br   │ │   │  │  Config    │  │   │
    │  │  └────────────────────────────┘ │   │  └────────────┘  │   │
    │  │                                 │   │                  │   │
    │  │  ┌────────────────────────────┐ │   │  Project ID:     │   │
    │  │  │ asta-backend-staging       │ │   │  vfgoysnyxknv... │   │
    │  │  │ (Port 3030)                │ │   │                  │   │
    │  │  │ Deploys from: staging br   │ │   │  URL:            │   │
    │  │  └────────────────────────────┘ │   │  https://vfgoys..│   │
    │  │                                 │   │  supabase.co     │   │
    │  │  PRODUCTION ENVIRONMENT:        │   │                  │   │
    │  │  ┌────────────────────────────┐ │   │  (Shared between │   │
    │  │  │ asta-frontend              │ │   │   staging and    │   │
    │  │  │ (Port 8080)                │ │   │   production)    │   │
    │  │  │ Deploys from: master br    │ │   │                  │   │
    │  │  └────────────────────────────┘ │   │                  │   │
    │  │                                 │   │                  │   │
    │  │  ┌────────────────────────────┐ │   │                  │   │
    │  │  │ asta-backend               │ │   │                  │   │
    │  │  │ (Port 3030)                │ │   │                  │   │
    │  │  │ Deploys from: master br    │ │   │                  │   │
    │  │  └────────────────────────────┘ │   │                  │   │
    │  │                                 │   │                  │   │
    │  └─────────────────────────────────┘   └──────────────────┘   │
    │                                                                 │
    └───────────────────────────────────────────────────────────────┘
                       │               │
                       │               │
            (Staging URLs)   (Production URLs)
                       │               │
        https://asta-front  https://asta-front
        end-staging-...     end-533746513...
        us-central1.       us-central1.
        run.app            run.app
                       │               │
                       │               │
                       ▼               ▼
                   ┌─────┐         ┌─────┐
                   │Users│         │Users│
                   │Test │         │Live │
                   └─────┘         └─────┘
```

## Data Flow

```
DEVELOPER WORKFLOW
─────────────────

1. Developer works locally
   ├─ Create feature branch
   ├─ Make changes
   ├─ Test on localhost:5173 (frontend) & localhost:3030 (backend)
   └─ Commit changes

2. Push to GitHub
   └─ git push origin feature/description

3. Create Pull Request
   ├─ From: feature/description
   └─ To: develop

4. After approval, merge to develop
   └─ git push origin develop

5. Merge develop to staging
   ├─ git push origin staging
   └─ GitHub Actions triggered

6. GitHub Actions deploys to staging
   ├─ Reads secrets from GitHub
   ├─ Builds Docker images
   ├─ Pushes to Google Cloud
   └─ Deploys to asta-frontend-staging & asta-backend-staging

7. QA team tests in staging
   ├─ Opens https://asta-frontend-staging-...
   ├─ Tests all features
   └─ Reports issues

8. After QA approval, merge staging to master
   ├─ git push origin master
   └─ GitHub Actions triggered

9. GitHub Actions deploys to production
   ├─ Reads secrets from GitHub
   ├─ Builds Docker images
   ├─ Pushes to Google Cloud
   └─ Deploys to asta-frontend & asta-backend

10. Users access production
    ├─ Frontend: https://asta-frontend-533746513...
    └─ Backend: https://asta-backend-533746513...
```

## Environment Variables Flow

```
STAGING DEPLOYMENT
──────────────────

develop/staging branch push
         │
         ▼
GitHub Actions workflow triggered
         │
         ├─ Reads secrets from GitHub:
         │  ├─ GCP_SA_KEY
         │  ├─ STAGING_SUPABASE_URL
         │  ├─ STAGING_SUPABASE_KEY
         │  └─ ...more...
         │
         ├─ gcloud build and push container
         │
         └─ gcloud run deploy with --set-env-vars
                       │
                       ├─ VITE_API_URL=https://asta-backend-staging-...
                       ├─ VITE_SUPABASE_URL=${STAGING_SUPABASE_URL}
                       ├─ VITE_SUPABASE_KEY=${STAGING_SUPABASE_KEY}
                       └─ ...more...
                       │
                       ▼
                   Cloud Run Service Updated
                   ├─ asta-frontend-staging ✅
                   └─ asta-backend-staging ✅


PRODUCTION DEPLOYMENT
─────────────────────

master branch push
     │
     ▼
GitHub Actions workflow triggered
     │
     ├─ Reads secrets from GitHub:
     │  ├─ GCP_SA_KEY
     │  ├─ SUPABASE_URL
     │  ├─ SUPABASE_KEY
     │  └─ ...more...
     │
     ├─ gcloud build and push container
     │
     └─ gcloud run deploy with --set-env-vars
                 │
                 ├─ VITE_API_URL=https://asta-backend-533746513...
                 ├─ VITE_SUPABASE_URL=${SUPABASE_URL}
                 ├─ VITE_SUPABASE_KEY=${SUPABASE_KEY}
                 └─ ...more...
                 │
                 ▼
             Cloud Run Service Updated
             ├─ asta-frontend ✅
             └─ asta-backend ✅
```

## Communication Flow

```
FRONTEND REQUEST FLOW
─────────────────────

Client Browser (User)
         │
         │ https://asta-frontend-staging-...
         ▼
    Nginx Router (Port 8080)
    (Handles React Router)
         │
         │ React App Loads
         │ SimpleLogin.jsx Component
         ▼
    User Enters Credentials
         │
         │ API Call via apiCall()
         ▼
    Backend API Request
    https://asta-backend-staging-533746513...
    /api/customers?email=...
         │
         ▼
    Backend Express Server
    server/src/index.js
         │
         ▼
    Query Supabase Database
    (vfgoysnyxknvfaeemuxz.supabase.co)
         │
         ▼
    Return User Data
         │
         ▼
    Frontend Receives Response
         │
         ▼
    Dashboard Displays Data ✅


STAGING ISOLATION
─────────────────

User in Staging Environment:
┌─ Can login with staging users
├─ Sees data from Supabase
├─ Makes API calls to staging backend
├─ Independent from production users
└─ Can test new features safely

User in Production Environment:
┌─ Can login with real users
├─ Sees real data
├─ Makes API calls to production backend
├─ Unaffected by staging changes
└─ Live system (higher SLA)

DATABASE SHARING:
  Both use same Supabase project (vfgoysnyxknvfaeemuxz)
  Future: Can create separate staging database if needed
```

## File Changes Made

```
Files Created/Modified for CI/CD
────────────────────────────────

✅ CI-CD-PIPELINE.md
   - Comprehensive 400+ line reference guide
   - Workflows, troubleshooting, monitoring

✅ CI-CD-COMPLETE-SETUP.md  
   - Step-by-step setup guide
   - All 9 secrets documented
   - Commands to create staging services

✅ STAGING-QUICK-START.md
   - Quick reference for developers
   - Essential commands only

✅ SETUP-COMPLETE.md
   - Overview of what was done
   - Status checklist
   - Next steps

✅ .github/workflows/deploy-staging.yml
   - Auto-deploys to staging on push to staging branch
   - Builds frontend & backend from source
   - Sets environment variables from GitHub secrets

✅ .github/workflows/deploy-production.yml
   - Auto-deploys to production on push to master branch
   - Builds frontend & backend from source
   - Sets environment variables from GitHub secrets

✅ Bug Fixes Applied:
   ├─ UsageDetailsTable.jsx
   │  └─ Changed fetch() → apiCall()
   │
   └─ ErrorDetailsTable.jsx
      └─ Changed fetch() → apiCall()

✅ Git Branches Created:
   ├─ develop (for team integration)
   ├─ staging (for QA testing)
   └─ master (production)
```

## Quick Status Check

```
Check Production Running:
  gcloud run services list --region us-central1

Should show:
  asta-frontend    ✅
  asta-backend     ✅
  asta-frontend-staging    (after setup)
  asta-backend-staging     (after setup)

Check Git Branches:
  git branch -a

Should show:
  develop          ✅
  staging          ✅
  master           ✅
  origin/develop   ✅
  origin/staging   ✅
  origin/master    ✅

Check GitHub Actions:
  Go to: GitHub → Actions
  
Should show:
  Deploy to Staging
  Deploy to Production

Check GitHub Secrets:
  Go to: Settings → Secrets and variables → Actions
  
Should have 9 secrets after setup.
```

## Summary

```
┌─ Git Branch Strategy
│  └─ develop → staging → master
│
├─ Automated Deployments
│  └─ GitHub Actions on each push
│
├─ Environment Separation
│  └─ Staging (safe testing) vs Production (live)
│
├─ Safe Testing
│  └─ Test everything in staging before production
│
└─ Easy Rollback
   └─ git revert + push to rollback
```

This architecture ensures:
✅ Multiple developers can work safely (feature branches)
✅ Code tested before production (staging environment)
✅ Automated deployments (no manual steps)
✅ Easy rollback if issues found
✅ Clear separation of concerns (develop → staging → production)
✅ Environment consistency (same code, different configs)
