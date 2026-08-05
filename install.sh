#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  JobCollar Resume Platform - Installation"
echo "============================================"
echo ""

# Check PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
    echo "[OK] PHP $PHP_VERSION found"
else
    echo "[..] PHP not found. Attempting to install..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -qq
        sudo apt-get install -y -qq php8.3-cli php8.3-sqlite3 php8.3-mbstring php8.3-xml php8.3-curl
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y php php-pdo php-sqlite3 php-mbstring php-xml
    elif command -v brew &> /dev/null; then
        brew install php
    else
        echo "[ERROR] Could not install PHP. Please install PHP 8.3+ manually."
        exit 1
    fi
    echo "[OK] PHP installed"
fi

# Check required PHP extensions
echo ""
echo "Checking PHP extensions..."
REQUIRED_EXTS=("pdo_sqlite" "mbstring" "session")
for ext in "${REQUIRED_EXTS[@]}"; do
    if php -m 2>/dev/null | grep -qi "$ext"; then
        echo "  [OK] $ext"
    else
        echo "  [WARN] $ext not found - may need to install php-$ext"
    fi
done

# Create required directories
echo ""
echo "Creating directories..."
mkdir -p storage/database
mkdir -p storage/uploads
mkdir -p storage/sessions
mkdir -p public/assets/css
mkdir -p public/assets/js

# Set permissions
chmod 755 storage/database
chmod 755 storage/uploads
chmod 755 storage/sessions

# Create .gitkeep files
touch storage/uploads/.gitkeep
touch storage/sessions/.gitkeep

echo "  [OK] Directories created"

# Initialize database
echo ""
echo "Initializing database..."
php scripts/init_db.php

# Optional seeding
echo ""
read -p "Seed demo data? (y/N): " -n 1 -r SEED_RESPONSE
echo ""
if [[ $SEED_RESPONSE =~ ^[Yy]$ ]]; then
    php scripts/seed.php
fi

# Create placeholder CSS/JS if not present
if [ ! -f public/assets/css/main.css ]; then
    echo "/* JobCollar - Styles loaded */" > public/assets/css/main.css
    echo "  [OK] Created placeholder CSS"
fi

if [ ! -f public/assets/js/app.js ]; then
    echo "// JobCollar - App JS loaded" > public/assets/js/app.js
    echo "  [OK] Created placeholder JS"
fi

if [ ! -f public/assets/js/landing.js ]; then
    echo "// JobCollar - Landing JS loaded" > public/assets/js/landing.js
fi

if [ ! -f public/assets/js/builder.js ]; then
    echo "// JobCollar - Builder JS loaded" > public/assets/js/builder.js
fi

echo ""
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""
echo "Quick Start:"
echo ""
echo "  Start the development server:"
echo "    php -S localhost:8000 -t public public/index.php"
echo ""
echo "  Then open: http://localhost:8000"
echo ""
if [[ ${SEED_RESPONSE:-N} =~ ^[Yy]$ ]]; then
    echo "  Demo account:"
    echo "    Email:    demo@jobcollar.com"
    echo "    Password: password"
    echo ""
fi
echo "  Production deployment:"
echo "    See deploy/nginx.conf for nginx configuration."
echo ""
