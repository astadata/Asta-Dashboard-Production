# ✅ Staging Environment & CI/CD Setup - Complete

## What's Been Implemented

You now have a **production-grade CI/CD pipeline** with automated testing and deployments! 🚀

### 1. Three Git Branches
```
master  ────────────→ Deploys to PRODUCTION automatically
  ↑
  └── staging (merges from develop)
        ↑
        └── develop (where team develops)
              ↑
              └── feature/branches (individual features)
```

### 2. Automated Deployments
- **Push to `develop`**: Local feature branches only
- **Push to `staging`**: GitHub Actions deploys to staging services
- **Push to `master`**: GitHub Actions deploys to production

### 3. Staging Environment
Two separate Cloud Run services for safe testing:
- `asta-frontend-staging` - Frontend testing
- `asta-backend-staging` - Backend testing

### 4. Production Environment  
Production Cloud Run services:
- `asta-frontend` - Production frontend
- `asta-backend` - Production backend

## Files Created

### Documentation
1. **CI-CD-COMPLETE-SETUP.md** - Full setup guide (follow this!)
2. **CI-CD-PIPELINE.md** - Comprehensive reference
3. **STAGING-QUICK-START.md** - Quick reference guide

### GitHub Actions Workflows
1. **.github/workflows/deploy-staging.yml** - Auto-deploy to staging on push to `staging` branch
2. **.github/workflows/deploy-production.yml** - Auto-deploy to production on push to `master` branch

### Bug Fixes Already Applied
1. ✅ Fixed UsageDetailsTable.jsx - Now uses apiCall wrapper
2. ✅ Fixed ErrorDetailsTable.jsx - Now uses apiCall wrapper
3. ✅ All changes committed and pushed

## How It Works

### Developer Workflow

```
Step 1: Create feature branch
  git checkout develop
  git checkout -b feature/my-feature

Step 2: Make changes, test locally
  npm run dev          (frontend)
  cd server && npm start  (backend)

Step 3: Push to GitHub
  git push origin feature/my-feature
  Create Pull Request on GitHub

Step 4: After approval, merge to develop
  GitHub PR → Merge button

Step 5: Deploy to staging
  git checkout staging
  git merge develop
  git push origin staging
  ↓
  GitHub Actions automatically deploys! ✅
  Takes ~5-10 minutes

Step 6: Test in staging
  Open staging URLs
  Run testing checklist
  Verify everything works

Step 7: Deploy to production
  git checkout master
  git merge staging
  git push origin master
  ↓
  GitHub Actions automatically deploys! ✅
  Takes ~5-10 minutes

Step 8: Verify production
  Open production URLs
  Monitor for errors
```

## What You Need to Do Next

### Phase 1: GitHub Secrets (5 minutes)
Follow **CI-CD-COMPLETE-SETUP.md** to add 9 secrets to GitHub:
1. `GCP_SA_KEY` - Google Cloud service account
2. `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` - Production
3. `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_KEY`, `STAGING_SUPABASE_SERVICE_ROLE_KEY` - Staging
4. `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_AUTH_DOMAIN` - Firebase

### Phase 2: Create Staging Services (10 minutes)
Run these commands once to create staging Cloud Run services:

```bash
# Deploy staging frontend
gcloud run deploy asta-frontend-staging \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed

# Deploy staging backend
cd server
gcloud run deploy asta-backend-staging \
  --source . \
  --region us-central1 \
  --platform managed
```

### Phase 3: Test the Workflow (20 minutes)
After phases 1 & 2:
1. Make a small code change in feature branch
2. Create PR to develop
3. Merge to develop
4. Merge develop → staging and push
5. Watch GitHub Actions deploy to staging
6. Test staging environment
7. Merge staging → master and push
8. Watch GitHub Actions deploy to production

## Current Status

| Component | Status |
|-----------|--------|
| Production Frontend | ✅ Running (asta-frontend) |
| Production Backend | ✅ Running (asta-backend) |
| Staging Frontend | ⏳ Needs `gcloud run deploy` |
| Staging Backend | ⏳ Needs `gcloud run deploy` |
| GitHub Actions Workflows | ✅ Configured |
| Git Branches | ✅ Created (develop, staging, master) |
| Documentation | ✅ Complete |
| Bug Fixes | ✅ Applied |
| GitHub Secrets | ⏳ Need to be added |

## Key Files Location

```
/Users/shilpibhawna/matx-react/
├── CI-CD-COMPLETE-SETUP.md          ← Start here!
├── CI-CD-PIPELINE.md                ← Reference
├── STAGING-QUICK-START.md           ← Quick guide
├── .github/workflows/
│   ├── deploy-staging.yml           ← Stages automation
│   └── deploy-production.yml        ← Production automation
└── ... (rest of project)
```

## Testing Checklist After Setup

When you first deploy to staging, verify:

```
Login & Auth:
  ☐ Admin login works (admin@astadata.com / Admin@123)
  ☐ Customer login works (sales@astitva.ai / India@123)
  ☐ Wrong password shows error message
  ☐ Non-existent user shows error message

Dashboard:
  ☐ Page loads without JavaScript errors
  ☐ Vendor dropdown has options
  ☐ Service dropdown has options
  ☐ Date picker works
  ☐ Filters apply

Data Display:
  ☐ Usage details table shows data
  ☐ Error details table shows data
  ☐ Charts render if configured
  ☐ Numbers are formatted correctly

Network & Performance:
  ☐ DevTools → Network tab shows API calls to STAGING backend
  ☐ All API calls succeed (200-299 status)
  ☐ Page loads in < 3 seconds
  ☐ No console errors or warnings
```

## Quick Reference Commands

```bash
# See all branches
git branch -a

# Switch branches
git checkout develop
git checkout staging
git checkout master

# Create feature branch
git checkout develop
git checkout -b feature/description

# Push code
git add .
git commit -m "message"
git push origin branch-name

# Update staging from develop
git checkout staging
git merge develop
git push origin staging

# Update production from staging
git checkout master
git merge staging
git push origin master

# View Cloud Run services
gcloud run services list --region us-central1

# View staging logs
gcloud run services logs read asta-frontend-staging --region us-central1 --limit 50

# View production logs
gcloud run services logs read asta-frontend --region us-central1 --limit 50
```

## Benefits of This Setup

✅ **Automated Deployments** - No manual steps needed  
✅ **Safe Testing** - Staging before production  
✅ **Easy Rollback** - `git revert` and push  
✅ **Team Friendly** - Clear workflow for multiple developers  
✅ **Audit Trail** - All changes tracked in Git  
✅ **Environment Separation** - Different configs for staging vs production  
✅ **Consistency** - Same process every deployment  
✅ **Prevents Production Issues** - Catch problems in staging first  

## Support

If you encounter issues:

1. **Check logs**: `gcloud run services logs read [service-name]`
2. **Check GitHub Actions**: GitHub → Actions tab → View workflow logs
3. **Read documentation**: 
   - `CI-CD-COMPLETE-SETUP.md` - Full setup
   - `CI-CD-PIPELINE.md` - Reference
   - `STAGING-QUICK-START.md` - Quick guide
4. **Manual redeploy**: `gcloud run deploy [service-name] --source . --region us-central1`

## Next Steps

1. **Read**: CI-CD-COMPLETE-SETUP.md (full instructions)
2. **Add**: 9 GitHub secrets (take ~5 minutes)
3. **Create**: Staging services (run two gcloud commands)
4. **Test**: Push a small change through the workflow
5. **Go Live**: Use staging → master for future deployments

---

**You're now set up for professional, automated deployments with safe staging testing!** 🚀

Questions? Check the documentation files or GitHub Actions logs for detailed error messages.
