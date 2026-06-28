import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { supabase, fetchMenus } from '../supabaseClient'
import type { Menu, RootStackParamList } from '../types'

type MenuRoute = RouteProp<RootStackParamList, 'Menu'>

export default function MenuScreen() {
  const route = useRoute<MenuRoute>()
  const { carritoId, nombre } = route.params
  const [menus, setMenus] = useState<Menu[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [whatsapp, setWhatsapp] = useState<string | null>(null)
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchMenus(carritoId)
        setMenus(data)
      } catch {
        Alert.alert('Error', 'No se pudo cargar el menú')
      }
      setLoading(false)
    })()
  }, [carritoId])

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pedidoText = () => {
    const items = menus.filter((m) => selected.has(m.id))
    if (items.length === 0) return ''
    const lines = items.map(
      (m) => `• ${m.nombre_producto} — $${m.precio.toFixed(2)}`,
    )
    return `¡Hola! Quiero pedir:\n${lines.join('\n')}`
  }

  const handleWhatsApp = () => {
    if (!whatsapp) {
      Alert.alert('Sin contacto', 'Este carrito no tiene WhatsApp configurado.')
      return
    }

    const text = pedidoText()
    if (!text) {
      Alert.alert('Seleccioná productos', 'Elegí al menos un producto.')
      return
    }

    const numero = whatsapp.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(text)}`
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp'),
    )
  }

  const fetchCarritoInfo = async () => {
    const { data } = await supabase
      .from('carritos')
      .select('whatsapp, latitud, longitud')
      .eq('id', carritoId)
      .single()
    if (data) {
      if (data.whatsapp) setWhatsapp(data.whatsapp)
      if (data.latitud != null) setLatitud(data.latitud)
      if (data.longitud != null) setLongitud(data.longitud)
    }
  }

  const handleOpenMaps = () => {
    if (latitud == null || longitud == null) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir la navegación en Google Maps'),
    )
  }

  useEffect(() => {
    fetchCarritoInfo()
  }, [carritoId])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    )
  }

  const total = menus
    .filter((m) => selected.has(m.id))
    .reduce((sum, m) => sum + m.precio, 0)

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{nombre}</Text>
        </View>
        {latitud != null && longitud != null && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={handleOpenMaps}
            activeOpacity={0.7}
          >
            <Text style={styles.mapButtonText}>🗺️ Cómo llegar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={menus}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id)
          return (
            <TouchableOpacity
              style={[styles.menuItem, isSelected && styles.menuItemSelected]}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
            >
              {item.imagen_url ? (
                <Image
                  source={{ uri: item.imagen_url }}
                  style={styles.itemImage}
                />
              ) : null}

              <View style={styles.menuContent}>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuNombre}>{item.nombre_producto}</Text>
                  {item.descripcion ? (
                    <Text style={styles.menuDesc}>{item.descripcion}</Text>
                  ) : null}
                </View>
                <Text style={styles.menuPrecio}>
                  ${item.precio.toFixed(2)}
                </Text>
              </View>

              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                ]}
              >
                {isSelected ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Este carrito aún no tiene productos en el menú.
          </Text>
        }
      />

      {selected.size > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total seleccionado:</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleWhatsApp}
          >
            <Text style={styles.whatsappText}>Pedir por WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  mapButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  list: { padding: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuItemSelected: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF5F5',
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuInfo: { flex: 1 },
  menuNombre: { fontSize: 15, fontWeight: '600', color: '#333' },
  menuDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  menuPrecio: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D32F2F',
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  checkMark: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 14 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 15, color: '#666' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F' },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  whatsappText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
})
