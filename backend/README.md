# WeIntegrity Project Management - Backend

## Stack
- Django 3.2 (for internal admin/session only)
- Django REST Framework
- PyMongo for MongoDB access (domain data)
- CORS Headers
- drf-spectacular (OpenAPI schema)

## Requirements
- Python 3.11+ (tested with 3.13)
- MongoDB running locally at `mongodb://localhost:27017`

## Setup

```bash
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\pip install -r requirements.txt  # see below if not present
.\.venv\Scripts\python manage.py runserver 0.0.0.0:8000
```

If `requirements.txt` is not present, install manually:
```bash
.\.venv\Scripts\pip install django==3.2.25 djangorestframework==3.14.0 djangorestframework-simplejwt==5.2.2 django-cors-headers==3.14.0 drf-spectacular==0.26.5 pymongo==4.15.3 PyJWT==2.10.1 pytz
```

## Configuration
- MongoDB database name: `weintegration_db` (see `core/mongo.py`)
- Local development automatically falls back to in-memory `mongomock` if it cannot reach `MONGO_URI`. To disable the fallback, set `USE_MONGOMOCK=false`.
- CORS: allowed for all origins in development; whitelist in prod via `CORS_ALLOWED_ORIGINS` env (see `api/settings.py`)
- DRF authentication: custom JWT in `core/auth.py`

## Seeding Data
Loads the frontend `data/seedData.ts` into MongoDB.

```bash
# DEV endpoint (unsafe for prod)
POST http://localhost:8000/api/dev/seed/
```
This parses `../data/seedData.ts`, converts it to JSON, and populates collections:
`users, teams, projects, stories, epics, sprints, notifications, story_chats, project_chats`.

## Authentication
- Register: `POST /api/auth/register/`
  - body: user object with required fields (matches frontend `types.ts`); password is hashed at registration.
- Login: `POST /api/auth/login/` (email, password)
  - returns `{ access, user }` where `access` is a Bearer token (HS256)
- Refresh: `POST /api/auth/refresh/` (Authorization header with Bearer token)

Include header on protected requests:
```
Authorization: Bearer <access-token>
```

## CRUD Endpoints (Mongo-backed)
- Users: `GET/POST /api/users/`, `GET/PUT/DELETE /api/users/{id}/`
- Teams: `GET/POST /api/teams/`, `GET/PUT/DELETE /api/teams/{id}/`
- Projects: `GET/POST /api/projects/`, `GET/PUT/DELETE /api/projects/{id}/`
- Stories: `GET/POST /api/stories/`, `GET/PUT/DELETE /api/stories/{id}/`
- Epics: `GET/POST /api/epics/`, `GET/PUT/DELETE /api/epics/{id}/`
- Sprints: `GET/POST /api/sprints/`, `GET/PUT/DELETE /api/sprints/{id}/`
- Notifications: `GET/POST /api/notifications/`, `GET/PUT/DELETE /api/notifications/{id}/`

## API Documentation
- OpenAPI schema: `GET /api/schema/`
- Swagger UI: `GET /api/docs/`
- Redoc: `GET /api/redoc/`

## Notes
- This backend stores domain data in MongoDB using PyMongo. Django’s DB (SQLite) is only used internally by Django.
- For production, set env vars: `DJANGO_SECRET_KEY`, `DEBUG=false`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `MONGO_URI`, `MONGO_DBNAME`.
- Disable `POST /api/dev/seed/` in production; it is meant only for local/dev.

## Docker (production)

Build and run:
```bash
cd backend
docker build -t weintegrity-backend:latest .
docker run -d --name backend -p 8000:8000 \
  -e DJANGO_SECRET_KEY=change-me \
  -e DEBUG=false \
  -e ALLOWED_HOSTS=your-domain.com \
  -e CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com \
  -e MONGO_URI=mongodb://mongo:27017 \
  -e MONGO_DBNAME=weintegration_db \
  weintegrity-backend:latest
```

Nginx sample reverse proxy in `deploy/nginx.conf`.

