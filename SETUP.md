# Local Development Setup Guide

This guide will help you run both the frontend and backend locally.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Python 3.11+** (tested with 3.13) - [Download](https://www.python.org/downloads/)
3. **MongoDB** (optional - backend will use mongomock if MongoDB is not available)

## Quick Start

### Step 1: Setup Backend

Open a terminal and run:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
py -3 -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Run database migrations (for Django's internal SQLite)
python manage.py migrate

# Start the backend server
python manage.py runserver 0.0.0.0:8000
```

The backend will be running at: **http://localhost:8000**

**Optional: Seed the database**
After starting the backend, you can seed it with initial data:
```powershell
# In a new terminal, make a POST request to seed endpoint
# Using PowerShell:
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/seed/" -Method POST
```

### Step 2: Setup Frontend

Open a **new terminal** (keep backend running) and run:

```powershell
# Navigate to project root
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app

# Install dependencies (if not already installed)
npm install

# Start the frontend development server
npm run dev
```

The frontend will be running at: **http://localhost:3000**

## Running Both Services

You need **two terminal windows**:

### Terminal 1 - Backend:
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

### Terminal 2 - Frontend:
```powershell
cd C:\Users\Manu\Downloads\weintegrity-project-management-web-app
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/api/docs/
- **API Documentation (ReDoc)**: http://localhost:8000/api/redoc/

## MongoDB Setup (Optional)

If you want to use a real MongoDB instance instead of mongomock:

1. **Install MongoDB**: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. **Start MongoDB service**:
   ```powershell
   # MongoDB usually runs as a Windows service
   # Or start manually:
   mongod --dbpath "C:\data\db"
   ```
3. **Set environment variable** (optional):
   ```powershell
   $env:MONGO_URI="mongodb://localhost:27017"
   ```

The backend will automatically use mongomock (in-memory database) if MongoDB is not available, so this step is optional for development.

## Troubleshooting

### Backend Issues

1. **Port 8000 already in use**:
   ```powershell
   # Use a different port
   python manage.py runserver 0.0.0.0:8001
   ```

2. **Virtual environment not activating**:
   ```powershell
   # Try this instead:
   .\.venv\Scripts\activate
   ```

3. **Python not found**:
   - Make sure Python is installed and added to PATH
   - Try using `python3` instead of `python`

### Frontend Issues

1. **Port 3000 already in use**:
   - Vite will automatically try the next available port
   - Or change it in `vite.config.ts`

2. **Dependencies not installing**:
   ```powershell
   # Clear cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

## Environment Variables

### Backend
Create a `.env` file in the `backend` directory (optional for local dev):
```
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=true
MONGO_URI=mongodb://localhost:27017
MONGO_DBNAME=weintegration_db
```

### Frontend
Create a `.env.local` file in the root directory (if needed):
```
GEMINI_API_KEY=your-api-key-here
```

## Testing the Setup

1. **Backend**: Visit http://localhost:8000/api/docs/ - you should see the Swagger UI
2. **Frontend**: Visit http://localhost:3000 - you should see the login page
3. **API Test**: Try logging in through the frontend or use the API directly

## Default Test Users

Based on `data/seedData.ts`, you can use these test accounts after seeding:

- **Admin**: `admin@example.com` / `admin123`
- **HR**: `hr@example.com` / `hr123`
- **Team Lead**: `lead@example.com` / `lead123`
- **Employee**: `emma@example.com` / `emp123`
- **Product Owner**: `po@projecthub.com` / `po123`

