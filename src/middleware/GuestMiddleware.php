<?php

class GuestMiddleware
{
    public function handle(string $uri): bool
    {
        if (!Auth::check()) {
            return true;
        }

        if (str_starts_with($uri, '/api/')) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Already authenticated', 'status' => 403]);
            return false;
        }

        header('Location: /dashboard');
        exit;
    }
}
