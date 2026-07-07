import { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Image, Easing } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'

interface Props {
  onAnimationEnd: () => void
}

export default function AnimatedSplash({ onAnimationEnd }: Props) {
  const scale = useRef(new Animated.Value(1)).current
  const glowOpacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    SplashScreen.hideAsync()

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.06,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.7,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    )

    pulse.start()

    const timer = setTimeout(() => {
      pulse.stop()
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.3,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(onAnimationEnd)
    }, 2500)

    return () => {
      pulse.stop()
      clearTimeout(timer)
    }
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity },
        ]}
      />
      <Animated.View
        style={[
          styles.iconWrapper,
          { transform: [{ scale }] },
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
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#4a9eff',
  },
  iconWrapper: {
    width: 120,
    height: 120,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
})
