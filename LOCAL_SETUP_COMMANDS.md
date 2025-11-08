# 🖥️ Local Development Setup - Quick Start Commands

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js (v16 or higher) - Check: `node --version`
- ✅ Python (v3.11 or higher) - Check: `python --version` or `py -3 --version`
- ✅ MongoDB (running locally) - Check: `mongosh` or install from https://www.mongodb.com/try/download/community

---

## 🚀 Quick Start (Copy & Paste)

### Option A: Run Both in Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
py -3 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

**Terminal 3 - Seed Database (First Time Only):**
```bash
# Wait for backend to start, then visit:
# http://localhost:8000/api/dev/seed/
# Or use curl:
curl -X POST http://localhost:8000/api/dev/seed/
```

**Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Login: admin@example.com / admin123

---

## 📝 Detailed Step-by-Step Instructions

### Step 1: Setup MongoDB (One-Time)

**If MongoDB is NOT installed:**

**Windows:**
```bash
# Download and install from:
# https://www.mongodb.com/try/download/community

# Or use Chocolatey:
choco install mongodb

# Start MongoDB service:
net start MongoDB
```

**Verify MongoDB is running:**
```bash
mongosh
# Should connect to: mongodb://localhost:27017
# Type 'exit' to quit
```

**If MongoDB connection fails:**
The app will automatically use in-memory database (mongomock) for development.

---

### Step 2: Setup Backend

**Navigate to backend folder:**
```bash
cd backend
```

**Create virtual environment:**
```bash
# Windows:
py -3 -m venv .venv

# Or if 'py' doesn't work:
python -m venv .venv
```

**Activate virtual environment:**
```bash
# Windows CMD:
.\.venv\Scripts\activate

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# If you get execution policy error in PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Install dependencies:**
```bash
# Upgrade pip first:
python -m pip install --upgrade pip

# Install requirements:
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed django-5.2.8 djangorestframework-3.16.1 ...
```

**Run database migrations (optional, for Django admin):**
```bash
python manage.py migrate
```

**Start backend server:**
```bash
python manage.py runserver 0.0.0.0:8000
```

**Expected output:**
```
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

**✅ Backend is now running at: http://localhost:8000**

---

### Step 3: Seed Database (First Time Only)

**Keep backend running, open a NEW terminal:**

**Option 1 - Using Browser:**
```
Visit: http://localhost:8000/api/dev/seed/
```

**Option 2 - Using curl:**
```bash
curl -X POST http://localhost:8000/api/dev/seed/
```

**Option 3 - Using PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/dev/seed/ -Method POST
```

**Expected response:**
```json
{"detail": "Seeded"}
```

**This creates:**
- 7 test users (admin, hr, team lead, employees, product owner)
- 2 teams
- 2 projects
- 4 stories
- Sample chat messages
- Sample notifications

---

### Step 4: Setup Frontend

**Open a NEW terminal (keep backend running):**

**Navigate to project root:**
```bash
cd ..
# Or if you're in backend folder:
cd ..
```

**Install dependencies:**
```bash
npm install
```

**Expected output:**
```
added 200+ packages in 30s
```

**Start frontend development server:**
```bash
npm run dev
```

**Expected output:**
```
VITE v6.2.0  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
➜  press h + enter to show help
```

**✅ Frontend is now running at: http://localhost:3000**

---

## 🎯 Access the Application

**Open your browser and go to:**
```
http://localhost:3000
```

**Login with test accounts:**

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@example.com | admin123 | Full access |
| **HR** | hr@example.com | hr123 | HR + Settings |
| **Team Lead** | lead@example.com | lead123 | Team management |
| **Employee** | emma@example.com | emp123 | Basic access |
| **Product Owner** | po@projecthub.com | po123 | Project management |

---

## 🛑 Stopping the Application

**To stop servers:**
- Press `Ctrl + C` in each terminal
- Or close the terminal windows

**To deactivate Python virtual environment:**
```bash
deactivate
```

---

## 🔄 Restarting the Application

**Next time you want to run the app:**

**Terminal 1 - Backend:**
```bash
cd backend
.\.venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**No need to:**
- ❌ Reinstall dependencies (unless package.json changes)
- ❌ Reseed database (data persists in MongoDB)
- ❌ Recreate virtual environment

---

## 🧪 Testing the Application

### Test Authentication:
1. Go to http://localhost:3000
2. Login with: admin@example.com / admin123
3. You should see the dashboard

### Test Forgot Password:
1. Click "Forgot your password?"
2. Enter: admin@example.com
3. You'll see OTP in a toast notification (development mode)
4. Enter OTP and new password
5. Login with new password

### Test Notifications:
1. Login as admin
2. Click bell icon in navbar
3. You should see sample notifications

### Test Creating Data:
1. Go to Projects page
2. Click "Create Project"
3. Fill in details and save
4. Verify it appears in the list

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "No module named 'django'"**
```bash
# Make sure virtual environment is activated:
.\.venv\Scripts\activate

# Reinstall dependencies:
pip install -r requirements.txt
```

**Error: "Port 8000 is already in use"**
```bash
# Find and kill the process:
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Or use a different port:
python manage.py runserver 8001
```

**Error: "MongoDB connection failed"**
```bash
# Check if MongoDB is running:
net start MongoDB

# Or let it use in-memory database (mongomock)
# It will automatically fallback
```

**Error: "ModuleNotFoundError: No module named 'pymongo'"**
```bash
pip install pymongo
```

### Frontend Issues

**Error: "Cannot find module 'vite'"**
```bash
# Delete node_modules and reinstall:
rmdir /s /q node_modules
npm install
```

**Error: "Port 3000 is already in use"**
```bash
# Kill the process:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or Vite will automatically use next available port (3001, 3002, etc.)
```

**Error: "Failed to fetch" or "Network Error"**
```bash
# Make sure backend is running on port 8000
# Check: http://localhost:8000/api/users/

# Verify proxy in vite.config.ts:
# proxy: { '/api': { target: 'http://localhost:8000' } }
```

**Blank page or white screen:**
```bash
# Clear browser cache
# Check browser console for errors (F12)
# Verify backend is running and seeded
```

---

## 📊 Verify Everything is Working

### Check Backend:
```bash
# Test API endpoint:
curl http://localhost:8000/api/users/

# Should return JSON with users list
```

### Check Frontend:
```bash
# Open browser console (F12)
# Should see no errors
# Network tab should show successful API calls
```

### Check Database:
```bash
# Connect to MongoDB:
mongosh

# Switch to database:
use weintegration_db

# Check collections:
show collections

# Count users:
db.users.countDocuments()
# Should return: 7

# Exit:
exit
```

---

## 🎨 Development Tips

### Hot Reload:
- **Frontend:** Changes auto-reload (Vite HMR)
- **Backend:** Restart server after code changes

### View API Documentation:
```
http://localhost:8000/api/docs/
```

### View Database:
```bash
# Use MongoDB Compass (GUI):
# Download: https://www.mongodb.com/try/download/compass
# Connect to: mongodb://localhost:27017
```

### Clear Database and Reseed:
```bash
# In mongosh:
use weintegration_db
db.dropDatabase()

# Then reseed:
curl -X POST http://localhost:8000/api/dev/seed/
```

---

## 📦 Complete Command Reference

### Backend Commands:
```bash
cd backend                              # Navigate to backend
py -3 -m venv .venv                    # Create virtual environment
.\.venv\Scripts\activate               # Activate virtual environment
pip install -r requirements.txt        # Install dependencies
python manage.py migrate               # Run migrations (optional)
python manage.py runserver 8000        # Start server
deactivate                             # Deactivate virtual environment
```

### Frontend Commands:
```bash
npm install                            # Install dependencies
npm run dev                            # Start development server
npm run build                          # Build for production
npm run preview                        # Preview production build
```

### Database Commands:
```bash
mongosh                                # Connect to MongoDB
use weintegration_db                   # Switch to database
show collections                       # List collections
db.users.find()                        # View users
db.dropDatabase()                      # Delete database
exit                                   # Exit mongosh
```

---

## ✅ Quick Checklist

Before starting development:
- [ ] MongoDB is installed and running
- [ ] Node.js is installed (v16+)
- [ ] Python is installed (v3.11+)

First time setup:
- [ ] Backend virtual environment created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Database seeded

Every time you develop:
- [ ] Start MongoDB (if not auto-starting)
- [ ] Start backend server (Terminal 1)
- [ ] Start frontend server (Terminal 2)
- [ ] Open http://localhost:3000

---

## 🎉 You're All Set!

Your local development environment is ready. Happy coding! 🚀

**Quick Start Summary:**
```bash
# Terminal 1 - Backend
cd backend
.\.venv\Scripts\activate
python manage.py runserver 8000

# Terminal 2 - Frontend  
npm run dev

# Browser
http://localhost:3000
Login: admin@example.com / admin123
```
