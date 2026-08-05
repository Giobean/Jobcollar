<?php

declare(strict_types=1);

function handleGetSettings(array $params): void
{
    $user = Auth::user();
    if (!$user) {
        jsonError('Not authenticated', 401);
    }

    $db = Database::getInstance();
    $statuses = $db->fetchAll(
        'SELECT * FROM job_statuses WHERE user_id = ? ORDER BY sort_order',
        [Auth::id()]
    );

    jsonSuccess([
        'user'     => $user,
        'statuses' => $statuses,
    ]);
}

function handleUpdateProfile(array $params): void
{
    requireCsrf();

    $input = sanitize(getJsonInput());
    $userId = Auth::id();

    $rules = [
        'name' => 'required|min:2|max:100',
    ];

    if (isset($input['email'])) {
        $rules['email'] = "required|email|unique:users,email,$userId";
    }

    $validator = Validator::make($input, $rules);
    if ($validator->fails()) {
        jsonResponse(['error' => $validator->firstError(), 'errors' => $validator->errors(), 'status' => 422], 422);
    }

    $db = Database::getInstance();

    $sets = ["name = ?", "updated_at = datetime('now')"];
    $values = [$input['name']];

    if (isset($input['email'])) {
        $sets[] = 'email = ?';
        $values[] = $input['email'];
    }

    $values[] = $userId;
    $db->execute('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?', $values);

    jsonSuccess(Auth::user());
}

function handleUpdatePassword(array $params): void
{
    requireCsrf();

    $input = getJsonInput();

    $validator = Validator::make($input, [
        'current_password' => 'required',
        'password'         => 'required|min:8|max:128|confirmed',
    ]);

    if ($validator->fails()) {
        jsonResponse(['error' => $validator->firstError(), 'errors' => $validator->errors(), 'status' => 422], 422);
    }

    $db = Database::getInstance();
    $user = $db->fetch('SELECT * FROM users WHERE id = ?', [Auth::id()]);

    if (!password_verify($input['current_password'], $user['password_hash'])) {
        jsonError('Current password is incorrect', 403);
    }

    $newHash = password_hash($input['password'], PASSWORD_ARGON2ID, [
        'memory_cost' => 65536,
        'time_cost'   => 4,
        'threads'     => 1,
    ]);

    $db->execute(
        "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
        [$newHash, Auth::id()]
    );

    jsonSuccess(['message' => 'Password updated successfully']);
}

function handleUpdatePreferences(array $params): void
{
    requireCsrf();

    $input = sanitize(getJsonInput());
    $db = Database::getInstance();

    $sets = ["updated_at = datetime('now')"];
    $values = [];

    if (isset($input['theme'])) {
        $allowed = ['system', 'light', 'dark'];
        if (!in_array($input['theme'], $allowed, true)) {
            jsonError('Invalid theme', 422);
        }
        $sets[] = 'theme = ?';
        $values[] = $input['theme'];
    }

    if (isset($input['autosave'])) {
        $sets[] = 'autosave = ?';
        $values[] = (int) (bool) $input['autosave'];
    }

    $values[] = Auth::id();
    $db->execute('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?', $values);

    jsonSuccess(Auth::user());
}

function handleDeleteAccount(array $params): void
{
    requireCsrf();

    $input = getJsonInput();
    if (empty($input['confirm']) || $input['confirm'] !== true) {
        jsonError('Please confirm account deletion', 422);
    }

    $db = Database::getInstance();

    // CASCADE handles related data
    $db->execute('DELETE FROM users WHERE id = ?', [Auth::id()]);

    Auth::logout();
    jsonSuccess(['message' => 'Account deleted']);
}
