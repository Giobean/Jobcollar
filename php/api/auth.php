<?php

declare(strict_types=1);

function handleRegister(array $params): void
{
    if (!checkRateLimit('register')) {
        jsonError('Too many attempts. Please try again later.', 429);
    }

    $input = sanitize(getJsonInput());

    $validator = Validator::make($input, [
        'email'    => 'required|email|unique:users,email',
        'password' => 'required|min:8|max:128',
        'name'     => 'required|min:2|max:100',
    ]);

    if ($validator->fails()) {
        jsonResponse(['error' => $validator->firstError(), 'errors' => $validator->errors(), 'status' => 422], 422);
    }

    $result = Auth::register($input['email'], $input['password'], $input['name']);

    if (!$result['success']) {
        jsonError($result['error'], 409);
    }

    jsonSuccess([
        'user'       => $result['user'],
        'csrf_token' => Auth::generateCsrfToken(),
    ], 201);
}

function handleLogin(array $params): void
{
    if (!checkRateLimit('login')) {
        jsonError('Too many attempts. Please try again later.', 429);
    }

    $input = sanitize(getJsonInput());

    $validator = Validator::make($input, [
        'email'    => 'required|email',
        'password' => 'required',
    ]);

    if ($validator->fails()) {
        jsonResponse(['error' => $validator->firstError(), 'errors' => $validator->errors(), 'status' => 422], 422);
    }

    $remember = (bool) ($input['remember'] ?? false);
    $result = Auth::login($input['email'], $input['password'], $remember);

    if (!$result['success']) {
        jsonError($result['error'], 401);
    }

    jsonSuccess([
        'user'       => $result['user'],
        'csrf_token' => Auth::generateCsrfToken(),
    ]);
}

function handleLogout(array $params): void
{
    Auth::logout();
    jsonSuccess(['message' => 'Logged out successfully']);
}

function handleForgotPassword(array $params): void
{
    if (!checkRateLimit('forgot_password')) {
        jsonError('Too many attempts. Please try again later.', 429);
    }

    $input = sanitize(getJsonInput());

    $validator = Validator::make($input, [
        'email' => 'required|email',
    ]);

    if ($validator->fails()) {
        jsonResponse(['error' => $validator->firstError(), 'errors' => $validator->errors(), 'status' => 422], 422);
    }

    // Always return success to prevent email enumeration
    Auth::generateResetToken($input['email']);

    jsonSuccess(['message' => 'If an account exists with that email, a password reset link has been sent.']);
}
