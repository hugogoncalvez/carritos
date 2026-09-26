-- ============================================================
-- Carritos Al Toque — Pedidos: agregar estado entregado
-- Flujo: pendiente -> completado -> entregado (venta), cancelado
-- ============================================================

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;

ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('pendiente', 'completado', 'entregado', 'cancelado'));
