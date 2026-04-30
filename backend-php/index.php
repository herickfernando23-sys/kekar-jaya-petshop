<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function ensureCategoryId(PDO $pdo, string $categoryName): int
{
    $cleanName = trim($categoryName) !== '' ? trim($categoryName) : 'Makanan Kucing';

    $findStmt = $pdo->prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1');
    $findStmt->execute([$cleanName]);
    $existing = $findStmt->fetch();
    if ($existing) {
        return (int) $existing['id'];
    }

    $baseSlug = slugify($cleanName);
    if ($baseSlug === '') {
        $baseSlug = 'kategori-' . time();
    }

    $slug = $baseSlug;
    $suffix = 1;
    while (true) {
        $slugStmt = $pdo->prepare('SELECT id FROM categories WHERE slug = ? LIMIT 1');
        $slugStmt->execute([$slug]);
        if (!$slugStmt->fetch()) {
            break;
        }

        $suffix++;
        $slug = $baseSlug . '-' . $suffix;
    }

    $insertStmt = $pdo->prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
    $insertStmt->execute([$cleanName, $slug]);

    return (int) $pdo->lastInsertId();
}

function fetchProducts(PDO $pdo, bool $onlyActive = true): array
{
    $whereClause = $onlyActive ? 'WHERE p.is_active = 1' : '';

    $productStmt = $pdo->query(
        "SELECT p.id, p.category_id, c.name AS category_name, p.name, p.slug, p.description, p.base_price, p.stock, p.image_url, p.is_active
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         $whereClause
         ORDER BY p.id ASC"
    );

    $products = $productStmt->fetchAll();
    if (!$products) {
        return [];
    }

    $variantStmt = $pdo->query(
        'SELECT id, product_id, name, price, stock, image_url FROM product_variants ORDER BY product_id ASC, id ASC'
    );
    $variants = $variantStmt->fetchAll() ?: [];

    $variantsByProduct = [];
    foreach ($variants as $variant) {
        $productId = (int) $variant['product_id'];
        if (!isset($variantsByProduct[$productId])) {
            $variantsByProduct[$productId] = [];
        }

        $variantsByProduct[$productId][] = [
            'id' => (int) $variant['id'],
            'name' => $variant['name'],
            'price' => (int) $variant['price'],
            'stock' => (int) $variant['stock'],
            'image_url' => $variant['image_url'],
        ];
    }

    $result = [];
    foreach ($products as $product) {
        $id = (int) $product['id'];
        $result[] = [
            'id' => $id,
            'category_id' => (int) $product['category_id'],
            'category_name' => $product['category_name'],
            'name' => $product['name'],
            'slug' => $product['slug'],
            'description' => $product['description'],
            'base_price' => (int) $product['base_price'],
            'stock' => (int) $product['stock'],
            'image_url' => $product['image_url'],
            'is_active' => (int) $product['is_active'],
            'variants' => $variantsByProduct[$id] ?? [],
        ];
    }

    return $result;
}

function fetchProductById(PDO $pdo, int $productId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT p.id, p.category_id, c.name AS category_name, p.name, p.slug, p.description, p.base_price, p.stock, p.image_url, p.is_active
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.id = ? LIMIT 1'
    );
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    if (!$product) {
        return null;
    }

    $variantStmt = $pdo->prepare('SELECT id, name, price, stock, image_url FROM product_variants WHERE product_id = ? ORDER BY id ASC');
    $variantStmt->execute([$productId]);
    $variantsRaw = $variantStmt->fetchAll() ?: [];

    $variants = [];
    foreach ($variantsRaw as $variant) {
        $variants[] = [
            'id' => (int) $variant['id'],
            'name' => $variant['name'],
            'price' => (int) $variant['price'],
            'stock' => (int) $variant['stock'],
            'image_url' => $variant['image_url'],
        ];
    }

    return [
        'id' => (int) $product['id'],
        'category_id' => (int) $product['category_id'],
        'category_name' => $product['category_name'],
        'name' => $product['name'],
        'slug' => $product['slug'],
        'description' => $product['description'],
        'base_price' => (int) $product['base_price'],
        'stock' => (int) $product['stock'],
        'image_url' => $product['image_url'],
        'is_active' => (int) $product['is_active'],
        'variants' => $variants,
    ];
}

function parseVariants(array $payload, string $fallbackImage): ?array
{
    if (!array_key_exists('variants', $payload)) {
        return null;
    }

    if (!is_array($payload['variants'])) {
        return [];
    }

    $normalized = [];
    foreach ($payload['variants'] as $variant) {
        if (!is_array($variant)) {
            continue;
        }

        $name = isset($variant['name']) ? trim((string) $variant['name']) : '';
        if ($name === '') {
            continue;
        }

        $normalized[] = [
            'name' => $name,
            'price' => max(0, (int) ($variant['price'] ?? 0)),
            'stock' => max(0, (int) ($variant['stock'] ?? 0)),
            'image' => isset($variant['image']) && trim((string) $variant['image']) !== ''
                ? trim((string) $variant['image'])
                : $fallbackImage,
        ];
    }

    return $normalized;
}

function createOrderNumber(): string
{
    return 'ORD-' . time() . '-' . random_int(1000, 9999);
}

try {
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $requestPath = normalizePath(parse_url($requestUri, PHP_URL_PATH) ?? '/');

    if ($requestMethod === 'GET' && $requestPath === '/health') {
        jsonResponse([
            'status' => 'API running',
            'timestamp' => date(DATE_ATOM),
            'backend' => 'php',
        ]);
    }

    $pdo = pdoFromConfig($dbConfig);

    if ($requestMethod === 'GET' && $requestPath === '/products') {
        jsonResponse(fetchProducts($pdo, true));
    }

    if ($requestMethod === 'GET' && $requestPath === '/categories') {
        $stmt = $pdo->query('SELECT id, name, slug FROM categories ORDER BY id ASC');
        jsonResponse($stmt->fetchAll() ?: []);
    }

    if ($requestMethod === 'GET' && preg_match('#^/products/(\d+)$#', $requestPath, $matches)) {
        $product = fetchProductById($pdo, (int) $matches[1]);
        if ($product === null) {
            jsonResponse(['error' => 'Produk tidak ditemukan'], 404);
        }

        jsonResponse($product);
    }

    if ($requestMethod === 'POST' && $requestPath === '/products') {
        $payload = parseJsonBody();
        $name = trim((string) ($payload['name'] ?? ''));

        if ($name === '') {
            jsonResponse(['error' => 'Nama produk wajib diisi'], 400);
        }

        $category = trim((string) ($payload['category'] ?? 'Makanan Kucing'));
        $price = max(0, (int) ($payload['price'] ?? 0));
        $stock = max(0, (int) ($payload['stock'] ?? 0));
        $description = trim((string) ($payload['description'] ?? 'Produk dari admin'));
        $image = trim((string) ($payload['image'] ?? '/images/whiskas.jpg'));

        $pdo->beginTransaction();
        $categoryId = ensureCategoryId($pdo, $category);

        $baseSlug = slugify($name);
        if ($baseSlug === '') {
            $baseSlug = 'produk-' . time();
        }

        $slug = $baseSlug;
        $suffix = 1;
        while (true) {
            $slugStmt = $pdo->prepare('SELECT id FROM products WHERE slug = ? LIMIT 1');
            $slugStmt->execute([$slug]);
            if (!$slugStmt->fetch()) {
                break;
            }

            $suffix++;
            $slug = $baseSlug . '-' . $suffix;
        }

        $insertStmt = $pdo->prepare(
            'INSERT INTO products (category_id, name, slug, description, base_price, stock, image_url, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
        );
        $insertStmt->execute([$categoryId, $name, $slug, $description, $price, $stock, $image]);

        $productId = (int) $pdo->lastInsertId();
        $pdo->commit();

        $product = fetchProductById($pdo, $productId);
        jsonResponse($product ?? ['id' => $productId], 201);
    }

    if ($requestMethod === 'PUT' && preg_match('#^/products/(\d+)$#', $requestPath, $matches)) {
        $productId = (int) $matches[1];
        $payload = parseJsonBody();

        $name = trim((string) ($payload['name'] ?? ''));
        if ($name === '') {
            jsonResponse(['error' => 'Nama produk wajib diisi'], 400);
        }

        $category = trim((string) ($payload['category'] ?? 'Makanan Kucing'));
        $price = max(0, (int) ($payload['price'] ?? 0));
        $stock = max(0, (int) ($payload['stock'] ?? 0));
        $description = trim((string) ($payload['description'] ?? 'Produk dari admin'));
        $image = trim((string) ($payload['image'] ?? '/images/whiskas.jpg'));
        $normalizedVariants = parseVariants($payload, $image);

        $pdo->beginTransaction();

        $existsStmt = $pdo->prepare('SELECT id FROM products WHERE id = ? LIMIT 1');
        $existsStmt->execute([$productId]);
        if (!$existsStmt->fetch()) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Produk tidak ditemukan'], 404);
        }

        $categoryId = ensureCategoryId($pdo, $category);

        $finalPrice = $price;
        if (is_array($normalizedVariants) && count($normalizedVariants) > 0) {
            $finalPrice = $normalizedVariants[0]['price'];
        }

        $updateStmt = $pdo->prepare(
            'UPDATE products
             SET category_id = ?, name = ?, description = ?, base_price = ?, stock = ?, image_url = ?
             WHERE id = ?'
        );
        $updateStmt->execute([$categoryId, $name, $description, $finalPrice, $stock, $image, $productId]);

        if ($normalizedVariants !== null) {
            $deleteVariantStmt = $pdo->prepare('DELETE FROM product_variants WHERE product_id = ?');
            $deleteVariantStmt->execute([$productId]);

            $insertVariantStmt = $pdo->prepare(
                'INSERT INTO product_variants (product_id, name, price, stock, image_url)
                 VALUES (?, ?, ?, ?, ?)'
            );

            foreach ($normalizedVariants as $variant) {
                $insertVariantStmt->execute([
                    $productId,
                    $variant['name'],
                    $variant['price'],
                    $variant['stock'],
                    $variant['image'],
                ]);
            }
        }

        $pdo->commit();

        $product = fetchProductById($pdo, $productId);
        jsonResponse($product ?? ['id' => $productId]);
    }

    if ($requestMethod === 'DELETE' && preg_match('#^/products/(\d+)$#', $requestPath, $matches)) {
        $productId = (int) $matches[1];

        $pdo->beginTransaction();

        $checkStmt = $pdo->prepare('SELECT id FROM products WHERE id = ? LIMIT 1');
        $checkStmt->execute([$productId]);
        if (!$checkStmt->fetch()) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Produk tidak ditemukan'], 404);
        }

        $deleteVariantStmt = $pdo->prepare('DELETE FROM product_variants WHERE product_id = ?');
        $deleteVariantStmt->execute([$productId]);

        $deleteProductStmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
        $deleteProductStmt->execute([$productId]);

        $pdo->commit();
        jsonResponse(['message' => 'Produk berhasil dihapus', 'id' => $productId]);
    }

    if ($requestMethod === 'DELETE' && preg_match('#^/categories/(.+)$#', $requestPath, $matches)) {
        $categoryName = urldecode($matches[1]);
        $categoryName = trim($categoryName);

        if ($categoryName === '') {
            jsonResponse(['error' => 'Nama kategori tidak valid'], 400);
        }

        $pdo->beginTransaction();

        $categoryStmt = $pdo->prepare('SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1');
        $categoryStmt->execute([$categoryName]);
        $category = $categoryStmt->fetch();
        if (!$category) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Kategori tidak ditemukan'], 404);
        }

        $categoryId = (int) $category['id'];
        $productStmt = $pdo->prepare('SELECT id FROM products WHERE category_id = ?');
        $productStmt->execute([$categoryId]);
        $productIds = array_map(static fn(array $row): int => (int) $row['id'], $productStmt->fetchAll() ?: []);

        if (count($productIds) > 0) {
            $placeholder = implode(',', array_fill(0, count($productIds), '?'));

            $deleteVariantStmt = $pdo->prepare("DELETE FROM product_variants WHERE product_id IN ($placeholder)");
            $deleteVariantStmt->execute($productIds);

            $deleteProductStmt = $pdo->prepare("DELETE FROM products WHERE id IN ($placeholder)");
            $deleteProductStmt->execute($productIds);
        }

        $deleteCategoryStmt = $pdo->prepare('DELETE FROM categories WHERE id = ?');
        $deleteCategoryStmt->execute([$categoryId]);

        $pdo->commit();

        jsonResponse([
            'message' => 'Kategori berhasil dihapus',
            'deletedCategory' => $category['name'],
            'deletedProducts' => count($productIds),
        ]);
    }

    if ($requestMethod === 'POST' && $requestPath === '/upload-image') {
        if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
            jsonResponse(['error' => 'File gambar wajib diisi'], 400);
        }

        $file = $_FILES['image'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            jsonResponse(['error' => 'Gagal upload gambar'], 400);
        }

        $tmpName = $file['tmp_name'] ?? '';
        $originalName = (string) ($file['name'] ?? 'image');
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

        if (!in_array($extension, $allowedExtensions, true)) {
            jsonResponse(['error' => 'Format gambar tidak didukung'], 400);
        }

        $targetDir = realpath(__DIR__ . '/../public/images');
        if ($targetDir === false) {
            jsonResponse(['error' => 'Folder target upload tidak ditemukan'], 500);
        }

        $safeBaseName = slugify(pathinfo($originalName, PATHINFO_FILENAME));
        if ($safeBaseName === '') {
            $safeBaseName = 'image';
        }

        $newFileName = $safeBaseName . '-' . time() . '-' . random_int(1000, 9999) . '.' . $extension;
        $targetPath = $targetDir . DIRECTORY_SEPARATOR . $newFileName;

        if (!move_uploaded_file($tmpName, $targetPath)) {
            jsonResponse(['error' => 'Gagal menyimpan gambar di server'], 500);
        }

        jsonResponse([
            'message' => 'Upload berhasil',
            'imageUrl' => '/images/' . $newFileName,
        ]);
    }

    if ($requestMethod === 'POST' && $requestPath === '/orders') {
        $payload = parseJsonBody();
        $items = $payload['items'] ?? null;
        $checkoutToken = isset($payload['checkoutToken']) ? (string) $payload['checkoutToken'] : null;
        $customer = is_array($payload['customer'] ?? null) ? $payload['customer'] : [];

        if (!is_array($items) || count($items) === 0) {
            jsonResponse(['error' => 'Item pesanan kosong'], 400);
        }

        $customerName = trim((string) ($customer['name'] ?? 'Guest'));
        $customerPhone = trim((string) ($customer['phone'] ?? 'guest'));
        $customerEmail = trim((string) ($customer['email'] ?? ''));
        $customerAddress = trim((string) ($customer['address'] ?? ''));

        $pdo->beginTransaction();

        $customerStmt = $pdo->prepare('SELECT id FROM customers WHERE phone = ? LIMIT 1');
        $customerStmt->execute([$customerPhone]);
        $customerRow = $customerStmt->fetch();

        if ($customerRow) {
            $customerId = (int) $customerRow['id'];
        } else {
            $insertCustomerStmt = $pdo->prepare('INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)');
            $insertCustomerStmt->execute([
                $customerName,
                $customerPhone,
                $customerEmail !== '' ? $customerEmail : null,
                $customerAddress !== '' ? $customerAddress : null,
            ]);
            $customerId = (int) $pdo->lastInsertId();
        }

        $totalAmount = 0;
        $normalizedItems = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $productId = (int) ($item['product_id'] ?? 0);
            $variantId = $item['variant_id'] ?? null;
            $variantId = $variantId === null || $variantId === '' ? null : (int) $variantId;
            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $price = max(0, (int) ($item['price'] ?? 0));
            $name = trim((string) ($item['name'] ?? 'Produk'));
            $variantName = trim((string) ($item['variant'] ?? ''));

            $subtotal = $price * $quantity;
            $totalAmount += $subtotal;

            $normalizedItems[] = [
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'price' => $price,
                'name' => $name,
                'variant' => $variantName !== '' ? $variantName : null,
                'subtotal' => $subtotal,
            ];
        }

        if (count($normalizedItems) === 0) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Item pesanan kosong'], 400);
        }

        $recentOrderStmt = $pdo->prepare(
            "SELECT id
             FROM orders
             WHERE customer_id = ?
               AND status = 'pending'
               AND total_amount = ?
               AND created_at >= (NOW() - INTERVAL 90 SECOND)
             ORDER BY id DESC
             LIMIT 1"
        );
        $recentOrderStmt->execute([$customerId, $totalAmount]);
        if ($recentOrderStmt->fetch()) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Duplicate checkout detected'], 409);
        }

        $orderNumber = createOrderNumber();
        $insertOrderStmt = $pdo->prepare(
            'INSERT INTO orders (order_number, customer_id, status, total_amount, notes) VALUES (?, ?, ?, ?, ?)'
        );
        $insertOrderStmt->execute([
            $orderNumber,
            $customerId,
            'pending',
            $totalAmount,
            $checkoutToken,
        ]);

        $orderId = (int) $pdo->lastInsertId();

        $insertItemStmt = $pdo->prepare(
            'INSERT INTO order_items
             (order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot, price_snapshot, quantity, subtotal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );

        foreach ($normalizedItems as $item) {
            $insertItemStmt->execute([
                $orderId,
                $item['product_id'],
                $item['variant_id'],
                $item['name'],
                $item['variant'],
                $item['price'],
                $item['quantity'],
                $item['subtotal'],
            ]);
        }

        $pdo->commit();
        jsonResponse(['message' => 'Order berhasil dibuat', 'orderId' => $orderId]);
    }

    if ($requestMethod === 'POST' && preg_match('#^/orders/(\d+)/confirm$#', $requestPath, $matches)) {
        $orderId = (int) $matches[1];
        $body = parseJsonBody();
        $token = $_GET['token'] ?? ($body['token'] ?? null);

        if (!is_string($token) || trim($token) === '') {
            jsonResponse(['error' => 'Token konfirmasi tidak valid'], 400);
        }
        $token = trim($token);

        $pdo->beginTransaction();

        $orderStmt = $pdo->prepare('SELECT id, status, notes FROM orders WHERE id = ? LIMIT 1');
        $orderStmt->execute([$orderId]);
        $order = $orderStmt->fetch();

        if (!$order) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Order tidak ditemukan'], 404);
        }

        if ($order['status'] !== 'pending') {
            $pdo->rollBack();
            jsonResponse(['error' => 'Order sudah dikonfirmasi atau dibatalkan'], 400);
        }

        if ((string) $order['notes'] !== $token) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Token konfirmasi tidak valid'], 400);
        }

        $itemStmt = $pdo->prepare('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?');
        $itemStmt->execute([$orderId]);
        $items = $itemStmt->fetchAll() ?: [];

        if (count($items) === 0) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Order tidak memiliki item'], 400);
        }

        $decVariantStmt = $pdo->prepare('UPDATE product_variants SET stock = GREATEST(stock - ?, 0) WHERE id = ?');
        $sumVariantStockStmt = $pdo->prepare('SELECT COALESCE(SUM(stock), 0) AS total_stock FROM product_variants WHERE product_id = ?');
        $updateProductStockStmt = $pdo->prepare('UPDATE products SET stock = ? WHERE id = ?');
        $decProductStockStmt = $pdo->prepare('UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?');

        foreach ($items as $item) {
            $productId = (int) $item['product_id'];
            $variantId = $item['variant_id'] === null ? null : (int) $item['variant_id'];
            $quantity = max(0, (int) $item['quantity']);

            if ($variantId !== null) {
                $decVariantStmt->execute([$quantity, $variantId]);

                $sumVariantStockStmt->execute([$productId]);
                $sumRow = $sumVariantStockStmt->fetch();
                $totalStock = $sumRow ? (int) $sumRow['total_stock'] : 0;
                $updateProductStockStmt->execute([$totalStock, $productId]);
            } else {
                $decProductStockStmt->execute([$quantity, $productId]);
            }
        }

        $confirmStmt = $pdo->prepare("UPDATE orders SET status = 'confirmed', notes = NULL WHERE id = ?");
        $confirmStmt->execute([$orderId]);

        $pdo->commit();
        jsonResponse(['message' => 'Order dikonfirmasi dan stok dikurangi']);
    }

    if ($requestMethod === 'GET' && $requestPath === '/orders') {
        $customerPhone = isset($_GET['customerPhone']) ? trim((string) $_GET['customerPhone']) : null;

        $whereSql = '';
        $params = [];
        if ($customerPhone !== null && $customerPhone !== '') {
            $whereSql = 'WHERE c.phone = ?';
            $params[] = $customerPhone;
        }

        $orderStmt = $pdo->prepare(
            "SELECT o.id, o.order_number, o.customer_id, o.status, o.total_amount, o.notes, o.created_at, o.updated_at,
                    c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.address AS customer_address
             FROM orders o
             INNER JOIN customers c ON c.id = o.customer_id
             $whereSql
             ORDER BY o.id DESC"
        );
        $orderStmt->execute($params);
        $orders = $orderStmt->fetchAll() ?: [];

        if (count($orders) === 0) {
            jsonResponse([]);
        }

        $orderIds = array_map(static fn(array $row): int => (int) $row['id'], $orders);
        $placeholder = implode(',', array_fill(0, count($orderIds), '?'));

        $itemStmt = $pdo->prepare(
            "SELECT id, order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot,
                    price_snapshot, quantity, subtotal, created_at, updated_at
             FROM order_items
             WHERE order_id IN ($placeholder)
             ORDER BY order_id ASC, id ASC"
        );
        $itemStmt->execute($orderIds);
        $items = $itemStmt->fetchAll() ?: [];

        $itemsByOrderId = [];
        foreach ($items as $item) {
            $orderId = (int) $item['order_id'];
            if (!isset($itemsByOrderId[$orderId])) {
                $itemsByOrderId[$orderId] = [];
            }

            $itemsByOrderId[$orderId][] = [
                'id' => (int) $item['id'],
                'order_id' => $orderId,
                'product_id' => (int) $item['product_id'],
                'variant_id' => $item['variant_id'] === null ? null : (int) $item['variant_id'],
                'product_name_snapshot' => $item['product_name_snapshot'],
                'variant_name_snapshot' => $item['variant_name_snapshot'],
                'price_snapshot' => (int) $item['price_snapshot'],
                'quantity' => (int) $item['quantity'],
                'subtotal' => (int) $item['subtotal'],
                'created_at' => $item['created_at'],
                'updated_at' => $item['updated_at'],
            ];
        }

        $response = [];
        foreach ($orders as $order) {
            $id = (int) $order['id'];
            $response[] = [
                'id' => $id,
                'order_number' => $order['order_number'],
                'customer_id' => (int) $order['customer_id'],
                'status' => $order['status'],
                'total_amount' => (int) $order['total_amount'],
                'notes' => $order['notes'],
                'created_at' => $order['created_at'],
                'updated_at' => $order['updated_at'],
                'customer_name' => $order['customer_name'],
                'customer_phone' => $order['customer_phone'],
                'customer_email' => $order['customer_email'],
                'customer_address' => $order['customer_address'],
                'items' => $itemsByOrderId[$id] ?? [],
            ];
        }

        jsonResponse($response);
    }

    jsonResponse(['error' => 'Endpoint tidak ditemukan'], 404);
} catch (PDOException $exception) {
    jsonResponse([
        'error' => 'Database error',
        'message' => $exception->getMessage(),
    ], 500);
} catch (Throwable $exception) {
    jsonResponse([
        'error' => 'Terjadi kesalahan pada server',
        'message' => $exception->getMessage(),
    ], 500);
}
