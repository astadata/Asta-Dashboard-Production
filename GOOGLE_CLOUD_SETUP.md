# Google Cloud Setup Guide - Non-Technical Version

Follow these steps **exactly** in order. Copy and paste each command one at a time.

---

## STEP 1: Install Google Cloud CLI

### For Mac:
1. Open Terminal (press Cmd+Space, type "Terminal", press Enter)
2. Run this command:
   ```bash
   brew install --cask google-cloud-sdk
   ```
   
   If you get an error about "brew not found", first install Homebrew:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   Then try the google-cloud-sdk install again.

3. After installation, restart your Terminal

---

## STEP 2: Login to Google Cloud

```bash
gcloud auth login
```

This will open a browser window. Sign in with your Google account.

---

## STEP 3: Create a New Project

```bash
# Create the project
gcloud projects create astadata-dashboard-2025 --name="AstaData Dashboard"

# Set it as your active project
gcloud config set project astadata-dashboard-2025

# Enable billing (you'll need to do this in the Google Cloud Console)
echo "⚠️  IMPORTANT: Go to https://console.cloud.google.com/billing and enable billing for astadata-dashboard-2025"
echo "Press Enter after enabling billing..."
read
```

---

## STEP 4: Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

Wait for this to complete (takes 1-2 minutes).

---

## STEP 5: Deploy Backend

```bash
cd /Users/shilpibhawna/matx-react/server

# Deploy (this will take 5-10 minutes)
gcloud run deploy asta-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3030 \
  --platform managed
```

**When prompted:**
- "Do you want to continue?" → Type `y` and press Enter
- Wait for deployment to complete

**Save the URL shown!** It will look like:
`https://asta-backend-xxxxx-uc.a.run.app`

Write it down! You'll need it in the next step.

---

## STEP 6: Add Environment Variables to Backend

Replace `YOUR_BACKEND_URL` below with the URL from Step 5:

```bash
gcloud run services update asta-backend \
  --region us-central1 \
  --set-env-vars "SUPABASE_URL=https://vxffdngspxwhmlgfkmjm.supabase.co,SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZmZkbmdzcHh3aG1sZ2ZrbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMzMyNzEsImV4cCI6MjA0ODgwOTI3MX0.KBZ2xUcCsyM-JwAwmM4BRtW4gYqDHm-jKq-IkbXmjCo,SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZmZkbmdzcHh3aG1sZ2ZrbWptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzIzMzI3MSwiZXhwIjoyMDQ4ODA5MjcxfQ.wPWrDJhHEZA0dpEpgE_0hgdPaVY1Y1OE6MQxOqrz1gk,PORT=3030"
```

---

## STEP 7: Test Backend

Replace `YOUR_BACKEND_URL` with your actual backend URL:

```bash
curl https://YOUR_BACKEND_URL/api/vendors
```

If you see JSON data, the backend is working! ✅

---

## STEP 8: Update Frontend Configuration

**IMPORTANT:** Replace `YOUR_BACKEND_URL` with your actual backend URL from Step 5!

```bash
cd /Users/shilpibhawna/matx-react

cat > .env.production << 'EOF'
VITE_API_URL=YOUR_BACKEND_URL

VITE_SUPABASE_URL=https://vxffdngspxwhmlgfkmjm.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZmZkbmdzcHh3aG1sZ2ZrbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMzMyNzEsImV4cCI6MjA0ODgwOTI3MX0.KBZ2xUcCsyM-JwAwmM4BRtW4gYqDHm-jKq-IkbXmjCo

VITE_FIREBASE_API_KEY=AIzaSyCTwOmMLAb-kkwVSm5zWjUeZzSMjPG6rBM
VITE_FIREBASE_AUTH_DOMAIN=astaboard-36150.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=astaboard-36150
VITE_FIREBASE_STORAGE_BUCKET=astaboard-36150.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=880620652806
VITE_FIREBASE_APP_ID=1:880620652806:web:d8ed5b61c2fe0668c7cf90
EOF
```

**Then manually edit the file to replace YOUR_BACKEND_URL:**
```bash
nano .env.production
```

Press Ctrl+X, then Y, then Enter to save.

---

## STEP 9: Deploy Frontend

```bash
cd /Users/shilpibhawna/matx-react

# This will take 10-15 minutes (building React app)
gcloud run deploy asta-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80 \
  --platform managed
```

**When prompted:**
- "Do you want to continue?" → Type `y` and press Enter
- Wait for deployment to complete

**Save the frontend URL!** It will look like:
`https://asta-frontend-xxxxx-uc.a.run.app`

---

## STEP 10: Test Your Application

Open the frontend URL in your browser. You should see your dashboard!

Try logging in with:
- Email: `admin@astadata.com`
- Password: `Admin@123`

---

## STEP 11 (Optional): Connect Your Custom Domain

If you want to use your GoDaddy domain:

```bash
# For frontend (main domain)
gcloud run domain-mappings create \
  --service asta-frontend \
  --domain yourdomain.com \
  --region us-central1

# For backend (api subdomain)
gcloud run domain-mappings create \
  --service asta-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

Google Cloud will give you DNS records to add in GoDaddy.

---

## View Your Application

```bash
# Get all your URLs
gcloud run services list --platform managed --region us-central1
```

---

## Common Issues & Solutions

### "Permission denied" error
Run: `gcloud auth login` again

### "Billing not enabled" error
Go to: https://console.cloud.google.com/billing
Enable billing for your project

### Build fails
Check: 
```bash
gcloud builds log --region=us-central1
```

### Need to update environment variables
```bash
gcloud run services update asta-backend \
  --region us-central1 \
  --set-env-vars "KEY=value"
```

---

## Cost Monitoring

Check your costs at: https://console.cloud.google.com/billing

**Expected monthly cost:** $0-10 for low traffic (Cloud Run has generous free tier)

---

## Support

If you get stuck:
1. Check the error message carefully
2. Copy the FULL error and share it with me
3. Run: `gcloud run services describe asta-backend --region us-central1` for details
