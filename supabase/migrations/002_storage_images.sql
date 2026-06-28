-- ============================================================
-- Carritos Al Toque — Imágenes para productos del menú
-- ============================================================

-- 1. Agregar columna imagen_url a menus
ALTER TABLE menus
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 2. Crear bucket público para imágenes de menú
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS — Lectura pública anónima
CREATE POLICY "menu_images_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- 4. RLS — Subida solo para usuarios autenticados
CREATE POLICY "menu_images_insert_auth"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images'
  AND auth.role() = 'authenticated'
);

-- 5. RLS — Borrado solo para usuarios autenticados
CREATE POLICY "menu_images_delete_auth"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images'
  AND auth.role() = 'authenticated'
);
