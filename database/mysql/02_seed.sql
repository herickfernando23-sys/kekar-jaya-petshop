USE kekar_jaya_petshop;

-- Default admin user
-- IMPORTANT: replace password_hash with your real bcrypt hash in production.
INSERT INTO admins (username, full_name, password_hash)
VALUES ('admin', 'Administrator', '$2b$10$replace_this_with_real_bcrypt_hash')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash);

INSERT INTO categories (name, slug)
VALUES
  ('Makanan Kucing', 'makanan-kucing'),
  ('Pasir Kucing', 'pasir-kucing'),
  ('Kandang Kucing', 'kandang-kucing')
ON DUPLICATE KEY UPDATE
  name = VALUES(name);

-- All 31 Products from frontend
INSERT INTO products (id, category_id, name, slug, description, base_price, stock, image_url)
VALUES
  (6, 1, 'WHISKAS Junior', 'whiskas-junior', 'Makanan khusus untuk anak kucing dengan nutrisi lengkap', 70000, 30, '/images/whiskas.jpg'),
  (7, 1, 'Furlove', 'furlove', 'Makanan premium untuk kucing dewasa', 15000, 40, '/images/furlove.jpg'),
  (8, 1, 'Cat Choize', 'cat-choize', 'Makanan kucing dengan protein berkualitas tinggi', 15500, 35, '/images/catchoize.jpg'),
  (9, 1, 'Excel Chicken Tuna', 'excel-chicken-tuna', 'Makanan kucing ayam dan tuna dengan vitamin mineral', 15000, 28, '/images/excel.jpg'),
  (10, 1, 'Bolt Cat', 'bolt-cat', 'Makanan kucing tuna dengan taurin untuk mata sehat', 24500, 20, '/images/bolt.jpg'),
  (11, 1, 'Felibite', 'felibite', 'Makanan kucing dengan omega 3 & 6', 15000, 32, '/images/felibite.jpg'),
  (12, 1, 'Me-O Persian Adult', 'me-o-persian-adult', 'Makanan kering untuk kucing persia dewasa', 60000, 18, '/images/Me-o.jpg'),
  (13, 1, 'Lifecat', 'lifecat', 'Makanan kucing dengan daging asli', 18000, 25, '/images/lifecat.jpg'),
  (14, 1, 'Markotops', 'markotops', 'Makanan kucing daging lembut dengan kuah', 18000, 22, '/images/markotops.jpg'),
  (15, 1, 'Chester Tuna', 'chester-tuna', 'Makanan kucing rasa tuna lezat', 23000, 19, '/images/chester.jpg'),
  (16, 1, 'Beauty Premium Cat Food', 'beauty-premium-cat-food', 'Makanan kucing premium untuk kecantikan bulu', 35000, 15, '/images/beauty.jpg'),
  (17, 1, 'Me-O Wet Cat Food', 'me-o-wet-cat-food', 'Makanan kucing basah rasa ikan', 8000, 50, '/images/me-obasah.jpg'),
  (18, 1, 'Life Cat Tuna Kitten', 'life-cat-tuna-kitten', 'Makanan basah untuk anak kucing', 7000, 45, '/images/lifecatwet.jpg'),
  (19, 1, 'Crystal Kitty', 'crystal-kitty', 'Makanan kucing dengan kandungan air seimbang', 16000, 30, '/images/crystal.jpg'),
  (20, 1, 'Lezato Tuna', 'lezato-tuna', 'Makanan kucing tuna berkualitas', 25000, 21, '/images/lezato.jpg'),
  (21, 1, 'Pet Choice', 'pet-choice', 'Makanan kucing dengan asam lemak esensial', 11000, 38, '/images/petchoice.jpg'),
  (22, 2, 'Pasir Kucing CatLike', 'pasir-kucing-catlike', 'Pasir kucing bentonite premium organik 25L', 100000, 5, '/images/catlike.jpg'),
  (23, 2, 'Pasir Kucing Napping Cat', 'pasir-kucing-napping-cat', 'Pasir gumpal premium dengan aroma wangi', 30000, 16, '/images/napping cat.jpg'),
  (24, 2, 'Grand Panda Pasir', 'grand-panda-pasir', 'Pasir gumpal premium 5L dengan daya serap tinggi', 37700, 14, '/images/grandpanda.jpg'),
  (25, 2, 'Markotops Pasir Kucing', 'markotops-pasir-kucing', 'Pasir bentonite 25L dengan daya gumpal kuat', 145000, 3, '/images/markotopspasir.jpg'),
  (26, 2, 'Bentonite Cat Litter', 'bentonite-cat-litter', 'Pasir kucing minim debu dan tidak lengket', 40000, 11, '/images/bentonitecat.jpg'),
  (27, 2, 'Meowpets Cat Litter', 'meowpets-cat-litter', 'Pasir kucing dengan butiran aromatik', 135000, 2, '/images/meowpets.jpg'),
  (28, 2, 'Taro Aqua Fresh', 'taro-aqua-fresh', 'Pasir bentonite 25L dengan daya serap instan', 105000, 4, '/images/taro.jpg'),
  (29, 3, 'Bak Pasir Kucing Plastik', 'bak-pasir-kucing-plastik', 'Wadah pasir plastik tebal berbagai ukuran', 30000, 20, '/images/kandang1.jpg'),
  (30, 3, 'Kandang Besi Lipat Large', 'kandang-besi-lipat-large', 'Kandang kawat lipat kokoh anti karat', 230000, 6, '/images/kandang2.jpg'),
  (31, 3, 'Kandang Besi Portabel', 'kandang-besi-portabel', 'Kandang ringkas ideal untuk anak kucing', 110000, 9, '/images/kandang3.jpg')
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  name = VALUES(name),
  description = VALUES(description),
  base_price = VALUES(base_price),
  stock = VALUES(stock),
  image_url = VALUES(image_url),
  is_active = 1;

INSERT INTO product_variants (product_id, name, price, stock, image_url)
VALUES
  (6, 'Whiskas Junior Rasa Ikan Laut', 70000, 12, '/images/whiskas.jpg'),
  (6, 'Whiskas Junior Mackerel Flavor', 70000, 8, '/images/whiskasmackarel.jpg'),
  (6, 'Whiskas Junior Tuna & Salmon Flavour', 70000, 10, '/images/whiskastuna.jpg'),
  (7, 'Furlove (kaleng)', 15000, 20, '/images/furlove.jpg'),
  (7, 'Furlove Tuna dry cat food', 28500, 20, '/images/furlovedry.jpg'),
  (8, 'Tuna Flavor', 15500, 9, '/images/catchoize.jpg'),
  (8, 'Tuna with Milk (dry)', 30000, 8, '/images/catchoize2.jpg'),
  (8, 'Cat Choize Adult Cat Dry Food Tuna', 21000, 9, '/images/catchoizetuna.jpg'),
  (8, 'Cat Choize Kitten Salmon with Milk (dry)', 33000, 9, '/images/catchoizesalmon.jpg'),
  (10, 'Bolt Cat Tuna', 24500, 7, '/images/bolt.jpg'),
  (10, 'Bolt Cat Salmon', 24500, 7, '/images/bolttuna.jpg'),
  (10, 'Bolt Cat Salmon Kitten', 16000, 6, '/images/boltkitten.jpg'),
  (29, 'Ukuran Kecil', 30000, 7, '/images/kandang1.jpg'),
  (29, 'Ukuran Sedang', 40000, 7, '/images/kandang1.jpg'),
  (29, 'Ukuran Besar', 50000, 6, '/images/kandang1.jpg')
ON DUPLICATE KEY UPDATE
  price = VALUES(price),
  stock = VALUES(stock),
  image_url = VALUES(image_url);
