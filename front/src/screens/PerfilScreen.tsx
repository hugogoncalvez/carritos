import { useAuth } from '../context/AuthContext'
import AdminScreen from './AdminScreen'
import LoginScreen from './LoginScreen'

/**
 * PerfilScreen actúa como puerta de entrada para el tab "Perfil".
 *
 * - Si el dueño está autenticado → muestra el AdminScreen directamente,
 *   manteniendo la barra de navegación visible (fiel al diseño Stitch donde
 *   el panel de administración ES la pestaña Perfil con el nav bar activo).
 *
 * - Si no está autenticado → muestra el formulario de login.
 *
 * Esto elimina la duplicación de tener LoginScreen tanto en el Tab navigator
 * como en el Stack navigator, y evita que el admin panel "rompa" el contexto
 * de tabs navegando fuera de ellos via Stack.
 */
export default function PerfilScreen() {
  const { user } = useAuth()

  if (user) {
    return <AdminScreen />
  }

  return <LoginScreen />
}
