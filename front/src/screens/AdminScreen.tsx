import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Image,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../hooks/useLocation'
import type { RootStackParamList } from '../types'
import {
  fetchMiCarrito,
  toggleEstadoAbierto,
  updateUbicacion,
  fetchMenusAdmin,
  uploadProductImage,
  deleteMenuImage,
} from '../supabaseClient'
import type { Carrito, Menu } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Admin'>

export default function AdminScreen() {
  const { user, signOut } = useAuth()
  const { location, refreshLocation } = useLocation()
  const navigation = useNavigation<Nav>()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
            Mapa
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const [carrito, setCarrito] = useState<Carrito | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const cargarMiCarrito = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await fetchMiCarrito(user.id)
      setCarrito(data)
      if (data) {
        setNombre(data.nombre)
        setDireccion(data.direccion_texto ?? '')
        setWhatsapp(data.whatsapp ?? '')
        const menuData = await fetchMenusAdmin(data.id)
        setMenus(menuData)
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar tu carrito')
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    cargarMiCarrito()
  }, [cargarMiCarrito])

  const handleToggleOpen = async (value: boolean) => {
    if (!carrito) return
    setUpdating(true)
    try {
      await toggleEstadoAbierto(carrito.id, value)
      setCarrito({ ...carrito, estado_abierto: value })
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado')
    }
    setUpdating(false)
  }

  const handleUpdateLocation = async () => {
    if (!carrito || !location) return
    setUpdating(true)
    try {
      await updateUbicacion(carrito.id, location.latitude, location.longitude)
      Alert.alert('Listo', 'Ubicación actualizada')
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la ubicación')
    }
    setUpdating(false)
  }

  const handleGuardarDatos = async () => {
    if (!carrito) return
    setUpdating(true)
    try {
      const { supabase } = await import('../supabaseClient')
      const { error } = await supabase
        .from('carritos')
        .update({
          nombre: nombre.trim(),
          direccion_texto: direccion.trim() || null,
          whatsapp: whatsapp.trim() || null,
        })
        .eq('id', carrito.id)
      if (error) throw error
      setCarrito({
        ...carrito,
        nombre: nombre.trim(),
        direccion_texto: direccion.trim() || null,
        whatsapp: whatsapp.trim() || null,
      })
      Alert.alert('Listo', 'Datos guardados')
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los datos')
    }
    setUpdating(false)
  }

  const handlePickImage = async (menu: Menu) => {
    if (!carrito) return

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    })

    if (result.canceled) return

    const originalUri = result.assets[0].uri
    setUpdating(true)

    try {
      const manipResult = await manipulateAsync(
        originalUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG },
      )

      await uploadProductImage(carrito.id, menu.id, manipResult.uri)
      const updated = await fetchMenusAdmin(carrito.id)
      setMenus(updated)
      Alert.alert('Listo', 'Imagen actualizada')
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen')
    }
    setUpdating(false)
  }

  const handleRemoveImage = async (menu: Menu) => {
    if (!menu.imagen_url) return
    setUpdating(true)
    try {
      await deleteMenuImage(menu.id, menu.imagen_url)
      const updated = await fetchMenusAdmin(menu.carrito_id)
      setMenus(updated)
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la imagen')
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mi Carrito</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logout}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {carrito ? (
        <>
          {/* INFORMACIÓN */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del carrito"
              value={nombre}
              onChangeText={setNombre}
            />
            <TextInput
              style={styles.input}
              placeholder="Dirección (opcional)"
              value={direccion}
              onChangeText={setDireccion}
            />
            <TextInput
              style={styles.input}
              placeholder="WhatsApp (+5491112345678)"
              keyboardType="phone-pad"
              value={whatsapp}
              onChangeText={setWhatsapp}
            />
            <TouchableOpacity
              style={styles.guardarBtn}
              onPress={handleGuardarDatos}
              disabled={updating}
            >
              <Text style={styles.guardarBtnText}>Guardar datos</Text>
            </TouchableOpacity>
          </View>

          {/* ESTADO */}
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>Abierto / Cerrado</Text>
              <Switch
                value={carrito.estado_abierto}
                onValueChange={handleToggleOpen}
                disabled={updating}
                trackColor={{ false: '#ddd', true: '#A5D6A7' }}
                thumbColor={carrito.estado_abierto ? '#4CAF50' : '#f4f3f4'}
              />
            </View>
            <Text style={styles.estadoTexto}>
              {carrito.estado_abierto
                ? 'Tu carrito está visible para los clientes'
                : 'Los clientes no verán tu carrito como disponible'}
            </Text>
          </View>

          {/* UBICACIÓN */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            {location ? (
              <Text style={styles.coords}>
                Lat: {location.latitude.toFixed(6)} / Lng:{' '}
                {location.longitude.toFixed(6)}
              </Text>
            ) : (
              <Text style={styles.coords}>Esperando GPS...</Text>
            )}
            <TouchableOpacity
              style={styles.ubicacionBtn}
              onPress={async () => {
                await refreshLocation()
                handleUpdateLocation()
              }}
              disabled={updating || !location}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ubicacionBtnText}>
                  Actualizar mi ubicación actual
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* PRODUCTOS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Productos ({menus.length})
            </Text>

            {menus.length === 0 ? (
              <Text style={styles.noProductos}>
                Agregá productos desde el panel de Supabase.
              </Text>
            ) : (
              menus.map((menu) => (
                <View key={menu.id} style={styles.productoRow}>
                  {menu.imagen_url ? (
                    <Image
                      source={{ uri: menu.imagen_url }}
                      style={styles.productoThumb}
                    />
                  ) : (
                    <View style={[styles.productoThumb, styles.productoThumbEmpty]}>
                      <Text style={styles.noImgText}>Sin foto</Text>
                    </View>
                  )}

                  <View style={styles.productoInfo}>
                    <Text style={styles.productoNombre}>
                      {menu.nombre_producto}
                    </Text>
                    <Text style={styles.productoPrecio}>
                      ${menu.precio.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.productoAcciones}>
                    <TouchableOpacity
                      style={styles.fotoBtn}
                      onPress={() => handlePickImage(menu)}
                      disabled={updating}
                    >
                      <Text style={styles.fotoBtnText}>
                        {menu.imagen_url ? 'Cambiar' : 'Foto'}
                      </Text>
                    </TouchableOpacity>

                    {menu.imagen_url ? (
                      <TouchableOpacity
                        onPress={() => handleRemoveImage(menu)}
                        disabled={updating}
                      >
                        <Text style={styles.eliminarImg}>Eliminar</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.noCarrito}>
            No tenés un carrito registrado todavía.
          </Text>
          <Text style={styles.noCarritoSub}>
            Contactá al administrador para crear tu carrito en la base de datos.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F' },
  logout: { color: '#D32F2F', fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
    color: '#333',
  },
  guardarBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  guardarBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estadoTexto: { fontSize: 13, color: '#888', marginTop: 4 },
  coords: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  ubicacionBtn: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  ubicacionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  noCarrito: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  noCarritoSub: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  noProductos: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 12,
  },
  productoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productoThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productoThumbEmpty: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImgText: { fontSize: 10, color: '#bbb' },
  productoInfo: { flex: 1 },
  productoNombre: { fontSize: 14, fontWeight: '600', color: '#333' },
  productoPrecio: { fontSize: 13, color: '#D32F2F', marginTop: 2 },
  productoAcciones: { alignItems: 'flex-end' },
  fotoBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fotoBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  eliminarImg: {
    color: '#D32F2F',
    fontSize: 11,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
})
