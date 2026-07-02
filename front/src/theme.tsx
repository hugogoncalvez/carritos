import { createContext, useContext, useMemo, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from '@expo-google-fonts/work-sans'

export const CUSTOM_FONTS = {
  'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
  'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
  'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  'WorkSans-Regular': WorkSans_400Regular,
  'WorkSans-Medium': WorkSans_500Medium,
  'WorkSans-SemiBold': WorkSans_600SemiBold,
}

const HEADING = 'PlusJakartaSans-Bold'
const HEADING_SM = 'PlusJakartaSans-SemiBold'
const BODY = 'WorkSans-Regular'
const BODY_MEDIUM = 'WorkSans-Medium'
const BODY_SEMI = 'WorkSans-SemiBold'

const FONT = {
  headlineLg: { fontFamily: HEADING, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  headlineMd: { fontFamily: HEADING, fontSize: 22, lineHeight: 28 },
  headlineSm: { fontFamily: HEADING_SM, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: BODY, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: BODY, fontSize: 14, lineHeight: 20 },
  labelMd: { fontFamily: BODY_SEMI, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSm: { fontFamily: BODY_MEDIUM, fontSize: 10, lineHeight: 14 },
}

const RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
}

const SPACING = {
  marginMain: 16,
  gutter: 12,
  stackSm: 4,
  stackMd: 8,
  stackLg: 20,
  insetCard: 16,
}

const SHADOW = {
  card: {
    shadowColor: '#1c1b1b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
}

const SHADOW_DARK = {
  card: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sheet: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },
  nav: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
}

const COLORS_LIGHT = {
  primary: '#7e5700',
  onPrimary: '#ffffff',
  primaryContainer: '#ffb300',
  onPrimaryContainer: '#6b4900',
  inversePrimary: '#ffba38',

  secondary: '#5f5e5e',
  onSecondary: '#ffffff',
  secondaryContainer: '#e2dfde',
  onSecondaryContainer: '#636262',

  tertiary: '#1b6d24',
  onTertiary: '#ffffff',
  tertiaryContainer: '#83d47e',
  onTertiaryContainer: '#005c15',

  error: '#ba1a1a',
  onError: '#ffffff',

  surface: '#f8f9fa',
  onSurface: '#191c1d',
  onSurfaceVariant: '#514532',
  surfaceDim: '#d9dadb',
  surfaceBright: '#f8f9fa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f3f4f5',
  surfaceContainer: '#edeeef',
  surfaceContainerHigh: '#e7e8e9',
  surfaceContainerHighest: '#e1e3e4',
  surfaceVariant: '#e1e3e4',

  background: '#f8f9fa',
  onBackground: '#191c1d',

  inverseSurface: '#2e3132',
  inverseOnSurface: '#f0f1f2',

  outline: '#847560',
  outlineVariant: '#d6c4ac',
}

const COLORS_DARK = {
  primary: '#ffffff',
  onPrimary: '#2d3400',
  primaryContainer: '#d4f000',
  onPrimaryContainer: '#5e6b00',
  inversePrimary: '#586400',

  secondary: '#c8c6c5',
  onSecondary: '#313030',
  secondaryContainer: '#4a4949',
  onSecondaryContainer: '#bab8b7',

  tertiary: '#ffffff',
  onTertiary: '#313030',
  tertiaryContainer: '#e5e2e1',
  onTertiaryContainer: '#656464',

  error: '#ffb4ab',
  onError: '#690005',

  surface: '#121414',
  onSurface: '#e2e2e2',
  onSurfaceVariant: '#c6c9ab',
  surfaceDim: '#121414',
  surfaceBright: '#37393a',
  surfaceContainerLowest: '#0c0f0f',
  surfaceContainerLow: '#1a1c1c',
  surfaceContainer: '#1e2020',
  surfaceContainerHigh: '#282a2b',
  surfaceContainerHighest: '#333535',
  surfaceVariant: '#333535',

  background: '#121414',
  onBackground: '#e2e2e2',

  inverseSurface: '#e2e2e2',
  inverseOnSurface: '#2f3131',

  outline: '#909378',
  outlineVariant: '#464932',
}

function buildTheme(colors: typeof COLORS_LIGHT, dark: boolean) {
  return {
    colors,
    font: FONT,
    radius: RADIUS,
    spacing: SPACING,
    shadow: dark ? SHADOW_DARK : SHADOW,
  }
}

export const T_LIGHT = buildTheme(COLORS_LIGHT, false)
export const T_DARK = buildTheme(COLORS_DARK, true)

const STORAGE_KEY = '@carritos_theme'

type ThemeContextType = {
  T: typeof T_LIGHT
  isDark: boolean
  toggleTheme: () => void
  setDark: (v: boolean) => void
}

const ThemeContext = createContext<ThemeContextType>({
  T: T_LIGHT,
  isDark: false,
  toggleTheme: () => {},
  setDark: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useColorScheme() === 'dark'
  const [manualDark, setManualDark] = useState<boolean | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v !== null) setManualDark(v === 'dark')
    })
  }, [])

  const isDark = manualDark !== null ? manualDark : systemDark
  const T = isDark ? T_DARK : T_LIGHT

  const toggleTheme = () => {
    const next = !isDark
    setManualDark(next)
    AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
  }

  const setDark = (v: boolean) => {
    setManualDark(v)
    AsyncStorage.setItem(STORAGE_KEY, v ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ T, isDark, toggleTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export const T = T_LIGHT
