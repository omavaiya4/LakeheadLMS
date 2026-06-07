// components/BottomNav.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

type Tab = 'dashboard' | 'courses' | 'grades' | 'search' | 'profile';

const TABS: { id: Tab; label: string; icon: string; activeIcon: string }[] = [
  { id: 'dashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { id: 'courses', label: 'Courses', icon: 'book-outline', activeIcon: 'book' },
  { id: 'grades', label: 'Grades', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  { id: 'search', label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomNav({ active }: { active: Tab }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => router.push(`/tabs/${tab.id}`)}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={(isActive ? tab.activeIcon : tab.icon) as any}
                size={22}
                color={isActive ? Colors.primary : Colors.tabBarInactive}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  iconWrap: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  iconWrapActive: { backgroundColor: Colors.primary + '15' },
  label: { fontSize: 10, color: Colors.tabBarInactive, fontWeight: '500' },
  labelActive: { color: Colors.primary, fontWeight: '700' },
});
