<?php

declare(strict_types=1);

function base_path(string $path = ''): string
{
    $base = dirname(__DIR__);
    return $path === '' ? $base : $base . DIRECTORY_SEPARATOR . ltrim($path, DIRECTORY_SEPARATOR);
}

function storage_path(string $path = ''): string
{
    $dir = getenv('JOBCOLLAR_STORAGE') ?: base_path('storage');
    return $path === '' ? $dir : $dir . DIRECTORY_SEPARATOR . ltrim($path, DIRECTORY_SEPARATOR);
}

function db_path(): string
{
    return getenv('JOBCOLLAR_DB') ?: storage_path('jobcollar.sqlite');
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    if (!is_dir(storage_path())) {
        mkdir(storage_path(), 0775, true);
    }

    $pdo = new PDO('sqlite:' . db_path());
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');
    migrate($pdo);

    return $pdo;
}

function migrate(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            source_name TEXT NOT NULL,
            external_id TEXT NOT NULL,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            category TEXT NOT NULL,
            trade TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            url TEXT NOT NULL,
            salary_min REAL,
            salary_max REAL,
            salary_text TEXT,
            posted_at TEXT,
            expires_at TEXT,
            ai_proof_score INTEGER NOT NULL DEFAULT 75,
            ai_proof_notes TEXT NOT NULL DEFAULT '',
            tags_json TEXT NOT NULL DEFAULT '[]',
            source_payload TEXT NOT NULL DEFAULT '{}',
            first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER NOT NULL DEFAULT 1,
            UNIQUE(source_id, external_id)
        )"
    );

    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_jobs_active_posted ON jobs(is_active, posted_at DESC, id DESC)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category, trade)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location)');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS sync_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            status TEXT NOT NULL,
            started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            finished_at TEXT,
            fetched_count INTEGER NOT NULL DEFAULT 0,
            upserted_count INTEGER NOT NULL DEFAULT 0,
            expired_count INTEGER NOT NULL DEFAULT 0,
            error TEXT
        )"
    );
}

function load_trades(): array
{
    $json = file_get_contents(base_path('data/trades.json'));
    return json_decode($json ?: '{}', true, 512, JSON_THROW_ON_ERROR);
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}
