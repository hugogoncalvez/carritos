import { createClient } from '@supabase/supabase-js'
import type { Carrito, Menu, CarritoConDistancia } from './types'

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
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data as Carrito | null
}

export async function fetchMenusAdmin(carritoId: string) {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('carrito_id', carritoId)
    .order('nombre_producto', { ascending: true })
  if (error) throw error
  return data as Menu[]
}

export async function uploadProductImage(
  carritoId: string,
  menuId: string,
  uri: string,
) {
  const ext = uri.split('.').pop() ?? 'jpg'
  const filePath = `${carritoId}/${menuId}.${ext}`

  const response = await fetch(uri)
  const blob = await response.blob()

  const { error: uploadError } = await supabase.storage
    .from('menu-images')
    .upload(filePath, blob, { upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filePath)

  const publicUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .from('menus')
    .update({ imagen_url: publicUrl })
    .eq('id', menuId)

  if (updateError) throw updateError

  return publicUrl
}

export async function deleteMenuImage(menuId: string, imageUrl: string) {
  const path = imageUrl.split('/menu-images/').pop()
  if (!path) return

  await supabase.storage.from('menu-images').remove([path])

  const { error } = await supabase
    .from('menus')
    .update({ imagen_url: null })
    .eq('id', menuId)

  if (error) throw error
}
