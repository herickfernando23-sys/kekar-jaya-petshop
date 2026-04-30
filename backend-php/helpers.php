<?php

declare(strict_types=1);

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function parseJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        jsonResponse(['error' => 'Format JSON tidak valid'], 400);
    }

    return $decoded;
}

function slugify(string $value): string
{
    $value = trim(strtolower($value));
    $value = preg_replace('/[^a-z0-9\s-]/', '', $value) ?? '';
    $value = preg_replace('/\s+/', '-', $value) ?? '';
    $value = preg_replace('/-+/', '-', $value) ?? '';

    return trim($value, '-');
}

function normalizePath(string $requestPath): string
{
    $path = '/' . trim($requestPath, '/');

    $baseDir = '/' . trim(basename(__DIR__), '/');
    if ($path === $baseDir) {
        return '/';
    }

    if (str_starts_with($path, $baseDir . '/')) {
        $path = substr($path, strlen($baseDir));
        $path = $path === '' ? '/' : $path;
    }

    if ($path === '/index.php') {
        return '/';
    }

    if (str_starts_with($path, '/index.php/')) {
        return substr($path, strlen('/index.php'));
    }

    return $path;
}

function pdoFromConfig(array $dbConfig): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $dbConfig['host'],
        $dbConfig['database'],
        $dbConfig['charset']
    );

    return new PDO(
        $dsn,
        $dbConfig['user'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
}
