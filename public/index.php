<?php

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

// Autoload classes
spl_autoload_register(function (string $class): void {
    $paths = [
        BASE_PATH . '/php/classes/' . $class . '.php',
        BASE_PATH . '/php/middleware/' . $class . '.php',
    ];
    foreach ($paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            return;
        }
    }
});

// Session configuration
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.gc_maxlifetime', '86400');
ini_set('session.cookie_lifetime', '86400');
ini_set('session.use_strict_mode', '1');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Rate limiting for auth endpoints
function checkRateLimit(string $action): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $key = md5($ip . ':' . $action);
    $dir = BASE_PATH . '/storage/rate_limit';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $file = $dir . '/' . $key . '.json';

    $window = 60;
    $maxAttempts = 5;
    $now = time();

    $attempts = [];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?: [];
        $attempts = array_filter($data, fn(int $ts) => $ts > ($now - $window));
    }

    if (count($attempts) >= $maxAttempts) {
        return false;
    }

    $attempts[] = $now;
    file_put_contents($file, json_encode(array_values($attempts)), LOCK_EX);
    return true;
}

function jsonResponse(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonError(string $message, int $status = 400): never
{
    jsonResponse(['error' => $message, 'status' => $status], $status);
}

function jsonSuccess(mixed $data, int $status = 200): never
{
    jsonResponse(['data' => $data, 'status' => $status], $status);
}

function getJsonInput(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function sanitize(mixed $value): mixed
{
    if (is_string($value)) {
        return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
    }
    if (is_array($value)) {
        return array_map('sanitize', $value);
    }
    return $value;
}

function requireCsrf(): void
{
    if (!Auth::validateCsrf()) {
        jsonError('Invalid CSRF token', 403);
    }
}

function requireAuth(): void
{
    if (!Auth::check()) {
        jsonError('Unauthorized', 401);
    }
}

function renderView(string $view): void
{
    $csrfToken = Auth::generateCsrfToken();
    $user = Auth::user();
    require BASE_PATH . '/php/views/' . $view . '.php';
}

// Router setup
$router = new Router();

// Page routes – guest pages
$router->group(['middleware' => [GuestMiddleware::class]], function (Router $r) {
    $r->get('/login', fn() => renderView('login'));
    $r->get('/register', fn() => renderView('register'));
    $r->get('/forgot-password', fn() => renderView('forgot-password'));
});

// Page routes – authenticated pages
$router->group(['middleware' => [AuthMiddleware::class]], function (Router $r) {
    $r->get('/dashboard', fn() => renderView('dashboard'));
    $r->get('/resumes', fn() => renderView('resume-builder'));
    $r->get('/resumes/{id}', fn() => renderView('resume-builder'));
    $r->get('/applications', fn() => renderView('applications'));
    $r->get('/settings', fn() => renderView('settings'));
});

// Redirect root
$router->get('/', function () {
    if (Auth::check()) {
        header('Location: /dashboard');
    } else {
        header('Location: /login');
    }
    exit;
});

// API routes – auth (no auth middleware, CSRF checked inside handler)
$router->group(['prefix' => 'api/auth'], function (Router $r) {
    $r->post('/register', [BASE_PATH . '/php/api/auth.php', 'handleRegister']);
    $r->post('/login', [BASE_PATH . '/php/api/auth.php', 'handleLogin']);
    $r->post('/logout', [BASE_PATH . '/php/api/auth.php', 'handleLogout']);
    $r->post('/forgot-password', [BASE_PATH . '/php/api/auth.php', 'handleForgotPassword']);
});

// API routes – authenticated
$router->group(['prefix' => 'api', 'middleware' => [AuthMiddleware::class]], function (Router $r) {
    // Dashboard
    $r->get('/dashboard', [BASE_PATH . '/php/api/dashboard.php', 'handleDashboard']);

    // Resumes
    $r->get('/resumes', [BASE_PATH . '/php/api/resumes.php', 'handleListResumes']);
    $r->post('/resumes', [BASE_PATH . '/php/api/resumes.php', 'handleCreateResume']);
    $r->get('/resumes/{id}', [BASE_PATH . '/php/api/resumes.php', 'handleGetResume']);
    $r->put('/resumes/{id}', [BASE_PATH . '/php/api/resumes.php', 'handleUpdateResume']);
    $r->delete('/resumes/{id}', [BASE_PATH . '/php/api/resumes.php', 'handleDeleteResume']);

    $r->put('/resumes/{id}/personal', [BASE_PATH . '/php/api/resumes.php', 'handleUpdatePersonal']);
    $r->put('/resumes/{id}/summary', [BASE_PATH . '/php/api/resumes.php', 'handleUpdateSummary']);

    // Resume sections with entries
    foreach (['experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'languages', 'volunteer', 'references', 'custom'] as $section) {
        $r->post("/resumes/{id}/$section", [BASE_PATH . '/php/api/resumes.php', "handleAddEntry"]);
        $r->put("/resumes/{id}/$section/{entryId}", [BASE_PATH . '/php/api/resumes.php', "handleUpdateEntry"]);
        $r->delete("/resumes/{id}/$section/{entryId}", [BASE_PATH . '/php/api/resumes.php', "handleDeleteEntry"]);
    }

    $r->post('/resumes/{id}/reorder', [BASE_PATH . '/php/api/resumes.php', 'handleReorder']);
    $r->post('/resumes/{id}/duplicate', [BASE_PATH . '/php/api/resumes.php', 'handleDuplicate']);

    // Applications
    $r->get('/applications', [BASE_PATH . '/php/api/applications.php', 'handleListApplications']);
    $r->post('/applications', [BASE_PATH . '/php/api/applications.php', 'handleCreateApplication']);
    $r->put('/applications/{id}', [BASE_PATH . '/php/api/applications.php', 'handleUpdateApplication']);
    $r->delete('/applications/{id}', [BASE_PATH . '/php/api/applications.php', 'handleDeleteApplication']);
    $r->put('/applications/{id}/archive', [BASE_PATH . '/php/api/applications.php', 'handleArchiveApplication']);

    // ATS & Score
    $r->post('/ats/check', [BASE_PATH . '/php/api/ats.php', 'handleAtsCheck']);
    $r->post('/score/check', [BASE_PATH . '/php/api/score.php', 'handleScoreCheck']);

    // Settings
    $r->get('/settings', [BASE_PATH . '/php/api/settings.php', 'handleGetSettings']);
    $r->put('/settings/profile', [BASE_PATH . '/php/api/settings.php', 'handleUpdateProfile']);
    $r->put('/settings/password', [BASE_PATH . '/php/api/settings.php', 'handleUpdatePassword']);
    $r->put('/settings/preferences', [BASE_PATH . '/php/api/settings.php', 'handleUpdatePreferences']);
    $r->delete('/settings/account', [BASE_PATH . '/php/api/settings.php', 'handleDeleteAccount']);
});

// Dispatch
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$router->dispatch($method, $uri);
