import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
} from 'react-native'
import MapView, { styleURL, Camera, Marker } from '../components/MapViewWrapper'
import { useNavigation } from '@react-navigation/native'
import { useLocation } from '../hooks/useLocation'
import { fetchCarritos, fetchCarritosCercanos, buscarCarritos } from '../supabaseClient'
import type { Carrito, CarritoConDistancia } from '../types'
import { useTheme } from '../theme'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

export default function HomeScreen() {
  const { T, isDark, setDark } = useTheme()
  const navigation = useNavigation<any>()
  const { location, loading: locLoading } = useLocation()

  const styles = useMemo(() => getStyles(T), [T])

  const [carritos, setCarritos] = useState<CarritoConDistancia[]>([])
  const [loading, setLoading] = useState(true)
  const [soloAbiertos, setSoloAbiertos] = useState(false)
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [radioKm, setRadioKm] = useState(10)
  const [showDistOpts, setShowDistOpts] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<CarritoConDistancia[]>([])
  const [searching, setSearching] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(14)
  const [showOwnerModal, setShowOwnerModal] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const collapseAnim = useRef(new Animated.Value(0)).current

  const toggleCollapse = useCallback(() => {
    const toValue = collapsed ? 0 : 1
    Animated.spring(collapseAnim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start()
    setCollapsed(!collapsed)
  }, [collapsed, collapseAnim])

  /* Bottom Sheet expand */
  const sheetAnim = useRef(new Animated.Value(SHEET_MAX)).current
  const sheetMaxVal = useRef(new Animated.Value(SHEET_MAX)).current
  const sheetExpandedRef = useRef(true)
  const [sheetExpanded, setSheetExpanded] = useState(true)

  const animateSheet = useCallback((toValue: number, expanded: boolean) => {
    sheetExpandedRef.current = expanded
    setSheetExpanded(expanded)
    Animated.timing(sheetAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [sheetAnim])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 5,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dy < -30) {
          animateSheet(SHEET_MAX, true)
        } else if (gesture.dy > 30) {
          animateSheet(SHEET_PEEK, false)
        } else {
          const wasExpanded = sheetExpandedRef.current
          animateSheet(wasExpanded ? SHEET_PEEK : SHEET_MAX, !wasExpanded)
        }
      },
    }),
  ).current

  const cargarCarritos = useCallback(async () => {
    if (!location && !mostrarTodos) return
    setLoading(true)
    try {
      let data: CarritoConDistancia[]
      if (mostrarTodos) {
        const todos = await fetchCarritos()
        data = todos.map((c) => ({ ...c, distancia_km: 0 }))
      } else {
        data = await fetchCarritosCercanos(
          location!.latitude,
          location!.longitude,
          radioKm,
        )
      }
      setCarritos(data)
    } catch {
      // Silently fail
    }
    setLoading(false)
  }, [location, mostrarTodos, radioKm])

  useEffect(() => {
    cargarCarritos()
  }, [cargarCarritos])

  useEffect(() => {
    if (!showSearch || searchText.length < 2) return
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await buscarCarritos(searchText)
        setSearchResults(results.map((r) => ({ ...r, distancia_km: 0 } as CarritoConDistancia)))
      } catch {
        setSearchResults([])
      }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText, showSearch])

  const carritosFiltrados = carritos.filter((c) => {
    if (soloAbiertos && !c.estado_abierto) return false
    return true
  })

  const displayCarritos = showSearch && searchText.length >= 2 ? searchResults : carritosFiltrados

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
                navigation.navigate('Menu', { carritoId: c.id, nombre: c.nombre, imagen_url: c.imagen_url, icono: c.icono })
              }
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.marker,
                    c.estado_abierto ? styles.markerOpen : styles.markerClosed,
                  ]}
                >
                  <Text style={styles.markerIcon}>{c.icono || '🍔'}</Text>
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
      <Animated.View style={[
        styles.topBar,
        {
          opacity: collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ translateY: collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -130] }) }],
        },
      ]}>
        {showSearch ? (
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar carrito..."
              placeholderTextColor={T.colors.onSurfaceVariant}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            <TouchableOpacity
              style={styles.topBarIconBtn}
              onPress={() => {
                setShowSearch(false)
                setSearchText('')
              }}
            >
              <Text style={styles.topBarIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.topBarIconBtn}
              onPress={toggleCollapse}
            >
              <MaterialIcons name="keyboard-arrow-up" size={24} color={T.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Carritos Al Toque</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={styles.topBarIconBtn}
                onPress={() => setShowSearch(true)}
              >
                <MaterialIcons name="search" size={22} color={T.colors.onSurface} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topBarIconBtn}
                onPress={() => setDark(!isDark)}
              >
                <Text style={styles.topBarIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topBarIconBtn}
                onPress={() => setShowOwnerModal(true)}
              >
                <MaterialIcons name="settings" size={22} color={T.colors.onSurface} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>

      {/* FILTER CHIPS */}
      <Animated.View style={[styles.filterBar, {
        opacity: collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [{ translateY: collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -130] }) }],
      }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
        <TouchableOpacity
          style={[styles.chip, soloAbiertos && styles.chipActive]}
          onPress={() => setSoloAbiertos(!soloAbiertos)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipIcon, soloAbiertos && styles.chipIconActive]}>✓</Text>
          <Text style={[styles.chipText, soloAbiertos && styles.chipTextActive]}>
            Abiertos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, mostrarTodos && styles.chipActive]}
          onPress={() => setMostrarTodos(!mostrarTodos)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipIcon, mostrarTodos && styles.chipIconActive]}>🌐</Text>
          <Text style={[styles.chipText, mostrarTodos && styles.chipTextActive]}>Todos</Text>
        </TouchableOpacity>
        {!mostrarTodos && (
          <TouchableOpacity
            style={[styles.chip, showDistOpts && styles.chipActive]}
            onPress={() => setShowDistOpts(!showDistOpts)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipIcon, showDistOpts && styles.chipIconActive]}>📍</Text>
            <Text style={[styles.chipText, showDistOpts && styles.chipTextActive]}>
              {radioKm}km
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      </Animated.View>

      {/* FLOATING EXPAND BUTTON (visible when collapsed) */}
      <Animated.View style={{
        position: 'absolute',
        top: 60,
        right: T.spacing.marginMain,
        opacity: collapseAnim,
        transform: [{ translateY: collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
      }}>
        <TouchableOpacity
          onPress={toggleCollapse}
          activeOpacity={0.8}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: T.colors.primaryContainer,
            justifyContent: 'center',
            alignItems: 'center',
            ...T.shadow.card,
          }}
        >
          <MaterialIcons name="keyboard-arrow-down" size={24} color={T.colors.onPrimaryContainer} />
        </TouchableOpacity>
      </Animated.View>

      {/* DISTANCE OPTIONS */}
      {showDistOpts && !mostrarTodos && (
        <View style={styles.distanceBar}>
          {[1, 2, 5, 10, 20, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.distanceChip, radioKm === d && styles.distanceChipActive]}
              onPress={() => { setRadioKm(d); setShowDistOpts(false) }}
              activeOpacity={0.7}
            >
              <Text style={[styles.distanceChipText, radioKm === d && styles.distanceChipTextActive]}>
                {d}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* OWNER ACCESS MODAL */}
      <Modal
        visible={showOwnerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOwnerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Panel de Dueños</Text>
            <Text style={styles.modalDesc}>
              ¿Sos dueño de un carrito? Iniciá sesión para gestionar tu negocio.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowOwnerModal(false)
                navigation.navigate('Login')
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowOwnerModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BOTTOM SHEET - VENDOR CARDS (expandable) */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: Animated.subtract(sheetMaxVal, sheetAnim) }] },
        ]}
      >
        <View style={styles.sheetHandleWrapper} {...panResponder.panHandlers}>
          <View style={styles.sheetHandle} />
        </View>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>
              {showSearch && searchText.length >= 2
                ? 'Resultados'
                : soloAbiertos
                  ? 'Abiertos ahora'
                  : mostrarTodos
                    ? 'Todos los carritos'
                    : 'Carritos cercanos'}
            </Text>
            <Text style={styles.sheetCount}>{displayCarritos.length}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              const wasExpanded = sheetExpandedRef.current
              animateSheet(wasExpanded ? SHEET_PEEK : SHEET_MAX, !wasExpanded)
            }}
            activeOpacity={0.7}
            style={styles.sheetToggleBtn}
          >
            <Text style={styles.sheetToggleIcon}>
              {sheetExpanded ? '▼' : '▲'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading || searching ? (
          <ActivityIndicator size="small" color={T.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={displayCarritos}
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
                    imagen_url: item.imagen_url,
                    icono: item.icono,
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
                      {item.distancia_km > 0 ? (
                        <View style={styles.tagDistance}>
                          <Text style={styles.tagDistanceIcon}>📍</Text>
                          <Text style={styles.tagDistanceText}>
                            {item.distancia_km < 1
                              ? `${(item.distancia_km * 1000).toFixed(0)}m`
                              : `${item.distancia_km.toFixed(1)}km`}
                          </Text>
                        </View>
                      ) : null}
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
                  {item.imagen_url ? (
                    <Image source={{ uri: item.imagen_url }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Text style={styles.cardImageEmoji}>{item.icono || '🍔'}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {showSearch && searchText.length >= 2
                  ? 'No se encontraron carritos'
                  : mostrarTodos
                    ? 'No hay carritos registrados'
                    : 'No hay carritos cerca en este momento'}
              </Text>
            }
          />
        )}
      </Animated.View>

    </View>
  )
}

const SHEET_PEEK = 120
const SHEET_MAX = 400

function getStyles(T: any) {
  return StyleSheet.create({
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
      fontSize: 18,
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
    searchRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    searchInput: {
      flex: 1,
      height: 36,
      backgroundColor: T.colors.surfaceContainerHigh,
      borderRadius: T.radius.full,
      paddingHorizontal: 14,
      ...T.font.bodyMd,
      color: T.colors.onSurface,
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
      justifyContent: 'center',

    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 18,
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
    chipIcon: { fontSize: 16, color: T.colors.onSurfaceVariant },
    chipIconActive: { color: T.colors.onPrimaryContainer },
    chipText: {
      ...T.font.labelMd,
      color: T.colors.onSurfaceVariant,
    },
    chipTextActive: {
      color: T.colors.onPrimaryContainer,
    },

    /* Distance Selector */
    distanceBar: {
      position: 'absolute',
      top: 168,
      left: T.spacing.marginMain,
      right: T.spacing.marginMain,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    distanceChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: T.radius.full,
      backgroundColor: T.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: T.colors.surfaceVariant,
    },
    distanceChipActive: {
      backgroundColor: T.colors.primaryContainer,
      borderColor: 'transparent',
    },
    distanceChipText: {
      ...T.font.labelSm,
      color: T.colors.onSurfaceVariant,
    },
    distanceChipTextActive: {
      color: T.colors.onPrimaryContainer,
      fontWeight: '600',
    },

    /* Bottom Sheet (expandable) */
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: SHEET_MAX, // module-level constant
      backgroundColor: T.colors.surface,
      borderTopLeftRadius: T.radius.xl,
      borderTopRightRadius: T.radius.xl,
      paddingHorizontal: T.spacing.marginMain,
      paddingTop: 4,
      paddingBottom: 12,
      ...T.shadow.sheet,
    },
    sheetHandleWrapper: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    sheetHandleHitArea: {
      paddingHorizontal: 24,
      paddingVertical: 4,
    },
    sheetHandle: {
      width: 48,
      height: 5,
      borderRadius: 3,
      backgroundColor: T.colors.surfaceVariant,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 12,
    },
    sheetTitleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 15,
    },
    sheetTitle: {
      ...T.font.headlineSm,
      color: T.colors.onSurface,
    },
    sheetCount: {
      ...T.font.bodyMd,
      color: T.colors.primary,
      backgroundColor: T.colors.primaryContainer + '33',
      borderRadius: T.radius.full,
      paddingHorizontal: 8,
      paddingVertical: 1,
      fontWeight: 'bold'
    },
    sheetToggleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sheetToggleIcon: {
      fontSize: 14,
      color: T.colors.onSurfaceVariant,
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
    cardImage: {
      width: 64,
      height: 64,
      borderRadius: T.radius.md,
    },
    cardImagePlaceholder: {
      width: 64,
      height: 64,
      borderRadius: T.radius.md,
      backgroundColor: T.colors.surfaceContainerHigh,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardImageEmoji: { fontSize: 28 },
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

    /* Owner Modal */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    modalContent: {
      backgroundColor: T.colors.surfaceContainerLowest,
      borderRadius: T.radius.xl,
      padding: 28,
      alignItems: 'center',
      width: '100%',
      maxWidth: 340,
    },
    modalTitle: {
      ...T.font.headlineMd,
      color: T.colors.onSurface,
      marginBottom: 8,
    },
    modalDesc: {
      ...T.font.bodyMd,
      color: T.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 24,
    },
    modalButton: {
      backgroundColor: T.colors.primaryContainer,
      borderRadius: T.radius.lg,
      paddingVertical: 14,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalButtonText: {
      ...T.font.headlineSm,
      color: T.colors.onPrimaryContainer,
    },
    modalClose: {
      paddingVertical: 8,
    },
    modalCloseText: {
      ...T.font.bodyMd,
      color: T.colors.onSurfaceVariant,
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
}
