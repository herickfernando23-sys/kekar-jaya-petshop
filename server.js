const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const path = require('path');
const PORT = process.env.PORT || 5000;

const slugify = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const getNextAvailableCategoryId = async (connection) => {
  const [rows] = await connection.query('SELECT id FROM categories ORDER BY id ASC');
  let nextId = 1;

  for (const row of rows) {
    const currentId = Number(row.id);
    if (currentId !== nextId) {
      break;
    }
    nextId += 1;
  }

  return nextId;
};

const ensureCategoryId = async (connection, categoryName) => {
  const cleanCategory = typeof categoryName === 'string' && categoryName.trim()
    ? categoryName.trim()
    : 'Makanan Kucing';

  const [categoryRows] = await connection.query(
    'SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [cleanCategory]
  );

  if (categoryRows.length > 0) {
    return categoryRows[0].id;
  }

  const nextCategoryId = await getNextAvailableCategoryId(connection);
  const categorySlugBase = slugify(cleanCategory) || `kategori-${Date.now()}`;
  let categorySlug = categorySlugBase;
  let suffix = 1;
  while (true) {
    const [slugRows] = await connection.query(
      'SELECT id FROM categories WHERE slug = ? LIMIT 1',
      [categorySlug]
    );
    if (slugRows.length === 0) break;
    suffix += 1;
    categorySlug = `${categorySlugBase}-${suffix}`;
  }

  const [insertCategoryResult] = await connection.query(
    'INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)',
    [nextCategoryId, cleanCategory, categorySlug]
  );

  return insertCategoryResult.insertId;
};

// Middleware
app.use(cors());
app.use(express.json());
// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Upload image endpoint
const uploadImageRouter = require('./upload-image');
app.use(uploadImageRouter);

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kekar_jaya_petshop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API running ✅', timestamp: new Date() });
});

// GET /products - Fetch all products with variants
app.get('/products', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Fetch all products
    const [products] = await connection.query(`
      SELECT p.id, p.category_id, c.name AS category_name, p.name, p.slug, p.description, p.base_price, p.stock, p.image_url, p.is_active
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
      ORDER BY p.id ASC
    `);

    // Fetch all variants grouped by product_id
    const [variants] = await connection.query(`
      SELECT id, product_id, name, price, stock, image_url
      FROM product_variants
      ORDER BY product_id, id ASC
    `);

    // Map variants into products
    const variantsByProduct = {};
    variants.forEach((variant) => {
      if (!variantsByProduct[variant.product_id]) {
        variantsByProduct[variant.product_id] = [];
      }
      variantsByProduct[variant.product_id].push({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        stock: variant.stock,
        image_url: variant.image_url,
      });
    });

    const productsWithVariants = products.map((product) => ({
      ...product,
      variants: variantsByProduct[product.id] || [],
    }));

    connection.release();

    res.json(productsWithVariants);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
});

// GET /categories - Fetch all categories
app.get('/categories', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [categories] = await connection.query(`
      SELECT id, name, slug
      FROM categories
      ORDER BY id ASC
    `);
    connection.release();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Gagal mengambil data kategori' });
  }
});

// GET /products/:id - Fetch single product with variants
app.get('/products/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.is_active = 1`,
      [req.params.id]
    );

    if (products.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const product = products[0];

    const [variants] = await connection.query(
      'SELECT id, name, price, stock, image_url FROM product_variants WHERE product_id = ? ORDER BY id ASC',
      [product.id]
    );

    connection.release();

    res.json({
      ...product,
      variants,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
});

// POST /products - Create a new product and persist to MySQL
app.post('/products', async (req, res) => {
  const { name, category, price, stock, description, image } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Nama produk wajib diisi' });
  }

  const cleanName = name.trim();
  const cleanCategory = typeof category === 'string' && category.trim()
    ? category.trim()
    : 'Makanan Kucing';
  const cleanDescription = typeof description === 'string' && description.trim()
    ? description.trim()
    : 'Produk baru dari admin';
  const cleanImage = typeof image === 'string' && image.trim()
    ? image.trim()
    : '/images/whiskas.jpg';
  const cleanPrice = Math.max(0, Number(price) || 0);
  const cleanStock = Math.max(0, Number(stock) || 0);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const categoryId = await ensureCategoryId(connection, cleanCategory);

    const productSlugBase = slugify(cleanName) || `produk-${Date.now()}`;
    let productSlug = productSlugBase;
    let productSuffix = 1;
    while (true) {
      const [slugRows] = await connection.query(
        'SELECT id FROM products WHERE slug = ? LIMIT 1',
        [productSlug]
      );
      if (slugRows.length === 0) break;
      productSuffix += 1;
      productSlug = `${productSlugBase}-${productSuffix}`;
    }

    const [insertProductResult] = await connection.query(
      `INSERT INTO products (category_id, name, slug, description, base_price, stock, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [categoryId, cleanName, productSlug, cleanDescription, cleanPrice, cleanStock, cleanImage]
    );

    const createdProductId = insertProductResult.insertId;

    const [createdRows] = await connection.query(
      `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.slug, p.description, p.base_price, p.stock, p.image_url, p.is_active
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? LIMIT 1`,
      [createdProductId]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({
      ...createdRows[0],
      variants: [],
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      connection.release();
    }

    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Gagal menambahkan produk' });
  }
});

// PUT /products/:id - Update product data (and variants) in MySQL
app.put('/products/:id', async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'ID produk tidak valid' });
  }

  const {
    name,
    category,
    price,
    stock,
    description,
    image,
    variants,
  } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Nama produk wajib diisi' });
  }

  const cleanName = name.trim();
  const cleanCategory = typeof category === 'string' && category.trim()
    ? category.trim()
    : 'Makanan Kucing';
  const cleanDescription = typeof description === 'string' && description.trim()
    ? description.trim()
    : 'Produk dari admin';
  const cleanImage = typeof image === 'string' && image.trim()
    ? image.trim()
    : '/images/whiskas.jpg';
  const cleanStock = Math.max(0, Number(stock) || 0);

  const normalizedVariants = Array.isArray(variants)
    ? variants
        .map((variant) => ({
          name: typeof variant?.name === 'string' ? variant.name.trim() : '',
          price: Math.max(0, Number(variant?.price) || 0),
          stock: Math.max(0, Number(variant?.stock) || 0),
          image: typeof variant?.image === 'string' && variant.image.trim()
            ? variant.image.trim()
            : cleanImage,
        }))
        .filter((variant) => variant.name)
    : null;

  const finalPrice = normalizedVariants && normalizedVariants.length > 0
    ? normalizedVariants[0].price
    : Math.max(0, Number(price) || 0);
  const finalStock = cleanStock;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [productRows] = await connection.query(
      'SELECT id FROM products WHERE id = ? LIMIT 1',
      [productId]
    );

    if (productRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    const categoryId = await ensureCategoryId(connection, cleanCategory);

    await connection.query(
      `UPDATE products
       SET category_id = ?, name = ?, description = ?, base_price = ?, stock = ?, image_url = ?
       WHERE id = ?`,
      [categoryId, cleanName, cleanDescription, finalPrice, finalStock, cleanImage, productId]
    );

    if (normalizedVariants !== null) {
      await connection.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);

      for (const variant of normalizedVariants) {
        await connection.query(
          `INSERT INTO product_variants (product_id, name, price, stock, image_url)
           VALUES (?, ?, ?, ?, ?)`,
          [productId, variant.name, variant.price, variant.stock, variant.image]
        );
      }
    }

    const [updatedRows] = await connection.query(
      `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.slug, p.description, p.base_price, p.stock, p.image_url, p.is_active
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? LIMIT 1`,
      [productId]
    );

    const [updatedVariants] = await connection.query(
      'SELECT id, name, price, stock, image_url FROM product_variants WHERE product_id = ? ORDER BY id ASC',
      [productId]
    );

    await connection.commit();
    connection.release();

    return res.json({
      ...updatedRows[0],
      variants: updatedVariants,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back product update:', rollbackError);
      }
      connection.release();
    }

    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Gagal menyimpan perubahan produk' });
  }
});

// DELETE /products/:id - Hard delete product and its variants
app.delete('/products/:id', async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'ID produk tidak valid' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Cari category_id produk sebelum dihapus
    const [productRows] = await connection.query('SELECT category_id FROM products WHERE id = ?', [productId]);
    if (productRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    const categoryId = productRows[0].category_id;

    // Remove variants first to avoid foreign key conflicts.
    await connection.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);

    const [result] = await connection.query(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    // Setelah hapus produk, cek apakah masih ada produk lain dengan kategori tsb
    const [remainingProducts] = await connection.query('SELECT id FROM products WHERE category_id = ?', [categoryId]);
    if (remainingProducts.length === 0) {
      // Tidak ada produk lain, hapus kategori
      await connection.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    }

    await connection.commit();
    connection.release();

    return res.json({ message: 'Produk berhasil dihapus', id: productId });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back delete transaction:', rollbackError);
      }
      connection.release();
    }
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Gagal menghapus produk' });
  }
});

// DELETE /categories/:name - Delete category and all products in that category
app.delete('/categories/:name', async (req, res) => {
  const categoryName = decodeURIComponent(req.params.name || '').trim();

  if (!categoryName) {
    return res.status(400).json({ error: 'Nama kategori tidak valid' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [categoryRows] = await connection.query(
      'SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [categoryName]
    );

    if (categoryRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    const targetCategoryId = categoryRows[0].id;
    const targetCategoryName = categoryRows[0].name;

    const [productsInCategory] = await connection.query(
      'SELECT id FROM products WHERE category_id = ?',
      [targetCategoryId]
    );

    const productIds = productsInCategory.map((item) => item.id);

    if (productIds.length > 0) {
      // Remove variants first. Product deletion can still fail if blocked by other FK constraints (e.g. order_items).
      await connection.query('DELETE FROM product_variants WHERE product_id IN (?)', [productIds]);
      await connection.query('DELETE FROM products WHERE id IN (?)', [productIds]);
    }

    await connection.query('DELETE FROM categories WHERE id = ?', [targetCategoryId]);

    await connection.commit();
    connection.release();

    return res.json({
      message: 'Kategori berhasil dihapus',
      deletedCategory: targetCategoryName,
      deletedProducts: productIds.length,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back category deletion:', rollbackError);
      }
      connection.release();
    }
    console.error('Error deleting category:', error);
    return res.status(500).json({ error: 'Gagal menghapus kategori' });
  }
});

// POST /products/:id/restore - Restore soft-deleted product (set is_active = 1)
app.post('/products/:id/restore', async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'ID produk tidak valid' });
  }

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE products SET is_active = 1 WHERE id = ? AND is_active = 0',
      [productId]
    );

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Produk tidak ditemukan atau tidak dalam status terhapus' });
    }

    const [rows] = await connection.query(
      `SELECT p.id, p.category_id, c.name AS category_name, p.name, p.slug, p.description, p.base_price, p.stock, p.image_url, p.is_active
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? LIMIT 1`,
      [productId]
    );
    connection.release();

    return res.json({
      message: 'Produk berhasil dipulihkan',
      product: {
        ...rows[0],
        variants: [],
      },
    });
  } catch (error) {
    console.error('Error restoring product:', error);
    return res.status(500).json({ error: 'Gagal memulihkan produk' });
  }
});

// POST /orders - Create order (placeholder)
app.use(express.json());
app.post('/orders', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { items, checkoutToken, customer } = req.body;
    // customer: { name, phone, email, address } (optional, for future)
    if (!Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Item pesanan kosong' });
    }

    // Dummy customer (karena frontend belum kirim data customer)
    let customerId = null;
    const defaultCustomer = { name: 'Guest', phone: 'guest', email: null, address: null };
    const cust = customer || defaultCustomer;
    // Cari customer by phone, jika tidak ada insert
    const [custRows] = await connection.query('SELECT id FROM customers WHERE phone = ? LIMIT 1', [cust.phone]);
    if (custRows.length > 0) {
      customerId = custRows[0].id;
    } else {
      const [custResult] = await connection.query(
        'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
        [cust.name, cust.phone, cust.email, cust.address]
      );
      customerId = custResult.insertId;
    }

    // Hitung total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (item.price || 0) * (item.quantity || 0);
    }

    // Generate order_number unik
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random()*10000)}`;

    // Insert order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (order_number, customer_id, status, total_amount, notes) VALUES (?, ?, ?, ?, ?)',
      [orderNumber, customerId, 'pending', totalAmount, checkoutToken || null]
    );
    const orderId = orderResult.insertId;

    // Insert order_items
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items 
          (order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot, price_snapshot, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.variant_id || null,
          item.name,
          item.variant || null,
          item.price,
          item.quantity,
          (item.price || 0) * (item.quantity || 0)
        ]
      );
    }

    await connection.commit();
    connection.release();
    res.json({ message: 'Order berhasil dibuat', orderId });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Gagal membuat pesanan' });
  }
});

// POST /orders/:id/confirm - Konfirmasi order dan kurangi stok produk/varian
app.post('/orders/:id/confirm', async (req, res) => {
  const orderId = Number(req.params.id);
  const tokenFromQuery = req.query.token || req.body.token || null;
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'ID order tidak valid' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Ambil order dan cek status/token
    const [orderRows] = await connection.query('SELECT id, status, notes FROM orders WHERE id = ? LIMIT 1', [orderId]);
    if (orderRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }
    const order = orderRows[0];
    const orderToken = order.notes;
    if (order.status !== 'pending') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Order sudah dikonfirmasi atau dibatalkan' });
    }
    if (!tokenFromQuery || tokenFromQuery !== orderToken) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Token konfirmasi tidak valid' });
    }

    // Ambil semua item order
    const [items] = await connection.query(
      'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );
    if (items.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Order tidak ditemukan atau tidak ada item' });
    }

    // Kurangi stok produk/varian
    for (const item of items) {
      if (item.variant_id) {
        // Kurangi stok varian
        await connection.query(
          'UPDATE product_variants SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
          [item.quantity, item.variant_id]
        );

        // Sinkronkan stok total produk utama agar tampilan katalog tetap akurat.
        const [totalRows] = await connection.query(
          'SELECT COALESCE(SUM(stock), 0) AS total_stock FROM product_variants WHERE product_id = ? LIMIT 1',
          [item.product_id]
        );
        const totalStock = Number(totalRows?.[0]?.total_stock) || 0;
        await connection.query(
          'UPDATE products SET stock = ? WHERE id = ?',
          [totalStock, item.product_id]
        );
      } else {
        // Kurangi stok produk utama
        await connection.query(
          'UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    // Update status order dan kosongkan token
    await connection.query(
      "UPDATE orders SET status = 'confirmed', notes = NULL WHERE id = ?",
      [orderId]
    );

    await connection.commit();
    connection.release();
    res.json({ message: 'Order dikonfirmasi dan stok dikurangi' });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch {}
      connection.release();
    }
    console.error('Error confirm order:', error);
    res.status(500).json({ error: 'Gagal konfirmasi order' });
  }
});

// DELETE /orders/:id - Hapus order pending dengan token yang cocok
app.delete('/orders/:id', async (req, res) => {
  const orderId = Number(req.params.id);
  const tokenFromQuery = req.query.token || req.body.token || null;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: 'ID order tidak valid' });
  }

  if (!tokenFromQuery || typeof tokenFromQuery !== 'string' || !tokenFromQuery.trim()) {
    return res.status(400).json({ error: 'Token hapus tidak valid' });
  }

  const token = tokenFromQuery.trim();
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [orderRows] = await connection.query('SELECT id, status, notes FROM orders WHERE id = ? LIMIT 1', [orderId]);
    if (orderRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Order tidak ditemukan' });
    }

    const order = orderRows[0];
    if (order.status !== 'pending') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Hanya order pending yang bisa dihapus' });
    }

    if (!order.notes || String(order.notes) !== token) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Token hapus tidak valid' });
    }

    await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await connection.query('DELETE FROM orders WHERE id = ?', [orderId]);

    await connection.commit();
    connection.release();
    return res.json({ message: 'Order pending berhasil dihapus' });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch {}
      connection.release();
    }
    console.error('Error deleting order:', error);
    return res.status(500).json({ error: 'Gagal menghapus order' });
  }
});

// GET /orders?customerPhone=... - Ambil semua order milik customer tertentu
app.get('/orders', async (req, res) => {
  const customerPhone = req.query.customerPhone;
  let connection;
  try {
    connection = await pool.getConnection();
    const whereClause = customerPhone ? 'WHERE c.phone = ?' : '';
    const queryParams = customerPhone ? [customerPhone] : [];

    const [orders] = await connection.query(
      `SELECT
         o.id,
         o.order_number,
         o.customer_id,
         o.status,
         o.total_amount,
         o.notes,
         o.created_at,
         o.updated_at,
         c.name AS customer_name,
         c.phone AS customer_phone,
         c.email AS customer_email,
         c.address AS customer_address
       FROM orders o
       INNER JOIN customers c ON c.id = o.customer_id
       ${whereClause}
       ORDER BY o.id DESC`,
      queryParams
    );

    if (orders.length === 0) {
      connection.release();
      return res.json([]);
    }

    const orderIds = orders.map((order) => order.id);
    const [items] = await connection.query(
      `SELECT
         id,
         order_id,
         product_id,
         variant_id,
         product_name_snapshot,
         variant_name_snapshot,
         price_snapshot,
         quantity,
         subtotal,
         created_at,
         updated_at
       FROM order_items
       WHERE order_id IN (?)
       ORDER BY order_id ASC, id ASC`,
      [orderIds]
    );

    const itemsByOrderId = new Map();
    items.forEach((item) => {
      const currentItems = itemsByOrderId.get(item.order_id) || [];
      currentItems.push(item);
      itemsByOrderId.set(item.order_id, currentItems);
    });

    const responseOrders = orders.map((order) => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));

    connection.release();
    res.json(responseOrders);
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: 'Gagal mengambil data order' });
  }
});

// Global error handler to avoid process crash on malformed JSON body.
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ error: 'Format JSON tidak valid' });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 KEKAR JAYA Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Products endpoint: http://localhost:${PORT}/products\n`);
});
