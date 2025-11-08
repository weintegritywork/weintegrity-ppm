# Commands to Start Backend and Frontend

## Quick Start Guide

You need **TWO terminal windows** - one for backend, one for frontend.

---

## Terminal 1: Backend Server

Open PowerShell and run these commands:

```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start the Django server
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

**Backend will be running at:** http://localhost:8000

---

## Terminal 2: Frontend Server

Open a **NEW PowerShell window** and run:

```powershell
# Navigate to project root
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app

# Start the frontend development server
npm run dev
```

**Expected Output:**
```
  VITE v6.2.0  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Frontend will be running at:** http://localhost:3000

---

## First Time Setup (If Not Done Already)

### Backend Setup (One Time):
```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
```

### Frontend Setup (One Time):
```powershell
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app
npm install
```

---

## Optional: Seed Database

After backend is running, in a **third terminal** or use a tool like Postman:

```powershell
# Seed the database with initial data
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/seed/" -Method POST
```

Or use curl if available:
```powershell
curl -X POST http://localhost:8000/api/dev/seed/
```

---

## Access Points

Once both servers are running:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/api/docs/
- **API Documentation (ReDoc)**: http://localhost:8000/api/redoc/

---

## Stopping the Servers

- **Backend**: Press `CTRL + BREAK` in Terminal 1
- **Frontend**: Press `CTRL + C` in Terminal 2

---

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```powershell
# Use a different port
python manage.py runserver 0.0.0.0:8001
```

**Virtual environment not activating:**
```powershell
# Try this instead
.\.venv\Scripts\activate
```

**Python not found:**
- Make sure Python is installed and in PATH
- Try `python3` instead of `python`

### Frontend Issues

**Port 3000 already in use:**
- Vite will automatically try the next available port
- Or change it in `vite.config.ts`

**Dependencies not installed:**
```powershell
npm install
```

**Module not found errors:**
```powershell
# Clear cache and reinstall
npm cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## Complete Startup Sequence

**Terminal 1 (Backend):**
```powershell
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app\backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 (Frontend):**
```powershell
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app
npm run dev
```

**That's it!** Both servers should now be running. 🚀

