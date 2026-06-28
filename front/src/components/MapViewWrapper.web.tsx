import { View, Text, StyleSheet } from 'react-native'

export const styleURL = ''

export default function MapView({ style, styleURL: _url, logoEnabled: _logo, attributionEnabled: _attr, children }: any) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Mapa disponible solo en dispositivos móviles</Text>
      {children}
    </View>
  )
}

export function Camera(_props: any) { return null }
export function Marker(_props: any) { return null }
export function UserLocation(_props: any) { return null }
export function Callout(_props: any) { return null }

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' },
  text: { fontSize: 16, color: '#666', textAlign: 'center', padding: 32 },
})
