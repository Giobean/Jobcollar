<?php

class Router
{
    private array $routes = [];
    private array $groupStack = [];
    private string $currentPrefix = '';
    private array $currentMiddleware = [];

    public function get(string $path, callable $handler): self
    {
        return $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): self
    {
        return $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): self
    {
        return $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, callable $handler): self
    {
        return $this->addRoute('DELETE', $path, $handler);
    }

    public function group(array $options, callable $callback): self
    {
        $previousPrefix = $this->currentPrefix;
        $previousMiddleware = $this->currentMiddleware;

        $this->currentPrefix .= ($options['prefix'] ?? '');
        if (isset($options['middleware'])) {
            $middleware = is_array($options['middleware']) ? $options['middleware'] : [$options['middleware']];
            $this->currentMiddleware = array_merge($this->currentMiddleware, $middleware);
        }

        $callback($this);

        $this->currentPrefix = $previousPrefix;
        $this->currentMiddleware = $previousMiddleware;

        return $this;
    }

    private function addRoute(string $method, string $path, callable $handler): self
    {
        $fullPath = $this->currentPrefix . $path;
        $pattern = $this->pathToRegex($fullPath);

        $this->routes[] = [
            'method' => $method,
            'path' => $fullPath,
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $this->currentMiddleware,
        ];

        return $this;
    }

    private function pathToRegex(string $path): string
    {
        $pattern = preg_replace('/\{([a-zA-Z_]+)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    public function dispatch(string $method, string $uri): void
    {
        $uri = parse_url($uri, PHP_URL_PATH);
        $uri = rtrim($uri, '/') ?: '/';

        if ($method === 'POST' && isset($_POST['_method'])) {
            $method = strtoupper($_POST['_method']);
        }

        if ($method === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
            $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                foreach ($route['middleware'] as $middleware) {
                    $middlewareInstance = new $middleware();
                    $result = $middlewareInstance->handle($uri);
                    if ($result === false) {
                        return;
                    }
                }

                call_user_func($route['handler'], $params);
                return;
            }
        }

        http_response_code(404);
        if ($this->isApiRequest($uri)) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Not found', 'status' => 404]);
        } else {
            echo '<!DOCTYPE html><html><head><title>404</title></head><body><h1>404 - Page Not Found</h1></body></html>';
        }
    }

    private function isApiRequest(string $uri): bool
    {
        return str_starts_with($uri, '/api/');
    }
}
