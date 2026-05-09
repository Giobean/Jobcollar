<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/src/bootstrap.php';
require_once dirname(__DIR__, 2) . '/src/JobRepository.php';

$repo = new JobRepository(db());

try {
    json_response([
        'ok' => true,
        'filters' => [
            'q' => $_GET['q'] ?? '',
            'category' => $_GET['category'] ?? '',
            'trade' => $_GET['trade'] ?? '',
            'location' => $_GET['location'] ?? '',
            'min_ai_score' => $_GET['min_ai_score'] ?? '',
        ],
        'stats' => $repo->stats(),
        'facets' => $repo->facets(),
        'results' => $repo->search($_GET),
    ]);
} catch (Throwable $exception) {
    json_response([
        'ok' => false,
        'error' => 'Unable to load jobs right now.',
    ], 500);
}
