<?php

declare(strict_types=1);

$dbDir = dirname(__DIR__) . '/storage/database';
$dbPath = $dbDir . '/jobcollar.sqlite';
$schemaPath = $dbDir . '/schema.sql';

if (!is_dir($dbDir)) {
    mkdir($dbDir, 0755, true);
    echo "Created directory: {$dbDir}\n";
}

if (!file_exists($schemaPath)) {
    echo "ERROR: Schema file not found at {$schemaPath}\n";
    exit(1);
}

echo "Initializing database at: {$dbPath}\n";

try {
    $pdo = new PDO("sqlite:{$dbPath}", null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $sql = file_get_contents($schemaPath);
    $pdo->exec($sql);

    echo "Database initialized successfully.\n";
    echo "Tables created:\n";

    $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "  - {$table}\n";
    }

    $indexes = $pdo->query("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
    echo "\nIndexes created: " . count($indexes) . "\n";
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
