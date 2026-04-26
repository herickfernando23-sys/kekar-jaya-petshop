# MySQL Setup (KEKAR JAYA)

## 1) Install MySQL
Install MySQL Server 8.x and MySQL Client so command `mysql` is available.

## 2) Create schema and seed data
Run from project folder:

```powershell
mysql -u root -p < database/mysql/01_schema.sql
mysql -u root -p < database/mysql/02_seed.sql
```

## 3) Quick checks

```sql
USE kekar_jaya_petshop;
SHOW TABLES;
SELECT id, name, base_price, stock FROM products ORDER BY id;
SELECT product_id, name, price, stock FROM product_variants ORDER BY product_id, id;
```

## 4) Suggested next integration
- Replace localStorage product source with API endpoint from backend.
- Start with endpoints:
  - `GET /api/categories`
  - `GET /api/products?category=&search=&page=`
  - `POST /api/orders`
- Keep admin authentication using hashed password (bcrypt).

## Notes
- Current seed is a starter subset from frontend data.
- Add the rest of products gradually or by import script.
