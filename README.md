# JobCollar Resume Platform

A production-quality PHP 8.3 resume builder platform with SQLite storage. No frameworks — vanilla PHP with clean architecture.

## Features

- User registration & authentication (Argon2ID)
- Full resume CRUD with 12+ section types
- Resume duplication
- Section reordering
- Dashboard with statistics
- User settings (profile, password, preferences)
- CSRF protection on all mutations
- File-based rate limiting (5 req/min per IP)
- Prepared statements everywhere (SQL injection safe)
- Remember-me cookie authentication
- Audit logging

## Quick Start

```bash
# Install & initialize
chmod +x install.sh
./install.sh

# Start development server
php -S localhost:8000 -t public public/index.php
```

Open http://localhost:8000

### Demo Account

After seeding:
- **Email:** demo@jobcollar.com
- **Password:** password

## Project Structure

```
├── public/
│   ├── index.php           # Front controller
│   └── assets/             # CSS, JS, images
├── src/
│   ├── classes/            # Core classes (Database, Router, Auth, Validator)
│   ├── middleware/         # Auth & Guest middleware
│   ├── api/                # API route handlers
│   └── views/             # PHP view templates
├── storage/
│   ├── database/           # SQLite DB & schema
│   ├── uploads/            # User uploads
│   └── sessions/           # PHP sessions & rate limit data
├── scripts/                # DB init & seed scripts
├── deploy/                 # Nginx production config
└── install.sh              # Installation script
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `POST /api/auth/logout` — Sign out
- `POST /api/auth/forgot-password` — Request password reset

### Resumes
- `GET /api/resumes` — List all resumes
- `POST /api/resumes` — Create resume
- `GET /api/resumes/{id}` — Get resume with all sections
- `PUT /api/resumes/{id}` — Update metadata
- `DELETE /api/resumes/{id}` — Delete resume
- `POST /api/resumes/{id}/duplicate` — Duplicate resume
- `PUT /api/resumes/{id}/personal` — Update personal info
- `PUT /api/resumes/{id}/summary` — Update summary
- `POST /api/resumes/{id}/reorder` — Reorder sections
- `POST /api/resumes/{id}/{section}` — Add entry
- `PUT /api/resumes/{id}/{section}/{entryId}` — Update entry
- `DELETE /api/resumes/{id}/{section}/{entryId}` — Delete entry

Sections: experience, education, skills, projects, certifications, awards, languages, volunteer, references, custom

### Dashboard
- `GET /api/dashboard` — Stats & recent resumes

### Settings
- `GET /api/settings` — Get all settings
- `PUT /api/settings/profile` — Update profile
- `PUT /api/settings/password` — Change password
- `PUT /api/settings/preferences` — Update preferences
- `DELETE /api/settings/account` — Delete account

## Response Format

```json
// Success
{"data": {...}, "status": 200}

// Error
{"error": "message", "status": 4xx}
```

## Requirements

- PHP 8.3+ with pdo_sqlite, mbstring, session extensions
- SQLite 3

## Production Deployment

See `deploy/nginx.conf` for a production-ready nginx configuration with:
- HTTPS/TLS 1.2+
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Gzip compression
- Static file caching (1 year)
- PHP-FPM integration
