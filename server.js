const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const slugify = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

// Middleware
app.use(cors());
app.use(express.json());

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
      SELECT id, category_id, name, slug, description, base_price, stock, image_url, is_active
      FROM products
      WHERE is_active = 1
      ORDER BY id ASC
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
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
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

    let categoryId;
    const [categoryRows] = await connection.query(
      'SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [cleanCategory]
    );

    if (categoryRows.length > 0) {
      categoryId = categoryRows[0].id;
    } else {
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
        'INSERT INTO categories (name, slug) VALUES (?, ?)',
        [cleanCategory, categorySlug]
      );
      categoryId = insertCategoryResult.insertId;
    }

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

    // Remove variants first to avoid foreign key conflicts.
    await connection.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);

    const [result] = await connection.query(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
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
app.post('/orders', async (req, res) => {
  try {
    // Implement later
    res.json({ message: 'Order endpoint - WIP' });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Gagal membuat pesanan' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 KEKAR JAYA Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Products endpoint: http://localhost:${PORT}/products\n`);
});
