# Step-by-Step Commands to Run the Application

Follow these steps in order to get your application running.

---

## Step 1: Open Two Terminal Windows

You need **TWO separate PowerShell/Command Prompt windows**:
- **Terminal 1** - For Backend
- **Terminal 2** - For Frontend

---

## Step 2: Setup Backend (Terminal 1) - First Time Only

If you haven't set up the backend before, run these commands:

```powershell
# Navigate to backend directory
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app\backend

# Create virtual environment (if not exists)
py -3 -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate
```

**Note:** You only need to do Step 2 once. After that, skip to Step 3.

---

## Step 3: Start Backend Server (Terminal 1)

```powershell
# Navigate to backend directory
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app\backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start Django server
python manage.py runserver 0.0.0.0:8000
```

**Expected Output:**
```
Watching for file changes with StatReloader
Performing system checks...
System check identified no issues (0 silenced).
Django version 5.2.8, using settings 'api.settings'
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

**✅ Backend is now running!** Keep this terminal open.

---

## Step 4: Setup Frontend (Terminal 2) - First Time Only

If you haven't installed frontend dependencies, run:

```powershell
# Navigate to project root
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app

# Install dependencies
npm install
```

**Note:** You only need to do Step 4 once. After that, skip to Step 5.

---

## Step 5: Start Frontend Server (Terminal 2)

```powershell
# Navigate to project root
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app

# Start frontend development server
npm run dev
```

**Expected Output:**
```
  VITE v6.2.0  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**✅ Frontend is now running!** Keep this terminal open.

---

## Step 6: (Optional) Seed Database

Open a **third terminal** or use your browser/Postman:

```powershell
# Seed the database with initial test data
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/seed/" -Method POST
```

**Expected Output:**
```
StatusCode        : 200
StatusDescription : OK
Content           : {"detail":"Seeded"}
```

**✅ Database seeded with test data!**

---

## Step 7: Access the Application

Open your web browser and go to:

**Frontend Application:** http://localhost:3000

**Test Accounts (after seeding):**
- **Admin**: `admin@example.com` / `admin123`
- **HR**: `hr@example.com` / `hr123`
- **Team Lead**: `lead@example.com` / `lead123`
- **Employee**: `emma@example.com` / `emp123`
- **Product Owner**: `po@projecthub.com` / `po123`

---

## Quick Reference Commands

### Backend (Terminal 1)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

### Frontend (Terminal 2)
```powershell
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app
npm run dev
```

---

## Stopping the Servers

- **Backend**: In Terminal 1, press `CTRL + BREAK` or `CTRL + C`
- **Frontend**: In Terminal 2, press `CTRL + C`

---

## Troubleshooting

### Backend Issues

**"python: command not found"**
```powershell
# Try python3 instead
python3 manage.py runserver 0.0.0.0:8000
```

**"Port 8000 already in use"**
```powershell
# Use a different port
python manage.py runserver 0.0.0.0:8001
```

**Virtual environment not activating**
```powershell
# Try this instead
.\.venv\Scripts\activate
# Or
.venv\Scripts\Activate.ps1
```

### Frontend Issues

**"npm: command not found"**
- Install Node.js from https://nodejs.org/

**"Port 3000 already in use"**
- Vite will automatically use the next available port (3001, 3002, etc.)

**Module errors**
```powershell
# Clear and reinstall
npm cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## Complete Startup Checklist

- [ ] Terminal 1: Backend server running on port 8000
- [ ] Terminal 2: Frontend server running on port 3000
- [ ] Browser: Can access http://localhost:3000
- [ ] (Optional) Database seeded with test data

---

## Next Steps After Starting

1. **Login** with one of the test accounts
2. **Register a new employee** - Check MongoDB Compass to see it saved
3. **Create a team** - Verify it appears in the database
4. **Create a project** - Test full CRUD operations
5. **Create a story** - Verify all features work

---

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/api/docs/
- **API Docs (ReDoc)**: http://localhost:8000/api/redoc/

---

**You're all set! 🚀**

