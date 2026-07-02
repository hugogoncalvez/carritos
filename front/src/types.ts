export type Carrito = {
  id: string
  user_id: string
  nombre: string
  direccion_texto: string | null
  whatsapp: string | null
  latitud: number | null
  longitud: number | null
  estado_abierto: boolean
  imagen_url: string | null
  icono: string | null
  created_at: string
  updated_at: string
}

export type Menu = {
  id: string
  carrito_id: string
  nombre_producto: string
  descripcion: string | null
  precio: number
  disponible: boolean
  imagen_url: string | null
  created_at: string
}

export type CarritoConDistancia = Carrito & { distancia_km: number }

export type CarritoConRating = Carrito & { rating_avg: number; rating_count: number }

export type CartItem = {
  id: string
  menuId: string
  carritoId: string
  vendorName: string
  vendorWhatsapp: string | null
  nombre: string
  precio: number
  cantidad: number
}

export type Review = {
  id: string
  carrito_id: string
  rating: number
  created_at: string
}

export type CarritoTag = {
  id: string
  carrito_id: string
  tag: string
  created_at: string
}

export type PedidoItem = {
  menuId: string
  nombre: string
  precio: number
  cantidad: number
  cumplido: boolean
}

export type Pedido = {
  id: string
  carrito_id: string
  items: PedidoItem[]
  total: number
  estado: 'pendiente' | 'completado' | 'cancelado'
  created_at: string
}

export type CartGroup = {
  carritoId: string
  vendorName: string
  vendorWhatsapp: string | null
  items: CartItem[]
  subtotal: number
}

export type ClientTabParamList = {
  Explorar: undefined
  Pedidos: undefined
}

export type AdminTabParamList = {
  AdminHome: undefined
}

export type RootStackParamList = {
  ClientTabs: undefined
  AdminTabs: undefined
  Menu: { carritoId: string; nombre: string; imagen_url?: string | null; icono?: string | null }
  Login: undefined
}
