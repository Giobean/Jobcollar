<?php

declare(strict_types=1);

class AuthMiddleware
{
    public function handle(): bool
    {
        if (!Auth::check()) {
            $uri = $_SERVER['REQUEST_URI'] ?? '/';
            if (str_starts_with($uri, '/api/')) {
                http_response_code(401);
                header('Content-Type: application/json');
                echo json_encode(['error' => 'Unauthorized', 'status' => 401]);
                exit;
            }
            header('Location: /login');
            exit;
        }
        return true;
    }
}
