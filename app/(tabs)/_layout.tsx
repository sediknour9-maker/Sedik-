import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors } from '../../src/theme/colors';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('dashboard.title'), tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="browse"
        options={{ title: t('browse.title'), tabBarIcon: () => <TabIcon emoji="🍽️" /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t('history.title'), tabBarIcon: () => <TabIcon emoji="📅" /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('settings.title'), tabBarIcon: () => <TabIcon emoji="⚙️" /> }}
      />
    </Tabs>
  );
}
