import { useFonts } from 'expo-font'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import HomeScreen from './src/screens/HomeScreen'
import PedidosScreen from './src/screens/PedidosScreen'
import MenuScreen from './src/screens/MenuScreen'
import LoginScreen from './src/screens/LoginScreen'
import AdminScreen from './src/screens/AdminScreen'
import ClientTabBar from './src/components/ClientTabBar'
import type { RootStackParamList, ClientTabParamList, AdminTabParamList } from './src/types'
import { T, CUSTOM_FONTS } from './src/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()
const ClientTab = createBottomTabNavigator<ClientTabParamList>()
const AdminTab = createBottomTabNavigator<AdminTabParamList>()

function ClientTabs() {
  return (
    <ClientTab.Navigator
      tabBar={(props) => <ClientTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <ClientTab.Screen name="Explorar" component={HomeScreen} />
      <ClientTab.Screen name="Pedidos" component={PedidosScreen} />
    </ClientTab.Navigator>
  )
}

function AdminTabs() {
  return (
    <AdminTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <AdminTab.Screen name="AdminHome" component={AdminScreen} />
    </AdminTab.Navigator>
  )
}

function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.colors.background }}>
        <ActivityIndicator size="large" color={T.colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        ) : (
          <>
            <Stack.Screen name="ClientTabs" component={ClientTabs} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
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
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
