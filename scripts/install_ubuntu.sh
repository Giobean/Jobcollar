#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/jobcollar}"
PHP_FPM_SOCKET="${PHP_FPM_SOCKET:-/run/php/php8.3-fpm.sock}"

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  nginx \
  php-fpm \
  php-sqlite3 \
  sqlite3 \
  python3 \
  unattended-upgrades

sudo dpkg-reconfigure -f noninteractive unattended-upgrades
sudo install -d -o "$USER" -g www-data "$APP_DIR"
sudo rsync -a --delete --exclude .git ./ "$APP_DIR"/
sudo chown -R "$USER":www-data "$APP_DIR"
sudo chmod -R g+rwX "$APP_DIR/storage"

sudo sed "s#unix:/run/php/php8.3-fpm.sock#unix:${PHP_FPM_SOCKET}#" deploy/nginx-jobcollar.conf \
  | sudo tee /etc/nginx/sites-available/jobcollar >/dev/null
sudo ln -sf /etc/nginx/sites-available/jobcollar /etc/nginx/sites-enabled/jobcollar
sudo cp deploy/jobcollar.cron /etc/cron.d/jobcollar
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart cron

cd "$APP_DIR"
python3 scripts/fetch_jobs.py

echo "JobCollar installed at ${APP_DIR}."
