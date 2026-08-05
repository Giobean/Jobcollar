<?php

declare(strict_types=1);

class Router
{
    private array $routes = [];
    private array $groupStack = [];
    private string $currentPrefix = '';
    private array $currentMiddleware = [];

    public function get(string $path, callable|array $handler): self
    {
        return $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): self
    {
        return $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable|array $handler): self
    {
        return $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, callable|array $handler): self
    {
        return $this->addRoute('DELETE', $path, $handler);
    }

    public function group(array $options, callable $callback): self
    {
        $previousPrefix = $this->currentPrefix;
        $previousMiddleware = $this->currentMiddleware;

        if (isset($options['prefix'])) {
            $this->currentPrefix .= '/' . trim($options['prefix'], '/');
        }
        if (isset($options['middleware'])) {
            $mw = is_array($options['middleware']) ? $options['middleware'] : [$options['middleware']];
            $this->currentMiddleware = array_merge($this->currentMiddleware, $mw);
        }

        $callback($this);

        $this->currentPrefix = $previousPrefix;
        $this->currentMiddleware = $previousMiddleware;

        return $this;
    }

    private function addRoute(string $method, string $path, callable|array $handler): self
    {
        $fullPath = $this->currentPrefix . '/' . trim($path, '/');
        $fullPath = '/' . trim($fullPath, '/');

        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $fullPath);
        $pattern = '#^' . $pattern . '$#';

        $this->routes[] = [
            'method'     => $method,
            'path'       => $fullPath,
            'pattern'    => $pattern,
            'handler'    => $handler,
            'middleware'  => $this->currentMiddleware,
        ];

        return $this;
    }

    public function dispatch(string $method, string $uri): mixed
    {
        $uri = '/' . trim(parse_url($uri, PHP_URL_PATH) ?? '/', '/');
        if ($uri !== '/') {
            $uri = rtrim($uri, '/');
        }

        $method = strtoupper($method);

        // Support PUT/DELETE via _method field in POST
        if ($method === 'POST') {
            $overrideMethod = $_POST['_method'] ?? $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null;
            if ($overrideMethod !== null) {
                $method = strtoupper($overrideMethod);
            }
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $uri, $matches)) {
                $params = array_filter($matches, fn($key) => is_string($key), ARRAY_FILTER_USE_KEY);

                foreach ($route['middleware'] as $middleware) {
                    $middlewareInstance = new $middleware();
                    $result = $middlewareInstance->handle();
                    if ($result !== true) {
                        return $result;
                    }
                }

                $handler = $route['handler'];
                if (is_array($handler)) {
                    [$file, $function] = $handler;
                    require_once $file;
                    return $function($params);
                }

                return $handler($params);
            }
        }

        http_response_code(404);
        if ($this->isApiRequest($uri)) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Not found', 'status' => 404]);
        } else {
            echo '<!DOCTYPE html><html><head><title>404</title></head><body><h1>404 - Page Not Found</h1></body></html>';
        }
        return null;
    }

    private function isApiRequest(string $uri): bool
    {
        return str_starts_with($uri, '/api/');
    }
}
