# JobCollar

JobCollar is a lightweight MVP job aggregator for skilled trades, blue-collar
work, and AI-proof careers. The UI follows the dense, fast-scrolling job-board
philosophy of RemoteOK while using a blue-collar visual system and **no
RemoteOK job data**.

## Stack

- Nginx + PHP-FPM
- Vanilla PHP API/backend
- Vanilla CSS and JavaScript
- SQLite database
- Python worker scripts
- Cron scheduled aggregation

## Local development

```bash
python3 scripts/fetch_jobs.py
php -S 127.0.0.1:8080 -t public
```

Open <http://127.0.0.1:8080>.

The first command pulls real public listings from `data/sources.json`, filters
them against `data/trades.json`, stores them in `storage/jobcollar.sqlite`, and
marks stale jobs inactive when they disappear from a source response.

## Public sources

Configured MVP sources:

- NYC Citywide Jobs open-data API
- Arbeitnow public job board API

Add free public JSON sources in `data/sources.json` and implement a normalizer in
`scripts/fetch_jobs.py`. Keep source terms of service in mind; the MVP avoids
scraping RemoteOK and does not use RemoteOK listings.

## Deployment on a low-cost Ubuntu VPS

```bash
sudo bash scripts/install_ubuntu.sh
```

The installer adds Nginx, PHP SQLite support, Python, unattended upgrades, the
sample Nginx vhost, and a Cron job that runs every 15 minutes:

```cron
*/15 * * * * www-data cd /var/www/jobcollar && /usr/bin/python3 scripts/fetch_jobs.py >> /var/log/jobcollar-sync.log 2>&1
```

For Cloudflare Tunnel/SSL, point the tunnel at local port 80 after Nginx is
serving the site.

## Files

- `public/index.php` - job board page
- `public/api/jobs.php` - JSON API for infinite scroll and filters
- `public/assets/app.css` - vanilla CSS
- `public/assets/app.js` - vanilla JavaScript filters and infinite scroll
- `src/` - PHP bootstrap and repository
- `scripts/fetch_jobs.py` - public-source sync worker
- `data/trades.json` - skilled-trade taxonomy
- `data/sources.json` - enabled public job sources
- `deploy/` - Nginx and Cron examples
