<?php

declare(strict_types=1);

function loadEnvFile(string $envPath): array
{
    $values = [];

    if (!is_file($envPath)) {
        return $values;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return $values;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        $separatorPos = strpos($trimmed, '=');
        if ($separatorPos === false) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $separatorPos));
        $value = trim(substr($trimmed, $separatorPos + 1));

        if ($value !== '' && ((str_starts_with($value, '"') && str_ends_with($value, '"')) || (str_starts_with($value, "'") && str_ends_with($value, "'")))) {
            $value = substr($value, 1, -1);
        }

        $values[$key] = $value;
    }

    return $values;
}

$envValues = loadEnvFile(__DIR__ . '/../.env');

$dbConfig = [
    'host' => $envValues['DB_HOST'] ?? 'localhost',
    'user' => $envValues['DB_USER'] ?? 'root',
    'password' => $envValues['DB_PASSWORD'] ?? '',
    'database' => $envValues['DB_NAME'] ?? 'kekar_jaya_petshop',
    'charset' => 'utf8mb4',
];
