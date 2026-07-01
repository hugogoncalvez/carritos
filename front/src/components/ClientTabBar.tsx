import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { T } from '../theme'
import { useCart } from '../context/CartContext'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Explorar: { active: 'map', inactive: 'map' },
  Pedidos: { active: 'chat', inactive: 'chat-bubble-outline' },
}

export default function ClientTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { totalItems } = useCart()
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
            <View style={[styles.pill, isActive && styles.pillActive]}>
              <View style={styles.iconWrapper}>
                <MaterialIcons
                  name={iconName as any}
                  size={22}
                  color={isActive ? T.colors.onPrimaryContainer : T.colors.inverseOnSurface}
                />
                {route.name === 'Pedidos' && totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalItems > 99 ? '99+' : totalItems}
                    </Text>
                  </View>
                )}
              </View>
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
    backgroundColor: T.colors.inverseSurface,
    paddingTop: 8,
    height: 72,
    ...T.shadow.nav,
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
  },
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
    backgroundColor: T.colors.primaryContainer,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: T.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: T.colors.onError,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'WorkSans-SemiBold',
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
    fontFamily: 'WorkSans-Medium',
  },
  labelActive: {
    color: T.colors.onPrimaryContainer,
    fontWeight: '600',
  },
  labelInactive: {
    color: T.colors.inverseOnSurface,
  },
})
