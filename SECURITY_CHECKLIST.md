# Security Checklist ✅

## ✅ Already Secure (Good Job!)

### Files Protected
- ✅ `.env` files are in `.gitignore`
- ✅ `venv/` and `node_modules/` are ignored
- ✅ `db.sqlite3` is ignored
- ✅ No hardcoded secrets in code
- ✅ All credentials use environment variables

### Code Security
- ✅ `SECRET_KEY` uses `os.getenv()`
- ✅ `MONGO_URI` uses environment variables
- ✅ `DEBUG` is configurable via env
- ✅ `ALLOWED_HOSTS` is configurable
- ✅ CORS properly configured
- ✅ Passwords are hashed (PBKDF2)

## 🔒 What's Safe to Commit

### ✅ Safe Files (Already in Git)
- `backend/.env.example` - Template with no real values
- `backend/api/settings.py` - Uses environment variables
- `README.md` - Public documentation
- `SECURITY.md` - Security guidelines
- All source code files (`.py`, `.tsx`, `.ts`)

## ⚠️ Never Commit These

### ❌ Dangerous Files
- `.env` - Contains real secrets
- `backend/.env` - Backend secrets
- `.env.local` - Local environment variables
- `db.sqlite3` - Database with user data
- Any file with:
  - Real API keys
  - Real passwords
  - Real MongoDB URIs
  - Real JWT secrets
  - Real email credentials

## 🛡️ Production Security Checklist

### Render Environment Variables (Set in Dashboard)

**Backend:**
```
DJANGO_SECRET_KEY=<generate-strong-random-key>
DEBUG=False
ALLOWED_HOSTS=weintegrity-backend-2025.onrender.com,ppm.weintegrity.com
CORS_ALLOWED_ORIGINS=https://ppm.weintegrity.com
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
MONGO_DBNAME=weintegrity_ppm
USE_MONGOMOCK=False
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

**Frontend:**
```
VITE_API_URL=https://weintegrity-backend-2025.onrender.com/api
```

### MongoDB Atlas
- ✅ Use strong password
- ✅ Whitelist only Render IPs
- ✅ Enable authentication
- ✅ Use SSL/TLS connection

### Gmail
- ✅ Use App Password (not real password)
- ✅ Enable 2FA on Gmail account
- ✅ Limit app password scope

## 🔍 How to Check for Leaked Secrets

### Check Git History
```bash
# Search for potential secrets in git history
git log --all --full-history --source -- **/.env
git log --all --full-history --source -- **/db.sqlite3
```

### Scan for Hardcoded Secrets
```bash
# Search for potential hardcoded secrets
git grep -i "password.*=.*['\"]"
git grep -i "api_key.*=.*['\"]"
git grep -i "secret.*=.*['\"]"
```

## 🚨 If You Accidentally Committed Secrets

### Immediate Actions:
1. **Rotate all exposed credentials immediately**
   - Change MongoDB password
   - Generate new Django SECRET_KEY
   - Regenerate Gmail app password
   - Update all in Render dashboard

2. **Remove from Git history** (if needed)
   ```bash
   # Remove file from all commits
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/secret/file" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (WARNING: Rewrites history)
   git push origin --force --all
   ```

3. **Use BFG Repo-Cleaner** (easier method)
   ```bash
   # Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
   java -jar bfg.jar --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push origin --force --all
   ```

## 📋 Regular Security Maintenance

### Monthly Tasks
- [ ] Review environment variables
- [ ] Check for dependency vulnerabilities: `npm audit`
- [ ] Update dependencies: `npm update`
- [ ] Review access logs in Render
- [ ] Check MongoDB access logs

### Quarterly Tasks
- [ ] Rotate MongoDB password
- [ ] Rotate Django SECRET_KEY
- [ ] Review user permissions
- [ ] Audit admin accounts

## 🔐 Additional Security Recommendations

### Enable in Render
- ✅ Auto-deploy from main branch
- ✅ Enable HTTPS (automatic)
- ✅ Set up health checks
- ✅ Enable log retention

### GitHub Repository Settings
- ✅ Enable branch protection for `main`
- ✅ Require pull request reviews
- ✅ Enable Dependabot alerts
- ✅ Enable secret scanning (if available)

### Code Security
- ✅ Never log sensitive data
- ✅ Use HTTPS for all API calls
- ✅ Validate all user inputs
- ✅ Sanitize data before database queries
- ✅ Use parameterized queries (already doing this)

## ✅ Current Status: SECURE

Your repository is currently secure! All sensitive data is properly protected using environment variables and `.gitignore`.

**Last Reviewed:** November 18, 2025
