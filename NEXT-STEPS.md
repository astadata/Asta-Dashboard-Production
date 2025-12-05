# 🚀 Next Steps Checklist - Staging Environment Setup

## What's Complete ✅

- [x] Fixed API calls in dashboard components (UsageDetailsTable, ErrorDetailsTable)
- [x] Created GitHub Actions workflows for staging and production
- [x] Created three git branches (develop, staging, master)
- [x] Created comprehensive documentation
- [x] Created system architecture diagrams
- [x] All code committed and pushed to GitHub

## What You Need to Do (Next 20 minutes)

### Step 1: Add GitHub Secrets (5 minutes)

Go to: **GitHub → Settings → Secrets and variables → Actions**

Add these 9 secrets (copy-paste the values provided):

```
1. GCP_SA_KEY
   Value: [Get from running gcloud command - see below]

2. SUPABASE_URL
   Value: https://vfgoysnyxknvfaeemuxz.supabase.co

3. SUPABASE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg0NTUsImV4cCI6MjA4MDE0NDQ1NX0.mzUbDdK69BqXCQiWopswnO3i81vchiL93wdkquBwjaA

4. SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2ODQ1NSwiZXhwIjoyMDgwMTQ0NDU1fQ.CkiTcMu5oHX42fEhU6NnUkFhivJU2x44ubop6TqxVi4

5. STAGING_SUPABASE_URL
   Value: https://vfgoysnyxknvfaeemuxz.supabase.co

6. STAGING_SUPABASE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg0NTUsImV4cCI6MjA4MDE0NDQ1NX0.mzUbDdK69BqXCQiWopswnO3i81vchiL93wdkquBwjaA

7. STAGING_SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2ODQ1NSwiZXhwIjoyMDgwMTQ0NDU1fQ.CkiTcMu5oHX42fEhU6NnUkFhivJU2x44ubop6TqxVi4

8. FIREBASE_API_KEY
   Value: [Get from your Firebase project settings]

9. FIREBASE_PROJECT_ID
   Value: [Get from your Firebase project settings]

10. FIREBASE_AUTH_DOMAIN
    Value: [Get from your Firebase project settings]
```

**How to get GCP_SA_KEY:**

Run these commands once:

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"

# Grant permissions
gcloud projects add-iam-policy-binding astadata-dashboard-2025 \
  --member=serviceAccount:github-actions@astadata-dashboard-2025.iam.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding astadata-dashboard-2025 \
  --member=serviceAccount:github-actions@astadata-dashboard-2025.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser

# Create JSON key
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@astadata-dashboard-2025.iam.gserviceaccount.com

# View the key
cat ~/github-actions-key.json
```

Copy entire JSON and paste as `GCP_SA_KEY` secret.

### Step 2: Create Staging Services (10 minutes)

Run these two commands to create staging Cloud Run services:

```bash
# Deploy staging frontend
cd /Users/shilpibhawna/matx-react
gcloud run deploy asta-frontend-staging \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed
```

Wait for it to finish (should take ~3-5 minutes), then:

```bash
# Deploy staging backend
cd /Users/shilpibhawna/matx-react/server
gcloud run deploy asta-backend-staging \
  --source . \
  --region us-central1 \
  --platform managed
```

Wait for it to finish.

### Step 3: Verify Setup (5 minutes)

After services are deployed:

```bash
# Check all services exist
gcloud run services list --region us-central1

# Should show:
#   asta-frontend
#   asta-backend
#   asta-frontend-staging
#   asta-backend-staging
```

## After Setup - First Test Deployment (20 minutes)

Once staging services are created, test the workflow:

```bash
# Make a small code change
echo "// Test change" >> src/main.jsx

# Commit to develop
git add src/main.jsx
git commit -m "test: test CI/CD workflow"
git push origin develop

# Merge develop → staging
git checkout staging
git merge develop
git push origin staging
```

Watch GitHub Actions:
1. Go to: GitHub → Actions
2. You should see "Deploy to Staging" running
3. Wait for it to complete (5-10 minutes)
4. Check staging services deployed successfully

Then test:
```bash
# Get staging frontend URL
gcloud run services describe asta-frontend-staging --region us-central1 | grep "https://"

# Open in browser and test
```

## Documentation Files (Refer to these)

| File | Purpose |
|------|---------|
| `CI-CD-COMPLETE-SETUP.md` | **Read this first** - Full setup guide |
| `CI-CD-PIPELINE.md` | Reference guide for all operations |
| `STAGING-QUICK-START.md` | Quick commands reference |
| `ARCHITECTURE.md` | System diagrams and data flow |
| `SETUP-COMPLETE.md` | This setup guide overview |

## Workflow After Setup

```bash
# 1. Create feature branch
git checkout develop
git checkout -b feature/my-feature

# 2. Make changes & test locally
npm run dev

# 3. Commit
git add .
git commit -m "feat: description"
git push origin feature/my-feature

# 4. Create PR on GitHub (develop ← feature)

# 5. After approval, merge to develop
git checkout develop && git merge feature/my-feature

# 6. Deploy to staging
git checkout staging && git merge develop && git push origin staging
# → GitHub Actions auto-deploys

# 7. Test in staging
# → Open staging URLs and test

# 8. Deploy to production
git checkout master && git merge staging && git push origin master
# → GitHub Actions auto-deploys

# Done! ✅
```

## Troubleshooting

**Q: Workflow doesn't trigger?**  
A: Make sure all 9 GitHub secrets are added

**Q: Deployment fails?**  
A: Check GitHub Actions logs (Actions tab → click workflow → view logs)

**Q: Can't create staging services?**  
A: Make sure you're authenticated: `gcloud auth login`

**Q: Production still showing old code?**  
A: Wait 2-3 minutes for new revision to get traffic

## Success Criteria

After setup, you'll know it's working when:

✅ All 4 Cloud Run services running:
  - asta-frontend (production)
  - asta-backend (production)
  - asta-frontend-staging
  - asta-backend-staging

✅ GitHub Actions workflows exist and are active

✅ Can login to staging and production

✅ Dashboard displays data without errors

✅ Changes in develop branch deploy to staging

✅ Changes in master branch deploy to production

## Estimated Time

- [ ] Add GitHub secrets: **5 minutes**
- [ ] Create staging services: **10 minutes**  
- [ ] Verify setup: **5 minutes**
- [ ] Test first deployment: **10-15 minutes**

**Total: ~30-35 minutes to fully complete setup**

## Support

If anything fails:

1. Check error messages in Cloud Run logs:
   ```bash
   gcloud run services logs read asta-frontend-staging --region us-central1
   ```

2. Check GitHub Actions logs:
   - GitHub → Actions → select workflow → view logs

3. Review documentation:
   - `CI-CD-COMPLETE-SETUP.md` - most detailed
   - `ARCHITECTURE.md` - diagrams and flows

## Current Production Status

✅ **Production is running now** - no setup needed for production  
✅ **All bug fixes applied** - API calls working  
✅ **Users can login and use dashboard**  

**You just need to set up staging for safe testing before production changes.**

---

**Ready?** Start with Step 1 above! 🚀

Questions? See `CI-CD-COMPLETE-SETUP.md` for detailed explanations.
