import { View, Text, StyleSheet } from 'react-native'
import { T } from '../theme'

export default function FavoritosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>❤️</Text>
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.subtitle}>Próximamente vas a poder guardar tus carritos favoritos acá.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.colors.background,
    paddingHorizontal: 32,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: {
    ...T.font.headlineMd,
    color: T.colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    ...T.font.bodyMd,
    color: T.colors.onSurfaceVariant,
    textAlign: 'center',
  },
})
