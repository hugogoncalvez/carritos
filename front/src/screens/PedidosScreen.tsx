import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useCart } from '../context/CartContext'
import { T } from '../theme'

export default function PedidosScreen() {
  const { groups, totalItems, updateQuantity, removeItem, clearVendorCart, loading } = useCart()

  const handleSendWhatsApp = (whatsapp: string | null, vendorName: string, items: { nombre: string; precio: number; cantidad: number }[]) => {
    if (!whatsapp) {
      Alert.alert('Sin WhatsApp', `${vendorName} no tiene un número configurado.`)
      return
    }

    const lines = items.map(
      (i) => `• ${i.cantidad}x ${i.nombre} — $${(i.precio * i.cantidad).toFixed(2)}`,
    )
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
    const text = `¡Hola! Quiero pedir de ${vendorName}:\n${lines.join('\n')}\n\nTotal: $${total.toFixed(2)}`

    const numero = whatsapp.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(text)}`
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp'),
    )
  }

  const confirmClear = (carritoId: string, vendorName: string) => {
    Alert.alert(
      'Vaciar pedido',
      `¿Querés vaciar el pedido de ${vendorName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
          onPress: () => clearVendorCart(carritoId),
        },
      ],
    )
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={T.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        {totalItems > 0 && (
          <Text style={styles.headerCount}>{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</Text>
        )}
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="shopping-cart" size={48} color={T.colors.surfaceContainerHighest} />
          <Text style={styles.emptyTitle}>Carrito vacío</Text>
          <Text style={styles.emptySubtitle}>
            Explorá el mapa y agregá productos de tus carritos favoritos.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => (
            <View key={group.carritoId} style={styles.vendorSection}>
              {/* VENDOR HEADER */}
              <View style={styles.vendorHeader}>
                <View style={styles.vendorInfo}>
                  <View style={styles.vendorAvatar}>
                    <Text style={styles.vendorAvatarText}>🛒</Text>
                  </View>
                  <View style={styles.vendorMeta}>
                    <Text style={styles.vendorName}>{group.vendorName}</Text>
                    <Text style={styles.vendorSubtotal}>
                      Subtotal: ${group.subtotal.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => confirmClear(group.carritoId, group.vendorName)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="delete-outline" size={18} color={T.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {/* ITEMS */}
              {group.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.nombre}</Text>
                    <Text style={styles.itemPrice}>
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, -1)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="remove" size={18} color={T.colors.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.cantidad}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, 1)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="add" size={18} color={T.colors.onSurface} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* SEND WHATSAPP BUTTON */}
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() =>
                  handleSendWhatsApp(
                    group.vendorWhatsapp,
                    group.vendorName,
                    group.items.map((i) => ({
                      nombre: i.nombre,
                      precio: i.precio,
                      cantidad: i.cantidad,
                    })),
                  )
                }
                activeOpacity={0.8}
              >
                <MaterialIcons name="chat" size={20} color="#FFFFFF" />
                <Text style={styles.whatsappBtnText}>
                  Enviar Pedido por WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.marginMain,
    paddingTop: 64,
    paddingBottom: T.spacing.stackMd,
    backgroundColor: T.colors.background,
  },
  headerTitle: {
    ...T.font.headlineMd,
    color: T.colors.onSurface,
  },
  headerCount: {
    ...T.font.labelMd,
    color: T.colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: T.spacing.marginMain,
    paddingBottom: 120,
    gap: T.spacing.stackLg,
  },
  vendorSection: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    overflow: 'hidden',
    ...T.shadow.card,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.insetCard,
    paddingVertical: T.spacing.stackMd,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.surfaceContainerHigh,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vendorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.primaryContainer + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorAvatarText: { fontSize: 18 },
  vendorMeta: { flex: 1 },
  vendorName: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
  },
  vendorSubtotal: {
    ...T.font.bodyMd,
    color: T.colors.primary,
    marginTop: 2,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.spacing.insetCard,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.surfaceContainerHigh,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...T.font.bodyMd,
    color: T.colors.onSurface,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemPrice: {
    ...T.font.labelMd,
    color: T.colors.onSurfaceVariant,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    minWidth: 24,
    textAlign: 'center',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    marginHorizontal: T.spacing.insetCard,
    marginVertical: T.spacing.stackMd,
    borderRadius: T.radius.lg,
    height: 48,
  },
  whatsappBtnText: {
    ...T.font.headlineSm,
    color: '#FFFFFF',
  },
})
