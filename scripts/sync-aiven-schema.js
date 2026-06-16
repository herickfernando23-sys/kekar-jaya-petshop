const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  base_price INT UNSIGNED NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_products_category_id (category_id),
  INDEX idx_products_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  price INT UNSIGNED NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  UNIQUE KEY uq_variant_name_per_product (product_id, name),
  INDEX idx_variants_product_id (product_id)
) ENGINE=InnoDB;
`;

const seedProducts = [
  {
    id: 6,
    category_id: 1,
    name: 'WHISKAS Junior',
    slug: 'whiskas-junior',
    description: 'Makanan khusus untuk anak kucing dengan nutrisi lengkap',
    base_price: 70000,
    stock: 30,
    image_url: '/images/whiskas.jpg',
    is_active: 1,
  },
  {
    id: 7,
    category_id: 1,
    name: 'Furlove',
    slug: 'furlove',
    description: 'Makanan premium untuk kucing dewasa',
    base_price: 15000,
    stock: 40,
    image_url: '/images/furlove.jpg',
    is_active: 1,
  },
  {
    id: 8,
    category_id: 1,
    name: 'Cat Choize',
    slug: 'cat-choize',
    description: 'Makanan kucing dengan protein berkualitas tinggi',
    base_price: 15500,
    stock: 35,
    image_url: '/images/catchoize.jpg',
    is_active: 1,
  },
  {
    id: 9,
    category_id: 1,
    name: 'Excel Chicken Tuna',
    slug: 'excel-chicken-tuna',
    description: 'Makanan kucing ayam dan tuna dengan vitamin mineral',
    base_price: 15000,
    stock: 28,
    image_url: '/images/excel.jpg',
    is_active: 1,
  },
  {
    id: 10,
    category_id: 1,
    name: 'Bolt Cat',
    slug: 'bolt-cat',
    description: 'Makanan kucing tuna dengan taurin untuk mata sehat',
    base_price: 24500,
    stock: 20,
    image_url: '/images/bolt.jpg',
    is_active: 1,
  },
  {
    id: 11,
    category_id: 1,
    name: 'Felibite',
    slug: 'felibite',
    description: 'Makanan kucing dengan omega 3 & 6',
    base_price: 15000,
    stock: 32,
    image_url: '/images/felibite.jpg',
    is_active: 1,
  },
  {
    id: 12,
    category_id: 1,
    name: 'Me-O Persian Adult',
    slug: 'me-o-persian-adult',
    description: 'Makanan kering untuk kucing persia dewasa',
    base_price: 60000,
    stock: 18,
    image_url: '/images/Me-o.jpg',
    is_active: 1,
  },
  {
    id: 13,
    category_id: 1,
    name: 'Lifecat',
    slug: 'lifecat',
    description: 'Makanan kucing dengan daging asli',
    base_price: 18000,
    stock: 25,
    image_url: '/images/lifecat.jpg',
    is_active: 1,
  },
  {
    id: 14,
    category_id: 1,
    name: 'Markotops',
    slug: 'markotops',
    description: 'Makanan kucing daging lembut dengan kuah',
    base_price: 18000,
    stock: 22,
    image_url: '/images/markotops.jpg',
    is_active: 1,
  },
  {
    id: 15,
    category_id: 1,
    name: 'Chester Tuna',
    slug: 'chester-tuna',
    description: 'Makanan kucing rasa tuna lezat',
    base_price: 23000,
    stock: 19,
    image_url: '/images/chester.jpg',
    is_active: 1,
  },
  {
    id: 16,
    category_id: 1,
    name: 'Beauty Premium Cat Food',
    slug: 'beauty-premium-cat-food',
    description: 'Makanan kucing premium untuk kecantikan bulu',
    base_price: 35000,
    stock: 15,
    image_url: '/images/beauty.jpg',
    is_active: 1,
  },
  {
    id: 17,
    category_id: 1,
    name: 'Me-O Wet Cat Food',
    slug: 'me-o-wet-cat-food',
    description: 'Makanan kucing basah rasa ikan',
    base_price: 8000,
    stock: 50,
    image_url: '/images/me-obasah.jpg',
    is_active: 1,
  },
  {
    id: 18,
    category_id: 1,
    name: 'Life Cat Tuna Kitten',
    slug: 'life-cat-tuna-kitten',
    description: 'Makanan basah untuk anak kucing',
    base_price: 7000,
    stock: 45,
    image_url: '/images/lifecatwet.jpg',
    is_active: 1,
  },
  {
    id: 19,
    category_id: 1,
    name: 'Crystal Kitty',
    slug: 'crystal-kitty',
    description: 'Makanan kucing dengan kandungan air seimbang',
    base_price: 16000,
    stock: 30,
    image_url: '/images/crystal.jpg',
    is_active: 1,
  },
  {
    id: 20,
    category_id: 1,
    name: 'Lezato Tuna',
    slug: 'lezato-tuna',
    description: 'Makanan kucing tuna berkualitas',
    base_price: 25000,
    stock: 21,
    image_url: '/images/lezato.jpg',
    is_active: 1,
  },
  {
    id: 21,
    category_id: 1,
    name: 'Pet Choice',
    slug: 'pet-choice',
    description: 'Makanan kucing dengan asam lemak esensial',
    base_price: 11000,
    stock: 38,
    image_url: '/images/petchoice.jpg',
    is_active: 1,
  },
  {
    id: 22,
    category_id: 2,
    name: 'Pasir Kucing CatLike',
    slug: 'pasir-kucing-catlike',
    description: 'Pasir kucing bentonite premium organik 25L',
    base_price: 100000,
    stock: 5,
    image_url: '/images/catlike.jpg',
    is_active: 1,
  },
  {
    id: 23,
    category_id: 2,
    name: 'Pasir Kucing Napping Cat',
    slug: 'pasir-kucing-napping-cat',
    description: 'Pasir gumpal premium dengan aroma wangi',
    base_price: 30000,
    stock: 16,
    image_url: '/images/napping cat.jpg',
    is_active: 1,
  },
  {
    id: 24,
    category_id: 2,
    name: 'Grand Panda Pasir',
    slug: 'grand-panda-pasir',
    description: 'Pasir gumpal premium 5L dengan daya serap tinggi',
    base_price: 37700,
    stock: 14,
    image_url: '/images/grandpanda.jpg',
    is_active: 1,
  },
  {
    id: 25,
    category_id: 2,
    name: 'Markotops Pasir Kucing',
    slug: 'markotops-pasir-kucing',
    description: 'Pasir bentonite 25L dengan daya gumpal kuat',
    base_price: 145000,
    stock: 3,
    image_url: '/images/markotopspasir.jpg',
    is_active: 1,
  },
  {
    id: 26,
    category_id: 2,
    name: 'Bentonite Cat Litter',
    slug: 'bentonite-cat-litter',
    description: 'Pasir kucing minim debu dan tidak lengket',
    base_price: 40000,
    stock: 11,
    image_url: '/images/bentonitecat.jpg',
    is_active: 1,
  },
  {
    id: 27,
    category_id: 2,
    name: 'Meowpets Cat Litter',
    slug: 'meowpets-cat-litter',
    description: 'Pasir kucing dengan butiran aromatik',
    base_price: 135000,
    stock: 2,
    image_url: '/images/meowpets.jpg',
    is_active: 1,
  },
  {
    id: 28,
    category_id: 2,
    name: 'Taro Aqua Fresh',
    slug: 'taro-aqua-fresh',
    description: 'Pasir bentonite 25L dengan daya serap instan',
    base_price: 105000,
    stock: 4,
    image_url: '/images/taro.jpg',
    is_active: 1,
  },
  {
    id: 29,
    category_id: 3,
    name: 'Bak Pasir Kucing Plastik',
    slug: 'bak-pasir-kucing-plastik',
    description: 'Wadah pasir plastik tebal berbagai ukuran',
    base_price: 30000,
    stock: 20,
    image_url: '/images/kandang1.jpg',
    is_active: 1,
  },
  {
    id: 30,
    category_id: 3,
    name: 'Kandang Besi Lipat Large',
    slug: 'kandang-besi-lipat-large',
    description: 'Kandang kawat lipat kokoh anti karat',
    base_price: 230000,
    stock: 6,
    image_url: '/images/kandang2.jpg',
    is_active: 1,
  },
  {
    id: 31,
    category_id: 3,
    name: 'Kandang Besi Portabel',
    slug: 'kandang-besi-portabel',
    description: 'Kandang ringkas ideal untuk anak kucing',
    base_price: 110000,
    stock: 9,
    image_url: '/images/kandang3.jpg',
    is_active: 1,
  },
];

const seedVariants = [
  { product_id: 6, name: 'Whiskas Junior Rasa Ikan Laut', price: 70000, stock: 12, image_url: '/images/whiskas.jpg' },
  { product_id: 6, name: 'Whiskas Junior Mackerel Flavor', price: 70000, stock: 8, image_url: '/images/whiskasmackarel.jpg' },
  { product_id: 6, name: 'Whiskas Junior Tuna & Salmon Flavour', price: 70000, stock: 10, image_url: '/images/whiskastuna.jpg' },
  { product_id: 7, name: 'Furlove (kaleng)', price: 15000, stock: 20, image_url: '/images/furlove.jpg' },
  { product_id: 7, name: 'Furlove Tuna dry cat food', price: 28500, stock: 20, image_url: '/images/furlovedry.jpg' },
  { product_id: 8, name: 'Tuna Flavor', price: 15500, stock: 9, image_url: '/images/catchoize.jpg' },
  { product_id: 8, name: 'Tuna with Milk (dry)', price: 30000, stock: 8, image_url: '/images/catchoize2.jpg' },
  { product_id: 8, name: 'Cat Choize Adult Cat Dry Food Tuna', price: 21000, stock: 9, image_url: '/images/catchoizetuna.jpg' },
  { product_id: 8, name: 'Cat Choize Kitten Salmon with Milk (dry)', price: 33000, stock: 9, image_url: '/images/catchoizesalmon.jpg' },
  { product_id: 10, name: 'Bolt Cat Tuna', price: 24500, stock: 7, image_url: '/images/bolt.jpg' },
  { product_id: 10, name: 'Bolt Cat Salmon', price: 24500, stock: 7, image_url: '/images/bolttuna.jpg' },
  { product_id: 10, name: 'Bolt Cat Salmon Kitten', price: 16000, stock: 6, image_url: '/images/boltkitten.jpg' },
  { product_id: 29, name: 'Ukuran Kecil', price: 30000, stock: 7, image_url: '/images/kandang1.jpg' },
  { product_id: 29, name: 'Ukuran Sedang', price: 40000, stock: 7, image_url: '/images/kandang1.jpg' },
  { product_id: 29, name: 'Ukuran Besar', price: 50000, stock: 6, image_url: '/images/kandang1.jpg' },
];

const categories = [
  { name: 'Makanan Kucing', slug: 'makanan-kucing' },
  { name: 'Pasir Kucing', slug: 'pasir-kucing' },
  { name: 'Kandang Kucing', slug: 'kandang-kucing' },
];

async function createPool() {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.JAWSDB_URL || '';

  if (databaseUrl) {
    const parsedUrl = new URL(databaseUrl);
    return mysql.createPool({
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port || 3306),
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: decodeURIComponent(parsedUrl.pathname.replace(/^\//, '')),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : undefined,
    });
  }

  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kekar_jaya_petshop',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : undefined,
  });
}

async function run() {
  const pool = await createPool();
  const connection = await pool.getConnection();

  try {
    console.log('🔎 Checking database connection...');
    await connection.query('SELECT 1');

    console.log('✅ Connection OK');

    console.log('🛠️ Ensuring schema exists...');
    await connection.query(SCHEMA);

    console.log('✅ Tables created or already exist');

    console.log('🧹 Disabling foreign key checks');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('🔁 Synchronizing categories...');
    for (const category of categories) {
      await connection.query(
        `INSERT INTO categories (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE slug = VALUES(slug)`,
        [category.name, category.slug]
      );
    }

    console.log('✅ Categories synchronized');

    console.log('🔁 Synchronizing products...');
    for (const product of seedProducts) {
      await connection.query(
        `INSERT INTO products (id, category_id, name, slug, description, base_price, stock, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           category_id = VALUES(category_id),
           name = VALUES(name),
           slug = VALUES(slug),
           description = VALUES(description),
           base_price = VALUES(base_price),
           stock = VALUES(stock),
           image_url = VALUES(image_url),
           is_active = VALUES(is_active)`,
        [product.id, product.category_id, product.name, product.slug, product.description, product.base_price, product.stock, product.image_url, product.is_active]
      );
    }

    console.log('✅ Products synchronized');

    console.log('🔁 Synchronizing product variants...');
    for (const variant of seedVariants) {
      await connection.query(
        `INSERT INTO product_variants (product_id, name, price, stock, image_url)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE price = VALUES(price), stock = VALUES(stock), image_url = VALUES(image_url)`,
        [variant.product_id, variant.name, variant.price, variant.stock, variant.image_url]
      );
    }

    console.log('✅ Product variants synchronized');

    console.log('🔁 Checking categories & products counts...');
    const [categoryCount] = await connection.query('SELECT COUNT(*) AS count FROM categories');
    const [productCount] = await connection.query('SELECT COUNT(*) AS count FROM products');
    const [variantCount] = await connection.query('SELECT COUNT(*) AS count FROM product_variants');

    console.log(`📊 categories=${categoryCount[0].count} products=${productCount[0].count} variants=${variantCount[0].count}`);

    console.log('🔁 Re-enabling foreign key checks');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🎉 Database schema and data synchronized successfully');
  } catch (error) {
    console.error('❌ Failed to sync Aiven schema:', error);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

run();
