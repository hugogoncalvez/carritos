import { View, Text, StyleSheet } from 'react-native'

export default function MapView({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mapa disponible solo en dispositivos móviles</Text>
    </View>
  )
}

export function Marker() {
  return null
}

export function Callout({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 32,
  },
})
