-- ============================================================
-- Carritos Al Toque — Pedidos: SELECT solo dueño
-- Cliente solo INSERT (sin login) + ve local. Dueño lee.
-- ============================================================

DROP POLICY IF EXISTS "pedidos_select_public" ON pedidos;

CREATE POLICY "pedidos_select_owner"
  ON pedidos FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM carritos WHERE id = pedidos.carrito_id)
  );
