-- ============================================================
-- Carritos Al Toque — Esquema Inicial
-- ============================================================

-- 1. TABLA: carritos
CREATE TABLE carritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  direccion_texto TEXT,
  whatsapp TEXT,
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  estado_abierto BOOLEAN DEFAULT false,
  imagen_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_carritos_user_id ON carritos(user_id);

-- 2. TABLA: menus
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
  nombre_producto TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_menus_carrito_id ON menus(carrito_id);

-- 3. AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_carritos_updated_at
  BEFORE UPDATE ON carritos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4. RLS — CARRTOS
ALTER TABLE carritos ENABLE ROW LEVEL SECURITY;

-- Lectura pública anónima
CREATE POLICY "carritos_select_public"
  ON carritos FOR SELECT
  USING (true);

-- Solo el dueño puede insertar su propio carrito
CREATE POLICY "carritos_insert_owner"
  ON carritos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el dueño puede modificar su carrito
CREATE POLICY "carritos_update_owner"
  ON carritos FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. RLS — MENUS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Lectura pública anónima
CREATE POLICY "menus_select_public"
  ON menus FOR SELECT
  USING (true);

-- Solo el dueño del carrito puede insertar menús
CREATE POLICY "menus_insert_owner"
  ON menus FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM carritos WHERE id = menus.carrito_id)
  );

-- Solo el dueño del carrito puede modificar menús
CREATE POLICY "menus_update_owner"
  ON menus FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM carritos WHERE id = menus.carrito_id)
  );

-- Solo el dueño del carrito puede eliminar menús
CREATE POLICY "menus_delete_owner"
  ON menus FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM carritos WHERE id = menus.carrito_id)
  );

-- 6. FUNCIÓN HAVERSINE — carritos cercanos
CREATE OR REPLACE FUNCTION carritos_cercanos(
  lat_usuario DOUBLE PRECISION,
  lng_usuario DOUBLE PRECISION,
  radio_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  nombre TEXT,
  direccion_texto TEXT,
  whatsapp TEXT,
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  estado_abierto BOOLEAN,
  imagen_url TEXT,
  distancia_km DOUBLE PRECISION
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  deg_to_rad CONSTANT DOUBLE PRECISION := pi() / 180;
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.nombre,
    c.direccion_texto,
    c.whatsapp,
    c.latitud,
    c.longitud,
    c.estado_abierto,
    c.imagen_url,
    -- Fórmula de Haversine
    2 * 6371 * asin(
      sqrt(
        power(sin((c.latitud - lat_usuario) * deg_to_rad / 2), 2)
        + cos(lat_usuario * deg_to_rad)
        * cos(c.latitud * deg_to_rad)
        * power(sin((c.longitud - lng_usuario) * deg_to_rad / 2), 2)
      )
    ) AS distancia_km
  FROM carritos c
  WHERE
    c.latitud IS NOT NULL
    AND c.longitud IS NOT NULL
    AND 2 * 6371 * asin(
      sqrt(
        power(sin((c.latitud - lat_usuario) * deg_to_rad / 2), 2)
        + cos(lat_usuario * deg_to_rad)
        * cos(c.latitud * deg_to_rad)
        * power(sin((c.longitud - lng_usuario) * deg_to_rad / 2), 2)
      )
    ) <= radio_km
  ORDER BY distancia_km ASC;
END;
$$;
