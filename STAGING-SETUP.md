# Google Cloud Staging Environment Setup

## 🎯 Architecture

You'll have TWO complete environments:

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Repository                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  master branch (Production)  →  Deploy to PRODUCTION        │
│       ↓                                                      │
│  staging branch (Testing)    →  Deploy to STAGING           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
        ↓                              ↓
    ┌──────────────────────────────────────┐
    │   Google Cloud Run Services          │
    ├──────────────────────────────────────┤
    │                                      │
    │  STAGING:                            │
    │  - asta-frontend-staging             │
    │  - asta-backend-staging              │
    │                                      │
    │  PRODUCTION:                         │
    │  - asta-frontend (current)           │
    │  - asta-backend (current)            │
    │                                      │
    └──────────────────────────────────────┘
```

---

## 📋 Step-by-Step Setup

### STEP 1: Create Staging Branch Locally

```bash
cd /Users/shilpibhawna/matx-react

# Create staging branch from master
git checkout -b staging
git push -u origin staging
```

---

### STEP 2: Deploy Staging Frontend

```bash
gcloud run deploy asta-frontend-staging \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed \
  --set-env-vars "VITE_API_URL=https://asta-backend-staging-533746513056.us-central1.run.app"
```

**Note:** This uses the staging branch code. You'll get a URL like:
`https://asta-frontend-staging-xxxxx-uc.a.run.app`

---

### STEP 3: Deploy Staging Backend

```bash
cd /Users/shilpibhawna/matx-react/server

gcloud run deploy asta-backend-staging \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3030 \
  --platform managed \
  --set-env-vars "SUPABASE_URL=https://vfgoysnyxknvfaeemuxz.supabase.co,SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1Njg0NTUsImV4cCI6MjA4MDE0NDQ1NX0.mzUbDdK69BqXCQiWopswnO3i81vchiL93wdkquBwjaA,SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZ295c255eGtudmZhZWVtdXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2ODQ1NSwiZXhwIjoyMDgwMTQ0NDU1fQ.CkiTcMu5oHX42fEhU6NnUkFhivJU2x44ubop6TqxVi4"
```

---

## 🔄 Workflow: Local → Staging → Production

### For New Features/Bug Fixes:

```bash
# 1. Create feature branch from staging (NOT master)
git checkout staging
git checkout -b feature/my-new-feature

# 2. Make your changes locally
# 3. Test locally (npm run dev)

# 4. Commit to feature branch
git add .
git commit -m "Add new feature"
git push -u origin feature/my-new-feature

# 5. Create Pull Request: feature/my-new-feature → staging
# (In GitHub, create PR)

# 6. Once merged into staging, it auto-deploys to STAGING environment
# Test at: https://asta-frontend-staging-xxxxx-uc.a.run.app

# 7. Test thoroughly in staging environment
# - Login
# - All features
# - Data loading
# - Error handling

# 8. Once verified in STAGING, create PR: staging → master
# This will deploy to PRODUCTION

# 9. After merging to master, it auto-deploys to PRODUCTION
```

---

## 🚀 Enable Auto-Deployment

To make deployments automatic when you push to branches, create a Cloud Build trigger:

### Option A: Using gcloud (Command Line)

```bash
# For staging branch
gcloud builds triggers create github \
  --repo-name=Asta-Dashboard-Production \
  --repo-owner=astadata \
  --name=deploy-staging-frontend \
  --branch-pattern=^staging$ \
  --build-config=cloudbuild-staging.yaml

# For master branch (production)
gcloud builds triggers create github \
  --repo-name=Asta-Dashboard-Production \
  --repo-owner=astadata \
  --name=deploy-prod-frontend \
  --branch-pattern=^master$ \
  --build-config=cloudbuild-prod.yaml
```

### Option B: Manual Deployment (Easier)

Just run these commands when ready:

**Staging Deploy:**
```bash
cd /Users/shilpibhawna/matx-react
git checkout staging
gcloud run deploy asta-frontend-staging --source . --region us-central1 --allow-unauthenticated --platform managed
```

**Production Deploy:**
```bash
cd /Users/shilpibhawna/matx-react
git checkout master
gcloud run deploy asta-frontend --source . --region us-central1 --allow-unauthenticated --platform managed
```

---

## 📊 Environment Comparison

| Aspect | Local | Staging | Production |
|--------|-------|---------|-----------|
| **URL** | http://localhost:5173 | https://asta-frontend-staging-xxx.run.app | https://asta-frontend-xxx.run.app |
| **Database** | Supabase (same) | Supabase (same) | Supabase (same) |
| **Purpose** | Development | Testing before prod | Live for users |
| **Uptime needed** | No | No | Yes |
| **Cost** | Free | ~$0.50/month | ~$2-5/month |

---

## ✅ Testing Checklist in Staging

Before moving to production, test:

```
☐ Login with admin user
☐ Login with customer user
☐ Dashboard loads without errors
☐ Vendor/service dropdowns work
☐ Data displays correctly
☐ Search and filters work
☐ Export to CSV works
☐ All navigation links work
☐ No console errors (F12)
☐ Mobile responsive
☐ API calls use correct backend URL
```

---

## 🔍 How to Debug Staging Issues

### View Staging Logs

```bash
# Frontend logs
gcloud run services logs read asta-frontend-staging --region us-central1 --limit 50

# Backend logs
gcloud run services logs read asta-backend-staging --region us-central1 --limit 50
```

### SSH into Container (For detailed debugging)

```bash
gcloud compute ssh <instance> \
  --project=astadata-dashboard-2025 \
  --zone=us-central1-a
```

---

## 📝 Git Branch Protection Rules

Recommended setup in GitHub:

```
master branch:
  ✓ Require pull request before merging
  ✓ Require status checks (from Cloud Build)
  ✓ Dismiss stale reviews on push
  ✓ Require up-to-date branches before merging

staging branch:
  ✓ Require pull request before merging
  ✓ Allow force pushes (for reset if needed)
```

---

## 🎯 Complete Workflow Example

### Scenario: Fixing a bug

```bash
# 1. Start from staging
git checkout staging
git pull origin staging

# 2. Create feature branch
git checkout -b fix/dashboard-blank-issue

# 3. Make the fix
# ... edit files ...

# 4. Test locally
npm run dev
# ✅ Verify fix works

# 5. Commit and push
git add .
git commit -m "Fix: Dashboard blank issue"
git push -u origin fix/dashboard-blank-issue

# 6. Create PR on GitHub: fix/dashboard-blank-issue → staging
# (Request review)

# 7. Merge to staging
# ✅ Auto-deploys to asta-frontend-staging

# 8. Test in staging at: https://asta-frontend-staging-xxx.run.app
# ✅ Verify fix works in production-like environment

# 9. Create PR: staging → master
# (For production release)

# 10. Merge to master
# ✅ Auto-deploys to asta-frontend (production)

# 11. Monitor production logs
gcloud run services logs read asta-frontend --region us-central1 --limit 50
```

---

## 💡 Pro Tips

1. **Never test in production** - Always test in staging first
2. **Keep staging branch stable** - Only merge tested code
3. **Document environment differences** - If staging and prod differ, note why
4. **Use same database** - Staging and prod use same Supabase for data consistency
5. **Monitor costs** - Staging adds ~$3/month to your bill
6. **Automate deployments** - Use Cloud Build for automatic CI/CD

---

## ⏱️ Deployment Time

- Local: Instant
- Staging: ~3-5 minutes (build + deploy)
- Production: ~3-5 minutes (build + deploy)

---

## 🆘 Rollback (If Staging Breaks)

```bash
# Redeploy previous version
gcloud run deploy asta-frontend-staging \
  --image gcr.io/astadata-dashboard-2025/asta-frontend-staging:latest \
  --region us-central1

# Or revert Git and redeploy
git checkout staging
git revert HEAD
git push origin staging
```

---

## Next Steps

1. ✅ Create staging branch: `git checkout -b staging && git push -u origin staging`
2. ✅ Deploy staging frontend and backend using commands above
3. ✅ Test in staging environment
4. ✅ When satisfied, merge staging → master for production

Ready to implement?
