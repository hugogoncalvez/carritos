import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { supabase, fetchMenus } from '../supabaseClient'
import type { Menu, RootStackParamList } from '../types'
import { useCart } from '../context/CartContext'
import { T } from '../theme'

type MenuRoute = RouteProp<RootStackParamList, 'Menu'>

export default function MenuScreen() {
  const route = useRoute<MenuRoute>()
  const navigation = useNavigation()
  const { carritoId, nombre, imagen_url: carritoImagen, icono: carritoIcono } = route.params
  const [menus, setMenus] = useState<Menu[]>([])
  const { addItem, items } = useCart()
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

  const handleAddToCart = (menu: Menu) => {
    addItem({
      menuId: menu.id,
      carritoId,
      vendorName: nombre,
      vendorWhatsapp: whatsapp,
      nombre: menu.nombre_producto,
      precio: menu.precio,
    })
  }

  const cartCount = items.filter((i) => i.carritoId === carritoId).length
  const cartTotal = items
    .filter((i) => i.carritoId === carritoId)
    .reduce((sum, i) => sum + i.precio * i.cantidad, 0)

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
        <ActivityIndicator size="large" color={T.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* FLOATING HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.topBarBtnIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{nombre}</Text>
        <TouchableOpacity style={styles.topBarBtn}>
          <Text style={styles.topBarBtnIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={menus}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* HERO CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroImageContainer}>
                {carritoImagen ? (
                  <Image source={{ uri: carritoImagen }} style={styles.heroImage} />
                ) : (
                  <View style={styles.heroImagePlaceholder}>
                    <Text style={styles.heroPlaceholderIcon}>{carritoIcono || '🍔'}</Text>
                  </View>
                )}
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>{nombre}</Text>
                {latitud != null && longitud != null && (
                  <TouchableOpacity
                    style={styles.locationRow}
                    onPress={handleOpenMaps}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText}>Cómo llegar</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.heroTags}>
                  <View style={styles.heroTagOpen}>
                    <View style={styles.heroTagDot} />
                    <Text style={styles.heroTagOpenText}>Abierto</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SECTION TITLE */}
            <Text style={styles.sectionTitle}>Menú Principal</Text>
          </>
        }
        renderItem={({ item }) => {
          const cartItem = items.find(
            (i) => i.menuId === item.id && i.carritoId === carritoId,
          )
          const cantidad = cartItem?.cantidad ?? 0
          return (
            <TouchableOpacity
              style={[styles.productCard, cantidad > 0 && styles.productCardSelected]}
              onPress={() => handleAddToCart(item)}
              activeOpacity={0.7}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.nombre_producto}</Text>
                {item.descripcion ? (
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {item.descripcion}
                  </Text>
                ) : null}
              </View>
              <View style={styles.productRight}>
                {item.imagen_url ? (
                  <Image
                    source={{ uri: item.imagen_url }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.productPlaceholderText}>📷</Text>
                  </View>
                )}
                <View style={styles.priceTag}>
                  {cantidad > 0 ? (
                    <Text style={styles.priceText}>
                      {cantidad}x ${(item.precio * cantidad).toFixed(2)}
                    </Text>
                  ) : (
                    <Text style={styles.priceText}>
                      ${item.precio.toFixed(2)}
                    </Text>
                  )}
                </View>
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

      {/* CART FAB */}
      {cartCount > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>
              {cartCount} {cartCount === 1 ? 'producto' : 'productos'} en tu pedido
            </Text>
            <Text style={styles.totalValue}>${cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.whatsappBtnIcon}>🛒</Text>
            <Text style={styles.whatsappBtnText}>Ir a mi pedido</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.colors.background,
  },

  /* Top Bar */
  topBar: {
    position: 'absolute',
    top: 56,
    left: T.spacing.marginMain,
    right: T.spacing.marginMain,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.colors.surfaceContainerLowest + 'E6',
    borderRadius: T.radius.full,
    paddingHorizontal: 4,
    height: 48,
    zIndex: 50,
    ...T.shadow.card,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarBtnIcon: { fontSize: 20, color: T.colors.onSurfaceVariant },
  topBarTitle: {
    ...T.font.headlineSm,
    color: T.colors.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 4,
  },

  list: {
    paddingTop: 120,
    paddingHorizontal: T.spacing.marginMain,
    paddingBottom: 140,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    overflow: 'hidden',
    marginBottom: T.spacing.stackLg,
    ...T.shadow.card,
  },
  heroImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: T.colors.surfaceContainerHigh,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.colors.surfaceContainerHigh,
  },
  heroPlaceholderIcon: { fontSize: 48 },
  heroInfo: {
    padding: T.spacing.insetCard,
  },
  heroTitle: {
    ...T.font.headlineLg,
    color: T.colors.onSurface,
    marginBottom: T.spacing.stackSm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: T.spacing.stackMd,
  },
  locationIcon: { fontSize: 16 },
  locationText: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
  },
  heroTags: {
    flexDirection: 'row',
    gap: 8,
  },
  heroTagOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: T.colors.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: T.radius.full,
  },
  heroTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.colors.onTertiary,
  },
  heroTagOpenText: {
    ...T.font.labelSm,
    color: T.colors.onTertiary,
    fontWeight: '600',
  },

  /* Section */
  sectionTitle: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    marginBottom: T.spacing.gutter,
  },

  /* Product Card */
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    padding: T.spacing.insetCard,
    marginBottom: T.spacing.gutter,
    gap: 12,
    ...T.shadow.card,
  },
  productCardSelected: {
    borderWidth: 2,
    borderColor: T.colors.primaryContainer,
    backgroundColor: T.colors.surface,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    fontWeight: '700',
  },
  productDesc: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
    marginTop: 2,
  },
  productRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: T.radius.md,
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: T.radius.md,
    backgroundColor: T.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPlaceholderText: { fontSize: 20 },
  priceTag: {
    backgroundColor: T.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: T.radius.full,
  },
  priceText: {
    ...T.font.labelMd,
    color: T.colors.onPrimaryContainer,
    fontWeight: '700',
  },

  empty: {
    textAlign: 'center',
    color: T.colors.onSurfaceVariant,
    marginTop: 40,
    ...T.font.bodyMd,
  },

  /* Footer / WhatsApp */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: T.colors.surface,
    paddingHorizontal: T.spacing.marginMain,
    paddingTop: 12,
    paddingBottom: 32,
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    ...T.font.bodyLg,
    color: T.colors.onSurfaceVariant,
  },
  totalValue: {
    ...T.font.headlineMd,
    color: T.colors.onSurface,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: T.radius.lg,
    height: 52,
    ...T.shadow.card,
  },
  whatsappBtnIcon: { fontSize: 20 },
  whatsappBtnText: {
    ...T.font.headlineSm,
    color: '#FFFFFF',
  },
})
