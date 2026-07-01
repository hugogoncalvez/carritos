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

export const T = {
  colors: {
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
  },

  font: {
    headlineLg: { fontFamily: HEADING, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
    headlineMd: { fontFamily: HEADING, fontSize: 22, lineHeight: 28 },
    headlineSm: { fontFamily: HEADING_SM, fontSize: 18, lineHeight: 24 },
    bodyLg: { fontFamily: BODY, fontSize: 16, lineHeight: 24 },
    bodyMd: { fontFamily: BODY, fontSize: 14, lineHeight: 20 },
    labelMd: { fontFamily: BODY_SEMI, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
    labelSm: { fontFamily: BODY_MEDIUM, fontSize: 10, lineHeight: 14 },
  },

  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  spacing: {
    marginMain: 16,
    gutter: 12,
    stackSm: 4,
    stackMd: 8,
    stackLg: 20,
    insetCard: 16,
  },

  shadow: {
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
  },
} as const
