-- ============================================================
-- Carritos Al Toque — Reseñas y Tags
-- ============================================================

-- 1. AÑADIR columna icono a carritos (se usaba en frontend pero faltaba en migración)
ALTER TABLE carritos ADD COLUMN IF NOT EXISTS icono TEXT;

-- 2. TABLA: reviews (solo estrellas, sin texto)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_carrito_id ON reviews(carrito_id);

-- 3. TABLA: carrito_tags
CREATE TABLE carrito_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_carrito_tags_carrito_id ON carrito_tags(carrito_id);

-- 4. RLS — REVIEWS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Lectura pública anónima
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (true);

-- Cualquiera puede insertar una reseña (anónima)
CREATE POLICY "reviews_insert_public"
  ON reviews FOR INSERT
  WITH CHECK (true);

-- 5. RLS — CARRITO_TAGS
ALTER TABLE carrito_tags ENABLE ROW LEVEL SECURITY;

-- Lectura pública anónima
CREATE POLICY "carrito_tags_select_public"
  ON carrito_tags FOR SELECT
  USING (true);

-- Solo el dueño del carrito puede insertar tags
CREATE POLICY "carrito_tags_insert_owner"
  ON carrito_tags FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM carritos WHERE id = carrito_tags.carrito_id)
  );

-- Solo el dueño del carrito puede eliminar tags
CREATE POLICY "carrito_tags_delete_owner"
  ON carrito_tags FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM carritos WHERE id = carrito_tags.carrito_id)
  );
