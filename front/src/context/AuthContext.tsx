import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      },
    )

    return () => listener?.subscription.unsubscribe()
  }, [])

  const signIn = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return error?.message ?? null
  }

  const signUp = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        signIn,
        signUp,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
