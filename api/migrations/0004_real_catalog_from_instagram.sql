-- Real çeşid: @alcostore.baku Instagram postlarından (2026-09-28).
-- Real fotosu olan məhsullar aktivdir; fotosuz ilkin mock məhsullar deaktiv edilir (admin paneldə qalır,
-- şəkil yüklənəndə yenidən aktivləşdirilə bilər). Qiymətlər təxminidir — Jägermeister 55 ₼ real kampaniyadır.
-- Şəkil faylları: api/seed-images/ → R2 (scripts/upload-seed-images.mjs).
-- Tütün məhsulları (siqarillo, qəlyan) QƏSDƏN əlavə edilmir: App Store 1.4.3 / Google Play siyasəti.

INSERT OR IGNORE INTO categories (id, slug, name_az, name_ru, sort) VALUES
  (7, 'tekila', 'Tekila', 'Текила', 7),
  (8, 'liker',  'Liker və vermut', 'Ликёр и вермут', 8);

-- Fotosuz mock məhsulları gizlət
UPDATE products SET is_active = 0, is_featured = 0, updated_at = datetime('now')
WHERE id <= 45 AND slug NOT IN ('johnnie-walker-black', 'absolut-original', 'macallan-12-double-cask');

UPDATE products SET is_featured = 1 WHERE slug IN ('macallan-12-double-cask', 'johnnie-walker-black');

INSERT OR IGNORE INTO products (id, slug, category_id, brand, name, description_az, country, abv, has_gift_box, is_featured, sort) VALUES
  (101, 'proper-twelve',          2, 'Proper No. Twelve', 'Proper No. Twelve Irish Whiskey', 'Yumşaq İrlandiya blended viskisi. Vanil, bal və tost notları.', 'İrlandiya', 40, 0, 1, 10),
  (102, 'jim-beam-red-stag',      2, 'Jim Beam',       'Jim Beam Red Stag Black Cherry', 'Qara albalı ilə ətirlənmiş Kentukki burbonu əsaslı içki.', 'ABŞ', 32.5, 0, 0, 11),
  (103, 'makers-mark',            2, 'Maker''s Mark',  'Maker''s Mark Bourbon',          'Buğda əsaslı Kentukki burbonu. Karamel, vanil və meyvə notları.', 'ABŞ', 45, 0, 0, 12),
  (104, 'vat-69',                 2, 'VAT 69',         'VAT 69 Blended Scotch',          'Klassik Şotlandiya blended viskisi, yüngül və balanslı.', 'Şotlandiya', 40, 0, 0, 13),
  (105, 'aberlour-16',            2, 'Aberlour',       'Aberlour 16 Double Cask',        'Speyside single malt, şeri və burbon çəlləklərində 16 il. Qurudulmuş meyvə, şokolad və ədviyyat.', 'Şotlandiya', 40, 1, 0, 14),
  (106, 'glenfiddich-15',         2, 'Glenfiddich',    'Glenfiddich 15 Solera',          'Solera üsulu ilə yetişdirilmiş single malt. Bal, ədviyyat və qurudulmuş meyvə.', 'Şotlandiya', 40, 1, 1, 15),
  (107, 'glenmorangie-10',        2, 'Glenmorangie',   'Glenmorangie The Original 10',   'Highland single malt. Sitrus, şaftalı və vanil notları.', 'Şotlandiya', 40, 1, 0, 16),
  (108, 'askaneli-vsop',          3, 'Askaneli',       'Askaneli VSOP',                  'Gürcü brendisi, palıd çəlləkdə yetişdirilib. Yumşaq, vanil və quru meyvə çalarları.', 'Gürcüstan', 40, 1, 1, 10),
  (109, 'qiz-qalasi-7',           3, 'Qız Qalası',     'Qız Qalası 7 illik',             'Azərbaycan konyakı, 7 il yetişdirilib. Hədiyyə qutusunda.', 'Azərbaycan', 40, 1, 1, 11),
  (110, 'altus-vodka',            4, 'Altus',          'Altus Luxury Vodka',             'Azərbaycan istehsalı premium araq, kristal şüşədə.', 'Azərbaycan', 40, 0, 1, 10),
  (111, 'krasnoe-selo',           4, 'Красное Село',   'Красное Село',                   'Klassik araq, təmiz və yumşaq dad.', 'Rusiya', 40, 0, 0, 11),
  (112, 'suzme-pive',             5, 'Alco Store',     'Süzmə pivə (kran)',              'Kranda təzə süzmə pivə — butulkaya doldurulur.', 'Azərbaycan', 4.5, 0, 1, 10),
  (113, 'cenote-reposado',        7, 'Cenote',         'Cenote Reposado',                '100% agava tekilası, palıd çəlləkdə dincəldilib. Karamel və bişmiş agava notları.', 'Meksika', 40, 0, 1, 1),
  (114, 'sierra-tequila-blanco',  7, 'Sierra',         'Sierra Tequila Blanco',          'Klassik ağ tekila — kokteyl və şot üçün.', 'Meksika', 38, 0, 0, 2),
  (115, 'olmeca-gold',            7, 'Olmeca',         'Olmeca Gold',                    'Qızılı tekila, yumşaq və meyvəli.', 'Meksika', 38, 0, 0, 3),
  (116, 'jagermeister',           8, 'Jägermeister',   'Jägermeister',                   '56 bitki və ədviyyatdan hazırlanmış Alman likörü. Soyuq içilir.', 'Almaniya', 35, 0, 1, 1),
  (117, 'martini-bianco',         8, 'Martini',        'Martini Bianco',                 'İtaliya ağ vermutu — vanil və çiçək notları.', 'İtaliya', 15, 0, 0, 2),
  (118, 'martini-rosso',          8, 'Martini',        'Martini Rosso',                  'İtaliya qırmızı vermutu — ədviyyat və acılıq balansı.', 'İtaliya', 15, 0, 0, 3),
  (119, 'safari',                 8, 'Safari',         'Safari Exotic Fruit Liqueur',    'Ekzotik meyvə likörü — manqo, papaya və laym.', 'Niderland', 20, 0, 0, 4);

INSERT OR IGNORE INTO product_variants (id, product_id, volume_ml, pack_size, price, old_price, stock, sku) VALUES
  (201, 101, 700,  1, 69,   NULL, 10, 'PRP12-070'),
  (202, 102, 1000, 1, 58,   NULL, 6,  'JBRS-100'),
  (203, 103, 700,  1, 89,   NULL, 5,  'MKM-070'),
  (204, 104, 700,  1, 42,   NULL, 12, 'VAT69-070'),
  (205, 105, 700,  1, 210,  NULL, 3,  'ABL16-070'),
  (206, 106, 700,  1, 165,  NULL, 4,  'GLF15-070'),
  (207, 107, 700,  1, 120,  NULL, 5,  'GLM10-070'),
  (208, 108, 500,  1, 45,   NULL, 10, 'ASK-VSOP-050'),
  (209, 109, 500,  1, 39,   NULL, 12, 'QQ7-050'),
  (210, 110, 700,  1, 45,   NULL, 10, 'ALT-070'),
  (211, 111, 500,  1, 12,   NULL, 20, 'KRS-050'),
  (212, 112, 500,  1, 2.5,  NULL, 99, 'DRAFT-050'),
  (213, 112, 1000, 1, 4.5,  NULL, 99, 'DRAFT-100'),
  (214, 113, 700,  1, 95,   NULL, 4,  'CEN-REP-070'),
  (215, 114, 700,  1, 49,   NULL, 8,  'SRR-BL-070'),
  (216, 115, 700,  1, 52,   NULL, 8,  'OLM-GD-070'),
  (217, 116, 700,  1, 55,   65,   15, 'JGR-070'),
  (218, 116, 1000, 1, 78,   NULL, 6,  'JGR-100'),
  (219, 117, 1000, 1, 32,   NULL, 8,  'MRT-B-100'),
  (220, 118, 1000, 1, 32,   NULL, 8,  'MRT-R-100'),
  (221, 119, 700,  1, 38,   NULL, 6,  'SAF-070');

INSERT OR IGNORE INTO product_images (product_id, r2_key, sort)
SELECT p.id, 'catalog/' || p.slug || '.jpg', 0 FROM products p
WHERE p.slug IN (
  'proper-twelve','jim-beam-red-stag','makers-mark','vat-69','aberlour-16','glenfiddich-15','glenmorangie-10',
  'askaneli-vsop','qiz-qalasi-7','altus-vodka','krasnoe-selo','suzme-pive','cenote-reposado','sierra-tequila-blanco',
  'olmeca-gold','jagermeister','martini-bianco','martini-rosso','safari',
  'johnnie-walker-black','absolut-original','macallan-12-double-cask'
)
AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id);

-- Real kampaniyalar (Instagram)
DELETE FROM banners WHERE id IN (1, 2);
INSERT OR IGNORE INTO banners (id, kicker, title, subtitle, image_key, link, sort) VALUES
  (10, 'ŞOK KAMPANİYA', 'Jägermeister — 55 ₼', '0.7 L · məhdud sayda', 'banners/banner-jagermeister.jpg', '/mehsul/jagermeister', 1),
  (11, 'YENİ', 'Süzmə pivə artıq Alco Store-da', 'Kranda təzə pivə — 0.5 L və 1 L', 'banners/banner-suzme-pive.jpg', '/mehsul/suzme-pive', 2);

-- Real əlaqə məlumatları (Instagram bio və postlar). Yalnız ilkin mock dəyərləri əvəz edir.
UPDATE store_settings SET value = '+994 50 682 21 71', updated_at = datetime('now') WHERE key IN ('whatsapp_number', 'phone') AND value = '+994 50 000 00 00';
UPDATE store_settings SET value = 'Bakı, Asif Məhərrəmov küç. 33A', updated_at = datetime('now') WHERE key = 'address' AND value = 'Bakı, Azərbaycan';
