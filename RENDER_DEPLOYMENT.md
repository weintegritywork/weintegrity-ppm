# Render Deployment Guide

## Prerequisites
- GitHub account with your project repository
- Render account (sign up at https://render.com)

## Deployment Steps

### Option 1: Using render.yaml (Blueprint - Recommended)

1. **Push render.yaml to your repository**
   - The `render.yaml` file has been created in your project root
   - Commit and push it to your GitHub repository

2. **Create New Blueprint on Render**
   - Go to https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create both services

3. **Configure Environment Variables**
   
   **Backend Environment Variables:**
   - `SECRET_KEY` - Auto-generated or set your own Django secret key
   - `DEBUG` - Set to `False`
   - `ALLOWED_HOSTS` - Add your backend URL: `your-backend-name.onrender.com`
   - `CORS_ALLOWED_ORIGINS` - Add your frontend URL: `https://your-frontend-name.onrender.com`
   - `DATABASE_URL` - If using external database (MongoDB, PostgreSQL, etc.)
   - Any other custom environment variables from `.env.example`

   **Frontend Environment Variables:**
   - `VITE_API_URL` - Your backend URL: `https://your-backend-name.onrender.com`
   - `GEMINI_API_KEY` - Your Gemini API key (if needed)

4. **Deploy**
   - Click "Apply" to deploy both services
   - Wait for builds to complete (5-10 minutes)

---

### Option 2: Manual Deployment (Individual Services)

#### Backend Deployment

1. **Create New Web Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Backend Service**
   - **Name:** `weintegrity-backend` (or your choice)
   - **Runtime:** Python 3
   - **Region:** Choose closest to your users
   - **Branch:** main (or your default branch)
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`
   - **Start Command:** `gunicorn api.wsgi:application`
   - **Instance Type:** Free or paid tier

3. **Add Backend Environment Variables**
   ```
   PYTHON_VERSION=3.11.0
   DJANGO_SETTINGS_MODULE=api.settings
   SECRET_KEY=<generate-a-secret-key>
   DEBUG=False
   ALLOWED_HOSTS=<your-backend-url>.onrender.com
   CORS_ALLOWED_ORIGINS=https://<your-frontend-url>.onrender.com
   ```

4. **Create and Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

#### Frontend Deployment

1. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect the same repository

2. **Configure Frontend Service**
   - **Name:** `weintegrity-frontend` (or your choice)
   - **Runtime:** Node
   - **Region:** Same as backend
   - **Branch:** main
   - **Root Directory:** Leave empty (root)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run preview -- --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free or paid tier

3. **Add Frontend Environment Variables**
   ```
   NODE_VERSION=18.17.0
   VITE_API_URL=https://<your-backend-url>.onrender.com
   GEMINI_API_KEY=<your-api-key>
   ```

4. **Create and Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

---

## Post-Deployment Steps

1. **Update CORS Settings**
   - Go to backend service environment variables
   - Update `CORS_ALLOWED_ORIGINS` with your actual frontend URL
   - Redeploy backend if needed

2. **Update Frontend API URL**
   - Ensure `VITE_API_URL` points to your backend URL
   - Redeploy frontend if needed

3. **Test Your Application**
   - Visit your frontend URL
   - Test API connectivity
   - Check browser console for errors

4. **Set Up Custom Domains (Optional)**
   - In each service settings, go to "Custom Domain"
   - Add your domain and configure DNS

---

## Important Notes

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (enough for one service)

### Database Considerations
- SQLite (db.sqlite3) won't persist on Render's free tier
- Consider using:
  - Render PostgreSQL (free tier available)
  - MongoDB Atlas (free tier available)
  - External database service

### Static Files
- Django static files are collected during build
- Ensure `STATIC_ROOT` is configured in Django settings

### Logs and Monitoring
- View logs in Render Dashboard → Service → Logs
- Set up health checks in service settings

---

## Troubleshooting

**Backend won't start:**
- Check `ALLOWED_HOSTS` includes your Render URL
- Verify all required environment variables are set
- Check logs for missing dependencies

**Frontend can't connect to backend:**
- Verify `VITE_API_URL` is correct
- Check CORS settings on backend
- Ensure backend is running

**Build failures:**
- Check build logs for specific errors
- Verify Python/Node versions
- Ensure all dependencies are in requirements.txt/package.json

**Database errors:**
- SQLite won't work on Render free tier (ephemeral filesystem)
- Migrate to PostgreSQL or MongoDB

---

## Useful Commands

**Manually trigger deploy:**
- Go to service → Manual Deploy → Deploy latest commit

**View environment variables:**
- Service → Environment → Environment Variables

**Access shell:**
- Service → Shell (paid plans only)

---

## Alternative: Using Dockerfile

If you prefer Docker-based deployment, Render also supports deploying from Dockerfiles. Your backend already has a Dockerfile that can be used.

For Docker deployment:
1. Select "Docker" as runtime
2. Render will automatically detect and use the Dockerfile
3. Configure environment variables as above
