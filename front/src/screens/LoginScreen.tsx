import { useState, useEffect } from 'react'
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
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../types'
import { T } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>

export default function LoginScreen() {
  const navigation = useNavigation<Nav>()
  const { signIn, signUp, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    if (user) {
      navigation.replace('Admin')
    }
  }, [user, navigation])

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Completa todos los campos')
      return
    }
    setLoading(true)
    const error = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password)

    if (error) {
      Alert.alert('Error', error)
    } else if (isSignUp) {
      Alert.alert(
        'Registro exitoso',
        'Revisa tu correo para confirmar la cuenta.',
      )
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Branding */}
      <View style={styles.brandingBlock}>
        <Text style={styles.emoji}>🛒</Text>
        <Text style={styles.title}>Carritos Al Toque</Text>
        <Text style={styles.subtitle}>Panel de dueños</Text>
      </View>

      {/* Form */}
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

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={T.colors.onSurfaceVariant + '80'}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={T.colors.onPrimaryContainer} />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Registrarse' : 'Entrar'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} activeOpacity={0.7}>
          <Text style={styles.switchText}>
            {isSignUp
              ? '¿Ya tenés cuenta? Iniciá sesión'
              : '¿No tenés cuenta? Registrate'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
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
  switchText: {
    ...T.font.bodyMd,
    textAlign: 'center',
    color: T.colors.primary,
  },
})
