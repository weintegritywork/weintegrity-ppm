# 🚀 Complete Deployment Guide - WEIntegrity Project Management

This guide will help you deploy your application to production so you can use it for real.

---

## 📋 Table of Contents
1. [Recommended Deployment Options](#recommended-deployment-options)
2. [Option 1: Vercel + Railway (Easiest)](#option-1-vercel--railway-easiest)
3. [Option 2: Netlify + Render (Free Tier)](#option-2-netlify--render-free-tier)
4. [Option 3: AWS (Professional)](#option-3-aws-professional)
5. [Option 4: DigitalOcean (Balanced)](#option-4-digitalocean-balanced)
6. [Pre-Deployment Checklist](#pre-deployment-checklist)
7. [Post-Deployment Setup](#post-deployment-setup)

---

## 🎯 Recommended Deployment Options

### Quick Comparison

| Platform | Frontend | Backend | Database | Cost | Difficulty | Best For |
|----------|----------|---------|----------|------|------------|----------|
| **Vercel + Railway** | Vercel | Railway | MongoDB Atlas | $5-20/mo | ⭐ Easy | Quick start |
| **Netlify + Render** | Netlify | Render | MongoDB Atlas | Free-$7/mo | ⭐ Easy | Testing/Small teams |
| **AWS** | S3+CloudFront | EC2/ECS | DocumentDB | $30-100/mo | ⭐⭐⭐ Hard | Enterprise |
| **DigitalOcean** | App Platform | App Platform | Managed MongoDB | $12-40/mo | ⭐⭐ Medium | Growing teams |

---

## 🏆 Option 1: Vercel + Railway (RECOMMENDED - Easiest)

**Best for:** Quick deployment, small to medium teams  
**Cost:** ~$5-20/month  
**Setup Time:** 30 minutes

### Step 1: Deploy Database (MongoDB Atlas - FREE)

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "M0 FREE" tier
   - Select region closest to your users
   - Click "Create"

3. **Setup Database Access**
   - Go to "Database Access" → "Add New Database User"
   - Username: `weintegrity_admin`
   - Password: Generate strong password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://weintegrity_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Save this for later!

### Step 2: Deploy Backend (Railway)

1. **Go to Railway**
   - Visit: https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository
   - Choose the `backend` folder

3. **Configure Environment Variables**
   - Click on your service → "Variables" tab
   - Add these variables:
   ```
   DJANGO_SECRET_KEY=your-super-secret-key-here-change-this-to-random-string
   DEBUG=false
   ALLOWED_HOSTS=your-backend-url.railway.app
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   MONGO_URI=mongodb+srv://weintegrity_admin:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   MONGO_DBNAME=weintegration_db
   USE_MONGOMOCK=false
   ```

4. **Generate Django Secret Key**
   - Run this in your terminal:
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```
   - Copy the output and use it for `DJANGO_SECRET_KEY`

5. **Deploy**
   - Railway will automatically deploy
   - Wait for deployment to complete
   - Copy your backend URL (e.g., `https://your-app.railway.app`)

6. **Seed the Database**
   - Once deployed, visit: `https://your-app.railway.app/api/dev/seed/`
   - This will populate your database with initial data
   - **IMPORTANT:** After seeding, remove this endpoint or set `DEBUG=false`

### Step 3: Deploy Frontend (Vercel)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Root Directory: `./` (leave as root)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variable**
   - Go to "Environment Variables"
   - Add:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```
   - Replace with your actual Railway backend URL

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (2-3 minutes)
   - Your app will be live at: `https://your-app.vercel.app`

6. **Update Backend CORS**
   - Go back to Railway
   - Update `CORS_ALLOWED_ORIGINS` with your Vercel URL:
   ```
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
   - Railway will auto-redeploy

### Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Login with: `admin@example.com` / `admin123`
3. Test all features:
   - Create a project
   - Add a story
   - Send a chat message
   - Check notifications

### Step 5: Setup Custom Domain (Optional)

**For Vercel (Frontend):**
1. Go to your project → "Settings" → "Domains"
2. Add your domain (e.g., `app.yourcompany.com`)
3. Follow DNS instructions from your domain provider

**For Railway (Backend):**
1. Go to your service → "Settings" → "Domains"
2. Add custom domain (e.g., `api.yourcompany.com`)
3. Update CORS settings with new domain

---

## 💰 Option 2: Netlify + Render (FREE TIER)

**Best for:** Testing, personal projects, small teams  
**Cost:** FREE (with limitations)  
**Setup Time:** 30 minutes

### Step 1: MongoDB Atlas (Same as Option 1)
Follow Step 1 from Option 1 above.

### Step 2: Deploy Backend (Render)

1. **Go to Render**
   - Visit: https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder

3. **Configure Service**
   - Name: `weintegrity-backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt && pip install gunicorn`
   - Start Command: `gunicorn api.wsgi:application --bind 0.0.0.0:$PORT`
   - Plan: Free (or paid for better performance)

4. **Add Environment Variables**
   ```
   DJANGO_SECRET_KEY=your-generated-secret-key
   DEBUG=false
   ALLOWED_HOSTS=your-app.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-app.netlify.app
   MONGO_URI=your-mongodb-atlas-connection-string
   MONGO_DBNAME=weintegration_db
   USE_MONGOMOCK=false
   PORT=8000
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes on free tier)
   - Copy your URL: `https://your-app.onrender.com`

6. **Seed Database**
   - Visit: `https://your-app.onrender.com/api/dev/seed/`

### Step 3: Deploy Frontend (Netlify)

1. **Go to Netlify**
   - Visit: https://netlify.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub
   - Select your repository

3. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variable:
   ```
   VITE_API_URL=https://your-app.onrender.com/api
   ```

4. **Deploy**
   - Click "Deploy site"
   - Your app will be live at: `https://random-name.netlify.app`

5. **Update Backend CORS**
   - Go back to Render
   - Update `CORS_ALLOWED_ORIGINS` with your Netlify URL

**⚠️ Free Tier Limitations:**
- Render free tier: Backend sleeps after 15 min of inactivity (slow first load)
- Netlify free tier: 100GB bandwidth/month
- MongoDB Atlas free tier: 512MB storage

---

## 🏢 Option 3: AWS (Professional/Enterprise)

**Best for:** Large teams, enterprise, high traffic  
**Cost:** $30-100+/month  
**Setup Time:** 2-4 hours  
**Difficulty:** Advanced

### Architecture
- **Frontend:** S3 + CloudFront (CDN)
- **Backend:** EC2 or ECS (Docker)
- **Database:** DocumentDB or MongoDB Atlas
- **Load Balancer:** Application Load Balancer
- **SSL:** AWS Certificate Manager

### Quick Steps

1. **Setup MongoDB**
   - Use MongoDB Atlas (easier) OR
   - AWS DocumentDB (more expensive but integrated)

2. **Deploy Backend**
   - Create EC2 instance (Ubuntu 22.04)
   - Install Docker
   - Run backend container:
   ```bash
   docker run -d -p 8000:8000 \
     -e DJANGO_SECRET_KEY=your-key \
     -e DEBUG=false \
     -e MONGO_URI=your-uri \
     your-backend-image
   ```

3. **Deploy Frontend**
   - Build: `npm run build`
   - Upload `dist/` to S3 bucket
   - Enable static website hosting
   - Create CloudFront distribution
   - Point to S3 bucket

4. **Setup Load Balancer**
   - Create Application Load Balancer
   - Point to EC2 backend
   - Configure health checks

5. **SSL Certificates**
   - Request certificate in ACM
   - Attach to CloudFront and ALB

**Detailed AWS guide available on request.**

---

## 🌊 Option 4: DigitalOcean (Balanced)

**Best for:** Growing teams, good balance of ease and control  
**Cost:** $12-40/month  
**Setup Time:** 1 hour

### Step 1: MongoDB Atlas
Follow Step 1 from Option 1.

### Step 2: Deploy Backend

1. **Create App**
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Connect GitHub repository
   - Select `backend` folder

2. **Configure**
   - Type: Web Service
   - Build Command: `pip install -r requirements.txt && pip install gunicorn`
   - Run Command: `gunicorn api.wsgi:application --bind 0.0.0.0:8080`
   - HTTP Port: 8080

3. **Environment Variables**
   ```
   DJANGO_SECRET_KEY=your-key
   DEBUG=false
   MONGO_URI=your-mongodb-uri
   MONGO_DBNAME=weintegration_db
   USE_MONGOMOCK=false
   ```

4. **Deploy**
   - Choose plan ($5-12/month)
   - Deploy

### Step 3: Deploy Frontend

1. **Create App**
   - Click "Create App"
   - Connect GitHub repository
   - Select root folder

2. **Configure**
   - Type: Static Site
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend-app.ondigitalocean.app/api
   ```

4. **Deploy**
   - Choose plan ($3-5/month)
   - Deploy

---

## ✅ Pre-Deployment Checklist

### Backend Changes Required

1. **Update `backend/core/views.py`**
   - Remove OTP from forgot password response:
   ```python
   # In ForgotPasswordView.post(), change:
   return Response({
       'message': 'If an account exists with this email, a reset code has been sent.',
       # 'otp': otp  # REMOVE THIS LINE
   }, status=200)
   ```

2. **Disable Seed Endpoint**
   - In `backend/core/urls.py`, comment out or remove:
   ```python
   # path('dev/seed/', DevSeedView.as_view(), name='dev-seed'),  # DISABLE IN PRODUCTION
   ```

3. **Setup Email Service (for OTP)**
   - Choose email provider:
     - SendGrid (free tier: 100 emails/day)
     - AWS SES (cheap, reliable)
     - Mailgun (free tier: 5000 emails/month)
   
   - Add to `backend/core/views.py` in `ForgotPasswordView`:
   ```python
   # After generating OTP, send email:
   from django.core.mail import send_mail
   
   send_mail(
       'Password Reset Code',
       f'Your password reset code is: {otp}\n\nThis code expires in 10 minutes.',
       'noreply@yourapp.com',
       [email],
       fail_silently=False,
   )
   ```

4. **Configure Django Email Settings**
   - Add to `backend/api/settings.py`:
   ```python
   # Email Configuration
   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
   EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.sendgrid.net')
   EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
   EMAIL_USE_TLS = True
   EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
   EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
   DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@yourapp.com')
   ```

### Frontend Changes Required

1. **Update Login Page**
   - In `pages/Login.tsx`, remove development OTP display:
   ```typescript
   // Remove or comment out:
   if (result.data?.otp) {
     toastContext?.addToast(`OTP for ${email} is: ${result.data.otp}...`, 'info');
     console.log('OTP (Development only):', result.data.otp);
   }
   ```

2. **Update Settings**
   - Change default portal name in `context/SettingsContext.tsx`
   - Update footer text with your company info

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong Django secret key
- [ ] Enable HTTPS (SSL certificates)
- [ ] Whitelist CORS origins (no wildcards)
- [ ] Disable DEBUG mode
- [ ] Remove seed endpoint
- [ ] Setup email service for OTP
- [ ] Enable MongoDB authentication
- [ ] Setup database backups
- [ ] Configure firewall rules
- [ ] Enable rate limiting (optional)
- [ ] Setup monitoring/logging

---

## 📧 Email Service Setup (SendGrid - Recommended)

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for free account (100 emails/day)
3. Verify your email

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name: "WEIntegrity Production"
4. Permissions: "Full Access"
5. Copy the API key (save it!)

### Step 3: Verify Sender
1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter your email (e.g., noreply@yourcompany.com)
4. Verify the email

### Step 4: Add to Environment Variables
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourcompany.com
```

---

## 🧪 Post-Deployment Testing

### 1. Test Authentication
- [ ] Login with admin account
- [ ] Logout
- [ ] Forgot password (check email)
- [ ] Reset password with OTP
- [ ] Login with new password

### 2. Test Core Features
- [ ] Create project
- [ ] Create team
- [ ] Create story
- [ ] Assign story to user
- [ ] Send chat message
- [ ] Check notifications

### 3. Test Permissions
- [ ] Login as different roles
- [ ] Verify access restrictions
- [ ] Test maintenance mode

### 4. Performance Testing
- [ ] Check page load times
- [ ] Test with multiple users
- [ ] Monitor database queries

---

## 🆘 Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check logs for errors
- Ensure all dependencies installed

### Frontend can't connect to backend
- Verify VITE_API_URL is correct
- Check CORS settings on backend
- Ensure backend is running
- Check browser console for errors

### Database connection fails
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Ensure database user has correct permissions
- Test connection with MongoDB Compass

### Emails not sending
- Verify email service credentials
- Check email service quota
- Look for errors in backend logs
- Test with a simple email first

---

## 💡 Recommended: Start with Option 1 (Vercel + Railway)

**Why?**
- ✅ Easiest to setup (30 minutes)
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL certificates
- ✅ Good performance
- ✅ Affordable ($5-20/month)
- ✅ Easy to scale later
- ✅ Great developer experience

**You can always migrate to AWS or DigitalOcean later as you grow!**

---

## 📞 Need Help?

If you get stuck:
1. Check the error logs in your deployment platform
2. Verify all environment variables are set
3. Test backend API directly (use Postman or curl)
4. Check MongoDB Atlas connection
5. Review CORS settings

---

## 🎉 You're Ready!

Choose your deployment option and follow the steps. I recommend starting with **Option 1 (Vercel + Railway)** for the easiest experience.

After deployment, your team can access the app from anywhere with just a URL!

**Good luck with your deployment! 🚀**
