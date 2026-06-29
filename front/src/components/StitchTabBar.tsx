import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { T } from '../theme'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

// Mapping from tab name to MaterialIcons icon name
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Explorar: { active: 'map', inactive: 'map' },
  Favoritos: { active: 'favorite', inactive: 'favorite-border' },
  Pedidos: { active: 'chat', inactive: 'chat-bubble-outline' },
  Perfil: { active: 'person', inactive: 'person-outline' },
}

// Color tokens from the Stitch design spec
const COLOR_BAR_BG = T.colors.inverseSurface        // #2e3132 — dark charcoal bar
const COLOR_ACTIVE_BG = T.colors.primaryContainer   // #ffb300 — amber pill
const COLOR_ACTIVE_FG = T.colors.onPrimaryContainer // #6b4900 — dark text on amber
const COLOR_INACTIVE_FG = T.colors.inverseOnSurface // #f0f1f2 — light grey on dark bar

export default function StitchTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const currentRoute = state.routes[state.index].name

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route) => {
        const isActive = currentRoute === route.name
        const icons = TAB_ICONS[route.name] ?? { active: 'circle', inactive: 'radio-button-unchecked' }
        const iconName = isActive ? icons.active : icons.inactive

        const onPress = () => {
          if (currentRoute !== route.name) {
            navigation.navigate(route.name)
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabWrapper}
            onPress={onPress}
            activeOpacity={0.8}
          >
            {/* The active pill container with rounded-xl shape */}
            <View style={[styles.pill, isActive && styles.pillActive]}>
              <MaterialIcons
                name={iconName as any}
                size={22}
                color={isActive ? COLOR_ACTIVE_FG : COLOR_INACTIVE_FG}
              />
              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                {route.name}
              </Text>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLOR_BAR_BG,
    // Height spec: 72px total. With dynamic paddingBottom, we use paddingTop to fill.
    paddingTop: 8,
    ...T.shadow.nav,
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  // The pill that wraps the active tab (border-radius: 12px = rounded-xl)
  pill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 64,
  },
  pillActive: {
    backgroundColor: COLOR_ACTIVE_BG,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
    fontFamily: 'WorkSans-Medium',
  },
  labelActive: {
    color: COLOR_ACTIVE_FG,
    fontWeight: '600',
  },
  labelInactive: {
    color: COLOR_INACTIVE_FG,
  },
})
