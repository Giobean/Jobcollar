<?php

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

require_once BASE_PATH . '/php/classes/Database.php';

$schemaFile = BASE_PATH . '/storage/database/schema.sql';

if (!file_exists($schemaFile)) {
    fwrite(STDERR, "Error: schema.sql not found at $schemaFile\n");
    exit(1);
}

echo "Initializing database...\n";

$db = Database::getInstance();
$schema = file_get_contents($schemaFile);
$db->getPdo()->exec($schema);

echo "Database initialized successfully.\n";
echo "Database path: " . BASE_PATH . "/storage/database/jobcollar.sqlite\n";
