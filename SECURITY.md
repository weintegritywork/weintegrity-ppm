# Security Guidelines

## Environment Variables

**NEVER commit these files to version control:**
- `.env`
- `.env.local`
- `.env.production`
- `backend/.env`
- Any file containing actual credentials

**Always use the `.example` templates:**
- `.env.example`
- `.env.production.example`
- `backend/.env.example`

## Sensitive Data Checklist

Before committing, ensure you haven't included:
- ❌ API keys or tokens
- ❌ Database credentials
- ❌ Secret keys
- ❌ Production URLs with sensitive info
- ❌ Default passwords
- ❌ Database files (db.sqlite3)
- ❌ Private keys or certificates

## Production Deployment

1. **Change all default credentials** - Never use development passwords
2. **Generate strong SECRET_KEY** - Use Django's `get_random_secret_key()`
3. **Set DEBUG=false** - Never run production with DEBUG=true
4. **Configure ALLOWED_HOSTS** - Restrict to your domain only
5. **Use environment variables** - Never hardcode credentials
6. **Enable HTTPS** - Always use secure connections
7. **Rotate secrets regularly** - Update keys and passwords periodically

## Reporting Security Issues

If you discover a security vulnerability, please email: security@weintegrity.com

**Do not** create public GitHub issues for security vulnerabilities.
