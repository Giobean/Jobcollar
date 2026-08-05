<?php

declare(strict_types=1);

class Auth
{
    private const REMEMBER_COOKIE = 'jobcollar_remember';
    private const REMEMBER_DAYS = 30;
    private const CSRF_TOKEN_KEY = '_csrf_token';

    public static function register(string $email, string $password, string $name): array
    {
        $db = Database::getInstance();

        $existing = $db->fetch('SELECT id FROM users WHERE email = ?', [$email]);
        if ($existing) {
            return ['success' => false, 'error' => 'Email already registered'];
        }

        $hash = password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost'   => 4,
            'threads'     => 1,
        ]);

        $db->execute(
            'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
            [$email, $hash, $name]
        );

        $userId = (int) $db->lastInsertId();
        self::createDefaultStatuses($userId);

        $user = $db->fetch('SELECT * FROM users WHERE id = ?', [$userId]);
        $_SESSION['user_id'] = $userId;

        return ['success' => true, 'user' => self::sanitizeUser($user)];
    }

    public static function login(string $email, string $password, bool $remember = false): array
    {
        $db = Database::getInstance();

        $user = $db->fetch('SELECT * FROM users WHERE email = ?', [$email]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'error' => 'Invalid email or password'];
        }

        $_SESSION['user_id'] = (int) $user['id'];

        $db->execute(
            "UPDATE users SET last_login_at = datetime('now') WHERE id = ?",
            [$user['id']]
        );

        if ($remember) {
            $token = bin2hex(random_bytes(32));
            $db->execute('UPDATE users SET remember_token = ? WHERE id = ?', [$token, $user['id']]);

            setcookie(self::REMEMBER_COOKIE, $token, [
                'expires'  => time() + (86400 * self::REMEMBER_DAYS),
                'path'     => '/',
                'httponly'  => true,
                'samesite' => 'Strict',
                'secure'   => isset($_SERVER['HTTPS']),
            ]);
        }

        return ['success' => true, 'user' => self::sanitizeUser($user)];
    }

    public static function logout(): void
    {
        $db = Database::getInstance();

        if (self::check()) {
            $db->execute('UPDATE users SET remember_token = NULL WHERE id = ?', [self::id()]);
        }

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $params['path'],
                'domain'   => $params['domain'],
                'secure'   => $params['secure'],
                'httponly'  => $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Strict',
            ]);
        }

        setcookie(self::REMEMBER_COOKIE, '', [
            'expires'  => time() - 42000,
            'path'     => '/',
            'httponly'  => true,
            'samesite' => 'Strict',
        ]);

        session_destroy();
    }

    public static function user(): ?array
    {
        if (!self::check()) {
            return null;
        }

        $db = Database::getInstance();
        $user = $db->fetch('SELECT * FROM users WHERE id = ?', [self::id()]);
        return $user ? self::sanitizeUser($user) : null;
    }

    public static function check(): bool
    {
        if (isset($_SESSION['user_id'])) {
            return true;
        }

        return self::checkRememberToken();
    }

    public static function id(): ?int
    {
        if (isset($_SESSION['user_id'])) {
            return (int) $_SESSION['user_id'];
        }

        if (self::checkRememberToken()) {
            return (int) $_SESSION['user_id'];
        }

        return null;
    }

    private static function checkRememberToken(): bool
    {
        $token = $_COOKIE[self::REMEMBER_COOKIE] ?? null;
        if (!$token) {
            return false;
        }

        $db = Database::getInstance();
        $user = $db->fetch('SELECT id FROM users WHERE remember_token = ?', [$token]);
        if ($user) {
            $_SESSION['user_id'] = (int) $user['id'];
            return true;
        }

        return false;
    }

    public static function generateCsrfToken(): string
    {
        if (empty($_SESSION[self::CSRF_TOKEN_KEY])) {
            $_SESSION[self::CSRF_TOKEN_KEY] = bin2hex(random_bytes(32));
        }
        return $_SESSION[self::CSRF_TOKEN_KEY];
    }

    public static function validateCsrf(?string $token = null): bool
    {
        $token ??= $_POST['_csrf_token']
            ?? $_SERVER['HTTP_X_CSRF_TOKEN']
            ?? null;

        if (!$token || empty($_SESSION[self::CSRF_TOKEN_KEY])) {
            return false;
        }

        return hash_equals($_SESSION[self::CSRF_TOKEN_KEY], $token);
    }

    public static function generateResetToken(string $email): ?string
    {
        $db = Database::getInstance();
        $user = $db->fetch('SELECT id FROM users WHERE email = ?', [$email]);
        if (!$user) {
            return null;
        }

        $token = bin2hex(random_bytes(32));
        $db->execute(
            "UPDATE users SET reset_token = ?, reset_expires_at = datetime('now', '+1 hour') WHERE id = ?",
            [$token, $user['id']]
        );

        return $token;
    }

    private static function createDefaultStatuses(int $userId): void
    {
        $db = Database::getInstance();
        $statuses = [
            ['Wishlist', '#8b5cf6', 0],
            ['Applied', '#3b82f6', 1],
            ['Viewed', '#06b6d4', 2],
            ['Assessment', '#f59e0b', 3],
            ['Interview', '#f97316', 4],
            ['Offer', '#22c55e', 5],
            ['Rejected', '#ef4444', 6],
            ['Withdrawn', '#6b7280', 7],
            ['Ghosted', '#9ca3af', 8],
            ['Hired', '#10b981', 9],
        ];

        foreach ($statuses as [$name, $color, $order]) {
            $db->execute(
                'INSERT INTO job_statuses (user_id, name, color, sort_order, is_system) VALUES (?, ?, ?, ?, 1)',
                [$userId, $name, $color, $order]
            );
        }
    }

    private static function sanitizeUser(array $user): array
    {
        unset($user['password_hash'], $user['remember_token'], $user['reset_token'], $user['reset_expires_at']);
        return $user;
    }
}
