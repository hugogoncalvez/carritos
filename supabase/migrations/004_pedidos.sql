-- ============================================================
-- Carritos Al Toque — Pedidos
-- ============================================================

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'completado', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pedidos_carrito_id ON pedidos(carrito_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_created_at ON pedidos(created_at);

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar un pedido (anónimo)
CREATE POLICY "pedidos_insert_public"
  ON pedidos FOR INSERT
  WITH CHECK (true);

-- Cualquiera puede leer pedidos (necesario para el admin y el cliente)
CREATE POLICY "pedidos_select_public"
  ON pedidos FOR SELECT
  USING (true);

-- Solo el dueño del carrito puede actualizar pedidos
CREATE POLICY "pedidos_update_owner"
  ON pedidos FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM carritos WHERE id = pedidos.carrito_id)
  );
