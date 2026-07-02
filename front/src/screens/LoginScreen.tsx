import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../theme'

export default function LoginScreen() {
  const { T, isDark, toggleTheme } = useTheme()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: T.spacing.marginMain,
      backgroundColor: T.colors.background,
    },
    brandingBlock: {
      alignItems: 'center',
      marginBottom: 40,
    },
    emoji: {
      fontSize: 52,
      marginBottom: 12,
    },
    title: {
      ...T.font.headlineLg,
      color: T.colors.primary,
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      ...T.font.bodyMd,
      color: T.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    formBlock: {
      backgroundColor: T.colors.surfaceContainerLowest,
      borderRadius: T.radius.lg,
      padding: T.spacing.insetCard,
      ...T.shadow.card,
    },
    input: {
      borderWidth: 1,
      borderColor: T.colors.outlineVariant,
      borderRadius: T.radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      fontFamily: T.font.bodyMd.fontFamily,
      color: T.colors.onSurface,
      backgroundColor: T.colors.surface,
      marginBottom: 12,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: T.colors.outlineVariant,
      borderRadius: T.radius.md,
      backgroundColor: T.colors.surface,
      marginBottom: 12,
      height: 48,
    },
    passwordInput: {
      flex: 1,
      height: 48,
      paddingHorizontal: 16,
      fontSize: 15,
      fontFamily: T.font.bodyMd.fontFamily,
      color: T.colors.onSurface,
    },
    eyeBtn: {
      width: 44,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    button: {
      backgroundColor: T.colors.primaryContainer,
      borderRadius: T.radius.lg,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
      marginBottom: 16,
      ...T.shadow.card,
    },
    buttonText: {
      ...T.font.headlineSm,
      color: T.colors.onPrimaryContainer,
    },
    disclaimer: {
      ...T.font.bodyMd,
      textAlign: 'center',
      color: T.colors.onSurfaceVariant,
    },
  }), [T])

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Completa todos los campos')
      return
    }
    setLoading(true)
    const error = await signIn(email.trim(), password)
    if (error) {
      Alert.alert('Error', error)
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          position: 'absolute',
          top: 60,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: T.colors.surfaceContainerLowest,
          justifyContent: 'center',
          alignItems: 'center',
          ...T.shadow.card,
          zIndex: 10,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 22 }}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
      <View style={styles.brandingBlock}>
        <Text style={styles.emoji}>🛒</Text>
        <Text style={styles.title}>Carritos Al Toque</Text>
        <Text style={styles.subtitle}>Panel de dueños</Text>
      </View>

      <View style={styles.formBlock}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={T.colors.onSurfaceVariant + '80'}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Contraseña"
            placeholderTextColor={T.colors.onSurfaceVariant + '80'}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={22}
              color={T.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={T.colors.onPrimaryContainer} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          ¿Querés sumar tu carrito? Contactanos para asociarte.
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}
