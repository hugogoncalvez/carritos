import { Map, Camera, Marker, UserLocation, Callout, LogManager } from '@maplibre/maplibre-react-native'

// Suppress harmless 'Invalid geometry' warning messages from the Mbgl native engine
LogManager.onLog((event) => {
  if (event.message.includes('Invalid geometry in line layer')) {
    return true; // Suppress this log message
  }
  return false; // Fallback to default logging behavior
})

const styleURL = process.env.EXPO_PUBLIC_MAPLIBRE_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty'

export { styleURL, Camera, Marker, UserLocation, Callout }
export default Map
