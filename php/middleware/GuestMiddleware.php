<?php

declare(strict_types=1);

class GuestMiddleware
{
    public function handle(): bool
    {
        if (Auth::check()) {
            $uri = $_SERVER['REQUEST_URI'] ?? '/';
            if (str_starts_with($uri, '/api/')) {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode(['error' => 'Already authenticated', 'status' => 403]);
                exit;
            }
            header('Location: /dashboard');
            exit;
        }
        return true;
    }
}
