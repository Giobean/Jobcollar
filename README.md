# JobCollar

AI-powered resume builder platform. Build, score, and track your job applications.

## Features

- **Resume Builder** — Multi-step wizard with live preview, auto-save, and 3 templates (Minimal, Professional, Modern)
- **ATS Checker** — Analyzes resume for ATS compatibility with actionable suggestions
- **Resume Score** — Quality scoring based on completeness, achievements, keywords, and formatting
- **Job Tracker** — Kanban board to manage applications through every stage
- **PDF Export** — Export resumes as print-ready PDFs
- **Dark/Light Mode** — Premium UI with system preference detection
- **Command Palette** — Quick navigation with Ctrl+K

## Tech Stack

- PHP 8.3 (vanilla, no frameworks)
- SQLite (zero-config database)
- Vanilla JavaScript (ES2023)
- Vanilla CSS (custom properties, no preprocessors)
- No external dependencies

## Quick Start

```bash
# Clone and install
git clone https://github.com/Giobean/Jobcollar.git
cd Jobcollar
chmod +x install.sh
./install.sh

# Run development server
php -S localhost:3000 -t public

# Visit http://localhost:3000
# Demo: demo@jobcollar.com / password123
```

## Project Structure

```
public/            → Web root (front controller + static assets)
  assets/css/      → Stylesheets
  assets/js/       → JavaScript modules
  assets/img/      → Images
php/
  api/             → JSON API endpoints
  classes/         → Core classes (Database, Router, Auth, Validator)
  middleware/      → Auth & Guest middleware
  views/           → HTML view shells
storage/
  database/        → SQLite database + schema
  uploads/         → User file uploads
scripts/           → CLI scripts (init, seed, backup)
deploy/            → Nginx config, deployment files
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
| POST | /api/auth/logout | Sign out |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/resumes | List resumes |
| POST | /api/resumes | Create resume |
| GET | /api/resumes/:id | Get resume with all sections |
| PUT | /api/resumes/:id/personal | Update personal info |
| POST | /api/resumes/:id/experience | Add experience entry |
| POST | /api/ats/check | Run ATS analysis |
| POST | /api/score/check | Calculate resume score |
| GET | /api/applications | List job applications |
| POST | /api/applications | Create application |

## Production Deployment

1. Point your domain to the server
2. Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/`
3. Set `root` to your project's `public/` directory
4. Ensure `storage/` is writable by the web server
5. Configure Cloudflare Tunnel for HTTPS

## Security

- Argon2ID password hashing
- CSRF protection on all mutations
- Prepared statements (no SQL injection)
- XSS protection via output escaping
- Rate limiting on auth endpoints
- Secure session configuration
- Input sanitization

## License

MIT
