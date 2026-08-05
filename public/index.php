<?php

declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

// --- Static file serving ---
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($requestUri, '/assets/')) {
    $filePath = BASE_PATH . '/public' . $requestUri;
    if (is_file($filePath)) {
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimeTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject',
            'json' => 'application/json',
            'webp' => 'image/webp',
        ];
        $mime = $mimeTypes[$ext] ?? 'application/octet-stream';
        header("Content-Type: {$mime}");
        header('Cache-Control: public, max-age=31536000');
        readfile($filePath);
        exit;
    }
}

// --- Autoloader ---
spl_autoload_register(function (string $class): void {
    $paths = [
        BASE_PATH . '/src/classes/' . $class . '.php',
        BASE_PATH . '/src/middleware/' . $class . '.php',
    ];
    foreach ($paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            return;
        }
    }
});

// --- Session configuration ---
$sessionDir = BASE_PATH . '/storage/sessions';
if (!is_dir($sessionDir)) {
    mkdir($sessionDir, 0755, true);
}

ini_set('session.save_path', $sessionDir);
ini_set('session.gc_maxlifetime', '86400');
ini_set('session.cookie_lifetime', '86400');

session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Strict',
    'secure' => isset($_SERVER['HTTPS']),
]);

session_start();

// --- Rate limiting (file-based, 5 requests/min per IP for mutating methods) ---
function checkRateLimit(): bool
{
    $method = $_SERVER['REQUEST_METHOD'];
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'])) {
        return true;
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $rateLimitDir = BASE_PATH . '/storage/sessions/ratelimit';
    if (!is_dir($rateLimitDir)) {
        mkdir($rateLimitDir, 0755, true);
    }

    $file = $rateLimitDir . '/' . md5($ip) . '.json';
    $now = time();
    $window = 60;
    $maxRequests = 5;

    $data = [];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?: [];
    }

    $data = array_filter($data, fn($t) => $t > ($now - $window));

    if (count($data) >= $maxRequests) {
        return false;
    }

    $data[] = $now;
    file_put_contents($file, json_encode($data), LOCK_EX);
    return true;
}

// --- JSON helpers ---
function jsonResponse(mixed $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['data' => $data, 'status' => $status], JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $message, int $status = 400): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message, 'status' => $status], JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonInput(): array
{
    $input = file_get_contents('php://input');
    if (empty($input)) {
        return $_POST;
    }
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

// --- CSRF enforcement ---
$method = $_SERVER['REQUEST_METHOD'];
$uri = $requestUri;

if (in_array($method, ['POST', 'PUT', 'DELETE']) && !str_starts_with($uri, '/api/')) {
    $token = $_POST['_csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    if (!Auth::validateCsrf($token)) {
        http_response_code(403);
        echo 'CSRF token validation failed.';
        exit;
    }
}

// API CSRF: check X-CSRF-TOKEN header or _csrf in body
if (in_array($method, ['POST', 'PUT', 'DELETE']) && str_starts_with($uri, '/api/')) {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    if (!$token) {
        $input = getJsonInput();
        $token = $input['_csrf'] ?? null;
    }
    if (!Auth::validateCsrf($token)) {
        jsonError('CSRF token validation failed', 403);
    }
}

// --- Rate limit check ---
if (!checkRateLimit()) {
    if (str_starts_with($uri, '/api/')) {
        jsonError('Too many requests. Please try again later.', 429);
    } else {
        http_response_code(429);
        echo 'Too many requests. Please try again later.';
        exit;
    }
}

// --- Router setup ---
$router = new Router();

// Guest pages
$router->group(['middleware' => 'GuestMiddleware'], function (Router $r) {
    $r->get('/login', function () {
        require BASE_PATH . '/src/views/login.php';
    });
    $r->get('/register', function () {
        require BASE_PATH . '/src/views/register.php';
    });
    $r->get('/forgot-password', function () {
        require BASE_PATH . '/src/views/forgot-password.php';
    });
});

// Landing page (accessible to all)
$router->get('/', function () {
    if (Auth::check()) {
        header('Location: /dashboard');
        exit;
    }
    require BASE_PATH . '/src/views/landing.php';
});

// Templates (accessible to all)
$router->get('/templates', function () {
    require BASE_PATH . '/src/views/templates.php';
});

// Auth pages
$router->group(['middleware' => 'AuthMiddleware'], function (Router $r) {
    $r->get('/dashboard', function () {
        require BASE_PATH . '/src/views/dashboard.php';
    });
    $r->get('/resumes/{id}', function (array $params) {
        require BASE_PATH . '/src/views/builder.php';
    });
    $r->get('/settings', function () {
        require BASE_PATH . '/src/views/settings.php';
    });
});

// API: Auth routes (guest-only for register/login)
$router->group(['prefix' => '/api/auth'], function (Router $r) {
    $r->group(['middleware' => 'GuestMiddleware'], function (Router $r) {
        $r->post('/register', function () {
            require BASE_PATH . '/src/api/auth.php';
            handleRegister();
        });
        $r->post('/login', function () {
            require BASE_PATH . '/src/api/auth.php';
            handleLogin();
        });
        $r->post('/forgot-password', function () {
            require BASE_PATH . '/src/api/auth.php';
            handleForgotPassword();
        });
    });
    $r->post('/logout', function () {
        require BASE_PATH . '/src/api/auth.php';
        handleLogout();
    });
});

// API: Resumes (auth required)
$router->group(['prefix' => '/api/resumes', 'middleware' => 'AuthMiddleware'], function (Router $r) {
    $r->get('', function () {
        require BASE_PATH . '/src/api/resumes.php';
        handleListResumes();
    });
    $r->post('', function () {
        require BASE_PATH . '/src/api/resumes.php';
        handleCreateResume();
    });
    $r->get('/{id}', function (array $params) {
        require BASE_PATH . '/src/api/resumes.php';
        handleGetResume($params['id']);
    });
    $r->put('/{id}', function (array $params) {
        require BASE_PATH . '/src/api/resumes.php';
        handleUpdateResume($params['id']);
    });
    $r->delete('/{id}', function (array $params) {
        require BASE_PATH . '/src/api/resumes.php';
        handleDeleteResume($params['id']);
    });
    $r->post('/{id}/duplicate', function (array $params) {
        require BASE_PATH . '/src/api/resumes.php';
        handleDuplicateResume($params['id']);
    });
    $r->put('/{id}/personal', function (array $params) {
        require BASE_PATH . '/src/api/resumes.php';
        handleUpdatePersonal($params['id']);
    });
    $r->put('/{id}/summary', function (array $params) {
        require BASE_PATH . '/src/api/resumes.php';
        handleUpdateSummary($params['id']);
    });
    $r->post('/{id}/reorder', function (array $params) {
        require BASE_PATH . '/src/api/resumes.php';
        handleReorderSections($params['id']);
    });

    // Entry CRUD for sections
    $sections = ['experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'languages', 'volunteer', 'references', 'custom'];
    foreach ($sections as $section) {
        $r->post("/{id}/{$section}", function (array $params) use ($section) {
            require BASE_PATH . '/src/api/resumes.php';
            handleCreateEntry($params['id'], $section);
        });
        $r->put("/{id}/{$section}/{entryId}", function (array $params) use ($section) {
            require BASE_PATH . '/src/api/resumes.php';
            handleUpdateEntry($params['id'], $section, $params['entryId']);
        });
        $r->delete("/{id}/{$section}/{entryId}", function (array $params) use ($section) {
            require BASE_PATH . '/src/api/resumes.php';
            handleDeleteEntry($params['id'], $section, $params['entryId']);
        });
    }
});

// API: Dashboard
$router->group(['prefix' => '/api', 'middleware' => 'AuthMiddleware'], function (Router $r) {
    $r->get('/dashboard', function () {
        require BASE_PATH . '/src/api/dashboard.php';
        handleDashboard();
    });
});

// API: Settings
$router->group(['prefix' => '/api/settings', 'middleware' => 'AuthMiddleware'], function (Router $r) {
    $r->get('', function () {
        require BASE_PATH . '/src/api/settings.php';
        handleGetSettings();
    });
    $r->put('/profile', function () {
        require BASE_PATH . '/src/api/settings.php';
        handleUpdateProfile();
    });
    $r->put('/password', function () {
        require BASE_PATH . '/src/api/settings.php';
        handleUpdatePassword();
    });
    $r->put('/preferences', function () {
        require BASE_PATH . '/src/api/settings.php';
        handleUpdatePreferences();
    });
    $r->delete('/account', function () {
        require BASE_PATH . '/src/api/settings.php';
        handleDeleteAccount();
    });
});

// Dispatch
$router->dispatch($method, $uri);
