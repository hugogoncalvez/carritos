import { Map, Camera, Marker, UserLocation, Callout } from '@maplibre/maplibre-react-native'

const styleURL = process.env.EXPO_PUBLIC_MAPLIBRE_STYLE_URL || 'https://demotiles.maplibre.org/style.json'

export { styleURL, Camera, Marker, UserLocation, Callout }
export default Map
