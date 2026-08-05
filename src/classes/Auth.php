<?php

class Auth
{
    private static ?array $cachedUser = null;

    public static function register(string $name, string $email, string $password): array
    {
        $db = Database::getInstance();

        $hash = password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3,
        ]);

        $db->execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [$name, $email, $hash]
        );

        $userId = $db->lastInsertId();
        $user = $db->fetch('SELECT id, name, email, preferences, created_at FROM users WHERE id = ?', [$userId]);

        $_SESSION['user_id'] = $userId;
        self::$cachedUser = $user;

        self::log('register', 'user', $userId);

        return $user;
    }

    public static function login(string $email, string $password, bool $remember = false): ?array
    {
        $db = Database::getInstance();
        $user = $db->fetch('SELECT * FROM users WHERE email = ?', [$email]);

        if (!$user || !password_verify($password, $user['password'])) {
            return null;
        }

        $_SESSION['user_id'] = $user['id'];

        if ($remember) {
            $token = bin2hex(random_bytes(32));
            $db->execute('UPDATE users SET remember_token = ? WHERE id = ?', [$token, $user['id']]);
            setcookie('remember_token', $token, [
                'expires' => time() + (30 * 24 * 60 * 60),
                'path' => '/',
                'httponly' => true,
                'samesite' => 'Strict',
                'secure' => isset($_SERVER['HTTPS']),
            ]);
        }

        unset($user['password'], $user['remember_token'], $user['password_reset_token'], $user['password_reset_expires']);
        self::$cachedUser = $user;

        self::log('login', 'user', $user['id']);

        return $user;
    }

    public static function logout(): void
    {
        $userId = self::id();

        if ($userId) {
            $db = Database::getInstance();
            $db->execute('UPDATE users SET remember_token = NULL WHERE id = ?', [$userId]);
            self::log('logout', 'user', $userId);
        }

        setcookie('remember_token', '', ['expires' => time() - 3600, 'path' => '/']);
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => $params['secure'],
                'httponly' => $params['httponly'],
            ]);
        }

        session_destroy();
        self::$cachedUser = null;
    }

    public static function user(): ?array
    {
        if (self::$cachedUser !== null) {
            return self::$cachedUser;
        }

        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId && isset($_COOKIE['remember_token'])) {
            $db = Database::getInstance();
            $user = $db->fetch('SELECT * FROM users WHERE remember_token = ?', [$_COOKIE['remember_token']]);
            if ($user) {
                $_SESSION['user_id'] = $user['id'];
                $userId = $user['id'];
            }
        }

        if (!$userId) {
            return null;
        }

        $db = Database::getInstance();
        $user = $db->fetch(
            'SELECT id, name, email, avatar, preferences, created_at, updated_at FROM users WHERE id = ?',
            [$userId]
        );

        self::$cachedUser = $user;
        return $user;
    }

    public static function check(): bool
    {
        return self::user() !== null;
    }

    public static function id(): ?int
    {
        $user = self::user();
        return $user ? (int) $user['id'] : null;
    }

    public static function generateCsrfToken(): string
    {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function validateCsrf(?string $token): bool
    {
        if (empty($_SESSION['csrf_token']) || empty($token)) {
            return false;
        }
        return hash_equals($_SESSION['csrf_token'], $token);
    }

    private static function log(string $action, ?string $entityType = null, ?int $entityId = null): void
    {
        try {
            $db = Database::getInstance();
            $db->execute(
                'INSERT INTO audit_log (user_id, action, entity_type, entity_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    self::id(),
                    $action,
                    $entityType,
                    $entityId,
                    $_SERVER['REMOTE_ADDR'] ?? null,
                    $_SERVER['HTTP_USER_AGENT'] ?? null,
                ]
            );
        } catch (\Throwable $e) {
            // Silent fail for audit logging
        }
    }
}
