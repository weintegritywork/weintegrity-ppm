# WEIntegrity Project Management System

A comprehensive project management web application built with React, TypeScript, Django, and MongoDB.

## 🌟 Features

### User Roles & Permissions
- **Admin** - Full system access
- **HR** - Employee and team management
- **Product Owner** - Project creation and management
- **Team Lead** - Team and story management
- **Employee** - Story execution and updates

### Core Functionality
- ✅ Project Management (CRUD operations)
- ✅ Team Management with member assignment
- ✅ Story/Task tracking with Kanban-style states
- ✅ Real-time chat on stories and projects
- ✅ File attachments on stories
- ✅ Notifications system
- ✅ Role-based access control
- ✅ User profile management
- ✅ Dashboard with analytics
- ✅ Sprint and Epic management

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- React Router
- Tailwind CSS
- Vite
- Recharts (for analytics)

### Backend
- Django 5.2
- Django REST Framework
- MongoDB (with mongomock fallback)
- JWT Authentication

## 📦 Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (or use in-memory mongomock)

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Seed Database (Development Only)
```bash
# With backend running, visit:
http://localhost:8000/api/dev/seed/
```

## 🔑 Test Credentials

After seeding the database in development, default test accounts will be created.
Check the seed endpoint response or backend logs for credentials.

⚠️ **IMPORTANT:** 
- These are for development/testing ONLY
- Never use default credentials in production
- Change all passwords immediately after deployment
- Use strong, unique passwords for production accounts

## 🚀 Deployment

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed deployment instructions.

### Quick Deploy

**Frontend:**
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
gunicorn api.wsgi:application
```

## 📁 Project Structure

```
├── components/          # Reusable React components
├── context/            # React Context providers
├── pages/              # Page components
├── utils/              # Utility functions
├── data/               # Seed data
├── backend/
│   ├── api/           # Django project settings
│   ├── core/          # Main Django app
│   └── requirements.txt
├── types.ts           # TypeScript type definitions
└── vite.config.ts     # Vite configuration
```

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with Django's PBKDF2
- CSRF protection
- Secure HTTP headers
- Input validation

## 🧪 Testing

```bash
# Frontend
npm run test

# Backend
cd backend
python manage.py test
```

## 📝 Environment Variables

### Frontend
Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Backend
Copy `backend/.env.example` to `backend/.env` and configure:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

See the `.env.example` files for all available configuration options.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by WEIntegrity.

## 🐛 Bug Reports

For bug reports and feature requests, please contact the development team.

## 📞 Support

For support and questions:
- Email: support@weintegrity.com
- Documentation: [Link to docs]

---

**Version:** 1.0.0  
**Last Updated:** November 12, 2025  
**Status:** Production Ready ✅
