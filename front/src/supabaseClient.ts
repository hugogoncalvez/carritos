import { createClient } from '@supabase/supabase-js'
import type { Carrito, Menu, CarritoConDistancia, Review, CarritoTag, Pedido } from './types'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchCarritos() {
  const { data, error } = await supabase
    .from('carritos')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw error
  return data as Carrito[]
}

export async function fetchMenus(carritoId: string) {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('carrito_id', carritoId)
    .eq('disponible', true)
    .order('categoria', { ascending: true })
    .order('nombre_producto', { ascending: true })
  if (error) throw error
  return data as Menu[]
}

export async function fetchCarritosCercanos(
  lat: number,
  lng: number,
  radioKm = 10,
) {
  const { data, error } = await supabase.rpc('carritos_cercanos', {
    lat_usuario: lat,
    lng_usuario: lng,
    radio_km: radioKm,
  })
  if (error) throw error
  return data as CarritoConDistancia[]
}

export async function buscarCarritos(query: string) {
  const q = `%${query}%`
  const { data, error } = await supabase
    .from('carritos')
    .select('*')
    .or(`nombre.ilike.${q},direccion_texto.ilike.${q}`)
    .order('nombre', { ascending: true })
  if (error) throw error
  return data as Carrito[]
}

export async function toggleEstadoAbierto(carritoId: string, abierto: boolean) {
  const { error } = await supabase
    .from('carritos')
    .update({ estado_abierto: abierto })
    .eq('id', carritoId)
  if (error) throw error
}

export async function updateUbicacion(
  carritoId: string,
  lat: number,
  lng: number,
) {
  const { error } = await supabase
    .from('carritos')
    .update({ latitud: lat, longitud: lng })
    .eq('id', carritoId)
  if (error) throw error
}

export async function fetchMiCarrito(userId: string) {
  const { data, error } = await supabase
    .from('carritos')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as Carrito | null
}

export async function fetchMisCarritos(userId: string) {
  const { data, error } = await supabase
    .from('carritos')
    .select('*')
    .eq('user_id', userId)
    .order('nombre', { ascending: true })
  if (error) throw error
  return data as Carrito[]
}

export async function fetchMenusAdmin(carritoId: string) {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('carrito_id', carritoId)
    .order('categoria', { ascending: true })
    .order('nombre_producto', { ascending: true })
  if (error) throw error
  return data as Menu[]
}

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onload = () => resolve(xhr.response)
    xhr.onerror = () => reject(new Error('No se pudo leer el archivo'))
    xhr.responseType = 'blob'
    xhr.open('GET', uri, true)
    xhr.send()
  })
}

export async function uploadProductImage(
  carritoId: string,
  menuId: string,
  uri: string,
) {
  const ext = uri.split('.').pop() ?? 'jpg'
  const filePath = `${carritoId}/${menuId}.${ext}`

  let blob: Blob
  try {
    blob = await uriToBlob(uri)
  } catch (fetchErr) {
    throw new Error(`Error al leer la imagen: ${fetchErr instanceof Error ? fetchErr.message : 'fetch failed'}`)
  }

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, blob, { upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` })

  if (uploadError) {
    throw new Error(`Error al subir imagen a Supabase: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filePath)

  const publicUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .from('menus')
    .update({ imagen_url: publicUrl })
    .eq('id', menuId)

  if (updateError) {
    throw new Error(`Error al guardar URL en la base de datos: ${updateError.message}`)
  }

  return publicUrl
}

export async function uploadCarritoImage(
  carritoId: string,
  uri: string,
) {
  const ext = uri.split('.').pop() ?? 'jpg'
  const filePath = `${carritoId}/profile.${ext}`

  let blob: Blob
  try {
    blob = await uriToBlob(uri)
  } catch {
    throw new Error('Error al leer la imagen')
  }

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, blob, { upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` })

  if (uploadError) {
    throw new Error(`Error al subir imagen: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function upsertMenu(menu: {
  id?: string
  carrito_id: string
  nombre_producto: string
  descripcion: string | null
  precio: number
  disponible: boolean
  categoria?: string
}) {
  const { data, error } = await supabase
    .from('menus')
    .upsert(menu)
    .select()
    .single()
  if (error) throw error
  return data as Menu
}

export async function deleteMenu(menuId: string) {
  const { error } = await supabase.from('menus').delete().eq('id', menuId)
  if (error) throw error
}

export async function deleteMenuImage(menuId: string, imageUrl: string) {
  const path = imageUrl.split('/menu-images/').pop()
  if (!path) return

  const { error: removeError } = await supabase.storage.from('menu-images').remove([path])
  if (removeError) {
    throw new Error(`Error al eliminar imagen del storage: ${removeError.message}`)
  }

  const { error: updateError } = await supabase
    .from('menus')
    .update({ imagen_url: null })
    .eq('id', menuId)

  if (updateError) {
    throw new Error(`Error al limpiar URL en la base de datos: ${updateError.message}`)
  }
}

// REVIEWS
export async function fetchReviews(carritoId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('carrito_id', carritoId)
  if (error) throw error
  return data as Pick<Review, 'rating'>[]
}

export async function submitReview(carritoId: string, rating: number) {
  const { error } = await supabase
    .from('reviews')
    .insert({ carrito_id: carritoId, rating })
  if (error) throw error
}

export async function fetchRatingAvg(carritoId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('carrito_id', carritoId)
  if (error) throw error
  const ratings = data as Pick<Review, 'rating'>[]
  if (ratings.length === 0) return { avg: 0, count: 0 }
  const sum = ratings.reduce((a, b) => a + b.rating, 0)
  return { avg: Math.round((sum / ratings.length) * 10) / 10, count: ratings.length }
}

// TAGS
export async function fetchTags(carritoId: string) {
  const { data, error } = await supabase
    .from('carrito_tags')
    .select('*')
    .eq('carrito_id', carritoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as CarritoTag[]
}

export async function addTag(carritoId: string, tag: string) {
  const { data, error } = await supabase
    .from('carrito_tags')
    .insert({ carrito_id: carritoId, tag })
    .select()
    .single()
  if (error) throw error
  return data as CarritoTag
}

export async function removeTag(tagId: string) {
  const { error } = await supabase
    .from('carrito_tags')
    .delete()
    .eq('id', tagId)
  if (error) throw error
}

// PEDIDOS
export async function createPedido(carritoId: string, items: Pedido['items'], total: number) {
  const { data, error } = await supabase
    .from('pedidos')
    .insert({ carrito_id: carritoId, items, total, estado: 'pendiente' })
    .select()
    .single()
  if (error) throw error
  return data as Pedido
}

export async function fetchPedidos(carritoId: string) {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('carrito_id', carritoId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Pedido[]
}

export async function updatePedidoEstado(pedidoId: string, estado: Pedido['estado']) {
  const { error } = await supabase
    .from('pedidos')
    .update({ estado })
    .eq('id', pedidoId)
  if (error) throw error
}

export async function updatePedidoItems(pedidoId: string, items: Pedido['items']) {
  const { error } = await supabase
    .from('pedidos')
    .update({ items })
    .eq('id', pedidoId)
  if (error) throw error
}
