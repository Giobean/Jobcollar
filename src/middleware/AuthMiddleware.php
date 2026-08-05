<?php

class AuthMiddleware
{
    public function handle(string $uri): bool
    {
        if (Auth::check()) {
            return true;
        }

        if (str_starts_with($uri, '/api/')) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Authentication required', 'status' => 401]);
            return false;
        }

        header('Location: /login');
        exit;
    }
}
