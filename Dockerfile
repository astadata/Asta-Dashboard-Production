# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Define build arguments for environment variables
ARG VITE_API_URL=https://asta-backend-533746513056.us-central1.run.app
ARG VITE_SUPABASE_URL=https://vxffdngspxwhmlgfkmjm.supabase.co
ARG VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZmZkbmdzcHh3aG1sZ2ZrbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMzMyNzEsImV4cCI6MjA0ODgwOTI3MX0.KBZ2xUcCsyM-JwAwmM4BRtW4gYqDHm-jKq-IkbXmjCo
ARG VITE_FIREBASE_API_KEY=AIzaSyCTwOmMLAb-kkwVSm5zWjUeZzSMjPG6rBM
ARG VITE_FIREBASE_AUTH_DOMAIN=astaboard-36150.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=astaboard-36150
ARG VITE_FIREBASE_STORAGE_BUCKET=astaboard-36150.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=880620652806
ARG VITE_FIREBASE_APP_ID=1:880620652806:web:d8ed5b61c2fe0668c7cf90

# Set them as environment variables for the build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (required by Cloud Run)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
