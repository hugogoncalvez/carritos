import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Image,
  Modal,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../hooks/useLocation'
import {
  fetchMisCarritos,
  toggleEstadoAbierto,
  updateUbicacion,
  fetchMenusAdmin,
  upsertMenu,
  deleteMenu,
  uploadProductImage,
  uploadCarritoImage,
  deleteMenuImage,
} from '../supabaseClient'
import type { Carrito, Menu } from '../types'
import { T } from '../theme'

export default function AdminScreen() {
  const { user, signOut } = useAuth()
  const { location, refreshLocation } = useLocation()

  const [carritos, setCarritos] = useState<Carrito[]>([])
  const [selectedCarrito, setSelectedCarrito] = useState<Carrito | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [icono, setIcono] = useState('')
  const [carritoImageUri, setCarritoImageUri] = useState<string | null>(null)

  const FOOD_EMOJIS = ['🍔','🌮','🌯','🌭','🥪','🍕','🍝','🥘','🍛','🍣','🥟','🍦','🍩','🧁','🥧','🍰','🍪','🥗','🥙','🧆','🍜','🍲','🥫','🥤','🧃','🍺','🍷','🥂','☕','🧉']

  /* Menu CRUD */
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [menuNombre, setMenuNombre] = useState('')
  const [menuDesc, setMenuDesc] = useState('')
  const [menuPrecio, setMenuPrecio] = useState('')
  const [newMenuImageUri, setNewMenuImageUri] = useState<string | null>(null)
  const [imgRefresh, setImgRefresh] = useState(0)

  const openNewMenu = () => {
    setEditingMenu(null)
    setMenuNombre('')
    setMenuDesc('')
    setMenuPrecio('')
    setNewMenuImageUri(null)
    setShowMenuModal(true)
  }

  const openEditMenu = (menu: Menu) => {
    setEditingMenu(menu)
    setMenuNombre(menu.nombre_producto)
    setMenuDesc(menu.descripcion ?? '')
    setMenuPrecio(menu.precio.toString())
    setNewMenuImageUri(null)
    setShowMenuModal(true)
  }

  const handlePickNewImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    })
    if (!result.canceled && result.assets[0]) {
      const manipResult = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG },
      )
      setNewMenuImageUri(manipResult.uri)
    }
  }

  const handleTakeNewPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar la foto.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    })
    if (!result.canceled && result.assets[0]) {
      const manipResult = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG },
      )
      setNewMenuImageUri(manipResult.uri)
    }
  }

  const handleSaveMenu = async () => {
    if (!selectedCarrito || !menuNombre.trim()) {
      Alert.alert('Error', 'El nombre del producto es obligatorio')
      return
    }
    const precio = parseFloat(menuPrecio)
    if (isNaN(precio) || precio <= 0) {
      Alert.alert('Error', 'Precio inválido')
      return
    }
    setUpdating(true)
    try {
      const menuPayload: Record<string, any> = {
        carrito_id: selectedCarrito.id,
        nombre_producto: menuNombre.trim(),
        descripcion: menuDesc.trim() || null,
        precio,
        disponible: editingMenu ? editingMenu.disponible : true,
      }
      if (editingMenu?.id) {
        menuPayload.id = editingMenu.id
      }
      const savedMenu = await upsertMenu(menuPayload as any)
      if (newMenuImageUri) {
        await uploadProductImage(selectedCarrito.id, savedMenu.id, newMenuImageUri)
      }
      const updated = await fetchMenusAdmin(selectedCarrito.id)
      setMenus(updated)
      setImgRefresh((prev) => prev + 1)
      setShowMenuModal(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      Alert.alert('Error', msg)
    }
    setUpdating(false)
  }

  const handleToggleDisponible = async (menu: Menu) => {
    setUpdating(true)
    try {
      await upsertMenu({
        id: menu.id,
        carrito_id: menu.carrito_id,
        nombre_producto: menu.nombre_producto,
        descripcion: menu.descripcion,
        precio: menu.precio,
        disponible: !menu.disponible,
      } as any)
      const updated = await fetchMenusAdmin(menu.carrito_id)
      setMenus(updated)
      setImgRefresh((prev) => prev + 1)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      Alert.alert('Error', msg)
    }
    setUpdating(false)
  }

  const handleDeleteMenu = async (menu: Menu) => {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${menu.nombre_producto}" del menú?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true)
            try {
              await deleteMenu(menu.id)
              const updated = await fetchMenusAdmin(menu.carrito_id)
              setMenus(updated)
              setImgRefresh((prev) => prev + 1)
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el producto')
            }
            setUpdating(false)
          },
        },
      ],
    )
  }

  const cargarMisCarritos = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await fetchMisCarritos(user.id)
      setCarritos(data)
      if (data.length === 1) {
        setSelectedCarrito(data[0])
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar tus carritos')
    }
    setLoading(false)
  }, [user])

  const switchCarrito = useCallback(async (carrito: Carrito) => {
    setSelectedCarrito(carrito)
    setNombre(carrito.nombre)
    setDireccion(carrito.direccion_texto ?? '')
    setWhatsapp(carrito.whatsapp ?? '')
    setIcono(carrito.icono ?? '')
    setCarritoImageUri(null)
    setUpdating(true)
    try {
      const menuData = await fetchMenusAdmin(carrito.id)
      setMenus(menuData)
    } catch {
      setMenus([])
    }
    setUpdating(false)
  }, [])

  useEffect(() => {
    cargarMisCarritos()
  }, [cargarMisCarritos])

  const handleToggleOpen = async (value: boolean) => {
    if (!selectedCarrito) return
    setUpdating(true)
    try {
      await toggleEstadoAbierto(selectedCarrito.id, value)
      setSelectedCarrito({ ...selectedCarrito, estado_abierto: value })
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado')
    }
    setUpdating(false)
  }

  const handleUpdateLocation = async () => {
    if (!selectedCarrito || !location) return
    setUpdating(true)
    try {
      await updateUbicacion(selectedCarrito.id, location.latitude, location.longitude)
      Alert.alert('Listo', 'Ubicación actualizada')
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la ubicación')
    }
    setUpdating(false)
  }

  const handlePickCarritoImage = async () => {
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
    const manipResult = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG },
    )
    setCarritoImageUri(manipResult.uri)
  }

  const handleTakeCarritoPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    })
    if (result.canceled) return
    const manipResult = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG },
    )
    setCarritoImageUri(manipResult.uri)
  }

  const handleGuardarDatos = async () => {
    if (!selectedCarrito) return
    setUpdating(true)
    try {
      const { supabase } = await import('../supabaseClient')
      let nuevaImagenUrl: string | null = selectedCarrito.imagen_url
      if (carritoImageUri) {
        nuevaImagenUrl = await uploadCarritoImage(selectedCarrito.id, carritoImageUri)
      }
      const updates: Record<string, any> = {
        nombre: nombre.trim(),
        direccion_texto: direccion.trim() || null,
        whatsapp: whatsapp.trim() || null,
        icono: icono || null,
      }
      if (carritoImageUri) {
        updates.imagen_url = nuevaImagenUrl
      }
      const { error } = await supabase
        .from('carritos')
        .update(updates)
        .eq('id', selectedCarrito.id)
      if (error) throw error
      setSelectedCarrito({
        ...selectedCarrito,
        nombre: nombre.trim(),
        direccion_texto: direccion.trim() || null,
        whatsapp: whatsapp.trim() || null,
        icono: icono || null,
        imagen_url: nuevaImagenUrl,
      })
      setCarritoImageUri(null)
      Alert.alert('Listo', 'Datos guardados')
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los datos')
    }
    setUpdating(false)
  }

  const handlePickImage = async (menu: Menu) => {
    if (!selectedCarrito) return

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

      await uploadProductImage(selectedCarrito.id, menu.id, manipResult.uri)
      const updated = await fetchMenusAdmin(selectedCarrito.id)
      setMenus(updated)
      setImgRefresh((prev) => prev + 1)
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
      setImgRefresh((prev) => prev + 1)
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la imagen')
    }
    setUpdating(false)
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
      {/* FLOATING TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarBtn} onPress={signOut}>
          <Text style={styles.topBarBtnIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Carritos Al Toque</Text>
        <TouchableOpacity style={styles.topBarBtn} onPress={signOut}>
          <Text style={styles.topBarBtnIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {carritos.length === 0 ? (
          <>
            <View style={styles.card}>
              <Text style={styles.noCarrito}>No tenés carritos registrados todavía.</Text>
              <Text style={styles.noCarritoSub}>
                Contactá al administrador para crear tu carrito en la base de datos.
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
              <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
        ) : !selectedCarrito ? (
          <>
            <Text style={styles.sectionTitle}>Tus Carritos</Text>
            {carritos.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.carritoCard}
                onPress={() => switchCarrito(c)}
                activeOpacity={0.7}
              >
                <View style={styles.carritoCardInfo}>
                  <Text style={styles.carritoCardName}>{c.nombre}</Text>
                  <View style={styles.carritoCardTags}>
                    <View style={[
                      styles.carritoCardStatus,
                      c.estado_abierto ? styles.carritoCardStatusOpen : styles.carritoCardStatusClosed,
                    ]}>
                      <Text style={[
                        styles.carritoCardStatusText,
                        c.estado_abierto ? styles.carritoCardStatusTextOpen : styles.carritoCardStatusTextClosed,
                      ]}>
                        {c.estado_abierto ? 'Abierto' : 'Cerrado'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.carritoCardAction}>Gestionar ›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
              <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* BACK BUTTON */}
            {carritos.length > 1 && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setSelectedCarrito(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.backBtnText}>← Volver a mis carritos</Text>
              </TouchableOpacity>
            )}

            {/* PROFILE CARD */}
            <View style={styles.profileCard}>
              <View style={styles.profileBanner}>
                <View style={styles.profileBannerPlaceholder}>
                  <Text style={styles.bannerPlaceholderIcon}>🛒</Text>
                </View>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>🍔</Text>
                  </View>
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{selectedCarrito.nombre}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingIcon}>⭐</Text>
                  <Text style={styles.ratingText}>4.8 (120 Reseñas)</Text>
                </View>
                <View style={styles.profileTags}>
                  <View style={styles.profileTag}>
                    <Text style={styles.profileTagText}>Carnes</Text>
                  </View>
                  <View style={styles.profileTag}>
                    <Text style={styles.profileTagText}>Parrilla</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* STATUS TOGGLE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Estado del Carrito</Text>
              <TouchableOpacity
                style={styles.statusToggleButton}
                onPress={() => handleToggleOpen(!selectedCarrito.estado_abierto)}
                disabled={updating}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.statusToggleTrack,
                  selectedCarrito.estado_abierto && styles.statusToggleTrackOpen,
                ]}>
                  <View style={[
                    styles.statusToggleThumb,
                    selectedCarrito.estado_abierto && styles.statusToggleThumbOpen,
                  ]}>
                    <Text style={styles.statusToggleIcon}>🏪</Text>
                  </View>
                  <View style={styles.statusToggleLabels}>
                    <Text style={[
                      styles.statusToggleLabel,
                      !selectedCarrito.estado_abierto && styles.statusToggleLabelActive,
                    ]}>CERRADO</Text>
                    <Text style={[
                      styles.statusToggleLabel,
                      selectedCarrito.estado_abierto && styles.statusToggleLabelActive,
                    ]}>ABIERTO</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.statusText}>
                {selectedCarrito.estado_abierto
                  ? '¡Estás abierto! Listo para recibir pedidos.'
                  : 'Actualmente no estás recibiendo pedidos.'}
              </Text>
            </View>

            {/* QUICK ACTIONS */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCardPrimary}
                onPress={async () => {
                  await refreshLocation()
                  handleUpdateLocation()
                }}
                disabled={updating || !location}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconCircle}>
                  <Text style={styles.actionIcon}>📍</Text>
                </View>
                <Text style={styles.actionLabel}>Actualizar{'\n'}Mi Ubicación</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCardWide} activeOpacity={0.7}>
                <View style={styles.actionIconCircleSecondary}>
                  <Text style={styles.actionIcon}>📊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabelWide}>Estadísticas del Día</Text>
                  <Text style={styles.actionSublabel}>12 Pedidos • $4,500</Text>
                </View>
                <Text style={styles.actionChevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* INFO CARD */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Información</Text>

              {/* CARRIto IMAGE */}
              <Text style={styles.fieldLabel}>Foto del carrito</Text>
              {carritoImageUri ? (
                <Image source={{ uri: carritoImageUri }} style={styles.carritoImagePreview} />
              ) : selectedCarrito?.imagen_url ? (
                <Image
                  source={{ uri: selectedCarrito.imagen_url + '?t=' + imgRefresh }}
                  style={styles.carritoImagePreview}
                />
              ) : (
                <View style={styles.carritoImagePlaceholder}>
                  <Text style={styles.carritoImagePlaceholderEmoji}>{icono || '🍔'}</Text>
                </View>
              )}
              <View style={styles.carritoImageRow}>
                <TouchableOpacity style={styles.carritoImageBtn} onPress={handlePickCarritoImage} activeOpacity={0.7}>
                  <Text style={styles.carritoImageBtnText}>📷 Elegir foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.carritoImageBtn} onPress={handleTakeCarritoPhoto} activeOpacity={0.7}>
                  <Text style={styles.carritoImageBtnText}>📸 Sacar foto</Text>
                </TouchableOpacity>
              </View>

              {/* ICON / EMOJI */}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Ícono</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
                {FOOD_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiItem, icono === e && styles.emojiItemActive]}
                    onPress={() => setIcono(icono === e ? '' : e)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Nombre del carrito"
                placeholderTextColor={T.colors.surfaceContainerHighest}
                value={nombre}
                onChangeText={setNombre}
              />
              <TextInput
                style={styles.input}
                placeholder="Dirección (opcional)"
                placeholderTextColor={T.colors.surfaceContainerHighest}
                value={direccion}
                onChangeText={setDireccion}
              />
              <TextInput
                style={styles.input}
                placeholder="WhatsApp (+5491112345678)"
                placeholderTextColor={T.colors.surfaceContainerHighest}
                keyboardType="phone-pad"
                value={whatsapp}
                onChangeText={setWhatsapp}
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleGuardarDatos}
                disabled={updating}
                activeOpacity={0.7}
              >
                {updating ? (
                  <ActivityIndicator color={T.colors.onPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar datos</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* MENU */}
            <View style={styles.card}>
              <View style={styles.menuHeader}>
                <Text style={styles.cardTitle}>Menú ({menus.length})</Text>
                <TouchableOpacity
                  style={styles.addMenuBtn}
                  onPress={openNewMenu}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addMenuBtnText}>+ Agregar</Text>
                </TouchableOpacity>
              </View>
              {menus.length === 0 ? (
                <Text style={styles.emptyProducts}>
                  Tocá "Agregar" para cargar tu primer producto.
                </Text>
              ) : (
                menus.map((menu) => (
                  <TouchableOpacity
                    key={menu.id}
                    style={styles.productRow}
                    onPress={() => openEditMenu(menu)}
                    activeOpacity={0.7}
                  >
                    {menu.imagen_url ? (
                      <Image
                        source={{ uri: menu.imagen_url + '?t=' + imgRefresh }}
                        style={styles.productThumb}
                      />
                    ) : (
                      <View style={[styles.productThumb, styles.productThumbEmpty]}>
                        <Text style={styles.noImgText}>📷</Text>
                      </View>
                    )}
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, !menu.disponible && styles.productNameDisabled]}>
                        {menu.nombre_producto}
                      </Text>
                      <Text style={styles.productPrice}>${menu.precio.toFixed(2)}</Text>
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={[
                          styles.disponibleBtn,
                          menu.disponible ? styles.disponibleBtnOn : styles.disponibleBtnOff,
                        ]}
                        onPress={() => handleToggleDisponible(menu)}
                        disabled={updating}
                      >
                        <Text style={[
                          styles.disponibleBtnText,
                          menu.disponible ? styles.disponibleBtnTextOn : styles.disponibleBtnTextOff,
                        ]}>
                          {menu.disponible ? 'Disponible' : 'No disponible'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteMenu(menu)}
                        disabled={updating}
                      >
                        <Text style={styles.removeBtnText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* LOGOUT */}
            <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
              <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
            </TouchableOpacity>

            {/* MENU MODAL */}
            <Modal
              visible={showMenuModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowMenuModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.menuModal}>
                  <Text style={styles.menuModalTitle}>
                    {editingMenu ? 'Editar producto' : 'Nuevo producto'}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del producto"
                    placeholderTextColor={T.colors.surfaceContainerHighest}
                    value={menuNombre}
                    onChangeText={setMenuNombre}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Descripción (opcional)"
                    placeholderTextColor={T.colors.surfaceContainerHighest}
                    value={menuDesc}
                    onChangeText={setMenuDesc}
                    multiline
                    numberOfLines={3}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Precio"
                    placeholderTextColor={T.colors.surfaceContainerHighest}
                    value={menuPrecio}
                    onChangeText={setMenuPrecio}
                    keyboardType="decimal-pad"
                  />

                  <>
                    {newMenuImageUri ? (
                      <Image
                        source={{ uri: newMenuImageUri }}
                        style={styles.menuModalImagePreview}
                      />
                    ) : editingMenu?.imagen_url ? (
                      <Image
                        source={{ uri: editingMenu.imagen_url + '?t=' + imgRefresh }}
                        style={styles.menuModalImagePreview}
                      />
                    ) : null}
                    <View style={styles.menuModalImageRow}>
                      <TouchableOpacity
                        style={styles.menuModalImageBtn}
                        onPress={handlePickNewImage}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.menuModalImageBtnText}>
                          {newMenuImageUri || editingMenu?.imagen_url
                            ? 'Cambiar foto'
                            : '📷  Elegir foto'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.menuModalImageBtn}
                        onPress={handleTakeNewPhoto}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.menuModalImageBtnText}>
                          📸  Sacar foto
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>

                  <View style={styles.menuModalActions}>
                    <TouchableOpacity
                      style={styles.menuModalCancel}
                      onPress={() => setShowMenuModal(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.menuModalCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.menuModalSave}
                      onPress={handleSaveMenu}
                      disabled={updating}
                      activeOpacity={0.7}
                    >
                      {updating ? (
                        <ActivityIndicator color={T.colors.onPrimary} size="small" />
                      ) : (
                        <Text style={styles.menuModalSaveText}>Guardar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingTop: 116,
    paddingHorizontal: T.spacing.marginMain,
    paddingBottom: 120,
    gap: T.spacing.stackLg,
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
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    overflow: 'hidden',
    ...T.shadow.card,
  },
  profileBanner: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  profileBannerPlaceholder: {
    flex: 1,
    backgroundColor: T.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerPlaceholderIcon: { fontSize: 36 },
  avatarContainer: {
    position: 'absolute',
    bottom: -30,
    left: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.colors.surfaceContainerLowest,
    borderWidth: 4,
    borderColor: T.colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 32 },
  profileInfo: {
    paddingTop: 36,
    paddingHorizontal: T.spacing.insetCard,
    paddingBottom: T.spacing.insetCard,
  },
  profileName: {
    ...T.font.headlineMd,
    color: T.colors.onSurface,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: T.spacing.stackMd,
  },
  ratingIcon: { fontSize: 14 },
  ratingText: {
    ...T.font.labelMd,
    color: T.colors.onSurfaceVariant,
  },
  profileTags: {
    flexDirection: 'row',
    gap: 8,
  },
  profileTag: {
    backgroundColor: T.colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: T.radius.full,
  },
  profileTagText: {
    ...T.font.labelSm,
    color: T.colors.onSurfaceVariant,
  },

  /* Card */
  card: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    padding: T.spacing.insetCard,
    ...T.shadow.card,
  },
  cardTitle: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    marginBottom: T.spacing.stackMd,
  },

  /* Status Toggle */
  statusToggleButton: {
    alignItems: 'center',
    marginBottom: T.spacing.stackMd,
  },
  statusToggleTrack: {
    width: 280,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.colors.surfaceContainerHighest,
    position: 'relative',
    overflow: 'hidden',
  },
  statusToggleTrackOpen: {
    backgroundColor: T.colors.tertiaryContainer + '4D',
  },
  statusToggleThumb: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    zIndex: 10,
  },
  statusToggleThumbOpen: {
    left: undefined,
    right: 4,
    backgroundColor: T.colors.tertiary,
  },
  statusToggleIcon: { fontSize: 24 },
  statusToggleLabels: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  statusToggleLabel: {
    ...T.font.headlineSm,
    color: T.colors.onSurfaceVariant,
    fontSize: 14,
  },
  statusToggleLabelActive: {
    color: T.colors.onSurface,
    fontWeight: '700',
  },
  statusText: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
    textAlign: 'center',
  },

  /* Quick Actions */
  actionsGrid: {
    gap: T.spacing.gutter,
  },
  actionCardPrimary: {
    backgroundColor: T.colors.primaryContainer,
    borderRadius: T.radius.lg,
    padding: T.spacing.insetCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 120,
    ...T.shadow.card,
  },
  actionCardSecondary: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    padding: T.spacing.insetCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 120,
    borderWidth: 1,
    borderColor: T.colors.surfaceVariant + '80',
    ...T.shadow.card,
  },
  actionCardWide: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    padding: T.spacing.insetCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: T.colors.surfaceVariant + '80',
    ...T.shadow.card,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.onPrimaryContainer + '1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconCircleSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: { fontSize: 18 },
  actionLabel: {
    ...T.font.labelMd,
    color: T.colors.onSurface,
    flex: 1,
  },
  actionLabelWide: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    marginBottom: 2,
  },
  actionSublabel: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
  },
  actionChevron: {
    fontSize: 24,
    color: T.colors.onSurfaceVariant,
  },

  /* Input */
  input: {
    borderWidth: 1,
    borderColor: T.colors.surfaceVariant,
    borderRadius: T.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: T.font.bodyMd.fontFamily,
    color: T.colors.onSurface,
    marginBottom: 10,
    backgroundColor: T.colors.surfaceContainerLowest,
  },
  saveBtn: {
    backgroundColor: T.colors.primary,
    borderRadius: T.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    ...T.font.labelMd,
    color: T.colors.onPrimary,
    fontSize: 15,
  },

  /* Carrito Image */
  fieldLabel: {
    ...T.font.labelSm,
    color: T.colors.onSurfaceVariant,
    marginBottom: 6,
  },
  carritoImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: T.radius.md,
    marginBottom: 8,
  },
  carritoImagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: T.radius.md,
    backgroundColor: T.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  carritoImagePlaceholderEmoji: {
    fontSize: 56,
  },
  carritoImageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  carritoImageBtn: {
    flex: 1,
    backgroundColor: T.colors.surfaceContainerHigh,
    borderRadius: T.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  carritoImageBtnText: {
    ...T.font.labelSm,
    color: T.colors.onSurface,
  },
  emojiScroll: {
    marginBottom: 12,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: T.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    backgroundColor: T.colors.surfaceContainerHigh,
  },
  emojiItemActive: {
    backgroundColor: T.colors.primaryContainer,
    borderWidth: 2,
    borderColor: T.colors.primary,
  },
  emojiText: {
    fontSize: 22,
  },

  /* Products */
  emptyProducts: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
    textAlign: 'center',
    marginVertical: T.spacing.stackLg,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.colors.surfaceContainerHigh,
    gap: 12,
  },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: T.radius.md,
  },
  productThumbEmpty: {
    backgroundColor: T.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImgText: { fontSize: 18 },
  productInfo: { flex: 1 },
  productName: {
    ...T.font.bodyMd,
    fontWeight: '600',
    color: T.colors.onSurface,
  },
  productPrice: {
    ...T.font.bodyMd,
    color: T.colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  productActions: { alignItems: 'flex-end', gap: 4 },
  photoBtn: {
    backgroundColor: T.colors.primary,
    borderRadius: T.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  photoBtnText: {
    ...T.font.labelMd,
    color: T.colors.onPrimary,
  },
  removeBtnText: {
    ...T.font.labelSm,
    color: T.colors.primary,
    textDecorationLine: 'underline',
  },

  /* Menu Header */
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.spacing.stackMd,
  },
  addMenuBtn: {
    backgroundColor: T.colors.primaryContainer,
    borderRadius: T.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addMenuBtnText: {
    ...T.font.labelMd,
    color: T.colors.onPrimaryContainer,
    fontWeight: '600',
  },

  /* Product Disabled */
  productNameDisabled: {
    textDecorationLine: 'line-through',
    color: T.colors.onSurfaceVariant,
  },
  disponibleBtn: {
    borderRadius: T.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  disponibleBtnOn: {
    backgroundColor: T.colors.tertiaryContainer + '80',
  },
  disponibleBtnOff: {
    backgroundColor: T.colors.surfaceContainerHigh,
  },
  disponibleBtnText: {
    ...T.font.labelSm,
    fontWeight: '600',
  },
  disponibleBtnTextOn: {
    color: T.colors.onTertiaryContainer,
  },
  disponibleBtnTextOff: {
    color: T.colors.onSurfaceVariant,
  },

  /* Menu Modal */
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 100,
  },
  menuModal: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  menuModalTitle: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    marginBottom: 16,
  },
  menuModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  menuModalCancel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: T.radius.md,
  },
  menuModalCancelText: {
    ...T.font.labelMd,
    color: T.colors.onSurfaceVariant,
  },
  menuModalSave: {
    backgroundColor: T.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: T.radius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  menuModalSaveText: {
    ...T.font.labelMd,
    color: T.colors.onPrimary,
  },
  menuModalImagePreview: {
    width: '100%',
    height: 160,
    borderRadius: T.radius.md,
    marginBottom: 8,
  },
  menuModalImageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  menuModalImageBtn: {
    flex: 1,
    backgroundColor: T.colors.surfaceContainerHigh,
    borderRadius: T.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  menuModalImageBtnText: {
    ...T.font.labelMd,
    color: T.colors.onSurface,
  },

  /* Empty State */
  noCarrito: {
    ...T.font.headlineSm,
    color: T.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  noCarritoSub: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: T.spacing.stackMd,
  },

  /* Logout */
  logoutBtn: {
    borderWidth: 1,
    borderColor: T.colors.error,
    borderRadius: T.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    ...T.font.labelMd,
    color: T.colors.error,
    fontSize: 15,
  },

  /* Carrito Selector */
  sectionTitle: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    marginBottom: 4,
  },
  carritoCard: {
    backgroundColor: T.colors.surfaceContainerLowest,
    borderRadius: T.radius.lg,
    padding: T.spacing.insetCard,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...T.shadow.card,
  },
  carritoCardInfo: {
    flex: 1,
  },
  carritoCardName: {
    ...T.font.headlineSm,
    color: T.colors.onSurface,
    marginBottom: 4,
  },
  carritoCardTags: {
    flexDirection: 'row',
    gap: 8,
  },
  carritoCardStatus: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: T.radius.full,
  },
  carritoCardStatusOpen: {
    backgroundColor: T.colors.tertiary,
  },
  carritoCardStatusClosed: {
    backgroundColor: T.colors.secondaryContainer,
  },
  carritoCardStatusText: {
    ...T.font.labelSm,
    fontWeight: '600',
  },
  carritoCardStatusTextOpen: {
    color: T.colors.onTertiary,
  },
  carritoCardStatusTextClosed: {
    color: T.colors.onSecondaryContainer,
  },
  carritoCardAction: {
    ...T.font.labelMd,
    color: T.colors.primary,
    marginLeft: 12,
  },

  /* Back button */
  backBtn: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  backBtnText: {
    ...T.font.bodyMd,
    color: T.colors.primary,
  },
})
