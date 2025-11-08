# Verify MongoDB Connection

## Quick Check

When you start the backend server, look for this message in the terminal:

### ✅ MongoDB Connected (Data WILL persist)
```
Connected to MongoDB at mongodb://localhost:27017 (real instance)
```

### ❌ MongoDB Not Connected (Data WON'T persist)
```
MongoDB connection to mongodb://localhost:27017 failed (...); falling back to mongomock in-memory store
```

## How to Ensure MongoDB is Running

### Option 1: Check if MongoDB Service is Running
```powershell
# Check MongoDB service status
Get-Service MongoDB
```

### Option 2: Start MongoDB Manually
```powershell
# Navigate to MongoDB bin directory (adjust path as needed)
cd "C:\Program Files\MongoDB\Server\<version>\bin"
.\mongod.exe --dbpath "C:\data\db"
```

### Option 3: Install MongoDB (if not installed)
1. Download from: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Start MongoDB service

## Force Real MongoDB (Disable Mock Fallback)

If you want the backend to fail if MongoDB is not available (instead of using mock):

```powershell
# In backend terminal, set environment variable
$env:USE_MONGOMOCK="false"
python manage.py runserver 0.0.0.0:8000
```

## Test Connection

After starting backend, test if data persists:

1. **Register a new employee** in the frontend
2. **Open MongoDB Compass**
3. **Connect to**: `mongodb://localhost:27017`
4. **Navigate to**: `weintegration_db` → `users` collection
5. **You should see** the newly registered employee

If you see the data in Compass, MongoDB is working correctly! ✅

