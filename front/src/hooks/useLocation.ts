import { useState, useEffect } from 'react'
import * as Location from 'expo-location'

export function useLocation() {
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null

    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado')
        setLoading(false)
        return
      }

      // Probar obtener la última ubicación conocida para mostrar algo rápido
      try {
        const lastLoc = await Location.getLastKnownPositionAsync()
        if (lastLoc) {
          setLocation({
            latitude: lastLoc.coords.latitude,
            longitude: lastLoc.coords.longitude,
          })
          setLoading(false)
        }
      } catch {
        // Ignorar si no hay ubicación anterior conocida
      }

      // Empezar a vigilar la ubicación en tiempo real
      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (loc) => {
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            })
            setLoading(false)
          }
        )
      } catch (err) {
        setErrorMsg('Error al vigilar ubicación')
        setLoading(false)
      }
    })()

    return () => {
      if (subscription) {
        subscription.remove()
      }
    }
  }, [])

  const refreshLocation = async () => {
    setLoading(true)
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado')
        setLoading(false)
        return
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })
    } catch {
      setErrorMsg('Error al obtener ubicación')
    }
    setLoading(false)
  }

  return { location, errorMsg, loading, refreshLocation }
}
