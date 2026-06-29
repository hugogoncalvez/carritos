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
import LoginScreen from './src/screens/LoginScreen'
import AdminScreen from './src/screens/AdminScreen'
import FavoritosScreen from './src/screens/FavoritosScreen'
import PedidosScreen from './src/screens/PedidosScreen'
import StitchTabBar from './src/components/StitchTabBar'
import type { RootStackParamList, TabParamList } from './src/types'
import { T, CUSTOM_FONTS } from './src/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <StitchTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Explorar" component={HomeScreen} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} />
      <Tab.Screen name="Pedidos" component={PedidosScreen} />
      <Tab.Screen name="Perfil" component={LoginScreen} />
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
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="Menu"
              component={MenuScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Admin"
              component={AdminScreen}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: T.colors.surface },
                headerTintColor: T.colors.onSurface,
                headerTitleStyle: {
                  fontFamily: T.font.headlineSm.fontFamily,
                  fontSize: 18,
                  color: T.colors.primary,
                },
                headerShadowVisible: false,
                title: 'Acceso dueños',
              }}
            />
          </Stack.Navigator>
          <StatusBar style="dark" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
