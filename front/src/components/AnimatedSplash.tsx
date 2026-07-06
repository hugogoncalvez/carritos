import { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Image } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { useTheme } from '../theme'

interface Props {
  onAnimationEnd: () => void
}

export default function AnimatedSplash({ onAnimationEnd }: Props) {
  const { T } = useTheme()
  const scale = useRef(new Animated.Value(0.5)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    SplashScreen.hideAsync()
    Animated.sequence([
      // Fase 1: Aparece y crece un poco
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.1,
          tension: 20,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      // Fase 2: Vuelve a su tamaño normal suavemente
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fase 3: Pausa para que se vea bien el logo
      Animated.delay(700),
      // Fase 4: Hace zoom gigante y desaparece para revelar la app
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 20,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    const timer = setTimeout(onAnimationEnd, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image source={require('../../assets/icon.png')} style={styles.icon} resizeMode="contain" />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e3132',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 220,
    height: 220,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
})
