<?php

function handleGetSettings(): void
{
    $user = Auth::user();
    $preferences = json_decode($user['preferences'] ?? '{}', true);

    jsonResponse([
        'profile' => [
            'name' => $user['name'],
            'email' => $user['email'],
            'avatar' => $user['avatar'],
        ],
        'preferences' => $preferences,
        'account' => [
            'created_at' => $user['created_at'],
        ],
    ]);
}

function handleUpdateProfile(): void
{
    $input = getJsonInput();
    $userId = Auth::id();

    $validator = Validator::make($input, [
        'name' => 'required|min:2|max:100',
        'email' => "required|email|unique:users,email,{$userId}",
    ]);

    if ($validator->fails()) {
        jsonError($validator->firstError(), 422);
    }

    $db = Database::getInstance();
    $name = htmlspecialchars(strip_tags(trim($input['name'])), ENT_QUOTES, 'UTF-8');
    $email = strtolower(trim($input['email']));

    $db->execute(
        "UPDATE users SET name = ?, email = ?, updated_at = datetime('now') WHERE id = ?",
        [$name, $email, $userId]
    );

    $user = $db->fetch('SELECT id, name, email, avatar, preferences, created_at FROM users WHERE id = ?', [$userId]);
    jsonResponse(['profile' => $user, 'message' => 'Profile updated successfully.']);
}

function handleUpdatePassword(): void
{
    $input = getJsonInput();
    $userId = Auth::id();

    $validator = Validator::make($input, [
        'current_password' => 'required',
        'password' => 'required|min:8|max:128|confirmed',
    ]);

    if ($validator->fails()) {
        jsonError($validator->firstError(), 422);
    }

    $db = Database::getInstance();
    $user = $db->fetch('SELECT password FROM users WHERE id = ?', [$userId]);

    if (!password_verify($input['current_password'], $user['password'])) {
        jsonError('Current password is incorrect.', 422);
    }

    $hash = password_hash($input['password'], PASSWORD_ARGON2ID, [
        'memory_cost' => 65536,
        'time_cost' => 4,
        'threads' => 3,
    ]);

    $db->execute("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?", [$hash, $userId]);

    jsonResponse(['message' => 'Password updated successfully.']);
}

function handleUpdatePreferences(): void
{
    $input = getJsonInput();
    $userId = Auth::id();
    $db = Database::getInstance();

    $allowedPrefs = ['theme', 'language', 'email_notifications', 'auto_save', 'default_template'];
    $currentPrefs = json_decode(
        $db->fetch('SELECT preferences FROM users WHERE id = ?', [$userId])['preferences'] ?? '{}',
        true
    ) ?: [];

    foreach ($allowedPrefs as $key) {
        if (array_key_exists($key, $input)) {
            $currentPrefs[$key] = $input[$key];
        }
    }

    $db->execute(
        "UPDATE users SET preferences = ?, updated_at = datetime('now') WHERE id = ?",
        [json_encode($currentPrefs), $userId]
    );

    jsonResponse(['preferences' => $currentPrefs, 'message' => 'Preferences updated successfully.']);
}

function handleDeleteAccount(): void
{
    $input = getJsonInput();
    $userId = Auth::id();
    $db = Database::getInstance();

    if (empty($input['password'])) {
        jsonError('Password is required to delete account.', 422);
    }

    $user = $db->fetch('SELECT password FROM users WHERE id = ?', [$userId]);

    if (!password_verify($input['password'], $user['password'])) {
        jsonError('Password is incorrect.', 422);
    }

    $db->execute('DELETE FROM users WHERE id = ?', [$userId]);
    Auth::logout();

    jsonResponse(['message' => 'Account deleted successfully.']);
}
