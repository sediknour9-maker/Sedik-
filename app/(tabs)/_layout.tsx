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
        options={{ title: t('common.today'), tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="training"
        options={{ title: t('training.title'), tabBarIcon: () => <TabIcon emoji="🏋️" /> }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ title: t('nutrition.title'), tabBarIcon: () => <TabIcon emoji="🍽️" /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: t('progress.title'), tabBarIcon: () => <TabIcon emoji="📈" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('profile.title'), tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
    </Tabs>
  );
}
