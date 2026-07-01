import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { CartItem, CartGroup } from '../types'

const STORAGE_KEY = '@carritos_cart'

type CartContextType = {
  items: CartItem[]
  loading: boolean
  totalItems: number
  groups: CartGroup[]
  addItem: (params: {
    menuId: string
    carritoId: string
    vendorName: string
    vendorWhatsapp: string | null
    nombre: string
    precio: number
  }) => void
  updateQuantity: (id: string, delta: number) => void
  removeItem: (id: string) => void
  clearVendorCart: (carritoId: string) => void
  clearAll: () => void
}

const CartContext = createContext<CartContextType>({
  items: [],
  loading: true,
  totalItems: 0,
  groups: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearVendorCart: () => {},
  clearAll: () => {},
})

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function groupByVendor(items: CartItem[]): CartGroup[] {
  const map = new Map<string, CartGroup>()
  for (const item of items) {
    const existing = map.get(item.carritoId)
    if (existing) {
      existing.items.push(item)
      existing.subtotal += item.precio * item.cantidad
    } else {
      map.set(item.carritoId, {
        carritoId: item.carritoId,
        vendorName: item.vendorName,
        vendorWhatsapp: item.vendorWhatsapp,
        items: [item],
        subtotal: item.precio * item.cantidad,
      })
    }
  }
  return Array.from(map.values())
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (raw) {
          setItems(JSON.parse(raw))
        }
      } catch {
        // Ignore
      }
      setLoading(false)
    })()
  }, [])

  const persist = useCallback(async (next: CartItem[]) => {
    setItems(next)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore
    }
  }, [])

  const addItem = useCallback(
    (params: {
      menuId: string
      carritoId: string
      vendorName: string
      vendorWhatsapp: string | null
      nombre: string
      precio: number
    }) => {
      const existing = items.find(
        (i) => i.menuId === params.menuId && i.carritoId === params.carritoId,
      )
      if (existing) {
        const next = items.map((i) =>
          i.id === existing.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        )
        persist(next)
      } else {
        const newItem: CartItem = {
          id: generateId(),
          menuId: params.menuId,
          carritoId: params.carritoId,
          vendorName: params.vendorName,
          vendorWhatsapp: params.vendorWhatsapp,
          nombre: params.nombre,
          precio: params.precio,
          cantidad: 1,
        }
        persist([...items, newItem])
      }
    },
    [items, persist],
  )

  const updateQuantity = useCallback(
    (id: string, delta: number) => {
      const next = items
        .map((i) =>
          i.id === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i,
        )
        .filter((i) => i.cantidad > 0)
      persist(next)
    },
    [items, persist],
  )

  const removeItem = useCallback(
    (id: string) => {
      persist(items.filter((i) => i.id !== id))
    },
    [items, persist],
  )

  const clearVendorCart = useCallback(
    (carritoId: string) => {
      persist(items.filter((i) => i.carritoId !== carritoId))
    },
    [items, persist],
  )

  const clearAll = useCallback(() => {
    persist([])
  }, [persist])

  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0)
  const groups = groupByVendor(items)

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        totalItems,
        groups,
        addItem,
        updateQuantity,
        removeItem,
        clearVendorCart,
        clearAll,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
