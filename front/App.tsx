import { useFonts } from 'expo-font'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AuthProvider } from './src/context/AuthContext'
import HomeScreen from './src/screens/HomeScreen'
import MenuScreen from './src/screens/MenuScreen'
import FavoritosScreen from './src/screens/FavoritosScreen'
import PedidosScreen from './src/screens/PedidosScreen'
import PerfilScreen from './src/screens/PerfilScreen'
import StitchTabBar from './src/components/StitchTabBar'
import type { RootStackParamList, TabParamList } from './src/types'
import { T, CUSTOM_FONTS } from './src/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

/**
 * MainTabs: Las 4 pestañas principales de la app.
 * "Perfil" usa PerfilScreen que decide internamente si mostrar Login o Admin,
 * manteniendo siempre el tab bar visible (fiel al diseño Stitch).
 */
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <StitchTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Explorar" component={HomeScreen} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} />
      <Tab.Screen name="Pedidos" component={PedidosScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts(CUSTOM_FONTS)

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.colors.background }}>
        <ActivityIndicator size="large" color={T.colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* MainTabs es el punto de entrada. Todas las pantallas de usuario
                y el panel de admin viven dentro de las tabs. */}
            <Stack.Screen name="MainTabs" component={MainTabs} />
            {/* Menu es la única pantalla que justifica salir del tab context
                ya que es una vista de detalle full-screen */}
            <Stack.Screen
              name="Menu"
              component={MenuScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
          <StatusBar style="dark" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
