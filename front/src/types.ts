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

export type RootStackParamList = {
  Home: undefined
  Menu: { carritoId: string; nombre: string }
  Login: undefined
  Admin: undefined
}
