<?php

function handleRegister(): void
{
    $input = getJsonInput();

    $validator = Validator::make($input, [
        'name' => 'required|min:2|max:100',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:8|max:128|confirmed',
    ]);

    if ($validator->fails()) {
        jsonError($validator->firstError(), 422);
    }

    $name = htmlspecialchars(strip_tags(trim($input['name'])), ENT_QUOTES, 'UTF-8');
    $email = strtolower(trim($input['email']));
    $password = $input['password'];

    try {
        $user = Auth::register($name, $email, $password);
        jsonResponse([
            'user' => $user,
            'message' => 'Account created successfully.',
        ], 201);
    } catch (\Throwable $e) {
        jsonError('Registration failed. Please try again.', 500);
    }
}

function handleLogin(): void
{
    $input = getJsonInput();

    $validator = Validator::make($input, [
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if ($validator->fails()) {
        jsonError($validator->firstError(), 422);
    }

    $email = strtolower(trim($input['email']));
    $password = $input['password'];
    $remember = !empty($input['remember']);

    $user = Auth::login($email, $password, $remember);

    if (!$user) {
        jsonError('Invalid email or password.', 401);
    }

    jsonResponse([
        'user' => $user,
        'csrf_token' => Auth::generateCsrfToken(),
        'message' => 'Login successful.',
    ]);
}

function handleLogout(): void
{
    Auth::logout();
    jsonResponse(['message' => 'Logged out successfully.']);
}

function handleForgotPassword(): void
{
    $input = getJsonInput();

    $validator = Validator::make($input, [
        'email' => 'required|email',
    ]);

    if ($validator->fails()) {
        jsonError($validator->firstError(), 422);
    }

    $email = strtolower(trim($input['email']));
    $db = Database::getInstance();
    $user = $db->fetch('SELECT id FROM users WHERE email = ?', [$email]);

    if ($user) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $db->execute(
            'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
            [$token, $expires, $user['id']]
        );
    }

    // Always return success to prevent email enumeration
    jsonResponse(['message' => 'If an account exists with that email, a password reset link has been sent.']);
}
