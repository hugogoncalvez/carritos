ALTER TABLE menus
  ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Comidas'
  CHECK (categoria IN ('Comidas', 'Bebidas', 'Acompañamiento', 'Promociones'));
