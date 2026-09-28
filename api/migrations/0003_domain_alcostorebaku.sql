-- Domen alcostorebaku.az olaraq təsdiqləndi (2026-09-28). Yalnız köhnə defolt dəyəri dəyişir —
-- admin paneldən artıq dəyişdirilmiş e-poçta toxunmur.
UPDATE store_settings
SET value = 'info@alcostorebaku.az', updated_at = datetime('now')
WHERE key = 'support_email' AND value = 'info@alcostore.az';
