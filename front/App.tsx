import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider } from './src/context/AuthContext'
import HomeScreen from './src/screens/HomeScreen'
import MenuScreen from './src/screens/MenuScreen'
import LoginScreen from './src/screens/LoginScreen'
import AdminScreen from './src/screens/AdminScreen'
import type { RootStackParamList } from './src/types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#D32F2F' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Carritos Al Toque' }}
          />
          <Stack.Screen
            name="Menu"
            component={MenuScreen}
            options={({ route }) => ({ title: route.params.nombre })}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Acceso dueños' }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{ title: 'Mi Carrito' }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  )
}
