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
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
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
      setLoading(false)
    })()
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
