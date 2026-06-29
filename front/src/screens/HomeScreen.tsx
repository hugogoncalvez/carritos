import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import MapView, { styleURL, Camera, Marker } from '../components/MapViewWrapper'
import { useNavigation } from '@react-navigation/native'
import { useLocation } from '../hooks/useLocation'
import { fetchCarritosCercanos } from '../supabaseClient'
import type { CarritoConDistancia } from '../types'
import { T } from '../theme'

export default function HomeScreen() {
  const navigation = useNavigation<any>()
  const { location, loading: locLoading } = useLocation()

  const [carritos, setCarritos] = useState<CarritoConDistancia[]>([])
  const [loading, setLoading] = useState(true)
  const [soloAbiertos, setSoloAbiertos] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(14)

  const cargarCarritos = useCallback(async () => {
    if (!location) return
    setLoading(true)
    try {
      const data = await fetchCarritosCercanos(
        location.latitude,
        location.longitude,
        20,
      )
      setCarritos(data)
    } catch {
      // Silently fail
    }
    setLoading(false)
  }, [location])

  useEffect(() => {
    cargarCarritos()
  }, [cargarCarritos])

  const carritosFiltrados = soloAbiertos
    ? carritos.filter((c) => c.estado_abierto)
    : carritos

  if (locLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={T.colors.primary} />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapView
        style={styles.map}
        mapStyle={styleURL}
        onRegionDidChange={(e: any) => {
          setCurrentZoom(e.nativeEvent.zoom)
        }}
      >
        <Camera
          initialViewState={{
            center: location
              ? [location.longitude, location.latitude]
              : [-58.3816, -34.6037],
            zoom: 14,
          }}
          trackUserLocation="default"
        />
        {location && (
          <Marker
            id="user-location"
            lngLat={[location.longitude, location.latitude]}
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarker}>
                <View style={styles.userMarkerDot} />
              </View>
            </View>
          </Marker>
        )}
        {carritos.map((c) =>
          c.latitud != null && c.longitud != null ? (
            <Marker
              key={c.id}
              id={c.id}
              lngLat={[c.longitud, c.latitud]}
              onPress={() =>
                navigation.navigate('Menu', { carritoId: c.id, nombre: c.nombre })
              }
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.marker,
                    c.estado_abierto ? styles.markerOpen : styles.markerClosed,
                  ]}
                >
                  <Text style={styles.markerIcon}>🍔</Text>
                </View>
                <View
                  style={[
                    styles.markerPointer,
                    { backgroundColor: c.estado_abierto ? T.colors.tertiary : T.colors.secondary },
                  ]}
                />
                {currentZoom >= 15 && (
                  <View style={styles.markerLabelContainer}>
                    <Text style={styles.markerLabelText} numberOfLines={1}>
                      {c.nombre}
                    </Text>
                  </View>
                )}
              </View>
            </Marker>
          ) : null,
        )}
      </MapView>

      {/* FLOATING TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarIconBtn}>
          <Text style={styles.topBarIcon}>🔍</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Carritos Al Toque</Text>
        <TouchableOpacity style={styles.topBarIconBtn}>
          <Text style={styles.topBarIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <TouchableOpacity
          style={[styles.chip, soloAbiertos && styles.chipActive]}
          onPress={() => setSoloAbiertos(!soloAbiertos)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipIcon, soloAbiertos && styles.chipIconActive]}>✓</Text>
          <Text style={[styles.chipText, soloAbiertos && styles.chipTextActive]}>
            Abiertos ahora
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} activeOpacity={0.7}>
          <Text style={styles.chipIcon}>⭐</Text>
          <Text style={styles.chipText}>Mejor valorados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} activeOpacity={0.7}>
          <Text style={styles.chipIcon}>📍</Text>
          <Text style={styles.chipText}>Menos de 1km</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BOTTOM SHEET - VENDOR CARDS */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {soloAbiertos ? 'Abiertos ahora' : 'Carritos cercanos'}
          </Text>
          <Text style={styles.sheetCount}>{carritosFiltrados.length}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={T.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={carritosFiltrados}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.vendorCard}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Menu', {
                    carritoId: item.id,
                    nombre: item.nombre,
                  })
                }
              >
                <View style={styles.cardBody}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={styles.cardDesc} numberOfLines={1}>
                      {item.direccion_texto || 'Sin dirección'}
                    </Text>
                    <View style={styles.cardTags}>
                      <View style={styles.tagDistance}>
                        <Text style={styles.tagDistanceIcon}>📍</Text>
                        <Text style={styles.tagDistanceText}>
                          {item.distancia_km < 1
                            ? `${(item.distancia_km * 1000).toFixed(0)}m`
                            : `${item.distancia_km.toFixed(1)}km`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.tagStatus,
                          item.estado_abierto ? styles.tagOpen : styles.tagClosed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagStatusText,
                            item.estado_abierto ? styles.tagStatusTextOpen : styles.tagStatusTextClosed,
                          ]}
                        >
                          {item.estado_abierto ? 'Abierto' : 'Cerrado'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No hay carritos cerca en este momento
              </Text>
            }
          />
        )}
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.colors.background },
  map: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: T.colors.onSurfaceVariant,
    fontSize: 14,
    fontFamily: T.font.bodyMd.fontFamily,
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
    paddingHorizontal: 8,
    height: 48,
    ...T.shadow.card,
  },
  topBarIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarIcon: { fontSize: 20 },
  topBarTitle: {
    ...T.font.headlineMd,
    color: T.colors.primary,
    fontSize: 16,
  },

  /* Filter Chips */
  filterBar: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
  },
  filterBarContent: {
    paddingHorizontal: T.spacing.marginMain,
    gap: T.spacing.gutter,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: T.radius.full,
    backgroundColor: T.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: T.colors.surfaceVariant,
    ...T.shadow.card,
  },
  chipActive: {
    backgroundColor: T.colors.primaryContainer,
    borderColor: 'transparent',
  },
  chipIcon: { fontSize: 14, color: T.colors.onSurfaceVariant },
  chipIconActive: { color: T.colors.onPrimaryContainer },
  chipText: {
    ...T.font.labelMd,
    color: T.colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: T.colors.onPrimaryContainer,
  },

  /* Bottom Sheet */
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: T.colors.surface,
    borderTopLeftRadius: T.radius.xl,
    borderTopRightRadius: T.radius.xl,
    paddingHorizontal: T.spacing.marginMain,
    paddingTop: 8,
    paddingBottom: 12,
    maxHeight: 360,
    ...T.shadow.sheet,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: T.colors.surfaceVariant,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
  },
  sheetCount: {
    ...T.font.labelMd,
    color: T.colors.primary,
  },

  cardList: {
    gap: T.spacing.gutter,
    paddingBottom: 8,
  },

  /* Vendor Card */
  vendorCard: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    padding: T.spacing.insetCard,
    ...T.shadow.card,
  },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
  },
  cardInfo: { flex: 1 },
  cardName: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    marginBottom: 2,
  },
  cardDesc: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tagDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: T.colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radius.full,
  },
  tagDistanceIcon: { fontSize: 10 },
  tagDistanceText: {
    ...T.font.labelSm,
    color: T.colors.onSurfaceVariant,
  },
  tagStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radius.full,
  },
  tagOpen: { backgroundColor: T.colors.tertiary },
  tagClosed: { backgroundColor: T.colors.secondaryContainer },
  tagStatusText: {
    ...T.font.labelSm,
    fontWeight: '600',
  },
  tagStatusTextOpen: { color: T.colors.onTertiary },
  tagStatusTextClosed: { color: T.colors.onSecondaryContainer },

  emptyText: {
    textAlign: 'center',
    color: T.colors.onSurfaceVariant,
    marginTop: 24,
    ...T.font.bodyMd,
  },

  /* Markers */
  markerContainer: { alignItems: 'center' },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...T.shadow.card,
  },
  markerOpen: { backgroundColor: T.colors.tertiary },
  markerClosed: { backgroundColor: T.colors.secondary },
  markerIcon: { fontSize: 18 },
  markerPointer: {
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
  },
  userMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: T.colors.onPrimary,
    ...T.shadow.card,
  },
  userMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.colors.primary,
  },
  markerLabelContainer: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 4,
    maxWidth: 100,
    alignItems: 'center',
    ...T.shadow.card,
  },
  markerLabelText: {
    ...T.font.labelSm,
    fontWeight: '700',
    color: T.colors.onSurface,
    textAlign: 'center',
  },
})
