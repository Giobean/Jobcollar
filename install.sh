#!/bin/bash
set -e

echo "========================================="
echo "  JobCollar Resume Platform - Installer"
echo "========================================="
echo ""

# Check PHP
if ! command -v php &> /dev/null; then
    echo "Installing PHP 8.3..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq php8.3 php8.3-fpm php8.3-sqlite3 php8.3-mbstring php8.3-xml php8.3-gd php8.3-zip php8.3-curl
fi

php_version=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
echo "✓ PHP $php_version"

# Check SQLite
if ! command -v sqlite3 &> /dev/null; then
    echo "Installing SQLite..."
    sudo apt-get install -y -qq sqlite3
fi
echo "✓ SQLite $(sqlite3 --version | cut -d' ' -f1)"

# Create directories
mkdir -p storage/database storage/uploads storage/rate_limit logs
chmod 755 storage storage/database storage/uploads storage/rate_limit logs

# Initialize database
echo ""
echo "Initializing database..."
php scripts/init_db.php

# Seed demo data
echo ""
read -p "Seed demo data? (y/n): " seed
if [ "$seed" = "y" ] || [ "$seed" = "Y" ]; then
    php scripts/seed.php
fi

echo ""
echo "========================================="
echo "  Installation complete!"
echo "========================================="
echo ""
echo "Quick start:"
echo "  php -S localhost:3000 -t public"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
echo "Demo login: demo@jobcollar.com / password123"
echo ""
echo "For production, configure Nginx (see deploy/nginx.conf)"
echo ""
