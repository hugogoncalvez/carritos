import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native'
import MapView, { styleURL, Camera, Marker, UserLocation } from '../components/MapViewWrapper'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useLocation } from '../hooks/useLocation'
import { fetchCarritosCercanos } from '../supabaseClient'
import type { CarritoConDistancia, RootStackParamList } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const { location, loading: locLoading } = useLocation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
            Dueño
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const [carritos, setCarritos] = useState<CarritoConDistancia[]>([])
  const [loading, setLoading] = useState(true)
  const [soloAbiertos, setSoloAbiertos] = useState(false)

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
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapStyle={styleURL}
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
        <UserLocation renderMode="native" />
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
                  <Text style={styles.markerText}>🍔</Text>
                </View>
              </View>
            </Marker>
          ) : null,
        )}
      </MapView>

      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Solo abiertos</Text>
        <Switch
          value={soloAbiertos}
          onValueChange={setSoloAbiertos}
          trackColor={{ false: '#ddd', true: '#A5D6A7' }}
          thumbColor={soloAbiertos ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>
          {soloAbiertos
            ? `Abiertos ahora (${carritosFiltrados.length})`
            : `Carritos cercanos (${carritosFiltrados.length})`}
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color="#D32F2F" />
        ) : (
          <FlatList
            data={carritosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.carritoItem}
                onPress={() =>
                  navigation.navigate('Menu', {
                    carritoId: item.id,
                    nombre: item.nombre,
                  })
                }
              >
                <View>
                  <Text style={styles.carritoNombre}>{item.nombre}</Text>
                  <Text style={styles.carritoDist}>
                    {item.distancia_km.toFixed(1)} km
                    {item.direccion_texto ? ` • ${item.direccion_texto}` : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.estado_abierto
                      ? styles.statusOpen
                      : styles.statusClosed,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {item.estado_abierto ? 'Abierto' : 'Cerrado'}
                  </Text>
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
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  filterBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  filterLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: 260,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  carritoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  carritoNombre: { fontSize: 15, fontWeight: '600', color: '#333' },
  carritoDist: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusOpen: { backgroundColor: '#E8F5E9' },
  statusClosed: { backgroundColor: '#F5F5F5' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#333' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 14 },
  markerContainer: { alignItems: 'center' },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  markerOpen: { backgroundColor: '#4CAF50' },
  markerClosed: { backgroundColor: '#757575' },
  markerText: { fontSize: 16 },
})
